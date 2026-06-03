import type { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middleware/auth'
import { retryAutomationSpec } from '../social/automation/run'
import { enqueueSocialDispatch, enqueueSocialRegenerate } from '../social/automation/enqueue-dispatch'

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

  // POST /api/social-automation/:runId/approve/:slotKey
  app.post<{ Params: { runId: string; slotKey: string } }>(
    '/social-automation/:runId/approve/:slotKey',
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

      const result = await enqueueSocialDispatch(runId, {
        slotKey: slotKey.toUpperCase(),
      })
      if (!result.enqueued) {
        return reply.status(400).send({ error: result.message ?? 'Dispatch not enqueued' })
      }
      return reply.status(202).send({ ok: true, enqueued: true })
    },
  )

  // POST /api/social-automation/:runId/regenerate/:slotKey
  app.post<{ Params: { runId: string; slotKey: string } }>(
    '/social-automation/:runId/regenerate/:slotKey',
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

      const result = await enqueueSocialRegenerate(runId, slotKey)
      if (!result.enqueued) {
        return reply.status(400).send({ error: result.message ?? 'Regenerate not enqueued' })
      }
      return reply.status(202).send({ ok: true, enqueued: true })
    },
  )

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
