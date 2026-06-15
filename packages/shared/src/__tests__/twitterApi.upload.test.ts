import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const getSocialConnection = vi.fn()
vi.mock('../socialConnections', () => ({
  getSocialConnection: (...a: unknown[]) => getSocialConnection(...a),
}))
vi.mock('../encryption', () => ({ encrypt: (v: string) => `enc(${v})`, decrypt: (v: string) => `dec(${v})` }))
vi.mock('../prisma', () => ({ prisma: { socialConnection: { update: vi.fn() } } }))
const downloadImageFromStorage = vi.fn()
vi.mock('../storage', () => ({ downloadImageFromStorage: (...a: unknown[]) => downloadImageFromStorage(...a) }))

import { uploadImageToTwitter } from '../twitterApi'

const fetchMock = vi.fn()

function res(ok: boolean, body: unknown, status = ok ? 200 : 400) {
  return {
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    headers: new Headers(),
    json: async () => body,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  } as unknown as Response
}

const CONN = { id: 'c1', accessToken: 'AT', tokenExpiry: null, refreshToken: null, platformUsername: 'me' }

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('fetch', fetchMock)
  getSocialConnection.mockResolvedValue(CONN)
  downloadImageFromStorage.mockResolvedValue(Buffer.from('img-bytes'))
})
afterEach(() => vi.unstubAllGlobals())

describe('uploadImageToTwitter', () => {
  it('throws when there is no twitter connection', async () => {
    getSocialConnection.mockResolvedValue(null)
    await expect(uploadImageToTwitter('user_A', 'https://cdn/i.jpg')).rejects.toThrow('not connected')
  })

  it('throws when the token is expired and there is no refresh token', async () => {
    getSocialConnection.mockResolvedValue({ ...CONN, tokenExpiry: new Date(Date.now() - 60_000), refreshToken: null })
    await expect(uploadImageToTwitter('user_A', 'https://cdn/i.jpg')).rejects.toThrow('expired')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('uploads the downloaded image and returns the media id from data.id', async () => {
    fetchMock.mockResolvedValue(res(true, { data: { id: 'media123' } }))
    const out = await uploadImageToTwitter('user_A', 'https://cdn/i.jpg')
    expect(out).toBe('media123')
    expect(downloadImageFromStorage).toHaveBeenCalledWith('https://cdn/i.jpg')
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.twitter.com/2/media/upload')
  })

  it('falls back to legacy media id fields when data.id is absent', async () => {
    fetchMock.mockResolvedValue(res(true, { media_id_string: 'legacy99' }))
    expect(await uploadImageToTwitter('user_A', 'https://cdn/i.jpg')).toBe('legacy99')
  })

  it('throws when the response carries no media id', async () => {
    fetchMock.mockResolvedValue(res(true, { data: {} }))
    await expect(uploadImageToTwitter('user_A', 'https://cdn/i.jpg')).rejects.toThrow('did not return media ID')
  })

  it('gives a scope-specific message on a 404', async () => {
    fetchMock.mockResolvedValue(res(false, { error: 'not found' }, 404))
    await expect(uploadImageToTwitter('user_A', 'https://cdn/i.jpg')).rejects.toThrow(/media\.write|not found \(404\)|endpoint not found/)
  })

  it('gives a scope-specific message on a 403', async () => {
    fetchMock.mockResolvedValue(res(false, { error: 'forbidden' }, 403))
    await expect(uploadImageToTwitter('user_A', 'https://cdn/i.jpg')).rejects.toThrow(/media\.write|rejected media upload/)
  })
})
