import type { FastifyRequest, FastifyReply } from 'fastify'
import { resolveAccountForClerkId, type ResolvedAccount } from '@omniply/shared'
import { requireAuth } from './auth'

/**
 * Verifies the Clerk JWT (via requireAuth) and resolves the caller's account
 * context: their own userId, their accountId, and the full member set used to
 * scope account-shared reads (`userId IN memberUserIds`).
 *
 * Returns the ResolvedAccount on success, or sends 401/404 and returns undefined.
 */
export async function requireAccount(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<ResolvedAccount | undefined> {
  const clerkId = await requireAuth(request, reply)
  if (!clerkId) return undefined

  const account = await resolveAccountForClerkId(clerkId)
  if (!account) {
    reply.status(404).send({ error: 'User not found' })
    return undefined
  }
  return account
}
