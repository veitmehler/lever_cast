import { describe, it, expect, vi, beforeEach } from 'vitest'
import Fastify from 'fastify'

const requireAuthMock = vi.fn()
vi.mock('../../middleware/auth', () => ({
  requireAuth: (...a: unknown[]) => requireAuthMock(...a),
}))

const userFindUnique = vi.fn()
const jobFindMany = vi.fn()
const jobFindFirst = vi.fn()
const sitePageFindFirst = vi.fn()
const sitePageUpdate = vi.fn()
vi.mock('@omniply/shared', () => ({
  prisma: {
    user: { findUnique: (...a: unknown[]) => userFindUnique(...a) },
    articleJob: {
      findMany: (...a: unknown[]) => jobFindMany(...a),
      findFirst: (...a: unknown[]) => jobFindFirst(...a),
    },
    sitePage: {
      findFirst: (...a: unknown[]) => sitePageFindFirst(...a),
      update: (...a: unknown[]) => sitePageUpdate(...a),
    },
  },
  readS3Object: vi.fn(),
}))

// Stub the heavy/irrelevant pipeline + queue deps the route module imports.
vi.mock('../../article-pipeline/executor', () => ({ runPipelinePhaseA: vi.fn() }))
vi.mock('../../article-pipeline/approval-service', () => ({ approveArticleJob: vi.fn() }))
vi.mock('../../queues/index', () => ({ getBoss: async () => ({ send: vi.fn() }), QUEUES: {} }))
vi.mock('../../article-pipeline/output/registry', () => ({ VALID_TARGETS: ['html'] }))
vi.mock('../../article-pipeline/enrichment/html-parser', () => ({
  injectHeadingIds: (h: string) => h,
  extractHeadingsForToc: () => [],
  buildTocHtml: () => '',
  findFirstH2Index: () => 0,
}))
vi.mock('../../article-pipeline/syndication/enqueue', () => ({ enqueueSyndication: vi.fn() }))
vi.mock('../../social/automation/enqueue', () => ({ enqueueSocialAutomation: vi.fn() }))
vi.mock('../../social/automation/enqueue-dispatch', () => ({ enqueueSocialDispatch: vi.fn() }))
vi.mock('../../lib/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }))

import { articleRoutes } from '../articles'

async function build() {
  const app = Fastify()
  await app.register(articleRoutes)
  await app.ready()
  return app
}

beforeEach(() => {
  vi.clearAllMocks()
  requireAuthMock.mockResolvedValue('clerk_A')
  userFindUnique.mockResolvedValue({ id: 'user_A' })
})

describe('articles — auth & user resolution', () => {
  it('rejects unauthenticated requests at the auth gate', async () => {
    requireAuthMock.mockImplementation(async (_req: unknown, reply: { status: (c: number) => { send: (b: unknown) => void } }) => {
      reply.status(401).send({ error: 'Unauthorized' })
      return undefined
    })
    const app = await build()
    const res = await app.inject({ method: 'GET', url: '/articles' })
    expect(res.statusCode).toBe(401)
    expect(userFindUnique).not.toHaveBeenCalled()
    await app.close()
  })

  it('returns 404 when the clerk has no user row', async () => {
    userFindUnique.mockResolvedValue(null)
    const app = await build()
    const res = await app.inject({ method: 'GET', url: '/articles' })
    expect(res.statusCode).toBe(404)
    await app.close()
  })
})

describe('GET /articles — ownership scoping & status filter', () => {
  it('lists only the authenticated user’s jobs', async () => {
    jobFindMany.mockResolvedValue([])
    const app = await build()
    const res = await app.inject({ method: 'GET', url: '/articles' })
    expect(res.statusCode).toBe(200)
    expect((jobFindMany.mock.calls[0][0] as { where: { userId: string } }).where.userId).toBe('user_A')
    await app.close()
  })

  it('excludes Phase-B jobs from the completed filter (currentStep < 13)', async () => {
    jobFindMany.mockResolvedValue([])
    const app = await build()
    await app.inject({ method: 'GET', url: '/articles?status=completed' })
    const where = (jobFindMany.mock.calls[0][0] as { where: Record<string, unknown> }).where
    expect(where).toMatchObject({ status: 'completed', currentStep: { lt: 13 } })
    await app.close()
  })
})

describe('GET /articles/:jobId', () => {
  it('returns 404 for another user’s job', async () => {
    jobFindFirst.mockResolvedValue(null)
    const app = await build()
    const res = await app.inject({ method: 'GET', url: '/articles/other' })
    expect(res.statusCode).toBe(404)
    expect((jobFindFirst.mock.calls[0][0] as { where: Record<string, unknown> }).where).toMatchObject({ id: 'other', userId: 'user_A' })
    await app.close()
  })

  it('returns the owned job', async () => {
    jobFindFirst.mockResolvedValue({ id: 'job_1', sitePage: null, pipelineSteps: [] })
    const app = await build()
    const res = await app.inject({ method: 'GET', url: '/articles/job_1' })
    expect(res.statusCode).toBe(200)
    expect(res.json().job.id).toBe('job_1')
    await app.close()
  })
})

describe('PATCH /articles/:jobId/content', () => {
  it('returns 404 when the site page is not the user’s', async () => {
    sitePageFindFirst.mockResolvedValue(null)
    const app = await build()
    const res = await app.inject({ method: 'PATCH', url: '/articles/job_1/content', payload: { seoTitle: 'X' } })
    expect(res.statusCode).toBe(404)
    expect(sitePageUpdate).not.toHaveBeenCalled()
    await app.close()
  })

  it('rejects a body with no editable fields', async () => {
    sitePageFindFirst.mockResolvedValue({ id: 'sp_1' })
    const app = await build()
    const res = await app.inject({ method: 'PATCH', url: '/articles/job_1/content', payload: { nope: 1 } })
    expect(res.statusCode).toBe(400)
    expect(sitePageUpdate).not.toHaveBeenCalled()
    await app.close()
  })

  it('updates the title and seoTitle together from seoTitle', async () => {
    sitePageFindFirst.mockResolvedValue({ id: 'sp_1' })
    sitePageUpdate.mockResolvedValue({})
    const app = await build()
    const res = await app.inject({ method: 'PATCH', url: '/articles/job_1/content', payload: { seoTitle: '  New Title  ' } })
    expect(res.statusCode).toBe(200)
    const data = (sitePageUpdate.mock.calls[0][0] as { data: { title: string; seoTitle: string } }).data
    expect(data.title).toBe('New Title')
    expect(data.seoTitle).toBe('New Title')
    await app.close()
  })
})
