import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const getSocialConnection = vi.fn()
vi.mock('../socialConnections', () => ({
  getSocialConnection: (...a: unknown[]) => getSocialConnection(...a),
}))
vi.mock('../encryption', () => ({ encrypt: (v: string) => `enc(${v})`, decrypt: (v: string) => `dec(${v})` }))

const reqCount = vi.fn()
const reqFindFirst = vi.fn()
const reqCreate = vi.fn()
const reqUpdate = vi.fn()
const connUpdate = vi.fn()
vi.mock('../prisma', () => ({
  prisma: {
    twitterApiRequest: {
      count: (...a: unknown[]) => reqCount(...a),
      findFirst: (...a: unknown[]) => reqFindFirst(...a),
      create: (...a: unknown[]) => reqCreate(...a),
      update: (...a: unknown[]) => reqUpdate(...a),
    },
    socialConnection: { update: (...a: unknown[]) => connUpdate(...a) },
  },
}))
vi.mock('../storage', () => ({ downloadImageFromStorage: vi.fn() }))

import { postToTwitter, postTwitterThread } from '../twitterApi'

const fetchMock = vi.fn()

// Response stub with Headers (the code reads .headers.entries() + .get()).
function res(ok: boolean, body: unknown, status = ok ? 200 : 400, headers: Record<string, string> = {}) {
  return {
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    headers: new Headers(headers),
    json: async () => body,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  } as unknown as Response
}

const CONN = { id: 'c1', accessToken: 'AT', tokenExpiry: null, refreshToken: null, platformUsername: 'me' }

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('fetch', fetchMock)
  reqCount.mockResolvedValue(0)
  reqCreate.mockResolvedValue({ id: 'req1' })
  reqUpdate.mockResolvedValue({})
  getSocialConnection.mockResolvedValue(CONN)
})
afterEach(() => vi.unstubAllGlobals())

describe('postToTwitter — guards', () => {
  it('blocks at the 24h request limit before creating a record or posting', async () => {
    reqCount.mockResolvedValue(17)
    reqFindFirst.mockResolvedValue({ requestedAt: new Date() })

    const out = await postToTwitter('user_A', 'hi')

    expect(out.success).toBe(false)
    if (!out.success) expect(out.error).toContain('rate limit exceeded')
    expect(reqCreate).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns a not-connected error when there is no connection', async () => {
    getSocialConnection.mockResolvedValue(null)
    const out = await postToTwitter('user_A', 'hi')
    expect(out.success).toBe(false)
    if (!out.success) expect(out.error).toContain('not connected')
    expect(reqCreate).toHaveBeenCalledTimes(1)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('asks the user to reconnect when the token is expired and there is no refresh token', async () => {
    getSocialConnection.mockResolvedValue({ ...CONN, tokenExpiry: new Date(Date.now() - 60_000), refreshToken: null })
    const out = await postToTwitter('user_A', 'hi')
    expect(out.success).toBe(false)
    if (!out.success) expect(out.error).toContain('reconnect')
  })
})

describe('postToTwitter — posting', () => {
  // Routes the verify (/users/me) and post (/tweets) fetches.
  function routePost(postRes: () => Response) {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/users/me')) return Promise.resolve(res(true, { data: { username: 'me' } }))
      if (url.includes('/tweets')) return Promise.resolve(postRes())
      return Promise.reject(new Error(`unexpected ${url}`))
    })
  }

  it('posts a text tweet and returns the tweet id + url, marking the request successful', async () => {
    routePost(() => res(true, { data: { id: 'tw1' } }))

    const out = await postToTwitter('user_A', 'hello world')

    expect(out).toEqual({ success: true, tweetId: 'tw1', postUrl: 'https://twitter.com/me/status/tw1' })
    // request record updated to success
    const upd = reqUpdate.mock.calls.at(-1)?.[0] as { where: { id: string }; data: { success: boolean } }
    expect(upd.where.id).toBe('req1')
    expect(upd.data.success).toBe(true)
    // the /tweets POST carried the content
    const postCall = fetchMock.mock.calls.find((c) => (c[0] as string).includes('/tweets'))!
    expect(JSON.parse((postCall[1] as { body: string }).body).text).toBe('hello world')
  })

  it('returns the API error and records the failure on a non-OK post', async () => {
    routePost(() => res(false, { detail: 'Something is wrong' }, 400))

    const out = await postToTwitter('user_A', 'hi')

    expect(out.success).toBe(false)
    if (!out.success) expect(out.error).toBe('Something is wrong')
    const upd = reqUpdate.mock.calls.at(-1)?.[0] as { data: { success: boolean; statusCode: number } }
    expect(upd.data.success).toBe(false)
    expect(upd.data.statusCode).toBe(400)
  })
})

describe('postTwitterThread', () => {
  it('rejects an empty tweet list', async () => {
    const out = await postTwitterThread('user_A', [])
    expect(out.success).toBe(false)
    if (!out.success) expect(out.error).toBe('No tweets provided')
  })

  it('posts the head then each reply chained to the previous tweet', async () => {
    let n = 0
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/users/me')) return Promise.resolve(res(true, { data: { username: 'me' } }))
      if (url.includes('/tweets')) return Promise.resolve(res(true, { data: { id: `tw${++n}` } }))
      return Promise.reject(new Error(`unexpected ${url}`))
    })

    vi.useFakeTimers()
    const p = postTwitterThread('user_A', ['head', 'reply-1'])
    await vi.runAllTimersAsync()
    const out = await p
    vi.useRealTimers()

    expect(out).toEqual({
      success: true,
      tweetIds: ['tw1', 'tw2'],
      postUrls: ['https://twitter.com/me/status/tw1', 'https://twitter.com/me/status/tw2'],
    })
    // the second tweet replies to the first
    const postBodies = fetchMock.mock.calls
      .filter((c) => (c[0] as string).includes('/tweets'))
      .map((c) => JSON.parse((c[1] as { body: string }).body))
    expect(postBodies[0].reply).toBeUndefined()
    expect(postBodies[1].reply).toEqual({ in_reply_to_tweet_id: 'tw1' })
  })
})
