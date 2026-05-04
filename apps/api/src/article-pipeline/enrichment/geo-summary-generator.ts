import { getLLMAdapter } from '../llm/factory'
import { cleanTextOutput } from '../output-cleaner'
import { loadPromptTemplate } from './prompt-template'
import { withGeoRetry } from './geo-retry'

const DEF_SYS =
  'You are an expert content writer creating concise AI-optimised summaries for Generative Engine Optimisation (GEO).'
const DEF_USER = `Write a concise 40-60 word answer to the following question, based on the article section content provided.

Question: {{question}}

Article section content:
{{content}}

Rules:
- Answer directly and informatively.
- Stay between 40 and 60 words.
- Write in third person, informational tone.
- Do NOT use bullet points or headings.
- Respond with ONLY the summary paragraph — nothing else.`

const MAX_CONTENT = 2000

export async function generateAiSummary(opts: {
  question: string
  sectionContent: string
  jobId: string
  position: number
}): Promise<{
  summary: string
  inputTokens: number
  outputTokens: number
  cost: number
  provider: string
  model: string
}> {
  const t = await loadPromptTemplate(104)
  const provider = (t?.defaultProvider ?? 'anthropic').toLowerCase()
  const model = t?.defaultModel ?? 'claude-sonnet-4-5-20250929'
  const content = opts.sectionContent.slice(0, MAX_CONTENT)
  const userPrompt = (t?.userPrompt ?? DEF_USER)
    .replace(/\{\{question\}\}/g, opts.question)
    .replace(/\{\{content\}\}/g, content)

  const adapter = getLLMAdapter(provider)
  const run = await withGeoRetry(`geo_step_104_${opts.position}`, () =>
    adapter.call({
      systemPrompt: t?.systemPrompt ?? DEF_SYS,
      userPrompt,
      model,
      temperature: 0.3,
      maxTokens: 512,
    }),
  )
  const summary = cleanTextOutput(run.content).trim()
  return {
    summary,
    inputTokens: run.tokens.input,
    outputTokens: run.tokens.output,
    cost: run.cost,
    provider,
    model,
  }
}
