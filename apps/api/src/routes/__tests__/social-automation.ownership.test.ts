import { describe, it, expect, vi, beforeEach } from 'vitest'
import Fastify from 'fastify'

const requireAuthMock = vi.fn()
vi.mock('../../middleware/auth', () => ({
  requireAuth: (...a: unknown[]) => requireAuthMock(...a),
}))

const userFindUnique = vi.fn()
const runFindFirst = vi.fn()
vi.mock('@omniply/shared', () => ({
  prisma: {
    user: { findUnique: (...a: unknown[]) => userFindUnique(...a) },
    socialAutomationRun: { findFirst: (...a: unknown[]) => runFindFirst(...a) },
  },
}))

const retryAutomationSpec = vi.fn()
vi.mock('../../social/automation/run', () => ({
  retryAutomationSpec: (...a: unknown[]) => retryAutomationSpec(...a),
}))
const enqueueSocialDispatch = vi.fn()
const enqueueSocialRegenerate = vi.fn()
vi.mock('../../social/automation/enqueue-dispatch', () => ({
  enqueueSocialDispatch: (...a: unknown[]) => enqueueSocialDispatch(...a),
  enqueueSocialRegenerate: (...a: unknown[]) => enqueueSocialRegenerate(...a),
}))

import { socialAutomationRoutes } from '../social-automation'

async function build() {
  const app = Fastify()
  await app.register(socialAutomationRoutes)
  await app.ready()
  return app
}

beforeEach(() => {
  vi.clearAllMocks()
  requireAuthMock.mockResolvedValue('clerk_A')
  userFindUnique.mockResolvedValue({ id: 'user_A' })
  runFindFirst.mockResolvedValue({ id: 'run_1', userId: 'user_A' })
})

describe('GET /social-automation/:runId', () => {
  it('rejects unauthenticated requests at the auth gate', async () => {
    requireAuthMock.mockImplementation(async (_req: unknown, reply: { status: (c: number) => { send: (b: unknown) => void } }) => {
      reply.status(401).send({ error: 'Unauthorized' })
      return undefined
    })
    const app = await build()
    const res = await app.inject({ method: 'GET', url: '/social-automation/run_1' })
    expect(res.statusCode).toBe(401)
    await app.close()
  })

  it('returns 404 when the clerk has no user row', async () => {
    userFindUnique.mockResolvedValue(null)
    const app = await build()
    const res = await app.inject({ method: 'GET', url: '/social-automation/run_1' })
    expect(res.statusCode).toBe(404)
    await app.close()
  })

  it('returns 404 for another user’s run', async () => {
    runFindFirst.mockResolvedValue(null)
    const app = await build()
    const res = await app.inject({ method: 'GET', url: '/social-automation/other' })
    expect(res.statusCode).toBe(404)
    expect((runFindFirst.mock.calls[0][0] as { where: Record<string, unknown> }).where).toMatchObject({ id: 'other', userId: 'user_A' })
    await app.close()
  })

  it('returns the owned run', async () => {
    runFindFirst.mockResolvedValue({ id: 'run_1', userId: 'user_A', specResults: [] })
    const app = await build()
    const res = await app.inject({ method: 'GET', url: '/social-automation/run_1' })
    expect(res.statusCode).toBe(200)
    expect(res.json().run.id).toBe('run_1')
    await app.close()
  })
})

describe('POST /social-automation/:runId/approve/:slotKey', () => {
  it('returns 404 for another user’s run before enqueueing', async () => {
    runFindFirst.mockResolvedValue(null)
    const app = await build()
    const res = await app.inject({ method: 'POST', url: '/social-automation/other/approve/f6' })
    expect(res.statusCode).toBe(404)
    expect(enqueueSocialDispatch).not.toHaveBeenCalled()
    await app.close()
  })

  it('enqueues a dispatch with the uppercased slot key', async () => {
    enqueueSocialDispatch.mockResolvedValue({ enqueued: true })
    const app = await build()
    const res = await app.inject({ method: 'POST', url: '/social-automation/run_1/approve/f6' })
    expect(res.statusCode).toBe(202)
    expect(enqueueSocialDispatch).toHaveBeenCalledWith('run_1', { slotKey: 'F6' })
    await app.close()
  })

  it('returns 400 when the dispatch is not enqueued', async () => {
    enqueueSocialDispatch.mockResolvedValue({ enqueued: false, message: 'not ready' })
    const app = await build()
    const res = await app.inject({ method: 'POST', url: '/social-automation/run_1/approve/f6' })
    expect(res.statusCode).toBe(400)
    expect(res.json()).toEqual({ error: 'not ready' })
    await app.close()
  })
})

describe('POST /social-automation/:runId/regenerate/:slotKey', () => {
  it('returns 404 for another user’s run', async () => {
    runFindFirst.mockResolvedValue(null)
    const app = await build()
    const res = await app.inject({ method: 'POST', url: '/social-automation/other/regenerate/s3' })
    expect(res.statusCode).toBe(404)
    expect(enqueueSocialRegenerate).not.toHaveBeenCalled()
    await app.close()
  })

  it('enqueues a regenerate → 202', async () => {
    enqueueSocialRegenerate.mockResolvedValue({ enqueued: true })
    const app = await build()
    const res = await app.inject({ method: 'POST', url: '/social-automation/run_1/regenerate/s3' })
    expect(res.statusCode).toBe(202)
    expect(enqueueSocialRegenerate).toHaveBeenCalledWith('run_1', 's3')
    await app.close()
  })
})

describe('POST /social-automation/:runId/retry/:slotKey', () => {
  it('returns 404 for another user’s run', async () => {
    runFindFirst.mockResolvedValue(null)
    const app = await build()
    const res = await app.inject({ method: 'POST', url: '/social-automation/other/retry/f6' })
    expect(res.statusCode).toBe(404)
    expect(retryAutomationSpec).not.toHaveBeenCalled()
    await app.close()
  })

  it('retries the spec with the uppercased slot key', async () => {
    retryAutomationSpec.mockResolvedValue(undefined)
    const app = await build()
    const res = await app.inject({ method: 'POST', url: '/social-automation/run_1/retry/f6' })
    expect(res.statusCode).toBe(200)
    expect(retryAutomationSpec).toHaveBeenCalledWith('run_1', 'F6')
    await app.close()
  })

  it('returns 400 when the retry throws', async () => {
    retryAutomationSpec.mockRejectedValue(new Error('spec not found'))
    const app = await build()
    const res = await app.inject({ method: 'POST', url: '/social-automation/run_1/retry/f6' })
    expect(res.statusCode).toBe(400)
    expect(res.json()).toEqual({ error: 'spec not found' })
    await app.close()
  })
})
