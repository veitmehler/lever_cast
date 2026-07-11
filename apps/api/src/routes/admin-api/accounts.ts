import type { FastifyInstance } from 'fastify'
import { randomBytes } from 'node:crypto'
import { prisma } from '@socioply/shared'
import { requireAdmin } from '../../middleware/admin'
import { getBoss, QUEUES } from '../../queues/index'

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

  // Enqueue account deletion (Phase C). Default is a DRY RUN that emails the
  // admin a full report; pass { dryRun: false, confirm: '<account name or id>' }
  // to actually delete. Serves both statutory deletion requests (any status)
  // and manual cleanup.
  app.post<{ Params: { id: string }; Body: { dryRun?: boolean; confirm?: string } }>(
    '/accounts/:id/delete',
    async (request, reply) => {
      const admin = await requireAdmin(request, reply)
      if (!admin) return

      const account = await prisma.account.findUnique({
        where: { id: request.params.id },
        select: { id: true, name: true },
      })
      if (!account) return reply.status(404).send({ error: 'Account not found' })

      const dryRun = request.body?.dryRun !== false // default TRUE — deleting requires explicit intent
      if (!dryRun) {
        const confirm = request.body?.confirm?.trim()
        if (confirm !== account.id && confirm !== account.name) {
          return reply.status(400).send({
            error: 'Real deletion requires confirm to match the account id or name exactly.',
          })
        }
      }

      const boss = await getBoss()
      await boss.send(
        QUEUES.ACCOUNT_DELETE,
        { accountId: account.id, reason: 'manual', dryRun },
        { singletonKey: `account-delete-${account.id}`, expireInSeconds: 3600 },
      )
      return reply.status(202).send({ enqueued: true, dryRun })
    },
  )

  // Mint (or rotate) the account's GHL billing webhook token and return the
  // receiver path for the GHL workflow's webhook action (Phase B runbook).
  app.post<{ Params: { id: string } }>('/accounts/:id/billing-token', async (request, reply) => {
    const admin = await requireAdmin(request, reply)
    if (!admin) return

    const existing = await prisma.account.findUnique({ where: { id: request.params.id }, select: { id: true } })
    if (!existing) return reply.status(404).send({ error: 'Account not found' })

    const token = randomBytes(24).toString('base64url')
    await prisma.account.update({ where: { id: request.params.id }, data: { ghlBillingToken: token } })
    return reply.send({ token, path: `/api/ghl/billing-events/${token}` })
  })
}
