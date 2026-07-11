import { describe, it, expect, vi, beforeEach } from 'vitest'

const accountFindUnique = vi.fn()
const accountIdForUser = vi.fn()
vi.mock('@socioply/shared', () => ({
  prisma: { account: { findUnique: (...a: unknown[]) => accountFindUnique(...a) } },
  accountIdForUser: (...a: unknown[]) => accountIdForUser(...a),
}))

import { generationGateForUser, publishingGateForUser } from '../account-billing'

const DAY = 24 * 60 * 60 * 1000

beforeEach(() => {
  vi.clearAllMocks()
  accountIdForUser.mockResolvedValue('acct_1')
})

describe('generationGateForUser', () => {
  it('allows active accounts', async () => {
    accountFindUnique.mockResolvedValue({ status: 'active', paidThrough: null, billingExempt: false })
    expect((await generationGateForUser('u1')).allowed).toBe(true)
  })

  it('blocks paused accounts with a user-facing reason', async () => {
    accountFindUnique.mockResolvedValue({ status: 'paused', paidThrough: null, billingExempt: false })
    const gate = await generationGateForUser('u1')
    expect(gate.allowed).toBe(false)
    expect(gate.reason).toContain('paused')
  })

  it('blocks cancelled accounts', async () => {
    accountFindUnique.mockResolvedValue({ status: 'cancelled', paidThrough: null, billingExempt: false })
    expect((await generationGateForUser('u1')).allowed).toBe(false)
  })

  it('billingExempt (comp) bypasses a paused status', async () => {
    accountFindUnique.mockResolvedValue({ status: 'paused', paidThrough: null, billingExempt: true })
    expect((await generationGateForUser('u1')).allowed).toBe(true)
  })

  it('allows users with no account (legacy)', async () => {
    accountIdForUser.mockResolvedValue(null)
    expect((await generationGateForUser('u1')).allowed).toBe(true)
    expect(accountFindUnique).not.toHaveBeenCalled()
  })
})

describe('publishingGateForUser', () => {
  it('allows when paidThrough is in the future, even on a cancelled account', async () => {
    accountFindUnique.mockResolvedValue({
      status: 'cancelled',
      paidThrough: new Date(Date.now() + 10 * DAY),
      billingExempt: false,
    })
    expect((await publishingGateForUser('u1')).allowed).toBe(true)
  })

  it('blocks when paidThrough has lapsed', async () => {
    accountFindUnique.mockResolvedValue({
      status: 'cancelled',
      paidThrough: new Date(Date.now() - DAY),
      billingExempt: false,
    })
    const gate = await publishingGateForUser('u1')
    expect(gate.allowed).toBe(false)
    expect(gate.reason).toContain('paid subscription period')
  })

  it('allows null paidThrough (legacy/unbilled accounts, unchanged behavior)', async () => {
    accountFindUnique.mockResolvedValue({ status: 'paused', paidThrough: null, billingExempt: false })
    expect((await publishingGateForUser('u1')).allowed).toBe(true)
  })

  it('billingExempt bypasses a lapsed paidThrough', async () => {
    accountFindUnique.mockResolvedValue({
      status: 'active',
      paidThrough: new Date(Date.now() - DAY),
      billingExempt: true,
    })
    expect((await publishingGateForUser('u1')).allowed).toBe(true)
  })
})
