import type { FastifyInstance } from 'fastify'
import { prisma } from '@socioply/shared'
import { requireAdmin } from '../../middleware/admin'

interface PatchAccountBody {
  subscriptionStartedAt?: string | null
  status?: string
  paidThrough?: string | null
  billingExempt?: boolean
}

const VALID_STATUSES = ['active', 'paused', 'cancelled'] as const

/**
 * Admin control for Account billing/lifecycle fields.
 *
 * - subscriptionStartedAt: the billing-cycle anchor driving Content Plan
 *   windowing (billing-window.ts). Re-anchored automatically by payment events
 *   once Phase B lands; until then this is the manual control.
 * - status / paidThrough / billingExempt: the Phase A lifecycle state machine
 *   (invariant: paidThrough governs publishing; status governs generation).
 *   Manual driving until GHL billing events arrive; billingExempt is the
 *   permanent comp-account switch.
 */
export async function accountsAdminRoutes(app: FastifyInstance) {
  app.patch<{ Params: { id: string }; Body: PatchAccountBody }>(
    '/accounts/:id',
    async (request, reply) => {
      const admin = await requireAdmin(request, reply)
      if (!admin) return

      const body = request.body ?? {}
      const data: Record<string, unknown> = {}

      if ('subscriptionStartedAt' in body) {
        const parsed = body.subscriptionStartedAt ? new Date(body.subscriptionStartedAt) : null
        if (body.subscriptionStartedAt && Number.isNaN(parsed?.getTime())) {
          return reply.status(400).send({ error: 'subscriptionStartedAt must be a valid date or null' })
        }
        data.subscriptionStartedAt = parsed
      }

      if ('paidThrough' in body) {
        const parsed = body.paidThrough ? new Date(body.paidThrough) : null
        if (body.paidThrough && Number.isNaN(parsed?.getTime())) {
          return reply.status(400).send({ error: 'paidThrough must be a valid date or null' })
        }
        data.paidThrough = parsed
      }

      if ('status' in body) {
        if (!VALID_STATUSES.includes(body.status as (typeof VALID_STATUSES)[number])) {
          return reply.status(400).send({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` })
        }
        data.status = body.status
        data.statusChangedAt = new Date()
      }

      if ('billingExempt' in body) {
        if (typeof body.billingExempt !== 'boolean') {
          return reply.status(400).send({ error: 'billingExempt must be a boolean' })
        }
        data.billingExempt = body.billingExempt
      }

      if (Object.keys(data).length === 0) {
        return reply.status(400).send({ error: 'No recognized fields to update' })
      }

      const existing = await prisma.account.findUnique({ where: { id: request.params.id } })
      if (!existing) return reply.status(404).send({ error: 'Account not found' })

      const updated = await prisma.account.update({
        where: { id: request.params.id },
        data,
        select: {
          id: true,
          subscriptionStartedAt: true,
          status: true,
          statusChangedAt: true,
          paidThrough: true,
          billingExempt: true,
        },
      })

      return reply.send(updated)
    },
  )
}
