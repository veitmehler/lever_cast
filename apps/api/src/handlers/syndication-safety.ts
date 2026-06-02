import { prisma } from '../lib/prisma'
import { logger } from '../lib/logger'
import { getBoss, QUEUES } from '../queues/index'

const PROCESSING_STUCK_MS = 20 * 60 * 1000 // 20 min
const PENDING_STUCK_MS = 10 * 60 * 1000    // 10 min

export async function syndicationSafetyHandler(): Promise<void> {
  const now = Date.now()
  const processingCutoff = new Date(now - PROCESSING_STUCK_MS)
  const pendingCutoff = new Date(now - PENDING_STUCK_MS)

  // Find jobs with stuck processing rows — get distinct jobIds
  const stuckProcessing = await prisma.syndicationArticle.findMany({
    where: { status: 'processing', updatedAt: { lt: processingCutoff } },
    select: { jobId: true, job: { select: { userId: true } } },
    distinct: ['jobId'],
    take: 10,
  })

  const stuckPending = await prisma.syndicationArticle.findMany({
    where: { status: 'pending', createdAt: { lt: pendingCutoff } },
    select: { jobId: true, job: { select: { userId: true } } },
    distinct: ['jobId'],
    take: 10,
  })

  const boss = await getBoss()

  for (const row of stuckProcessing) {
    logger.warn({ jobId: row.jobId }, '[syndication-safety] resetting stuck processing rows')
    await prisma.syndicationArticle.updateMany({
      where: { jobId: row.jobId, status: 'processing' },
      data: { status: 'pending' },
    })
    await boss.send(
      QUEUES.SYNDICATION_GENERATE,
      { jobId: row.jobId, userId: row.job.userId },
      { singletonKey: `syndication-retry-${row.jobId}`, retryLimit: 2, retryDelay: 60 },
    )
  }

  for (const row of stuckPending) {
    logger.warn({ jobId: row.jobId }, '[syndication-safety] re-enqueueing stuck pending job')
    await boss.send(
      QUEUES.SYNDICATION_GENERATE,
      { jobId: row.jobId, userId: row.job.userId },
      { singletonKey: `syndication-retry-${row.jobId}`, retryLimit: 2, retryDelay: 60 },
    )
  }
}
