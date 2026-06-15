import { describe, it, expect, vi } from 'vitest'

// Mock the handler's heavy/db deps; keep ../../social/automation/schedule real
// so the tz + time math is genuinely exercised.
vi.mock('@socioply/shared', () => ({ prisma: {} }))
vi.mock('../../lib/alerts', () => ({ sendFailureAlert: vi.fn() }))
vi.mock('../../lib/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }))
vi.mock('../../article-pipeline/promo-email/generate', () => ({ generatePromoEmail: vi.fn() }))
vi.mock('../../lib/ghl/settings', () => ({ getPromoEmailConfig: vi.fn() }))
vi.mock('../../lib/ghl/client', () => ({
  createGhlEmailCampaign: vi.fn(),
  scheduleGhlEmailCampaign: vi.fn(),
}))

import { computeSendAt } from '../promo-email-generate'

describe('computeSendAt', () => {
  it('schedules for the configured wall-clock time on the publish date (EDT → UTC)', () => {
    const publishingDate = new Date('2026-06-20T15:00:00.000Z') // 11:00 EDT → Jun 20 in NY
    const now = new Date('2026-06-19T12:00:00.000Z') // well before the target
    const sendAt = computeSendAt(publishingDate, '09:00', 'America/New_York', now)
    // 09:00 America/New_York on 2026-06-20 is 13:00 UTC (EDT = UTC-4)
    expect(sendAt.toISOString()).toBe('2026-06-20T13:00:00.000Z')
  })

  it('falls back to now+lead-time when the target time has already passed', () => {
    const publishingDate = new Date('2026-06-20T20:00:00.000Z')
    const now = new Date('2026-06-20T18:00:00.000Z') // past 09:00 EDT (13:00 UTC) already
    const sendAt = computeSendAt(publishingDate, '09:00', 'America/New_York', now)
    expect(sendAt.getTime()).toBeGreaterThan(now.getTime())
    // within ~the minimum lead window, not the original 13:00 UTC target
    expect(sendAt.getTime()).toBeLessThanOrEqual(now.getTime() + 60 * 60 * 1000)
  })
})
