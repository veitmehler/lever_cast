/**
 * HTML section parser for the enrichment phase.
 *
 * Extracts `<h2>` sections from article bodyHtml so each section can receive
 * a Mermaid diagram.  After diagram generation, buildEnrichedHtml() inserts
 * the `<figure>` blocks back into the HTML without touching any other content.
 */

export interface H2Section {
  position: number    // 1-based index among all h2 tags
  anchor: string      // URL-safe slug derived from heading text
  heading: string     // plain text heading (HTML tags stripped)
  sectionHtml: string // HTML from this <h2> up to (but not including) the next <h2>
  afterH2Offset: number // byte index in bodyHtml immediately after the </h2> closing tag
}

const H2_RE = /<h2(?:[^>]*)>([\s\S]*?)<\/h2>/gi

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, '').trim()
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || 'section'
}

/** Parse bodyHtml and return one H2Section per `<h2>` tag found. */
export function extractH2Sections(bodyHtml: string): H2Section[] {
  const sections: H2Section[] = []

  // Collect all h2 match positions first
  const matches: Array<{ start: number; end: number; innerHtml: string }> = []
  const re = /<h2(?:[^>]*)>([\s\S]*?)<\/h2>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(bodyHtml)) !== null) {
    matches.push({ start: m.index, end: m.index + m[0].length, innerHtml: m[1] })
  }

  for (let i = 0; i < matches.length; i++) {
    const cur  = matches[i]
    const next = matches[i + 1]
    const sectionEnd = next ? next.start : bodyHtml.length
    const sectionHtml = bodyHtml.slice(cur.start, sectionEnd)
    const heading = stripTags(cur.innerHtml)

    sections.push({
      position: i + 1,
      anchor: slugify(heading),
      heading,
      sectionHtml,
      afterH2Offset: cur.end,
    })
  }

  return sections
}

/**
 * Rebuild bodyHtml with diagram figures inserted after each <h2>.
 *
 * `diagrams` is a sparse list — only sections that produced a diagram are
 * included.  Insertions are applied from back to front so byte offsets stay
 * valid throughout.
 */
export function buildEnrichedHtml(
  bodyHtml: string,
  diagrams: Array<{ afterH2Offset: number; figureHtml: string }>,
): string {
  // Sort descending by offset so earlier insertions don't shift later ones
  const sorted = [...diagrams].sort((a, b) => b.afterH2Offset - a.afterH2Offset)
  let result = bodyHtml
  for (const { afterH2Offset, figureHtml } of sorted) {
    result =
      result.slice(0, afterH2Offset) +
      '\n' +
      figureHtml +
      '\n' +
      result.slice(afterH2Offset)
  }
  return result
}

/** Build the HTML for a diagram figure block. */
export function buildFigureHtml(opts: {
  imgUrl: string
  alt: string
  caption?: string | null
}): string {
  const cap = opts.caption
    ? `<figcaption>${escapeHtml(opts.caption)}</figcaption>`
    : ''
  return `<figure class="article-diagram">\n  <img src="${opts.imgUrl}" alt="${escapeHtml(opts.alt)}" loading="lazy" />\n  ${cap}\n</figure>`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
