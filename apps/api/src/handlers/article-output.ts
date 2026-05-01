import PgBoss from 'pg-boss'
import { logger } from '../lib/logger'

export interface ArticleOutputJobData {
  jobId: string
  target: 'wordpress' | 'html' | 'bundle' | 'preview'
}

export async function articleOutputHandler(
  jobs: PgBoss.Job<ArticleOutputJobData>[],
): Promise<void> {
  for (const job of jobs) {
    logger.info(
      { jobId: job.data.jobId, target: job.data.target, pgBossJobId: job.id },
      '[article-output] received — Phase A5 not implemented yet',
    )
  }
}
