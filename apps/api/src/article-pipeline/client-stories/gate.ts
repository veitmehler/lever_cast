/**
 * Article-generation gate: waits on the current cycle's review-spider before
 * letting article generation proceed, with a 1-hour safety-valve timeout. Also
 * the on-demand trigger — the gate check itself creates the spider run if none
 * exists yet, so there's no dependency on the auto-generate cron having ticked
 * first. See .plans/client-story-review-mining.implementation-plan.md Phase 6.
 */
import { prisma } from '@socioply/shared'
import { getBoss, QUEUES } from '../../queues/index'
import type { ClientStorySpiderJobData } from '../../handlers/client-story-spider'

const SAFETY_VALVE_MS = 60 * 60 * 1000
export const ARTICLE_DOW = new Set([2, 4]) // Tue/Thu — mirrors the dashboard's cadence

export function hasArticleCadenceDate(dates: string[]): boolean {
  return dates.some((d) => ARTICLE_DOW.has(new Date(`${d}T00:00:00.000Z`).getUTCDay()))
}

async function getOrCreateSpiderRun(accountId: string, cycleStart: Date) {
  const existing = await prisma.clientStorySpiderRun.findUnique({
    where: { accountId_cycleStart: { accountId, cycleStart } },
  })
  if (existing) return existing
  try {
    const run = await prisma.clientStorySpiderRun.create({ data: { accountId, cycleStart } })
    const boss = await getBoss()
    await boss.send(
      QUEUES.CLIENT_STORY_SPIDER,
      { spiderRunId: run.id } satisfies ClientStorySpiderJobData,
      { singletonKey: `client-story-spider-${run.id}`, expireInSeconds: 3600 },
    )
    return run
  } catch (err) {
    // Lost the create race (the auto-generate cron, or another concurrent request) — the
    // unique (accountId, cycleStart) constraint means a row now exists either way.
    const isDuplicate = err instanceof Error && 'code' in err && (err as { code?: string }).code === 'P2002'
    if (!isDuplicate) throw err
    return prisma.clientStorySpiderRun.findUniqueOrThrow({ where: { accountId_cycleStart: { accountId, cycleStart } } })
  }
}

export type StorySpiderStatus = 'completed' | 'running' | 'not_configured'

/** Read-only status for GET /content-plan — never creates a run (that only happens on an
 * actual generate attempt), so an account that's never tried to generate stays 'not_configured'
 * or shows nothing running, without spidering being triggered just by loading the dashboard. */
export async function readStorySpiderStatus(accountId: string, cycleStart: Date): Promise<StorySpiderStatus> {
  const brand = await prisma.brandSettings.findFirst({
    where: { user: { accountId } },
    select: { googleBusinessProfileUrl: true },
  })
  if (!brand?.googleBusinessProfileUrl?.trim()) return 'not_configured'

  const run = await prisma.clientStorySpiderRun.findUnique({
    where: { accountId_cycleStart: { accountId, cycleStart } },
  })
  if (!run) return 'not_configured' // no attempt yet this cycle — nothing to show as "running"
  if (run.status === 'completed') return 'completed'
  if (run.status === 'running' && Date.now() - run.startedAt.getTime() < SAFETY_VALVE_MS) return 'running'
  return 'completed' // failed, or past the safety valve — treat as clear to proceed
}

/**
 * Returns a rejection message if article generation should wait, or null if it may proceed.
 * Only ever called when the requested batch contains at least one article-cadence date and the
 * account has a confirmed GBP URL — callers should skip this entirely otherwise.
 */
export async function checkArticleGenerationGate(accountId: string, cycleStart: Date): Promise<string | null> {
  const run = await getOrCreateSpiderRun(accountId, cycleStart)
  if (run.status !== 'running') return null // completed or failed — proceed with best-available
  if (Date.now() - run.startedAt.getTime() >= SAFETY_VALVE_MS) return null // safety valve elapsed
  return 'Client stories are being refreshed for this billing cycle — this usually takes a few minutes; try again shortly.'
}
