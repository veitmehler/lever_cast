import type { BrandSettings, CitationEntry, PipelineStep, SitePage } from './types'

/** Convert HTML article body to Markdown for LLM-readable review text. */
function htmlToMarkdown(html: string): string {
  return html
    // Headings — strip inner tags to get plain heading text
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_, c) => `\n# ${c.replace(/<[^>]+>/g, '').trim()}\n\n`)
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_, c) => `\n## ${c.replace(/<[^>]+>/g, '').trim()}\n\n`)
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_, c) => `\n### ${c.replace(/<[^>]+>/g, '').trim()}\n\n`)
    .replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, (_, c) => `\n#### ${c.replace(/<[^>]+>/g, '').trim()}\n\n`)
    .replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi, (_, c) => `\n##### ${c.replace(/<[^>]+>/g, '').trim()}\n\n`)
    .replace(/<h6[^>]*>([\s\S]*?)<\/h6>/gi, (_, c) => `\n###### ${c.replace(/<[^>]+>/g, '').trim()}\n\n`)
    // Inline formatting (before tag stripping)
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*')
    // Links
    .replace(/<a[^>]+href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')
    // List items (strip inner tags for clean bullet text)
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, c) => `- ${c.replace(/<[^>]+>/g, '').trim()}\n`)
    // Paragraphs
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<p[^>]*>/gi, '')
    // Block-level containers — just ensure newlines around them
    .replace(/<\/?(?:ul|ol|blockquote|div|section|article|figure)[^>]*>/gi, '\n')
    // Line breaks
    .replace(/<br\s*\/?>/gi, '\n')
    // Strip all remaining tags
    .replace(/<[^>]+>/g, '')
    // HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // Collapse 3+ consecutive newlines to 2
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * Like htmlToMarkdown but converts <figure class="article-diagram"> blocks
 * into clean markdown image references: ![caption](src).
 * This keeps the review text free of raw SVG XML while still referencing
 * each diagram so evaluators (and Google tools) can follow the link.
 */
export function htmlToMarkdownWithDiagrams(html: string): string {
  const tokens: string[] = []
  const withPlaceholders = html.replace(
    /<figure\s[^>]*class="[^"]*article-diagram[^"]*"[^>]*>([\s\S]*?)<\/figure>/gi,
    (_fullMatch, inner: string) => {
      const srcMatch = inner.match(/\bsrc="([^"]+)"/)
      const altMatch = inner.match(/\balt="([^"]*)"/)
      const captionMatch = inner.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i)
      const src = srcMatch?.[1] ?? ''
      // Use the img alt attribute (short visual description) for the Markdown alt text.
      // Fall back to the figcaption text only when no alt attribute is present.
      const altText = altMatch?.[1]?.trim() || captionMatch?.[1]?.replace(/<[^>]+>/g, '').trim() || 'Diagram'
      const captionText = captionMatch?.[1]?.replace(/<[^>]+>/g, '').trim() ?? ''
      // Append the figcaption as an italic line below the image so Google sees both
      // the concise visual alt and the explanatory caption in the review text.
      const captionLine = captionText ? `\n*${captionText}*` : ''
      const replacement = src
        ? `\n\n![${altText}](${src})${captionLine}\n\n`
        : `\n\n*[Diagram: ${altText}]*${captionLine}\n\n`
      const token = `@@DIAGRAM_${tokens.length}@@`
      tokens.push(replacement)
      return token
    },
  )

  // Strip any raw <svg>…</svg> blocks that weren't wrapped in article-diagram figures.
  // These can appear from LLM-generated HTML or entity-decoded markup and would otherwise
  // produce massive XML noise in the review textarea.
  const svgStripped = withPlaceholders.replace(/<svg[\s\S]*?<\/svg>/gi, '')

  let markdown = htmlToMarkdown(svgStripped)

  for (let i = 0; i < tokens.length; i++) {
    markdown = markdown.replace(`@@DIAGRAM_${i}@@`, tokens[i])
  }

  return markdown.replace(/\n{3,}/g, '\n\n').trim()
}

function stripJsonMarkdownFences(text: string): string {
  const t = text.trim()
  const fenced = t.match(/^```(?:json)?\s*([\s\S]*?)```\s*$/i)
  return fenced ? fenced[1].trim() : t
}

