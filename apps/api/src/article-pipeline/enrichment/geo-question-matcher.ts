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

/**
 * Word-overlap score between two strings (Jaccard-style, case-insensitive).
 * Returns a value in [0, 1].
 */
function wordOverlap(a: string, b: string): number {
  const words = (s: string) =>
    new Set(s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean))
  const wa = words(a)
  const wb = words(b)
  if (wa.size === 0 || wb.size === 0) return 0
  let intersection = 0
  for (const w of wa) { if (wb.has(w)) intersection++ }
  return intersection / Math.max(wa.size, wb.size)
}

/**
 * Snap an LLM-returned string back to the best-matching original FAQ candidate.
 * Returns the original candidate text (verbatim and complete) when overlap ≥ 0.80,
 * or null to signal "no good match — fall through to keyword generation".
 */
function snapToCandidate(llmString: string, candidates: string[]): string | null {
  if (candidates.length === 0) return null
  let best: string | null = null
  let bestScore = 0
  for (const c of candidates) {
    const score = wordOverlap(llmString, c)
    if (score > bestScore) {
      bestScore = score
      best = c
    }
  }
  return bestScore >= 0.8 ? best : null
}

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
      if (!s.length || s.toLowerCase() === 'null') return null
      // Strict-match: snap the LLM's string back to the original candidate it
      // best resembles (by word overlap). If overlap is <80%, treat as null so
      // the caller falls through to keyword generation rather than using a
      // truncated or paraphrased heading.
      return snapToCandidate(s, opts.faqQuestions)
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
