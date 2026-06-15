import { prisma } from '@socioply/shared'
import { logger } from '../lib/logger'
import { getBoss, QUEUES } from '../queues/index'

const PROCESSING_STUCK_MS = 20 * 60 * 1000 // 20 min
const PENDING_STUCK_MS = 10 * 60 * 1000 // 10 min

/** Re-enqueue promo-email rows stuck in pending/processing. Mirrors syndication-safety. */
export async function promoEmailSafetyHandler(): Promise<void> {
  const now = Date.now()
  const processingCutoff = new Date(now - PROCESSING_STUCK_MS)
  const pendingCutoff = new Date(now - PENDING_STUCK_MS)

  const select = {
    jobId: true,
    job: {
      select: {
        userId: true,
        topic: { select: { publishingDate: true, scheduledDate: true } },
      },
    },
  } as const

  const stuckProcessing = await prisma.articleEmailCampaign.findMany({
    where: { status: 'processing', updatedAt: { lt: processingCutoff } },
    select,
    take: 10,
  })

  const stuckPending = await prisma.articleEmailCampaign.findMany({
    where: { status: 'pending', createdAt: { lt: pendingCutoff } },
    select,
    take: 10,
  })

  const boss = await getBoss()

  const reenqueue = async (
    row: (typeof stuckProcessing)[number],
    kind: 'processing' | 'pending',
  ) => {
    if (kind === 'processing') {
      await prisma.articleEmailCampaign.updateMany({
        where: { jobId: row.jobId, status: 'processing' },
        data: { status: 'pending' },
      })
    }
    const publishingDate =
      row.job.topic.publishingDate ?? row.job.topic.scheduledDate ?? new Date()
    logger.warn({ jobId: row.jobId, kind }, '[promo-email-safety] re-enqueueing stuck job')
    await boss.send(
      QUEUES.PROMO_EMAIL_GENERATE,
      { jobId: row.jobId, userId: row.job.userId, publishingDate: publishingDate.toISOString() },
      { singletonKey: `promo-email-retry-${row.jobId}`, retryLimit: 2, retryDelay: 60 },
    )
  }

  for (const row of stuckProcessing) await reenqueue(row, 'processing')
  for (const row of stuckPending) await reenqueue(row, 'pending')
}
