import PgBoss from 'pg-boss'
import { logger } from '../lib/logger'

export interface ArticleEnrichmentJobData {
  jobId: string
}

export async function articleEnrichmentHandler(
  jobs: PgBoss.Job<ArticleEnrichmentJobData>[],
): Promise<void> {
  for (const job of jobs) {
    logger.info(
      { jobId: job.data.jobId, pgBossJobId: job.id },
      '[article-enrichment] received — Phase A4 not implemented yet',
    )
  }
}
