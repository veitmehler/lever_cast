import type { FastifyInstance } from 'fastify'
import { prisma } from '@socioply/shared'
import { logger } from '../lib/logger'
import { requireAuth } from '../middleware/auth'
import { decrypt, encrypt, maskApiKey } from '@socioply/shared'
import { getGhlOAuthStartUrl, listGhlAccounts } from '../lib/ghl/client'
import type { GhlAccountIds } from '../lib/ghl/types'
import { GHL_PLATFORMS } from '../lib/ghl/types'

export async function ghlRoutes(app: FastifyInstance) {
  // GET /api/ghl/settings
  app.get('/ghl/settings', async (request, reply) => {
    const clerkId = await requireAuth(request, reply)
    if (!clerkId) return

    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) return reply.status(404).send({ error: 'User not found' })

    const row = await prisma.ghlSettings.findUnique({ where: { userId: user.id } })

    if (!row) {
      return {
        configured: false,
        ghlLocationId: '',
        ghlUserId: '',
        accountIds: {},
        maskedApiKey: '',
        lastVerifiedAt: null,
        lastError: null,
      }
    }

    const decrypted = row.ghlApiKey ? decrypt(row.ghlApiKey) : ''

    return {
      configured: !!(row.ghlApiKey && row.ghlLocationId && row.ghlUserId),
      ghlLocationId: row.ghlLocationId ?? '',
      ghlUserId: row.ghlUserId ?? '',
      accountIds: (row.accountIds ?? {}) as GhlAccountIds,
      maskedApiKey: decrypted ? maskApiKey(decrypted) : '',
      hasApiKey: !!row.ghlApiKey,
      lastVerifiedAt: row.lastVerifiedAt,
      lastError: row.lastError,
    }
  })

  // PUT /api/ghl/settings
  app.put('/ghl/settings', async (request, reply) => {
    const clerkId = await requireAuth(request, reply)
    if (!clerkId) return

    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) return reply.status(404).send({ error: 'User not found' })

    const body = request.body as {
      ghlApiKey?: string
      ghlLocationId?: string
      ghlUserId?: string
      accountIds?: GhlAccountIds
    }

    const existing = await prisma.ghlSettings.findUnique({ where: { userId: user.id } })

    const ghlLocationId = body.ghlLocationId?.trim() || existing?.ghlLocationId || null
    const ghlUserId = body.ghlUserId?.trim() || existing?.ghlUserId || null

    if (!ghlLocationId || !ghlUserId) {
      return reply.status(400).send({ error: 'ghlLocationId and ghlUserId are required' })
    }

    let ghlApiKey = existing?.ghlApiKey ?? null
    if (body.ghlApiKey?.trim()) {
      ghlApiKey = encrypt(body.ghlApiKey.trim())
    }

    if (!ghlApiKey) {
      return reply.status(400).send({ error: 'ghlApiKey is required' })
    }

    const accountIds = body.accountIds ?? (existing?.accountIds as GhlAccountIds | null) ?? {}

    const row = await prisma.ghlSettings.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        ghlApiKey,
        ghlLocationId,
        ghlUserId,
        accountIds,
      },
      update: {
        ghlApiKey,
        ghlLocationId,
        ghlUserId,
        ...(body.accountIds !== undefined ? { accountIds } : {}),
      },
    })

    return {
      configured: true,
      ghlLocationId: row.ghlLocationId,
      ghlUserId: row.ghlUserId,
      accountIds: row.accountIds,
      maskedApiKey: maskApiKey(decrypt(ghlApiKey)),
    }
  })

  // GET /api/ghl/accounts — list connected social accounts from GHL
  app.get('/ghl/accounts', async (request, reply) => {
    const clerkId = await requireAuth(request, reply)
    if (!clerkId) return

    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) return reply.status(404).send({ error: 'User not found' })

    const row = await prisma.ghlSettings.findUnique({ where: { userId: user.id } })
    if (!row?.ghlApiKey || !row.ghlLocationId) {
      return reply.status(400).send({ error: 'Save your GHL API key and Location ID first' })
    }

    const apiKey = decrypt(row.ghlApiKey)
    if (!apiKey) {
      return reply.status(400).send({ error: 'Could not decrypt GHL API key' })
    }

    try {
      const accounts = await listGhlAccounts(apiKey, row.ghlLocationId)
      await prisma.ghlSettings.update({
        where: { userId: user.id },
        data: { lastVerifiedAt: new Date(), lastError: null },
      })

      if (accounts.length === 0) {
        logger.warn(
          { userId: user.id, locationId: row.ghlLocationId },
          '[ghl] /ghl/accounts returned 0 accounts — likely wrong locationId or missing API key scopes',
        )
        return {
          accounts,
          warning:
            'Omniply returned 0 accounts. Check that (1) your Location ID is correct, (2) social media profiles are connected in Social Planner → Settings → Integrations for that location, and (3) your Private Integration key has social-media-posting scope.',
        }
      }

      return { accounts }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      logger.error({ userId: user.id, locationId: row.ghlLocationId, err }, '[ghl] listGhlAccounts threw')
      await prisma.ghlSettings.update({
        where: { userId: user.id },
        data: { lastError: message },
      }).catch(() => {})
      return reply.status(400).send({ error: message })
    }
  })

  // GET /api/ghl/oauth-url/:platform
  app.get('/ghl/oauth-url/:platform', async (request, reply) => {
    const clerkId = await requireAuth(request, reply)
    if (!clerkId) return

    const { platform } = request.params as { platform: string }
    if (!GHL_PLATFORMS.includes(platform as typeof GHL_PLATFORMS[number])) {
      return reply.status(400).send({ error: `Unsupported platform: ${platform}` })
    }

    return { url: getGhlOAuthStartUrl(platform) }
  })
}
