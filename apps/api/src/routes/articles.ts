import type { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middleware/auth'
import { runPipelinePhaseA } from '../article-pipeline/executor'
import { approveArticleJob } from '../article-pipeline/approval-service'

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
          },
        },
        errorLogs: { orderBy: { createdAt: 'desc' }, take: 20 },
        llmUsage: { orderBy: { createdAt: 'desc' }, take: 50 },
      },
    })

    if (!job) return reply.status(404).send({ error: 'Article job not found' })

    return reply.send({ job })
  })

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

    const TERMINAL_STATUSES = new Set(['completed', 'approved', 'enriched', 'failed'])
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
