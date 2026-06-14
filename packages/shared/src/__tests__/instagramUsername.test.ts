import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const findUnique = vi.fn()
const update = vi.fn()
vi.mock('../prisma', () => ({
  prisma: {
    socialConnection: {
      findUnique: (...a: unknown[]) => findUnique(...a),
      update: (...a: unknown[]) => update(...a),
    },
  },
}))
vi.mock('../encryption', () => ({ decrypt: (v: string) => `dec(${v})` }))

import { fetchInstagramUsername, refreshInstagramUsername } from '../instagramUsername'

const fetchMock = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => vi.unstubAllGlobals())

describe('fetchInstagramUsername', () => {
  it('finds the username from /me/accounts when using a user token', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          { id: 'pageX', instagram_business_account: { id: 'IG1', username: 'cool_brand' } },
        ],
      }),
    } as Response)

    const out = await fetchInstagramUsername('conn1', 'user-tok', 'IG1', 'user')
    expect(out).toBe('cool_brand')
  })

  it('ignores the placeholder "Instagram User" and falls through to other methods', async () => {
    // pages response carries the placeholder; direct query (page token, Method 2) then succeeds
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [{ id: 'pageX', instagram_business_account: { id: 'IG1', username: 'Instagram User' } }] }),
      } as Response)
      // Method 1b queries each page that has an access_token — pageX has none, so skipped.
      // Method 2: direct IG account query
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'IG1', username: 'real_handle' }) } as Response)

    const out = await fetchInstagramUsername('conn1', 'user-tok', 'IG1', 'user')
    expect(out).toBe('real_handle')
  })

  it('resolves directly against the IG account id when using a page token', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ id: 'IG1', username: 'page_handle' }) } as Response)
    const out = await fetchInstagramUsername('conn1', 'page-tok', 'IG1', 'page')
    expect(out).toBe('page_handle')
  })

  it('returns null when every method fails', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 400, text: async () => 'err' } as Response)
    expect(await fetchInstagramUsername('conn1', 'tok', 'IG1', 'page')).toBeNull()
  })

  it('returns null (never throws) when fetch rejects', async () => {
    fetchMock.mockRejectedValue(new Error('network'))
    expect(await fetchInstagramUsername('conn1', 'tok', 'IG1', 'page')).toBeNull()
  })
})

describe('refreshInstagramUsername', () => {
  it('throws when the connection is not an instagram connection', async () => {
    findUnique.mockResolvedValue({ id: 'c1', platform: 'twitter' })
    await expect(refreshInstagramUsername('c1')).rejects.toThrow('Instagram connection not found')
  })

  it('throws when the instagram account id is missing', async () => {
    findUnique.mockResolvedValue({ id: 'c1', platform: 'instagram', accessToken: 'enc', platformUserId: null, refreshToken: null })
    await expect(refreshInstagramUsername('c1')).rejects.toThrow('Instagram account ID not found')
  })

  it('fetches, persists, and returns the refreshed username', async () => {
    findUnique.mockResolvedValue({
      id: 'c1',
      platform: 'instagram',
      accessToken: 'enc-page',
      platformUserId: 'IG1',
      refreshToken: null,
    })
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ id: 'IG1', username: 'fresh_handle' }) } as Response)

    const out = await refreshInstagramUsername('c1')

    expect(out).toBe('fresh_handle')
    const arg = update.mock.calls[0][0] as { where: { id: string }; data: { platformUsername: string } }
    expect(arg.where.id).toBe('c1')
    expect(arg.data.platformUsername).toBe('fresh_handle')
  })

  it('returns null without updating when no username could be resolved', async () => {
    findUnique.mockResolvedValue({
      id: 'c1',
      platform: 'instagram',
      accessToken: 'enc-page',
      platformUserId: 'IG1',
      refreshToken: null,
    })
    fetchMock.mockResolvedValue({ ok: false, status: 400, text: async () => 'err' } as Response)

    expect(await refreshInstagramUsername('c1')).toBeNull()
    expect(update).not.toHaveBeenCalled()
  })
})
