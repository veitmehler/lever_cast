import { getLLMAdapter } from '../llm/factory'
import { cleanTextOutput } from '../output-cleaner'
import { logger } from '../../lib/logger'
import { sanitizeDashesText } from '../../lib/text/dash-sanitizer'

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

Return a JSON object with exactly two fields. The two fields serve DIFFERENT purposes — never repeat the same words or ideas in both:

"altText": For screen readers. State the diagram type and its visual subject in 60–80 characters. A noun phrase — no insight, no explanation. Always write a grammatically complete phrase, never cut off mid-word.

"caption": For sighted readers. One sentence (15–25 words) explaining the insight or meaning the diagram conveys. Do NOT start with "This diagram", "This chart", or "The diagram". Do NOT restate what the altText already says.

GOOD pair (no overlap — altText is visual, caption is insight):
- altText: "Flowchart tracing five stages of chiropractic spinal assessment"
- caption: "Progressive spinal evaluation identifies misalignment severity and guides the appropriate adjustment technique for each patient."

BAD pair (redundant — both say "five stages" and "assessment/adjustment"):
- altText: "Flowchart tracing five stages of spinal assessment from intake to adjustment"
- caption: "Progressive spinal evaluation traces five stages from intake to the appropriate adjustment technique."

More GOOD altText examples (60–80 chars, diagram type + subject noun phrase):
- "Mindmap of six ergonomic risk factors at a desk workstation"
- "State diagram comparing a pain cycle loop to a recovery path"
- "Class diagram linking cervicogenic headache origins to treatment pathways"

Rules:
- altText: diagram type + visual subject only, 60–80 characters, no insight words.
- Do NOT use the word "showing" — use: of, tracing, comparing, mapping, linking, branching into.
- caption: meaning and insight only, 15–25 words, no repetition of altText content.
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

    altText = await sanitizeDashesText(altText, { jobId: opts.jobId, surface: 'diagram_alt' })
    caption = await sanitizeDashesText(caption, { jobId: opts.jobId, surface: 'diagram_caption' })

    return { altText, caption, inputTokens: run.tokens.input, outputTokens: run.tokens.output, cost: run.cost }
  } catch (err) {
    logger.warn(
      { jobId: opts.jobId, position: opts.position, err },
      '[enrichment] caption-gen failed — using fallback',
    )
    return { altText: fallbackAltText, caption: fallbackCaption, inputTokens: 0, outputTokens: 0, cost: 0 }
  }
}
