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
}

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
  // Wed — newsletter
  3: [
    { hour: 9, postType: 'carousel', source: 'nl_feature' },
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
  // Sat — newsletter
  6: [
    { hour: 9, postType: 'carousel', source: 'nl_feature' },
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
