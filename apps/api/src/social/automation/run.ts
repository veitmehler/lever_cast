import { prisma } from '../../lib/prisma'
import { logger } from '../../lib/logger'
import { SPEC_PROCESS_ORDER } from './default-specs'
import { ensureDefaultSocialPostSpecs } from './ensure-specs'
import { buildArticleContentContext } from './content'
import { slotToUtc } from './schedule'
import { generateSpecAssets, type SpecAssets } from './generate-spec'
import { schedulePostsForSpec } from './schedule-posts'

export async function runSocialAutomation(runId: string): Promise<void> {
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

  const claim = await prisma.socialAutomationRun.updateMany({
    where: { id: runId, status: { in: ['pending', 'processing'] } },
    data: { status: 'processing', error: null },
  })
  if (claim.count === 0) {
    logger.info({ runId }, '[social-automation] run already finished or claimed elsewhere')
    return
  }

  await ensureDefaultSocialPostSpecs(run.userId)

  const specs = await prisma.socialPostSpec.findMany({
    where: { userId: run.userId, enabled: true },
  })
  const specBySlot = new Map(specs.map((s) => [s.slotKey, s]))

  const settings = await prisma.settings.findUnique({ where: { userId: run.userId } })
  const timeZone = settings?.socialTimezone ?? 'America/New_York'
  const articleCtx = buildArticleContentContext(run.sitePage)
  const priorAssets = new Map<string, SpecAssets>()

  await prisma.socialAutomationRun.update({
    where: { id: runId },
    data: { completedSpecs: 0, failedSpecs: 0, totalSpecs: SPEC_PROCESS_ORDER.length },
  })

  for (const slotKey of SPEC_PROCESS_ORDER) {
    const spec = specBySlot.get(slotKey)
    if (!spec) {
      await prisma.socialAutomationRun.update({
        where: { id: runId },
        data: { failedSpecs: { increment: 1 } },
      })
      continue
    }

    await prisma.socialAutomationRun.update({
      where: { id: runId },
      data: { currentSpec: slotKey },
    })

    try {
      const assets = await generateSpecAssets({
        userId: run.userId,
        jobId: run.jobId,
        slotKey,
        spec,
        articleCtx,
        priorAssets,
      })
      priorAssets.set(slotKey, assets)

      const scheduledAt = slotToUtc(run.scheduledDate, spec.timeHour, spec.timeMinute, timeZone)
      await schedulePostsForSpec({
        runId,
        userId: run.userId,
        slotKey,
        spec,
        assets,
        scheduledAt,
        articleCtx,
      })

      await prisma.socialAutomationRun.update({
        where: { id: runId },
        data: { completedSpecs: { increment: 1 } },
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      logger.error({ runId, slotKey, err }, '[social-automation] spec failed')

      await prisma.socialAutomationRun.update({
        where: { id: runId },
        data: { failedSpecs: { increment: 1 } },
      })

      await prisma.errorLog
        .create({
          data: {
            userId: run.userId,
            jobId: run.jobId,
            errorType: 'social_automation_spec',
            errorMessage: `Slot ${slotKey}: ${message}`,
            context: { runId, slotKey },
          },
        })
        .catch(() => {})
    }
  }

  const final = await prisma.socialAutomationRun.findUnique({ where: { id: runId } })
  const allFailed = (final?.completedSpecs ?? 0) === 0 && (final?.failedSpecs ?? 0) > 0

  await prisma.socialAutomationRun.update({
    where: { id: runId },
    data: {
      status: allFailed ? 'failed' : 'completed',
      currentSpec: null,
      error:
        (final?.failedSpecs ?? 0) > 0
          ? `${final?.failedSpecs} of ${final?.totalSpecs} spec(s) failed`
          : null,
    },
  })

  logger.info(
    {
      runId,
      completed: final?.completedSpecs,
      failed: final?.failedSpecs,
    },
    '[social-automation] run finished',
  )
}
