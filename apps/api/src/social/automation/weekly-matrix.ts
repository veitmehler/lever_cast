/**
 * Weekly social cadence — 3 feed posts/day, Mon–Sat.
 *
 * Replaces the flat 12-slot DEFAULT_SOCIAL_POST_SPECS as the source of truth for
 * WHICH posts run on a given day. Newsletter days (Mon/Wed/Fri/Sat) draw from the
 * week's newsletter; article days (Tue/Thu) draw from the article. See
 * .plans/social-weekly-cadence.implementation-plan.md.
 */

/** Where a slot's content comes from. */
export type PostSource =
  // ── Newsletter sources ──
  | 'nl_overview' // reel bullets from the newsletter's topics
  | 'nl_tips' // quote card from quickHits.tips
  | 'nl_feature' // image carousel from the feature article
  // ── Article sources ──
  | 'art_diagram_0' // diagram carousel, 1st diagram section (fallback → image carousel)
  | 'art_diagram_1' // diagram carousel, 2nd diagram section (fallback → image carousel)
  | 'art_keytakeaways' // reel bullets from Key Takeaways
  | 'art_hook_diagram0' // hook video from the 1st diagram section
  | 'art_hook_other' // hook video from a section ≠ that day's diagram-carousel section

export type SourceKind = 'newsletter' | 'article'

export interface DaySlot {
  /** Hour of day (user's social timezone). */
  hour: number
  /** Generator post type: quote | video_reel | carousel | hook_video. */
  postType: string
  source: PostSource
  /**
   * Optional per-slot design variant. 'brand_tint' (Wed/Sat carousels): slides
   * washed in the brand color at ~0.85 opacity, centered text, corner logo —
   * see .plans/social-brand-tint-carousel.implementation-plan.md.
   * 'brand_tint_accent': same design in the ACCENT color — the no-voice
   * substitution look (.plans/non-elevenlabs-carousel-conversion...md). The
   * matrix is the single source of truth for WHERE these apply; downstream
   * code only reads the flag.
   */
  designVariant?: CarouselDesignVariant
}

export type CarouselDesignVariant = 'brand_tint' | 'brand_tint_accent'

/** ISO weekday: 1 = Mon … 6 = Sat (Sun = 0 has no posts). */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6

export const DEFAULT_WEEKLY_SOCIAL_MATRIX: Record<Weekday, DaySlot[]> = {
  // Mon — newsletter
  1: [
    { hour: 9, postType: 'video_reel', source: 'nl_overview' },
    { hour: 12, postType: 'quote', source: 'nl_tips' },
    { hour: 15, postType: 'carousel', source: 'nl_feature' },
  ],
  // Tue — article
  2: [
    { hour: 9, postType: 'carousel', source: 'art_diagram_0' },
    { hour: 12, postType: 'video_reel', source: 'art_keytakeaways' },
    { hour: 15, postType: 'hook_video', source: 'art_hook_other' },
  ],
  // Wed — newsletter (brand-tinted carousel for feed variety)
  3: [
    { hour: 9, postType: 'carousel', source: 'nl_feature', designVariant: 'brand_tint' },
    { hour: 12, postType: 'quote', source: 'nl_tips' },
    { hour: 15, postType: 'video_reel', source: 'nl_overview' },
  ],
  // Thu — article
  4: [
    { hour: 9, postType: 'hook_video', source: 'art_hook_diagram0' },
    { hour: 12, postType: 'video_reel', source: 'art_keytakeaways' },
    { hour: 15, postType: 'carousel', source: 'art_diagram_1' },
  ],
  // Fri — newsletter
  5: [
    { hour: 9, postType: 'video_reel', source: 'nl_overview' },
    { hour: 12, postType: 'quote', source: 'nl_tips' },
    { hour: 15, postType: 'carousel', source: 'nl_feature' },
  ],
  // Sat — newsletter (brand-tinted carousel for feed variety)
  6: [
    { hour: 9, postType: 'carousel', source: 'nl_feature', designVariant: 'brand_tint' },
    { hour: 12, postType: 'video_reel', source: 'nl_overview' },
    { hour: 15, postType: 'quote', source: 'nl_tips' },
  ],
}

const ARTICLE_SOURCES: ReadonlySet<PostSource> = new Set([
  'art_diagram_0',
  'art_diagram_1',
  'art_keytakeaways',
  'art_hook_diagram0',
  'art_hook_other',
])

export function sourceKind(source: PostSource): SourceKind {
  return ARTICLE_SOURCES.has(source) ? 'article' : 'newsletter'
}

/** Default matrix day for off-cadence content (article → Tue, newsletter → Mon). */
export const DEFAULT_ARTICLE_WEEKDAY: Weekday = 2
export const DEFAULT_NEWSLETTER_WEEKDAY: Weekday = 1

