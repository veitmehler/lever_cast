import type { FastifyInstance } from 'fastify'
import { prisma } from '@socioply/shared'
import { requireAdmin } from '../../middleware/admin'
import { logger } from '../../lib/logger'
import { parseArticleCalendarCsv, commitArticleCalendarTopics } from '../../article-pipeline/calendar-csv'
import { reresolveArticleForSpecialization } from '../../newsletter/calendar-routing'

interface CreateCalendarBody {
  name?: string
  industry?: string
  specializationKey?: string | null
  hemisphere?: string | null // 'north' | 'south'
}

interface UpdateCalendarBody {
  name?: string
  industry?: string
  specializationKey?: string | null
  hemisphere?: string | null
}

/**
 * Admin article content-calendar routes (mounted under /api/admin).
 * Mirrors the newsletter calendar admin surface: calendar CRUD + CSV upload
 * (dry-run + commit). Accounts are auto-routed (no manual assignment).
 */
export async function articleCalendarsAdminRoutes(app: FastifyInstance) {
  // GET /article-calendars — list with counts
  app.get('/article-calendars', async (request, reply) => {
    const admin = await requireAdmin(request, reply)
    if (!admin) return
    const calendars = await prisma.articleCalendar.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { topics: true, accounts: true } } },
    })
    return reply.send({ calendars })
  })

  // POST /article-calendars — create
  app.post<{ Body: CreateCalendarBody }>('/article-calendars', async (request, reply) => {
    const admin = await requireAdmin(request, reply)
    if (!admin) return

    const { name, industry, specializationKey, hemisphere } = request.body ?? {}
    if (!name?.trim()) return reply.status(400).send({ error: 'name is required' })
    if (!industry?.trim()) return reply.status(400).send({ error: 'industry is required' })
    if (hemisphere && hemisphere !== 'north' && hemisphere !== 'south')
      return reply.status(400).send({ error: "hemisphere must be 'north' or 'south'" })

    const calendar = await prisma.articleCalendar.create({
      data: {
        name: name.trim(),
        industry: industry.trim(),
        specializationKey: specializationKey?.trim() || null,
        hemisphere: hemisphere ?? null,
      },
    })
    if (calendar.specializationKey) await reresolveArticleForSpecialization(calendar.specializationKey)
    return reply.status(201).send({ calendar })
  })

  // GET /article-calendars/:id — detail with topics
  app.get<{ Params: { id: string } }>('/article-calendars/:id', async (request, reply) => {
    const admin = await requireAdmin(request, reply)
    if (!admin) return
    const calendar = await prisma.articleCalendar.findUnique({
      where: { id: request.params.id },
      include: {
        topics: { orderBy: { date: 'asc' } },
        _count: { select: { accounts: true } },
      },
    })
    if (!calendar) return reply.status(404).send({ error: 'Calendar not found' })
    return reply.send({ calendar })
  })

  // PATCH /article-calendars/:id — edit
  app.patch<{ Params: { id: string }; Body: UpdateCalendarBody }>(
    '/article-calendars/:id',
    async (request, reply) => {
      const admin = await requireAdmin(request, reply)
      if (!admin) return

      const existing = await prisma.articleCalendar.findUnique({ where: { id: request.params.id } })
      if (!existing) return reply.status(404).send({ error: 'Calendar not found' })

      const { name, industry, specializationKey, hemisphere } = request.body ?? {}
      const calendar = await prisma.articleCalendar.update({
        where: { id: request.params.id },
        data: {
          ...(name !== undefined ? { name: name.trim() } : {}),
          ...(industry !== undefined ? { industry: industry.trim() } : {}),
          ...(specializationKey !== undefined ? { specializationKey: specializationKey?.trim() || null } : {}),
          ...(hemisphere !== undefined ? { hemisphere: hemisphere || null } : {}),
        },
      })
      return reply.send({ calendar })
    },
  )

  // DELETE /article-calendars/:id — delete (cascades topics; unassigns accounts)
  app.delete<{ Params: { id: string } }>('/article-calendars/:id', async (request, reply) => {
    const admin = await requireAdmin(request, reply)
    if (!admin) return
    const existing = await prisma.articleCalendar.findUnique({ where: { id: request.params.id } })
    if (!existing) return reply.status(404).send({ error: 'Calendar not found' })
    await prisma.articleCalendar.delete({ where: { id: request.params.id } })
    return reply.send({ ok: true })
  })

  // POST /article-calendars/:id/csv?commit=true — dry-run preview + commit
  app.post<{ Params: { id: string }; Querystring: { commit?: string } }>(
    '/article-calendars/:id/csv',
    async (request, reply) => {
      const admin = await requireAdmin(request, reply)
      if (!admin) return

      const calendar = await prisma.articleCalendar.findUnique({ where: { id: request.params.id } })
      if (!calendar) return reply.status(404).send({ error: 'Calendar not found' })

      let csvText: string
      try {
        const data = await request.file()
        if (!data) return reply.status(400).send({ error: 'No file uploaded' })
        const buf = await data.toBuffer()
        csvText = buf.toString('utf-8')
      } catch {
        return reply.status(400).send({ error: 'Could not read uploaded file' })
      }

      const { rows, errors, headerError } = parseArticleCalendarCsv(csvText)
      if (headerError) return reply.status(400).send({ error: headerError })

      const commit = request.query.commit === 'true' || request.query.commit === '1'

      const preview = rows.map((r) => ({
        rowNumber: r.rowNumber,
        date: r.date.toISOString().slice(0, 10),
        topic: r.topic,
        angle: r.angle,
        keywords: r.keywords,
        outlineFrameworkNumber: r.outlineFrameworkNumber,
        category: r.category,
      }))

      if (!commit) {
        return reply.send({ dryRun: true, validRows: rows.length, errorCount: errors.length, errors, preview })
      }

      if (errors.length > 0) {
        return reply.status(400).send({
          error: 'CSV has row errors — fix them and re-upload.',
          validRows: rows.length,
          errorCount: errors.length,
          errors,
        })
      }

      const { upserted } = await commitArticleCalendarTopics(calendar.id, rows)
      logger.info({ calendarId: calendar.id, upserted }, '[article-calendar/csv] topics committed')
      return reply.send({ dryRun: false, upserted, errors: [] })
    },
  )
}
