import type { SocialAutomationRun, SocialPostSpec, SitePage } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { logger } from '../../lib/logger'
import { sendFailureAlert } from '../../lib/alerts'
import { SPEC_PROCESS_ORDER, type SpecSlotKey } from './default-specs'
import { buildArticleContentContext, type ArticleContentContext } from './content'
import { slotToUtc } from './schedule'
import { generateSpecAssets, type SpecAssets } from './generate-spec'
import { schedulePostsForSpec } from './schedule-posts'

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
}): Promise<{ ok: boolean; assets?: SpecAssets; error?: string }> {
  const { run, slotKey, spec, articleCtx, priorAssets, timeZone } = opts

  await prisma.socialAutomationSpecResult.upsert({
    where: { runId_slotKey: { runId: run.id, slotKey } },
    create: { runId: run.id, slotKey, status: 'pending' },
    update: { status: 'pending', error: null, postsCreated: 0 },
  })

  try {
    const assets = await generateSpecAssets({
      userId: run.userId,
      jobId: run.jobId!,
      slotKey,
      spec,
      articleCtx,
      priorAssets,
    })
    priorAssets.set(slotKey, assets)

    const scheduledAt = slotToUtc(run.scheduledDate, spec.timeHour, spec.timeMinute, timeZone)
    const scheduleResult = await schedulePostsForSpec({
      runId: run.id,
      userId: run.userId,
      jobId: run.jobId ?? undefined,
      slotKey,
      spec,
      assets,
      scheduledAt,
      articleCtx,
    })

    if (scheduleResult.failed > 0 && scheduleResult.scheduled === 0) {
      throw new Error(`All ${scheduleResult.failed} platform schedule(s) failed`)
    }

    await prisma.socialAutomationSpecResult.update({
      where: { runId_slotKey: { runId: run.id, slotKey } },
      data: {
        status: 'completed',
        postsCreated: scheduleResult.scheduled,
        assetsJson: assets as object,
        error: scheduleResult.failed > 0 ? `${scheduleResult.failed} platform(s) failed` : null,
      },
    })

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
      context: { runId: run.id, slotKey },
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
  })

  const counts = await prisma.socialAutomationSpecResult.groupBy({
    by: ['status'],
    where: { runId },
    _count: true,
  })
  const completed = counts.find((c) => c.status === 'completed')?._count ?? 0
  const failed = counts.find((c) => c.status === 'failed')?._count ?? 0

  await prisma.socialAutomationRun.update({
    where: { id: runId },
    data: {
      status: failed > 0 && completed === 0 ? 'failed' : 'completed',
      currentSpec: null,
      completedSpecs: completed,
      failedSpecs: failed,
      error: failed > 0 ? `${failed} spec(s) failed` : null,
    },
  })

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

export async function finalizeRunCounts(runId: string): Promise<void> {
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
      status: allFailed ? 'failed' : 'completed',
      currentSpec: null,
      completedSpecs: completed,
      failedSpecs: failed,
      totalSpecs: SPEC_PROCESS_ORDER.length,
      error: failed > 0 ? `${failed} of ${SPEC_PROCESS_ORDER.length} spec(s) failed` : null,
    },
  })

  if (failed > 0) {
    const run = await prisma.socialAutomationRun.findUnique({ where: { id: runId } })
    await sendFailureAlert({
      userId: run?.userId,
      jobId: run?.jobId ?? undefined,
      errorType: 'social_automation_run',
      message: `Social automation run finished with ${failed} failed spec(s)`,
      context: { runId, completed, failed },
    })
  }

  logger.info({ runId, completed, failed }, '[social-automation] run finished')
}
