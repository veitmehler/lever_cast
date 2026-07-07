import { describe, it, expect } from 'vitest'
import { resolveSocialCta } from '../brand-theme'

describe('resolveSocialCta', () => {
  it('newsletter goal drives a subscribe-via-link-in-bio CTA', () => {
    const cta = resolveSocialCta('newsletter', 'ignored custom')
    expect(cta).toMatch(/subscribe/i)
    expect(cta).toMatch(/link in our bio/i)
  })

  it('booking goal drives a book-appointment-via-link-in-bio CTA', () => {
    const cta = resolveSocialCta('booking', 'ignored custom')
    expect(cta).toMatch(/book an appointment/i)
    expect(cta).toMatch(/link in our bio/i)
  })

  it('custom goal uses the business free text verbatim', () => {
    expect(resolveSocialCta('custom', 'Download our free guide')).toBe('Download our free guide')
  })

  it('null/unset goal is backward-compatible (raw custom text, no injected changes)', () => {
    expect(resolveSocialCta(null, 'Legacy CTA text')).toBe('Legacy CTA text')
    expect(resolveSocialCta(undefined, '')).toBe('')
  })
})
