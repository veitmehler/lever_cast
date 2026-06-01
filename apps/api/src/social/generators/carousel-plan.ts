import { getLLMAdapter } from '../../article-pipeline/llm/factory'
import { cleanAndParseJSON, cleanTextOutput } from '../../article-pipeline/output-cleaner'
import { loadPromptTemplate } from '../../article-pipeline/enrichment/prompt-template'
import type { CarouselSlidePlan } from '../compositors/carousel'

const DEF_SYS =
  'You are a social media designer planning image carousel slides. Each slide needs a punchy headline, 1–3 short bullet points, and a detailed image prompt for AI image generation (no text in the image).'

const DEF_USER = `Plan an image carousel with exactly {{slideCount}} slides based on the content below.

Content:
{{content}}

Organization: {{organizationName}}
Industry context: {{industry}}

Rules:
- Return ONLY valid JSON: { "slides": [ { "headline": "...", "bullets": ["..."], "imagePrompt": "..." } ] }
- Exactly {{slideCount}} slides
- headline: ≤ 60 characters
- bullets: 1–3 items, each ≤ 80 characters
- imagePrompt: descriptive scene for flux image gen, no text/words/logos/watermarks, photorealistic or editorial style
- Slide 1 should hook the reader; final slide should summarize or CTA
- Do not invent facts not in the content`

export async function planCarouselSlides(opts: {
  content: string
  organizationName: string
  industry?: string
  slideCount: number
}): Promise<CarouselSlidePlan[]> {
  const t = await loadPromptTemplate(202)
  const provider = (t?.defaultProvider ?? 'anthropic').toLowerCase()
  const model = t?.defaultModel ?? 'claude-sonnet-4-5-20250929'

  const userPrompt = (t?.userPrompt ?? DEF_USER)
    .replace(/\{\{content\}\}/g, opts.content.slice(0, 12000))
    .replace(/\{\{organizationName\}\}/g, opts.organizationName)
    .replace(/\{\{industry\}\}/g, opts.industry ?? 'general business')
    .replace(/\{\{slideCount\}\}/g, String(opts.slideCount))

  const adapter = getLLMAdapter(provider)
  const run = await adapter.call({
    systemPrompt: t?.systemPrompt ?? DEF_SYS,
    userPrompt,
    model,
    temperature: 0.5,
    maxTokens: 2048,
    jsonMode: true,
  })

  const parsed = cleanAndParseJSON(cleanTextOutput(run.content))
  const data = parsed.data as { slides?: CarouselSlidePlan[] }
  const slides = data.slides ?? []

  if (slides.length === 0) throw new Error('LLM did not return carousel slides')

  return slides.slice(0, opts.slideCount).map((s) => ({
    headline: (s.headline ?? '').trim().slice(0, 80),
    bullets: (s.bullets ?? []).map((b) => b.trim().slice(0, 100)).filter(Boolean).slice(0, 3),
    imagePrompt: (s.imagePrompt ?? '').trim().slice(0, 500),
  }))
}
