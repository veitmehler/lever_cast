/**
 * Mermaid diagram generator — Claude produces valid Mermaid for one section.
 * Diagram type is chosen beforehand by GPT-4o-mini (`diagram-type-selector.ts`).
 */

import { getLLMAdapter } from '../llm/factory'
import { cleanTextOutput } from '../output-cleaner'
import { logger } from '../../lib/logger'

const PROVIDER = 'anthropic'
const MODEL = 'claude-sonnet-4-5-20250929'
const TEMPERATURE = 0.3
const MAX_TOKENS = 1_024

const VERBOSE = process.env.VERBOSE_LLM_LOGS === 'true'
const TRUNCATE = Number.parseInt(process.env.VERBOSE_LLM_LOGS_TRUNCATE ?? '3000', 10)

function trunc(s: string): string {
  return TRUNCATE > 0 && s.length > TRUNCATE ? `${s.slice(0, TRUNCATE)}… [+${s.length - TRUNCATE} chars]` : s
}

const MAX_SECTION_HTML = 3_000

function typeInstructions(diagramType: string): string {
  switch (diagramType) {
    case 'sequenceDiagram':
      return 'Use `sequenceDiagram`. Include participant lines and arrows between actors.'
    case 'mindmap':
      return 'Use `mindmap`. Keep depth shallow (two levels preferred).'
    case 'timeline':
      return 'Use `timeline`. Keep a small number of dated or titled entries.'
    case 'pie':
      return 'Use `pie` chart syntax with titled slices. Prefer only when proportions make sense.'
    case 'stateDiagram-v2':
      return 'Use `stateDiagram-v2` with clear states and transitions.'
    case 'gantt':
      return 'Use `gantt` with a modest number of tasks / sections and dates or titles.'
    case 'classDiagram':
      return 'Use `classDiagram` showing relationships between concepts (keep it small).'
    case 'quadrantChart':
      return 'Use `quadrantChart` with labeled axes and a few items in quadrants.'
    case 'flowchart':
    default:
      return 'Use `flowchart` or `graph` (TD/LR) syntax. Keep nodes and edges simple.'
  }
}

const SYSTEM_PROMPT_BASE =
  'You generate Mermaid.js diagrams that visually summarize a section of an article. ' +
  'You output ONLY valid Mermaid syntax — no explanation, no code fences, no markdown. ' +
  'Do not add inline style directives, themeVariables, embedded init directives (%%{...}%%), classDef blocks, or other color overrides — ' +
  'theming is applied externally so labels stay readable. ' +
  'If the section is purely narrative or no diagram fits despite the required type, output exactly: SKIP'

function buildUserPrompt(opts: {
  articleTopic: string
  primaryKeyword: string
  sectionTitle: string
  sectionHtml: string
  diagramType: string
  retryContext?: string
}): string {
  const htmlSnippet = opts.sectionHtml.slice(0, MAX_SECTION_HTML)

  const base =
    `Diagram type (mandatory): ${opts.diagramType}\n` +
    `${typeInstructions(opts.diagramType)}\n\n` +
    `Article topic: ${opts.articleTopic}\n` +
    `Primary keyword: ${opts.primaryKeyword}\n\n` +
    `Section heading: ${opts.sectionTitle}\n\n` +
    `Section HTML:\n${htmlSnippet}\n\n` +
    'Produce a single diagram of the specified type that adds visual clarity. ' +
    'Do not exceed 12 nodes/items. Use plain English labels.\n\n' +
    'If SKIP is more honest than forcing an empty or misleading diagram, respond exactly: SKIP'

  if (opts.retryContext) {
    return (
      base +
      `\n\nIMPORTANT: Your previous attempt produced invalid Mermaid syntax or failed rendering.\n` +
      `Error: ${opts.retryContext.slice(0, 400)}\n` +
      `Fix the syntax while keeping the same diagram type.`
    )
  }

  return base
}

export interface DiagramResult {
  mermaidSyntax: string | null
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
  diagramType: string
  retryContext?: string
}): Promise<DiagramResult> {
  const adapter = getLLMAdapter(PROVIDER)
  const systemPrompt = SYSTEM_PROMPT_BASE
  const userPrompt = buildUserPrompt(opts)

  if (VERBOSE) {
    logger.info(
      {
        jobId: opts.jobId,
        position: opts.position,
        provider: PROVIDER,
        model: MODEL,
        diagramType: opts.diagramType,
        systemPrompt: trunc(systemPrompt),
        userPrompt: trunc(userPrompt),
      },
      '[llm-verbose] PROMPT (mermaid)',
    )
  }

  const response = await adapter.call({
    systemPrompt,
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
      { jobId: opts.jobId, position: opts.position, diagramType: opts.diagramType },
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
