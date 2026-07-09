import type { FastifyInstance } from 'fastify'
import { prisma } from '@socioply/shared'
import { requireAdmin } from '../../middleware/admin'

interface PatchAccountBody {
  subscriptionStartedAt: string | null
}

/**
 * Admin control for Account.subscriptionStartedAt — the billing-cycle anchor
 * that drives Content Plan windowing (see billing-window.ts). Lets support
 * "activate" a test/comped account today, without a real Stripe integration.
 */
export async function accountsAdminRoutes(app: FastifyInstance) {
  app.patch<{ Params: { id: string }; Body: PatchAccountBody }>(
    '/accounts/:id',
    async (request, reply) => {
      const admin = await requireAdmin(request, reply)
      if (!admin) return

      const { subscriptionStartedAt } = request.body ?? {}
      const parsed = subscriptionStartedAt ? new Date(subscriptionStartedAt) : null
      if (subscriptionStartedAt && Number.isNaN(parsed?.getTime())) {
        return reply.status(400).send({ error: 'subscriptionStartedAt must be a valid date or null' })
      }

      const existing = await prisma.account.findUnique({ where: { id: request.params.id } })
      if (!existing) return reply.status(404).send({ error: 'Account not found' })

      const updated = await prisma.account.update({
        where: { id: request.params.id },
        data: { subscriptionStartedAt: parsed },
        select: { id: true, subscriptionStartedAt: true },
      })

      return reply.send(updated)
    },
  )
}
