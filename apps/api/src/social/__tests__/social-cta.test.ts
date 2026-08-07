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

describe('dm_keyword preset (comment-to-DM automation)', () => {
  it('emits a comment-keyword CTA from KEYWORD|asset custom text', () => {
    const cta = resolveSocialCta('dm_keyword', 'spine|our 2-Minute Spine Check')
    expect(cta).toMatch(/comment the word "SPINE"/)
    expect(cta).toMatch(/2-Minute Spine Check/)
    expect(cta).toMatch(/direct message/)
  })
  it('degrades to raw text when no keyword present', () => {
    expect(resolveSocialCta('dm_keyword', '')).toBe('')
  })
})
