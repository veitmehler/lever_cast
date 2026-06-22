import type { FastifyInstance } from 'fastify'
import { prisma, resolveAccountForClerkId } from '@socioply/shared'
import { requireAuth } from '../middleware/auth'
import { createBatchFromDates, advanceBatch } from '../article-pipeline/content-batch'

/**
 * Unified content plan: merges, per day, the account's planned ARTICLE topic and
 * NEWSLETTER topic for a date range (default: next 30 days).
 *
 * Article precedence for a day: a user-scheduled Topic (their own) wins; an
 * admin article-calendar topic is the fallback/suggestion. The non-chosen source
 * is returned as an "alternative" so the UI can offer a swap.
 */

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10)
}

interface ArticleEntry {
  source: 'scheduled' | 'article_calendar'
  topic: string
  topicId?: string // a real Topic (scheduled) — editable/generatable
  calendarTopicId?: string // an admin ArticleCalendarTopic suggestion
  status?: string
  jobId?: string
  jobStatus?: string
}

export async function contentPlanRoutes(app: FastifyInstance) {
  // GET /content-plan?from=YYYY-MM-DD&to=YYYY-MM-DD
  app.get<{ Querystring: { from?: string; to?: string } }>('/content-plan', async (request, reply) => {
    const clerkId = await requireAuth(request, reply)
    if (!clerkId) return
    const account = await resolveAccountForClerkId(clerkId)
    if (!account) return reply.status(404).send({ error: 'User not found' })

    const from = request.query.from ? new Date(request.query.from) : new Date()
    from.setUTCHours(0, 0, 0, 0)
    const to = request.query.to ? new Date(request.query.to) : new Date(from.getTime() + 29 * 86400000)
    to.setUTCHours(23, 59, 59, 999)

    const acct = await prisma.account.findUnique({
      where: { id: account.accountId },
      select: { articleCalendarId: true },
    })
    const owner = await prisma.user.findUnique({
      where: { id: account.ownerUserId },
      select: { newsletterCalendarId: true },
    })

    const [scheduledTopics, articleCalTopics, newsletterTopics, ideaCount] = await Promise.all([
      // User-scheduled article topics (account-scoped via the prisma extension).
      prisma.topic.findMany({
        where: {
          userId: account.userId, // extension → userId IN account members
          scheduledDate: { gte: from, lte: to },
          status: { not: 'idea' },
          mode: { in: ['article_first', 'article_only'] },
        },
        select: {
          id: true,
          topic: true,
          scheduledDate: true,
          status: true,
          articleJobs: { select: { id: true, status: true }, orderBy: { createdAt: 'desc' }, take: 1 },
        },
      }),
      acct?.articleCalendarId
        ? prisma.articleCalendarTopic.findMany({
            where: { calendarId: acct.articleCalendarId, date: { gte: from, lte: to } },
            select: { id: true, date: true, topic: true },
          })
        : Promise.resolve([]),
      owner?.newsletterCalendarId
        ? prisma.newsletterTopic.findMany({
            where: { calendarId: owner.newsletterCalendarId, date: { gte: from, lte: to } },
            select: { id: true, date: true, topic: true },
          })
        : Promise.resolve([]),
      prisma.topic.count({ where: { userId: account.userId, status: 'idea' } }),
    ])

    // Generated newsletters keyed by their source topic.
    const nlTopicIds = newsletterTopics.map((t) => t.id)
    const newsletters = nlTopicIds.length
      ? await prisma.newsletter.findMany({
          where: { userId: account.ownerUserId, topicId: { in: nlTopicIds } },
          select: { id: true, topicId: true, status: true },
        })
      : []
    const nlByTopic = new Map(newsletters.map((n) => [n.topicId, n]))

    // Index by date.
    const scheduledByDate = new Map<string, (typeof scheduledTopics)[number]>()
    for (const t of scheduledTopics) if (t.scheduledDate) scheduledByDate.set(dateKey(t.scheduledDate), t)
    const articleCalByDate = new Map<string, (typeof articleCalTopics)[number]>()
    for (const t of articleCalTopics) articleCalByDate.set(dateKey(t.date), t)
    const nlByDate = new Map<string, (typeof newsletterTopics)[number]>()
    for (const t of newsletterTopics) nlByDate.set(dateKey(t.date), t)

    // Build a contiguous day list.
    const days: Array<{
      date: string
      article: { primary: ArticleEntry | null; alternatives: ArticleEntry[] }
      newsletter: { topic: string; newsletterTopicId: string; newsletterId?: string; status?: string } | null
    }> = []

    for (let ts = from.getTime(); ts <= to.getTime(); ts += 86400000) {
      const key = dateKey(new Date(ts))
      const scheduled = scheduledByDate.get(key)
      const cal = articleCalByDate.get(key)

      let primary: ArticleEntry | null = null
      const alternatives: ArticleEntry[] = []
      if (scheduled) {
        primary = {
          source: 'scheduled',
          topic: scheduled.topic,
          topicId: scheduled.id,
          status: scheduled.status,
          jobId: scheduled.articleJobs[0]?.id,
          jobStatus: scheduled.articleJobs[0]?.status,
        }
        if (cal) alternatives.push({ source: 'article_calendar', topic: cal.topic, calendarTopicId: cal.id })
      } else if (cal) {
        primary = { source: 'article_calendar', topic: cal.topic, calendarTopicId: cal.id }
      }

      const nl = nlByDate.get(key)
      const nlRow = nl ? nlByTopic.get(nl.id) : undefined

      days.push({
        date: key,
        article: { primary, alternatives },
        newsletter: nl
          ? { topic: nl.topic, newsletterTopicId: nl.id, newsletterId: nlRow?.id, status: nlRow?.status }
          : null,
      })
    }

    return reply.send({ from: dateKey(from), to: dateKey(to), days, ideaCount })
  })

  // POST /content-plan/generate { dates: string[] } — bulk generate selected days.
  app.post<{ Body: { dates?: string[] } }>('/content-plan/generate', async (request, reply) => {
    const clerkId = await requireAuth(request, reply)
    if (!clerkId) return
    const account = await resolveAccountForClerkId(clerkId)
    if (!account) return reply.status(404).send({ error: 'User not found' })

    const dates = (request.body?.dates ?? []).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
    if (dates.length === 0) return reply.status(400).send({ error: 'No valid dates provided' })

    const created = await createBatchFromDates(account, dates)
    if (!created) return reply.status(400).send({ error: 'Nothing to generate on the selected days.' })

    // Kick off the first item immediately; the monitor cron drives the rest.
    await advanceBatch(created.batchId)
    return reply.status(202).send({ batchId: created.batchId, itemCount: created.itemCount })
  })

  // GET /review-inbox — items ready to review + flagged, for the account.
  app.get('/review-inbox', async (request, reply) => {
    const clerkId = await requireAuth(request, reply)
    if (!clerkId) return
    const account = await resolveAccountForClerkId(clerkId)
    if (!account) return reply.status(404).send({ error: 'User not found' })

    const [readyArticles, flaggedArticles, readyNewsletters] = await Promise.all([
      prisma.articleJob.findMany({
        where: { userId: account.userId, status: 'enriched' }, // extension → account members
        select: { id: true, topic: { select: { topic: true } }, sitePage: { select: { title: true } }, enrichedAt: true },
        orderBy: { enrichedAt: 'desc' },
        take: 50,
      }),
      prisma.articleJob.findMany({
        where: { userId: account.userId, status: 'needs_review' },
        select: { id: true, topic: { select: { topic: true } }, qualityVerdict: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.newsletter.findMany({
        where: { userId: account.ownerUserId, status: 'ready_for_review' },
        select: { id: true, topic: { select: { topic: true } }, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
        take: 50,
      }),
    ])

    // Articles with an open edit request assigned to the CURRENT user (the teammate).
    const myEditReqs = await prisma.articleEditRequest.findMany({
      where: { assigneeUserId: account.userId, status: 'open' },
      select: { sitePage: { select: { jobId: true, title: true } } },
    })
    const assignedSeen = new Set<string>()
    const assignedToMe: Array<{ jobId: string; title: string }> = []
    for (const r of myEditReqs) {
      const jobId = r.sitePage?.jobId
      if (jobId && !assignedSeen.has(jobId)) {
        assignedSeen.add(jobId)
        assignedToMe.push({ jobId, title: r.sitePage?.title ?? 'Article' })
      }
    }

    return reply.send({
      articles: readyArticles.map((a) => ({
        jobId: a.id,
        title: a.sitePage?.title ?? a.topic.topic,
        at: a.enrichedAt,
      })),
      newsletters: readyNewsletters.map((n) => ({
        newsletterId: n.id,
        title: n.topic.topic,
        at: n.updatedAt,
      })),
      flagged: flaggedArticles.map((a) => ({
        jobId: a.id,
        title: a.topic.topic,
        reasons: (a.qualityVerdict as { reasons?: string[] } | null)?.reasons ?? [],
        at: a.createdAt,
      })),
      assignedToMe,
    })
  })
}
