import type { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middleware/auth'
import { retryAutomationSpec } from '../social/automation/run'

export async function socialAutomationRoutes(app: FastifyInstance) {
  // GET /api/social-automation/:runId
  app.get<{ Params: { runId: string } }>('/social-automation/:runId', async (request, reply) => {
    const clerkId = await requireAuth(request, reply)
    if (!clerkId) return

    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) return reply.status(404).send({ error: 'User not found' })

    const { runId } = request.params
    const run = await prisma.socialAutomationRun.findFirst({
      where: { id: runId, userId: user.id },
      include: {
        specResults: { orderBy: { slotKey: 'asc' } },
        _count: { select: { posts: true } },
        job: { select: { id: true, topic: { select: { topic: true } } } },
      },
    })

    if (!run) return reply.status(404).send({ error: 'Automation run not found' })
    return reply.send({ run })
  })

  // POST /api/social-automation/:runId/retry/:slotKey
  app.post<{ Params: { runId: string; slotKey: string } }>(
    '/social-automation/:runId/retry/:slotKey',
    async (request, reply) => {
      const clerkId = await requireAuth(request, reply)
      if (!clerkId) return

      const user = await prisma.user.findUnique({ where: { clerkId } })
      if (!user) return reply.status(404).send({ error: 'User not found' })

      const { runId, slotKey } = request.params
      const run = await prisma.socialAutomationRun.findFirst({
        where: { id: runId, userId: user.id },
      })
      if (!run) return reply.status(404).send({ error: 'Automation run not found' })

      try {
        await retryAutomationSpec(runId, slotKey.toUpperCase())
        return reply.send({ ok: true, message: `Retried slot ${slotKey.toUpperCase()}` })
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        return reply.status(400).send({ error: message })
      }
    },
  )
}
