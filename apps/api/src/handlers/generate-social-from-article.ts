import PgBoss from 'pg-boss'
import { logger } from '../lib/logger'

export interface GenerateSocialFromArticleJobData {
  jobId: string
}

export async function generateSocialFromArticleHandler(
  jobs: PgBoss.Job<GenerateSocialFromArticleJobData>[],
): Promise<void> {
  for (const job of jobs) {
    logger.info(
      { jobId: job.data.jobId, pgBossJobId: job.id },
      '[generate-social-from-article] received — Phase A6 not implemented yet',
    )
  }
}
