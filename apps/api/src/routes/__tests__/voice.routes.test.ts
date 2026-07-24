import { describe, it, expect, vi, beforeEach } from 'vitest'
import Fastify from 'fastify'

const requireAuthMock = vi.fn()
vi.mock('../../middleware/auth', () => ({
  requireAuth: (...a: unknown[]) => requireAuthMock(...a),
}))

const userFindUnique = vi.fn()
const apiKeyFindFirst = vi.fn()
const apiKeyUpdate = vi.fn()
const apiKeyCreate = vi.fn()
vi.mock('@omniply/shared', () => ({
  prisma: {
    user: { findUnique: (...a: unknown[]) => userFindUnique(...a) },
    apiKey: {
      findFirst: (...a: unknown[]) => apiKeyFindFirst(...a),
      update: (...a: unknown[]) => apiKeyUpdate(...a),
      create: (...a: unknown[]) => apiKeyCreate(...a),
    },
  },
  encrypt: (v: string) => `enc(${v})`,
  maskApiKey: (v: string) => `mask(${v})`,
  uploadBufferWithKey: vi.fn(),
  deleteS3Prefix: vi.fn(),
}))

const verifyElevenLabsKey = vi.fn()
const listElevenLabsVoices = vi.fn()
const cloneElevenLabsVoice = vi.fn()
vi.mock('../../lib/elevenlabs/client', () => ({
  verifyElevenLabsKey: (...a: unknown[]) => verifyElevenLabsKey(...a),
  listElevenLabsVoices: (...a: unknown[]) => listElevenLabsVoices(...a),
  cloneElevenLabsVoice: (...a: unknown[]) => cloneElevenLabsVoice(...a),
}))

const getVoiceSettings = vi.fn()
const updateVoiceSettings = vi.fn()
const getUserElevenLabsApiKey = vi.fn()
vi.mock('../../lib/elevenlabs/settings', () => ({
  getVoiceSettings: (...a: unknown[]) => getVoiceSettings(...a),
  updateVoiceSettings: (...a: unknown[]) => updateVoiceSettings(...a),
  getUserElevenLabsApiKey: (...a: unknown[]) => getUserElevenLabsApiKey(...a),
}))

import { voiceRoutes } from '../voice'

async function build() {
  const app = Fastify()
  await app.register(voiceRoutes)
  await app.ready()
  return app
}

const SETTINGS = {
  voiceId: 'v1', modelId: 'm1', voiceoverEnabled: true,
  stability: 0.5, similarity: 0.5, speed: 1, hasApiKey: true,
}

beforeEach(() => {
  vi.clearAllMocks()
  requireAuthMock.mockResolvedValue('clerk_A')
  userFindUnique.mockResolvedValue({ id: 'user_A' })
  getVoiceSettings.mockResolvedValue(SETTINGS)
  updateVoiceSettings.mockResolvedValue({ ...SETTINGS, apiKey: 'sk-live' })
})

describe('voice routes — auth & user resolution', () => {
  it('rejects unauthenticated requests at the auth gate', async () => {
    requireAuthMock.mockImplementation(async (_req: unknown, reply: { status: (c: number) => { send: (b: unknown) => void } }) => {
      reply.status(401).send({ error: 'Unauthorized' })
      return undefined
    })
    const app = await build()
    const res = await app.inject({ method: 'GET', url: '/voice/settings' })
    expect(res.statusCode).toBe(401)
    expect(userFindUnique).not.toHaveBeenCalled()
    await app.close()
  })

  it('returns 404 when the clerk has no user row', async () => {
    userFindUnique.mockResolvedValue(null)
    const app = await build()
    const res = await app.inject({ method: 'GET', url: '/voice/settings' })
    expect(res.statusCode).toBe(404)
    await app.close()
  })
})

describe('GET /voice/settings', () => {
  it('returns the user’s voice settings', async () => {
    const app = await build()
    const res = await app.inject({ method: 'GET', url: '/voice/settings' })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual(SETTINGS)
    expect(getVoiceSettings).toHaveBeenCalledWith('user_A')
    await app.close()
  })
})

