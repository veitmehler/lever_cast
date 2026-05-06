/**
 * GEO blocks, key takeaways, and TOC confuse full-doc ProseMirror/TipTap parsers.
 * We replace these with placeholders in the editable HTML and splice them back on save.
 */

const SELECTORS = ['nav.article-toc', '.key-takeaways', '.geo-summary'] as const

function islandLabel(el: Element): string {
  if (el.matches('nav.article-toc')) return 'Table of contents'
  if (el.matches('.key-takeaways')) return 'Key takeaways'
  if (el.matches('.geo-summary')) return 'Featured answer'
  return 'Preserved block'
}

/** Escape literal string for regex */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function stripPreservedArticleBlocks(html: string): {
  editorHtml: string
  islands: Record<string, { html: string; label: string }>
} {
  if (typeof document === 'undefined') {
    return { editorHtml: html, islands: {} }
  }
  if (!html.trim()) {
    return { editorHtml: html, islands: {} }
  }
  const tpl = document.implementation.createHTMLDocument('')
  const container = tpl.createElement('div')
  container.innerHTML = html

  const islands: Record<string, { html: string; label: string }> = {}
  let idx = 0

  let found: Element | null
  while ((found = container.querySelector(SELECTORS.join(', ')))) {
    const id = `slpisle-${idx++}`
    islands[id] = { html: found.outerHTML, label: islandLabel(found) }
    const marker = tpl.createElement('div')
    marker.setAttribute('data-socioply-island', id)
    marker.setAttribute('data-island-label', islands[id].label)
    marker.classList.add('socioply-island-marker')
    found.replaceWith(marker)
  }

  return { editorHtml: container.innerHTML, islands }
}

export function restorePreservedArticleBlocks(
  editorHtml: string,
  islands: Record<string, { html: string; label: string }>,
): string {
  let out = editorHtml
  for (const [id, { html }] of Object.entries(islands)) {
    const markerRe = new RegExp(
      `<div[^>]*data-socioply-island="${escapeRegex(id)}"[^>]*>(?:<!--[^>]*-->|\\s*)*</div>`,
      'gi',
    )
    const markerReBare = new RegExp(
      `<div[^>]*data-socioply-island="${escapeRegex(id)}"[^>]*/>`,
      'gi',
    )
    out = out.replace(markerRe, html)
    out = out.replace(markerReBare, html)
  }
  return out
}
