/**
 * Embedded-app session exchange (onboarding plan Phase 0).
 *
 * The iframe posts the encrypted GHL SSO payload here; we decrypt it, resolve
 * (or create) the user, attach them to the account whose provisioned
 * GhlSettings.ghlLocationId matches the SSO activeLocation, and hand back our
 * short-lived bearer token plus routing state (onboarding pending/complete).
 *
 * If no account matches the location the subaccount hasn't been provisioned
 * yet (admin runbook not run) — we return provisioningPending WITHOUT creating
 * anything, so a stray install can't spawn orphan accounts.
 */
import type { FastifyInstance } from 'fastify'
import { prisma } from '@omniply/shared'
import { logger } from '../lib/logger'
import { decryptGhlSso, signEmbedToken, ghlClerkId } from '../lib/embed-auth'

export async function embedRoutes(app: FastifyInstance) {
  // Install-flow landing stub: GHL app installs may require an OAuth redirect
  // URL even for SSO-only custom-page apps. We don't exchange the code — data
  // access rides the per-client Private Integration key — so this just
  // acknowledges the install and points the user at the sidebar app.
  app.get<{ Querystring: { code?: string } }>('/embed/oauth-callback', async (request, reply) => {
    // Exchange the install code for the agency grant (auto-provisioning
    // foundation), then backfill-provision every installed location. Fire and
    // forget — the page responds immediately either way.
    const code = request.query.code
    if (code) {
      void (async () => {
        try {
          const { exchangeInstallCode, listInstalledLocations } = await import('../lib/ghl/app-oauth')
          const { provisionLocation } = await import('../lib/ghl/auto-provision')
          const grant = await exchangeInstallCode(code)
          if (grant) {
            const locations = await listInstalledLocations()
            logger.info({ count: locations.length }, '[embed] backfill-provisioning installed locations')
            for (const loc of locations) await provisionLocation(loc, 'install-backfill')
          }
        } catch (err) {
          logger.error({ err }, '[embed] install-code exchange/backfill failed')
        }
      })()
    }
    reply.type('text/html')
    return reply.send(
      '<html><body style="font-family:sans-serif;text-align:center;padding-top:80px">' +
        '<h2>App installed ✓</h2><p>You can close this tab and open the app from your sidebar.</p>' +
        '</body></html>',
    )
  })

  app.post<{ Body: { encryptedData?: string } }>(
    '/embed/session',
    { config: { rateLimit: { max: 30, timeWindow: '1 minute' } } },
    async (request, reply) => {
      const ssoSecret = process.env.GHL_SSO_SECRET
      if (!ssoSecret) {
        logger.error('[embed] GHL_SSO_SECRET not configured')
        return reply.status(503).send({ error: 'Embedded mode not configured' })
      }
      const encrypted = request.body?.encryptedData
      if (!encrypted) return reply.status(400).send({ error: 'encryptedData required' })

      // Key rotation: try the current secret, then the previous one (set
      // GHL_SSO_SECRET_PREVIOUS during app re-creation / key rotation windows).
      let ctx
      try {
        ctx = decryptGhlSso(encrypted, ssoSecret)
      } catch (err) {
        const previous = process.env.GHL_SSO_SECRET_PREVIOUS
        if (previous) {
          try {
            ctx = decryptGhlSso(encrypted, previous)
            logger.warn('[embed] SSO decrypted with PREVIOUS secret — GHL is still encrypting under the old app key; update GHL_SSO_SECRET')
          } catch {
            logger.warn({ err }, '[embed] SSO decrypt failed with current AND previous secrets')
            return reply.status(401).send({ error: 'Invalid SSO payload' })
          }
        } else {
          logger.warn({ err }, '[embed] SSO decrypt failed')
          return reply.status(401).send({ error: 'Invalid SSO payload' })
        }
      }

      const locationId = ctx.activeLocation
      if (!locationId) {
        // Agency-level open (no location context) — nothing to attach to.
        return reply.status(400).send({ error: 'Open the app from a sub-account, not the agency view' })
      }

      // Which account owns this location? (Provisioned by the admin runbook.)
      const ghlSettings = await prisma.ghlSettings.findFirst({
        where: { ghlLocationId: locationId },
        select: { userId: true },
      })
      const ownerUser = ghlSettings
        ? await prisma.user.findUnique({ where: { id: ghlSettings.userId }, select: { accountId: true } })
        : null
      if (!ownerUser?.accountId) {
        logger.info({ locationId }, '[embed] unprovisioned location opened the app')
        return reply.status(200).send({ provisioningPending: true })
      }
      const accountId = ownerUser.accountId

      // Resolve or create the user (synthetic clerkId keeps every existing
      // clerkId-keyed code path working unchanged).
      let user = await prisma.user.findUnique({ where: { ghlUserId: ctx.userId } })
      if (!user && ctx.email) {
        // Join key for someone who already exists via the open web.
        user = await prisma.user.findUnique({ where: { email: ctx.email } })
        if (user && !user.ghlUserId) {
          user = await prisma.user.update({ where: { id: user.id }, data: { ghlUserId: ctx.userId } })
        }
      }
      if (!user) {
        user = await prisma.user.create({
          data: {
            clerkId: ghlClerkId(ctx.userId),
            ghlUserId: ctx.userId,
            email: ctx.email ?? `${ctx.userId}@ghl.local`,
            name: ctx.userName ?? null,
            accountId,
          },
        })
        logger.info({ userId: user.id, accountId }, '[embed] created user from SSO context')
      } else if (user.accountId !== accountId) {
        // A known user opening a different (their) location — keep their account
        // binding authoritative; do NOT silently re-home users across tenants.
        if (!user.accountId) {
          user = await prisma.user.update({ where: { id: user.id }, data: { accountId } })
        } else {
          logger.warn(
            { userId: user.id, userAccountId: user.accountId, locationAccountId: accountId },
            '[embed] SSO location belongs to a different account than the user — refusing',
          )
          return reply.status(403).send({ error: 'This sub-account belongs to a different workspace' })
        }
      }

      // Auto-provisioned accounts have a placeholder owner until the buyer's
      // first open: promote this user to owner and re-home the GHL settings.
      const accountRow = await prisma.account.findUnique({
        where: { id: accountId },
        select: { onboardingCompletedAt: true, status: true, ownerUserId: true },
      })
      try {
        if (accountRow?.ownerUserId && accountRow.ownerUserId !== user.id) {
          const owner = await prisma.user.findUnique({
            where: { id: accountRow.ownerUserId },
            select: { id: true, clerkId: true },
          })
          if (owner?.clerkId.startsWith('ghlowner:')) {
            await prisma.ghlSettings.updateMany({ where: { userId: owner.id }, data: { userId: user.id } })
            await prisma.settings.updateMany({ where: { userId: owner.id }, data: { userId: user.id } })
            await prisma.account.update({ where: { id: accountId }, data: { ownerUserId: user.id } })
            await prisma.user.delete({ where: { id: owner.id } }).catch(() => {})
            logger.info({ accountId, userId: user.id }, '[embed] promoted first SSO user to account owner')
          }
        }
        await prisma.ghlSettings.updateMany({
          where: { userId: user.id, ghlUserId: null },
          data: { ghlUserId: ctx.userId },
        })
      } catch (err) {
        // Best-effort — a promotion hiccup must never block the session.
        logger.warn({ err, accountId }, '[embed] owner promotion skipped')
      }
      const account = accountRow

      const token = signEmbedToken({ sub: user.clerkId, accountId })
      return reply.send({
        token,
        tokenType: 'emb',
        expiresInSeconds: 15 * 60,
        user: { id: user.id, email: user.email, name: user.name },
        accountId,
        accountStatus: account?.status ?? 'active',
        onboardingCompleted: !!account?.onboardingCompletedAt,
      })
    },
  )
}
