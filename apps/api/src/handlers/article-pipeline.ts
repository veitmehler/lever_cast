import PgBoss from 'pg-boss'
import { logger } from '../lib/logger'
import { prisma } from '@socioply/shared'
import { runPipelinePhaseA } from '../article-pipeline/executor'

export interface ArticlePipelineJobData {
  jobId: string
}

export async function articlePipelineHandler(
  jobs: PgBoss.Job<ArticlePipelineJobData>[],
): Promise<void> {
  for (const job of jobs) {
    const { jobId } = job.data
    logger.info({ jobId, pgBossJobId: job.id }, '[article-pipeline] starting Phase A execution')

    try {
      await runPipelinePhaseA(jobId)
      logger.info({ jobId }, '[article-pipeline] Phase A completed successfully')
    } catch (err) {
      logger.error({ jobId, err }, '[article-pipeline] Phase A failed')
      // Status is already set to 'failed' inside runPipelinePhaseA on error
      await prisma.articleJob
        .update({ where: { id: jobId }, data: { status: 'failed' } })
        .catch(() => {})
    }
  }
}
