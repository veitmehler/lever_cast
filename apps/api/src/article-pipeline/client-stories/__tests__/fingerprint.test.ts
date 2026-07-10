import { describe, it, expect } from 'vitest'
import { reviewFingerprint } from '../fingerprint'

describe('reviewFingerprint', () => {
  it('is deterministic for identical inputs', () => {
    expect(reviewFingerprint('Sarah', 'Great chiropractor, fixed my back pain')).toBe(
      reviewFingerprint('Sarah', 'Great chiropractor, fixed my back pain'),
    )
  })

  it('is case- and whitespace-insensitive (the same review re-scraped should still dedupe)', () => {
    const a = reviewFingerprint('Sarah', 'Great   chiropractor, fixed my back pain')
    const b = reviewFingerprint('sarah', 'great chiropractor fixed my back pain')
    expect(a).toBe(b)
  })

  it('ignores punctuation differences', () => {
    const a = reviewFingerprint('Sarah', "Fixed my back pain — couldn't be happier!")
    const b = reviewFingerprint('Sarah', 'Fixed my back pain couldnt be happier')
    expect(a).toBe(b)
  })

  it('different reviewers with the same text produce different fingerprints', () => {
    const a = reviewFingerprint('Sarah', 'Great service')
    const b = reviewFingerprint('John', 'Great service')
    expect(a).not.toBe(b)
  })

  it('different text produces different fingerprints', () => {
    const a = reviewFingerprint('Sarah', 'Fixed my back pain')
    const b = reviewFingerprint('Sarah', 'Fixed my neck pain')
    expect(a).not.toBe(b)
  })

  it('handles a null reviewer name consistently', () => {
    expect(reviewFingerprint(null, 'Anonymous-ish review text')).toBe(
      reviewFingerprint(null, 'Anonymous-ish review text'),
    )
    expect(reviewFingerprint(null, 'Anonymous-ish review text')).not.toBe(
      reviewFingerprint('Someone', 'Anonymous-ish review text'),
    )
  })

  it('produces a 64-char hex sha256 digest', () => {
    const fp = reviewFingerprint('Sarah', 'Great service')
    expect(fp).toMatch(/^[0-9a-f]{64}$/)
  })
})
