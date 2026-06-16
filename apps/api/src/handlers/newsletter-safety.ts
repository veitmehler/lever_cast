import { prisma } from '@socioply/shared'
import { logger } from '../lib/logger'
import { getBoss, QUEUES } from '../queues/index'

// A row mid-generation longer than this is presumed orphaned (a worker restart
// killed it); a pending row this old was never picked up. Both get re-enqueued.
const PROCESSING_STUCK_MS = 30 * 60 * 1000 // 30 min (generation is LLM-heavy)
const PENDING_STUCK_MS = 10 * 60 * 1000 // 10 min

export async function newsletterSafetyHandler(): Promise<void> {
  const now = Date.now()
  const processingCutoff = new Date(now - PROCESSING_STUCK_MS)
  const pendingCutoff = new Date(now - PENDING_STUCK_MS)

  const stuckProcessing = await prisma.newsletter.findMany({
    where: { status: { in: ['researching', 'generating'] }, updatedAt: { lt: processingCutoff } },
    select: { id: true, userId: true, topicId: true },
    take: 20,
  })

  const stuckPending = await prisma.newsletter.findMany({
    where: { status: 'pending', createdAt: { lt: pendingCutoff } },
    select: { id: true, userId: true, topicId: true },
    take: 20,
  })

  const boss = await getBoss()

  for (const row of stuckProcessing) {
    logger.warn({ id: row.id }, '[newsletter-safety] re-enqueueing stuck row')
    await prisma.newsletter.update({ where: { id: row.id }, data: { status: 'pending' } })
    await boss.send(
      QUEUES.NEWSLETTER_GENERATE,
      { userId: row.userId, topicId: row.topicId },
      { singletonKey: `nl-${row.userId}-${row.topicId}`, retryLimit: 2, retryDelay: 60 },
    )
  }

  for (const row of stuckPending) {
    logger.warn({ id: row.id }, '[newsletter-safety] re-enqueueing stuck pending row')
    await boss.send(
      QUEUES.NEWSLETTER_GENERATE,
      { userId: row.userId, topicId: row.topicId },
      { singletonKey: `nl-${row.userId}-${row.topicId}`, retryLimit: 2, retryDelay: 60 },
    )
  }
}
