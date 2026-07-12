import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type PgBoss from 'pg-boss'

const docFindMany = vi.fn()
const captureFindUnique = vi.fn()
const captureCreate = vi.fn()
const captureUpdate = vi.fn()
const captureFindMany = vi.fn()
vi.mock('@socioply/shared', () => ({
  prisma: {
    leadGenDocument: { findMany: (...a: unknown[]) => docFindMany(...a) },
    leadCapture: {
      findUnique: (...a: unknown[]) => captureFindUnique(...a),
      create: (...a: unknown[]) => captureCreate(...a),
      update: (...a: unknown[]) => captureUpdate(...a),
      findMany: (...a: unknown[]) => captureFindMany(...a),
    },
  },
}))

const listAccessProposals = vi.fn()
const resolveAccessProposal = vi.fn()
vi.mock('../../lib/gdrive/client', () => ({
  driveConfigured: () => true,
  listAccessProposals: (...a: unknown[]) => listAccessProposals(...a),
  resolveAccessProposal: (...a: unknown[]) => resolveAccessProposal(...a),
}))

const getGhlCredentials = vi.fn()
vi.mock('../../lib/ghl/settings', () => ({ getGhlCredentials: (...a: unknown[]) => getGhlCredentials(...a) }))
const upsertGhlContact = vi.fn()
vi.mock('../../lib/ghl/client', () => ({ upsertGhlContact: (...a: unknown[]) => upsertGhlContact(...a) }))
const sendFailureAlert = vi.fn().mockResolvedValue(undefined)
vi.mock('../../lib/alerts', () => ({ sendFailureAlert: (...a: unknown[]) => sendFailureAlert(...a) }))
vi.mock('../../lib/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }))

import { leadgenPollHandler } from '../leadgen-poll'

const job = [{ id: 'j', name: 'q', data: {} } as PgBoss.Job<object>]
const DOC = { id: 'doc_1', accountId: 'acct_1', userId: 'owner_1', driveFileId: 'file_1', slug: 'back-pain-guide', ghlTagNames: ['leadgen-back-pain'] }

beforeEach(() => {
  vi.clearAllMocks()
  docFindMany.mockResolvedValue([DOC])
  captureFindUnique.mockResolvedValue(null)
  captureCreate.mockResolvedValue({ id: 'cap_1' })
  captureUpdate.mockResolvedValue({})
  captureFindMany.mockResolvedValue([])
  listAccessProposals.mockResolvedValue([{ proposalId: 'prop_1', requesterEmailAddress: 'lead@gmail.com' }])
  resolveAccessProposal.mockResolvedValue(undefined)
  getGhlCredentials.mockResolvedValue({ apiKey: 'k', locationId: 'loc', ghlUserId: 'g', accountIds: {} })
  upsertGhlContact.mockResolvedValue({ contactId: 'ghl_c1' })
})
afterEach(() => vi.clearAllMocks())

describe('leadgenPollHandler', () => {
  it('grants access, records the capture, pushes to GHL with the document tags', async () => {
    await leadgenPollHandler(job)
    expect(resolveAccessProposal).toHaveBeenCalledWith('file_1', 'prop_1')
    expect(captureCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ requesterEmail: 'lead@gmail.com', proposalId: 'prop_1' }) }),
    )
    expect(upsertGhlContact).toHaveBeenCalledWith('k', 'loc', {
      email: 'lead@gmail.com',
      tags: ['leadgen-back-pain'],
      source: 'leadgen:back-pain-guide',
    })
    expect(captureUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'captured', ghlContactId: 'ghl_c1' }) }),
    )
  })

  it('dedupes proposals already captured', async () => {
    captureFindUnique.mockResolvedValue({ id: 'cap_existing' })
    await leadgenPollHandler(job)
    expect(resolveAccessProposal).not.toHaveBeenCalled()
    expect(captureCreate).not.toHaveBeenCalled()
  })

  it('GHL failure never blocks access: capture stays ghl_failed + alert fires', async () => {
    upsertGhlContact.mockRejectedValue(new Error('ghl down'))
    await leadgenPollHandler(job)
    expect(resolveAccessProposal).toHaveBeenCalled() // access granted regardless
    expect(captureCreate).toHaveBeenCalled()
    // no upgrade to captured
    expect(captureUpdate).not.toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'captured' }) }),
    )
    expect(sendFailureAlert).toHaveBeenCalledWith(expect.objectContaining({ errorType: 'leadgen-ghl-failed' }))
  })

  it('resolve failure leaves the proposal for the next tick (no capture row)', async () => {
    resolveAccessProposal.mockRejectedValue(new Error('drive 500'))
    await leadgenPollHandler(job)
    expect(captureCreate).not.toHaveBeenCalled()
  })

  it('retries previously failed GHL pushes', async () => {
    docFindMany.mockResolvedValue([])
    captureFindMany.mockResolvedValue([
      { id: 'cap_old', requesterEmail: 'old@x.com', document: { userId: 'owner_1', ghlTagNames: ['t'], slug: 's' } },
    ])
    await leadgenPollHandler(job)
    expect(upsertGhlContact).toHaveBeenCalledWith('k', 'loc', expect.objectContaining({ email: 'old@x.com' }))
  })
})
