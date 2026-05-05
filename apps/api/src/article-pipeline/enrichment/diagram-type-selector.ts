/**
 * GPT-4o-mini picks which Mermaid diagram type fits a section before Claude generates syntax.
 */

import { getLLMAdapter } from '../llm/factory'
import { cleanTextOutput } from '../output-cleaner'
import { logger } from '../../lib/logger'

const PROVIDER = 'openai'
const MODEL = 'gpt-4o-mini'
const TEMPERATURE = 0.2
const MAX_TOKENS = 40

export const DIAGRAM_VALID_TYPES = [
  'flowchart',
  'sequenceDiagram',
  'mindmap',
  'timeline',
  'pie',
  'stateDiagram-v2',
  'gantt',
  'classDiagram',
  'quadrantChart',
] as const

export type MermaidDiagramType = typeof DIAGRAM_VALID_TYPES[number]

const TYPE_GUIDANCE = `Available diagram types and when to use each:
- flowchart: Processes, decision logic, cause-and-effect chains, step-by-step workflows
- sequenceDiagram: Interactions between actors/entities, communication protocols, request/response flows
- mindmap: Concept relationships, topic breakdowns, brainstorming maps, category overviews
- timeline: Chronological events, recovery phases, historical progression, milestones
- pie: Proportions, distributions, percentage breakdowns (only when section contains numeric data)
- stateDiagram-v2: State transitions, lifecycle stages, condition changes, status workflows
- gantt: Schedules, parallel activities, treatment plans with time durations, project phases
- classDiagram: Hierarchies, taxonomies, type relationships, has-a / is-a structures
- quadrantChart: 2-axis comparisons, risk vs. reward, cost vs. benefit matrices`

const SYSTEM_PROMPT =
  'You select the most appropriate Mermaid.js diagram type for one article section. ' +
  'Output ONLY the diagram type name — exactly as listed below, nothing else — no punctuation, no quotes. ' +
  'If no diagram fits the section at all, output exactly: SKIP\n\n' +
  TYPE_GUIDANCE

export interface TypeSelectionResult {
  diagramType: MermaidDiagramType | null
  inputTokens: number
  outputTokens: number
  cost: number
}

export async function selectDiagramType(opts: {
  sectionTitle: string
  contentSnippet: string
  alreadyUsed: string[]
  jobId: string
  position: number
}): Promise<TypeSelectionResult> {
  const adapter = getLLMAdapter(PROVIDER)

  const usedList =
    opts.alreadyUsed.length > 0
      ? `\nTypes already used in this article — avoid repeating one of these unless no other type is appropriate:\n${opts.alreadyUsed.join(', ')}\n`
      : ''

  const userPrompt =
    `Section heading: ${opts.sectionTitle}\n` +
    `Content snippet:\n${opts.contentSnippet.slice(0, 500)}\n` +
    `${usedList}\n` +
    'Respond with ONE line: the diagram type name from the list, or SKIP.'

  const response = await adapter.call({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
    model: MODEL,
    temperature: TEMPERATURE,
    maxTokens: MAX_TOKENS,
  })

  const raw = cleanTextOutput(response.content)
    .trim()
    .split(/\r?\n/)[0]
    ?.replace(/^["']|["']$/g, '')
    ?.trim() ?? ''

  if (!raw || raw.toUpperCase() === 'SKIP') {
    logger.info({ jobId: opts.jobId, position: opts.position }, '[enrichment] diagram-type selector returned SKIP')
    return {
      diagramType: null,
      inputTokens: response.tokens.input,
      outputTokens: response.tokens.output,
      cost: response.cost,
    }
  }

  const normalized = normalizeTypeToken(raw)

  let matched = pickMatchingType(normalized)

  if (!matched) {
    logger.warn(
      { jobId: opts.jobId, position: opts.position, raw },
      '[enrichment] type-selector unrecognized output — fallback flowchart',
    )
    matched = 'flowchart'
  }

  return {
    diagramType: matched,
    inputTokens: response.tokens.input,
    outputTokens: response.tokens.output,
    cost: response.cost,
  }
}

function normalizeTypeToken(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9_-]/gi, '')
    .replace(/^flowchartdiagram$/, 'flowchart')
}

function pickMatchingType(token: string): MermaidDiagramType | null {
  const compact = token.toLowerCase().replace(/[^a-z0-9]/g, '')
  for (const t of DIAGRAM_VALID_TYPES) {
    const tn = t.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (compact === tn || token.toLowerCase() === t.toLowerCase()) return t
  }
  if (token.includes('sequence')) return 'sequenceDiagram'
  if (token.includes('mindmap')) return 'mindmap'
  if (token.includes('timeline')) return 'timeline'
  if (token.includes('pie')) return 'pie'
  if (token.includes('state')) return 'stateDiagram-v2'
  if (token.includes('gantt')) return 'gantt'
  if (token.includes('class')) return 'classDiagram'
  if (token.includes('quadrant')) return 'quadrantChart'
  if (token.includes('flow') || token === 'graph') return 'flowchart'
  return null
}
