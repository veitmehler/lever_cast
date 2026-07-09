/**
 * Resolve the effective NewsletterTopic for an account + date: an account-scoped
 * override wins, else the account's routed calendar's topic for that date. Used
 * by createBatchFromDates (generation) and the override assign/revert endpoints
 * (lock check) — GET /content-plan does its own bulk version of this precedence
 * for perf (one range query each, not per-day). See
 * .plans/newsletter-topic-override.implementation-plan.md.
 */
import { prisma } from '@socioply/shared'

export interface ResolvedNewsletterTopic {
  id: string
  topic: string
  isOverride: boolean
}

export function dayBounds(date: string): { start: Date; end: Date } {
  const start = new Date(`${date}T00:00:00.000Z`)
  const end = new Date(start.getTime() + 86400000)
  return { start, end }
}

export async function resolveNewsletterTopicForDate(
  accountId: string,
  newsletterCalendarId: string | null,
  date: string,
): Promise<ResolvedNewsletterTopic | null> {
  const { start, end } = dayBounds(date)
  const override = await prisma.newsletterTopic.findFirst({
    where: { accountId, date: { gte: start, lt: end } },
    select: { id: true, topic: true },
  })
  if (override) return { ...override, isOverride: true }
  if (!newsletterCalendarId) return null
  const cal = await prisma.newsletterTopic.findFirst({
    where: { calendarId: newsletterCalendarId, date: { gte: start, lt: end } },
    select: { id: true, topic: true },
  })
  return cal ? { ...cal, isOverride: false } : null
}

/** True if generation has already started for the resolved topic (any Newsletter row exists). */
export async function isNewsletterTopicLocked(ownerUserId: string, topicId: string): Promise<boolean> {
  const nl = await prisma.newsletter.findUnique({
    where: { userId_topicId: { userId: ownerUserId, topicId } },
    select: { id: true },
  })
  return !!nl
}
