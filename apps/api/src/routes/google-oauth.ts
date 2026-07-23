/**
 * Google OAuth for per-clinic review access (google-reviews plan Tier 1).
 *
 * DORMANT until GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET /
 * GOOGLE_OAUTH_REDIRECT_URI are set (our OAuth app verification + Google's
 * Business Profile API access application are LONG-LEAD external items). The
 * onboarding step auto-degrades while unset; these routes 503.
 *
 * Flow: popup → /start?account=… (state row, CSRF-safe) → Google consent
 * (business.manage, offline access) → /callback → encrypted refresh token in
 * the apiKey table (provider 'google_business', owner user) → backfill job.
 */
import type { FastifyInstance } from 'fastify'
import { randomBytes } from 'node:crypto'
import { prisma, encrypt } from '@socioply/shared'
import { getBoss, QUEUES } from '../queues/index'
import { logger } from '../lib/logger'

const SCOPE = 'https://www.googleapis.com/auth/business.manage'

function configured(): boolean {
  return Boolean(
    process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET && process.env.GOOGLE_OAUTH_REDIRECT_URI,
  )
}

export async function googleOauthRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Querystring: { account?: string } }>('/google/oauth/start', async (request, reply) => {
    if (!configured()) return reply.status(503).send({ error: 'Google OAuth not configured' })
    const accountId = request.query.account
    if (!accountId) return reply.status(400).send({ error: 'account required' })
    const account = await prisma.account.findUnique({ where: { id: accountId }, select: { ownerUserId: true } })
    if (!account?.ownerUserId) return reply.status(404).send({ error: 'Unknown account' })

    const state = randomBytes(24).toString('base64url')
    await prisma.oAuthState.create({
      data: {
        state,
        clerkId: `google_business:${accountId}:${account.ownerUserId}`,
        platform: 'google_business',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    })
    const url =
      'https://accounts.google.com/o/oauth2/v2/auth' +
      `?client_id=${encodeURIComponent(process.env.GOOGLE_OAUTH_CLIENT_ID!)}` +
      `&redirect_uri=${encodeURIComponent(process.env.GOOGLE_OAUTH_REDIRECT_URI!)}` +
      `&response_type=code&scope=${encodeURIComponent(SCOPE)}` +
      '&access_type=offline&prompt=consent' +
      `&state=${state}`
    return reply.redirect(url)
  })

  app.get<{ Querystring: { code?: string; state?: string; error?: string } }>(
    '/google/oauth/callback',
    async (request, reply) => {
      if (!configured()) return reply.status(503).send({ error: 'Google OAuth not configured' })
      const { code, state, error } = request.query
      const done = (msg: string) =>
        reply
          .type('text/html')
          .send(`<!doctype html><body style="font-family:sans-serif;padding:40px;text-align:center"><p>${msg}</p><p>You can close this window.</p><script>setTimeout(()=>window.close(),2500)</script></body>`)

      if (error) return done('Google connection was cancelled.')
      if (!code || !state) return reply.status(400).send({ error: 'code/state required' })

      const row = await prisma.oAuthState.findUnique({ where: { state } })
      if (!row || row.platform !== 'google_business' || row.expiresAt < new Date()) {
        return done('This connection link expired — please try again from onboarding.')
      }
      await prisma.oAuthState.delete({ where: { state } }).catch(() => {})
      const [, accountId, userId] = row.clerkId.split(':')

      try {
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code,
            client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!,
            client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
            redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URI!,
            grant_type: 'authorization_code',
          }),
        })
        const tokens = (await tokenRes.json()) as { refresh_token?: string; access_token?: string }
        if (!tokens.refresh_token) throw new Error('no refresh_token in exchange')

        const existing = await prisma.apiKey.findFirst({ where: { userId, provider: 'google_business' } })
        if (existing) {
          await prisma.apiKey.update({ where: { id: existing.id }, data: { encryptedKey: encrypt(tokens.refresh_token) } })
        } else {
          await prisma.apiKey.create({ data: { userId, provider: 'google_business', encryptedKey: encrypt(tokens.refresh_token) } })
        }
        const boss = await getBoss()
        await boss.send(
          QUEUES.GOOGLE_REVIEWS_BACKFILL,
          { accountId },
          { singletonKey: `gbp-backfill-${accountId}`, expireInSeconds: 3600 },
        )
        logger.info({ accountId }, '[google-oauth] connected; backfill enqueued')
        return done('Google connected! Your reviews are being imported.')
      } catch (err) {
        logger.error({ err, accountId }, '[google-oauth] token exchange failed')
        return done('Something went wrong connecting Google — you can retry from onboarding.')
      }
    },
  )
}
