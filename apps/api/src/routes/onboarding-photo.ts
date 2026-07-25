/**
 * Onboarding spokesperson-photo upload (walkthrough feedback 2026-07-25).
 *
 * The photo step populates brandSettings.socialLogoUrl — the circular avatar
 * on quote cards (Settings → Social posts → "Profile photo"). Upload here,
 * get a CDN URL back, submit it with the step answer.
 */
import type { FastifyInstance } from 'fastify'
import { uploadBufferWithKey, resolveAccountForClerkId } from '@omniply/shared'
import { requireAuth } from '../middleware/auth'
import { logger } from '../lib/logger'

const MAX_PHOTO_BYTES = 10 * 1024 * 1024
const ALLOWED = new Set(['image/png', 'image/jpeg', 'image/webp'])

export async function onboardingPhotoRoutes(app: FastifyInstance) {
  app.post('/onboarding/photo', async (request, reply) => {
    const clerkId = await requireAuth(request, reply)
    if (!clerkId) return
    const account = await resolveAccountForClerkId(clerkId)
    if (!account) return reply.status(404).send({ error: 'No account' })

    const file = await request.file()
    if (!file) return reply.status(400).send({ error: 'photo file required' })
    const buf = await file.toBuffer()
    if (buf.length === 0 || buf.length > MAX_PHOTO_BYTES) {
      return reply.status(400).send({ error: 'Photo missing or larger than 10MB' })
    }
    const mimeType = file.mimetype || 'image/jpeg'
    if (!ALLOWED.has(mimeType)) {
      return reply.status(400).send({ error: 'Use a PNG, JPEG or WebP image' })
    }
    const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg'
    const key = `onboarding/${account.accountId}/spokes-photo-${Date.now()}.${ext}`
    try {
      const { url } = await uploadBufferWithKey(key, buf, mimeType)
      return reply.send({ url })
    } catch (err) {
      logger.error({ err, key }, '[onboarding-photo] upload failed')
      return reply.status(502).send({ error: 'Upload failed — try again or paste an image URL' })
    }
  })
}
