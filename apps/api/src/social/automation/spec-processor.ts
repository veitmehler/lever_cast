import type { SocialAutomationRun, SocialPostSpec, SitePage } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { logger } from '../../lib/logger'
import { sendFailureAlert } from '../../lib/alerts'
import { deleteS3Keys } from '../../lib/storage'
import { SPEC_PROCESS_ORDER, type SpecSlotKey } from './default-specs'
import { buildArticleContentContext, type ArticleContentContext } from './content'
import { ensureFutureScheduleDate, slotToUtc } from './schedule'
import { generateSpecAssets, type SpecAssets } from './generate-spec'
import { buildPostsForSpec } from './schedule-posts'
import { ensureRunSlideCount } from './slide-count'
import { type AutomationLogContext, withSlotKey } from './log-context'

export function assetsFromJson(json: unknown): SpecAssets | null {
  if (!json || typeof json !== 'object') return null
  const o = json as Record<string, unknown>
  return {
    postType: String(o.postType ?? ''),
    imageUrl: typeof o.imageUrl === 'string' ? o.imageUrl : undefined,
    mediaUrls: Array.isArray(o.mediaUrls) ? (o.mediaUrls as string[]) : undefined,
    videoUrl: typeof o.videoUrl === 'string' ? o.videoUrl : undefined,
    title: typeof o.title === 'string' ? o.title : undefined,
  }
}

export async function loadPriorAssets(runId: string): Promise<Map<string, SpecAssets>> {
  const results = await prisma.socialAutomationSpecResult.findMany({
    where: { runId, status: 'completed' },
  })
  const map = new Map<string, SpecAssets>()
  for (const r of results) {
    const assets = assetsFromJson(r.assetsJson)
    if (assets) map.set(r.slotKey, assets)
  }
  return map
}

export async function processAutomationSpec(opts: {
  run: SocialAutomationRun & { sitePage: SitePage | null; jobId: string | null }
  slotKey: string
  spec: SocialPostSpec
  articleCtx: ArticleContentContext
  priorAssets: Map<string, SpecAssets>
  timeZone: string
  slideCount: number
  logCtx: AutomationLogContext
}): Promise<{ ok: boolean; assets?: SpecAssets; error?: string }> {
  const { run, slotKey, spec, articleCtx, priorAssets, timeZone, slideCount, logCtx } = opts
  const specCtx = withSlotKey(logCtx, slotKey)

  logger.info(
    { ...specCtx, postType: spec.postType },
    '[social-automation] spec started',
  )

  await prisma.socialAutomationSpecResult.upsert({
    where: { runId_slotKey: { runId: run.id, slotKey } },
    create: { runId: run.id, slotKey, status: 'pending' },
    update: { status: 'pending', error: null, postsCreated: 0, approvedAt: null },
  })

  // Snapshot existing media records for this slot so we can delete them from S3
  // and the DB after a successful regeneration. We do this before generating new
  // assets so that even if both old and new files share the same folder prefix,
  // we only delete the specific keys that existed before this run.
  const s3SlotPrefix = run.jobId
    ? `social/${run.userId}/${run.jobId}-${slotKey}/`
    : null
  const oldMediaRecords = s3SlotPrefix
    ? await prisma.media.findMany({
        where: { s3Key: { startsWith: s3SlotPrefix } },
        select: { id: true, s3Key: true },
      })
    : []

  try {
    const assets = await generateSpecAssets({
      userId: run.userId,
      jobId: run.jobId!,
      slotKey,
      spec,
      articleCtx,
      priorAssets,
      slideCount,
      logCtx: specCtx,
    })
    priorAssets.set(slotKey, assets)

    const scheduledAt = ensureFutureScheduleDate(
      slotToUtc(run.scheduledDate, spec.timeHour, spec.timeMinute, timeZone),
    )
    const buildResult = await buildPostsForSpec({
      logCtx: specCtx,
      spec,
      assets,
      scheduledAt,
      articleCtx,
    })

    if (buildResult.failed > 0 && buildResult.built === 0) {
      throw new Error(`All ${buildResult.failed} platform build(s) failed`)
    }

    logger.info(
      {
        ...specCtx,
        built: buildResult.built,
        skipped: buildResult.skipped,
        failed: buildResult.failed,
      },
      '[social-automation] spec preview ready',
    )

    await prisma.socialAutomationSpecResult.update({
      where: { runId_slotKey: { runId: run.id, slotKey } },
      data: {
        status: 'completed',
        postsCreated: buildResult.built,
        assetsJson: assets as object,
        previewJson: buildResult.preview as object,
        error: buildResult.failed > 0 ? `${buildResult.failed} platform(s) failed` : null,
      },
    })

    // Clean up previous generation's S3 objects and Media records now that the
    // new assets are committed to the DB. Best-effort — a failure here doesn't
    // affect the user-visible result.
    if (oldMediaRecords.length > 0) {
      await deleteS3Keys(oldMediaRecords.map((r) => r.s3Key)).catch((err) =>
        logger.warn({ ...specCtx, err }, '[social-automation] old S3 cleanup failed (non-fatal)'),
      )
      await prisma.media
        .deleteMany({ where: { id: { in: oldMediaRecords.map((r) => r.id) } } })
        .catch((err) =>
          logger.warn({ ...specCtx, err }, '[social-automation] old Media DB cleanup failed (non-fatal)'),
        )
      logger.info(
        { ...specCtx, deletedCount: oldMediaRecords.length },
        '[social-automation] cleaned up old slot media',
      )
    }

    return { ok: true, assets }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await prisma.socialAutomationSpecResult.update({
      where: { runId_slotKey: { runId: run.id, slotKey } },
      data: { status: 'failed', error: message },
    })
    await sendFailureAlert({
      userId: run.userId,
      jobId: run.jobId ?? undefined,
      errorType: 'social_automation_spec',
      message: `Slot ${slotKey}: ${message}`,
      context: { ...specCtx },
    })
    return { ok: false, error: message }
  }
}

