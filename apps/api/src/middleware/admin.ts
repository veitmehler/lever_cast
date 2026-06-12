import type { FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '@socioply/shared'
import { requireAuth } from './auth'

/**
 * Verifies the Clerk JWT (via requireAuth) and then checks that the
 * resolved user has role='admin' in the database.
 *
 * Returns the User row on success, or sends 401/403 and returns undefined.
 */
export async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<{ id: string; clerkId: string; role: string } | undefined> {
  const clerkId = await requireAuth(request, reply)
  if (!clerkId) return undefined

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, clerkId: true, role: true },
  })

  if (!user || user.role !== 'admin') {
    reply.status(403).send({ error: 'Forbidden' })
    return undefined
  }

  return user
}
