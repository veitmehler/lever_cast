import { describe, it, expect } from 'vitest'
import { extractReadable, cleanHeadline } from '../research'
import { fillPrompt } from '../llm'

describe('cleanHeadline', () => {
  it('strips a pipe site suffix', () => {
    expect(cleanHeadline('Better Posture at a Desk | Healthline')).toBe('Better Posture at a Desk')
  })
  it('strips a short trailing dash brand', () => {
    expect(cleanHeadline('Do I need therapy? Signs you should see a private therapist - Priory')).toBe(
      'Do I need therapy? Signs you should see a private therapist',
    )
  })
  it('keeps a long dash tail (likely real title)', () => {
    const t = 'How to stretch - a complete daily routine for everyone at home'
    expect(cleanHeadline(t)).toBe(t)
  })
  it('passes through null', () => {
    expect(cleanHeadline(null)).toBeNull()
  })
})

describe('extractReadable', () => {
  it('pulls h1/h2/h3/p/li into a normalized block', () => {
    const html = `
      <html><body>
        <h1>Main Title</h1>
        <p>First paragraph with <strong>bold</strong> text.</p>
        <h2>A Section</h2>
        <ul><li>point one</li><li>point two</li></ul>
        <script>ignore()</script>
      </body></html>`
    const out = extractReadable(html)
    expect(out).toContain('# Article Title: Main Title')
    expect(out).toContain('## A Section')
    expect(out).toContain('First paragraph with bold text.')
    expect(out).toContain('- point one')
    expect(out).toContain('- point two')
    expect(out).not.toContain('ignore')
  })

  it('returns empty string for empty/contentless html', () => {
    expect(extractReadable('')).toBe('')
    expect(extractReadable('<div><span>no block tags</span></div>')).toBe('')
  })

  it('caps very long output', () => {
    const big = '<p>' + 'x'.repeat(20000) + '</p>'
    expect(extractReadable(big).length).toBeLessThanOrEqual(8000)
  })
})

describe('fillPrompt', () => {
  it('substitutes {{vars}} and trims token whitespace', () => {
    expect(fillPrompt('Hi {{name}} from {{ industry }}', { name: 'Sam', industry: 'Chiro' })).toBe(
      'Hi Sam from Chiro',
    )
  })

  it('replaces a missing var with empty string', () => {
    expect(fillPrompt('a{{missing}}b', {})).toBe('ab')
  })

  it('resolves the special {{ $now.year }} token', () => {
    const year = String(new Date().getFullYear())
    expect(fillPrompt('Year: {{ $now.year }}', {})).toBe(`Year: ${year}`)
  })

  it('coerces nullish values to empty string', () => {
    expect(fillPrompt('x{{a}}y{{b}}z', { a: null, b: undefined })).toBe('xyz')
  })
})
