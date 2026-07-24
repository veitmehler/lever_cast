import type { FastifyInstance } from 'fastify'
import type { Prisma } from '@prisma/client'
import { requireAdmin } from '../../middleware/admin'
import { prisma } from '@omniply/shared'

function parseAssetsSummary(assetsJson: unknown): string {
  if (!assetsJson || typeof assetsJson !== 'object') return '—'
  const o = assetsJson as Record<string, unknown>
  const postType = String(o.postType ?? '')
  if (typeof o.videoUrl === 'string' && o.videoUrl) return `video (${postType})`
  if (Array.isArray(o.mediaUrls) && o.mediaUrls.length > 1) return `carousel (${postType})`
  if (o.imageUrl || (Array.isArray(o.mediaUrls) && o.mediaUrls.length > 0)) {
    return `image (${postType})`
  }
  return postType || '—'
}

export async function socialAutomationAdminRoutes(app: FastifyInstance) {
  app.get<{
    Querystring: { page?: string; limit?: string; status?: string; userId?: string; email?: string }
  }>('/social-automation', async (request, reply) => {
    const admin = await requireAdmin(request, reply)
    if (!admin) return

    const page = Math.max(1, parseInt(request.query.page ?? '1', 10))
    const pageSize = Math.min(100, Math.max(1, parseInt(request.query.limit ?? '25', 10)))
    const skip = (page - 1) * pageSize

    const where: Prisma.SocialAutomationRunWhereInput = {}
    if (request.query.status) where.status = request.query.status
    if (request.query.userId) where.userId = request.query.userId
    if (request.query.email?.trim()) {
      where.user = { email: { contains: request.query.email.trim(), mode: 'insensitive' } }
    }

    const [runs, total] = await Promise.all([
      prisma.socialAutomationRun.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          user: { select: { email: true, name: true } },
          job: { include: { topic: { select: { topic: true } } } },
          specResults: {
            orderBy: { slotKey: 'asc' },
            select: {
              slotKey: true,
              status: true,
              postsCreated: true,
              error: true,
            },
          },
        },
      }),
      prisma.socialAutomationRun.count({ where }),
    ])

    return reply.send({
      runs: runs.map((run) => ({
        id: run.id,
        userId: run.userId,
        userEmail: run.user.email,
        userName: run.user.name,
        jobId: run.jobId,
        articleTitle: run.job?.topic?.topic ?? null,
        scheduledDate: run.scheduledDate,
        status: run.status,
        totalSpecs: run.totalSpecs,
        completedSpecs: run.completedSpecs,
        failedSpecs: run.failedSpecs,
        currentSpec: run.currentSpec,
        error: run.error,
        createdAt: run.createdAt,
        updatedAt: run.updatedAt,
        specResults: run.specResults,
      })),
      total,
      page,
      pageSize,
    })
  })

  app.get<{ Params: { runId: string } }>('/social-automation/:runId', async (request, reply) => {
    const admin = await requireAdmin(request, reply)
    if (!admin) return

    const run = await prisma.socialAutomationRun.findUnique({
      where: { id: request.params.runId },
      include: {
        user: { select: { id: true, email: true, name: true } },
        job: { include: { topic: { select: { topic: true, mode: true } } } },
        sitePage: { select: { id: true, title: true, slug: true, primaryKeyword: true } },
        specResults: { orderBy: { slotKey: 'asc' } },
        posts: {
          orderBy: [{ slotKey: 'asc' }, { platform: 'asc' }],
          select: {
            id: true,
            platform: true,
            status: true,
            postUrl: true,
            slotKey: true,
            scheduledAt: true,
            publishedAt: true,
            postType: true,
            provider: true,
            ghlPostId: true,
            errorMsg: true,
          },
        },
      },
    })

    if (!run) return reply.status(404).send({ error: 'Not found' })

    return reply.send({
      id: run.id,
      userId: run.userId,
      user: run.user,
      jobId: run.jobId,
      articleTitle: run.job?.topic?.topic ?? run.sitePage?.title ?? null,
      articleMode: run.job?.topic?.mode ?? null,
      sitePage: run.sitePage,
      scheduledDate: run.scheduledDate,
      status: run.status,
      totalSpecs: run.totalSpecs,
      completedSpecs: run.completedSpecs,
      failedSpecs: run.failedSpecs,
      currentSpec: run.currentSpec,
      error: run.error,
      createdAt: run.createdAt,
      updatedAt: run.updatedAt,
      specResults: run.specResults.map((sr) => ({
        slotKey: sr.slotKey,
        status: sr.status,
        postsCreated: sr.postsCreated,
        error: sr.error,
        assetsSummary: parseAssetsSummary(sr.assetsJson),
        assetsJson: sr.assetsJson,
        updatedAt: sr.updatedAt,
      })),
      posts: run.posts,
    })
  })
}
