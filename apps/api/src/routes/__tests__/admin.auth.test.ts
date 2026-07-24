import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Fastify from 'fastify'

// Keep the heavy deps inert — these tests only exercise the Basic Auth hook on
// the HTML route, which touches neither.
vi.mock('@omniply/shared', () => ({ prisma: {} }))
vi.mock('../../queues/index', () => ({ getBoss: vi.fn(), QUEUES: {} }))

import { adminRoutes } from '../admin'

async function build() {
  const app = Fastify()
  await app.register(adminRoutes)
  await app.ready()
  return app
}

const ORIG = { ...process.env }
beforeEach(() => {
  process.env.ADMIN_BASIC_USER = 'admin'
  process.env.ADMIN_BASIC_PASS = 's3cret'
})
afterEach(() => {
  process.env = { ...ORIG }
})

function basic(user: string, pass: string) {
  return 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64')
}

describe('admin Basic Auth (L2)', () => {
  it('rejects with 401 + WWW-Authenticate when no credentials are sent', async () => {
    const app = await build()
    const res = await app.inject({ method: 'GET', url: '/' })
    expect(res.statusCode).toBe(401)
    expect(res.headers['www-authenticate']).toMatch(/Basic/)
    await app.close()
  })

  it('rejects wrong credentials', async () => {
    const app = await build()
    const res = await app.inject({
      method: 'GET',
      url: '/',
      headers: { authorization: basic('admin', 'wrong') },
    })
    expect(res.statusCode).toBe(401)
    await app.close()
  })

  it('allows correct credentials', async () => {
    const app = await build()
    const res = await app.inject({
      method: 'GET',
      url: '/',
      headers: { authorization: basic('admin', 's3cret') },
    })
    expect(res.statusCode).toBe(200)
    expect(res.body).toContain('Omniply Admin')
    await app.close()
  })

  it('falls open (with a warning) when credentials are not configured', async () => {
    delete process.env.ADMIN_BASIC_USER
    delete process.env.ADMIN_BASIC_PASS
    const app = await build()
    const res = await app.inject({ method: 'GET', url: '/' })
    expect(res.statusCode).toBe(200)
    await app.close()
  })
})
