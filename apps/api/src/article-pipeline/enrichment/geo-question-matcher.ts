import { getLLMAdapter } from '../llm/factory'
import { cleanTextOutput } from '../output-cleaner'
import { loadPromptTemplate } from './prompt-template'
import { withGeoRetry } from './geo-retry'
import { logger } from '../../lib/logger'

const DEFAULT_SYSTEM =
  'You are an expert content strategist helping match research questions to article sections.'

const DEFAULT_USER = `You are helping enrich an article by matching research FAQ questions to article sections.

Article sections (JSON):
{{sections}}

Available FAQ questions (JSON):
{{candidates}}

Rules:
- Match each section to the MOST topically relevant FAQ question.
- Each FAQ question may only be used ONCE across all sections.
- If no FAQ question is a good fit for a section, respond with null for that section.
- Respond ONLY with valid JSON: an array of strings (the matched question text) or null, one per section, in order.
- Do NOT include any explanation — ONLY the JSON array.

Example response: ["Why is X important?", null, "How does Y work?"]`

export interface QuestionMatchResult {
  matches: (string | null)[]
  inputTokens: number
  outputTokens: number
  cost: number
  provider: string
  model: string
}

export async function matchQuestionsToSections(opts: {
  sections: Array<{ position: number; heading: string; contentSnippet: string }>
  faqQuestions: string[]
  jobId: string
}): Promise<QuestionMatchResult> {
  const template = await loadPromptTemplate(101)
  const provider = (template?.defaultProvider ?? 'openai').toLowerCase()
  const model = template?.defaultModel ?? 'gpt-4o-mini'
  const systemPrompt = template?.systemPrompt ?? DEFAULT_SYSTEM
  const userT = template?.userPrompt ?? DEFAULT_USER

  const sectionsJson = JSON.stringify(
    opts.sections.map((s) => ({
      position: s.position,
      heading: s.heading,
      contentSnippet: s.contentSnippet,
    })),
  )
  const candidatesJson = JSON.stringify(opts.faqQuestions)

  const userPrompt = userT
    .replace(/\{\{sections\}\}/g, sectionsJson)
    .replace(/\{\{candidates\}\}/g, candidatesJson)

  const adapter = getLLMAdapter(provider)

  const run = await withGeoRetry('geo_step_101', () =>
    adapter.call({
      systemPrompt,
      userPrompt,
      model,
      temperature: 0.2,
      maxTokens: 2048,
    }),
  )

  const raw = cleanTextOutput(run.content).trim()
  let matches: (string | null)[] = []
  try {
    const parsed = JSON.parse(raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, ''))
    if (!Array.isArray(parsed)) throw new Error('not an array')
    matches = parsed.map((x: unknown) => {
      if (x === null || x === undefined) return null
      const s = typeof x === 'string' ? x.trim() : String(x).trim()
      return s.length ? s : null
    })
  } catch (err) {
    logger.warn({ jobId: opts.jobId, err, raw: raw.slice(0, 400) }, '[geo-101] JSON parse failed')
    throw err
  }

  if (matches.length !== opts.sections.length) {
    logger.warn(
      { jobId: opts.jobId, expected: opts.sections.length, got: matches.length },
      '[geo-101] length mismatch — padding',
    )
    while (matches.length < opts.sections.length) matches.push(null)
    matches = matches.slice(0, opts.sections.length)
  }

  return {
    matches,
    inputTokens: run.tokens.input,
    outputTokens: run.tokens.output,
    cost: run.cost,
    provider,
    model,
  }
}
