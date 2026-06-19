import { prisma } from '@socioply/shared'
import { logger } from '../lib/logger'
import { advanceBatch } from '../article-pipeline/content-batch'

/**
 * Cron: drive every running content batch forward (mark finished items, start the
 * next sequential item, finalize + email when done).
 */
export async function contentBatchMonitorHandler(): Promise<void> {
  const running = await prisma.contentBatch.findMany({
    where: { status: 'running' },
    select: { id: true },
    take: 50,
  })
  for (const b of running) {
    try {
      await advanceBatch(b.id)
    } catch (err) {
      logger.error({ batchId: b.id, err }, '[content-batch-monitor] advance failed')
    }
  }
}
