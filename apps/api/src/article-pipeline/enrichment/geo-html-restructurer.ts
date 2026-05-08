import type { H2Section } from './html-parser'
import { extractH2Sections, stripTags, slugify } from './html-parser'

export interface GeoSectionData {
  position: number
  question: string
  summary?: string | null
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** h3 opening/closing tags → h4 within a string (simple replace, good enough for article HTML) */
function demoteH3ToH4(fragment: string): string {
  return fragment.replace(/<\/h3\s*>/gi, '</h4>').replace(/<h3(\s[^>]*)?>/gi, '<h4$1>')
}

/**
 * Replace each H2 section that has GEO data: insert question H2 + optional summary,
 * demote original H2 to H3, demote inner h3→h4.
 * Processes from last section to first so string replacement stays aligned.
 */
export function restructureHtmlWithGeo(
  bodyHtml: string,
  _sections: H2Section[],
  geoByPosition: Map<number, GeoSectionData>,
): string {
  let result = bodyHtml
  const n = extractH2Sections(result).length
  for (let idx = n - 1; idx >= 0; idx--) {
    const pos = idx + 1
    const geo = geoByPosition.get(pos)
    const q = geo?.question?.trim()
    if (!q || q.toLowerCase() === 'null') continue

    const secsNow = extractH2Sections(result)
    const cur = secsNow[idx]
    if (!cur) continue

    const h2Match = cur.sectionHtml.match(/^<h2[^>]*>([\s\S]*?)<\/h2>/i)
    if (!h2Match) continue
    const titleInner = h2Match[1]
    const afterFirstH2 = cur.sectionHtml.slice(h2Match[0].length)
    const demotedRest = demoteH3ToH4(afterFirstH2)
    const anchor = `${cur.anchor}-${pos}`
    const qEsc = escapeHtml(q)
    const summaryBlock =
      geo.summary?.trim()
        ? `\n<div class="geo-summary" data-question="${qEsc}"><p>${escapeHtml(geo.summary.trim())}</p></div>\n`
        : '\n'

    const newSection =
      `<h2 id="geo-${slugify(q)}-${pos}">${q}</h2>${summaryBlock}` +
      `<h3 id="sec-${anchor}">${titleInner}</h3>` +
      demotedRest

    const start = result.indexOf(cur.sectionHtml)
    if (start === -1) continue
    result = result.slice(0, start) + newSection + result.slice(start + cur.sectionHtml.length)
  }
  return result
}
