import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const getSocialConnection = vi.fn()
vi.mock('../socialConnections', () => ({
  getSocialConnection: (...a: unknown[]) => getSocialConnection(...a),
}))
vi.mock('../storage', () => ({ downloadImageFromStorage: vi.fn() }))

import { refreshLinkedInToken, getLinkedInAnalytics } from '../linkedinApi'

const fetchMock = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => vi.unstubAllGlobals())

describe('refreshLinkedInToken', () => {
  it('is a stub that returns null (refresh not yet implemented)', async () => {
    expect(await refreshLinkedInToken('user_A', 'rt')).toBeNull()
  })
})

describe('getLinkedInAnalytics', () => {
  it('returns null when there is no connection', async () => {
    getSocialConnection.mockResolvedValue(null)
    expect(await getLinkedInAnalytics('user_A', 'post1')).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('defaults to the personal app when no appType is given', async () => {
    getSocialConnection.mockResolvedValue(null)
    await getLinkedInAnalytics('user_A', 'post1')
    expect(getSocialConnection).toHaveBeenCalledWith('user_A', 'linkedin', 'personal')
  })

  it('uses the company app when requested', async () => {
    getSocialConnection.mockResolvedValue(null)
    await getLinkedInAnalytics('user_A', 'post1', 'company')
    expect(getSocialConnection).toHaveBeenCalledWith('user_A', 'linkedin', 'company')
  })

  it('returns null when the token is expired', async () => {
    getSocialConnection.mockResolvedValue({
      id: 'c1',
      accessToken: 'AT',
      tokenExpiry: new Date(Date.now() - 60_000),
    })
    expect(await getLinkedInAnalytics('user_A', 'post1')).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('throws LINKEDIN_PERMISSIONS_REQUIRED on a 403 access-denied error', async () => {
    getSocialConnection.mockResolvedValue({ id: 'c1', accessToken: 'AT', tokenExpiry: null })
    fetchMock.mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => JSON.stringify({ message: 'Not enough permissions' }),
    } as Response)

    await expect(getLinkedInAnalytics('user_A', 'post1')).rejects.toThrow('LINKEDIN_PERMISSIONS_REQUIRED')
  })

  it('returns null for a 403 that is not a permission error', async () => {
    getSocialConnection.mockResolvedValue({ id: 'c1', accessToken: 'AT', tokenExpiry: null })
    fetchMock.mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => JSON.stringify({ message: 'rate limited' }),
    } as Response)

    expect(await getLinkedInAnalytics('user_A', 'post1')).toBeNull()
  })

  it('returns null on a non-403 HTTP error', async () => {
    getSocialConnection.mockResolvedValue({ id: 'c1', accessToken: 'AT', tokenExpiry: null })
    fetchMock.mockResolvedValue({ ok: false, status: 500, text: async () => 'boom' } as Response)
    expect(await getLinkedInAnalytics('user_A', 'post1')).toBeNull()
  })

  it('returns null even on success (full analytics implementation is a TODO)', async () => {
    getSocialConnection.mockResolvedValue({ id: 'c1', accessToken: 'AT', tokenExpiry: null })
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ id: 'post1' }) } as Response)
    expect(await getLinkedInAnalytics('user_A', 'post1')).toBeNull()
  })
})
