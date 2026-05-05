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
