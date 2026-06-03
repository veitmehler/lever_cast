import { prisma } from '../lib/prisma'
import { logger } from '../lib/logger'
import { getBoss, QUEUES } from '../queues/index'
import { finalizeDispatchCounts, reconcileRunDispatchState } from '../social/automation/dispatch-run'

const PROCESSING_STUCK_MS = 15 * 60 * 1000
const PENDING_STUCK_MS = 5 * 60 * 1000
const SCHEDULING_STUCK_MS = 15 * 60 * 1000

/**
 * Recovery for stuck automation runs only.
 * `ready` is terminal for generation (awaits user approval) — never re-enqueued here.
 */
export async function socialAutomationSafetyHandler(): Promise<void> {
  const now = Date.now()
  const processingCutoff = new Date(now - PROCESSING_STUCK_MS)
  const pendingCutoff = new Date(now - PENDING_STUCK_MS)
  const schedulingCutoff = new Date(now - SCHEDULING_STUCK_MS)

  const stuckScheduling = await prisma.socialAutomationRun.findMany({
    where: {
      status: 'scheduling',
      updatedAt: { lt: schedulingCutoff },
    },
    take: 10,
  })

  const stuckProcessing = await prisma.socialAutomationRun.findMany({
    where: {
      status: 'processing',
      updatedAt: { lt: processingCutoff },
    },
    take: 10,
  })

  const stuckPending = await prisma.socialAutomationRun.findMany({
    where: {
      status: 'pending',
      createdAt: { lt: pendingCutoff },
    },
    take: 10,
  })

  const boss = await getBoss()

  for (const run of stuckScheduling) {
    const readyPosts = await prisma.post.count({
      where: { automationRunId: run.id, status: 'ready' },
    })
    logger.warn(
      { runId: run.id, readyPosts },
      '[social-automation-safety] recovering stuck scheduling run',
    )
    if (readyPosts === 0) {
      await finalizeDispatchCounts(run.id)
    } else {
      await reconcileRunDispatchState(run.id)
      await boss.send(
        QUEUES.SOCIAL_DISPATCH,
        { runId: run.id },
        { singletonKey: `social-dispatch-retry-${run.id}` },
      )
    }
  }

  for (const run of stuckProcessing) {
    logger.warn({ runId: run.id }, '[social-automation-safety] resetting stuck processing run')
    await prisma.socialAutomationRun.update({
      where: { id: run.id },
      data: { status: 'pending', currentSpec: null },
    })
    await boss.send(
      QUEUES.SOCIAL_GENERATE,
      { runId: run.id },
      { singletonKey: `social-generate-retry-${run.id}` },
    )
  }

  for (const run of stuckPending) {
    logger.warn({ runId: run.id }, '[social-automation-safety] re-enqueueing stuck pending run')
    await boss.send(
      QUEUES.SOCIAL_GENERATE,
      { runId: run.id },
      { singletonKey: `social-generate-retry-${run.id}` },
    )
  }
}
