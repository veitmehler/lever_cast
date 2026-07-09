import { describe, it, expect } from 'vitest'
import { billingWindows } from '../billing-window'

const DAY = 86_400_000
const anchor = new Date('2026-01-01T00:00:00.000Z')

describe('billingWindows', () => {
  it('at the exact anchor instant, the current cycle starts at the anchor', () => {
    const w = billingWindows(anchor, anchor)
    expect(w.from.toISOString()).toBe('2026-01-01T00:00:00.000Z')
  })

  it('the planning window spans 60 days and the production window spans 30', () => {
    const w = billingWindows(anchor, anchor)
    expect((w.executableUntil.getTime() - w.from.getTime()) / DAY).toBe(29)
    expect((w.to.getTime() - w.from.getTime()) / DAY).toBe(59)
  })

  it('day 29 (last day of cycle 1) is still within cycle 1', () => {
    const now = new Date(anchor.getTime() + 29 * DAY)
    const w = billingWindows(anchor, now)
    expect(w.from.getTime()).toBe(anchor.getTime())
  })

  it('day 30 (first day of cycle 2) rolls the current cycle forward', () => {
    const now = new Date(anchor.getTime() + 30 * DAY)
    const w = billingWindows(anchor, now)
    expect(w.from.getTime()).toBe(anchor.getTime() + 30 * DAY)
    expect(w.executableUntil.getTime()).toBe(anchor.getTime() + 59 * DAY)
  })

  it('day 59 (last day of cycle 2) is still within cycle 2', () => {
    const now = new Date(anchor.getTime() + 59 * DAY)
    const w = billingWindows(anchor, now)
    expect(w.from.getTime()).toBe(anchor.getTime() + 30 * DAY)
  })

  it('day 60 rolls into cycle 3', () => {
    const now = new Date(anchor.getTime() + 60 * DAY)
    const w = billingWindows(anchor, now)
    expect(w.from.getTime()).toBe(anchor.getTime() + 60 * DAY)
  })

  it('many cycles elapsed (a year later) lands on the correct cycle', () => {
    const now = new Date(anchor.getTime() + 365 * DAY)
    const w = billingWindows(anchor, now)
    const cyclesElapsed = Math.floor(365 / 30) // 12
    expect(w.from.getTime()).toBe(anchor.getTime() + cyclesElapsed * 30 * DAY)
    // now must fall within [from, executableUntil] of the returned cycle.
    expect(now.getTime()).toBeGreaterThanOrEqual(w.from.getTime())
    expect(now.getTime()).toBeLessThanOrEqual(w.executableUntil.getTime())
  })

  it('now before the anchor (future-dated subscriptionStartedAt) does not throw and returns a sane window', () => {
    const now = new Date(anchor.getTime() - 5 * DAY)
    const w = billingWindows(anchor, now)
    // Should resolve to the cycle immediately preceding the anchor, not crash
    // or silently clamp to some arbitrary date.
    expect(w.from.getTime()).toBeLessThanOrEqual(anchor.getTime())
    expect(w.executableUntil.getTime() - w.from.getTime()).toBe(29 * DAY)
  })

  it('respects a custom cycleDays', () => {
    const now = new Date(anchor.getTime() + 10 * DAY)
    const w = billingWindows(anchor, now, 14)
    expect(w.from.getTime()).toBe(anchor.getTime()) // still within the first 14-day cycle
    expect((w.executableUntil.getTime() - w.from.getTime()) / DAY).toBe(13)
    expect((w.to.getTime() - w.from.getTime()) / DAY).toBe(27)
  })

  it('defaults `now` to the current time when omitted', () => {
    // Anchor === now (both real "current time") means cyclesElapsed is always 0,
    // so `from` must equal the anchor exactly and the anchor must fall inside its own window.
    const rightNow = new Date()
    const w = billingWindows(rightNow)
    expect(w.from.getTime()).toBe(rightNow.getTime())
    expect(rightNow.getTime()).toBeLessThanOrEqual(w.executableUntil.getTime())
  })
})
