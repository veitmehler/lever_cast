import { getLLMAdapter } from '../../article-pipeline/llm/factory'
import { cleanTextOutput } from '../../article-pipeline/output-cleaner'
import { loadPromptTemplate } from '../../article-pipeline/enrichment/prompt-template'

export type PitchSlideType = 'carousel' | 'hook'

const CTA_BASE: Record<PitchSlideType, string> = {
  carousel: 'Watch the full carousel on our profile',
  hook: 'Watch the video on our profile',
}

export function ctaActionForType(type: PitchSlideType): string {
  return CTA_BASE[type]
}

const DEF_SYS = `You write ultra-short slide copy for social media story posts.
Your job: given an article topic, a brief content summary, and a CTA action phrase, write 2–4 short sentences that tease what the post contains.

RULES:
1. 2–4 short sentences for the pitch. Use normal sentence punctuation. No hashtags, no emojis.
2. Never start with "Did you know" or generic filler.
3. Tone: direct, confident, punchy — matching the brand voice.
4. After the pitch sentences, output ONE final line starting with exactly "CTA: " followed by a short natural variation of the provided CTA action phrase. Do not include arrows or emojis in the CTA.
5. Output format:
   [pitch sentences — plain text]

   CTA: [your CTA variation]

No quotes, no labels other than "CTA:", no markdown.`

const DEF_USER = `Write a story pitch slide for this post.

Topic: {{topic}}

Content summary:
{{content}}

Required CTA action (vary the wording naturally):
{{cta_action}}

Return the pitch sentences, then a final line "CTA: ...".`

export interface PitchSlideCopy {
  pitch: string
  cta: string
}

/** Split LLM output into pitch body and CTA line. Falls back to base CTA if missing. */
export function parsePitchAndCta(raw: string, fallbackCta: string): PitchSlideCopy {
  const trimmed = raw.trim()
  const lines = trimmed.split('\n').map((l) => l.trim()).filter(Boolean)
  const ctaIdx = lines.findIndex((l) => /^CTA:\s*/i.test(l))

  if (ctaIdx >= 0) {
    const cta = lines[ctaIdx].replace(/^CTA:\s*/i, '').trim()
    const pitch = lines.slice(0, ctaIdx).join(' ').trim()
    return {
      pitch: pitch || trimmed,
      cta: cta || fallbackCta,
    }
  }

  return { pitch: trimmed, cta: fallbackCta }
}

export async function generatePitchSlideText(opts: {
  topic: string
  content: string
  pitchType: PitchSlideType
}): Promise<PitchSlideCopy> {
  const fallbackCta = ctaActionForType(opts.pitchType)

  const t = await loadPromptTemplate(208)
  const provider = (t?.defaultProvider ?? 'anthropic').toLowerCase()
  const model = t?.defaultModel ?? 'claude-sonnet-4-5-20250929'

  const userPrompt = (t?.userPrompt ?? DEF_USER)
    .replace(/\{\{topic\}\}/g, opts.topic.slice(0, 300))
    .replace(/\{\{content\}\}/g, opts.content.replace(/<[^>]+>/g, ' ').slice(0, 1200))
    .replace(/\{\{cta_action\}\}/g, fallbackCta)

  const adapter = getLLMAdapter(provider)
  const run = await adapter.call({
    systemPrompt: t?.systemPrompt ?? DEF_SYS,
    userPrompt,
    model,
    temperature: 0.7,
    maxTokens: 256,
  })

  return parsePitchAndCta(cleanTextOutput(run.content).trim(), fallbackCta)
}
