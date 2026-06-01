import type { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middleware/auth'
import {
  generateCarouselAssets,
  generatePitchStoryAssets,
  generateQuoteCardAsset,
} from '../social/generate-assets'
import { maxSlidesForPlatforms } from '../social/platform-limits'

async function resolveUser(clerkId: string) {
  return prisma.user.findUnique({ where: { clerkId } })
}

export async function socialRoutes(app: FastifyInstance) {
  // POST /api/social/generate/quote
  app.post('/social/generate/quote', { config: { rateLimit: { max: 10, timeWindow: '1 minute', keyGenerator: (req: { clerkId?: string; ip: string }) => req.clerkId ?? req.ip } } }, async (request, reply) => {
    const clerkId = await requireAuth(request, reply)
    if (!clerkId) return

    const user = await resolveUser(clerkId)
    if (!user) return reply.status(404).send({ error: 'User not found' })

    const body = request.body as {
      content?: string
      variant?: 'feed' | 'story'
      quoteText?: string
      attribution?: string
      jobId?: string
    }

    if (!body.content?.trim() && !body.quoteText?.trim()) {
      return reply.status(400).send({ error: 'Missing required field: content or quoteText' })
    }

    try {
      const result = await generateQuoteCardAsset({
        userId: user.id,
        content: body.content?.trim() ?? body.quoteText!.trim(),
        variant: body.variant ?? 'feed',
        quoteText: body.quoteText,
        attribution: body.attribution,
        jobId: body.jobId,
      })
      return reply.send({ success: true, ...result })
    } catch (err) {
      request.log.error({ err }, 'Error in /social/generate/quote')
      return reply.status(500).send({
        error: 'Failed to generate quote card',
        details: err instanceof Error ? err.message : String(err),
      })
    }
  })

  // POST /api/social/generate/carousel
  app.post('/social/generate/carousel', { config: { rateLimit: { max: 5, timeWindow: '1 minute', keyGenerator: (req: { clerkId?: string; ip: string }) => req.clerkId ?? req.ip } } }, async (request, reply) => {
    const clerkId = await requireAuth(request, reply)
    if (!clerkId) return

    const user = await resolveUser(clerkId)
    if (!user) return reply.status(404).send({ error: 'User not found' })

    const body = request.body as {
      content?: string
      platforms?: string[]
      slideCount?: number
      jobId?: string
    }

    if (!body.content?.trim()) {
      return reply.status(400).send({ error: 'Missing required field: content' })
    }

    const platforms = body.platforms ?? []
    const maxSlides = maxSlidesForPlatforms(platforms)
    const slideCount = body.slideCount
      ? Math.min(Math.max(2, body.slideCount), maxSlides)
      : maxSlides

    try {
      const result = await generateCarouselAssets({
        userId: user.id,
        content: body.content.trim(),
        platforms,
        slideCount,
        jobId: body.jobId,
      })
      return reply.send({
        success: true,
        ...result,
        slideCount: result.slides.length,
        platformLimit: maxSlides,
      })
    } catch (err) {
      request.log.error({ err }, 'Error in /social/generate/carousel')
      return reply.status(500).send({
        error: 'Failed to generate carousel',
        details: err instanceof Error ? err.message : String(err),
      })
    }
  })

  // POST /api/social/generate/pitch
  app.post('/social/generate/pitch', { config: { rateLimit: { max: 10, timeWindow: '1 minute', keyGenerator: (req: { clerkId?: string; ip: string }) => req.clerkId ?? req.ip } } }, async (request, reply) => {
    const clerkId = await requireAuth(request, reply)
    if (!clerkId) return

    const user = await resolveUser(clerkId)
    if (!user) return reply.status(404).send({ error: 'User not found' })

    const body = request.body as {
      title?: string
      pitchType?: 'carousel' | 'hook'
      jobId?: string
    }

    if (!body.title?.trim()) {
      return reply.status(400).send({ error: 'Missing required field: title' })
    }
    if (!body.pitchType || !['carousel', 'hook'].includes(body.pitchType)) {
      return reply.status(400).send({ error: 'pitchType must be "carousel" or "hook"' })
    }

    try {
      const result = await generatePitchStoryAssets({
        userId: user.id,
        title: body.title.trim(),
        pitchType: body.pitchType,
        jobId: body.jobId,
      })
      return reply.send({ success: true, ...result })
    } catch (err) {
      request.log.error({ err }, 'Error in /social/generate/pitch')
      return reply.status(500).send({
        error: 'Failed to generate pitch story',
        details: err instanceof Error ? err.message : String(err),
      })
    }
  })
}
