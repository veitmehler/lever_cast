import type { FastifyInstance } from 'fastify'
import { prisma } from '@omniply/shared'
import { logger } from '../lib/logger'
import { getGhlCredentials } from '../lib/ghl/settings'
import {
  addGhlInboundMessage,
  createGhlContactNote,
  findOrCreateGhlConversation,
  upsertGhlContact,
} from '../lib/ghl/client'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/**
 * Public marketing-site endpoints (omniply.io). The contact form posts here
 * (proxied through the Vercel web app, so no CORS surface) and the inquiry
 * lands in Azavea's own GHL location as an inbound conversation message —
 * front-desk style management in one inbox. Falls back to a contact note when
 * the Conversations API refuses the inbound write.
 */
export async function marketingRoutes(app: FastifyInstance) {
  app.post<{
    Body: { name?: string; email?: string; practice?: string; message?: string; website?: string }
  }>(
    '/marketing/contact',
    { config: { rateLimit: { max: 5, timeWindow: '1 minute' } } },
    async (request, reply) => {
      const { name, email, practice, message, website } = request.body ?? {}

      // Honeypot: real visitors never fill the hidden "website" field.
      if (website) return reply.send({ ok: true })

      const cleanName = (name ?? '').trim().slice(0, 100)
      const cleanEmail = (email ?? '').trim().toLowerCase().slice(0, 254)
      const cleanPractice = (practice ?? '').trim().slice(0, 150)
      const cleanMessage = (message ?? '').trim().slice(0, 4000)
      if (!cleanName || !EMAIL_RE.test(cleanEmail) || !cleanMessage) {
        return reply.status(400).send({ error: 'Name, a valid email, and a message are required.' })
      }

      const account = await prisma.account.findFirst({
        where: { vertical: 'azavea', status: 'active' },
        select: { ownerUserId: true },
      })
      const creds = account?.ownerUserId ? await getGhlCredentials(account.ownerUserId) : null
      if (!creds) {
        logger.error('[marketing] contact form: no Azavea GHL credentials')
        return reply.status(503).send({ error: 'Message could not be delivered. Please email us directly.' })
      }

      try {
        const result = await upsertGhlContact(creds.apiKey, creds.locationId, {
          email: cleanEmail,
          firstName: cleanName,
          tags: ['website-inquiry', 'omniply-contact-form'],
          source: 'omniply.io contact form',
        })
        if (!result.contactId) throw new Error('contact upsert returned no id')

        const lines = [
          `Website inquiry from ${cleanName} (${cleanEmail})`,
          cleanPractice ? `Practice: ${cleanPractice}` : null,
          '',
          cleanMessage,
        ].filter((l): l is string => l !== null)
        const body = lines.join('\n')

        const conversationId = await findOrCreateGhlConversation(creds.apiKey, creds.locationId, result.contactId)
        const delivered = conversationId ? await addGhlInboundMessage(creds.apiKey, conversationId, body) : false
        if (!delivered) {
          // Note fallback keeps the inquiry attached to the contact either way.
          await createGhlContactNote(creds.apiKey, result.contactId, `📨 Contact form message\n${body}`)
        }
        logger.info(
          { contactId: result.contactId, conversationId, delivered },
          '[marketing] contact form inquiry delivered',
        )
        return reply.send({ ok: true })
      } catch (err) {
        logger.error({ err }, '[marketing] contact form delivery failed')
        return reply.status(502).send({ error: 'Message could not be delivered. Please email us directly.' })
      }
    },
  )
}
