import PgBoss from 'pg-boss'
import { logger } from '../lib/logger'
import { runSocialAutomation } from '../social/automation/run'

export interface SocialGenerateJobData {
  runId: string
}

export async function socialGenerateHandler(
  jobs: PgBoss.Job<SocialGenerateJobData>[],
): Promise<void> {
  for (const job of jobs) {
    const { runId } = job.data
    logger.info({ runId, pgBossJobId: job.id }, '[social-generate] starting automation run')

    try {
      await runSocialAutomation(runId)
    } catch (err) {
      logger.error({ runId, err }, '[social-generate] automation run failed')

      const { prisma } = await import('../lib/prisma')
      await prisma.socialAutomationRun
        .update({
          where: { id: runId },
          data: {
            status: 'failed',
            error: err instanceof Error ? err.message : String(err),
            currentSpec: null,
          },
        })
        .catch(() => {})

      throw err
    }
  }
}
