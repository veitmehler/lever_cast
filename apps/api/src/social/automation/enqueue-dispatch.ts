import { prisma } from '@socioply/shared'
import { getBoss, QUEUES } from '../../queues/index'
import { SOCIAL_GENERATE_EXPIRE_SECONDS } from './enqueue'
import { publishingGateForUser } from '../../lib/account-billing'

export async function enqueueSocialDispatch(
  runId: string,
  opts?: { slotKey?: string },
): Promise<{ enqueued: boolean; message?: string }> {
  const run = await prisma.socialAutomationRun.findUnique({
    where: { id: runId },
    select: { id: true, status: true, userId: true },
  })
  if (!run) {
    return { enqueued: false, message: 'Automation run not found' }
  }

  // Lifecycle gate (multi-tenancy Phase A): dispatching schedules posts into
  // GHL, where publishing leaves our control — gate on paidThrough here.
  const gate = await publishingGateForUser(run.userId)
  if (!gate.allowed) {
    return { enqueued: false, message: gate.reason }
  }

  if (run.status !== 'ready') {
    return {
      enqueued: false,
      message: `Run cannot be scheduled (status: ${run.status})`,
    }
  }

  if (opts?.slotKey) {
    const readyCount = await prisma.post.count({
      where: { automationRunId: runId, slotKey: opts.slotKey, status: 'ready' },
    })
    if (readyCount === 0) {
      return { enqueued: false, message: `No ready posts for slot ${opts.slotKey}` }
    }
  }

  const boss = await getBoss()
  const singletonKey = opts?.slotKey
    ? `social-dispatch-${runId}-${opts.slotKey}`
    : `social-dispatch-${runId}`

  await boss.send(
    QUEUES.SOCIAL_DISPATCH,
    { runId, slotKey: opts?.slotKey },
    {
      singletonKey,
      expireInSeconds: 60 * 60 * 2,
    },
  )

  return { enqueued: true }
}

export async function enqueueSocialRegenerate(
  runId: string,
  slotKey: string,
): Promise<{ enqueued: boolean; message?: string }> {
  const normalized = slotKey.toUpperCase()
  const run = await prisma.socialAutomationRun.findUnique({
    where: { id: runId },
    select: { id: true, status: true },
  })
  if (!run) {
    return { enqueued: false, message: 'Automation run not found' }
  }
  if (!['ready', 'completed', 'failed'].includes(run.status)) {
    return {
      enqueued: false,
      message: `Run cannot be regenerated (status: ${run.status})`,
    }
  }

  const boss = await getBoss()
  // NOTE: singletonKey only de-duplicates on queues created with a
  // 'short'/'singleton'/'stately' policy (verified against pg-boss v10
  // source — see .plans/social-generation-resilience.implementation-plan.md
  // Phase 3). SOCIAL_GENERATE uses the default 'standard' policy, so
  // singletonKey here does NOT currently prevent a double-click from
  // enqueueing two overlapping regenerations of the same slot. Low-risk
  // (user-initiated, single slot) — left as a known gap rather than widening
  // Phase 3's scope; candidate for the queue-policy hardening noted there.
  const jobId = await boss.send(
    QUEUES.SOCIAL_GENERATE,
    { runId, onlySlot: normalized },
    {
      singletonKey: `social-generate-${runId}-${normalized}`,
      expireInSeconds: SOCIAL_GENERATE_EXPIRE_SECONDS,
    },
  )

  if (jobId == null) {
    return { enqueued: false, message: 'A regeneration for this slot is already queued — please wait for it to finish' }
  }

  return { enqueued: true }
}
