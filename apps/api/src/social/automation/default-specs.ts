/** Default 12-slot daily social schedule (per plan §1). */

export interface DefaultSpecSeed {
  slotKey: string
  timeHour: number
  timeMinute: number
  postType: string
  isStory: boolean
}

export const DEFAULT_SOCIAL_POST_SPECS: DefaultSpecSeed[] = [
  { slotKey: 'F1', timeHour: 8, timeMinute: 0, postType: 'quote', isStory: false },
  { slotKey: 'F2', timeHour: 10, timeMinute: 0, postType: 'video_reel', isStory: false },
  { slotKey: 'F3', timeHour: 12, timeMinute: 0, postType: 'quote', isStory: false },
  { slotKey: 'F4', timeHour: 14, timeMinute: 0, postType: 'carousel', isStory: false },
  { slotKey: 'F5', timeHour: 16, timeMinute: 0, postType: 'quote', isStory: false },
  { slotKey: 'F6', timeHour: 18, timeMinute: 0, postType: 'hook_video', isStory: false },
  { slotKey: 'S1', timeHour: 8, timeMinute: 30, postType: 'quote', isStory: true },
  { slotKey: 'S2', timeHour: 10, timeMinute: 30, postType: 'video_reel', isStory: true },
  { slotKey: 'S3', timeHour: 12, timeMinute: 30, postType: 'quote_video', isStory: true },
  { slotKey: 'S4', timeHour: 14, timeMinute: 30, postType: 'pitch_carousel', isStory: true },
  { slotKey: 'S5', timeHour: 16, timeMinute: 30, postType: 'quote', isStory: true },
  { slotKey: 'S6', timeHour: 18, timeMinute: 30, postType: 'pitch_hook', isStory: true },
]

/** Asset generation dependency order (plan §1). */
export const SPEC_PROCESS_ORDER = [
  'F4',
  'F6',
  'F2',
  'F1',
  'F3',
  'F5',
  'S1',
  'S5',
  'S3',
  'S2',
  'S4',
  'S6',
] as const

export type SpecSlotKey = (typeof SPEC_PROCESS_ORDER)[number]
