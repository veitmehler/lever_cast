/**
 * GHL billing webhook receiver (multi-tenancy plan Phase B).
 *
 * Three GHL workflows (Subscription trigger filtered Active / Overdue /
 * Canceled) each POST a fixed payload `{ "type": "<event>" }` to
 * /api/ghl/billing-events/<per-account token>. Account identity comes from the
 * URL token (minted via the admin endpoint), NOT from GHL's payload shape —
 * so nothing here depends on what the workflow webhook action includes.
 *
 * Auth: per-account unguessable token in the URL + shared secret header
 * (x-billing-secret) that all workflows send. No Clerk (GHL is the caller).
 */
import type { FastifyInstance } from 'fastify'
import { prisma } from '@omniply/shared'
import { logger } from '../lib/logger'
import {
  applyBillingEvent,
  BILLING_EVENT_TYPES,
  type BillingEventType,
} from '../lib/account-lifecycle'

interface BillingEventBody {
  type?: string
  [key: string]: unknown
}

export async function ghlBillingRoutes(app: FastifyInstance) {
  app.post<{ Params: { token: string }; Body: BillingEventBody }>(
    '/ghl/billing-events/:token',
    { config: { rateLimit: { max: 60, timeWindow: '1 minute' } } },
    async (request, reply) => {
      const secret = process.env.GHL_BILLING_WEBHOOK_SECRET
      if (!secret) {
        logger.error('[ghl-billing] GHL_BILLING_WEBHOOK_SECRET not configured — rejecting event')
        return reply.status(503).send({ error: 'Billing webhook not configured' })
      }
      if (request.headers['x-billing-secret'] !== secret) {
        return reply.status(401).send({ error: 'Unauthorized' })
      }

      const account = await prisma.account.findUnique({
        where: { ghlBillingToken: request.params.token },
        select: { id: true },
      })
      if (!account) {
        // Token miss gets a 404 with no detail (don't leak which tokens exist).
        return reply.status(404).send({ error: 'Unknown token' })
      }

      const type = request.body?.type
      if (!type || !BILLING_EVENT_TYPES.includes(type as BillingEventType)) {
        return reply.status(400).send({
          error: `type must be one of: ${BILLING_EVENT_TYPES.join(', ')}`,
        })
      }

      const result = await applyBillingEvent(account.id, type as BillingEventType, request.body)
      return reply.status(200).send({
        received: true,
        applied: result.applied,
        duplicate: result.duplicate,
        ...(result.burst ? { burst: result.burst } : {}),
      })
    },
  )
}