interface ParsedCitation {
  title: string
  url: string
  source_type: 'inline' | 'reference'
}

function parseCitationsFlat(raw: unknown): ParsedCitation[] {
  if (!raw) return []
  try {
    let data: unknown =
      typeof raw === 'string' ? JSON.parse(stripJsonMarkdownFences(raw)) : raw
    if (typeof data === 'string') {
      data = JSON.parse(stripJsonMarkdownFences(data))
    }

    const obj = data as Record<string, unknown>

    // Two-tier format: { inline_sources: [...], resource_links: [...] }
    if (obj && !Array.isArray(data) && (Array.isArray(obj.inline_sources) || Array.isArray(obj.resource_links))) {
      const result: ParsedCitation[] = []
      if (Array.isArray(obj.inline_sources)) {
        for (const s of obj.inline_sources as CitationEntry[]) {
          const url = s.link_url ?? s.url ?? ''
          if (url) result.push({ title: s.link_title ?? s.title ?? '', url, source_type: 'inline' })
        }
      }
      if (Array.isArray(obj.resource_links)) {
        for (const s of obj.resource_links as CitationEntry[]) {
          const url = s.link_url ?? s.linkUrl ?? s.url ?? ''
          if (url) result.push({ title: s.link_title ?? s.linkTitle ?? s.title ?? '', url, source_type: 'reference' })
        }
      }
      return result
    }

    // Legacy flat format
    const links: CitationEntry[] = Array.isArray(data)
      ? (data as CitationEntry[])
      : Array.isArray(obj.resource_links)
        ? (obj.resource_links as CitationEntry[])
        : Array.isArray(obj.links)
          ? (obj.links as CitationEntry[])
          : []

    const pickUrl = (c: CitationEntry) =>
      c.link_url ?? c.linkUrl ?? c.url ?? c.sourceUrl ?? c.href ?? c.link_href ?? ''

    return links
      .filter((c) => pickUrl(c).length > 0)
      .map((c) => ({
        title: c.link_title ?? c.linkTitle ?? c.title ?? c.sourceTitle ?? '',
        url: pickUrl(c),
        source_type: 'reference' as const,
      }))
  } catch {
    return []
  }
}

/**
 * Resolve citations with a three-level fallback:
 *   1. sitePage.citations (populated after approval), when SitePage exists
 *   2. step 12 pipeline output (available from the moment step 12 completes)
 *   3. Any other completed step whose output contains resource_links JSON
 */
export function resolveCitations(
  sp: SitePage | null | undefined,
  pipelineSteps: PipelineStep[],
): ParsedCitation[] {
  if (sp) {
    const fromSitePage = parseCitationsFlat(sp.citations)
    if (fromSitePage.length > 0) return fromSitePage
  }

  const step12 = pipelineSteps.find(
    (s) => Number(s.stepNumber) === 12 && s.status === 'completed',
  )
  const fromStep12 = parseCitationsFlat(step12?.output)
  if (fromStep12.length > 0) return fromStep12

  // Fallback: scan all completed step outputs for resource_links
  for (const step of pipelineSteps) {
    if (step.status !== 'completed' || !step.output) continue
    const found = parseCitationsFlat(step.output)
    if (found.length > 0) return found
  }

  return []
}

/**
 * Resolve the best available article title from the current pipeline run.
 *
 * Canonical title is Step 0 (`generate_title`); SEO title may shorten it for SERPs.
 * Review panels use this string so pasted copies match the article headline intent.
 *
 * Fallback: SitePage seoTitle/title then topic-derived values.
 */
export function resolveBestTitle(
  sp: SitePage,
  pipelineSteps: PipelineStep[],
  _isApproving: boolean,
): string {
  const step0Output = pipelineSteps.find((s) => s.stepNumber === 0 && s.status === 'completed')?.output?.trim()

  if (step0Output) return step0Output

  return sp.seoTitle ?? sp.title ?? ''
}

