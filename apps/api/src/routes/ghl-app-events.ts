/**
 * Marketplace-app lifecycle webhook (auto-provisioning trigger).
 *
 * Configure in the app portal: Webhooks → https://svc.omniply.io/api/ghl/app-events
 * INSTALL events for a location fire zero-touch provisioning. Forged payloads
 * are harmless: provisioning verifies the install by minting a location token
 * (which only succeeds for locations that actually have the app) and is
 * idempotent + creation-only.
 */
import type { FastifyInstance } from 'fastify'
import { provisionLocation } from '../lib/ghl/auto-provision'
import { logger } from '../lib/logger'

interface AppEvent {
  type?: string
  locationId?: string
  companyId?: string
  appId?: string
  userId?: string
}

export async function ghlAppEventRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: AppEvent }>('/ghl/app-events', async (request, reply) => {
    const evt = request.body ?? {}
    logger.info({ type: evt.type, locationId: evt.locationId }, '[app-events] received')

    if (evt.type === 'INSTALL' && evt.locationId) {
      const accountId = await provisionLocation(evt.locationId, 'install-webhook')
      return reply.send({ ok: true, provisioned: Boolean(accountId) })
    }
    if (evt.type === 'UNINSTALL' && evt.locationId) {
      // Never auto-delete on uninstall — lifecycle clocks govern data retention.
      logger.warn({ locationId: evt.locationId }, '[app-events] UNINSTALL received (no action; lifecycle clocks govern)')
    }
    return reply.send({ ok: true })
  })
}
