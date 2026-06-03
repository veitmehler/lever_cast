import PgBoss from 'pg-boss'
import { logger } from '../lib/logger'
import { prisma } from '../lib/prisma'
import { sendFailureAlert } from '../lib/alerts'
import {
  dispatchSocialAutomationRun,
  dispatchSocialAutomationSlot,
} from '../social/automation/dispatch-run'

export interface SocialDispatchJobData {
  runId: string
  slotKey?: string
}

export async function socialDispatchHandler(
  jobs: PgBoss.Job<SocialDispatchJobData>[],
): Promise<void> {
  for (const job of jobs) {
    const { runId, slotKey } = job.data
    logger.info(
      { runId, slotKey, pgBossJobId: job.id },
      '[social-dispatch] starting dispatch',
    )

    try {
      if (slotKey) {
        await dispatchSocialAutomationSlot(runId, slotKey.toUpperCase())
      } else {
        await dispatchSocialAutomationRun(runId)
      }
    } catch (err) {
      logger.error({ runId, slotKey, err }, '[social-dispatch] dispatch failed')

      const run = await prisma.socialAutomationRun.findUnique({
        where: { id: runId },
        select: { userId: true, jobId: true, status: true },
      })

      if (run?.status === 'scheduling') {
        await prisma.socialAutomationRun
          .update({
            where: { id: runId },
            data: {
              status: 'ready',
              error: err instanceof Error ? err.message : String(err),
              currentSpec: null,
            },
          })
          .catch(() => {})
      }

      if (run) {
        await sendFailureAlert({
          userId: run.userId,
          jobId: run.jobId ?? undefined,
          errorType: 'social_automation_dispatch_failed',
          message: err instanceof Error ? err.message : String(err),
          context: { runId, slotKey },
        }).catch(() => {})
      }

      throw err
    }
  }
}
