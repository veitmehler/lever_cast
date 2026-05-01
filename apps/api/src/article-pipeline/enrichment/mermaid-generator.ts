/**
 * Mermaid diagram generator — calls Anthropic Claude to produce a Mermaid
 * diagram for one <h2> section of an article.
 *
 * Returns `null` when the LLM decides the section doesn't benefit from a
 * diagram (SKIP sentinel).
 */

import { getLLMAdapter } from '../llm/factory'
import { cleanTextOutput } from '../output-cleaner'
import { logger } from '../../lib/logger'

const PROVIDER = 'anthropic'
const MODEL    = 'claude-sonnet-4-5-20250929'
const TEMPERATURE = 0.3
const MAX_TOKENS  = 1_024

const VERBOSE  = process.env.VERBOSE_LLM_LOGS === 'true'
const TRUNCATE = parseInt(process.env.VERBOSE_LLM_LOGS_TRUNCATE ?? '3000', 10)
function trunc(s: string) { return TRUNCATE > 0 && s.length > TRUNCATE ? s.slice(0, TRUNCATE) + `… [+${s.length - TRUNCATE} chars]` : s }

// Max section HTML sent to the LLM — keeps token count low
const MAX_SECTION_HTML = 3_000

const SYSTEM_PROMPT =
  'You generate Mermaid.js diagrams that visually summarize a section of an article. ' +
  'You output ONLY valid Mermaid syntax — no explanation, no code fences, no markdown. ' +
  'The diagram type must be appropriate to the content ' +
  '(flowchart for processes, sequenceDiagram for interactions, gantt for timelines, ' +
  'classDiagram for hierarchies, mindmap for concept maps, pie for proportions, ' +
  'timeline for chronologies). ' +
  'If no diagram type fits the section, output exactly the string SKIP.'

function buildUserPrompt(opts: {
  articleTopic: string
  primaryKeyword: string
  sectionTitle: string
  sectionHtml: string
  retryContext?: string
}): string {
  const htmlSnippet = opts.sectionHtml.slice(0, MAX_SECTION_HTML)
  const base =
    `Article topic: ${opts.articleTopic}\n` +
    `Primary keyword: ${opts.primaryKeyword}\n\n` +
    `Section heading: ${opts.sectionTitle}\n\n` +
    `Section HTML:\n${htmlSnippet}\n\n` +
    'Output a Mermaid diagram that adds visual clarity to this section. ' +
    'Pick the most appropriate diagram type. Do not exceed 12 nodes. ' +
    'Use plain English labels. No code fences. No commentary.\n\n' +
    'If the section is purely narrative or doesn\'t benefit from a visual, output exactly: SKIP'

  if (opts.retryContext) {
    return (
      base +
      `\n\nIMPORTANT: Your previous attempt produced invalid Mermaid syntax.\n` +
      `Error: ${opts.retryContext.slice(0, 400)}\n` +
      `Please fix the syntax and try again.`
    )
  }

  return base
}

export interface DiagramResult {
  mermaidSyntax: string | null  // null → SKIP
  inputTokens: number
  outputTokens: number
  cost: number
  provider: string
  model: string
}

export async function generateMermaidDiagram(opts: {
  sectionTitle: string
  sectionHtml: string
  articleTopic: string
  primaryKeyword: string
  jobId: string
  position: number
  retryContext?: string
}): Promise<DiagramResult> {
  const adapter = getLLMAdapter(PROVIDER)
  const userPrompt = buildUserPrompt(opts)

  if (VERBOSE) {
    logger.info(
      {
        jobId: opts.jobId,
        position: opts.position,
        provider: PROVIDER,
        model: MODEL,
        systemPrompt: trunc(SYSTEM_PROMPT),
        userPrompt: trunc(userPrompt),
      },
      '[llm-verbose] PROMPT (mermaid)',
    )
  }

  const response = await adapter.call({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
    model: MODEL,
    temperature: TEMPERATURE,
    maxTokens: MAX_TOKENS,
  })

  if (VERBOSE) {
    logger.info(
      {
        jobId: opts.jobId,
        position: opts.position,
        provider: PROVIDER,
        model: MODEL,
        inputTokens: response.tokens.input,
        outputTokens: response.tokens.output,
        cost: response.cost,
        response: trunc(response.content),
      },
      '[llm-verbose] RESPONSE (mermaid)',
    )
  }

  const raw = cleanTextOutput(response.content).trim()

  if (!raw || raw.toUpperCase() === 'SKIP') {
    logger.info(
      { jobId: opts.jobId, position: opts.position },
      '[enrichment] mermaid-gen returned SKIP',
    )
    return {
      mermaidSyntax: null,
      inputTokens: response.tokens.input,
      outputTokens: response.tokens.output,
      cost: response.cost,
      provider: PROVIDER,
      model: MODEL,
    }
  }

  return {
    mermaidSyntax: raw,
    inputTokens: response.tokens.input,
    outputTokens: response.tokens.output,
    cost: response.cost,
    provider: PROVIDER,
    model: MODEL,
  }
}
