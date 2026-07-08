import { prisma, brandSettingsForUser } from '@socioply/shared'
import { logger } from '../../lib/logger'
import type { AutomationLogContext } from './log-context'
import { ensureRunSlideCount } from './slide-count'
import { matrixForDay, storySlotsForDay, type DaySlot } from './weekly-matrix'
import { buildMatrixRunContext, processMatrixSlot } from './matrix-processor'
import { processStorySlot } from './story-processor'
import { finalizeGenerationCounts, updateGenerationProgress, loadPriorAssets } from './spec-processor'

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
  opts?: { onlySlot?: string; resumeIncomplete?: boolean },
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

  const feedEntries = slotEntriesForRun(kind, run.scheduledDate)
  const storySlots = storySlotsForDay(kind, feedEntries)

  // Story slot keys are S1/S2/S3; feed keys are P1/P2/P3.
  const onlyStory = opts?.onlySlot?.startsWith('S') ? opts.onlySlot : null
  const onlyFeed = opts?.onlySlot && !onlyStory ? opts.onlySlot : null

  let feedToRun = feedEntries
  let storiesToRun = storySlots
  if (onlyFeed) {
    feedToRun = feedEntries.filter((e) => e.slotKey === onlyFeed)
    storiesToRun = []
    if (feedToRun.length === 0) throw new Error(`Invalid slot key: ${onlyFeed}`)
  } else if (onlyStory) {
    feedToRun = []
    storiesToRun = storySlots.filter((s) => s.slotKey === onlyStory)
    if (storiesToRun.length === 0) throw new Error(`Invalid slot key: ${onlyStory}`)
  } else if (opts?.resumeIncomplete) {
    // Auto-recovery from the stale-run sweeper: skip slots that already
    // completed rather than throwing away their (Fal-billed) work and
    // regenerating from scratch. Only 'completed' rows are skipped — 'failed'
    // or missing rows are reprocessed.
    const completed = await prisma.socialAutomationSpecResult.findMany({
      where: { runId, status: 'completed' },
      select: { slotKey: true },
    })
    const completedKeys = new Set(completed.map((c) => c.slotKey))
    feedToRun = feedEntries.filter((e) => !completedKeys.has(e.slotKey))
    storiesToRun = storySlots.filter((s) => !completedKeys.has(s.slotKey))
  }

  const ctx = await buildMatrixRunContext(run)
  const brand = await brandSettingsForUser(run.userId)
  const diagramLogoVariant: 'light' | 'dark' = brand?.diagramLogoVariant === 'dark' ? 'dark' : 'light'
  const slideCount = await ensureRunSlideCount(runId, { reset: !opts?.onlySlot && !opts?.resumeIncomplete })

  const baseCtx: AutomationLogContext = { runId, userId: run.userId, jobId: run.jobId ?? undefined }
  logger.info(
    {
      ...baseCtx,
      kind,
      scheduledDate: run.scheduledDate,
      feed: feedToRun.length,
      stories: storiesToRun.length,
      onlySlot: opts?.onlySlot,
      resumeIncomplete: opts?.resumeIncomplete,
    },
    '[social-automation] run started',
  )

  if (opts?.onlySlot) {
    await prisma.post.deleteMany({
      where: { automationRunId: runId, slotKey: opts.onlySlot, status: 'ready' },
    })
  } else if (opts?.resumeIncomplete) {
    // Targeted cleanup: only wipe 'ready' posts for the slots being
    // reprocessed — completed slots (and their posts) are left untouched.
    const slotsToReprocess = [...feedToRun.map((e) => e.slotKey), ...storiesToRun.map((s) => s.slotKey)]
    if (slotsToReprocess.length > 0) {
      await prisma.post.deleteMany({
        where: { automationRunId: runId, slotKey: { in: slotsToReprocess }, status: 'ready' },
      })
    }
    await prisma.socialAutomationRun.update({
      where: { id: runId },
      data: { totalSpecs: feedEntries.length + storySlots.length },
    })
  } else {
    await prisma.socialAutomationSpecResult.deleteMany({ where: { runId } })
    await prisma.post.deleteMany({ where: { automationRunId: runId, status: 'ready' } })
    await prisma.socialAutomationRun.update({
      where: { id: runId },
      data: { completedSpecs: 0, failedSpecs: 0, totalSpecs: feedEntries.length + storySlots.length },
    })
  }

  // Feed posts first — stories reuse their generated assets.
  for (const entry of feedToRun) {
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

  // Story posts — companion to each feed post, reusing feed assets where needed.
  if (storiesToRun.length > 0) {
    const priorAssets = await loadPriorAssets(runId)
    for (const story of storiesToRun) {
      await prisma.socialAutomationRun.update({
        where: { id: runId },
        data: { currentSpec: story.slotKey },
      })

      await processStorySlot({ run, story, ctx, priorAssets, timeZone, logCtx: baseCtx })

      await updateGenerationProgress(runId)
    }
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
