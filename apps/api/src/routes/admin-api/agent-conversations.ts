import type { FastifyInstance } from 'fastify'
import { prisma } from '@omniply/shared'
import { requireAdmin } from '../../middleware/admin'

/**
 * Admin chat-agent transcript surface (chat-agent plan C2b): flagged
 * conversations sort first (compliance surface — red-flag interceptions,
 * post-filter replacements, failed action executions), then newest.
 */
export async function agentConversationsAdminRoutes(app: FastifyInstance) {
  app.get('/agent-conversations', async (request, reply) => {
    const clerkId = await requireAdmin(request, reply)
    if (!clerkId) return

    const { accountId, flagged } = request.query as { accountId?: string; flagged?: string }
    const conversations = await prisma.agentConversation.findMany({
      where: {
        ...(accountId ? { accountId } : {}),
        ...(flagged === '1' ? { flagged: true } : {}),
      },
      orderBy: [{ flagged: 'desc' }, { createdAt: 'desc' }],
      take: 100,
      select: {
        id: true,
        accountId: true,
        account: { select: { name: true } },
        visitorKey: true,
        flagged: true,
        flagReason: true,
        endedReason: true,
        turnCount: true,
        costUsd: true,
        ghlContactId: true,
        createdAt: true,
        updatedAt: true,
      },
    })
    return reply.send({ conversations })
  })

  app.get<{ Params: { id: string } }>('/agent-conversations/:id', async (request, reply) => {
    const clerkId = await requireAdmin(request, reply)
    if (!clerkId) return

    const conversation = await prisma.agentConversation.findUnique({
      where: { id: request.params.id },
      select: {
        id: true,
        accountId: true,
        account: { select: { name: true } },
        flagged: true,
        flagReason: true,
        endedReason: true,
        turnCount: true,
        costUsd: true,
        ghlContactId: true,
        createdAt: true,
        messages: {
          orderBy: { createdAt: 'asc' },
          select: { role: true, content: true, action: true, filtered: true, createdAt: true },
        },
      },
    })
    if (!conversation) return reply.status(404).send({ error: 'Not found' })
    return reply.send({ conversation })
  })
}
