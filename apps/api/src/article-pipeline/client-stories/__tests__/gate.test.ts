import { describe, it, expect } from 'vitest'
import { hasArticleCadenceDate } from '../gate'

describe('hasArticleCadenceDate', () => {
  it('returns true for a Tuesday', () => {
    // 2026-07-14 is a Tuesday
    expect(hasArticleCadenceDate(['2026-07-14'])).toBe(true)
  })

  it('returns true for a Thursday', () => {
    // 2026-07-16 is a Thursday
    expect(hasArticleCadenceDate(['2026-07-16'])).toBe(true)
  })

  it('returns false when no dates fall on the article cadence', () => {
    // 2026-07-13 (Mon), 2026-07-15 (Wed), 2026-07-17 (Fri), 2026-07-18 (Sat), 2026-07-19 (Sun)
    expect(hasArticleCadenceDate(['2026-07-13', '2026-07-15', '2026-07-17', '2026-07-18', '2026-07-19'])).toBe(false)
  })

  it('returns true if at least one date among many matches', () => {
    expect(hasArticleCadenceDate(['2026-07-13', '2026-07-14', '2026-07-15'])).toBe(true)
  })

  it('returns false for an empty list', () => {
    expect(hasArticleCadenceDate([])).toBe(false)
  })
})
