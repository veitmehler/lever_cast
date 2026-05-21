import { getLLMAdapter } from '../llm/factory'
import { cleanTextOutput } from '../output-cleaner'
import { logger } from '../../lib/logger'

const PROVIDER = 'anthropic'
const MODEL = 'claude-haiku-4-5'
const MAX_SYNTAX = 600

const SYSTEM =
  'You produce two descriptions for data visualisation diagrams: ' +
  'a short accessibility alt text and a visible caption. ' +
  'You respond with valid JSON only — no markdown, no code fences.'

const USER_TEMPLATE =
  `Article topic: {{articleTopic}}
Section heading: {{sectionTitle}}
Diagram type: {{diagramType}}
Mermaid syntax (excerpt):
{{syntaxExcerpt}}

Return a JSON object with exactly two fields:

"altText": Under 100 characters. Describe the diagram so someone could sketch it from your words alone. State the diagram type and its subject — nothing more. Do NOT list individual steps, nodes, or data points. The detailed explanation belongs in the caption, not here.

"caption": One sentence (15–25 words) explaining what the diagram means or what insight it conveys. Do NOT start with "This diagram", "This chart", or "The diagram".

GOOD altText examples (note: varied connectors, no filler words):
- "Flowchart tracing five stages of chiropractic spinal assessment"
- "Mindmap of six ergonomic risk factors at a desk workstation"
- "State diagram comparing a pain cycle loop to a recovery path"
- "Diagram of a person demonstrating proper lifting with bent knees"

BAD altText — do NOT do these:
- Uses "showing" (filler word): "Flowchart showing five stages of chiropractic spinal assessment"
- Lists individual steps: "Proper lifting technique requires standing close, bending knees, engaging core, maintaining neutral spine, holding close to chest, and lifting with legs."

Rules:
- altText: visual description only, under 100 characters, never list individual steps or nodes.
- Do NOT use the word "showing" — use a specific connector instead: of, tracing, comparing, mapping, illustrating, linking, branching into.
- caption: meaning and insight, shown as visible text below the diagram.
- Respond with ONLY valid JSON — no markdown, no code fences.

Example output:
{"altText": "Flowchart tracing five stages of chiropractic spinal assessment", "caption": "Progressive spinal evaluation identifies misalignment severity and guides the appropriate adjustment technique for each patient."}`

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
