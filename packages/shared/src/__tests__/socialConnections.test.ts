import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the data/crypto boundaries so no real DB or key is needed.
const findUnique = vi.fn()
const findFirst = vi.fn()
vi.mock('../prisma', () => ({
  prisma: {
    socialConnection: {
      findUnique: (...a: unknown[]) => findUnique(...a),
      findFirst: (...a: unknown[]) => findFirst(...a),
    },
  },
}))
// decrypt is deterministic in tests: it just tags the input so we can assert the
// stored (encrypted) value was passed through decrypt() before being returned.
vi.mock('../encryption', () => ({
  decrypt: (v: string) => `dec(${v})`,
}))

import { getSocialConnection, isTokenExpiringSoon } from '../socialConnections'

const baseRow = {
  id: 'conn_1',
  userId: 'user_A',
  platform: 'twitter',
  appType: null,
  accessToken: 'enc-access',
  refreshToken: 'enc-refresh',
  tokenExpiry: null,
  platformUserId: 'p1',
  platformUsername: 'handle',
  postTargetType: null,
  selectedPageId: null,
  isActive: true,
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('isTokenExpiringSoon', () => {
  it('returns false when there is no expiry', () => {
    expect(isTokenExpiringSoon(null)).toBe(false)
  })

  it('returns true for a token that already expired', () => {
    expect(isTokenExpiringSoon(new Date(Date.now() - 60_000))).toBe(true)
  })

  it('returns true for a token expiring inside the 5-minute window', () => {
    expect(isTokenExpiringSoon(new Date(Date.now() + 60_000))).toBe(true)
  })

  it('returns false for a token expiring well beyond the window', () => {
    expect(isTokenExpiringSoon(new Date(Date.now() + 60 * 60_000))).toBe(false)
  })
})

describe('getSocialConnection', () => {
  it('looks up by the (userId, platform, appType) unique key; non-linkedin uses appType=null', async () => {
    findUnique.mockResolvedValue(baseRow)

    const out = await getSocialConnection('user_A', 'twitter')

    const where = (findUnique.mock.calls[0][0] as { where: { userId_platform_appType: Record<string, unknown> } })
      .where.userId_platform_appType
    expect(where).toMatchObject({ userId: 'user_A', platform: 'twitter', appType: null })
    expect(out?.id).toBe('conn_1')
    expect(findFirst).not.toHaveBeenCalled()
  })

  it('decrypts the access and refresh tokens before returning them', async () => {
    findUnique.mockResolvedValue(baseRow)

    const out = await getSocialConnection('user_A', 'twitter')

    expect(out?.accessToken).toBe('dec(enc-access)')
    expect(out?.refreshToken).toBe('dec(enc-refresh)')
  })

  it('returns a null refresh token without calling decrypt on it', async () => {
    findUnique.mockResolvedValue({ ...baseRow, refreshToken: null })

    const out = await getSocialConnection('user_A', 'twitter')

    expect(out?.refreshToken).toBeNull()
  })

  it('returns null when no connection exists', async () => {
    findUnique.mockResolvedValue(null)
    expect(await getSocialConnection('user_A', 'twitter')).toBeNull()
  })

  it('returns null when the connection is inactive', async () => {
    findUnique.mockResolvedValue({ ...baseRow, isActive: false })
    expect(await getSocialConnection('user_A', 'twitter')).toBeNull()
  })

  it('defaults linkedin lookups to the personal app when no appType is given', async () => {
    findUnique.mockResolvedValue({ ...baseRow, platform: 'linkedin', appType: 'personal' })

    const out = await getSocialConnection('user_A', 'linkedin')

    const where = (findUnique.mock.calls[0][0] as { where: { userId_platform_appType: Record<string, unknown> } })
      .where.userId_platform_appType
    expect(where.appType).toBe('personal')
    expect(out?.appType).toBe('personal')
  })

  it('honors an explicit linkedin company appType', async () => {
    findUnique.mockResolvedValue({ ...baseRow, platform: 'linkedin', appType: 'company' })

    const out = await getSocialConnection('user_A', 'linkedin', 'company')

    const where = (findUnique.mock.calls[0][0] as { where: { userId_platform_appType: Record<string, unknown> } })
      .where.userId_platform_appType
    expect(where.appType).toBe('company')
    expect(out?.appType).toBe('company')
  })

  it('leaves appType null for non-linkedin platforms even when the row carries one', async () => {
    findUnique.mockResolvedValue({ ...baseRow, platform: 'twitter', appType: 'company' })

    const out = await getSocialConnection('user_A', 'twitter')

    expect(out?.appType).toBeNull()
  })

  it('falls back to findFirst when the unique constraint is missing (pre-migration)', async () => {
    findUnique.mockRejectedValue(new Error('Unknown argument `userId_platform_appType`'))
    findFirst.mockResolvedValue(baseRow)

    const out = await getSocialConnection('user_A', 'twitter')

    const where = (findFirst.mock.calls[0][0] as { where: Record<string, unknown> }).where
    expect(where).toMatchObject({ userId: 'user_A', platform: 'twitter', isActive: true })
    expect(out?.accessToken).toBe('dec(enc-access)')
  })

  it('falls back to findFirst on a P2009 error code', async () => {
    const err = Object.assign(new Error('validation'), { code: 'P2009' })
    findUnique.mockRejectedValue(err)
    findFirst.mockResolvedValue(baseRow)

    expect(await getSocialConnection('user_A', 'twitter')).not.toBeNull()
    expect(findFirst).toHaveBeenCalledTimes(1)
  })

  it('re-throws an unrelated prisma error instead of falling back', async () => {
    findUnique.mockRejectedValue(new Error('connection refused'))

    await expect(getSocialConnection('user_A', 'twitter')).rejects.toThrow('connection refused')
    expect(findFirst).not.toHaveBeenCalled()
  })
})
