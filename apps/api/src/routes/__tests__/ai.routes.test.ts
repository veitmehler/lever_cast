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
const platformSettingsFindUnique = vi.fn()
const draftFindMany = vi.fn()
const accountFindUnique = vi.fn()
const accountIdForUserMock = vi.fn()
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
    platformSettings: { findUnique: (...a: unknown[]) => platformSettingsFindUnique(...a) },
    draft: { findMany: (...a: unknown[]) => draftFindMany(...a) },
    account: { findUnique: (...a: unknown[]) => accountFindUnique(...a) },
  },
  accountIdForUser: (...a: unknown[]) => accountIdForUserMock(...a),
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
  // Extra-post cap defaults: platform default cap (3), no drafts in window.
  platformSettingsFindUnique.mockResolvedValue(null)
  draftFindMany.mockResolvedValue([])
  // Lifecycle gate defaults: no account → generation allowed (legacy behavior).
  accountIdForUserMock.mockResolvedValue(null)
  accountFindUnique.mockResolvedValue(null)
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

describe('weekly extra-post cap', () => {
  const recentDraft = (daysAgo: number) => ({ createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000) })

  it('returns 429 with reset info when the account is at the cap', async () => {
    draftFindMany.mockResolvedValue([recentDraft(6), recentDraft(3), recentDraft(1)])
    const app = await build()
    const res = await app.inject({ method: 'POST', url: '/generate', payload: { rawIdea: 'x', platform: 'linkedin' } })
    expect(res.statusCode).toBe(429)
    const body = res.json()
    expect(body.error).toContain('Weekly limit of 3 extra posts reached')
    expect(body.cap).toBe(3)
    expect(body.used).toBe(3)
    expect(body.resetsAt).toBeTruthy()
    await app.close()
  })

  it('honors an admin-configured cap from platform settings', async () => {
    platformSettingsFindUnique.mockResolvedValue({ weeklyExtraPostCap: 1 })
    draftFindMany.mockResolvedValue([recentDraft(2)])
    const app = await build()
    const res = await app.inject({ method: 'POST', url: '/generate', payload: { rawIdea: 'x', platform: 'linkedin' } })
    expect(res.statusCode).toBe(429)
    expect(res.json().cap).toBe(1)
    await app.close()
  })

  it('proceeds past the cap check when under the limit (degrades to 503, no provider)', async () => {
    draftFindMany.mockResolvedValue([recentDraft(1), recentDraft(2)])
    const app = await build()
    const res = await app.inject({ method: 'POST', url: '/generate', payload: { rawIdea: 'x', platform: 'linkedin' } })
    expect(res.statusCode).toBe(503)
    await app.close()
  })

  it('exempts admins from the cap entirely', async () => {
    userFindUnique.mockResolvedValue({ id: 'user_A', role: 'admin' })
    draftFindMany.mockResolvedValue([recentDraft(1), recentDraft(2), recentDraft(3), recentDraft(4)])
    const app = await build()
    const res = await app.inject({ method: 'POST', url: '/generate', payload: { rawIdea: 'x', platform: 'linkedin' } })
    expect(res.statusCode).toBe(503) // past the cap → provider 503
    await app.close()
  })

  it('GET /extra-post-quota reports usage and reset', async () => {
    draftFindMany.mockResolvedValue([recentDraft(5)])
    const app = await build()
    const res = await app.inject({ method: 'GET', url: '/extra-post-quota' })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body).toMatchObject({ cap: 3, used: 1, remaining: 2, exempt: false })
    expect(new Date(body.resetsAt).getTime()).toBeGreaterThan(Date.now())
    await app.close()
  })
})

describe('lifecycle generation gate (multi-tenancy Phase A)', () => {
  it('returns 402 when the account is paused', async () => {
    accountIdForUserMock.mockResolvedValue('acct_1')
    accountFindUnique.mockResolvedValue({ status: 'paused', paidThrough: null, billingExempt: false })
    const app = await build()
    const res = await app.inject({ method: 'POST', url: '/generate', payload: { rawIdea: 'x', platform: 'linkedin' } })
    expect(res.statusCode).toBe(402)
    expect(res.json().error).toContain('paused')
    await app.close()
  })

  it('billingExempt account generates normally (degrades to provider 503)', async () => {
    accountIdForUserMock.mockResolvedValue('acct_1')
    accountFindUnique.mockResolvedValue({ status: 'cancelled', paidThrough: null, billingExempt: true })
    const app = await build()
    const res = await app.inject({ method: 'POST', url: '/generate', payload: { rawIdea: 'x', platform: 'linkedin' } })
    expect(res.statusCode).toBe(503)
    await app.close()
  })
})
