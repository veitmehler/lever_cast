import PgBoss from 'pg-boss'
import { prisma } from '../lib/prisma'
import { logger } from '../lib/logger'
import { sendFailureAlert } from '../lib/alerts'
import { generateSyndicationArticles } from '../article-pipeline/syndication/generate'

export interface SyndicationGenerateJobData {
  jobId: string
  userId: string
}

export async function syndicationGenerateHandler(
  jobs: PgBoss.Job<SyndicationGenerateJobData>[],
): Promise<void> {
  for (const job of jobs) {
    const { jobId, userId } = job.data
    logger.info({ jobId, pgBossJobId: job.id }, '[syndication-generate] starting')

    // Mark all pending rows as processing
    await prisma.syndicationArticle.updateMany({
      where: { jobId, status: 'pending' },
      data: { status: 'processing' },
    })

    try {
      await generateSyndicationArticles(jobId, userId)
      logger.info({ jobId }, '[syndication-generate] completed')
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      logger.error({ jobId, err }, '[syndication-generate] failed')

      // Mark any still-processing rows as failed
      await prisma.syndicationArticle
        .updateMany({
          where: { jobId, status: 'processing' },
          data: { status: 'failed', errorMessage: message },
        })
        .catch(() => {})

      await sendFailureAlert({
        userId,
        jobId,
        errorType: 'syndication_generate_failed',
        message,
        context: { jobId, pgBossJobId: job.id },
      }).catch(() => {})

      throw err
    }
  }
}
