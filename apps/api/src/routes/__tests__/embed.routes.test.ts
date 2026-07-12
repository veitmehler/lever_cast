import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Fastify from 'fastify'

const ghlSettingsFindFirst = vi.fn()
const userFindUnique = vi.fn()
const userCreate = vi.fn()
const userUpdate = vi.fn()
const accountFindUnique = vi.fn()
vi.mock('@socioply/shared', () => ({
  prisma: {
    ghlSettings: { findFirst: (...a: unknown[]) => ghlSettingsFindFirst(...a) },
    user: {
      findUnique: (...a: unknown[]) => userFindUnique(...a),
      create: (...a: unknown[]) => userCreate(...a),
      update: (...a: unknown[]) => userUpdate(...a),
    },
    account: { findUnique: (...a: unknown[]) => accountFindUnique(...a) },
  },
}))
vi.mock('../../lib/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }))

import { embedRoutes } from '../embed'
import { encryptGhlSsoForTest, verifyEmbedToken } from '../../lib/embed-auth'

const SECRET = 'sso-secret'

async function build() {
  const app = Fastify()
  await app.register(embedRoutes)
  await app.ready()
  return app
}

function payload(over: Record<string, unknown> = {}) {
  return encryptGhlSsoForTest(
    { userId: 'ghluser_1', companyId: 'co_1', activeLocation: 'loc_1', email: 'dr@clinic.com', userName: 'Dr. Who', ...over },
    SECRET,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.GHL_SSO_SECRET = SECRET
  ghlSettingsFindFirst.mockResolvedValue({ userId: 'owner_1' })
  // user.findUnique is called with different wheres — default: owner lookup
  userFindUnique.mockImplementation(async (args: { where?: Record<string, unknown> }) => {
    if (args?.where?.id === 'owner_1') return { accountId: 'acct_1' }
    return null // no existing ghl/email user
  })
  userCreate.mockResolvedValue({ id: 'u_new', clerkId: 'ghl:ghluser_1', email: 'dr@clinic.com', name: 'Dr. Who', accountId: 'acct_1', ghlUserId: 'ghluser_1' })
  accountFindUnique.mockResolvedValue({ onboardingCompletedAt: null, status: 'active' })
})

afterEach(() => {
  delete process.env.GHL_SSO_SECRET
})

describe('POST /embed/session', () => {
  it('503s when the SSO secret is unset', async () => {
    delete process.env.GHL_SSO_SECRET
    const app = await build()
    const res = await app.inject({ method: 'POST', url: '/embed/session', payload: { encryptedData: 'x' } })
    expect(res.statusCode).toBe(503)
    await app.close()
  })

  it('401s on an undecryptable payload', async () => {
    const app = await build()
    const res = await app.inject({
      method: 'POST', url: '/embed/session',
      payload: { encryptedData: Buffer.from('junk').toString('base64') },
    })
    expect(res.statusCode).toBe(401)
    await app.close()
  })

  it('returns provisioningPending for an unknown location without creating anything', async () => {
    ghlSettingsFindFirst.mockResolvedValue(null)
    const app = await build()
    const res = await app.inject({ method: 'POST', url: '/embed/session', payload: { encryptedData: payload() } })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toMatchObject({ provisioningPending: true })
    expect(userCreate).not.toHaveBeenCalled()
    await app.close()
  })

  it('creates a user with a synthetic clerkId and returns a verifiable token', async () => {
    const app = await build()
    const res = await app.inject({ method: 'POST', url: '/embed/session', payload: { encryptedData: payload() } })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(userCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ clerkId: 'ghl:ghluser_1', ghlUserId: 'ghluser_1', accountId: 'acct_1' }) }),
    )
    expect(body.onboardingCompleted).toBe(false)
    const verified = verifyEmbedToken(body.token)
    expect(verified).toMatchObject({ sub: 'ghl:ghluser_1', accountId: 'acct_1' })
    await app.close()
  })

  it('refuses a user whose account differs from the location account', async () => {
    userFindUnique.mockImplementation(async (args: { where?: Record<string, unknown> }) => {
      if (args?.where?.id === 'owner_1') return { accountId: 'acct_1' }
      if (args?.where?.ghlUserId) return { id: 'u_x', clerkId: 'ghl:ghluser_1', accountId: 'acct_OTHER', ghlUserId: 'ghluser_1', email: 'dr@clinic.com', name: null }
      return null
    })
    const app = await build()
    const res = await app.inject({ method: 'POST', url: '/embed/session', payload: { encryptedData: payload() } })
    expect(res.statusCode).toBe(403)
    await app.close()
  })

  it('rejects agency-context payloads (no activeLocation)', async () => {
    const app = await build()
    const res = await app.inject({
      method: 'POST', url: '/embed/session',
      payload: { encryptedData: payload({ activeLocation: undefined }) },
    })
    expect(res.statusCode).toBe(400)
    await app.close()
  })
})
