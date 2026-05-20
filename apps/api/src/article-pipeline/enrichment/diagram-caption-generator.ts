import { getLLMAdapter } from '../llm/factory'
import { cleanTextOutput } from '../output-cleaner'
import { logger } from '../../lib/logger'

const PROVIDER = 'anthropic'
const MODEL = 'claude-haiku-4-5'
const MAX_SYNTAX = 600

const SYSTEM =
  'You produce two descriptions for data visualisation diagrams embedded in articles: ' +
  'a concise accessibility alt text describing the visual, and a caption explaining what the diagram illustrates. ' +
  'You respond with valid JSON only — no markdown, no code fences.'

const USER_TEMPLATE =
  `Article topic: {{articleTopic}}
Section heading: {{sectionTitle}}
Diagram type: {{diagramType}}
Mermaid syntax (excerpt):
{{syntaxExcerpt}}

Produce a JSON object with exactly two fields:

1. "altText": 8–15 words describing what the diagram LOOKS LIKE visually. Start with the diagram type (e.g. "Flowchart showing…", "Mindmap of…", "Class diagram comparing…"). Describe the key elements shown — NOT the meaning or section content. This is read by screen readers.

2. "caption": One sentence (15–25 words) explaining what the diagram ILLUSTRATES or what insight it conveys. Do NOT start with "This diagram", "This chart", or "The diagram".

Rules:
- altText must describe the visual structure only, not summarise the article section.
- caption should explain the relationships, steps, or comparisons depicted.
- Respond with ONLY valid JSON — no markdown, no code fences.

Example:
{"altText": "Flowchart showing five stages from pregnancy changes through chiropractor assessment to restored pelvic balance", "caption": "Pregnancy-induced weight shifts and ligament softening create pelvic instability that targeted chiropractic adjustments can progressively restore."}`

export interface DiagramCaptionResult {
  altText: string
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

  const fallbackAltText = `${opts.diagramType.charAt(0).toUpperCase() + opts.diagramType.slice(1)} diagram: ${opts.sectionTitle}`
  const fallbackCaption = `Diagram: ${opts.sectionTitle}`

  try {
    const run = await adapter.call({
      systemPrompt: SYSTEM,
      userPrompt,
      model: MODEL,
      temperature: 0.3,
      maxTokens: 200,
    })

    let altText = fallbackAltText
    let caption = fallbackCaption

    try {
      // Strip accidental code fences before parsing
      const cleaned = cleanTextOutput(run.content).trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
      const parsed = JSON.parse(cleaned) as Record<string, unknown>
      if (typeof parsed.altText === 'string' && parsed.altText.trim()) {
        altText = parsed.altText.trim()
      }
      if (typeof parsed.caption === 'string' && parsed.caption.trim()) {
        caption = parsed.caption.trim()
      }
    } catch {
      logger.warn(
        { jobId: opts.jobId, position: opts.position, raw: run.content },
        '[enrichment] caption-gen JSON parse failed — using fallbacks',
      )
    }

    return { altText, caption, inputTokens: run.tokens.input, outputTokens: run.tokens.output, cost: run.cost }
  } catch (err) {
    logger.warn(
      { jobId: opts.jobId, position: opts.position, err },
      '[enrichment] caption-gen failed — using fallback',
    )
    return { altText: fallbackAltText, caption: fallbackCaption, inputTokens: 0, outputTokens: 0, cost: 0 }
  }
}
