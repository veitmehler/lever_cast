import { describe, it, expect, vi, beforeEach } from 'vitest'
import Fastify from 'fastify'

const requireAuthMock = vi.fn()
vi.mock('../../middleware/auth', () => ({
  requireAuth: (...a: unknown[]) => requireAuthMock(...a),
}))

const userFindUnique = vi.fn()
const userCreate = vi.fn()
const settingsFindUnique = vi.fn()
const settingsCreate = vi.fn()
const templateFindMany = vi.fn()
const templateFindFirst = vi.fn()
const socialConnFindMany = vi.fn()
const apiKeyFindFirst = vi.fn()
vi.mock('@socioply/shared', () => ({
  prisma: {
    user: {
      findUnique: (...a: unknown[]) => userFindUnique(...a),
      create: (...a: unknown[]) => userCreate(...a),
    },
    settings: {
      findUnique: (...a: unknown[]) => settingsFindUnique(...a),
      create: (...a: unknown[]) => settingsCreate(...a),
    },
    template: {
      findMany: (...a: unknown[]) => templateFindMany(...a),
      findFirst: (...a: unknown[]) => templateFindFirst(...a),
    },
    socialConnection: { findMany: (...a: unknown[]) => socialConnFindMany(...a) },
    apiKey: { findFirst: (...a: unknown[]) => apiKeyFindFirst(...a) },
  },
}))

const getSystemApiKey = vi.fn()
vi.mock('../../lib/system-keys', () => ({ getSystemApiKey: (...a: unknown[]) => getSystemApiKey(...a) }))
vi.mock('../../lib/utils', () => ({ cleanText: (s: string) => s }))

import { aiRoutes } from '../ai'

async function build() {
  const app = Fastify()
  await app.register(aiRoutes)
  await app.ready()
  return app
}

beforeEach(() => {
  vi.clearAllMocks()
  requireAuthMock.mockResolvedValue('clerk_A')
  userFindUnique.mockResolvedValue({ id: 'user_A' })
  settingsFindUnique.mockResolvedValue({ id: 's1', userId: 'user_A' })
  templateFindMany.mockResolvedValue([])
  // No system LLM key configured by default → routes degrade to 503.
  getSystemApiKey.mockResolvedValue(null)
})

describe('POST /generate', () => {
  it('rejects unauthenticated requests at the auth gate', async () => {
    requireAuthMock.mockImplementation(async (_req: unknown, reply: { status: (c: number) => { send: (b: unknown) => void } }) => {
      reply.status(401).send({ error: 'Unauthorized' })
      return undefined
    })
    const app = await build()
    const res = await app.inject({ method: 'POST', url: '/generate', payload: { rawIdea: 'x', platform: 'linkedin' } })
    expect(res.statusCode).toBe(401)
    await app.close()
  })

  it('requires rawIdea', async () => {
    const app = await build()
    const res = await app.inject({ method: 'POST', url: '/generate', payload: { platform: 'linkedin' } })
    expect(res.statusCode).toBe(400)
    await app.close()
  })

  it('requires platform', async () => {
    const app = await build()
    const res = await app.inject({ method: 'POST', url: '/generate', payload: { rawIdea: 'an idea' } })
    expect(res.statusCode).toBe(400)
    await app.close()
  })

  it('returns 503 when no system LLM provider is configured', async () => {
    const app = await build()
    const res = await app.inject({ method: 'POST', url: '/generate', payload: { rawIdea: 'an idea', platform: 'linkedin' } })
    expect(res.statusCode).toBe(503)
    expect(res.json().error).toContain('No LLM provider is configured')
    await app.close()
  })
})

describe('POST /analyze-writing-style', () => {
  it('rejects unauthenticated requests at the auth gate', async () => {
    requireAuthMock.mockImplementation(async (_req: unknown, reply: { status: (c: number) => { send: (b: unknown) => void } }) => {
      reply.status(401).send({ error: 'Unauthorized' })
      return undefined
    })
    const app = await build()
    const res = await app.inject({ method: 'POST', url: '/analyze-writing-style', payload: { sampleText: 'word '.repeat(500) } })
    expect(res.statusCode).toBe(401)
    await app.close()
  })

  it('requires at least 500 words of sample text', async () => {
    const app = await build()
    const res = await app.inject({ method: 'POST', url: '/analyze-writing-style', payload: { sampleText: 'too short' } })
    expect(res.statusCode).toBe(400)
    expect(res.json().error).toContain('500 words')
    await app.close()
  })

  it('returns 503 with a long sample when no provider is configured', async () => {
    const app = await build()
    const res = await app.inject({ method: 'POST', url: '/analyze-writing-style', payload: { sampleText: 'word '.repeat(500) } })
    expect(res.statusCode).toBe(503)
    expect(res.json().error).toContain('No LLM provider is configured')
    await app.close()
  })
})
