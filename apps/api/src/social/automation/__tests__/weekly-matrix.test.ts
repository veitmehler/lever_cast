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

  it('Tue/Thu match the spec (hard-bound sections 1+3 with KT anchoring noon)', () => {
    for (const day of [2, 4] as const) {
      expect(DEFAULT_WEEKLY_SOCIAL_MATRIX[day].map((s) => [s.postType, s.source])).toEqual([
        ['hook_video', 'art_section_0'],
        ['video_reel', 'art_keytakeaways'],
        ['carousel', 'art_section_2'],
      ])
    }
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
  it('day 2 = KT music-video anchor + hard-bound sections 2/4 (article-only)', async () => {
    const { ARTICLE_DAY2_SLOTS, sourceKind } = await import('../weekly-matrix')
    expect(ARTICLE_DAY2_SLOTS.map((s) => [s.postType, s.source])).toEqual([
      ['kt_music_video', 'art_keytakeaways'],
      ['carousel', 'art_section_1'],
      ['carousel', 'art_section_3'],
    ])
    // Classic half-panel slot gets fresh per-slide backgrounds (2026-08-24).
    expect(ARTICLE_DAY2_SLOTS[1].perSlideBg).toBe(true)
    // kt_music_video is voiceless by design — never substituted away.
    const { applyVoiceCapability } = await import('../weekly-matrix')
    expect(applyVoiceCapability(ARTICLE_DAY2_SLOTS, false)[0].postType).toBe('kt_music_video')
    for (const s of ARTICLE_DAY2_SLOTS) expect(sourceKind(s.source)).toBe('article')
  })

  it('azavea day 1 = hard-bound sections 1/3/5 as carousels', async () => {
    const { AZAVEA_ARTICLE_DAY1_SLOTS, sourceKind } = await import('../weekly-matrix')
    expect(AZAVEA_ARTICLE_DAY1_SLOTS.map((s) => s.source)).toEqual([
      'art_section_0',
      'art_section_2',
      'art_section_4',
    ])
    expect(AZAVEA_ARTICLE_DAY1_SLOTS.every((s) => s.postType === 'carousel')).toBe(true)
    for (const s of AZAVEA_ARTICLE_DAY1_SLOTS) expect(sourceKind(s.source)).toBe('article')
  })

  it('sectionIndexOfSource parses hard-bound sources and rejects others', async () => {
    const { sectionIndexOfSource } = await import('../weekly-matrix')
    expect(sectionIndexOfSource('art_section_0')).toBe(0)
    expect(sectionIndexOfSource('art_section_4')).toBe(4)
    expect(sectionIndexOfSource('art_keytakeaways')).toBeNull()
    expect(sectionIndexOfSource('nl_feature')).toBeNull()
  })
})
