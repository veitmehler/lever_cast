import { prisma } from '../../lib/prisma'
import { getBoss, QUEUES } from '../../queues/index'

export async function enqueueSocialDispatch(
  runId: string,
  opts?: { slotKey?: string },
): Promise<{ enqueued: boolean; message?: string }> {
  const run = await prisma.socialAutomationRun.findUnique({
    where: { id: runId },
    select: { id: true, status: true },
  })
  if (!run) {
    return { enqueued: false, message: 'Automation run not found' }
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
  await boss.send(
    QUEUES.SOCIAL_GENERATE,
    { runId, onlySlot: normalized },
    {
      singletonKey: `social-generate-${runId}-${normalized}`,
      expireInSeconds: 60 * 60 * 3,
    },
  )

  return { enqueued: true }
}
