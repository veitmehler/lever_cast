import { describe, it, expect, vi, beforeEach } from 'vitest'
import Fastify from 'fastify'

const requireAuthMock = vi.fn()
vi.mock('../../middleware/auth', () => ({
  requireAuth: (...a: unknown[]) => requireAuthMock(...a),
}))

const userFindUnique = vi.fn()
const wpFindMany = vi.fn()
const wpFindFirst = vi.fn()
const wpUpdate = vi.fn()
const wpDelete = vi.fn()
const wpCreate = vi.fn()
const topicUpdateMany = vi.fn()
vi.mock('@socioply/shared', () => ({
  prisma: {
    user: { findUnique: (...a: unknown[]) => userFindUnique(...a) },
    wordPressConnection: {
      findMany: (...a: unknown[]) => wpFindMany(...a),
      findFirst: (...a: unknown[]) => wpFindFirst(...a),
      update: (...a: unknown[]) => wpUpdate(...a),
      delete: (...a: unknown[]) => wpDelete(...a),
      create: (...a: unknown[]) => wpCreate(...a),
    },
    topic: { updateMany: (...a: unknown[]) => topicUpdateMany(...a) },
  },
  encrypt: (v: string) => `enc(${v})`,
  decrypt: (v: string) => `dec(${v})`,
}))
vi.mock('../../lib/ssrf', () => ({ assertSafeWpUrl: vi.fn() }))

import { wpConnectionRoutes } from '../wp-connections'

async function build() {
  const app = Fastify()
  await app.register(wpConnectionRoutes)
  await app.ready()
  return app
}

beforeEach(() => {
  vi.clearAllMocks()
  requireAuthMock.mockResolvedValue('clerk_A')
  userFindUnique.mockResolvedValue({ id: 'user_A' })
})

describe('wp-connections — auth & user resolution', () => {
  it('rejects unauthenticated requests at the auth gate', async () => {
    requireAuthMock.mockImplementation(async (_req: unknown, reply: { status: (c: number) => { send: (b: unknown) => void } }) => {
      reply.status(401).send({ error: 'Unauthorized' })
      return undefined
    })
    const app = await build()
    const res = await app.inject({ method: 'GET', url: '/wp/connections' })
    expect(res.statusCode).toBe(401)
    expect(userFindUnique).not.toHaveBeenCalled()
    await app.close()
  })

  it('returns 404 when the clerk has no user row', async () => {
    userFindUnique.mockResolvedValue(null)
    const app = await build()
    const res = await app.inject({ method: 'GET', url: '/wp/connections' })
    expect(res.statusCode).toBe(404)
    await app.close()
  })
})

describe('GET /wp/connections — ownership scoping', () => {
  it('lists only the authenticated user’s connections', async () => {
    wpFindMany.mockResolvedValue([])
    const app = await build()
    const res = await app.inject({ method: 'GET', url: '/wp/connections' })
    expect(res.statusCode).toBe(200)
    const where = (wpFindMany.mock.calls[0][0] as { where: Record<string, unknown> }).where
    expect(where.userId).toBe('user_A')
    await app.close()
  })
})

describe('POST /wp/connections — validation', () => {
  it('rejects a missing required field before any verification', async () => {
    const app = await build()
    const res = await app.inject({ method: 'POST', url: '/wp/connections', payload: { label: 'Site' } })
    expect(res.statusCode).toBe(400)
    expect(wpCreate).not.toHaveBeenCalled()
    await app.close()
  })
})

describe('by-id routes — ownership 404 for another user’s connection', () => {
  // findFirst is scoped by { id, userId }, so another user's row resolves to null.
  it.each([
    ['POST', '/wp/connections/other/verify'],
    ['PATCH', '/wp/connections/other'],
    ['DELETE', '/wp/connections/other'],
  ])('%s %s → 404', async (method, url) => {
    wpFindFirst.mockResolvedValue(null)
    const app = await build()
    const res = await app.inject({ method: method as 'POST' | 'PATCH' | 'DELETE', url, payload: {} })
    expect(res.statusCode).toBe(404)
    const where = (wpFindFirst.mock.calls[0][0] as { where: Record<string, unknown> }).where
    expect(where).toMatchObject({ id: 'other', userId: 'user_A' })
    expect(wpUpdate).not.toHaveBeenCalled()
    expect(wpDelete).not.toHaveBeenCalled()
    await app.close()
  })
})

describe('DELETE /wp/connections/:id — happy path', () => {
  it('detaches referencing topics before deleting the owned connection', async () => {
    wpFindFirst.mockResolvedValue({ id: 'conn_1', userId: 'user_A' })
    topicUpdateMany.mockResolvedValue({ count: 2 })
    wpDelete.mockResolvedValue({})
    const app = await build()
    const res = await app.inject({ method: 'DELETE', url: '/wp/connections/conn_1' })

    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ ok: true })
    // topics detached first
    const detachWhere = (topicUpdateMany.mock.calls[0][0] as { where: Record<string, unknown>; data: Record<string, unknown> })
    expect(detachWhere.where).toEqual({ wordPressConnectionId: 'conn_1' })
    expect(detachWhere.data).toEqual({ wordPressConnectionId: null })
    expect(wpDelete).toHaveBeenCalledWith({ where: { id: 'conn_1' } })
    await app.close()
  })
})
