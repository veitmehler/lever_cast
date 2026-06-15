import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const getSocialConnection = vi.fn()
vi.mock('../socialConnections', () => ({
  getSocialConnection: (...a: unknown[]) => getSocialConnection(...a),
}))
const downloadImageFromStorage = vi.fn()
vi.mock('../storage', () => ({ downloadImageFromStorage: (...a: unknown[]) => downloadImageFromStorage(...a) }))
// image-size is a default export; dimensions are warning-only in the code.
vi.mock('image-size', () => ({ default: () => ({ width: 1200, height: 1200 }) }))

import { uploadImageToLinkedIn } from '../linkedinApi'

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

// Register response with the common nested uploadMechanism structure.
function registerOk(over: Record<string, unknown> = {}) {
  return res(true, {
    value: {
      uploadMechanism: {
        'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest': { uploadUrl: 'https://upload.li/put' },
      },
      asset: 'urn:li:digitalmediaAsset:ABC',
      mediaArtifact: 'urn:li:digitalmediaMediaArtifact:XYZ',
      ...over,
    },
  })
}

// Routes the 3 fetches: /userinfo, /assets (register), and the upload PUT.
function route(handlers: { profile?: () => Response; register?: () => Response; upload?: () => Response }) {
  fetchMock.mockImplementation((url: string) => {
    if (url.includes('/userinfo')) return Promise.resolve(handlers.profile?.() ?? res(true, { sub: 'person123' }))
    if (url.includes('/assets')) return Promise.resolve(handlers.register?.() ?? registerOk())
    if (url.includes('upload.li')) return Promise.resolve(handlers.upload?.() ?? res(true, {}))
    return Promise.reject(new Error(`unexpected ${url}`))
  })
}

const CONN = { id: 'c1', accessToken: 'AT', tokenExpiry: null }

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('fetch', fetchMock)
  getSocialConnection.mockResolvedValue(CONN)
  downloadImageFromStorage.mockResolvedValue(Buffer.from('img-bytes'))
})
afterEach(() => vi.unstubAllGlobals())

describe('uploadImageToLinkedIn', () => {
  it('throws when there is no connection', async () => {
    getSocialConnection.mockResolvedValue(null)
    await expect(uploadImageToLinkedIn('user_A', 'https://cdn/i.jpg')).rejects.toThrow('not connected')
  })

  it('throws when the token is expired', async () => {
    getSocialConnection.mockResolvedValue({ ...CONN, tokenExpiry: new Date(Date.now() - 60_000) })
    await expect(uploadImageToLinkedIn('user_A', 'https://cdn/i.jpg')).rejects.toThrow('expired')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('throws when the profile fetch fails', async () => {
    route({ profile: () => res(false, 'nope', 401) })
    await expect(uploadImageToLinkedIn('user_A', 'https://cdn/i.jpg')).rejects.toThrow('Failed to fetch LinkedIn profile')
  })

  it('throws when register upload fails', async () => {
    route({ register: () => res(false, { message: 'bad recipe' }, 400) })
    await expect(uploadImageToLinkedIn('user_A', 'https://cdn/i.jpg')).rejects.toThrow('Failed to register upload')
  })

  it('throws when the register response is missing the upload url', async () => {
    route({ register: () => res(true, { value: { asset: 'urn:li:digitalmediaAsset:ABC' } }) })
    await expect(uploadImageToLinkedIn('user_A', 'https://cdn/i.jpg')).rejects.toThrow('did not return an upload URL')
  })

  it('registers, PUTs the binary, and returns the asset + media-artifact urns', async () => {
    route({})
    const out = await uploadImageToLinkedIn('user_A', 'https://cdn/i.jpg')
    expect(out).toEqual({
      assetUrn: 'urn:li:digitalmediaAsset:ABC',
      mediaArtifactUrn: 'urn:li:digitalmediaMediaArtifact:XYZ',
    })
    // the binary was PUT to the returned upload url
    const putCall = fetchMock.mock.calls.find((c) => (c[0] as string).includes('upload.li'))!
    expect((putCall[1] as { method: string }).method).toBe('PUT')
  })

  it('falls back to the asset urn for the media artifact when none is returned', async () => {
    route({ register: () => registerOk({ mediaArtifact: undefined }) })
    const out = await uploadImageToLinkedIn('user_A', 'https://cdn/i.jpg')
    expect(out.mediaArtifactUrn).toBe('urn:li:digitalmediaAsset:ABC')
  })

  it('throws when the binary upload PUT fails', async () => {
    route({ upload: () => res(false, 'denied', 403) })
    await expect(uploadImageToLinkedIn('user_A', 'https://cdn/i.jpg')).rejects.toThrow('Failed to upload image')
  })
})
