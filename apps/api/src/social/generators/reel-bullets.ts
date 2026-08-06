import { getLLMAdapter } from '../../article-pipeline/llm/factory'
import { cleanAndParseJSON, cleanTextOutput } from '../../article-pipeline/output-cleaner'
import { loadPromptTemplate } from '../../article-pipeline/enrichment/prompt-template'
import { sanitizeDashesText } from '../../lib/text/dash-sanitizer'
import { recordLLMUsage } from '../../lib/llm-usage'

export interface ReelBulletsResult {
  headline: string
  bullets: string[]
}

/** Word-wrap width (chars per line) for the F2/S2 video reel headline overlay. */
export const REEL_HEADLINE_MAX_CHARS = 38

/** Max lines shown for the F2/S2 headline after word-wrapping. */
export const REEL_HEADLINE_MAX_LINES = 3

const DEF_SYS =
  'You extract concise bullet points from article content for a short social media video reel overlay. Each bullet must be ≤ 50 characters.'

const DEF_USER = `Extract 3–5 bullet points from the content below for a video reel text overlay.

Content:
{{content}}

Return ONLY valid JSON: { "headline": "...", "bullets": ["...", "..."] }
- 1 headline (word-wraps at ${REEL_HEADLINE_MAX_CHARS} characters per line)
- 3–5 bullets, each ≤ 50 characters
- Declarative, scannable
- No hashtags or emojis`

/** Pick a random bullet count in the range [min, max] (inclusive). */
function randomBulletCount(min = 4, max = 7): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/** Strip leading "✓ " or "✓" (U+2713) the LLM may prepend. */
function stripCheckmark(text: string): string {
  return text.replace(/^✓\s*/u, '').trim()
}

export async function extractReelBullets(opts: {
  content: string
  topic?: string
  details?: string
  specialInstructions?: string
  userId?: string
}): Promise<ReelBulletsResult> {
  const t = await loadPromptTemplate(204, { userId: opts.userId })
  const provider = (t?.defaultProvider ?? 'anthropic').toLowerCase()
  const model = t?.defaultModel ?? 'claude-sonnet-4-5-20250929'

  const bulletCount = randomBulletCount(4, 7)

  const userPrompt = (t?.userPrompt ?? DEF_USER)
    .replace(/\{\{content\}\}/g, opts.content.slice(0, 8000))
    .replace(/\{\{topic\}\}/g, (opts.topic ?? '').slice(0, 500))
    .replace(/\{\{details\}\}/g, (opts.details ?? opts.content).slice(0, 1500))
    .replace(/\{\{special_instructions\}\}/g, (opts.specialInstructions ?? '').slice(0, 800))
    .replace(/\{\{bullet_count\}\}/g, String(bulletCount))
    .replace(/\{\{article_url\}\}/g, '')

  const adapter = getLLMAdapter(provider)
  const run = await adapter.call({
    systemPrompt: t?.systemPrompt ?? DEF_SYS,
    userPrompt,
    model,
    temperature: 0.35,
    maxTokens: 2048,
    jsonMode: true,
  })
  await recordLLMUsage(opts.userId ?? null, 'social_reel_bullets', run)

  const parsed = cleanAndParseJSON(cleanTextOutput(run.content))
  const data = parsed.data as { headline?: string; bullets?: string[] }

  const headline = await sanitizeDashesText((data.headline ?? '').replace(/\s+/g, ' ').trim(), { surface: 'reel_headline' })

  const bullets = await Promise.all(
    (data.bullets ?? [])
      .map((b) => stripCheckmark(b.replace(/\s+/g, ' ').trim()))
      .filter(Boolean)
      .slice(0, 7)
      .map((b) => sanitizeDashesText(b, { surface: 'reel_bullet' })),
  )

  if (bullets.length === 0) throw new Error('Could not extract reel bullets from content')

  return { headline, bullets }
}
