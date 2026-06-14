import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const getSocialConnection = vi.fn()
vi.mock('../socialConnections', () => ({
  getSocialConnection: (...a: unknown[]) => getSocialConnection(...a),
}))
// decrypt must return a token >=20 chars to pass getThreadsAccount's sanity checks.
const TOKEN = 'a'.repeat(30)
vi.mock('../encryption', () => ({ decrypt: () => TOKEN }))

import { postToThreads } from '../threadsApi'

const fetchMock = vi.fn()

// Route fetch responses by URL path so the 3-call flow (account → container → publish) is deterministic.
function routeFetch(handlers: {
  me?: () => Partial<Response>
  threads?: () => Partial<Response>
  publish?: () => Partial<Response>
}) {
  fetchMock.mockImplementation((url: string) => {
    if (url.includes('/me/threads_publish')) return Promise.resolve(handlers.publish?.() ?? { ok: true, json: async () => ({ id: 'post_99' }) })
    if (url.includes('/me/threads')) return Promise.resolve(handlers.threads?.() ?? { ok: true, json: async () => ({ id: 'container_1' }) })
    if (url.includes('/me?')) return Promise.resolve(handlers.me?.() ?? { ok: true, json: async () => ({ id: '123', username: 'me' }) })
    return Promise.reject(new Error(`unexpected url ${url}`))
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('fetch', fetchMock)
  getSocialConnection.mockResolvedValue({
    id: 'c1',
    accessToken: 'enc',
    tokenExpiry: null,
    platformUserId: '123',
    platformUsername: 'me',
  })
})
afterEach(() => vi.unstubAllGlobals())

describe('postToThreads', () => {
  it('rejects content over the 500 character limit before any network call', async () => {
    const res = await postToThreads('user_A', 'x'.repeat(501))
    expect(res.success).toBe(false)
    if (!res.success) expect(res.error).toContain('500 character limit')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('creates a container then publishes it and returns the post url', async () => {
    routeFetch({})
    const res = await postToThreads('user_A', 'hello threads')

    expect(res).toEqual({
      success: true,
      postUrl: 'https://www.threads.net/@me/post/post_99',
      postId: 'post_99',
    })
    // 3 calls: /me, /me/threads, /me/threads_publish
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('fails with the connection error when the account token is expired', async () => {
    getSocialConnection.mockResolvedValue({
      id: 'c1',
      accessToken: 'enc',
      tokenExpiry: new Date(Date.now() - 60_000),
      platformUserId: '123',
      platformUsername: 'me',
    })
    const res = await postToThreads('user_A', 'hi')
    expect(res.success).toBe(false)
    if (!res.success) expect(res.error).toContain('expired')
  })

  it('returns a failure result when container creation fails', async () => {
    routeFetch({ threads: () => ({ ok: false, status: 400, text: async () => JSON.stringify({ error: { message: 'bad container' } }) }) })
    const res = await postToThreads('user_A', 'hi')
    expect(res.success).toBe(false)
    if (!res.success) expect(res.error).toContain('bad container')
  })

  it('maps a 401 on publish to a reconnect message', async () => {
    routeFetch({ publish: () => ({ ok: false, status: 401, text: async () => '{}' }) })
    const res = await postToThreads('user_A', 'hi')
    expect(res.success).toBe(false)
    if (!res.success) expect(res.error).toContain('reconnect')
  })

  it('maps a 403 on publish to a permission message', async () => {
    routeFetch({ publish: () => ({ ok: false, status: 403, text: async () => '{}' }) })
    const res = await postToThreads('user_A', 'hi')
    expect(res.success).toBe(false)
    if (!res.success) expect(res.error).toContain('Permission denied')
  })
})
