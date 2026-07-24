import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Fastify from 'fastify'

const requireAuthMock = vi.fn()
vi.mock('../../middleware/auth', () => ({
  requireAuth: (...a: unknown[]) => requireAuthMock(...a),
}))

const userFindUnique = vi.fn()
const userCreate = vi.fn()
const mediaCreate = vi.fn()
const generateSimpleImagePrompt = vi.fn()
vi.mock('@omniply/shared', () => ({
  prisma: {
    user: {
      findUnique: (...a: unknown[]) => userFindUnique(...a),
      create: (...a: unknown[]) => userCreate(...a),
    },
    media: { create: (...a: unknown[]) => mediaCreate(...a) },
  },
  generateImagePromptWithLLM: vi.fn(),
  generateSimpleImagePrompt: (...a: unknown[]) => generateSimpleImagePrompt(...a),
  generateWithFalAI: vi.fn(),
  generateWithOpenAIDALLE: vi.fn(),
  generateWithReplicate: vi.fn(),
}))

const getSystemApiKey = vi.fn()
vi.mock('../../lib/system-keys', () => ({ getSystemApiKey: (...a: unknown[]) => getSystemApiKey(...a) }))

const s3Send = vi.fn()
vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: class { send = s3Send },
  PutObjectCommand: class { constructor(public input: unknown) {} },
  DeleteObjectCommand: class { constructor(public input: unknown) {} },
}))

const sniffImageMime = vi.fn()
vi.mock('../../lib/image-sniff', () => ({
  sniffImageMime: (...a: unknown[]) => sniffImageMime(...a),
  extForImageMime: () => 'png',
}))

import { imageRoutes } from '../images'

async function build() {
  // Raise the body limit so the handler's own 10MB guard is reached (Fastify's
  // 1MB default would 413 first); the real API sets a high limit at registration.
  const app = Fastify({ bodyLimit: 20 * 1024 * 1024 })
  await app.register(imageRoutes)
  await app.ready()
  return app
}

beforeEach(() => {
  vi.clearAllMocks()
  requireAuthMock.mockResolvedValue('clerk_A')
  userFindUnique.mockResolvedValue({ id: 'user_A' })
  getSystemApiKey.mockResolvedValue(null)
  s3Send.mockResolvedValue({})
  mediaCreate.mockResolvedValue({})
  vi.stubEnv('ACCESS_KEY_ID', 'ak')
  vi.stubEnv('SECRET_ACCESS_KEY', 'sk')
  vi.stubEnv('S3_BUCKET', 'bucket')
  vi.stubEnv('CDN_BASE', 'https://cdn.test')
})
afterEach(() => vi.unstubAllEnvs())

describe('POST /generate-prompt', () => {
  it('rejects unauthenticated requests at the auth gate', async () => {
    requireAuthMock.mockImplementation(async (_req: unknown, reply: { status: (c: number) => { send: (b: unknown) => void } }) => {
      reply.status(401).send({ error: 'Unauthorized' })
      return undefined
    })
    const app = await build()
    const res = await app.inject({ method: 'POST', url: '/generate-prompt', payload: {} })
    expect(res.statusCode).toBe(401)
    await app.close()
  })

  it('requires postContent', async () => {
    const app = await build()
    const res = await app.inject({ method: 'POST', url: '/generate-prompt', payload: { imageProvider: 'fal' } })
    expect(res.statusCode).toBe(400)
    await app.close()
  })

  it('rejects an invalid image provider', async () => {
    const app = await build()
    const res = await app.inject({ method: 'POST', url: '/generate-prompt', payload: { postContent: 'hi', imageProvider: 'midjourney' } })
    expect(res.statusCode).toBe(400)
    await app.close()
  })

  it('falls back to the simple prompt when no system LLM key is configured', async () => {
    generateSimpleImagePrompt.mockReturnValue('a simple prompt')
    const app = await build()
    const res = await app.inject({ method: 'POST', url: '/generate-prompt', payload: { postContent: 'hi', imageProvider: 'fal' } })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ success: true, prompt: 'a simple prompt' })
    await app.close()
  })
})

describe('POST /upload', () => {
  it('rejects a missing data url', async () => {
    const app = await build()
    const res = await app.inject({ method: 'POST', url: '/upload', payload: {} })
    expect(res.statusCode).toBe(400)
    await app.close()
  })

  it('rejects a non-image data url', async () => {
    const app = await build()
    const res = await app.inject({ method: 'POST', url: '/upload', payload: { imageDataUrl: 'data:text/plain;base64,AAAA' } })
    expect(res.statusCode).toBe(400)
    await app.close()
  })

  it('rejects an oversized image', async () => {
    const big = 'data:image/png;base64,' + 'A'.repeat(13 * 1024 * 1024)
    const app = await build()
    const res = await app.inject({ method: 'POST', url: '/upload', payload: { imageDataUrl: big } })
    expect(res.statusCode).toBe(400)
    await app.close()
  })

  it('returns 404 when the user row is missing', async () => {
    userFindUnique.mockResolvedValue(null)
    const app = await build()
    const res = await app.inject({ method: 'POST', url: '/upload', payload: { imageDataUrl: 'data:image/png;base64,AAAA' } })
    expect(res.statusCode).toBe(404)
    await app.close()
  })

  it('rejects bytes that do not sniff to a known image type', async () => {
    sniffImageMime.mockReturnValue(null)
    const app = await build()
    const res = await app.inject({ method: 'POST', url: '/upload', payload: { imageDataUrl: 'data:image/png;base64,AAAA' } })
    expect(res.statusCode).toBe(400)
    expect(res.json().error).toContain('invalid image data')
    await app.close()
  })

  it('uploads to a user-scoped path and records the media row', async () => {
    sniffImageMime.mockReturnValue('image/png')
    const app = await build()
    const res = await app.inject({ method: 'POST', url: '/upload', payload: { imageDataUrl: 'data:image/png;base64,AAAA', fileName: 'pic.png' } })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.success).toBe(true)
    expect(body.path).toMatch(/^user_A\//)
    expect(body.url).toContain('https://cdn.test/user_A/')
    expect(s3Send).toHaveBeenCalledTimes(1)
    expect((mediaCreate.mock.calls[0][0] as { data: { userId: string } }).data.userId).toBe('user_A')
    await app.close()
  })
})

describe('DELETE /upload', () => {
  it('requires a url or path', async () => {
    const app = await build()
    const res = await app.inject({ method: 'DELETE', url: '/upload', payload: {} })
    expect(res.statusCode).toBe(400)
    await app.close()
  })

  it('forbids deleting a path outside the user’s own prefix', async () => {
    const app = await build()
    const res = await app.inject({ method: 'DELETE', url: '/upload', payload: { path: 'other_user/secret.png' } })
    expect(res.statusCode).toBe(403)
    expect(s3Send).not.toHaveBeenCalled()
    await app.close()
  })

  it('deletes a path within the user’s own prefix', async () => {
    const app = await build()
    const res = await app.inject({ method: 'DELETE', url: '/upload', payload: { path: 'user_A/pic.png' } })
    expect(res.statusCode).toBe(200)
    expect(res.json().success).toBe(true)
    expect(s3Send).toHaveBeenCalledTimes(1)
    await app.close()
  })
})
