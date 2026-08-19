import { describe, it, expect } from 'vitest'
import { matrixForDay, storySlotsForDay, type FeedEntry } from '../weekly-matrix'
import { storyOffsetMinutes } from '../story-processor'

function feedEntries(kind: 'article' | 'newsletter', isoWeekday: number): FeedEntry[] {
  return matrixForDay(kind, isoWeekday).map((daySlot, i) => ({ slotKey: `P${i + 1}`, daySlot }))
}

describe('storySlotsForDay — article days', () => {
  it('Tuesday: pitch_carousel (promotes the carousel), pitch_hook, and a quote', () => {
    const stories = storySlotsForDay('article', feedEntries('article', 2))
    const byType = Object.fromEntries(stories.map((s) => [s.storyType, s]))
    expect(new Set(stories.map((s) => s.storyType))).toEqual(
      new Set(['pitch_carousel', 'pitch_hook', 'quote']),
    )
    // Tue feed: P1 hook_video, P2 video_reel, P3 carousel.
    expect(byType.pitch_hook.promotesFeedKey).toBe('P1')
    expect(byType.pitch_carousel.promotesFeedKey).toBe('P3')
    expect(byType.quote.promotesFeedKey).toBeUndefined()
  })

  it('Thursday: carousel/hook are swapped, story companions follow', () => {
    const stories = storySlotsForDay('article', feedEntries('article', 4))
    const byType = Object.fromEntries(stories.map((s) => [s.storyType, s]))
    // Thu feed: P1 hook_video, P2 video_reel, P3 carousel.
    expect(byType.pitch_hook.promotesFeedKey).toBe('P1')
    expect(byType.pitch_carousel.promotesFeedKey).toBe('P3')
  })

  it('every story keeps 3 slots keyed S1/S2/S3 in feed order', () => {
    const stories = storySlotsForDay('article', feedEntries('article', 2))
    expect(stories.map((s) => s.slotKey)).toEqual(['S1', 'S2', 'S3'])
  })
})

describe('storySlotsForDay — newsletter days', () => {
  it('Monday: pitch_carousel, tips_bullets, and a distinct quote', () => {
    const stories = storySlotsForDay('newsletter', feedEntries('newsletter', 1))
    expect(new Set(stories.map((s) => s.storyType))).toEqual(
      new Set(['pitch_carousel', 'tips_bullets', 'quote']),
    )
    const byType = Object.fromEntries(stories.map((s) => [s.storyType, s]))
    // Mon feed: P1 video_reel(overview), P2 quote(tips), P3 carousel(feature).
    expect(byType.pitch_carousel.promotesFeedKey).toBe('P3')
    // Newsletter quote story is sourced from the feature, not the tips.
    expect(byType.quote.source).toBe('nl_feature')
  })

  it('Saturday still yields the three newsletter story types', () => {
    const stories = storySlotsForDay('newsletter', feedEntries('newsletter', 6))
    expect(new Set(stories.map((s) => s.storyType))).toEqual(
      new Set(['pitch_carousel', 'tips_bullets', 'quote']),
    )
  })
})

describe('storyOffsetMinutes', () => {
  it('always returns a 2–8 minute offset', () => {
    for (let i = 0; i < 200; i++) {
      const m = storyOffsetMinutes()
      expect(m).toBeGreaterThanOrEqual(2)
      expect(m).toBeLessThanOrEqual(8)
    }
  })
})
