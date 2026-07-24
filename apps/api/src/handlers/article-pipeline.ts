import PgBoss from 'pg-boss'
import { logger } from '../lib/logger'
import { prisma } from '@omniply/shared'
import { runPipelinePhaseA } from '../article-pipeline/executor'
import { getBoss, QUEUES } from '../queues'
import { sendFailureAlert } from '../lib/alerts'

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
      // Fail THIS pg-boss job explicitly so retryLimit/retryDelay engage
      // (swallowing the error marked the job completed and made the 1f retry
      // options dead code). Not a rethrow: batchSize is 2, and throwing would
      // fail an innocent sibling job in the same batch. On the retry the
      // executor claims the 'failed' row and resumes from completed steps.
      try {
        const boss = await getBoss()
        await boss.fail(QUEUES.ARTICLE_PIPELINE, job.id)
        // Terminal-failure alert only — never one email per retry (Phase D2).
        const meta = await boss.getJobById(QUEUES.ARTICLE_PIPELINE, job.id)
        if (!meta || meta.retryCount >= meta.retryLimit) {
          await sendFailureAlert({
            jobId,
            errorType: 'article-pipeline-terminal',
            message: `Article pipeline failed permanently after ${meta ? meta.retryCount + 1 : '?'} attempt(s): ${err instanceof Error ? err.message : String(err)}`,
            context: { jobId, pgBossJobId: job.id },
          }).catch(() => {})
        }
      } catch (failErr) {
        logger.error({ jobId, pgBossJobId: job.id, failErr }, '[article-pipeline] boss.fail failed — no automatic retry will fire')
        await sendFailureAlert({
          jobId,
          errorType: 'article-pipeline-terminal',
          message: `Article pipeline failed AND boss.fail errored (no retry will fire): ${err instanceof Error ? err.message : String(err)}`,
          context: { jobId, pgBossJobId: job.id },
        }).catch(() => {})
      }
    }
  }
}
