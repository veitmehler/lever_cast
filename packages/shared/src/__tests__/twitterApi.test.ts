import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const getSocialConnection = vi.fn()
vi.mock('../socialConnections', () => ({
  getSocialConnection: (...a: unknown[]) => getSocialConnection(...a),
}))
vi.mock('../encryption', () => ({ encrypt: (v: string) => `enc(${v})`, decrypt: (v: string) => `dec(${v})` }))
vi.mock('../prisma', () => ({ prisma: { socialConnection: { update: vi.fn() } } }))
vi.mock('../storage', () => ({ downloadImageFromStorage: vi.fn() }))

import { refreshTwitterToken, verifyTweetExists, getTwitterAnalytics } from '../twitterApi'

const fetchMock = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('refreshTwitterToken', () => {
  it('returns null when OAuth credentials are not configured', async () => {
    vi.stubEnv('TWITTER_CLIENT_ID', '')
    vi.stubEnv('TWITTER_CLIENT_SECRET', '')
    expect(await refreshTwitterToken('user_A', 'rt')).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('posts a refresh_token grant with Basic auth and returns the new tokens', async () => {
    vi.stubEnv('TWITTER_CLIENT_ID', 'cid')
    vi.stubEnv('TWITTER_CLIENT_SECRET', 'secret')
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'AT', refresh_token: 'RT2', expires_in: 1234 }),
    } as Response)

    const out = await refreshTwitterToken('user_A', 'rt')

    expect(out).toEqual({ accessToken: 'AT', refreshToken: 'RT2', expiresIn: 1234 })
    const [url, init] = fetchMock.mock.calls[0] as [string, { method: string; headers: Record<string, string>; body: URLSearchParams }]
    expect(url).toBe('https://api.twitter.com/2/oauth2/token')
    expect(init.method).toBe('POST')
    expect(init.headers.Authorization).toBe(`Basic ${Buffer.from('cid:secret').toString('base64')}`)
  })

  it('falls back to the supplied refresh token and a 2h expiry when the response omits them', async () => {
    vi.stubEnv('TWITTER_CLIENT_ID', 'cid')
    vi.stubEnv('TWITTER_CLIENT_SECRET', 'secret')
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ access_token: 'AT' }) } as Response)

    const out = await refreshTwitterToken('user_A', 'original-rt')

    expect(out).toEqual({ accessToken: 'AT', refreshToken: 'original-rt', expiresIn: 7200 })
  })

  it('returns null when the refresh request fails', async () => {
    vi.stubEnv('TWITTER_CLIENT_ID', 'cid')
    vi.stubEnv('TWITTER_CLIENT_SECRET', 'secret')
    fetchMock.mockResolvedValue({ ok: false, status: 400, statusText: 'Bad Request', json: async () => ({}) } as Response)

    expect(await refreshTwitterToken('user_A', 'rt')).toBeNull()
  })
})

describe('verifyTweetExists', () => {
  it('returns false when the user has no twitter connection', async () => {
    getSocialConnection.mockResolvedValue(null)
    expect(await verifyTweetExists('user_A', 'tw1')).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns true when the tweet fetch is ok (no refresh needed for a non-expiring token)', async () => {
    getSocialConnection.mockResolvedValue({ id: 'c1', accessToken: 'AT', tokenExpiry: null })
    fetchMock.mockResolvedValue({ ok: true } as Response)

    expect(await verifyTweetExists('user_A', 'tw1')).toBe(true)
    const [url, init] = fetchMock.mock.calls[0] as [string, { headers: Record<string, string> }]
    expect(url).toBe('https://api.twitter.com/2/tweets/tw1')
    expect(init.headers.Authorization).toBe('Bearer AT')
  })

  it('returns false when the tweet fetch is not ok', async () => {
    getSocialConnection.mockResolvedValue({ id: 'c1', accessToken: 'AT', tokenExpiry: null })
    fetchMock.mockResolvedValue({ ok: false } as Response)
    expect(await verifyTweetExists('user_A', 'tw1')).toBe(false)
  })
})

describe('getTwitterAnalytics', () => {
  it('returns null when there is no connection', async () => {
    getSocialConnection.mockResolvedValue(null)
    expect(await getTwitterAnalytics('user_A', 'tw1')).toBeNull()
  })

  it('maps public and non-public metrics', async () => {
    getSocialConnection.mockResolvedValue({ id: 'c1', accessToken: 'AT', tokenExpiry: null })
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          public_metrics: { like_count: 5, retweet_count: 2, reply_count: 1, quote_count: 3 },
          non_public_metrics: { impression_count: 100, user_profile_clicks: 7 },
        },
      }),
    } as Response)

    expect(await getTwitterAnalytics('user_A', 'tw1')).toEqual({
      impressions: 100,
      likes: 5,
      retweets: 2,
      replies: 1,
      quoteTweets: 3,
      views: 7,
    })
  })

  it('defaults public counts to 0 and leaves impressions/views undefined when metrics are missing', async () => {
    getSocialConnection.mockResolvedValue({ id: 'c1', accessToken: 'AT', tokenExpiry: null })
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ data: {} }) } as Response)

    expect(await getTwitterAnalytics('user_A', 'tw1')).toEqual({
      impressions: undefined,
      likes: 0,
      retweets: 0,
      replies: 0,
      quoteTweets: 0,
      views: undefined,
    })
  })

  it('returns null when the tweet is absent from the response', async () => {
    getSocialConnection.mockResolvedValue({ id: 'c1', accessToken: 'AT', tokenExpiry: null })
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) } as Response)
    expect(await getTwitterAnalytics('user_A', 'tw1')).toBeNull()
  })

  it('returns null on an HTTP error', async () => {
    getSocialConnection.mockResolvedValue({ id: 'c1', accessToken: 'AT', tokenExpiry: null })
    fetchMock.mockResolvedValue({ ok: false, status: 401, text: async () => 'nope' } as Response)
    expect(await getTwitterAnalytics('user_A', 'tw1')).toBeNull()
  })
})