describe('PUT /voice/settings', () => {
  it('updates settings only when no api key is supplied', async () => {
    const app = await build()
    const res = await app.inject({ method: 'PUT', url: '/voice/settings', payload: { voiceoverEnabled: false } })
    expect(res.statusCode).toBe(200)
    expect(verifyElevenLabsKey).not.toHaveBeenCalled()
    expect(apiKeyCreate).not.toHaveBeenCalled()
    expect(updateVoiceSettings).toHaveBeenCalledWith('user_A', expect.objectContaining({ voiceoverEnabled: false }))
    await app.close()
  })

  it('verifies and stores a new api key (create) for the user', async () => {
    verifyElevenLabsKey.mockResolvedValue({ ok: true })
    apiKeyFindFirst.mockResolvedValue(null)
    const app = await build()
    const res = await app.inject({ method: 'PUT', url: '/voice/settings', payload: { elevenLabsApiKey: 'sk-new' } })
    expect(res.statusCode).toBe(200)
    expect(verifyElevenLabsKey).toHaveBeenCalledWith('sk-new')
    const createArg = apiKeyCreate.mock.calls[0][0] as { data: { userId: string; provider: string; encryptedKey: string } }
    expect(createArg.data).toMatchObject({ userId: 'user_A', provider: 'elevenlabs', encryptedKey: 'enc(sk-new)' })
    expect(res.json().maskedApiKey).toBe('mask(sk-live)')
    await app.close()
  })

  it('updates an existing api key row instead of creating a new one', async () => {
    verifyElevenLabsKey.mockResolvedValue({ ok: true })
    apiKeyFindFirst.mockResolvedValue({ id: 'key1' })
    const app = await build()
    await app.inject({ method: 'PUT', url: '/voice/settings', payload: { elevenLabsApiKey: 'sk-new' } })
    expect(apiKeyUpdate).toHaveBeenCalledWith({ where: { id: 'key1' }, data: { encryptedKey: 'enc(sk-new)' } })
    expect(apiKeyCreate).not.toHaveBeenCalled()
    await app.close()
  })

  it('saves the key anyway and returns a warning when verification fails', async () => {
    verifyElevenLabsKey.mockRejectedValue(new Error('401 from ElevenLabs'))
    apiKeyFindFirst.mockResolvedValue(null)
    const app = await build()
    const res = await app.inject({ method: 'PUT', url: '/voice/settings', payload: { elevenLabsApiKey: 'sk-new' } })
    expect(res.statusCode).toBe(200)
    expect(apiKeyCreate).toHaveBeenCalled() // still saved
    expect(res.json().verificationWarning).toContain('verification failed')
    await app.close()
  })
})

describe('POST /voice/verify', () => {
  it('returns 400 when no key is supplied or stored', async () => {
    getUserElevenLabsApiKey.mockResolvedValue(null)
    const app = await build()
    const res = await app.inject({ method: 'POST', url: '/voice/verify', payload: {} })
    expect(res.statusCode).toBe(400)
    await app.close()
  })

  it('verifies a supplied key', async () => {
    verifyElevenLabsKey.mockResolvedValue({ tier: 'pro' })
    const app = await build()
    const res = await app.inject({ method: 'POST', url: '/voice/verify', payload: { apiKey: 'sk-x' } })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ success: true, tier: 'pro' })
    await app.close()
  })

  it('returns 400 when verification throws', async () => {
    getUserElevenLabsApiKey.mockResolvedValue('sk-stored')
    verifyElevenLabsKey.mockRejectedValue(new Error('invalid key'))
    const app = await build()
    const res = await app.inject({ method: 'POST', url: '/voice/verify', payload: {} })
    expect(res.statusCode).toBe(400)
    expect(res.json()).toEqual({ error: 'invalid key' })
    await app.close()
  })
})

describe('GET /voice/voices', () => {
  it('returns 400 when no api key is configured', async () => {
    getUserElevenLabsApiKey.mockResolvedValue(null)
    const app = await build()
    const res = await app.inject({ method: 'GET', url: '/voice/voices' })
    expect(res.statusCode).toBe(400)
    expect(listElevenLabsVoices).not.toHaveBeenCalled()
    await app.close()
  })

  it('lists voices when a key is configured', async () => {
    getUserElevenLabsApiKey.mockResolvedValue('sk-stored')
    listElevenLabsVoices.mockResolvedValue([{ voice_id: 'v1' }])
    const app = await build()
    const res = await app.inject({ method: 'GET', url: '/voice/voices' })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ voices: [{ voice_id: 'v1' }] })
    await app.close()
  })

  it('returns 400 when listing voices throws', async () => {
    getUserElevenLabsApiKey.mockResolvedValue('sk-stored')
    listElevenLabsVoices.mockRejectedValue(new Error('rate limited'))
    const app = await build()
    const res = await app.inject({ method: 'GET', url: '/voice/voices' })
    expect(res.statusCode).toBe(400)
    expect(res.json()).toEqual({ error: 'rate limited' })
    await app.close()
  })
})