export function buildReviewText(
  sp: SitePage,
  pipelineSteps: PipelineStep[],
  brand: BrandSettings,
  isApproving: boolean,
): string {
  // Resolve article body: sitePage.bodyHtml → step 11 → step 9
  const bodySource =
    sp.bodyHtml?.trim() ||
    pipelineSteps.find((s) => s.stepNumber === 11 && s.status === 'completed')?.output?.trim() ||
    pipelineSteps.find((s) => s.stepNumber === 9  && s.status === 'completed')?.output?.trim() ||
    ''
  const bodyMarkdown = bodySource ? htmlToMarkdown(bodySource) : '[Article body not yet available]'

  const title = resolveBestTitle(sp, pipelineSteps, isApproving)
  const citations = resolveCitations(sp, pipelineSteps)

  // Only show Tier 2 (Step 12 curated references) in the review text.
  // Tier 1 inline sources are already visible as <a> links in the body — listing them
  // separately as a bibliography block risks a spam penalty for unfiltered link stuffing.
  const tier2 = citations.filter((c) => c.source_type === 'reference')
  const displayCitations = tier2.length > 0 ? tier2 : citations
  const citationLines = displayCitations.length > 0
    ? displayCitations.map((c) => `- [${c.title}](${c.url})`).join('\n')
    : '[No citations available for this article]'

  return `# Evaluation Request

Does this article comply with and satisfy:

1. Google's "People First" principles
2. Google's E-E-A-T framework
3. Google's Helpful Content guidelines and rules?

---

# ${title}

${bodyMarkdown}

---

## Author

**Name:** ${brand.defaultAuthorName ?? ''}
**Bio:** ${brand.ourExperience ?? ''}
**Website:** ${brand.defaultAuthorWebsite ?? ''}
**LinkedIn:** ${brand.defaultAuthorLinkedIn?.trim() ?? ''}

---

## Citations

${citationLines}`
}

/**
 * Like buildReviewText but converts diagram <figure> blocks into clean
 * markdown image references: ![caption](cdn-url). Keeps the review text free
 * of raw SVG XML for Google evaluation tools.
 */
export function buildFinalReviewText(
  sp: SitePage,
  pipelineSteps: PipelineStep[],
  brand: BrandSettings,
  isApproving: boolean,
): string {
  const bodySource =
    sp.bodyHtml?.trim() ||
    pipelineSteps.find((s) => s.stepNumber === 11 && s.status === 'completed')?.output?.trim() ||
    pipelineSteps.find((s) => s.stepNumber === 9  && s.status === 'completed')?.output?.trim() ||
    ''

  const bodyMarkdown = bodySource
    ? htmlToMarkdownWithDiagrams(bodySource)
    : '[Article body not yet available]'

  const title = resolveBestTitle(sp, pipelineSteps, isApproving)
  const citations = resolveCitations(sp, pipelineSteps)

  // Only show Tier 2 (Step 12 curated references) in the review text.
  // Tier 1 inline sources are already visible as <a> links in the body.
  const tier2 = citations.filter((c) => c.source_type === 'reference')
  const displayCitations = tier2.length > 0 ? tier2 : citations
  const citationLines = displayCitations.length > 0
    ? displayCitations.map((c) => `- [${c.title}](${c.url})`).join('\n')
    : '[No citations available for this article]'

  const citationsBlock = `## Citations\n\n${citationLines}`

  const disclaimerSection = sp.disclaimer?.trim()
    ? `\n---\n\n## Article Disclaimer\n\n${sp.disclaimer.trim()}`
    : ''

  const schemaSection = sp.schemaJson?.trim()
    ? `\n---\n\n## Schema Markup\n\n\`\`\`json\n${sp.schemaJson.trim()}\n\`\`\``
    : ''

  return `# Evaluation Request

Does this article comply with and satisfy:

1. Google's "People First" principles
2. Google's E-E-A-T framework
3. Google's Helpful Content guidelines and rules?

---

# ${title}

${bodyMarkdown}

---

## Author

**Name:** ${brand.defaultAuthorName ?? ''}
**Bio:** ${brand.ourExperience ?? ''}
**Website:** ${brand.defaultAuthorWebsite ?? ''}
**LinkedIn:** ${brand.defaultAuthorLinkedIn?.trim() ?? ''}

---

${citationsBlock}${disclaimerSection}${schemaSection}`
}

/** Pretty-print JSON-LD for the schema review panel; falls back to raw string if not valid JSON. */
export function formatSchemaJsonDisplay(raw: string | null | undefined): string {
  if (!raw?.trim()) return ''
  try {
    return JSON.stringify(JSON.parse(raw), null, 2)
  } catch {
    return raw.trim()
  }
}
