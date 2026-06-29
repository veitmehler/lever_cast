import { prisma, brandSettingsForUser } from '@socioply/shared'
import { logger } from '../../lib/logger'
import type { AutomationLogContext } from './log-context'
import { ensureRunSlideCount } from './slide-count'
import { matrixForDay, type DaySlot } from './weekly-matrix'
import { buildMatrixRunContext, processMatrixSlot } from './matrix-processor'
import { finalizeGenerationCounts, updateGenerationProgress } from './spec-processor'

/** scheduledDate (YYYY-MM-DD, user tz) → ISO weekday (1=Mon … 7=Sun). */
function isoWeekdayOf(scheduledDate: string): number {
  const [y, m, d] = scheduledDate.split('-').map(Number)
  const dow = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1)).getUTCDay() // 0=Sun..6=Sat
  return dow === 0 ? 7 : dow
}

interface SlotEntry {
  slotKey: string
  daySlot: DaySlot
}

/** The 3 matrix slots for a run, keyed P1/P2/P3 in time order. */
function slotEntriesForRun(kind: 'article' | 'newsletter', scheduledDate: string): SlotEntry[] {
  const slots = matrixForDay(kind, isoWeekdayOf(scheduledDate))
  return slots.map((daySlot, i) => ({ slotKey: `P${i + 1}`, daySlot }))
}

export async function runSocialAutomation(
  runId: string,
  opts?: { onlySlot?: string },
): Promise<void> {
  const run = await prisma.socialAutomationRun.findUnique({
    where: { id: runId },
    include: { sitePage: true },
  })

  if (!run || (!run.jobId && !run.newsletterId)) {
    throw new Error(`Social automation run missing content source: ${runId}`)
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

  const settings = await prisma.settings.findUnique({ where: { userId: run.userId } })
  const timeZone = settings?.socialTimezone ?? 'America/New_York'
  const kind: 'article' | 'newsletter' = run.newsletterId ? 'newsletter' : 'article'

  let entries = slotEntriesForRun(kind, run.scheduledDate)
  if (opts?.onlySlot) {
    entries = entries.filter((e) => e.slotKey === opts.onlySlot)
    if (entries.length === 0) throw new Error(`Invalid slot key: ${opts.onlySlot}`)
  }

  const ctx = await buildMatrixRunContext(run)
  const brand = await brandSettingsForUser(run.userId)
  const diagramLogoVariant: 'light' | 'dark' = brand?.diagramLogoVariant === 'dark' ? 'dark' : 'light'
  const slideCount = await ensureRunSlideCount(runId, { reset: !opts?.onlySlot })

  const baseCtx: AutomationLogContext = { runId, userId: run.userId, jobId: run.jobId ?? undefined }
  logger.info(
    { ...baseCtx, kind, scheduledDate: run.scheduledDate, slots: entries.length, onlySlot: opts?.onlySlot },
    '[social-automation] run started',
  )

  if (!opts?.onlySlot) {
    await prisma.socialAutomationSpecResult.deleteMany({ where: { runId } })
    await prisma.post.deleteMany({ where: { automationRunId: runId, status: 'ready' } })
    await prisma.socialAutomationRun.update({
      where: { id: runId },
      data: { completedSpecs: 0, failedSpecs: 0, totalSpecs: entries.length },
    })
  } else {
    await prisma.post.deleteMany({
      where: { automationRunId: runId, slotKey: opts.onlySlot, status: 'ready' },
    })
  }

  for (const entry of entries) {
    await prisma.socialAutomationRun.update({
      where: { id: runId },
      data: { currentSpec: entry.slotKey },
    })

    await processMatrixSlot({
      run,
      slotKey: entry.slotKey,
      daySlot: entry.daySlot,
      ctx,
      timeZone,
      slideCount,
      diagramLogoVariant,
      logCtx: baseCtx,
    })

    await updateGenerationProgress(runId)
  }

  await finalizeGenerationCounts(runId)
}

/** Re-run a single matrix slot (P1/P2/P3) — used by the admin "retry slot" action. */
export async function retryAutomationSpec(runId: string, slotKey: string): Promise<void> {
  await prisma.socialAutomationRun.update({
    where: { id: runId },
    data: { status: 'processing', currentSpec: slotKey },
  })
  await runSocialAutomation(runId, { onlySlot: slotKey })
  const result = await prisma.socialAutomationSpecResult.findUnique({
    where: { runId_slotKey: { runId, slotKey } },
  })
  if (result?.status === 'failed') throw new Error(result.error ?? 'Spec retry failed')
}

export {
  dispatchSocialAutomationRun,
  dispatchSocialAutomationSlot,
} from './dispatch-run'
