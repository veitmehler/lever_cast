import type { FastifyRequest } from 'fastify'
import { verifyToken } from '@clerk/backend'

/**
 * Best-effort onRequest hook: if a valid Clerk Bearer token is present, set
 * `req.clerkId` so rate-limit keyGenerators can throttle per-user instead of
 * per-IP.
 *
 * This does NOT enforce authentication — route handlers still call requireAuth(),
 * which is what sends the 401. An absent or invalid token simply leaves clerkId
 * unset (the limiter then falls back to req.ip for that request).
 *
 * Must be registered BEFORE @fastify/rate-limit so clerkId is populated by the
 * time the limiter's keyGenerator runs.
 */
export async function populateClerkId(request: FastifyRequest): Promise<void> {
  const authHeader = request.headers['authorization']
  if (!authHeader?.startsWith('Bearer ')) return

  const secretKey = process.env.CLERK_SECRET_KEY
  if (!secretKey) return

  try {
    const payload = await verifyToken(authHeader.slice(7), {
      secretKey,
      clockSkewInMs: 10_000,
    })
    request.clerkId = payload.sub
  } catch {
    // Invalid/expired token — leave clerkId unset. requireAuth() will reject in
    // the handler; here we just decline to attribute the request to a user.
  }
}
