import { describe, it, expect } from 'vitest'
import { sanitizeArticleHtml } from '../sanitize-html'

describe('sanitizeArticleHtml', () => {
  it('strips <script> tags', () => {
    const out = sanitizeArticleHtml('<p>hi</p><script>alert(1)</script>')
    expect(out).toContain('<p>hi</p>')
    expect(out.toLowerCase()).not.toContain('<script')
  })

  it('removes inline event handlers', () => {
    const out = sanitizeArticleHtml('<img src="x" onerror="alert(1)">')
    expect(out.toLowerCase()).not.toContain('onerror')
  })

  it('neutralizes javascript: hrefs', () => {
    const out = sanitizeArticleHtml('<a href="javascript:alert(1)">x</a>')
    expect(out.toLowerCase()).not.toContain('javascript:')
  })

  it('preserves the .key-takeaways island markup and classes', () => {
    const island =
      '<div class="key-takeaways"><h3>Key takeaways</h3><ul><li>One</li><li>Two</li></ul></div>'
    const out = sanitizeArticleHtml(island)
    expect(out).toContain('class="key-takeaways"')
    expect(out).toContain('<li>One</li>')
    expect(out).toContain('<h3>')
  })

  it('keeps safe links with their href', () => {
    const out = sanitizeArticleHtml('<a href="https://example.com">link</a>')
    expect(out).toContain('href="https://example.com"')
  })
})
