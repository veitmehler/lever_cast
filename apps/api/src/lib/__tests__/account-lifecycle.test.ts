import { describe, it, expect, vi, beforeEach } from 'vitest'

const accountFindUnique = vi.fn()
const accountUpdate = vi.fn()
const eventFindFirst = vi.fn()
const eventCreate = vi.fn()
const topicFindMany = vi.fn()
const ntFindMany = vi.fn()
const userFindMany = vi.fn()
const brandFindFirst = vi.fn()
vi.mock('@socioply/shared', () => ({
  prisma: {
    account: {
      findUnique: (...a: unknown[]) => accountFindUnique(...a),
      update: (...a: unknown[]) => accountUpdate(...a),
    },
    ghlBillingEvent: {
      findFirst: (...a: unknown[]) => eventFindFirst(...a),
      create: (...a: unknown[]) => eventCreate(...a),
    },
    topic: { findMany: (...a: unknown[]) => topicFindMany(...a), findFirst: vi.fn(), update: vi.fn() },
    newsletterTopic: { findMany: (...a: unknown[]) => ntFindMany(...a), update: vi.fn() },
    user: { findMany: (...a: unknown[]) => userFindMany(...a) },
    brandSettings: { findFirst: (...a: unknown[]) => brandFindFirst(...a) },
  },
}))

const createBatchFromDates = vi.fn()
const advanceBatch = vi.fn()
vi.mock('../../article-pipeline/content-batch', () => ({
  createBatchFromDates: (...a: unknown[]) => createBatchFromDates(...a),
  advanceBatch: (...a: unknown[]) => advanceBatch(...a),
}))
vi.mock('../../article-pipeline/client-stories/gate', () => ({
  hasArticleCadenceDate: () => true,
  checkArticleGenerationGate: vi.fn().mockResolvedValue(null),
}))
vi.mock('../logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }))

import { applyBillingEvent, CYCLE_DAYS, PAID_THROUGH_GRACE_DAYS } from '../account-lifecycle'

const DAY = 86_400_000

beforeEach(() => {
  vi.clearAllMocks()
  eventFindFirst.mockResolvedValue(null)
  eventCreate.mockResolvedValue({})
  accountUpdate.mockResolvedValue({})
  topicFindMany.mockResolvedValue([])
  ntFindMany.mockResolvedValue([])
  userFindMany.mockResolvedValue([{ id: 'owner_1' }])
  brandFindFirst.mockResolvedValue(null)
  createBatchFromDates.mockResolvedValue({ batchId: 'batch_1', itemCount: 3 })
  advanceBatch.mockResolvedValue(undefined)
})

function mockAccount(over: Record<string, unknown> = {}) {
  accountFindUnique.mockResolvedValue({
    id: 'acct_1',
    ownerUserId: 'owner_1',
    subscriptionStartedAt: new Date(Date.now() - 30 * DAY),
    status: 'active',
    ...over,
  })
}

describe('applyBillingEvent', () => {
  it('payment_failed → paused with statusChangedAt', async () => {
    mockAccount()
    const r = await applyBillingEvent('acct_1', 'payment_failed')
    expect(r).toMatchObject({ applied: true, duplicate: false })
    const data = (accountUpdate.mock.calls[0][0] as { data: Record<string, unknown> }).data
    expect(data.status).toBe('paused')
    expect(data.statusChangedAt).toBeInstanceOf(Date)
  })

  it('cancelled → cancelled, paidThrough untouched', async () => {
    mockAccount()
    await applyBillingEvent('acct_1', 'cancelled')
    const data = (accountUpdate.mock.calls[0][0] as { data: Record<string, unknown> }).data
    expect(data.status).toBe('cancelled')
    expect(data).not.toHaveProperty('paidThrough')
  })

  it('payment_cleared → active, re-anchored, paidThrough = cycle + grace, burst started', async () => {
    mockAccount({ status: 'paused' })
    const r = await applyBillingEvent('acct_1', 'payment_cleared')
    const data = (accountUpdate.mock.calls[0][0] as { data: Record<string, unknown> }).data
    expect(data.status).toBe('active')
    expect(data.subscriptionStartedAt).toBeInstanceOf(Date)
    const paidThrough = data.paidThrough as Date
    const expectedMs = Date.now() + (CYCLE_DAYS + PAID_THROUGH_GRACE_DAYS) * DAY
    expect(Math.abs(paidThrough.getTime() - expectedMs)).toBeLessThan(60_000)
    expect(createBatchFromDates).toHaveBeenCalled()
    expect(advanceBatch).toHaveBeenCalledWith('batch_1')
    expect(r.burst).toMatchObject({ batchId: 'batch_1', itemCount: 3 })
  })

  it('suppresses a same-type event inside the duplicate window', async () => {
    mockAccount()
    eventFindFirst.mockResolvedValue({ id: 'evt_prior' })
    const r = await applyBillingEvent('acct_1', 'payment_cleared')
    expect(r).toMatchObject({ applied: false, duplicate: true })
    expect(accountUpdate).not.toHaveBeenCalled()
    // The duplicate is still audit-logged.
    expect(eventCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ duplicate: true }) }),
    )
  })

  it('burst failure is non-fatal to the transition', async () => {
    mockAccount()
    createBatchFromDates.mockRejectedValue(new Error('boom'))
    const r = await applyBillingEvent('acct_1', 'payment_cleared')
    expect(r.applied).toBe(true)
    expect(r.burst).toBeNull()
  })
})
