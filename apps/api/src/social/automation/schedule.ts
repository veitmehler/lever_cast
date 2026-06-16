/**
 * Convert a local calendar date + wall-clock time in `timeZone` to a UTC Date.
 *
 * Single-step offset correction: take the wall time as if it were UTC, measure
 * how that instant actually renders in `timeZone`, and subtract the resulting
 * offset. Correct for every fixed offset and DST shift except within the ~1h
 * DST-transition window (where a wall time is ambiguous or nonexistent), which
 * is acceptable for scheduling.
 *
 * (Replaces a prior iterative implementation that diverged once its guess
 * crossed midnight — e.g. 09:00 America/New_York could resolve to the wrong day.)
 */
export function slotToUtc(
  dateStr: string,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  const [year, month, day] = dateStr.split('-').map((n) => parseInt(n, 10))
  const guess = Date.UTC(year, month - 1, day, hour, minute, 0)

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(guess))
  const get = (type: string) => parseInt(parts.find((p) => p.type === type)?.value ?? '0', 10)

  const asZoned = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'))
  const offset = asZoned - guess // timezone offset (ms) at the target instant
  return new Date(guess - offset)
}

/** Format a Date as YYYY-MM-DD in the user's social timezone. */
export function formatScheduledDate(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

/** GHL rejects schedule dates in the past; require at least this much lead time. */
export const GHL_MIN_SCHEDULE_LEAD_MS = 10 * 60 * 1000

/** Bump `scheduledAt` forward if it is too soon or already in the past. */
export function ensureFutureScheduleDate(scheduledAt: Date, now = new Date()): Date {
  const minTime = now.getTime() + GHL_MIN_SCHEDULE_LEAD_MS
  if (scheduledAt.getTime() >= minTime) return scheduledAt
  return new Date(minTime)
}
