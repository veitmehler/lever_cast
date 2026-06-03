import { prisma } from '../../lib/prisma'
import { logger } from '../../lib/logger'
import { SPEC_PROCESS_ORDER } from './default-specs'
import { ensureDefaultSocialPostSpecs } from './ensure-specs'
import { buildArticleContentContext } from './content'
import type { AutomationLogContext } from './log-context'
import {
  finalizeGenerationCounts,
  loadPriorAssets,
  processAutomationSpec,
  slotsToProcess,
} from './spec-processor'

export async function runSocialAutomation(
  runId: string,
  opts?: { onlySlot?: string },
): Promise<void> {
  const run = await prisma.socialAutomationRun.findUnique({
    where: { id: runId },
    include: {
      job: { include: { topic: true } },
      sitePage: true,
    },
  })

  if (!run?.jobId || !run.sitePage) {
    throw new Error(`Social automation run missing article context: ${runId}`)
  }

  if (opts?.onlySlot) {
    const reclaimed = await prisma.socialAutomationRun.updateMany({
      where: { id: runId, status: { in: ['ready', 'processing', 'completed', 'failed'] } },
      data: { status: 'processing', error: null },
    })
    if (reclaimed.count === 0) {
      logger.info({ runId }, '[social-automation] single-slot retry skipped — run not reclaimable')
      return
    }
  } else {
    const claim = await prisma.socialAutomationRun.updateMany({
      where: { id: runId, status: { in: ['pending', 'processing'] } },
      data: { status: 'processing', error: null },
    })
    if (claim.count === 0) {
      logger.info({ runId }, '[social-automation] run already finished or claimed elsewhere')
      return
    }
  }

  await ensureDefaultSocialPostSpecs(run.userId)

  const specs = await prisma.socialPostSpec.findMany({
    where: { userId: run.userId, enabled: true },
  })
  const specBySlot = new Map(specs.map((s) => [s.slotKey, s]))

  const settings = await prisma.settings.findUnique({ where: { userId: run.userId } })
  const timeZone = settings?.socialTimezone ?? 'America/New_York'
  const articleCtx = buildArticleContentContext(run.sitePage)
  const priorAssets = opts?.onlySlot ? await loadPriorAssets(runId) : new Map()

  const slots = slotsToProcess(opts?.onlySlot)
  const baseCtx: AutomationLogContext = {
    runId,
    userId: run.userId,
    jobId: run.jobId,
  }

  logger.info(
    {
      ...baseCtx,
      scheduledDate: run.scheduledDate,
      totalSlots: slots.length,
      onlySlot: opts?.onlySlot,
    },
    '[social-automation] run started',
  )

  if (!opts?.onlySlot) {
    await prisma.socialAutomationSpecResult.deleteMany({ where: { runId } })
    await prisma.post.deleteMany({ where: { automationRunId: runId, status: 'ready' } })
    await prisma.socialAutomationRun.update({
      where: { id: runId },
      data: { completedSpecs: 0, failedSpecs: 0, totalSpecs: SPEC_PROCESS_ORDER.length },
    })
  } else {
    const slots = slotsToProcess(opts.onlySlot)
    await prisma.post.deleteMany({
      where: { automationRunId: runId, slotKey: { in: slots }, status: 'ready' },
    })
  }

  for (const slotKey of slots) {
    const spec = specBySlot.get(slotKey)
    if (!spec) {
      await prisma.socialAutomationSpecResult.upsert({
        where: { runId_slotKey: { runId, slotKey } },
        create: { runId, slotKey, status: 'failed', error: 'Spec disabled or missing' },
        update: { status: 'failed', error: 'Spec disabled or missing' },
      })
      continue
    }

    await prisma.socialAutomationRun.update({
      where: { id: runId },
      data: { currentSpec: slotKey },
    })

    const result = await processAutomationSpec({
      run: { ...run, jobId: run.jobId },
      slotKey,
      spec,
      articleCtx,
      priorAssets,
      timeZone,
      logCtx: baseCtx,
    })

    if (result.assets) priorAssets.set(slotKey, result.assets)
  }

  await finalizeGenerationCounts(runId)
}

export { retryAutomationSpec } from './spec-processor'
export {
  dispatchSocialAutomationRun,
  dispatchSocialAutomationSlot,
} from './dispatch-run'
