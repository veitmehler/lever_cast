import { prisma } from '@omniply/shared'
import { logger } from '../lib/logger'
import { getBoss, QUEUES } from '../queues/index'
import { finalizeDispatchCounts, reconcileRunDispatchState } from '../social/automation/dispatch-run'
import { SOCIAL_GENERATE_EXPIRE_SECONDS } from '../social/automation/enqueue'
import { sendFailureAlert } from '../lib/alerts'

// Comfortably above Phase 2's per-slot hard-deadline backstops (20 min feed /
// 15 min story in matrix-processor.ts / story-processor.ts) — a run legitimately
// working through a slow slot must never look "stuck" to this sweeper before its
// own internal deadline would have failed it first. Was 15 min, which sat BELOW
// the 20-min feed backstop and risked the sweeper firing on a still-healthy run.
export const PROCESSING_STUCK_MS = 25 * 60 * 1000
// Phase 2 raised SOCIAL_GENERATE to 3-way concurrency — a burst of legitimate
// runs can now leave a healthy run queued in 'pending' for longer than before
// this was tuned. Was 5 min (pre-dates the concurrency change).
const PENDING_STUCK_MS = 15 * 60 * 1000
const SCHEDULING_STUCK_MS = 15 * 60 * 1000

/** Bounded auto-recovery: give up and alert for manual review rather than retry forever. */
export const MAX_AUTO_RECOVER_ATTEMPTS = 2

/**
 * Delete any orphaned SOCIAL_GENERATE pg-boss job(s) still referencing this run
 * before re-enqueuing. Without this, re-enqueuing a stuck run piles a fresh job
 * alongside the still-referenced (possibly still-running) old one — the exact
 * "5 duplicate created jobs" symptom from the 2026-07-08 incident. singletonKey
 * does NOT provide this protection: verified against pg-boss v10 source — its
 * uniqueness constraints only apply to 'short'/'singleton'/'stately' queue
 * policies, and SOCIAL_GENERATE uses the default 'standard' policy.
 */
async function reclaimOrphanedSocialGenerateJob(runId: string): Promise<void> {
  await prisma.$executeRawUnsafe(
    `delete from pgboss.job where name = $1 and state in ('active','created') and (data->>'runId') = $2`,
    QUEUES.SOCIAL_GENERATE,
    runId,
  )
}

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

  // updatedAt, not createdAt: a run auto-recovered by the stuckProcessing
  // branch below is reset to 'pending' with a fresh updatedAt but an old,
  // unchanged createdAt. Filtering on createdAt would let that same run
  // immediately re-qualify here on the very next tick (before its freshly
  // re-enqueued job is even picked up), double-counting autoRecoverAttempts
  // and sending a redundant duplicate job.
  const stuckPending = await prisma.socialAutomationRun.findMany({
    where: {
      status: 'pending',
      updatedAt: { lt: pendingCutoff },
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
    const logCtx = { runId: run.id, userId: run.userId, jobId: run.jobId ?? undefined }

    if (run.autoRecoverAttempts >= MAX_AUTO_RECOVER_ATTEMPTS) {
      logger.error({ ...logCtx, attempts: run.autoRecoverAttempts }, '[social-automation-safety] auto-recovery exhausted — marking failed')
      await reclaimOrphanedSocialGenerateJob(run.id)
      await prisma.socialAutomationRun.update({
        where: { id: run.id },
        data: {
          status: 'failed',
          currentSpec: null,
          error: `Stalled at ${run.currentSpec ?? 'unknown slot'} — auto-recovery exhausted after ${MAX_AUTO_RECOVER_ATTEMPTS} attempts`,
        },
      })
      await sendFailureAlert({
        userId: run.userId,
        jobId: run.jobId ?? undefined,
        errorType: 'social_automation_run_stalled',
        message: `Run stalled at ${run.currentSpec ?? 'unknown slot'} — gave up after ${MAX_AUTO_RECOVER_ATTEMPTS} auto-recovery attempts; needs manual review`,
        context: { ...logCtx },
      }).catch(() => {})
      continue
    }

    logger.warn(
      { ...logCtx, attempt: run.autoRecoverAttempts + 1, stalledAt: run.currentSpec },
      '[social-automation-safety] auto-recovering stalled processing run',
    )

    // Reclaim BEFORE resetting the DB row so a still-legitimately-running
    // (not actually dead) job can't race a freshly-enqueued duplicate.
    await reclaimOrphanedSocialGenerateJob(run.id)

    await prisma.socialAutomationRun.update({
      where: { id: run.id },
      data: { status: 'pending', currentSpec: null, autoRecoverAttempts: { increment: 1 } },
    })

    // Same singletonKey pattern as the original enqueue (per-content-source,
    // not per-attempt) — keeps this run's job identity stable across retries.
    const singletonKey = run.newsletterId
      ? `social-generate-nl-${run.newsletterId}`
      : `social-generate-${run.jobId}`

    await boss.send(
      QUEUES.SOCIAL_GENERATE,
      { runId: run.id, resumeIncomplete: true },
      { singletonKey, expireInSeconds: SOCIAL_GENERATE_EXPIRE_SECONDS },
    )

    await sendFailureAlert({
      userId: run.userId,
      jobId: run.jobId ?? undefined,
      errorType: 'social_automation_run_stalled',
      message: `Run stalled at ${run.currentSpec ?? 'unknown slot'} — auto-recovering (attempt ${run.autoRecoverAttempts + 1}/${MAX_AUTO_RECOVER_ATTEMPTS})`,
      context: { ...logCtx },
    }).catch(() => {})
  }

  for (const run of stuckPending) {
    const logCtx = { runId: run.id, userId: run.userId, jobId: run.jobId ?? undefined }

    if (run.autoRecoverAttempts >= MAX_AUTO_RECOVER_ATTEMPTS) {
      logger.error({ ...logCtx, attempts: run.autoRecoverAttempts }, '[social-automation-safety] pending auto-recovery exhausted — marking failed')
      await reclaimOrphanedSocialGenerateJob(run.id)
      await prisma.socialAutomationRun.update({
        where: { id: run.id },
        data: { status: 'failed', error: `Never started — auto-recovery exhausted after ${MAX_AUTO_RECOVER_ATTEMPTS} attempts` },
      })
      await sendFailureAlert({
        userId: run.userId,
        jobId: run.jobId ?? undefined,
        errorType: 'social_automation_run_stalled',
        message: `Run never started — gave up after ${MAX_AUTO_RECOVER_ATTEMPTS} auto-recovery attempts; needs manual review`,
        context: { ...logCtx },
      }).catch(() => {})
      continue
    }

    logger.warn({ ...logCtx, attempt: run.autoRecoverAttempts + 1 }, '[social-automation-safety] re-enqueueing stuck pending run')

    // Defensive dedup, same as the processing branch — cheap no-op if nothing's there.
    await reclaimOrphanedSocialGenerateJob(run.id)

    await prisma.socialAutomationRun.update({
      where: { id: run.id },
      data: { autoRecoverAttempts: { increment: 1 } },
    })

    const singletonKey = run.newsletterId
      ? `social-generate-nl-${run.newsletterId}`
      : `social-generate-${run.jobId}`

    await boss.send(
      QUEUES.SOCIAL_GENERATE,
      { runId: run.id },
      { singletonKey, expireInSeconds: SOCIAL_GENERATE_EXPIRE_SECONDS },
    )
  }
}
