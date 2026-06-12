import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock Clerk's server-side auth().
const authMock = vi.fn()
vi.mock('@clerk/nextjs/server', () => ({
  auth: () => authMock(),
}))

// Minimal stand-ins for next/server so we can assert on status/body without a
// Next.js runtime.
vi.mock('next/server', () => {
  class NextResponse {
    body: unknown
    status: number
    headers: Record<string, string> | undefined
    constructor(body?: unknown, init?: { status?: number; headers?: Record<string, string> }) {
      this.body = body
      this.status = init?.status ?? 200
      this.headers = init?.headers
    }
    static json(obj: unknown, init?: { status?: number }) {
      const r = new NextResponse(obj, init)
      r.body = obj
      return r
    }
  }
  class NextRequest {}
  return { NextResponse, NextRequest }
})

import { proxyToApi } from '../api-proxy'

type FakeReqOpts = { authHeader?: string | null; method?: string; body?: ArrayBuffer; search?: string }

function fakeReq({ authHeader = null, method = 'POST', body, search = '' }: FakeReqOpts) {
  return {
    method,
    nextUrl: { search },
    headers: {
      get(key: string) {
        const k = key.toLowerCase()
        if (k === 'authorization') return authHeader
        if (k === 'content-type') return 'application/json'
        return null
      },
    },
    arrayBuffer: async () => body ?? new ArrayBuffer(0),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any
}

function fakeUpstream(status = 200) {
  return {
    arrayBuffer: async () => new ArrayBuffer(0),
    status,
    headers: { get: () => 'application/json' },
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('proxyToApi (characterization)', () => {
  it('returns 401 when there is no client token and no Clerk session', async () => {
    authMock.mockResolvedValue({ userId: null, getToken: async () => null })
    const res = (await proxyToApi(fakeReq({ authHeader: null }), '/api/x')) as unknown as {
      status: number
    }
    expect(res.status).toBe(401)
  })

  it('forwards a client-supplied Bearer token to the upstream API', async () => {
    const fetchMock = vi.fn().mockResolvedValue(fakeUpstream(200))
    vi.stubGlobal('fetch', fetchMock)

    await proxyToApi(fakeReq({ authHeader: 'Bearer tok123' }), '/api/ai/generate')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.socioply.com/api/ai/generate')
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer tok123')
    // No Clerk fallback should have run when a client token is present.
    expect(authMock).not.toHaveBeenCalled()
  })

  it('forwards the request query string to the upstream URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue(fakeUpstream(200))
    vi.stubGlobal('fetch', fetchMock)

    await proxyToApi(
      fakeReq({ authHeader: 'Bearer tok123', method: 'GET', search: '?status=published&limit=20' }),
      '/api/articles',
      { method: 'GET' },
    )

    const [url] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.socioply.com/api/articles?status=published&limit=20')
  })

  it('returns 503 when the upstream fetch throws (network failure)', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'))
    vi.stubGlobal('fetch', fetchMock)

    const res = (await proxyToApi(fakeReq({ authHeader: 'Bearer tok123' }), '/api/x')) as unknown as {
      status: number
    }
    expect(res.status).toBe(503)
  })
})
