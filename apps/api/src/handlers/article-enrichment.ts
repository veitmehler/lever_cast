import PgBoss from 'pg-boss'
import { logger } from '../lib/logger'
import { Sentry } from '../lib/sentry'
import { runArticleEnrichment } from '../article-pipeline/enrichment/index'
import { prisma } from '@socioply/shared'

export interface ArticleEnrichmentJobData {
  jobId: string
}

export async function articleEnrichmentHandler(
  jobs: PgBoss.Job<ArticleEnrichmentJobData>[],
): Promise<void> {
  for (const job of jobs) {
    const { jobId } = job.data
    logger.info({ jobId, pgBossJobId: job.id }, '[article-enrichment] starting enrichment')

    try {
      await runArticleEnrichment(jobId)
    } catch (err) {
      logger.error({ jobId, err }, '[article-enrichment] enrichment failed')
      Sentry.captureException(err, { tags: { queue: 'article-enrichment', jobId } })

      // Mark job as failed so UI can show a retry button
      await prisma.articleJob.update({
        where: { id: jobId },
        data: { status: 'approved' }, // stays approved — enrichment can be retried
      }).catch(() => { /* best-effort */ })

      await prisma.sitePage.updateMany({
        where: { jobId },
        data: {
          enrichmentStatus: 'failed',
          enrichmentError: err instanceof Error ? err.message : String(err),
        },
      }).catch(() => { /* best-effort */ })

      throw err // re-throw so pg-boss marks the job as failed
    }
  }
}
