import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type PgBoss from 'pg-boss'

const accountFindMany = vi.fn()
const accountUpdate = vi.fn()
vi.mock('@omniply/shared', () => ({
  prisma: {
    account: {
      findMany: (...a: unknown[]) => accountFindMany(...a),
      update: (...a: unknown[]) => accountUpdate(...a),
    },
  },
}))

const bossSend = vi.fn()
vi.mock('../../queues/index', () => ({
  getBoss: async () => ({ send: (...a: unknown[]) => bossSend(...a) }),
  QUEUES: { ACCOUNT_DELETE: 'account-delete' },
}))

const sendFailureAlert = vi.fn().mockResolvedValue(undefined)
vi.mock('../../lib/alerts', () => ({ sendFailureAlert: (...a: unknown[]) => sendFailureAlert(...a) }))
vi.mock('../../lib/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }))

import { accountLifecycleClockHandler } from '../account-lifecycle-clock'

const job = [{ id: 'j', name: 'q', data: {} } as PgBoss.Job<object>]

beforeEach(() => {
  vi.clearAllMocks()
  accountFindMany.mockResolvedValue([])
  accountUpdate.mockResolvedValue({})
  delete process.env.ACCOUNT_AUTO_DELETE_ENABLED
})

afterEach(() => {
  delete process.env.ACCOUNT_AUTO_DELETE_ENABLED
})

describe('accountLifecycleClockHandler', () => {
  it('cancels accounts paused past 60 days and alerts', async () => {
    accountFindMany
      .mockResolvedValueOnce([{ id: 'acct_1', name: 'Stale Clinic', statusChangedAt: new Date(0) }])
      .mockResolvedValueOnce([])
    await accountLifecycleClockHandler(job)
    const data = (accountUpdate.mock.calls[0][0] as { data: Record<string, unknown> }).data
    expect(data.status).toBe('cancelled')
    expect(data.statusChangedAt).toBeInstanceOf(Date) // 90d clock restarts
    expect(sendFailureAlert).toHaveBeenCalledWith(expect.objectContaining({ errorType: 'account-lifecycle' }))
  })

  it('excludes billingExempt accounts via the query filter', async () => {
    await accountLifecycleClockHandler(job)
    for (const call of accountFindMany.mock.calls) {
      expect((call[0] as { where: Record<string, unknown> }).where.billingExempt).toBe(false)
    }
  })

  it('enqueues a DRY RUN deletion when auto-delete is not armed', async () => {
    accountFindMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'acct_2', name: 'Gone Clinic', statusChangedAt: new Date(0) }])
    await accountLifecycleClockHandler(job)
    expect(bossSend).toHaveBeenCalledWith(
      'account-delete',
      { accountId: 'acct_2', reason: 'auto-90d', dryRun: true },
      expect.objectContaining({ singletonKey: 'account-delete-acct_2' }),
    )
  })

  it('enqueues a REAL deletion when ACCOUNT_AUTO_DELETE_ENABLED=true', async () => {
    process.env.ACCOUNT_AUTO_DELETE_ENABLED = 'true'
    accountFindMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'acct_2', name: 'Gone Clinic', statusChangedAt: new Date(0) }])
    await accountLifecycleClockHandler(job)
    expect(bossSend).toHaveBeenCalledWith(
      'account-delete',
      expect.objectContaining({ dryRun: false }),
      expect.anything(),
    )
  })
})
