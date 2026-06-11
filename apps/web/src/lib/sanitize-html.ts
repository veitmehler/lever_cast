import DOMPurify from 'isomorphic-dompurify'

/**
 * Sanitize article HTML before injecting it via dangerouslySetInnerHTML.
 *
 * Strips <script>, inline event handlers (onerror, onclick, …), and
 * javascript:/data: URLs while preserving the formatting and class names the
 * article pipeline produces — headings, lists, links, tables, code blocks, and
 * the `.key-takeaways` island wrapper. Restricts to the HTML profile (no inline
 * SVG/MathML) to avoid those XSS vectors; diagrams are served as <img> from S3,
 * not inlined here.
 */
export function sanitizeArticleHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['target', 'rel'],
  })
}
