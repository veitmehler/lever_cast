import { describe, it, expect, vi, beforeEach } from 'vitest'
import Fastify from 'fastify'

const requireAuthMock = vi.fn()
vi.mock('../../middleware/auth', () => ({
  requireAuth: (...a: unknown[]) => requireAuthMock(...a),
}))

const userFindUnique = vi.fn()
const ghlFindUnique = vi.fn()
const ghlUpsert = vi.fn()
const ghlUpdate = vi.fn()
vi.mock('@omniply/shared', () => ({
  prisma: {
    user: { findUnique: (...a: unknown[]) => userFindUnique(...a) },
    ghlSettings: {
      findUnique: (...a: unknown[]) => ghlFindUnique(...a),
      upsert: (...a: unknown[]) => ghlUpsert(...a),
      update: (...a: unknown[]) => ghlUpdate(...a),
    },
  },
  decrypt: (v: string) => `dec(${v})`,
  encrypt: (v: string) => `enc(${v})`,
  maskApiKey: (v: string) => `mask(${v})`,
  // Account-scoped helpers: keep driving the existing ghlFindUnique mock and
  // treat the caller as their own account owner (single-member account in tests).
  ghlSettingsForUser: (userId: string) => ghlFindUnique({ where: { userId } }),
  canonicalAccountUserId: (userId: string) => userId,
}))

