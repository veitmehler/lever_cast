import { parse as parseCsv } from 'csv-parse/sync'
import type { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middleware/auth'
import { getBoss, QUEUES } from '../queues/index'
import { logger } from '../lib/logger'

// Accepted CSV header variations → normalised field name
const CSV_ALIASES: Record<string, string> = {
  topic: 'topic',
  idea: 'topic',
  title: 'topic',
  'scheduled date': 'scheduledDate',
  scheduleddate: 'scheduledDate',
  scheduled_date: 'scheduledDate',
  'publishing date': 'publishingDate',
  publishingdate: 'publishingDate',
  publishing_date: 'publishingDate',
  slug: 'slug',
  category: 'category',
  mode: 'mode',
  'output targets': 'defaultOutputTargets',
  outputtargets: 'defaultOutputTargets',
  'wordpress connection': 'wordPressConnectionId',
  wordpressconnection: 'wordPressConnectionId',
  wordpressconnectionid: 'wordPressConnectionId',
  'excluded keywords': 'excludedKeywords',
  excludedkeywords: 'excludedKeywords',
}

function normaliseCsvRow(raw: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(raw)) {
    const norm = CSV_ALIASES[k.toLowerCase().trim()]
    if (norm) out[norm] = v?.trim() ?? ''
  }
  return out
}

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

  // ── POST /api/topics/csv — bulk import via CSV ────────────────────────────
  app.post('/topics/csv', async (request, reply) => {
    const clerkId = await requireAuth(request, reply)
    if (!clerkId) return

    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
    if (!user) return reply.status(404).send({ error: 'User not found' })

    let csvText: string
    try {
      const data = await request.file()
      if (!data) return reply.status(400).send({ error: 'No file uploaded' })
      const buf = await data.toBuffer()
      csvText = buf.toString('utf-8')
    } catch {
      return reply.status(400).send({ error: 'Could not read uploaded file' })
    }

    let rows: Record<string, string>[]
    try {
      const rawRows = parseCsv(csvText, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
      }) as Record<string, string>[]
      rows = rawRows.map(normaliseCsvRow)
    } catch (err) {
      return reply.status(400).send({ error: `CSV parse error: ${err instanceof Error ? err.message : String(err)}` })
    }

    const results: Array<{ row: number; topicId?: string; jobId?: string; mode?: string; error?: string }> = []
    const boss = await getBoss()

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const topicText = row.topic?.trim()
      if (!topicText) { results.push({ row: i + 1, error: 'Missing topic' }); continue }

      const mode = (['social_only', 'article_first', 'article_only'].includes(row.mode ?? '')
        ? row.mode
        : 'social_only') as 'social_only' | 'article_first' | 'article_only'

      const excludedKeywords = row.excludedKeywords
        ? row.excludedKeywords.split(/[,;]/).map((k) => k.trim()).filter(Boolean)
        : []

      const defaultOutputTargets = row.defaultOutputTargets
        ? row.defaultOutputTargets.split(/[,;]/).map((t) => t.trim()).filter(Boolean)
        : []

      try {
        const topicRow = await prisma.topic.create({
          data: {
            userId: user.id,
            topic: topicText,
            scheduledDate: row.scheduledDate ? new Date(row.scheduledDate) : new Date(),
            mode,
            slug: row.slug || null,
            category: row.category || null,
            excludedKeywords,
            defaultOutputTargets,
            wordPressConnectionId: row.wordPressConnectionId || null,
          },
        })

        if (mode === 'social_only') {
          results.push({ row: i + 1, topicId: topicRow.id, mode })
          continue
        }

        const job = await prisma.articleJob.create({
          data: { topicId: topicRow.id, userId: user.id, status: 'pending' },
        })
        await boss.send(QUEUES.ARTICLE_PIPELINE, { jobId: job.id })
        results.push({ row: i + 1, topicId: topicRow.id, jobId: job.id, mode })
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        logger.warn({ row: i + 1, topicText, err }, '[topics/csv] row failed')
        results.push({ row: i + 1, error: msg })
      }
    }

    const succeeded = results.filter((r) => !r.error).length
    const failed = results.filter((r) => r.error).length

    logger.info({ userId: user.id, total: rows.length, succeeded, failed }, '[topics/csv] import complete')
    return reply.status(207).send({ total: rows.length, succeeded, failed, results })
  })

  // ── GET /api/topics ───────────────────────────────────────────────────────
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
