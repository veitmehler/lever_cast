import { prisma, brandSettingsForUser } from '@omniply/shared'
import { loadSocialBrandTheme } from '../brand-theme'
import { getLLMAdapter } from '../../article-pipeline/llm/factory'
import { loadPromptTemplate } from '../../article-pipeline/enrichment/prompt-template'
import { loadPlainLanguageConfig } from '../../article-pipeline/enrichment/plain-language'
import { sanitizeDashesText } from '../../lib/text/dash-sanitizer'
import { recordLLMUsage } from '../../lib/llm-usage'
import { logger } from '../../lib/logger'
import type { AutomationLogContext } from '../automation/log-context'
import type { ArticleContentContext } from '../automation/content'

/**
 * Story-arc generator (engagement v2 — .plans/story-arc-posts plan).
 *
 * ONE LLM call produces ALL beats of an article's story arc: generating
 * siblings together makes continuity and mutual distinctness structural
 * (the same principle as batched captions). Each beat is a first-person
 * story post in the account NARRATOR's voice plus its Instagram slide
 * breakdown (hook line alone, cliffhanger-cut middle beats, open-loop
 * close).
 *
 * Compliance frame ("superficial arcs", user-locked 2026-09-03): the
 * narrator observes industry patterns and their own professional journey.
 * Composite, explicitly generic scenes are allowed. NEVER identifiable
 * patients, never invented patient events presented as real, never
 * outcome promises.
 */

export interface StoryBeat {
  /** LinkedIn-ready post text (also the FB text and the IG caption). */
  postText: string
  /** IG carousel: slide 1 = hook line alone; middle 20–35 words each. */
  slides: string[]
}

const SYSTEM_PROMPT =
  'You are a ghostwriter for a business owner, writing serialized first-person LinkedIn story posts. ' +
  'The voice must read like a real person: short lines, concrete scenes, an admission of doubt before any insight, ' +
  'no hype, no hashtags, no emoji. Never use em-dashes; use commas, colons, or separate sentences. ' +
  'TRUTH RULE (the most important rule): events that happened TO THE NARRATOR may come ONLY from the ' +
  'provided narrator moments, retold faithfully. You may NEVER invent a personal experience, test, audit, ' +
  'count, conversation, or discovery, even a plausible one. Article material must be narrated as ' +
  'OBSERVATION about the industry or practices ("I keep seeing...", "Picture a practice owner who...", ' +
  '"you open the guidance and realize..."), never as something the narrator personally did or found. ' +
  'A post with zero personal scenes is fine; a post with a fabricated one is a failure. ' +
  'COMPLIANCE (hard rules): never mention or invent identifiable patients or specific patient events; ' +
  'composite scenes must be explicitly generic ("every practice has a Tuesday like this"); ' +
  'never promise business or health outcomes; numbers come only from the article material provided. ' +
  'Output ONLY a JSON array, no code fences, no commentary.'

function buildUserPrompt(opts: {
  beatCount: number
  narratorName: string
  narratorBeats: string
  writingStyle: string
  restrictions: string
  articleTitle: string
  articleMaterial: string
  articleUrl: string
  ctaLine: string
  priorPosts: string[]
}): string {
  const prior = opts.priorPosts.length
    ? opts.priorPosts.map((p, i) => `--- Prior post ${i + 1} (most recent first) ---\n${p}`).join('\n\n')
    : '(none yet)'
  return `Write a ${opts.beatCount}-post story arc based on this article. The posts publish in order (morning/evening slots on consecutive posting days) and together tell ONE story with rising tension.

NARRATOR: ${opts.narratorName}, the practice/business owner, first person.
REAL narrator moments you may draw on (never invent new biographical facts beyond these and the article):
${opts.narratorBeats || '(none provided: stay with industry observations and the article material only)'}

WRITING VOICE:
${opts.writingStyle || 'Plainspoken, concrete, operator-to-operator.'}

ADVERTISING RESTRICTIONS (hard rules; may be empty):
${opts.restrictions}

ARTICLE TITLE: ${opts.articleTitle}
ARTICLE MATERIAL (the arc's substance; numbers may ONLY come from here):
${opts.articleMaterial}

RECENTLY PUBLISHED STORY POSTS (for callbacks and to avoid repeating scenes):
${prior}

ARC RULES:
- Beat 1 opens on a concrete scene or surprising observation, never a summary.
- The article's own scenes, metaphors, and story boxes are your PRIMARY narrative material: RETELL them in the narrator's voice (they are pre-approved composites). Prefer retelling an article scene over abstract observation.
- Beats 2 and onward OPEN with one short re-anchoring line that orients a first-time reader (half a sentence referencing where the story stands) before continuing.
- Every beat except the last ends mid-tension with an open loop to the next.
- The LAST beat resolves the arc and may include exactly one soft mention of the article${opts.articleUrl ? ` (link: ${opts.articleUrl})` : ''}.
- EVENING beats (beat 2${opts.beatCount >= 4 ? ' and beat 4' : ''}) end with exactly this call-to-action line as the final line: "${opts.ctaLine}"${opts.ctaLine ? '' : ' (no CTA line provided: end naturally)'}
- Beats never reuse a scene, opening, or anecdote from each other or from the prior posts above.
- Narrator moments are FACTS: never merge two different moments into one scene, and never attach a date or timeframe to a moment unless it appears in that moment's own text.
- NEVER invent events, experiments, tests, products, conversations, or timelines that are not explicitly described in a narrator moment or the article. If a moment lacks detail, stay abstract rather than inventing specifics.
- Every number in every post must appear VERBATIM in the article material or a narrator moment. No derived, estimated, or invented figures.
- 120 to 220 words per post. Short lines. Line breaks between thoughts.

For EACH beat also produce its Instagram slide breakdown:
- slides[0] = the hook line ALONE (one punchy sentence, max 12 words).
- middle slides = 40 to 60 words each (3 to 4 short sentences), each CUT at a moment of tension so the swipe is the payoff.
- last slide = the open loop (or, for the final beat, the resolution) plus a short follow cue; on EVENING beats it also carries the call-to-action line.
- 4 to 6 slides per beat.

Return ONLY a JSON array of ${opts.beatCount} objects: [{"postText": "...", "slides": ["...", ...]}, ...]`
}