export async function retryAutomationSpec(runId: string, slotKey: string): Promise<void> {
  const run = await prisma.socialAutomationRun.findUnique({
    where: { id: runId },
    include: { sitePage: true },
  })
  if (!run?.jobId || !run.sitePage) {
    throw new Error('Automation run not found')
  }

  const spec = await prisma.socialPostSpec.findUnique({
    where: { userId_slotKey: { userId: run.userId, slotKey } },
  })
  if (!spec?.enabled) throw new Error(`Spec ${slotKey} is not configured`)

  const settings = await prisma.settings.findUnique({ where: { userId: run.userId } })
  const timeZone = settings?.socialTimezone ?? 'America/New_York'
  const articleCtx = buildArticleContentContext(run.sitePage)
  const priorAssets = await loadPriorAssets(run.id)
  const slideCount = await ensureRunSlideCount(runId)
  const logCtx: AutomationLogContext = {
    runId: run.id,
    userId: run.userId,
    jobId: run.jobId,
  }

  await prisma.post.deleteMany({
    where: { automationRunId: runId, slotKey, status: 'ready' },
  })

  await prisma.socialAutomationRun.update({
    where: { id: runId },
    data: { status: 'processing', currentSpec: slotKey },
  })

  const result = await processAutomationSpec({
    run: { ...run, jobId: run.jobId },
    slotKey,
    spec,
    articleCtx,
    priorAssets,
    timeZone,
    slideCount,
    logCtx,
  })

  await finalizeGenerationCounts(runId)

  if (!result.ok) throw new Error(result.error ?? 'Spec retry failed')
}

export function slotsToProcess(onlySlot?: string): SpecSlotKey[] {
  if (onlySlot) {
    if (!(SPEC_PROCESS_ORDER as readonly string[]).includes(onlySlot)) {
      throw new Error(`Invalid slot key: ${onlySlot}`)
    }
    return [onlySlot as SpecSlotKey]
  }
  return [...SPEC_PROCESS_ORDER]
}

export async function finalizeGenerationCounts(runId: string): Promise<void> {
  const counts = await prisma.socialAutomationSpecResult.groupBy({
    by: ['status'],
    where: { runId },
    _count: true,
  })
  const completed = counts.find((c) => c.status === 'completed')?._count ?? 0
  const failed = counts.find((c) => c.status === 'failed')?._count ?? 0
  const allFailed = completed === 0 && failed > 0

  await prisma.socialAutomationRun.update({
    where: { id: runId },
    data: {
      status: allFailed ? 'failed' : 'ready',
      currentSpec: null,
      completedSpecs: completed,
      failedSpecs: failed,
      totalSpecs: SPEC_PROCESS_ORDER.length,
      error: failed > 0 ? `${failed} of ${SPEC_PROCESS_ORDER.length} spec(s) failed` : null,
    },
  })

  const run = await prisma.socialAutomationRun.findUnique({ where: { id: runId } })
  const status = allFailed ? 'failed' : 'ready'
  const runCtx: AutomationLogContext = {
    runId,
    userId: run?.userId ?? '',
    jobId: run?.jobId ?? undefined,
  }

  if (failed > 0) {
    await sendFailureAlert({
      userId: run?.userId,
      jobId: run?.jobId ?? undefined,
      errorType: 'social_automation_run',
      message: `Social automation generation finished with ${failed} failed spec(s)`,
      context: { ...runCtx, completed, failed },
    })
  }

  logger.info(
    {
      ...runCtx,
      completed,
      failed,
      status,
    },
    '[social-automation] generation finished — awaiting approval',
  )
}
