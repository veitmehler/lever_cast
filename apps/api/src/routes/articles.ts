import { createHash } from 'node:crypto'
import type { FastifyInstance } from 'fastify'
import type { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middleware/auth'
import { runPipelinePhaseA } from '../article-pipeline/executor'
import { approveArticleJob } from '../article-pipeline/approval-service'
import { getBoss, QUEUES } from '../queues/index'
import { VALID_TARGETS } from '../article-pipeline/output/registry'

function calculateReadingTimeFromHtml(html: string): number {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  const words = text.split(' ').filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

export async function articleRoutes(app: FastifyInstance) {
  // ── GET /api/articles — list jobs for current user ────────────────────────
  app.get('/articles', async (request, reply) => {
    const clerkId = await requireAuth(request, reply)
    if (!clerkId) return

    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) return reply.status(404).send({ error: 'User not found' })

    const { status, limit = '20', offset = '0' } = request.query as {
      status?: string
      limit?: string
      offset?: string
    }

    const jobs = await prisma.articleJob.findMany({
      where: {
        userId: user.id,
        ...(status ? { status } : {}),
      },
      include: {
        topic: { select: { topic: true, mode: true } },
        _count: { select: { pipelineSteps: true, errorLogs: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit, 10),
      skip: parseInt(offset, 10),
    })

    return reply.send({ jobs })
  })

  // ── GET /api/articles/:jobId — job detail ─────────────────────────────────
  app.get<{ Params: { jobId: string } }>('/articles/:jobId', async (request, reply) => {
    const clerkId = await requireAuth(request, reply)
    if (!clerkId) return

    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) return reply.status(404).send({ error: 'User not found' })

    const { jobId } = request.params
    const job = await prisma.articleJob.findFirst({
      where: { id: jobId, userId: user.id },
      include: {
        topic: true,
        pipelineSteps: { orderBy: { stepNumber: 'asc' } },
        sitePage: {
          include: {
            featuredImage: { select: { id: true, url: true, altText: true } },
            diagrams: {
              select: {
                id: true,
                position: true,
                sectionTitle: true,
                caption: true,
                svgS3Key: true,
                pngS3Key: true,
                pngDarkS3Key: true,
              },
              orderBy: { position: 'asc' },
            },
          },
        },
        errorLogs: { orderBy: { createdAt: 'desc' }, take: 20 },
        llmUsage: { orderBy: { createdAt: 'desc' }, take: 50 },
      },
    })

    if (!job) return reply.status(404).send({ error: 'Article job not found' })

    // Attach CDN URLs to diagrams so the frontend doesn't need to know the CDN base
    const cdnBase = (process.env.CDN_BASE ?? '').replace(/\/$/, '')
    const enrichedJob = {
      ...job,
      sitePage: job.sitePage
        ? {
            ...job.sitePage,
            diagrams: (job.sitePage.diagrams ?? []).map((d) => ({
              ...d,
              cdnUrl: d.pngS3Key ? `${cdnBase}/${d.pngS3Key}` : null,
              svgCdnUrl: d.svgS3Key ? `${cdnBase}/${d.svgS3Key}` : null,
              darkCdnUrl: d.pngDarkS3Key ? `${cdnBase}/${d.pngDarkS3Key}` : null,
            })),
          }
        : null,
    }

    return reply.send({ job: enrichedJob })
  })

  // ── PATCH /api/articles/:jobId/content — editable preview saves ────────────
  app.patch<{ Params: { jobId: string } }>(
    '/articles/:jobId/content',
    async (request, reply) => {
      const clerkId = await requireAuth(request, reply)
      if (!clerkId) return

      const user = await prisma.user.findUnique({ where: { clerkId } })
      if (!user) return reply.status(404).send({ error: 'User not found' })

      const { jobId } = request.params
      const sitePageRow = await prisma.sitePage.findFirst({
        where: { jobId, userId: user.id },
        select: { id: true },
      })
      if (!sitePageRow) return reply.status(404).send({ error: 'Article job not found' })

      const body = request.body as Record<string, unknown>
      const update: Prisma.SitePageUpdateInput = {}
      let hasField = false

      if (typeof body.bodyHtml === 'string') {
        update.bodyHtml = body.bodyHtml
        update.readingTime = calculateReadingTimeFromHtml(body.bodyHtml)
        hasField = true
      }
      if (typeof body.seoTitle === 'string') {
        const t = body.seoTitle.trim()
        update.seoTitle = t
        update.title = t
        hasField = true
      }
      if (typeof body.seoDescription === 'string') {
        update.seoDescription = body.seoDescription.trim() || null
        hasField = true
      }
      if (typeof body.excerpt === 'string') {
        update.excerpt = body.excerpt.trim() || null
        hasField = true
      }

      if (!hasField) {
        return reply.status(400).send({ error: 'No valid fields to update' })
      }

      await prisma.sitePage.update({
        where: { id: sitePageRow.id },
        data: update,
      })

      return reply.send({ ok: true })
    },
  )

  // ── GET /api/articles/:jobId/events — SSE status stream ──────────────────
  app.get<{ Params: { jobId: string } }>('/articles/:jobId/events', async (request, reply) => {
    const clerkId = await requireAuth(request, reply)
    if (!clerkId) return

    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) return reply.status(404).send({ error: 'User not found' })

    const { jobId } = request.params

    // Verify ownership before starting the stream
    const ownership = await prisma.articleJob.findFirst({
      where: { id: jobId, userId: user.id },
      select: { id: true },
    })
    if (!ownership) return reply.status(404).send({ error: 'Article job not found' })

    // Set SSE headers
    reply.raw.setHeader('Content-Type', 'text/event-stream')
    reply.raw.setHeader('Cache-Control', 'no-cache')
    reply.raw.setHeader('Connection', 'keep-alive')
    reply.raw.setHeader('X-Accel-Buffering', 'no')
    reply.raw.flushHeaders()

    // SSE keeps streaming through approval + enrichment; stops only at truly terminal states
    const TERMINAL_STATUSES = new Set(['enriched', 'failed'])
    let closed = false

    const sendEvent = (data: Record<string, unknown>) => {
      if (closed) return
      reply.raw.write(`data: ${JSON.stringify(data)}\n\n`)
    }

    const poll = async () => {
      try {
        const job = await prisma.articleJob.findUnique({
          where: { id: jobId },
          include: {
            pipelineSteps: {
              select: {
                stepNumber: true,
                stepName: true,
                status: true,
                cost: true,
                duration: true,
                completedAt: true,
              },
              orderBy: { stepNumber: 'asc' },
            },
          },
        })
        if (!job) {
          sendEvent({ type: 'error', message: 'Job not found' })
          end()
          return
        }

        sendEvent({
          type: 'update',
          status: job.status,
          currentStep: job.currentStep,
          totalCost: job.totalCost,
          totalTokens: job.totalTokens,
          steps: job.pipelineSteps,
        })

        if (TERMINAL_STATUSES.has(job.status)) {
          sendEvent({ type: 'done', status: job.status })
          end()
        }
      } catch (err) {
        sendEvent({ type: 'error', message: 'Polling failed' })
        end()
      }
    }

    const end = () => {
      if (closed) return
      closed = true
      clearInterval(intervalId)
      reply.raw.end()
    }

    // Send initial state immediately then poll every 2s
    await poll()
    const intervalId = setInterval(poll, 2000)

    request.raw.on('close', end)
    request.raw.on('error', end)

    // Fastify should not send its own response
    return reply
  })

  // ── POST /api/articles/:jobId/resume — resume a failed job ────────────────
  app.post<{ Params: { jobId: string } }>('/articles/:jobId/resume', async (request, reply) => {
    const clerkId = await requireAuth(request, reply)
    if (!clerkId) return

    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) return reply.status(404).send({ error: 'User not found' })

    const { jobId } = request.params
    const job = await prisma.articleJob.findFirst({
      where: { id: jobId, userId: user.id },
    })
    if (!job) return reply.status(404).send({ error: 'Article job not found' })

    if (!['failed', 'pending'].includes(job.status)) {
      return reply.status(400).send({ error: `Cannot resume a job with status: ${job.status}` })
    }

    // Fire-and-forget — resume runs in the background
    runPipelinePhaseA(jobId).catch((err) => {
      request.log.error({ jobId, err }, '[articles] resume failed')
    })

    return reply.send({ ok: true, message: 'Pipeline resume started' })
  })

  // ── POST /api/articles/:jobId/approve — trigger Phase B approval chain ───
  app.post<{ Params: { jobId: string } }>('/articles/:jobId/approve', async (request, reply) => {
    const clerkId = await requireAuth(request, reply)
    if (!clerkId) return

    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) return reply.status(404).send({ error: 'User not found' })

    const { jobId } = request.params
    const job = await prisma.articleJob.findFirst({
      where: { id: jobId, userId: user.id },
      select: { id: true, status: true },
    })
    if (!job) return reply.status(404).send({ error: 'Article job not found' })

    if (job.status !== 'completed') {
      return reply.status(400).send({
        error: `Cannot approve a job with status: ${job.status}. Job must be 'completed' first.`,
      })
    }

    // Fire-and-forget — approval runs in the background; client watches via SSE
    approveArticleJob(jobId).catch((err) => {
      request.log.error({ jobId, err }, '[articles] approval failed')
    })

    return reply.status(202).send({ ok: true, message: 'Approval chain started' })
  })

  // ── POST /api/articles/:jobId/re-enrich — retry enrichment from scratch ──
  app.post<{ Params: { jobId: string } }>('/articles/:jobId/re-enrich', async (request, reply) => {
    const clerkId = await requireAuth(request, reply)
    if (!clerkId) return

    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) return reply.status(404).send({ error: 'User not found' })

    const { jobId } = request.params
    const job = await prisma.articleJob.findFirst({
      where: { id: jobId, userId: user.id },
      include: { sitePage: true },
    })
    if (!job) return reply.status(404).send({ error: 'Article job not found' })

    if (!['approved', 'enriched'].includes(job.status)) {
      return reply.status(400).send({
        error: `Cannot re-enrich a job with status: ${job.status}. Job must be 'approved' or 'enriched' (not published).`,
      })
    }

    if (job.sitePage) {
      // Wipe existing diagrams + GEO rows + restore original bodyHtml.
      // The worker also does this idempotently at run-start, but clearing here
      // gives immediate UI feedback before the job is even dequeued.
      await prisma.sectionEnrichment.deleteMany({ where: { sitePageId: job.sitePage.id } })
      await prisma.articleDiagram.deleteMany({ where: { sitePageId: job.sitePage.id } })
      await prisma.sitePage.update({
        where: { id: job.sitePage.id },
        data: {
          bodyHtml: job.sitePage.originalBodyHtml,
          enrichmentStatus: 'pending',
          enrichmentError: null,
          enrichedAt: null,
          keyTakeawaysHtml: null,
          tocHtml: null,
        },
      })
    }
    // Clear enrichment errors immediately so the Errors panel is empty while
    // the new run is queued — the worker will also clear them at run start.
    await prisma.errorLog.deleteMany({ where: { jobId, errorType: { startsWith: 'enrichment_' } } })

    await prisma.articleJob.update({
      where: { id: jobId },
      data: { status: 'approved', enrichedAt: null },
    })

    const boss = await getBoss()
    const enrichmentBossId = await boss.send(QUEUES.ARTICLE_ENRICHMENT, { jobId })
    if (enrichmentBossId) {
      await prisma.articleJob.update({ where: { id: jobId }, data: { enrichmentJobId: enrichmentBossId } })
    }

    return reply.status(202).send({ ok: true, message: 'Re-enrichment enqueued' })
  })

  // ── POST /api/articles/:jobId/publish — enriched → published (irreversible) ─
  app.post<{ Params: { jobId: string } }>('/articles/:jobId/publish', async (request, reply) => {
    const clerkId = await requireAuth(request, reply)
    if (!clerkId) return

    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) return reply.status(404).send({ error: 'User not found' })

    const { jobId } = request.params
    const job = await prisma.articleJob.findFirst({
      where: { id: jobId, userId: user.id },
      select: { id: true, status: true },
    })
    if (!job) return reply.status(404).send({ error: 'Article job not found' })

    if (job.status !== 'enriched') {
      return reply.status(400).send({
        error: `Cannot publish a job with status: ${job.status}. Job must be 'enriched' first.`,
      })
    }

    await prisma.articleJob.update({
      where: { id: jobId },
      data: { status: 'published' },
    })

    return reply.send({ ok: true })
  })

  // ── POST /api/articles/:jobId/rewrite — re-run steps 7–12 only (completed) ─
  app.post<{ Params: { jobId: string } }>('/articles/:jobId/rewrite', async (request, reply) => {
    const clerkId = await requireAuth(request, reply)
    if (!clerkId) return

    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) return reply.status(404).send({ error: 'User not found' })

    const { jobId } = request.params
    const job = await prisma.articleJob.findFirst({
      where: { id: jobId, userId: user.id },
      select: { id: true, status: true },
    })
    if (!job) return reply.status(404).send({ error: 'Article job not found' })

    if (job.status !== 'completed') {
      return reply.status(400).send({
        error: `Cannot rewrite a job with status: ${job.status}. Job must be 'completed' (before approval).`,
      })
    }

    await prisma.pipelineStep.deleteMany({
      where: { jobId, stepNumber: { gte: 7, lte: 12 } },
    })

    await prisma.articleJob.update({
      where: { id: jobId },
      data: { status: 'in_progress', currentStep: 6 },
    })

    runPipelinePhaseA(jobId).catch((err) => {
      request.log.error({ jobId, err }, '[articles] rewrite failed')
    })

    return reply.send({ ok: true, message: 'Article rewrite started' })
  })

  // ── POST /api/articles/:jobId/output/:target ─────────────────────────────
  app.post<{
    Params: { jobId: string; target: string }
    Body: Record<string, unknown>
  }>('/articles/:jobId/output/:target', async (request, reply) => {
    const clerkId = await requireAuth(request, reply)
    if (!clerkId) return

    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) return reply.status(404).send({ error: 'User not found' })

    const { jobId, target } = request.params
    if (!VALID_TARGETS.includes(target)) {
      return reply.status(400).send({ error: `Invalid target. Valid: ${VALID_TARGETS.join(', ')}` })
    }

    const job = await prisma.articleJob.findFirst({
      where: { id: jobId, userId: user.id },
    })
    if (!job) return reply.status(404).send({ error: 'Article job not found' })
    if (job.status !== 'published') {
      return reply.status(400).send({
        error: `Job must be published before exporting (current: ${job.status}). Click Publish on the workflow detail page first.`,
      })
    }

    const config = request.body ?? {}
    const payloadHash = createHash('sha256')
      .update(JSON.stringify({ jobId, target, config }))
      .digest('hex')
      .slice(0, 16)

    const attempt = await prisma.outputAttempt.create({
      data: {
        jobId,
        userId: user.id,
        target,
        status: 'pending',
        payloadHash,
      },
    })

    const boss = await getBoss()
    await boss.send(QUEUES.ARTICLE_OUTPUT, {
      jobId,
      target,
      attemptId: attempt.id,
      config,
    })

    return reply.status(202).send({ outputAttemptId: attempt.id })
  })

  // ── GET /api/articles/:jobId/output/attempts ──────────────────────────────
  app.get<{ Params: { jobId: string } }>('/articles/:jobId/output/attempts', async (request, reply) => {
    const clerkId = await requireAuth(request, reply)
    if (!clerkId) return

    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) return reply.status(404).send({ error: 'User not found' })

    const { jobId } = request.params
    const job = await prisma.articleJob.findFirst({ where: { id: jobId, userId: user.id } })
    if (!job) return reply.status(404).send({ error: 'Article job not found' })

    const attempts = await prisma.outputAttempt.findMany({
      where: { jobId },
      orderBy: { startedAt: 'desc' },
    })

    return reply.send({ attempts })
  })

  // ── GET /api/articles/:jobId/output/attempts/:attemptId ──────────────────
  app.get<{
    Params: { jobId: string; attemptId: string }
  }>('/articles/:jobId/output/attempts/:attemptId', async (request, reply) => {
    const clerkId = await requireAuth(request, reply)
    if (!clerkId) return

    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) return reply.status(404).send({ error: 'User not found' })

    const { jobId, attemptId } = request.params
    const attempt = await prisma.outputAttempt.findFirst({
      where: { id: attemptId, jobId, userId: user.id },
    })
    if (!attempt) return reply.status(404).send({ error: 'Attempt not found' })

    return reply.send({ attempt })
  })

  // ── POST /api/articles/:jobId/rerun — full rerun from step 1 ─────────────
  app.post<{ Params: { jobId: string } }>('/articles/:jobId/rerun', async (request, reply) => {
    const clerkId = await requireAuth(request, reply)
    if (!clerkId) return

    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) return reply.status(404).send({ error: 'User not found' })

    const { jobId } = request.params
    const job = await prisma.articleJob.findFirst({
      where: { id: jobId, userId: user.id },
    })
    if (!job) return reply.status(404).send({ error: 'Article job not found' })

    // Wipe completed steps so the executor starts fresh
    await prisma.pipelineStep.deleteMany({ where: { jobId } })
    await prisma.articleJob.update({
      where: { id: jobId },
      data: { status: 'pending', currentStep: 0, totalCost: 0, totalTokens: 0 },
    })

    runPipelinePhaseA(jobId).catch((err) => {
      request.log.error({ jobId, err }, '[articles] rerun failed')
    })

    return reply.send({ ok: true, message: 'Pipeline rerun started' })
  })
}
