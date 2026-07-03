import { describe, it, expect } from 'vitest'
import { utcDateKey, formatScheduledDate } from '../schedule'

describe('utcDateKey', () => {
  it('returns the UTC calendar day for a UTC-midnight date (no timezone shift)', () => {
    expect(utcDateKey(new Date('2026-07-23T00:00:00Z'))).toBe('2026-07-23')
  })

  it('is stable regardless of the instant within the UTC day', () => {
    expect(utcDateKey(new Date('2026-07-23T23:59:00Z'))).toBe('2026-07-23')
  })

  it('does NOT shift a Thursday UTC-midnight date back to Wednesday (the old bug)', () => {
    const thu = new Date('2026-07-23T00:00:00Z')
    expect(utcDateKey(thu)).toBe('2026-07-23') // Thursday — correct
    // The prior behavior shifted it to the previous day in a negative-offset tz:
    expect(formatScheduledDate(thu, 'America/New_York')).toBe('2026-07-22') // Wednesday — the bug
  })
})
