/** Convert a local calendar date + wall-clock time in `timeZone` to a UTC Date. */
export function slotToUtc(
  dateStr: string,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  const [year, month, day] = dateStr.split('-').map((n) => parseInt(n, 10))
  let ms = Date.UTC(year, month - 1, day, hour, minute, 0)

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  })

  function partsAt(timestamp: number) {
    const parts = formatter.formatToParts(new Date(timestamp))
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '0'
    return {
      year: parseInt(get('year'), 10),
      month: parseInt(get('month'), 10),
      day: parseInt(get('day'), 10),
      hour: parseInt(get('hour'), 10),
      minute: parseInt(get('minute'), 10),
    }
  }

  for (let i = 0; i < 4; i++) {
    const p = partsAt(ms)
    const diffMinutes =
      (year - p.year) * 525_600 +
      (month - p.month) * 43_200 +
      (day - p.day) * 1_440 +
      (hour - p.hour) * 60 +
      (minute - p.minute)
    ms -= diffMinutes * 60_000
  }

  return new Date(ms)
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
