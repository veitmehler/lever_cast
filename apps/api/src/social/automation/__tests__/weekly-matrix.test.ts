import { describe, it, expect } from 'vitest'
import {
  DEFAULT_WEEKLY_SOCIAL_MATRIX,
  matrixForDay,
  sourceKind,
  type Weekday,
} from '../weekly-matrix'

const ARTICLE_DAYS: Weekday[] = [2, 4]
const NEWSLETTER_DAYS: Weekday[] = [1, 3, 5, 6]

describe('DEFAULT_WEEKLY_SOCIAL_MATRIX', () => {
  it('has exactly 3 slots per day at 9/12/15', () => {
    for (const day of [1, 2, 3, 4, 5, 6] as Weekday[]) {
      const slots = DEFAULT_WEEKLY_SOCIAL_MATRIX[day]
      expect(slots).toHaveLength(3)
      expect(slots.map((s) => s.hour)).toEqual([9, 12, 15])
    }
  })

  it('article days use only article sources; newsletter days only newsletter sources', () => {
    for (const day of ARTICLE_DAYS) {
      for (const slot of DEFAULT_WEEKLY_SOCIAL_MATRIX[day]) expect(sourceKind(slot.source)).toBe('article')
    }
    for (const day of NEWSLETTER_DAYS) {
      for (const slot of DEFAULT_WEEKLY_SOCIAL_MATRIX[day]) expect(sourceKind(slot.source)).toBe('newsletter')
    }
  })

  it('Tue/Thu match the spec (diagram carousel + key-takeaways reel + hook video)', () => {
    expect(DEFAULT_WEEKLY_SOCIAL_MATRIX[2].map((s) => [s.postType, s.source])).toEqual([
      ['carousel', 'art_diagram_0'],
      ['video_reel', 'art_keytakeaways'],
      ['hook_video', 'art_hook_other'],
    ])
    expect(DEFAULT_WEEKLY_SOCIAL_MATRIX[4].map((s) => [s.postType, s.source])).toEqual([
      ['hook_video', 'art_hook_diagram0'],
      ['video_reel', 'art_keytakeaways'],
      ['carousel', 'art_diagram_1'],
    ])
  })
})

describe('matrixForDay', () => {
  it('returns the weekday matrix for in-cadence content', () => {
    expect(matrixForDay('article', 2)).toBe(DEFAULT_WEEKLY_SOCIAL_MATRIX[2])
    expect(matrixForDay('newsletter', 1)).toBe(DEFAULT_WEEKLY_SOCIAL_MATRIX[1])
  })

  it('falls back to the default day for off-cadence content', () => {
    // article published on Sunday (0/7) → default article day (Tue)
    expect(matrixForDay('article', 7)).toBe(DEFAULT_WEEKLY_SOCIAL_MATRIX[2])
    // newsletter on Sunday → default newsletter day (Mon)
    expect(matrixForDay('newsletter', 0)).toBe(DEFAULT_WEEKLY_SOCIAL_MATRIX[1])
    // article landing on a newsletter weekday (Mon) → falls back to Tue
    expect(matrixForDay('article', 1)).toBe(DEFAULT_WEEKLY_SOCIAL_MATRIX[2])
    // newsletter landing on an article weekday (Tue) → falls back to Mon
    expect(matrixForDay('newsletter', 2)).toBe(DEFAULT_WEEKLY_SOCIAL_MATRIX[1])
  })
})

describe('ARTICLE_DAY2_SLOTS (azavea 6-day cadence)', () => {
  it('is a 3-slot article-only set with no Key-Takeaways repeat', async () => {
    const { ARTICLE_DAY2_SLOTS, sourceKind, applyVoiceCapability } = await import('../weekly-matrix')
    expect(ARTICLE_DAY2_SLOTS).toHaveLength(3)
    for (const s of ARTICLE_DAY2_SLOTS) expect(sourceKind(s.source)).toBe('article')
    expect(ARTICLE_DAY2_SLOTS.map((s) => s.source)).not.toContain('art_keytakeaways')
    // No-voice accounts (azavea today): every slot renders as a carousel.
    const noVoice = applyVoiceCapability(ARTICLE_DAY2_SLOTS, false)
    expect(noVoice.every((s) => s.postType === 'carousel')).toBe(true)
  })
})
