import { describe, it, expect } from 'vitest'
import {
  applyVoiceCapability,
  matrixForDay,
  storySlotsForDay,
  DEFAULT_WEEKLY_SOCIAL_MATRIX,
  type FeedEntry,
} from '../weekly-matrix'

function entries(slots: ReturnType<typeof matrixForDay>): FeedEntry[] {
  return slots.map((daySlot, i) => ({ slotKey: `P${i + 1}`, daySlot }))
}

describe('applyVoiceCapability (non-EL conversion)', () => {
  it('voice accounts keep the matrix untouched (same reference)', () => {
    const slots = matrixForDay('article', 2)
    expect(applyVoiceCapability(slots, true)).toBe(slots)
  })

  it('converts hook_video and video_reel to accent-tinted carousels, same source/hour', () => {
    const tue = applyVoiceCapability(matrixForDay('article', 2), false)
    // Tue original: carousel(art_diagram_0), video_reel(art_keytakeaways), hook_video(art_hook_other)
    expect(tue.map((s) => s.postType)).toEqual(['carousel', 'carousel', 'carousel'])
    expect(tue[1]).toMatchObject({ designVariant: 'brand_tint_accent', source: 'art_keytakeaways', hour: 12 })
    expect(tue[2]).toMatchObject({ designVariant: 'brand_tint_accent', source: 'art_hook_other', hour: 15 })
    // The pre-existing classic carousel is untouched (no variant).
    expect(tue[0].designVariant).toBeUndefined()
  })

  it('leaves Wed/Sat primary brand_tint carousels as primary (accent only on converted slots)', () => {
    const wed = applyVoiceCapability(matrixForDay('newsletter', 3), false)
    expect(wed[0].designVariant).toBe('brand_tint') // original Wed tint stays primary
    expect(wed[2]).toMatchObject({ postType: 'carousel', designVariant: 'brand_tint_accent' }) // was video_reel
  })

  it('quote cards are never converted (already static)', () => {
    const mon = applyVoiceCapability(matrixForDay('newsletter', 1), false)
    expect(mon[1].postType).toBe('quote')
    expect(mon[1].designVariant).toBeUndefined()
  })

  it('every weekday resolves with zero video post types for no-voice accounts', () => {
    for (const day of Object.values(DEFAULT_WEEKLY_SOCIAL_MATRIX)) {
      const converted = applyVoiceCapability(day, false)
      expect(converted.some((s) => s.postType === 'hook_video' || s.postType === 'video_reel')).toBe(false)
    }
  })

  it('companion stories swap automatically: pitch_hook becomes pitch_carousel', () => {
    const thuOriginal = matrixForDay('article', 4) // hook_video first slot
    const before = storySlotsForDay('article', entries(thuOriginal))
    expect(before[0].storyType).toBe('pitch_hook')

    const thuConverted = applyVoiceCapability(thuOriginal, false)
    const after = storySlotsForDay('article', entries(thuConverted))
    expect(after[0].storyType).toBe('pitch_carousel')
    expect(after[0].promotesFeedKey).toBe('P1')
    // No story type in the converted week depends on a video asset.
    expect(after.some((s) => s.storyType === 'pitch_hook')).toBe(false)
  })
})
