/**
 * Shared per-topic research for the newsletter pipeline (Phase 1b).
 *
 * `ensureTopicResearch(topicId)` computes the SHARED layer — video + recipe +
 * teaser source URLs/extracts — once per (calendar, topic) and writes it to
 * NewsletterTopic.research. It's idempotent (skips when researchStatus is already
 * 'complete') and fault-tolerant (each sub-researcher can fail to absent without
 * aborting the others; status is complete | partial | failed).
 *
 * The per-customer VOICED content (Phase 1c) reads this research and never
 * re-does it, so it's cheap across many customers on the same calendar.
 */
import type { NewsletterCalendar, NewsletterTopic } from '@prisma/client'
import { Prisma } from '@prisma/client'
import {
  prisma,
  downloadImageFromUrl,
  generateWithFalAI,
  uploadBufferWithKey,
} from '@socioply/shared'
import { getSystemApiKey } from '../lib/system-keys'
import { cleanTextOutput } from '../article-pipeline/output-cleaner'
import { logger } from '../lib/logger'
import { runNewsletterPrompt, runNewsletterWriterJson } from './llm'
import {
  isOxylabsConfigured,
  googleSearch,
  youtubeSearch,
  scrapeUrl,
  urlStatus,
} from './oxylabs'

const NL_IMAGE_MODEL = 'fal-ai/flux-pro'
const SOCIAL_DOMAINS = [
  'youtube.com',
  'youtu.be',
  'facebook.com',
  'instagram.com',
  'medium.com',
  'linkedin.com',
  'twitter.com',
  'x.com',
  'tiktok.com',
  'pinterest.com',
  'reddit.com',
  'snapchat.com',
  'whatsapp.com',
]

// ── Research result shape (stored as NewsletterTopic.research JSON) ────────────

export interface VideoResearch {
  url: string | null
  title: string | null
  thumbnailUrl: string | null
  s3Url: string | null
  manual: boolean // true when no video was found — a human supplies one later
}

export interface RecipeResearch {
  title: string | null
  intro: string
  ingredients: string
  instructions: string
  imageUrl: string | null
}

export interface TeaserSource {
  bullet: string
  url: string
  extract: string
}

export interface TopicResearch {
  video?: VideoResearch
  recipe?: RecipeResearch
  teaserSources?: TeaserSource[]
}

// ── Video ─────────────────────────────────────────────────────────────────────

interface OEmbed {
  title?: string
  thumbnail_url?: string
}

