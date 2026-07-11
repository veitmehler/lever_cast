import { describe, it, expect, vi, beforeEach } from 'vitest'
import Fastify from 'fastify'

const requireAuthMock = vi.fn()
vi.mock('../../middleware/auth', () => ({
  requireAuth: (...a: unknown[]) => requireAuthMock(...a),
}))

const userFindUnique = vi.fn()
const topicCreate = vi.fn()
const topicFindMany = vi.fn()
const articleJobCreate = vi.fn()
const outlineFindMany = vi.fn()
const accountFindUnique = vi.fn()
const accountIdForUserMock = vi.fn().mockResolvedValue(null)
vi.mock('@socioply/shared', () => ({
  prisma: {
    user: { findUnique: (...a: unknown[]) => userFindUnique(...a) },
    topic: {
      create: (...a: unknown[]) => topicCreate(...a),
      findMany: (...a: unknown[]) => topicFindMany(...a),
    },
    articleJob: { create: (...a: unknown[]) => articleJobCreate(...a) },
    outlineFramework: { findMany: (...a: unknown[]) => outlineFindMany(...a) },
    account: { findUnique: (...a: unknown[]) => accountFindUnique(...a) },
  },
  accountIdForUser: (...a: unknown[]) => accountIdForUserMock(...a),
}))

const bossSend = vi.fn()
vi.mock('../../queues/index', () => ({
  getBoss: async () => ({ send: (...a: unknown[]) => bossSend(...a) }),
  QUEUES: { ARTICLE_PIPELINE: 'article-pipeline' },
}))
vi.mock('../../lib/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }))

import { topicRoutes } from '../topics'

async function build() {
  const app = Fastify()
  await app.register(topicRoutes)
  await app.ready()
  return app
}

beforeEach(() => {
  vi.clearAllMocks()
  requireAuthMock.mockResolvedValue('clerk_A')
  userFindUnique.mockResolvedValue({ id: 'user_A' })
  // Lifecycle gate defaults: no account → generation allowed (legacy behavior).
  accountIdForUserMock.mockResolvedValue(null)
  accountFindUnique.mockResolvedValue(null)
})

describe('topic routes — auth & user resolution', () => {
  it('rejects unauthenticated requests at the auth gate', async () => {
    requireAuthMock.mockImplementation(async (_req: unknown, reply: { status: (c: number) => { send: (b: unknown) => void } }) => {
      reply.status(401).send({ error: 'Unauthorized' })
      return undefined
    })
    const app = await build()
    const res = await app.inject({ method: 'GET', url: '/topics' })
    expect(res.statusCode).toBe(401)
    expect(userFindUnique).not.toHaveBeenCalled()
    await app.close()
  })

  it('returns 404 when the authenticated clerk has no user row', async () => {
    userFindUnique.mockResolvedValue(null)
    const app = await build()
    const res = await app.inject({ method: 'GET', url: '/topics' })
    expect(res.statusCode).toBe(404)
    await app.close()
  })
})

describe('GET /topics — ownership scoping', () => {
  it('lists only the authenticated user’s topics', async () => {
    topicFindMany.mockResolvedValue([])
    const app = await build()
    const res = await app.inject({ method: 'GET', url: '/topics' })
    expect(res.statusCode).toBe(200)
    const where = (topicFindMany.mock.calls[0][0] as { where: Record<string, unknown> }).where
    expect(where.userId).toBe('user_A')
    await app.close()
  })
})

describe('POST /topics', () => {
  it('rejects a missing topic with 400', async () => {
    const app = await build()
    const res = await app.inject({ method: 'POST', url: '/topics', payload: { topic: '  ' } })
    expect(res.statusCode).toBe(400)
    expect(topicCreate).not.toHaveBeenCalled()
    await app.close()
  })

  it('creates a social_only topic scoped to the user and does NOT enqueue an article job', async () => {
    topicCreate.mockResolvedValue({ id: 'topic_1' })
    const app = await build()
    const res = await app.inject({ method: 'POST', url: '/topics', payload: { topic: 'My idea' } })

    expect(res.statusCode).toBe(201)
    expect(res.json()).toEqual({ topicId: 'topic_1', mode: 'social_only' })
    expect((topicCreate.mock.calls[0][0] as { data: { userId: string } }).data.userId).toBe('user_A')
    expect(articleJobCreate).not.toHaveBeenCalled()
    expect(bossSend).not.toHaveBeenCalled()
    await app.close()
  })

  it('creates an article job and enqueues the pipeline for article_first mode', async () => {
    topicCreate.mockResolvedValue({ id: 'topic_1' })
    articleJobCreate.mockResolvedValue({ id: 'job_1' })
    const app = await build()
    const res = await app.inject({ method: 'POST', url: '/topics', payload: { topic: 'My idea', mode: 'article_first' } })

    expect(res.statusCode).toBe(202)
    expect(res.json()).toEqual({ topicId: 'topic_1', jobId: 'job_1', mode: 'article_first' })
    expect((articleJobCreate.mock.calls[0][0] as { data: { userId: string } }).data.userId).toBe('user_A')
    expect(bossSend).toHaveBeenCalledWith('article-pipeline', { jobId: 'job_1' }, expect.objectContaining({ singletonKey: 'job_1' }))
    await app.close()
  })
})

describe('lifecycle generation gate (multi-tenancy Phase A)', () => {
  it('returns 402 on topic creation when the account is cancelled', async () => {
    accountIdForUserMock.mockResolvedValue('acct_1')
    accountFindUnique.mockResolvedValue({ status: 'cancelled', paidThrough: null, billingExempt: false })
    const app = await build()
    const res = await app.inject({ method: 'POST', url: '/topics', payload: { topic: 'blocked topic' } })
    expect(res.statusCode).toBe(402)
    expect(topicCreate).not.toHaveBeenCalled()
    await app.close()
  })
})
