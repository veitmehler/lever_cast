import { describe, it, expect } from 'vitest'
import { slotToUtc, formatScheduledDate } from '../schedule'

describe('slotToUtc', () => {
  it('converts a summer (EDT, UTC-4) wall time to UTC', () => {
    // 09:00 America/New_York on 2026-06-20 → 13:00 UTC
    expect(slotToUtc('2026-06-20', 9, 0, 'America/New_York').toISOString()).toBe('2026-06-20T13:00:00.000Z')
  })

  it('converts a winter (EST, UTC-5) wall time to UTC', () => {
    // 09:00 America/New_York on 2026-01-15 → 14:00 UTC
    expect(slotToUtc('2026-01-15', 9, 0, 'America/New_York').toISOString()).toBe('2026-01-15T14:00:00.000Z')
  })

  it('does not drift to the wrong day for early-morning times (regression)', () => {
    // The prior iterative implementation diverged here, returning a day (or
    // more) earlier. The result must stay on 2026-06-20.
    const result = slotToUtc('2026-06-20', 9, 0, 'America/New_York')
    expect(formatScheduledDate(result, 'America/New_York')).toBe('2026-06-20')
  })

  it('handles midnight wall time without crossing into the previous day', () => {
    // 00:00 America/New_York on 2026-06-20 → 04:00 UTC same date
    expect(slotToUtc('2026-06-20', 0, 0, 'America/New_York').toISOString()).toBe('2026-06-20T04:00:00.000Z')
  })

  it('handles a positive-offset zone (Asia/Kolkata, UTC+5:30)', () => {
    // 09:30 Asia/Kolkata on 2026-06-20 → 04:00 UTC
    expect(slotToUtc('2026-06-20', 9, 30, 'Asia/Kolkata').toISOString()).toBe('2026-06-20T04:00:00.000Z')
  })

  it('round-trips: formatScheduledDate(slotToUtc(d, h, m)) === d across a range of hours', () => {
    for (const hour of [0, 1, 6, 9, 12, 18, 23]) {
      const utc = slotToUtc('2026-06-20', hour, 0, 'America/New_York')
      expect(formatScheduledDate(utc, 'America/New_York')).toBe('2026-06-20')
    }
  })
})