// ── Story posts (9:16, IG + FB, one companion story per feed slot) ──
//
// The Content Publishing API can't add link stickers to stories, so stories
// promote the on-profile feed post (pitch types reuse the feed asset) or carry
// standalone content (quote / newsletter tips). See Phase 8 in the plan.

/** Story companion type for a feed slot. */
export type StoryType =
  | 'pitch_carousel' // promote the day's carousel feed post (reuses its asset)
  | 'pitch_hook' // promote the day's hook-video feed post (reuses its asset)
  | 'quote' // standalone quote story
  | 'tips_bullets' // newsletter days: static tips bullets over the overview cover

export interface StorySlot {
  /** S1/S2/S3 — parallel to the feed P1/P2/P3 it trails. */
  slotKey: string
  storyType: StoryType
  /** Feed slot hour this story trails (a small random offset is added at schedule time). */
  anchorHour: number
  /** Feed slotKey whose generated asset a pitch story reuses. */
  promotesFeedKey?: string
  /** Content source for pitch/quote resolution (mirrors the companion feed slot). */
  source?: PostSource
}

export interface FeedEntry {
  slotKey: string
  daySlot: DaySlot
}

/**
 * Derive the day's 3 companion story slots from its feed slots. Each feed post
 * gets exactly one story that posts shortly after it:
 *   - carousel  → pitch_carousel (reuses the carousel)
 *   - hook_video → pitch_hook (reuses the hook clip)
 *   - video_reel/quote → tips_bullets or quote (newsletter) / quote (article)
 */
export function storySlotsForDay(kind: SourceKind, feedEntries: FeedEntry[]): StorySlot[] {
  return feedEntries.map((fe, i) => {
    const slotKey = `S${i + 1}`
    const { postType, hour, source } = fe.daySlot
    if (postType === 'carousel') {
      return { slotKey, storyType: 'pitch_carousel', anchorHour: hour, promotesFeedKey: fe.slotKey, source }
    }
    if (postType === 'hook_video') {
      return { slotKey, storyType: 'pitch_hook', anchorHour: hour, promotesFeedKey: fe.slotKey, source }
    }
    if (kind === 'newsletter') {
      // nl_overview (video_reel) → tips-bullets story; nl_tips (quote) → a
      // distinct quote story sourced from the feature (avoids duplicating tips).
      if (postType === 'video_reel') {
        return { slotKey, storyType: 'tips_bullets', anchorHour: hour, source: 'nl_tips' }
      }
      return { slotKey, storyType: 'quote', anchorHour: hour, source: 'nl_feature' }
    }
    // Article day: the remaining slot (video_reel/key-takeaways) → a pull-quote story.
    return { slotKey, storyType: 'quote', anchorHour: hour, source }
  })
}

/**
 * No-ElevenLabs substitution (.plans/non-elevenlabs-carousel-conversion.implementation-plan.md):
 * accounts without a working voice get NO video slots — every video post type
 * becomes an accent-tinted carousel from the SAME content source. Resolved per
 * run, so adding ElevenLabs later flips the slots back automatically. Story
 * derivation runs on the TRANSFORMED slots, so pitch_hook companions become
 * pitch_carousel with zero story-side special-casing.
 */
export function applyVoiceCapability(slots: DaySlot[], hasVoice: boolean): DaySlot[] {
  if (hasVoice) return slots
  return slots.map((s) =>
    s.postType === 'hook_video' || s.postType === 'video_reel'
      ? { ...s, postType: 'carousel', designVariant: 'brand_tint_accent' as const }
      : s,
  )
}

/** Resolve the slot list for a given source kind + ISO weekday, with sensible defaults. */
export function matrixForDay(kind: SourceKind, isoWeekday: number): DaySlot[] {
  const wd = (isoWeekday >= 1 && isoWeekday <= 6 ? isoWeekday : null) as Weekday | null
  const day = wd ?? (kind === 'article' ? DEFAULT_ARTICLE_WEEKDAY : DEFAULT_NEWSLETTER_WEEKDAY)
  const slots = DEFAULT_WEEKLY_SOCIAL_MATRIX[day]
  // If the weekday's matrix is for the wrong kind (e.g. article published on a
  // newsletter day), fall back to that kind's default day.
  const firstKind = slots[0] ? sourceKind(slots[0].source) : kind
  if (firstKind !== kind) {
    return DEFAULT_WEEKLY_SOCIAL_MATRIX[kind === 'article' ? DEFAULT_ARTICLE_WEEKDAY : DEFAULT_NEWSLETTER_WEEKDAY]
  }
  return slots
}
