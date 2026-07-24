import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the Prisma client the oauth store depends on.
const create = vi.fn()
const findUnique = vi.fn()
const del = vi.fn()
const deleteMany = vi.fn()

vi.mock('@omniply/shared', () => ({
  prisma: {
    oAuthState: {
      create: (...a: unknown[]) => create(...a),
      findUnique: (...a: unknown[]) => findUnique(...a),
      delete: (...a: unknown[]) => del(...a),
      deleteMany: (...a: unknown[]) => deleteMany(...a),
    },
  },
}))

import { generateOAuthState, verifyOAuthState } from '../oauth'

beforeEach(() => {
  vi.clearAllMocks()
  create.mockResolvedValue(undefined)
  del.mockResolvedValue(undefined)
  deleteMany.mockResolvedValue(undefined)
})

describe('generateOAuthState (characterization)', () => {
  it('creates a 64-char hex state with a code verifier and persists it', async () => {
    const result = await generateOAuthState('clerk_1', 'linkedin', 'company')

    expect(result.state).toMatch(/^[0-9a-f]{64}$/)
    expect(result.codeVerifier).toBeTruthy()

    expect(create).toHaveBeenCalledTimes(1)
    const arg = create.mock.calls[0][0] as { data: Record<string, unknown> }
    expect(arg.data.clerkId).toBe('clerk_1')
    expect(arg.data.platform).toBe('linkedin')
    expect(arg.data.target).toBe('company')
    expect(arg.data.expiresAt).toBeInstanceOf(Date)
  })

  it('defaults target to null when omitted', async () => {
    await generateOAuthState('clerk_1', 'twitter')
    const arg = create.mock.calls[0][0] as { data: Record<string, unknown> }
    expect(arg.data.target).toBeNull()
  })
})

describe('verifyOAuthState (characterization)', () => {
  const future = () => new Date(Date.now() + 60_000)
  const past = () => new Date(Date.now() - 60_000)

  it('returns invalid when the state does not exist', async () => {
    findUnique.mockResolvedValue(null)
    expect(await verifyOAuthState('nope', 'clerk_1', 'linkedin')).toEqual({ valid: false })
  })

  it('consumes the state (single-use delete) and returns valid on a match', async () => {
    findUnique.mockResolvedValue({
      clerkId: 'clerk_1',
      platform: 'linkedin',
      codeVerifier: 'verifier_xyz',
      target: 'personal',
      expiresAt: future(),
    })

    const result = await verifyOAuthState('state_1', 'clerk_1', 'linkedin')

    expect(result).toEqual({ valid: true, codeVerifier: 'verifier_xyz', target: 'personal' })
    expect(del).toHaveBeenCalledWith({ where: { state: 'state_1' } })
  })

  it('returns invalid for an expired state', async () => {
    findUnique.mockResolvedValue({
      clerkId: 'clerk_1',
      platform: 'linkedin',
      codeVerifier: null,
      target: null,
      expiresAt: past(),
    })
    expect(await verifyOAuthState('state_1', 'clerk_1', 'linkedin')).toEqual({ valid: false })
  })

  it('returns invalid when clerkId or platform does not match', async () => {
    findUnique.mockResolvedValue({
      clerkId: 'clerk_OTHER',
      platform: 'linkedin',
      codeVerifier: null,
      target: null,
      expiresAt: future(),
    })
    expect(await verifyOAuthState('state_1', 'clerk_1', 'linkedin')).toEqual({ valid: false })
  })
})
