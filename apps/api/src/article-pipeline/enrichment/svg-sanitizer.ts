/**
 * Strip executable content from SVG before upload or embedding.
 *
 * Mermaid syntax cannot produce <script> tags or event handlers, but we
 * sanitize defensively in case of future mmdc version changes or LLM
 * injection via crafted node labels.
 */

export function sanitizeSvg(svg: string): string {
  return svg
    // Remove <script> blocks (including multiline)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    // Remove on* event handlers (onclick, onload, onerror, etc.)
    .replace(/\s+on\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/\s+on\w+\s*=\s*'[^']*'/gi, '')
    // Remove javascript: URLs in href / xlink:href
    .replace(/(href\s*=\s*")javascript:[^"]*"/gi, '$1#"')
    .replace(/(href\s*=\s*')javascript:[^']*'/gi, "$1#'")
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Inject WCAG accessibility metadata into a Mermaid-generated SVG.
 *
 * Adds:
 *  - <title> (diagram caption or section heading) for screen-reader label
 *  - <desc>  (section heading) as a longer description
 *  - role="img" on the root <svg> element
 *  - aria-labelledby pointing to the injected <title> id
 */
export function addSvgAccessibility(
  svg: string,
  title: string,
  description: string,
  titleId: string,
): string {
  const safeTitle = escapeXml(title.trim() || 'Diagram')
  const safeDesc = escapeXml(description.trim() || title.trim() || 'Diagram')
  const safeId = titleId.replace(/[^a-z0-9-]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')

  const a11yBlock = `<title id="${safeId}">${safeTitle}</title><desc>${safeDesc}</desc>`

  // Add role="img" and aria-labelledby to the root <svg> tag, then inject the
  // accessibility block immediately after the opening tag.
  return svg
    .replace(
      /(<svg\b[^>]*)(>)/i,
      (_, attrs: string, close: string) => {
        const updatedAttrs = attrs
          .replace(/\brole\s*=\s*["'][^"']*["']/i, '')
          .replace(/\baria-labelledby\s*=\s*["'][^"']*["']/i, '')
          .trimEnd()
        return `${updatedAttrs} role="img" aria-labelledby="${safeId}"${close}${a11yBlock}`
      },
    )
}