async function fetchYouTubeOEmbed(videoUrl: string): Promise<OEmbed | null> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 10_000)
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`,
      { signal: controller.signal },
    )
    clearTimeout(timer)
    if (!res.ok) return null
    return (await res.json()) as OEmbed
  } catch {
    return null
  }
}

async function thumbnailToS3(topicId: string, thumbnailUrl: string | null): Promise<string | null> {
  if (!thumbnailUrl) return null
  try {
    const buf = await downloadImageFromUrl(thumbnailUrl)
    const { url } = await uploadBufferWithKey(
      `newsletter/${topicId}/video-thumb.jpg`,
      buf,
      'image/jpeg',
    )
    return url
  } catch (err) {
    logger.warn({ topicId, err }, '[newsletter/research] thumbnail S3 upload failed (non-fatal)')
    return null
  }
}

export async function researchVideo(
  topic: NewsletterTopic,
  calendar: NewsletterCalendar,
): Promise<VideoResearch> {
  // Explicit override → use it directly; oEmbed only enriches title/thumbnail.
  if (topic.videoUrl) {
    const oe = await fetchYouTubeOEmbed(topic.videoUrl)
    const s3Url = await thumbnailToS3(topic.id, oe?.thumbnail_url ?? null)
    return {
      url: topic.videoUrl,
      title: oe?.title ?? null,
      thumbnailUrl: oe?.thumbnail_url ?? null,
      s3Url,
      manual: false,
    }
  }

  if (!(await isOxylabsConfigured())) {
    return { url: null, title: null, thumbnailUrl: null, s3Url: null, manual: true }
  }

  // Phase 1: AI-generated query. Phase 2: raw topic title.
  let hit = null
  try {
    const { content } = await runNewsletterPrompt('nl_youtube_query', {
      topic: topic.topic,
      industry: calendar.industry,
      specialization: calendar.specialization ?? '',
      who: calendar.specialization ?? '',
    })
    const query = cleanTextOutput(content)
    if (query) hit = await youtubeSearch(query)
  } catch (err) {
    logger.warn({ topicId: topic.id, err }, '[newsletter/research] youtube AI-query phase failed')
  }
  if (!hit) {
    try {
      hit = await youtubeSearch(topic.topic)
    } catch (err) {
      logger.warn({ topicId: topic.id, err }, '[newsletter/research] youtube raw-topic phase failed')
    }
  }

  if (!hit) {
    return { url: null, title: null, thumbnailUrl: null, s3Url: null, manual: true }
  }

  const s3Url = await thumbnailToS3(topic.id, hit.thumbnailUrl)
  return { url: hit.url, title: hit.title, thumbnailUrl: hit.thumbnailUrl, s3Url, manual: false }
}

// ── Recipe ──────────────────────────────────────────────────────────────────

function firstH2(html: string): string | null {
  const m = html.match(/<h2[^>]*>(.*?)<\/h2>/is)
  if (!m) return null
  return m[1].replace(/<[^>]+>/g, '').trim() || null
}

export async function researchRecipe(
  topic: NewsletterTopic,
  calendar: NewsletterCalendar,
  priorTitles: string[],
): Promise<RecipeResearch | null> {
  if (!topic.recipe) return null

  // 1. Grounded research.
  const { content: research } = await runNewsletterPrompt(
    'nl_recipe_researcher',
    { recipeHint: topic.recipe },
    { useSearch: true },
  )

  // 2. Write (two-key system/user split). Shared content → neutral voice.
  const { data } = await runNewsletterWriterJson<{
    recipe_intro?: string
    recipe_ingredients?: string
    recipe_instructions?: string
  }>('nl_recipe_writer_system', 'nl_recipe_writer_user', {
    recipeHint: topic.recipe,
    recipeResearch: research,
    previousRecipeTitles: priorTitles.join('\n'),
    industry: calendar.industry,
    specialization: calendar.specialization ?? '',
    who: calendar.specialization ?? '',
    writingStyle: '',
  })

  const intro = data.recipe_intro ?? ''
  const ingredients = data.recipe_ingredients ?? ''
  const instructions = data.recipe_instructions ?? ''

  // 3. Image (non-fatal).
  let imageUrl: string | null = null
  try {
    const { content: imgPrompt } = await runNewsletterPrompt('nl_recipe_image_prompt', {
      recipeContent: `${intro}\n${ingredients}`,
    })
    const falKey = await getSystemApiKey('fal-ai')
    if (falKey && imgPrompt.trim()) {
      const buf = await generateWithFalAI(falKey, cleanTextOutput(imgPrompt), NL_IMAGE_MODEL)
      const { url } = await uploadBufferWithKey(
        `newsletter/${topic.id}/recipe.jpg`,
        buf,
        'image/jpeg',
      )
      imageUrl = url
    }
  } catch (err) {
    logger.warn({ topicId: topic.id, err }, '[newsletter/research] recipe image failed (non-fatal)')
  }

  return { title: firstH2(intro), intro, ingredients, instructions, imageUrl }
}

// ── Teaser sources ────────────────────────────────────────────────────────────

function isUsableUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase()
    if (!host.endsWith('.com')) return false
    return !SOCIAL_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`))
  } catch {
    return false
  }
}

/** Pull readable text from h1/h2/h3/p/li into a normalized block (capped). */
export function extractReadable(html: string): string {
  if (!html) return ''
  const blocks: string[] = []
  const re = /<(h1|h2|h3|p|li)[^>]*>([\s\S]*?)<\/\1>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    const tag = m[1].toLowerCase()
    const text = m[2]
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    if (!text) continue
    if (tag === 'h1') blocks.push(`# Article Title: ${text}`)
    else if (tag === 'h2') blocks.push(`## ${text}`)
    else if (tag === 'h3') blocks.push(`### ${text}`)
    else if (tag === 'li') blocks.push(`- ${text}`)
    else blocks.push(text)
    if (blocks.join('\n').length > 8000) break
  }
  return blocks.join('\n').slice(0, 8000)
}

