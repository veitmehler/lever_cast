import { describe, it, expect, vi, beforeEach } from 'vitest'

const verifyTokenMock = vi.fn()
vi.mock('@clerk/backend', () => ({
  verifyToken: (...a: unknown[]) => verifyTokenMock(...a),
}))

import { populateClerkId } from '../clerk-context'

type Req = { headers: Record<string, string | undefined>; clerkId?: string }

function req(authHeader?: string): Req {
  return { headers: authHeader ? { authorization: authHeader } : {} }
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.CLERK_SECRET_KEY = 'sk_test_x'
})

describe('populateClerkId', () => {
  it('sets clerkId from a valid Bearer token', async () => {
    verifyTokenMock.mockResolvedValue({ sub: 'user_123' })
    const r = req('Bearer good.token')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await populateClerkId(r as any)
    expect(r.clerkId).toBe('user_123')
  })

  it('leaves clerkId unset when there is no Bearer token', async () => {
    const r = req()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await populateClerkId(r as any)
    expect(r.clerkId).toBeUndefined()
    expect(verifyTokenMock).not.toHaveBeenCalled()
  })

  it('leaves clerkId unset when token verification fails', async () => {
    verifyTokenMock.mockRejectedValue(new Error('bad token'))
    const r = req('Bearer bad.token')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await populateClerkId(r as any)
    expect(r.clerkId).toBeUndefined()
  })

  it('does nothing when CLERK_SECRET_KEY is not set', async () => {
    delete process.env.CLERK_SECRET_KEY
    const r = req('Bearer good.token')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await populateClerkId(r as any)
    expect(r.clerkId).toBeUndefined()
    expect(verifyTokenMock).not.toHaveBeenCalled()
  })
})