const getGhlOAuthStartUrl = vi.fn()
const listGhlAccounts = vi.fn()
vi.mock('../../lib/ghl/client', () => ({
  getGhlOAuthStartUrl: (...a: unknown[]) => getGhlOAuthStartUrl(...a),
  listGhlAccounts: (...a: unknown[]) => listGhlAccounts(...a),
}))
vi.mock('../../lib/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }))

import { ghlRoutes } from '../ghl'

async function build() {
  const app = Fastify()
  await app.register(ghlRoutes)
  await app.ready()
  return app
}

beforeEach(() => {
  vi.clearAllMocks()
  requireAuthMock.mockResolvedValue('clerk_A')
  userFindUnique.mockResolvedValue({ id: 'user_A' })
  ghlUpdate.mockResolvedValue({})
})

describe('ghl routes — auth & user resolution', () => {
  it('rejects unauthenticated requests at the auth gate', async () => {
    requireAuthMock.mockImplementation(async (_req: unknown, reply: { status: (c: number) => { send: (b: unknown) => void } }) => {
      reply.status(401).send({ error: 'Unauthorized' })
      return undefined
    })
    const app = await build()
    const res = await app.inject({ method: 'GET', url: '/ghl/settings' })
    expect(res.statusCode).toBe(401)
    expect(userFindUnique).not.toHaveBeenCalled()
    await app.close()
  })

  it('returns 404 when the clerk has no user row', async () => {
    userFindUnique.mockResolvedValue(null)
    const app = await build()
    const res = await app.inject({ method: 'GET', url: '/ghl/settings' })
    expect(res.statusCode).toBe(404)
    await app.close()
  })
})

describe('GET /ghl/settings', () => {
  it('returns the unconfigured default when no settings row exists', async () => {
    ghlFindUnique.mockResolvedValue(null)
    const app = await build()
    const res = await app.inject({ method: 'GET', url: '/ghl/settings' })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toMatchObject({ configured: false, ghlLocationId: '', maskedApiKey: '' })
    // the row is scoped to the user
    expect((ghlFindUnique.mock.calls[0][0] as { where: { userId: string } }).where.userId).toBe('user_A')
    await app.close()
  })

  it('reports configured with a masked key when all fields are set', async () => {
    ghlFindUnique.mockResolvedValue({
      ghlApiKey: 'enc-key', ghlLocationId: 'loc1', ghlUserId: 'u1',
      accountIds: {}, lastVerifiedAt: null, lastError: null,
    })
    const app = await build()
    const res = await app.inject({ method: 'GET', url: '/ghl/settings' })
    const body = res.json()
    expect(body.configured).toBe(true)
    expect(body.hasApiKey).toBe(true)
    expect(body.maskedApiKey).toBe('mask(dec(enc-key))')
    await app.close()
  })
})

describe('PUT /ghl/settings', () => {
  it('requires location and user ids', async () => {
    ghlFindUnique.mockResolvedValue(null)
    const app = await build()
    const res = await app.inject({ method: 'PUT', url: '/ghl/settings', payload: { ghlApiKey: 'sk' } })
    expect(res.statusCode).toBe(400)
    expect(ghlUpsert).not.toHaveBeenCalled()
    await app.close()
  })

  it('requires an api key when none is stored yet', async () => {
    ghlFindUnique.mockResolvedValue(null)
    const app = await build()
    const res = await app.inject({ method: 'PUT', url: '/ghl/settings', payload: { ghlLocationId: 'loc1', ghlUserId: 'u1' } })
    expect(res.statusCode).toBe(400)
    expect(ghlUpsert).not.toHaveBeenCalled()
    await app.close()
  })

  it('encrypts the api key and upserts the settings scoped to the user', async () => {
    ghlFindUnique.mockResolvedValue(null)
    ghlUpsert.mockResolvedValue({ ghlLocationId: 'loc1', ghlUserId: 'u1', accountIds: {} })
    const app = await build()
    const res = await app.inject({
      method: 'PUT', url: '/ghl/settings',
      payload: { ghlApiKey: 'sk-123', ghlLocationId: 'loc1', ghlUserId: 'u1' },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toMatchObject({ configured: true, maskedApiKey: 'mask(dec(enc(sk-123)))' })
    const args = ghlUpsert.mock.calls[0][0] as { where: { userId: string }; create: { ghlApiKey: string } }
    expect(args.where.userId).toBe('user_A')
    expect(args.create.ghlApiKey).toBe('enc(sk-123)')
    await app.close()
  })
})

describe('GET /ghl/oauth-url/:platform', () => {
  it('rejects an unsupported platform', async () => {
    const app = await build()
    const res = await app.inject({ method: 'GET', url: '/ghl/oauth-url/tiktok' })
    expect(res.statusCode).toBe(400)
    await app.close()
  })

  it('returns the start url for a supported platform', async () => {
    getGhlOAuthStartUrl.mockReturnValue('https://ghl/oauth?platform=linkedin')
    const app = await build()
    const res = await app.inject({ method: 'GET', url: '/ghl/oauth-url/linkedin' })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ url: 'https://ghl/oauth?platform=linkedin' })
    expect(getGhlOAuthStartUrl).toHaveBeenCalledWith('linkedin')
    await app.close()
  })
})

describe('GET /ghl/accounts', () => {
  it('returns 400 until the api key and location id are saved', async () => {
    ghlFindUnique.mockResolvedValue({ ghlApiKey: null, ghlLocationId: null })
    const app = await build()
    const res = await app.inject({ method: 'GET', url: '/ghl/accounts' })
    expect(res.statusCode).toBe(400)
    expect(listGhlAccounts).not.toHaveBeenCalled()
    await app.close()
  })

  it('lists accounts and records a successful verification', async () => {
    ghlFindUnique.mockResolvedValue({ ghlApiKey: 'enc-key', ghlLocationId: 'loc1' })
    listGhlAccounts.mockResolvedValue([{ id: 'acc1', platform: 'linkedin' }])
    const app = await build()
    const res = await app.inject({ method: 'GET', url: '/ghl/accounts' })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ accounts: [{ id: 'acc1', platform: 'linkedin' }] })
    const upd = (ghlUpdate.mock.calls[0][0] as { data: { lastVerifiedAt: unknown; lastError: null } }).data
    expect(upd.lastError).toBeNull()
    expect(listGhlAccounts).toHaveBeenCalledWith('dec(enc-key)', 'loc1')
    await app.close()
  })

  it('returns a warning when zero accounts come back', async () => {
    ghlFindUnique.mockResolvedValue({ ghlApiKey: 'enc-key', ghlLocationId: 'loc1' })
    listGhlAccounts.mockResolvedValue([])
    const app = await build()
    const res = await app.inject({ method: 'GET', url: '/ghl/accounts' })
    const body = res.json()
    expect(body.accounts).toEqual([])
    expect(body.warning).toContain('0 accounts')
    await app.close()
  })

  it('records the error and returns 400 when the GHL client throws', async () => {
    ghlFindUnique.mockResolvedValue({ ghlApiKey: 'enc-key', ghlLocationId: 'loc1' })
    listGhlAccounts.mockRejectedValue(new Error('bad scopes'))
    const app = await build()
    const res = await app.inject({ method: 'GET', url: '/ghl/accounts' })
    expect(res.statusCode).toBe(400)
    expect(res.json()).toEqual({ error: 'bad scopes' })
    const upd = (ghlUpdate.mock.calls[0][0] as { data: { lastError: string } }).data
    expect(upd.lastError).toBe('bad scopes')
    await app.close()
  })
})
