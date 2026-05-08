import { getLLMAdapter } from '../llm/factory'
import { cleanTextOutput } from '../output-cleaner'
import { logger } from '../../lib/logger'

const PROVIDER = 'anthropic'
const MODEL = 'claude-haiku-4-5'
const MAX_SYNTAX = 600

const SYSTEM =
  'You write brief, specific one-sentence captions for data visualisation diagrams embedded in articles. ' +
  'Captions must describe what the diagram actually illustrates, not just restate the section title.'

const USER_TEMPLATE =
  `Article topic: {{articleTopic}}
Section heading: {{sectionTitle}}
Diagram type: {{diagramType}}
Mermaid syntax (excerpt):
{{syntaxExcerpt}}

Write ONE sentence (15–30 words) that describes what this diagram illustrates.
Rules:
- Be specific about the relationships, steps, or comparisons shown.
- Do NOT start with "This diagram", "This chart", or "The diagram".
- Do NOT include quotes or punctuation beyond a period.
- Respond with ONLY the caption sentence.`

export interface DiagramCaptionResult {
  caption: string
  inputTokens: number
  outputTokens: number
  cost: number
}

export async function generateDiagramCaption(opts: {
  articleTopic: string
  sectionTitle: string
  diagramType: string
  mermaidSyntax: string
  jobId: string
  position: number
}): Promise<DiagramCaptionResult> {
  const adapter = getLLMAdapter(PROVIDER)
  const userPrompt = USER_TEMPLATE
    .replace('{{articleTopic}}', opts.articleTopic)
    .replace('{{sectionTitle}}', opts.sectionTitle)
    .replace('{{diagramType}}', opts.diagramType)
    .replace('{{syntaxExcerpt}}', opts.mermaidSyntax.slice(0, MAX_SYNTAX))

  try {
    const run = await adapter.call({
      systemPrompt: SYSTEM,
      userPrompt,
      model: MODEL,
      temperature: 0.3,
      maxTokens: 128,
    })
    const raw = cleanTextOutput(run.content).trim().replace(/^["']|["']$/g, '')
    const caption = raw && raw.toLowerCase() !== 'null' ? raw : `Diagram: ${opts.sectionTitle}`
    return {
      caption,
      inputTokens: run.tokens.input,
      outputTokens: run.tokens.output,
      cost: run.cost,
    }
  } catch (err) {
    logger.warn(
      { jobId: opts.jobId, position: opts.position, err },
      '[enrichment] caption-gen failed — using fallback',
    )
    return { caption: `Diagram: ${opts.sectionTitle}`, inputTokens: 0, outputTokens: 0, cost: 0 }
  }
}
