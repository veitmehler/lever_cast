import type { FastifyInstance } from 'fastify'
import { prisma, resolveAccountForClerkId } from '@omniply/shared'
import { requireAuth } from '../middleware/auth'
import { resolveNewsletterTopicForDate, isNewsletterTopicLocked, dayBounds } from '../newsletter/resolve'

/**
 * Assign / revert an account's newsletter-topic override for a date, drawing
 * from the same idea bank articles use. See
 * .plans/newsletter-topic-override.implementation-plan.md Phase 2.
 */

interface AssignBody {
  date?: string
  ideaTopicId?: string
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

async function checkNotLocked(
  ownerUserId: string,
  accountId: string,
  newsletterCalendarId: string | null,
  date: string,
): Promise<boolean> {
  const current = await resolveNewsletterTopicForDate(accountId, newsletterCalendarId, date)
  if (!current) return true
  return !(await isNewsletterTopicLocked(ownerUserId, current.id))
}

export async function newsletterTopicOverrideRoutes(app: FastifyInstance) {
  // POST /api/content-plan/newsletter-topic — assign an idea-bank topic as this
  // account's override for a date. Bullets/etc. are left blank (filled by the
  // nl_topic_expand auto-draft step at generation time, not here).
  app.post<{ Body: AssignBody }>('/content-plan/newsletter-topic', async (request, reply) => {
    const clerkId = await requireAuth(request, reply)
    if (!clerkId) return
    const account = await resolveAccountForClerkId(clerkId)
    if (!account) return reply.status(404).send({ error: 'User not found' })

    const { date, ideaTopicId } = request.body ?? {}
    if (!date || !DATE_RE.test(date)) return reply.status(400).send({ error: 'Invalid date' })
    if (!ideaTopicId) return reply.status(400).send({ error: 'ideaTopicId is required' })

    const idea = await prisma.topic.findFirst({
      where: { id: ideaTopicId, userId: account.userId }, // extension → account members
      select: { id: true, topic: true },
    })
    if (!idea) return reply.status(404).send({ error: 'Idea not found' })

    const owner = await prisma.user.findUnique({
      where: { id: account.ownerUserId },
      select: { newsletterCalendarId: true },
    })
    const ok = await checkNotLocked(account.ownerUserId, account.accountId, owner?.newsletterCalendarId ?? null, date)
    if (!ok) {
      return reply.status(409).send({ error: 'Generation has already started for this date — the topic is locked.' })
    }

    const { start } = dayBounds(date)
    const row = await prisma.newsletterTopic.upsert({
      where: { accountId_date: { accountId: account.accountId, date: start } },
      create: {
        accountId: account.accountId,
        date: start,
        topic: idea.topic,
        bullet1: '',
        bullet2: '',
        bullet3: '',
        sourceTopicId: idea.id,
      },
      update: {
        topic: idea.topic,
        bullet1: '',
        bullet2: '',
        bullet3: '',
        secondaryTopic: null,
        recipe: null,
        recipe2: null,
        sourceTopicId: idea.id,
        draftedAt: null,
      },
      select: { id: true, topic: true },
    })

    return reply.send({ newsletterTopic: row })
  })

  // DELETE /api/content-plan/newsletter-topic?date=YYYY-MM-DD — revert to whatever
  // the admin calendar currently has for that date (dynamic, not a frozen snapshot).
  app.delete<{ Querystring: { date?: string } }>('/content-plan/newsletter-topic', async (request, reply) => {
    const clerkId = await requireAuth(request, reply)
    if (!clerkId) return
    const account = await resolveAccountForClerkId(clerkId)
    if (!account) return reply.status(404).send({ error: 'User not found' })

    const { date } = request.query
    if (!date || !DATE_RE.test(date)) return reply.status(400).send({ error: 'Invalid date' })

    const owner = await prisma.user.findUnique({
      where: { id: account.ownerUserId },
      select: { newsletterCalendarId: true },
    })
    const ok = await checkNotLocked(account.ownerUserId, account.accountId, owner?.newsletterCalendarId ?? null, date)
    if (!ok) {
      return reply.status(409).send({ error: 'Generation has already started for this date — the topic is locked.' })
    }

    const { start } = dayBounds(date)
    await prisma.newsletterTopic.deleteMany({ where: { accountId: account.accountId, date: start } })
    return reply.send({ ok: true })
  })
}
