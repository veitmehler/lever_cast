import { getLLMAdapter } from '../../article-pipeline/llm/factory'
import { cleanAndParseJSON, cleanTextOutput } from '../../article-pipeline/output-cleaner'
import { loadPromptTemplate } from '../../article-pipeline/enrichment/prompt-template'
import { logger } from '../../lib/logger'
import { recordLLMUsage } from '../../lib/llm-usage'
import { sanitizeDashesText } from '../../lib/text/dash-sanitizer'
import type { CarouselSlidePlan, CarouselSlideType } from '../compositors/carousel'

const DEF_SYS =
  'You are a social media designer planning image carousel slides. Each slide needs a type (hook/content/cta), optional headline, body text, and a detailed image prompt for AI image generation (no text in the image).'

const DEF_USER = `Plan an image carousel with exactly {{slide_count}} slides based on the content below.

Topic: {{topic}}

Content:
{{details}}

Rules:
- Return ONLY valid JSON: { "slides": [ { "index": 1, "type": "hook|content|cta", "headlineText": "...", "bodyText": "...", "imagePrompt": "..." } ] }
- Exactly {{slide_count}} slides
- First slide type must be "hook", last slide type must be "cta", all others "content"
- headlineText: max 22 characters per line; null is allowed for content slides that lead with body text
- bodyText: 1-4 short paragraphs, separated by \\n; null for hook slides
- imagePrompt: photorealistic scene, no text/words/logos/watermarks in image`

function buildUserPrompt(template: string, opts: {
  slideCount: number
  topic: string
  content: string
  organizationName: string
  industry?: string
  writingStyle?: string
  callToAction?: string
  articleUrl?: string
  specialInstructions?: string
}): string {
  return template
    .replace(/\{\{slide_count\}\}/g, String(opts.slideCount))
    .replace(/\{\{slideCount\}\}/g, String(opts.slideCount))
    .replace(/\{\{topic\}\}/g, opts.topic.slice(0, 500))
    .replace(/\{\{details\}\}/g, opts.content.slice(0, 12000))
    .replace(/\{\{content\}\}/g, opts.content.slice(0, 12000))
    .replace(/\{\{organizationName\}\}/g, opts.organizationName)
    .replace(/\{\{industry\}\}/g, opts.industry ?? 'general business')
    .replace(/\{\{writingStyle\}\}/g, opts.writingStyle || 'Not specified')
    .replace(/\{\{writing_style\}\}/g, opts.writingStyle || 'Not specified')
    .replace(/\{\{call_to_action\}\}/g, opts.callToAction || '')
    .replace(/\{\{callToAction\}\}/g, opts.callToAction || '')
    .replace(/\{\{article_url\}\}/g, opts.articleUrl ?? '')
    .replace(/\{\{special_instructions\}\}/g, (opts.specialInstructions ?? '').slice(0, 800))
}

type SlideRaw = {
  index?: number
  type?: string
  headlineText?: string | null
  bodyText?: string | null
  imagePrompt?: string
  headline?: string
  bullets?: string[]
}

function parseSlidesFromRaw(rawText: string): { slides?: SlideRaw[] } | null {
  try {
    const parsed = cleanAndParseJSON(cleanTextOutput(rawText))
    return parsed.data as { slides?: SlideRaw[] }
  } catch {
    return null
  }
}

