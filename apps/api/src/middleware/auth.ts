import { verifyToken } from '@clerk/backend'
import type { FastifyRequest, FastifyReply } from 'fastify'
import { Sentry } from '../lib/sentry'

/**
 * Verify a Clerk Bearer token from the Authorization header.
 * Returns the Clerk userId (clerkId) on success, or throws a 401.
 *
 * Usage in route handlers:
 *   const clerkId = await requireAuth(request, reply)
 *   if (!clerkId) return   // reply already sent
 */
export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<string | undefined> {
  const authHeader = request.headers['authorization']
  if (!authHeader?.startsWith('Bearer ')) {
    reply.status(401).send({ error: 'Unauthorized' })
    return undefined
  }

  const token = authHeader.slice(7)
  const secretKey = process.env.CLERK_SECRET_KEY
  if (!secretKey) {
    request.log.error('CLERK_SECRET_KEY is not set')
    reply.status(500).send({ error: 'Server misconfiguration' })
    return undefined
  }

  try {
    // Allow a small clock-skew tolerance so tokens that are valid but sit right
    // at the expiry boundary (network latency, minor server clock drift) aren't
    // rejected. Clerk session tokens are short-lived (~60s); without leeway a
    // borderline-expired token produces spurious 401s on a long-lived page.
    const payload = await verifyToken(token, { secretKey, clockSkewInMs: 10_000 })
    Sentry.setUser({ id: payload.sub })
    return payload.sub // Clerk user ID
  } catch (err) {
    request.log.warn({ err }, 'Clerk token verification failed')
    reply.status(401).send({ error: 'Unauthorized' })
    return undefined
  }
}
