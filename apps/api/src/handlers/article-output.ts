import PgBoss from 'pg-boss'
import { logger } from '../lib/logger'
import { Sentry } from '../lib/sentry'
import { prisma } from '@socioply/shared'
import { sendFailureAlert } from '../lib/alerts'
import { buildOutputPayload } from '../article-pipeline/output/payload-builder'
import { getOutputTarget } from '../article-pipeline/output/registry'

export interface ArticleOutputJobData {
  jobId: string
  target: string
  attemptId: string
  config: Record<string, unknown>
}

export async function articleOutputHandler(
  jobs: PgBoss.Job<ArticleOutputJobData>[],
): Promise<void> {
  for (const job of jobs) {
    const { jobId, target, attemptId, config } = job.data
    logger.info({ jobId, target, attemptId }, '[article-output] starting export')

    try {
      const payload  = await buildOutputPayload(jobId)
      const exporter = getOutputTarget(target)
      const result   = await exporter.publish(payload, config ?? {}, attemptId)

      await prisma.outputAttempt.update({
        where: { id: attemptId },
        data: {
          status:      result.success ? 'success' : 'failed',
          resultUrl:   result.resultUrl,
          targetRefId: result.targetRefId,
          errorMessage: result.errorMessage,
          completedAt: new Date(),
          durationMs:  result.durationMs,
        },
      })

      logger.info({ jobId, target, attemptId, resultUrl: result.resultUrl }, '[article-output] export complete')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      logger.error({ jobId, target, attemptId, err }, '[article-output] export failed')
      Sentry.captureException(err, { tags: { queue: 'article-output', jobId, target } })

      await prisma.outputAttempt.update({
        where: { id: attemptId },
        data: {
          status:       'failed',
          errorMessage: msg,
          completedAt:  new Date(),
        },
      }).catch(() => {})
      await sendFailureAlert({
        jobId,
        errorType: 'article-output-failed',
        message: `Article export to ${target} failed for job ${jobId}: ${msg}`,
        context: { jobId, target, attemptId },
      }).catch(() => {})

      throw err
    }
  }
}
