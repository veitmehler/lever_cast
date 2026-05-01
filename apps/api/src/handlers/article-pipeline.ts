import PgBoss from 'pg-boss'
import { logger } from '../lib/logger'
import { prisma } from '../lib/prisma'

export interface ArticlePipelineJobData {
  jobId: string
}

export async function articlePipelineHandler(
  jobs: PgBoss.Job<ArticlePipelineJobData>[],
): Promise<void> {
  for (const job of jobs) {
    const { jobId } = job.data
    logger.info({ jobId, pgBossJobId: job.id }, '[article-pipeline] received — Phase A2 not implemented yet')

    await prisma.articleJob.update({
      where: { id: jobId },
      data: { status: 'in_progress', startedAt: new Date() },
    }).catch((err) => {
      logger.warn({ jobId, err }, '[article-pipeline] could not update job status')
    })
  }
}
