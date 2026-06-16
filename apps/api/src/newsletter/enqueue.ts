/**
 * Enqueue per-customer newsletter generation for a calendar + date range.
 *
 * Creates a pending Newsletter row per topic (idempotent via @@unique(userId,
 * topicId)) and enqueues one NEWSLETTER_GENERATE job per row. Rows already in a
 * non-failed, non-pending state are skipped (don't clobber reviewed/approved
 * editions). The same fn is the future billing-webhook entry point.
 */
import { prisma } from '@socioply/shared'
import { getBoss, QUEUES } from '../queues/index'
import { logger } from '../lib/logger'

export interface NewsletterGenerateJobData {
  userId: string
  topicId: string
}

export interface EnqueueResult {
  enqueued: number
  skipped: number
  totalTopics: number
}

export async function enqueueNewsletterGeneration(
  userId: string,
  calendarId: string,
  from?: Date,
  to?: Date,
): Promise<EnqueueResult> {
  const dateFilter =
    from || to
      ? { date: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
      : {}

  const topics = await prisma.newsletterTopic.findMany({
    where: { calendarId, ...dateFilter },
    select: { id: true },
    orderBy: { date: 'asc' },
  })

  const boss = await getBoss()
  let enqueued = 0
  let skipped = 0

  for (const t of topics) {
    const existing = await prisma.newsletter.findUnique({
      where: { userId_topicId: { userId, topicId: t.id } },
      select: { id: true, status: true },
    })

    // Skip editions already being reviewed / approved / delivered.
    if (existing && existing.status !== 'failed' && existing.status !== 'pending') {
      skipped++
      continue
    }

    if (existing) {
      await prisma.newsletter.update({ where: { id: existing.id }, data: { status: 'pending' } })
    } else {
      await prisma.newsletter.create({ data: { userId, topicId: t.id, status: 'pending' } })
    }

    await boss.send(
      QUEUES.NEWSLETTER_GENERATE,
      { userId, topicId: t.id } satisfies NewsletterGenerateJobData,
      { singletonKey: `nl-${userId}-${t.id}`, retryLimit: 2, retryDelay: 60, expireInSeconds: 3600 },
    )
    enqueued++
  }

  logger.info(
    { userId, calendarId, enqueued, skipped, totalTopics: topics.length },
    '[newsletter/enqueue] generation enqueued',
  )
  return { enqueued, skipped, totalTopics: topics.length }
}