export async function planCarouselSlides(opts: {
  content: string
  topic?: string
  organizationName: string
  industry?: string
  writingStyle?: string
  callToAction?: string
  slideCount: number
  articleUrl?: string
  specialInstructions?: string
  userId?: string
}): Promise<CarouselSlidePlan[]> {
  const t = await loadPromptTemplate(202, { userId: opts.userId })
  const provider = (t?.defaultProvider ?? 'anthropic').toLowerCase()
  const model = t?.defaultModel ?? 'claude-sonnet-4-5-20250929'

  const topic = opts.topic?.trim() || opts.organizationName

  const promptVars = {
    slideCount: opts.slideCount,
    topic,
    content: opts.content,
    organizationName: opts.organizationName,
    industry: opts.industry,
    writingStyle: opts.writingStyle,
    callToAction: opts.callToAction,
    articleUrl: opts.articleUrl,
    specialInstructions: opts.specialInstructions,
  }

  const userPrompt = buildUserPrompt(t?.userPrompt ?? DEF_USER, promptVars)

  const adapter = getLLMAdapter(provider)
  const run = await adapter.call({
    systemPrompt: t?.systemPrompt ?? DEF_SYS,
    userPrompt,
    model,
    temperature: 0.5,
    maxTokens: 4096,
    jsonMode: true,
  })
  await recordLLMUsage(opts.userId ?? null, 'social_carousel_plan', run)

  let data = parseSlidesFromRaw(run.content)

  // If parsing failed or the DB template returned wrong format (e.g. {"caption":"..."})
  // retry once using hardcoded defaults to recover from a corrupted DB template.
  if (!data?.slides?.length) {
    logger.warn(
      { rawContent: run.content.slice(0, 400), usingDbTemplate: !!t },
      'planCarouselSlides: parse failed or no slides — retrying with default prompt',
    )

    const retryPrompt = buildUserPrompt(DEF_USER, promptVars)
    const retryRun = await adapter.call({
      systemPrompt: DEF_SYS,
      userPrompt: retryPrompt,
      model,  // same provider+model — only the prompt template is reset to defaults
      temperature: 0.5,
      maxTokens: 4096,
      jsonMode: true,
    })
    await recordLLMUsage(opts.userId ?? null, 'social_carousel_plan', retryRun)

    data = parseSlidesFromRaw(retryRun.content)

    if (!data?.slides?.length) {
      logger.error(
        { retryRawContent: retryRun.content.slice(0, 400) },
        'planCarouselSlides: retry also failed to return slides',
      )
      throw new Error('LLM did not return carousel slides after retry')
    }

    logger.info({ slideCount: data.slides.length }, 'planCarouselSlides: retry succeeded')
  }

  const rawSlides = data.slides ?? []

  if (rawSlides.length === 0) throw new Error('LLM did not return carousel slides')

  const lastIdx = Math.min(rawSlides.length, opts.slideCount) - 1

  const planned = rawSlides.slice(0, opts.slideCount).map((s, i): CarouselSlidePlan => {
    // Support both new (headlineText/bodyText/type) and old (headline/bullets) formats
    const headlineText = (s.headlineText !== undefined ? s.headlineText : s.headline ?? null)
    const bodyText = s.bodyText !== undefined
      ? s.bodyText
      : s.bullets?.join('\n') ?? null

    // Always force position-based types: first slide = hook, last = cta.
    // This overrides any LLM-returned type to prevent mismatched rendering.
    let type: CarouselSlideType
    if (i === 0) {
      type = 'hook'
    } else if (i === lastIdx) {
      type = 'cta'
    } else {
      type = 'content'
    }

    const resolvedHeadline = typeof headlineText === 'string' && headlineText.trim()
      ? headlineText.trim()
      : null

    // Hook slides must have a visible headline — fall back to topic if LLM omitted it
    const finalHeadline = (type === 'hook' && !resolvedHeadline)
      ? (opts.topic?.trim().slice(0, 60) ?? null)
      : resolvedHeadline

    return {
      type,
      headlineText: finalHeadline,
      bodyText: typeof bodyText === 'string' && bodyText.trim() ? bodyText.trim() : null,
      imagePrompt: (s.imagePrompt ?? '').trim().slice(0, 500),
    }
  })

  // Em-dash elimination on the visible on-image text (imagePrompt is not
  // reader-facing and stays untouched). See .plans/de-ai-writing.implementation-plan.md.
  return Promise.all(
    planned.map(async (slide) => ({
      ...slide,
      headlineText: slide.headlineText
        ? await sanitizeDashesText(slide.headlineText, { surface: 'carousel_headline' })
        : slide.headlineText,
      bodyText: slide.bodyText
        ? await sanitizeDashesText(slide.bodyText, { surface: 'carousel_body' })
        : slide.bodyText,
    })),
  )
}
