import type { FastifyInstance } from 'fastify'
import { prisma } from '@socioply/shared'
import { requireAdmin } from '../../middleware/admin'
import { logger } from '../../lib/logger'
import { parseNewsletterCsv, commitNewsletterTopics } from '../../newsletter/csv'

interface CreateCalendarBody {
  name?: string
  industry?: string
  specialization?: string | null
}

interface UpdateCalendarBody {
  name?: string
  industry?: string
  specialization?: string | null
}

interface AssignBody {
  userId?: string
}

/**
 * Admin newsletter routes (mounted under /api/admin).
 *
 * Covers Phase 1a: content-calendar CRUD, CSV upload (dry-run + commit), and
 * explicit calendar→customer assignment. The nl_* prompt editor reuses the
 * existing /api/admin/prompts route (filtered to key-prefixed rows in the web UI).
 */
export async function newslettersAdminRoutes(app: FastifyInstance) {
  // ── Calendars ───────────────────────────────────────────────────────────────

  // GET /newsletter/calendars — list with counts
  app.get('/newsletter/calendars', async (request, reply) => {
    const admin = await requireAdmin(request, reply)
    if (!admin) return

    const calendars = await prisma.newsletterCalendar.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { topics: true, assignments: true } } },
    })
    return reply.send({ calendars })
  })

  // POST /newsletter/calendars — create
  app.post<{ Body: CreateCalendarBody }>('/newsletter/calendars', async (request, reply) => {
    const admin = await requireAdmin(request, reply)
    if (!admin) return

    const { name, industry, specialization } = request.body ?? {}
    if (!name?.trim()) return reply.status(400).send({ error: 'name is required' })
    if (!industry?.trim()) return reply.status(400).send({ error: 'industry is required' })

    const calendar = await prisma.newsletterCalendar.create({
      data: {
        name: name.trim(),
        industry: industry.trim(),
        specialization: specialization?.trim() || null,
      },
    })
    return reply.status(201).send({ calendar })
  })

  // GET /newsletter/calendars/:id — detail with topics
  app.get<{ Params: { id: string } }>('/newsletter/calendars/:id', async (request, reply) => {
    const admin = await requireAdmin(request, reply)
    if (!admin) return

    const calendar = await prisma.newsletterCalendar.findUnique({
      where: { id: request.params.id },
      include: {
        topics: { orderBy: { date: 'asc' } },
        _count: { select: { assignments: true } },
      },
    })
    if (!calendar) return reply.status(404).send({ error: 'Calendar not found' })
    return reply.send({ calendar })
  })

  // PATCH /newsletter/calendars/:id — edit
  app.patch<{ Params: { id: string }; Body: UpdateCalendarBody }>(
    '/newsletter/calendars/:id',
    async (request, reply) => {
      const admin = await requireAdmin(request, reply)
      if (!admin) return

      const existing = await prisma.newsletterCalendar.findUnique({ where: { id: request.params.id } })
      if (!existing) return reply.status(404).send({ error: 'Calendar not found' })

      const { name, industry, specialization } = request.body ?? {}
      const calendar = await prisma.newsletterCalendar.update({
        where: { id: request.params.id },
        data: {
          ...(name !== undefined ? { name: name.trim() } : {}),
          ...(industry !== undefined ? { industry: industry.trim() } : {}),
          ...(specialization !== undefined ? { specialization: specialization?.trim() || null } : {}),
        },
      })
      return reply.send({ calendar })
    },
  )

  // DELETE /newsletter/calendars/:id — delete (cascades topics; unassigns users)
  app.delete<{ Params: { id: string } }>('/newsletter/calendars/:id', async (request, reply) => {
    const admin = await requireAdmin(request, reply)
    if (!admin) return

    const existing = await prisma.newsletterCalendar.findUnique({ where: { id: request.params.id } })
    if (!existing) return reply.status(404).send({ error: 'Calendar not found' })

    await prisma.newsletterCalendar.delete({ where: { id: request.params.id } })
    return reply.send({ ok: true })
  })

  // ── CSV upload (dry-run preview + commit) ─────────────────────────────────────

  // POST /newsletter/calendars/:id/csv?commit=true
  app.post<{ Params: { id: string }; Querystring: { commit?: string } }>(
    '/newsletter/calendars/:id/csv',
    async (request, reply) => {
      const admin = await requireAdmin(request, reply)
      if (!admin) return

      const calendar = await prisma.newsletterCalendar.findUnique({ where: { id: request.params.id } })
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

      const { rows, errors, headerError } = parseNewsletterCsv(csvText)
      if (headerError) return reply.status(400).send({ error: headerError })

      const commit = request.query.commit === 'true' || request.query.commit === '1'

      // Preview rows are returned without the Date object (dateRaw is enough for UI).
      const preview = rows.map((r) => ({
        rowNumber: r.rowNumber,
        date: r.date.toISOString().slice(0, 10),
        topic: r.topic,
        bullet1: r.bullet1,
        bullet2: r.bullet2,
        bullet3: r.bullet3,
        secondaryTopic: r.secondaryTopic,
        recipe: r.recipe,
        kidsSnack: r.kidsSnack,
        techFreeActivity: r.techFreeActivity,
        videoUrl: r.videoUrl,
      }))

      if (!commit) {
        return reply.send({ dryRun: true, validRows: rows.length, errorCount: errors.length, errors, preview })
      }

      // Refuse to commit a CSV that has any row errors — admin must fix first.
      if (errors.length > 0) {
        return reply.status(400).send({
          error: 'CSV has row errors — fix them and re-upload.',
          validRows: rows.length,
          errorCount: errors.length,
          errors,
        })
      }

      const { upserted } = await commitNewsletterTopics(calendar.id, rows)
      logger.info({ calendarId: calendar.id, upserted }, '[newsletter/csv] topics committed')
      return reply.send({ dryRun: false, upserted, errors: [] })
    },
  )

  // ── Assignment (explicit calendar → customer) ─────────────────────────────────

  // GET /newsletter/calendars/:id/assignments — assigned users + suggested matches
  app.get<{ Params: { id: string } }>(
    '/newsletter/calendars/:id/assignments',
    async (request, reply) => {
      const admin = await requireAdmin(request, reply)
      if (!admin) return

      const calendar = await prisma.newsletterCalendar.findUnique({ where: { id: request.params.id } })
      if (!calendar) return reply.status(404).send({ error: 'Calendar not found' })

      const assigned = await prisma.user.findMany({
        where: { newsletterCalendarId: calendar.id },
        select: { id: true, name: true, email: true },
        orderBy: { email: 'asc' },
      })

      // Candidate matches: users not already on this calendar, ranked by how well
      // their BrandSettings industry/specialization matches.
      const others = await prisma.user.findMany({
        where: { newsletterCalendarId: { not: calendar.id } },
        select: {
          id: true,
          name: true,
          email: true,
          newsletterCalendarId: true,
          brandSettings: { select: { industry: true, specialization: true } },
        },
        orderBy: { email: 'asc' },
      })

      const norm = (s?: string | null) => (s ?? '').trim().toLowerCase()
      const calIndustry = norm(calendar.industry)
      const calSpec = norm(calendar.specialization)

      const candidates = others
        .map((u) => {
          const ui = norm(u.brandSettings?.industry)
          const us = norm(u.brandSettings?.specialization)
          let score = 0
          if (calIndustry && ui === calIndustry) score += 2
          if (calSpec && us === calSpec) score += 1
          return {
            id: u.id,
            name: u.name,
            email: u.email,
            industry: u.brandSettings?.industry ?? null,
            specialization: u.brandSettings?.specialization ?? null,
            alreadyAssignedElsewhere: u.newsletterCalendarId != null,
            matchScore: score,
          }
        })
        .sort((a, b) => b.matchScore - a.matchScore || a.email.localeCompare(b.email))

      return reply.send({ assigned, candidates })
    },
  )

  // POST /newsletter/calendars/:id/assign — { userId }
  app.post<{ Params: { id: string }; Body: AssignBody }>(
    '/newsletter/calendars/:id/assign',
    async (request, reply) => {
      const admin = await requireAdmin(request, reply)
      if (!admin) return

      const calendar = await prisma.newsletterCalendar.findUnique({ where: { id: request.params.id } })
      if (!calendar) return reply.status(404).send({ error: 'Calendar not found' })

      const userId = request.body?.userId
      if (!userId) return reply.status(400).send({ error: 'userId is required' })

      const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
      if (!user) return reply.status(404).send({ error: 'User not found' })

      await prisma.user.update({ where: { id: userId }, data: { newsletterCalendarId: calendar.id } })
      logger.info({ calendarId: calendar.id, userId }, '[newsletter] calendar assigned to user')
      return reply.send({ ok: true })
    },
  )

  // POST /newsletter/calendars/:id/unassign — { userId }
  app.post<{ Params: { id: string }; Body: AssignBody }>(
    '/newsletter/calendars/:id/unassign',
    async (request, reply) => {
      const admin = await requireAdmin(request, reply)
      if (!admin) return

      const userId = request.body?.userId
      if (!userId) return reply.status(400).send({ error: 'userId is required' })

      // Only clear the assignment if it actually points at this calendar.
      await prisma.user.updateMany({
        where: { id: userId, newsletterCalendarId: request.params.id },
        data: { newsletterCalendarId: null },
      })
      logger.info({ calendarId: request.params.id, userId }, '[newsletter] calendar unassigned from user')
      return reply.send({ ok: true })
    },
  )
}
