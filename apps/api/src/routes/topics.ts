import { parse as parseCsv } from 'csv-parse/sync'
import type { FastifyInstance } from 'fastify'
import { prisma } from '@socioply/shared'
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
  'outline framework': 'outlineFrameworkNumber',
  outlineframework: 'outlineFrameworkNumber',
  outline_framework: 'outlineFrameworkNumber',
  'outline framework number': 'outlineFrameworkNumber',
  'special instructions': 'outlineSpecialInstructions',
  specialinstructions: 'outlineSpecialInstructions',
  outline_special_instructions: 'outlineSpecialInstructions',
  'real case studies': 'realCaseStudies',
  realcasestudies: 'realCaseStudies',
  real_case_studies: 'realCaseStudies',
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
  publishingDate?: string
  mode?: 'social_only' | 'article_first' | 'article_only'
  excludedKeywords?: string[]
  defaultOutputTargets?: string[]
  wordPressConnectionId?: string
  slug?: string
  category?: string
  // Article Pipeline V2
  outlineFrameworkNumber?: number | null
  outlineSpecialInstructions?: string | null
  realCaseStudies?: string | null
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
      publishingDate,
      mode = 'social_only',
      excludedKeywords = [],
      defaultOutputTargets = [],
      wordPressConnectionId,
      slug,
      category,
      outlineFrameworkNumber,
      outlineSpecialInstructions,
      realCaseStudies,
    } = request.body

    if (!topic?.trim()) {
      return reply.status(400).send({ error: 'topic is required' })
    }

    const topicRow = await prisma.topic.create({
      data: {
        userId: user.id,
        topic: topic.trim(),
        scheduledDate: scheduledDate ? new Date(scheduledDate) : new Date(),
        publishingDate: publishingDate ? new Date(publishingDate) : new Date(),
        mode,
        excludedKeywords,
        defaultOutputTargets,
        wordPressConnectionId: wordPressConnectionId ?? null,
        slug: slug ?? null,
        category: category ?? null,
        outlineFrameworkNumber: outlineFrameworkNumber ?? null,
        outlineFrameworkSource: outlineFrameworkNumber != null ? 'user' : null,
        outlineSpecialInstructions: outlineSpecialInstructions ?? null,
        realCaseStudies: realCaseStudies ?? null,
      },
    })

    if (mode === 'social_only') {
      logger.info({ topicId: topicRow.id, mode }, '[topics] social_only — no article job created')
      return reply.status(201).send({ topicId: topicRow.id, mode })
    }

    // NOTE: Outline auto-assignment is deferred to the worker (executor.ts)
    // so the HTTP response returns immediately instead of blocking on an LLM call.

    const job = await prisma.articleJob.create({
      data: { topicId: topicRow.id, userId: user.id, status: 'pending' },
    })

    const boss = await getBoss()
    await boss.send(QUEUES.ARTICLE_PIPELINE, { jobId: job.id }, {
      expireInSeconds: 3600,
      singletonKey: job.id,
    })

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
        const csvOutlineNumber = row.outlineFrameworkNumber
          ? parseInt(row.outlineFrameworkNumber, 10)
          : null
        const hasExplicitFramework = csvOutlineNumber != null && !isNaN(csvOutlineNumber)

        // A row without a date is captured as an unscheduled idea (no job).
        const hasDate = !!row.scheduledDate
        const topicRow = await prisma.topic.create({
          data: {
            userId: user.id,
            topic: topicText,
            scheduledDate: hasDate ? new Date(row.scheduledDate) : null,
            status: hasDate ? 'pending' : 'idea',
            source: 'csv',
            mode,
            slug: row.slug || null,
            category: row.category || null,
            excludedKeywords,
            defaultOutputTargets,
            wordPressConnectionId: row.wordPressConnectionId || null,
            outlineFrameworkNumber: hasExplicitFramework ? csvOutlineNumber : null,
            outlineFrameworkSource: hasExplicitFramework ? 'csv' : null,
            outlineSpecialInstructions: row.outlineSpecialInstructions || null,
            realCaseStudies: row.realCaseStudies || null,
          },
        })

        if (!hasDate || mode === 'social_only') {
          results.push({ row: i + 1, topicId: topicRow.id, mode })
          continue
        }

        // Outline auto-assignment is deferred to the worker (executor.ts)

        const job = await prisma.articleJob.create({
          data: { topicId: topicRow.id, userId: user.id, status: 'pending' },
        })
        await boss.send(QUEUES.ARTICLE_PIPELINE, { jobId: job.id }, {
          expireInSeconds: 3600,
          singletonKey: job.id,
        })
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

  // POST /api/topics/plan — schedule a planned article topic WITHOUT generating
  // (generation happens later, manually or via bulk). Used by the content plan to
  // place a new topic or adopt an admin article-calendar suggestion onto a date.
  app.post<{ Body: { topic?: string; scheduledDate?: string; source?: string } }>(
    '/topics/plan',
    async (request, reply) => {
      const clerkId = await requireAuth(request, reply)
      if (!clerkId) return
      const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
      if (!user) return reply.status(404).send({ error: 'User not found' })

      const topic = request.body?.topic?.trim()
      const scheduledDate = request.body?.scheduledDate
      if (!topic) return reply.status(400).send({ error: 'topic is required' })
      if (!scheduledDate) return reply.status(400).send({ error: 'scheduledDate is required' })

      const planned = await prisma.topic.create({
        data: {
          userId: user.id,
          topic,
          scheduledDate: new Date(scheduledDate),
          status: 'pending',
          source: request.body?.source === 'article_calendar' ? 'article_calendar' : 'manual',
          mode: 'article_first',
        },
      })
      return reply.status(201).send({ topic: planned })
    },
  )

  // ── Idea bank ─────────────────────────────────────────────────────────────

  // POST /api/topics/idea — capture an unscheduled article idea (no job). Stores
  // the full article config so it carries through when the idea is later
  // scheduled + generated from the content plan.
  app.post<{
    Body: {
      topic?: string
      notes?: string | null
      mode?: 'social_only' | 'article_first' | 'article_only'
      publishingDate?: string | null
      outlineFrameworkNumber?: number | null
      outlineSpecialInstructions?: string | null
      realCaseStudies?: string | null
      excludedKeywords?: string[]
      defaultOutputTargets?: string[]
      wordPressConnectionId?: string | null
      category?: string | null
    }
  }>('/topics/idea', async (request, reply) => {
    const clerkId = await requireAuth(request, reply)
    if (!clerkId) return
    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
    if (!user) return reply.status(404).send({ error: 'User not found' })

    const b = request.body ?? {}
    const topic = b.topic?.trim()
    if (!topic) return reply.status(400).send({ error: 'topic is required' })

    const mode = ['social_only', 'article_first', 'article_only'].includes(b.mode ?? '')
      ? b.mode!
      : 'article_first'

    const idea = await prisma.topic.create({
      data: {
        userId: user.id,
        topic,
        notes: b.notes?.trim() || null,
        scheduledDate: null,
        status: 'idea',
        source: 'idea',
        mode,
        publishingDate: b.publishingDate ? new Date(b.publishingDate) : null,
        outlineFrameworkNumber: b.outlineFrameworkNumber ?? null,
        outlineFrameworkSource: b.outlineFrameworkNumber != null ? 'user' : null,
        outlineSpecialInstructions: b.outlineSpecialInstructions?.trim() || null,
        realCaseStudies: b.realCaseStudies?.trim() || null,
        excludedKeywords: b.excludedKeywords ?? [],
        defaultOutputTargets: b.defaultOutputTargets ?? [],
        wordPressConnectionId: b.wordPressConnectionId ?? null,
        category: b.category?.trim() || null,
      },
    })
    return reply.status(201).send({ idea })
  })

  // GET /api/topics/ideas — unscheduled ideas for the account
  app.get('/topics/ideas', async (request, reply) => {
    const clerkId = await requireAuth(request, reply)
    if (!clerkId) return
    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
    if (!user) return reply.status(404).send({ error: 'User not found' })

    const ideas = await prisma.topic.findMany({
      where: { userId: user.id, status: 'idea' }, // extension scopes to account members
      orderBy: { createdAt: 'desc' },
      select: { id: true, topic: true, notes: true, source: true, createdAt: true },
    })
    return reply.send({ ideas })
  })

  // PATCH /api/topics/:id — edit text/notes and (un)schedule. Scheduling an idea
  // makes it the primary article topic for that date (status → pending).
  app.patch<{ Params: { id: string }; Body: { topic?: string; notes?: string | null; scheduledDate?: string | null } }>(
    '/topics/:id',
    async (request, reply) => {
      const clerkId = await requireAuth(request, reply)
      if (!clerkId) return
      const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
      if (!user) return reply.status(404).send({ error: 'User not found' })

      // Ownership guard: findFirst is account-scoped by the prisma extension.
      const owned = await prisma.topic.findFirst({ where: { id: request.params.id, userId: user.id } })
      if (!owned) return reply.status(404).send({ error: 'Topic not found' })

      const body = request.body ?? {}
      const data: Record<string, unknown> = {}
      if (body.topic !== undefined) {
        if (!body.topic.trim()) return reply.status(400).send({ error: 'topic cannot be empty' })
        data.topic = body.topic.trim()
      }
      if (body.notes !== undefined) data.notes = body.notes?.trim() || null
      if (body.scheduledDate !== undefined) {
        if (body.scheduledDate) {
          data.scheduledDate = new Date(body.scheduledDate)
          if (owned.status === 'idea') data.status = 'pending'
        } else {
          data.scheduledDate = null
          data.status = 'idea'
        }
      }

      const topic = await prisma.topic.update({ where: { id: request.params.id }, data })
      return reply.send({ topic })
    },
  )

  // DELETE /api/topics/:id — delete an idea/topic (account-ownership guarded)
  app.delete<{ Params: { id: string } }>('/topics/:id', async (request, reply) => {
    const clerkId = await requireAuth(request, reply)
    if (!clerkId) return
    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
    if (!user) return reply.status(404).send({ error: 'User not found' })

    const owned = await prisma.topic.findFirst({ where: { id: request.params.id, userId: user.id } })
    if (!owned) return reply.status(404).send({ error: 'Topic not found' })

    await prisma.topic.delete({ where: { id: request.params.id } })
    return reply.send({ ok: true })
  })

  // ── GET /api/outline-frameworks — public list for dashboard dropdown ───────
  app.get('/outline-frameworks', async (request, reply) => {
    const clerkId = await requireAuth(request, reply)
    if (!clerkId) return

    const frameworks = await prisma.outlineFramework.findMany({
      where: { isActive: true },
      orderBy: { number: 'asc' },
      select: { number: true, label: true, description: true },
    })

    return reply.send({ frameworks })
  })
}
