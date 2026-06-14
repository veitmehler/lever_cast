import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const getSocialConnection = vi.fn()
vi.mock('../socialConnections', () => ({
  getSocialConnection: (...a: unknown[]) => getSocialConnection(...a),
}))
vi.mock('../storage', () => ({ downloadImageFromStorage: vi.fn() }))

import { postToLinkedIn } from '../linkedinApi'

const fetchMock = vi.fn()

function res(ok: boolean, body: unknown, status = ok ? 200 : 400) {
  return {
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    json: async () => body,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  } as unknown as Response
}

// Routes the profile (/userinfo) and post (/ugcPosts) fetches. Text-only path
// (no imageUrl) → no asset upload and no 20s processing wait.
function route(handlers: { profile?: () => Response; post?: () => Response }) {
  fetchMock.mockImplementation((url: string) => {
    if (url.includes('/userinfo')) return Promise.resolve(handlers.profile?.() ?? res(true, { sub: 'person123' }))
    if (url.includes('/ugcPosts')) return Promise.resolve(handlers.post?.() ?? res(true, { id: 'urn:li:share:99' }))
    return Promise.reject(new Error(`unexpected ${url}`))
  })
}

const PERSONAL = { id: 'cp', accessToken: 'AT', tokenExpiry: null, postTargetType: null, selectedPageId: null }

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => vi.unstubAllGlobals())

describe('postToLinkedIn — connection selection', () => {
  it('uses the company connection when it targets a page with a selected page id', async () => {
    const company = { id: 'cc', accessToken: 'AT', tokenExpiry: null, postTargetType: 'page', selectedPageId: 'org42' }
    getSocialConnection.mockImplementation((_u: string, _p: string, appType: string) =>
      Promise.resolve(appType === 'company' ? company : null),
    )
    route({})

    const out = await postToLinkedIn('user_A', 'hi')

    expect(out.success).toBe(true)
    const body = JSON.parse((fetchMock.mock.calls.find((c) => (c[0] as string).includes('/ugcPosts'))![1] as { body: string }).body)
    expect(body.author).toBe('urn:li:organization:org42')
  })

  it('falls back to the personal connection and uses the profile sub as the author urn', async () => {
    getSocialConnection.mockImplementation((_u: string, _p: string, appType: string) =>
      Promise.resolve(appType === 'personal' ? PERSONAL : null),
    )
    route({ profile: () => res(true, { sub: 'person123' }) })

    const out = await postToLinkedIn('user_A', 'hi')

    expect(out).toEqual({ success: true, postUrl: 'https://www.linkedin.com/feed/update/urn:li:share:99' })
    const body = JSON.parse((fetchMock.mock.calls.find((c) => (c[0] as string).includes('/ugcPosts'))![1] as { body: string }).body)
    expect(body.author).toBe('urn:li:person:person123')
    expect(body.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory).toBe('NONE')
  })

  it('returns not-connected when no linkedin connection exists', async () => {
    getSocialConnection.mockResolvedValue(null)
    const out = await postToLinkedIn('user_A', 'hi')
    expect(out.success).toBe(false)
    if (!out.success) expect(out.error).toContain('not connected')
  })
})

describe('postToLinkedIn — error paths', () => {
  beforeEach(() => {
    getSocialConnection.mockImplementation((_u: string, _p: string, appType: string) =>
      Promise.resolve(appType === 'personal' ? PERSONAL : null),
    )
  })

  it('asks the user to reconnect when the token is expired', async () => {
    getSocialConnection.mockImplementation((_u: string, _p: string, appType: string) =>
      Promise.resolve(appType === 'personal' ? { ...PERSONAL, tokenExpiry: new Date(Date.now() - 60_000) } : null),
    )
    const out = await postToLinkedIn('user_A', 'hi')
    expect(out.success).toBe(false)
    if (!out.success) expect(out.error).toContain('expired')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('fails when the profile fetch is not ok', async () => {
    route({ profile: () => res(false, 'nope', 401) })
    const out = await postToLinkedIn('user_A', 'hi')
    expect(out.success).toBe(false)
    if (!out.success) expect(out.error).toContain('Failed to fetch LinkedIn profile')
  })

  it('returns the LinkedIn error message when the post fails (non-media error)', async () => {
    route({ post: () => res(false, { message: 'quota exceeded' }, 422) })
    const out = await postToLinkedIn('user_A', 'hi')
    expect(out.success).toBe(false)
    if (!out.success) expect(out.error).toBe('quota exceeded')
  })
})
