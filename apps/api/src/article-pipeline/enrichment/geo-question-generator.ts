import { getLLMAdapter } from '../llm/factory'
import { cleanTextOutput } from '../output-cleaner'
import { loadPromptTemplate } from './prompt-template'
import { withGeoRetry } from './geo-retry'

const DEF_102_SYS = 'You are an expert SEO specialist converting keywords into natural search questions.'
const DEF_102_USER = `Convert the following keyword or phrase into a clear, specific question that someone might ask when searching for information about "{{sectionHeading}}".

Keyword: {{keyword}}

Rules:
- The question must be relevant to the topic.
- Write in a natural, conversational style.
- Do NOT add quotes or punctuation beyond the question mark.
- Respond with ONLY the question text — nothing else.`

const DEF_103_USER = `Rephrase the following question to convey the same meaning with different wording. The goal is to create a unique variant that is topically equivalent but worded differently.

Original question: {{question}}

Rules:
- Keep the same meaning and intent.
- Use different words, sentence structure, or phrasing.
- Do NOT add quotes or extra punctuation.
- Respond with ONLY the rephrased question — nothing else.`

export interface GenTokens {
  inputTokens: number
  outputTokens: number
  cost: number
  provider: string
  model: string
}

export async function generateQuestionFromKeyword(opts: {
  keyword: string
  sectionHeading: string
  jobId: string
  position: number
}): Promise<{ question: string } & GenTokens> {
  const t = await loadPromptTemplate(102)
  const provider = (t?.defaultProvider ?? 'gemini').toLowerCase()
  const model = t?.defaultModel ?? 'gemini-2.5-flash'
  const sys = t?.systemPrompt ?? DEF_102_SYS
  const usr = (t?.userPrompt ?? DEF_102_USER)
    .replace(/\{\{keyword\}\}/g, opts.keyword)
    .replace(/\{\{sectionHeading\}\}/g, opts.sectionHeading)

  const adapter = getLLMAdapter(provider)
  const run = await withGeoRetry(`geo_step_102_${opts.position}`, () =>
    adapter.call({
      systemPrompt: sys || undefined,
      userPrompt: usr,
      model,
      temperature: 0.3,
      maxTokens: 256,
    }),
  )
  const question = cleanTextOutput(run.content).trim().replace(/^["']|["']$/g, '')
  return {
    question,
    inputTokens: run.tokens.input,
    outputTokens: run.tokens.output,
    cost: run.cost,
    provider,
    model,
  }
}

export async function rephraseForUniqueness(opts: {
  question: string
  jobId: string
  position: number
}): Promise<{ question: string } & GenTokens> {
  const t = await loadPromptTemplate(103)
  const provider = (t?.defaultProvider ?? 'openai').toLowerCase()
  const model = t?.defaultModel ?? 'gpt-4o-mini'
  const usr = (t?.userPrompt ?? DEF_103_USER).replace(/\{\{question\}\}/g, opts.question)

  const adapter = getLLMAdapter(provider)
  const run = await withGeoRetry(`geo_step_103_${opts.position}`, () =>
    adapter.call({
      systemPrompt: t?.systemPrompt ?? null,
      userPrompt: usr,
      model,
      temperature: 0.4,
      maxTokens: 256,
    }),
  )
  const question = cleanTextOutput(run.content).trim().replace(/^["']|["']$/g, '')
  return {
    question,
    inputTokens: run.tokens.input,
    outputTokens: run.tokens.output,
    cost: run.cost,
    provider,
    model,
  }
}