async function researchOneTeaser(
  bullet: string,
  calendar: NewsletterCalendar,
): Promise<TeaserSource | null> {
  let urls = await googleSearch(bullet)
  urls = urls.filter(isUsableUrl)
  if (urls.length === 0) return null

  // Validate via the proxy, require HTTP 200, collect up to 10 (cap attempts).
  const valid: string[] = []
  for (const u of urls.slice(0, 12)) {
    if (valid.length >= 10) break
    if ((await urlStatus(u)) === 200) valid.push(u)
  }
  if (valid.length === 0) return null

  // Pick the best URL (fallback to the first valid one).
  let chosen = valid[0]
  try {
    const { content } = await runNewsletterPrompt('nl_teaser_url_selector', {
      bulletPoint: bullet,
      urlCount: String(valid.length),
      urls: valid.join('\n'),
      who: calendar.specialization ?? '',
    })
    const picked = cleanTextOutput(content).trim()
    if (valid.includes(picked)) chosen = picked
  } catch (err) {
    logger.warn({ bullet, err }, '[newsletter/research] teaser URL selector failed — using first valid')
  }

  const { html } = await scrapeUrl(chosen)
  const extract = extractReadable(html)
  if (!extract) return null
  return { bullet, url: chosen, extract }
}

export async function researchTeaserSources(
  topic: NewsletterTopic,
  calendar: NewsletterCalendar,
): Promise<TeaserSource[]> {
  if (!(await isOxylabsConfigured())) return []
  const bullets = [topic.bullet1, topic.bullet2, topic.bullet3].filter(Boolean)
  const out: TeaserSource[] = []
  for (const bullet of bullets) {
    try {
      const ts = await researchOneTeaser(bullet, calendar)
      if (ts) out.push(ts)
    } catch (err) {
      logger.warn({ topicId: topic.id, bullet, err }, '[newsletter/research] teaser source failed')
    }
  }
  return out
}

// ── Orchestrator ──────────────────────────────────────────────────────────────

async function priorRecipeTitles(calendarId: string, excludeTopicId: string): Promise<string[]> {
  const rows = await prisma.newsletterTopic.findMany({
    where: { calendarId, id: { not: excludeTopicId }, research: { not: Prisma.JsonNull } },
    select: { research: true },
    take: 100,
  })
  const titles: string[] = []
  for (const r of rows) {
    const research = r.research as TopicResearch | null
    const t = research?.recipe?.title
    if (t) titles.push(t)
  }
  return titles
}

export interface ResearchOutcome {
  status: 'complete' | 'partial' | 'failed'
  research: TopicResearch
}

export async function ensureTopicResearch(topicId: string): Promise<ResearchOutcome> {
  const topic = await prisma.newsletterTopic.findUnique({
    where: { id: topicId },
    include: { calendar: true },
  })
  if (!topic) throw new Error(`NewsletterTopic ${topicId} not found`)

  if (topic.researchStatus === 'complete') {
    return { status: 'complete', research: (topic.research as TopicResearch) ?? {} }
  }

  const calendar = topic.calendar
  const research: TopicResearch = {}

  // Video (always attempted).
  try {
    research.video = await researchVideo(topic, calendar)
  } catch (err) {
    logger.warn({ topicId, err }, '[newsletter/research] video research threw')
  }

  // Recipe (only when the column is populated).
  if (topic.recipe) {
    try {
      const priors = await priorRecipeTitles(calendar.id, topic.id)
      const recipe = await researchRecipe(topic, calendar, priors)
      if (recipe) research.recipe = recipe
    } catch (err) {
      logger.warn({ topicId, err }, '[newsletter/research] recipe research threw')
    }
  }

  // Teaser sources (one per bullet).
  try {
    research.teaserSources = await researchTeaserSources(topic, calendar)
  } catch (err) {
    logger.warn({ topicId, err }, '[newsletter/research] teaser research threw')
  }

  // Completeness: a found-or-manual video, recipe iff required, all 3 teasers.
  const videoOk = !!research.video && (!!research.video.url || research.video.manual)
  const recipeOk = !topic.recipe || !!research.recipe
  const teaserOk = (research.teaserSources?.length ?? 0) >= 3
  const anything =
    !!research.video || !!research.recipe || (research.teaserSources?.length ?? 0) > 0

  const status: ResearchOutcome['status'] =
    videoOk && recipeOk && teaserOk ? 'complete' : anything ? 'partial' : 'failed'

  await prisma.newsletterTopic.update({
    where: { id: topicId },
    data: { research: research as unknown as Prisma.InputJsonValue, researchStatus: status },
  })

  logger.info({ topicId, status }, '[newsletter/research] topic research written')
  return { status, research }
}
