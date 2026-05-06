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
  h2StartOffset: number   // byte index where <h2 ...> begins
  afterH2Offset: number // byte index in bodyHtml immediately after the </h2> closing tag
}

export interface TocEntry {
  level: 2 | 3
  text: string
  anchor: string
}

export function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, '').trim()
}

export function slugify(text: string): string {
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

  const matches: Array<{ start: number; end: number; innerHtml: string }> = []
  const re = /<h2(?:[^>]*)>([\s\S]*?)<\/h2>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(bodyHtml)) !== null) {
    matches.push({ start: m.index, end: m.index + m[0].length, innerHtml: m[1] })
  }

  for (let i = 0; i < matches.length; i++) {
    const cur = matches[i]
    const next = matches[i + 1]
    const sectionEnd = next ? next.start : bodyHtml.length
    const sectionHtml = bodyHtml.slice(cur.start, sectionEnd)
    const heading = stripTags(cur.innerHtml)

    sections.push({
      position: i + 1,
      anchor: slugify(heading),
      heading,
      sectionHtml,
      h2StartOffset: cur.start,
      afterH2Offset: cur.end,
    })
  }

  return sections
}

/**
 * Rebuild bodyHtml with diagram figures inserted after each <h2> opening block
 * (immediately after </h2>).
 */
export function buildEnrichedHtml(
  bodyHtml: string,
  diagrams: Array<{ afterH2Offset: number; figureHtml: string }>,
): string {
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

/**
 * Ensure every h2 and h3 has an id for TOC anchors. Preserves existing ids.
 */
export function injectHeadingIds(html: string): string {
  const used = new Set<string>()
  let n = 0
  return html.replace(
    /<h([23])((?:\s[^>]*)?)>([\s\S]*?)<\/h\1>/gi,
    (full, level: string, attrs: string, inner: string) => {
      if (/\bid\s*=/i.test(attrs)) return full
      const text = stripTags(inner)
      let base = slugify(text) || `heading-${n}`
      n++
      let id = base
      let c = 2
      while (used.has(id)) {
        id = `${base}-${c}`
        c++
      }
      used.add(id)
      const newAttrs = attrs.trim() ? `${attrs} id="${escapeAttr(id)}"` : ` id="${escapeAttr(id)}"`
      return `<h${level}${newAttrs}>${inner}</h${level}>`
    },
  )
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

/** Regex-based heading extraction — run after injectHeadingIds for stable anchors. */
export function extractHeadingsForToc(html: string): TocEntry[] {
  const entries: TocEntry[] = []
  const re = /<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    const level = (m[1] === '2' ? 2 : 3) as 2 | 3
    const idM = /\bid="([^"]+)"/i.exec(m[2])
    const anchor = idM?.[1] ?? slugify(stripTags(m[3]))
    const text = stripTags(m[3])
    if (text) entries.push({ level, text, anchor })
  }
  return entries
}

/**
 * Nested TOC: each h2 is a top-level item; following h3s go in a nested ul until next h2.
 */
export function buildTocHtml(entries: TocEntry[]): string {
  if (entries.length === 0) return ''
  let inner = '<ul>\n'
  let i = 0
  while (i < entries.length) {
    const e = entries[i]
    if (e.level === 3) {
      i++
      continue
    }
    inner += `  <li><a href="#${escapeAttr(e.anchor)}">${escapeHtml(e.text)}</a>`
    const sub: TocEntry[] = []
    let j = i + 1
    while (j < entries.length && entries[j].level === 3) {
      sub.push(entries[j])
      j++
    }
    if (sub.length > 0) {
      inner += '\n    <ul>\n'
      for (const s of sub) {
        inner += `      <li><a href="#${escapeAttr(s.anchor)}">${escapeHtml(s.text)}</a></li>\n`
      }
      inner += '    </ul>\n  '
    }
    inner += '</li>\n'
    i = j
  }
  inner += '</ul>'

  return `<nav class="article-toc" aria-label="Table of Contents">\n  <details>\n    <summary>Table of Contents</summary>\n    ${inner}\n  </details>\n</nav>`
}

/**
 * Insert Key Takeaways + TOC after introduction (before first content h2).
 * `firstBodyH2Index` is the index in `html` where the first <h2 of the article body starts
 * (geo-restructured content). If -1, appends at end.
 */
export function prependTakeawaysAndToc(
  html: string,
  insertOffset: number,
  keyTakeawaysBlock: string,
  tocBlock: string,
): string {
  if (insertOffset <= 0) {
    return keyTakeawaysBlock + '\n' + tocBlock + '\n' + html
  }
  return (
    html.slice(0, insertOffset) +
    keyTakeawaysBlock +
    '\n' +
    tocBlock +
    '\n' +
    html.slice(insertOffset)
  )
}

/** Find byte offset of first <h2 in html (case-insensitive), or -1 */
export function findFirstH2Index(html: string): number {
  const m = /<h2(?:\s|>)/i.exec(html)
  return m ? m.index : -1
}