function extractJsonArray(raw: string): unknown[] | null {
  const cleaned = raw.replace(/```(?:json)?/g, '').trim()
  const start = cleaned.indexOf('[')
  const end = cleaned.lastIndexOf(']')
  if (start === -1 || end <= start) return null
  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1))
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

/** Build the article material block from the run's content context. */
export function articleMaterialFromCtx(ctx: ArticleContentContext): string {
  // FULL article (user decision 2026-09-03): the plain-language layer bakes
  // composite scenes/metaphors/story boxes into the sections — feeding them
  // whole gives the writer truthful, pre-vetted narrative material instead
  // of a fact digest that forces invention or abstraction.
  const sections = ctx.h2Sections
    .slice(0, 10)
    .map((s) => `## ${s.heading}\n${s.text.slice(0, 2500)}`)
    .join('\n\n')
  return [ctx.introText?.slice(0, 2000), ctx.keyTakeawaysText?.slice(0, 1500), sections]
    .filter(Boolean)
    .join('\n\n')
    .slice(0, 24000)
}

export async function generateStoryArc(opts: {
  userId: string
  articleTitle: string
  articleMaterial: string
  articleUrl: string
  beatCount: number
  logCtx: AutomationLogContext
}): Promise<StoryBeat[]> {
  const { userId, beatCount, logCtx } = opts

  const [brand, theme, t] = await Promise.all([
    brandSettingsForUser(userId),
    loadSocialBrandTheme(userId),
    loadPromptTemplate(230, { userId }),
  ])

  let restrictions = ''
  try {
    const pl = await loadPlainLanguageConfig(theme.industry)
    if (pl) restrictions = pl.restrictions
  } catch {
    /* proceed without */
  }

  // Callback pool: the narrator's most recent published/scheduled story posts.
  const prior = await prisma.post.findMany({
    where: { userId, postType: 'story_text', platform: 'linkedin', status: { in: ['scheduled', 'published'] } },
    orderBy: { createdAt: 'desc' },
    take: 4,
    select: { content: true },
  })

  const userPrompt = buildUserPrompt({
    beatCount,
    narratorName: brand?.storyNarratorName ?? brand?.defaultAuthorName ?? 'the owner',
    narratorBeats: brand?.storyBeats ?? '',
    writingStyle: theme.writingStyle || '',
    restrictions,
    articleTitle: opts.articleTitle,
    articleMaterial: opts.articleMaterial,
    articleUrl: opts.articleUrl,
    ctaLine: theme.socialCallToAction?.trim() || '',
    priorPosts: prior.map((p) => p.content),
  })

  const provider = (t?.defaultProvider ?? 'anthropic').toLowerCase()
  const model = t?.defaultModel ?? 'claude-sonnet-4-5-20250929'
  const adapter = getLLMAdapter(provider)
  const run = await adapter.call({
    systemPrompt: t?.systemPrompt ?? SYSTEM_PROMPT,
    userPrompt,
    model,
    temperature: 0.7,
    maxTokens: 2000 * beatCount,
  })
  await recordLLMUsage(userId, 'story_arc', run)

  let parsed = extractJsonArray(run.content)
  if (!parsed || parsed.length < beatCount) {
    // One retry — truncated/malformed JSON is the dominant failure mode.
    logger.warn({ ...logCtx }, '[story-arc] unparseable output — retrying once')
    const retry = await adapter.call({
      systemPrompt: t?.systemPrompt ?? SYSTEM_PROMPT,
      userPrompt,
      model,
      temperature: 0.6,
      maxTokens: 2000 * beatCount,
    })
    await recordLLMUsage(userId, 'story_arc', retry)
    parsed = extractJsonArray(retry.content)
  }
  if (!parsed || parsed.length < beatCount) {
    throw new Error(`Story arc: expected ${beatCount} beats, got ${parsed?.length ?? 'unparseable'}`)
  }

  const beats: StoryBeat[] = []
  for (const raw of parsed.slice(0, beatCount)) {
    const b = raw as { postText?: unknown; slides?: unknown }
    const postText = typeof b.postText === 'string' ? b.postText.trim() : ''
    const slides = Array.isArray(b.slides)
      ? b.slides.filter((s): s is string => typeof s === 'string' && s.trim().length > 0).map((s) => s.trim())
      : []
    if (!postText || slides.length < 3) throw new Error('Story arc: beat missing postText or slides')
    const stripDashes = (txt: string) => txt.replace(/\s*[—–]\s*/g, ', ')
    beats.push({
      postText: stripDashes((await sanitizeDashesText(postText, { ...logCtx, surface: 'story_post' })).trim()),
      slides: await Promise.all(
        slides.map(async (s) =>
          stripDashes((await sanitizeDashesText(s, { ...logCtx, surface: 'story_slide' })).trim()),
        ),
      ),
    })
  }

  logger.info({ ...logCtx, beats: beats.length }, '[story-arc] arc generated')
  return beats
}
