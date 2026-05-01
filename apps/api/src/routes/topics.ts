import type { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middleware/auth'
import { getBoss, QUEUES } from '../queues/index'
import { logger } from '../lib/logger'

interface CreateTopicBody {
  topic: string
  scheduledDate?: string
  mode?: 'social_only' | 'article_first' | 'article_only'
  excludedKeywords?: string[]
  defaultOutputTargets?: string[]
  wordPressConnectionId?: string
  slug?: string
  category?: string
}

export async function topicRoutes(app: FastifyInstance) {
  app.post<{ Body: CreateTopicBody }>('/topics', async (request, reply) => {
    const clerkId = await requireAuth(request, reply)
    if (!clerkId) return

    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
    if (!user) {
      return reply.status(404).send({ error: 'User not found' })
    }

    const {
      topic,
      scheduledDate,
      mode = 'social_only',
      excludedKeywords = [],
      defaultOutputTargets = [],
      wordPressConnectionId,
      slug,
      category,
    } = request.body

    if (!topic?.trim()) {
      return reply.status(400).send({ error: 'topic is required' })
    }

    const topicRow = await prisma.topic.create({
      data: {
        userId: user.id,
        topic: topic.trim(),
        scheduledDate: scheduledDate ? new Date(scheduledDate) : new Date(),
        mode,
        excludedKeywords,
        defaultOutputTargets,
        wordPressConnectionId: wordPressConnectionId ?? null,
        slug: slug ?? null,
        category: category ?? null,
      },
    })

    if (mode === 'social_only') {
      logger.info({ topicId: topicRow.id, mode }, '[topics] social_only — no article job created')
      return reply.status(201).send({ topicId: topicRow.id, mode })
    }

    const job = await prisma.articleJob.create({
      data: { topicId: topicRow.id, userId: user.id, status: 'pending' },
    })

    const boss = await getBoss()
    await boss.send(QUEUES.ARTICLE_PIPELINE, { jobId: job.id })

    logger.info({ topicId: topicRow.id, jobId: job.id, mode }, '[topics] article job enqueued')
    return reply.status(202).send({ topicId: topicRow.id, jobId: job.id, mode })
  })

  app.get('/topics', async (request, reply) => {
    const clerkId = await requireAuth(request, reply)
    if (!clerkId) return

    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
    if (!user) return reply.status(404).send({ error: 'User not found' })

    const topics = await prisma.topic.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        articleJobs: {
          select: { id: true, status: true, currentStep: true, totalCost: true },
        },
      },
    })

    return reply.send(topics)
  })
}
