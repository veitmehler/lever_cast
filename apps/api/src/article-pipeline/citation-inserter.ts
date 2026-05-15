/**
 * Inline citation inserter.
 *
 * Takes the article HTML and a list of validated citations, then calls the
 * LLM (step 110 — insert_inline_citations) to wrap relevant text passages
 * in <a> tags that link to the citation source.
 *
 * Safety guarantees (enforced in post-processing regardless of LLM output):
 *  - Each citation URL appears AT MOST ONCE in the returned HTML
 *  - If the LLM drops H2 headings, we discard its output and return the original
 */

import { logger } from '../lib/logger'
import { StepRunner } from './step-runner'
import type { PipelineContext } from './variable-resolver'
import type { ValidatedCitation } from './citation-validator'

/** Count occurrences of a substring in a string. */
function countOccurrences(haystack: string, needle: string): number {
  let count = 0
  let pos = 0
  while ((pos = haystack.indexOf(needle, pos)) !== -1) {
    count++
    pos += needle.length
  }
  return count
}

/** Count <h2 elements in an HTML string (rough but reliable). */
function countH2s(html: string): number {
  return (html.match(/<h2[\s>]/gi) ?? []).length
}

/**
 * Strip duplicate <a href="url"> tags for a given URL, keeping only the first
 * occurrence. Works by replacing all but the first complete <a ...>...</a>
 * wrapping that exact href.
 */
function deduplicateCitationLinks(html: string, url: string): string {
  // Escape url for use in regex
  const escaped = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  // Match <a> tags whose href attribute is exactly this URL (with optional quotes)
  const anchorRe = new RegExp(
    `<a\\b[^>]*href=["']?${escaped}["']?[^>]*>[\\s\\S]*?<\\/a>`,
    'gi',
  )
  let firstSeen = false
  return html.replace(anchorRe, (match) => {
    if (!firstSeen) {
      firstSeen = true
      return match // keep the first occurrence
    }
    // For subsequent occurrences, strip the <a> wrapper and keep the inner text
    return match.replace(/<a\b[^>]*>/gi, '').replace(/<\/a>/gi, '')
  })
}

/**
 * Insert validated citations as inline hyperlinks into the article HTML.
 *
 * @param articleHtml     The article body HTML (step 11 output)
 * @param liveCitations   Citations that passed URL validation (valid + uncertain)
 * @param jobId           For logging
 * @param ctx             Pipeline context for StepRunner
 */
export async function insertInlineCitations(
  articleHtml: string,
  liveCitations: ValidatedCitation[],
  jobId: string,
  ctx: PipelineContext,
): Promise<{ linkedHtml: string; insertedCount: number }> {
  if (liveCitations.length === 0) {
    return { linkedHtml: articleHtml, insertedCount: 0 }
  }

  // Store citations in context so the variable resolver can inject them as {{validated_citations}}
  ctx.completedSteps.set(110, JSON.stringify(liveCitations))

  const runner = new StepRunner(jobId, 110, ctx)
  let result: Awaited<ReturnType<typeof runner.execute>>
  try {
    result = await runner.execute()
  } catch (err) {
    logger.error({ jobId, err }, '[citation-inserter] LLM call failed — returning original HTML')
    throw err
  }

  let linkedHtml = result.output.trim()

  // Strip any markdown code fences the LLM may have wrapped the HTML in
  linkedHtml = linkedHtml
    .replace(/^```(?:html)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()

  // Safety check: if the LLM dropped H2 headings, its output is corrupt — discard it
  const originalH2Count = countH2s(articleHtml)
  const linkedH2Count = countH2s(linkedHtml)
  if (originalH2Count > 0 && linkedH2Count < originalH2Count) {
    logger.warn(
      { jobId, originalH2Count, linkedH2Count },
      '[citation-inserter] LLM dropped H2 headings — discarding output, using original HTML',
    )
    return { linkedHtml: articleHtml, insertedCount: 0 }
  }

  // Post-processing: enforce the "each URL at most once" rule
  for (const citation of liveCitations) {
    if (countOccurrences(linkedHtml, citation.url) > 1) {
      linkedHtml = deduplicateCitationLinks(linkedHtml, citation.url)
    }
  }

  // Count how many citation URLs actually appear in the final HTML
  const insertedCount = liveCitations.filter((c) =>
    linkedHtml.includes(c.url),
  ).length

  logger.info({ jobId, insertedCount, total: liveCitations.length }, '[citation-inserter] done')

  return { linkedHtml, insertedCount }
}
