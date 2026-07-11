import { describe, it, expect, vi, beforeEach } from 'vitest'
import type PgBoss from 'pg-boss'

const counts = vi.fn().mockResolvedValue(0)
const accountFindUnique = vi.fn()
const accountDelete = vi.fn()
const userFindMany = vi.fn()
const userDeleteMany = vi.fn()
const llmUpdateMany = vi.fn()
const mediaFindMany = vi.fn()
const postFindMany = vi.fn()
const deleteManys: Record<string, ReturnType<typeof vi.fn>> = {}
for (const m of ['videoGenerationJob', 'syndicationArticle', 'articleEmailCampaign', 'sitePage', 'outputAttempt']) {
  deleteManys[m] = vi.fn().mockResolvedValue({ count: 0 })
}

vi.mock('@socioply/shared', () => {
  const modelStub = (name: string) => ({
    count: (...a: unknown[]) => counts(name, ...a),
    deleteMany: (...a: unknown[]) => deleteManys[name]?.(...a) ?? { count: 0 },
  })
  return {
    prisma: {
      account: {
        findUnique: (...a: unknown[]) => accountFindUnique(...a),
        delete: (...a: unknown[]) => accountDelete(...a),
      },
      user: {
        findMany: (...a: unknown[]) => userFindMany(...a),
        deleteMany: (...a: unknown[]) => userDeleteMany(...a),
      },
      lLMUsage: { count: (...a: unknown[]) => counts('llm', ...a), updateMany: (...a: unknown[]) => llmUpdateMany(...a) },
      media: { findMany: (...a: unknown[]) => mediaFindMany(...a) },
      post: { findMany: (...a: unknown[]) => postFindMany(...a), count: (...a: unknown[]) => counts('post', ...a) },
      topic: { count: (...a: unknown[]) => counts('topic', ...a) },
      newsletter: { count: (...a: unknown[]) => counts('newsletter', ...a) },
      videoGenerationJob: modelStub('videoGenerationJob'),
      syndicationArticle: modelStub('syndicationArticle'),
      articleEmailCampaign: modelStub('articleEmailCampaign'),
      sitePage: modelStub('sitePage'),
      outputAttempt: modelStub('outputAttempt'),
    },
    deleteS3Prefix: (...a: unknown[]) => deleteS3Prefix(...a),
    deleteS3Keys: (...a: unknown[]) => deleteS3Keys(...a),
    extractFilePathFromUrl: (u: string) => {
      try { return new URL(u).pathname.slice(1) } catch { return null }
    },
  }
})

const deleteS3Prefix = vi.fn().mockResolvedValue(undefined)
const deleteS3Keys = vi.fn().mockResolvedValue(undefined)
const sendFailureAlert = vi.fn().mockResolvedValue(undefined)
vi.mock('../../lib/alerts', () => ({ sendFailureAlert: (...a: unknown[]) => sendFailureAlert(...a) }))
vi.mock('../../lib/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }))

import { accountDeleteHandler } from '../account-delete'

function job(data: object) {
  return [{ id: 'j', name: 'q', data } as PgBoss.Job<never>]
}

beforeEach(() => {
  vi.clearAllMocks()
  counts.mockResolvedValue(0)
  accountFindUnique.mockResolvedValue({ id: 'acct_1', name: 'Clinic', status: 'cancelled', statusChangedAt: new Date(0) })
  userFindMany.mockResolvedValue([{ id: 'u1', email: 'a@b.c' }])
  userDeleteMany.mockResolvedValue({ count: 1 })
  llmUpdateMany.mockResolvedValue({ count: 0 })
  accountDelete.mockResolvedValue({})
  mediaFindMany.mockResolvedValue([{ url: 'https://cdn.socioply.com/tmp/featured/x.png' }])
  postFindMany.mockResolvedValue([])
})

describe('accountDeleteHandler', () => {
  it('dry run reports and touches NOTHING', async () => {
    await accountDeleteHandler(job({ accountId: 'acct_1', reason: 'manual', dryRun: true }))
    expect(llmUpdateMany).not.toHaveBeenCalled()
    expect(userDeleteMany).not.toHaveBeenCalled()
    expect(accountDelete).not.toHaveBeenCalled()
    expect(deleteS3Prefix).not.toHaveBeenCalled()
    expect(sendFailureAlert).toHaveBeenCalledWith(expect.objectContaining({ errorType: 'account-delete-dry-run' }))
  })

  it('real run detaches LLMUsage first, deletes no-relation tables, users, account, then S3', async () => {
    await accountDeleteHandler(job({ accountId: 'acct_1', reason: 'manual', dryRun: false }))
    expect(llmUpdateMany).toHaveBeenCalledWith({ where: { userId: { in: ['u1'] } }, data: { userId: null } })
    for (const m of Object.values(deleteManys)) expect(m).toHaveBeenCalled()
    expect(userDeleteMany).toHaveBeenCalledWith({ where: { id: { in: ['u1'] } } })
    expect(accountDelete).toHaveBeenCalledWith({ where: { id: 'acct_1' } })
    expect(deleteS3Prefix).toHaveBeenCalledWith('u1/')
    expect(deleteS3Keys).toHaveBeenCalledWith(['tmp/featured/x.png'])
    expect(sendFailureAlert).toHaveBeenCalledWith(expect.objectContaining({ errorType: 'account-deleted' }))
  })

  it('auto path aborts when the account is not cancelled', async () => {
    accountFindUnique.mockResolvedValue({ id: 'acct_1', name: 'Clinic', status: 'active', statusChangedAt: null })
    await accountDeleteHandler(job({ accountId: 'acct_1', reason: 'auto-90d', dryRun: false }))
    expect(accountDelete).not.toHaveBeenCalled()
    expect(userDeleteMany).not.toHaveBeenCalled()
  })

  it('manual path may delete a non-cancelled account (statutory requests)', async () => {
    accountFindUnique.mockResolvedValue({ id: 'acct_1', name: 'Clinic', status: 'active', statusChangedAt: null })
    await accountDeleteHandler(job({ accountId: 'acct_1', reason: 'manual', dryRun: false }))
    expect(accountDelete).toHaveBeenCalled()
  })
})
