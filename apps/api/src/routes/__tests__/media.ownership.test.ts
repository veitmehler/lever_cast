import { describe, it, expect, vi, beforeEach } from 'vitest'
import Fastify from 'fastify'

// Mock the auth middleware: by default it resolves a known clerk id.
const requireAuthMock = vi.fn()
vi.mock('../../middleware/auth', () => ({
  requireAuth: (...a: unknown[]) => requireAuthMock(...a),
}))

// Mock Prisma so no real DB connection is made.
const userFindUnique = vi.fn()
const mediaFindMany = vi.fn()
const mediaCount = vi.fn()
const mediaFindFirst = vi.fn()
const mediaUpdate = vi.fn()
vi.mock('../../lib/prisma', () => ({
  prisma: {
    user: { findUnique: (...a: unknown[]) => userFindUnique(...a) },
    media: {
      findMany: (...a: unknown[]) => mediaFindMany(...a),
      count: (...a: unknown[]) => mediaCount(...a),
      findFirst: (...a: unknown[]) => mediaFindFirst(...a),
      update: (...a: unknown[]) => mediaUpdate(...a),
    },
  },
}))

vi.mock('@socioply/shared', () => ({ uploadImageToStorage: vi.fn() }))

import { mediaRoutes } from '../media'

async function build() {
  const app = Fastify()
  await app.register(mediaRoutes)
  await app.ready()
  return app
}

beforeEach(() => {
  vi.clearAllMocks()
  // Authenticated as clerk_A → user_A
  requireAuthMock.mockResolvedValue('clerk_A')
  userFindUnique.mockResolvedValue({ id: 'user_A' })
})

describe('media routes ownership scoping (characterization)', () => {
  it('GET /media filters by the authenticated user id', async () => {
    mediaFindMany.mockResolvedValue([])
    mediaCount.mockResolvedValue(0)

    const app = await build()
    const res = await app.inject({ method: 'GET', url: '/media' })
    expect(res.statusCode).toBe(200)

    const where = (mediaFindMany.mock.calls[0][0] as { where: Record<string, unknown> }).where
    expect(where.userId).toBe('user_A')
    expect(where.deletedAt).toBeNull()
    await app.close()
  })

  it("DELETE /media/:id returns 404 for a row that isn't the user's", async () => {
    // findFirst is scoped by userId, so another user's row resolves to null.
    mediaFindFirst.mockResolvedValue(null)

    const app = await build()
    const res = await app.inject({ method: 'DELETE', url: '/media/someone-elses-id' })

    expect(res.statusCode).toBe(404)
    const where = (mediaFindFirst.mock.calls[0][0] as { where: Record<string, unknown> }).where
    expect(where).toMatchObject({ id: 'someone-elses-id', userId: 'user_A', deletedAt: null })
    expect(mediaUpdate).not.toHaveBeenCalled()
    await app.close()
  })

  it('rejects unauthenticated requests at the auth gate', async () => {
    // Simulate requireAuth sending its own 401 and returning undefined.
    requireAuthMock.mockImplementation(async (_req: unknown, reply: { status: (c: number) => { send: (b: unknown) => void } }) => {
      reply.status(401).send({ error: 'Unauthorized' })
      return undefined
    })

    const app = await build()
    const res = await app.inject({ method: 'GET', url: '/media' })
    expect(res.statusCode).toBe(401)
    expect(userFindUnique).not.toHaveBeenCalled()
    await app.close()
  })
})
