/**
 * Client-story review-spider job: capture → fingerprint → triage, then check
 * whether this account wants the whole new cycle auto-generated. Enqueued
 * either by the narrow auto-generate cron (flagged accounts, zero user
 * interaction) or by the on-demand path inside POST /content-plan/generate
 * (everyone else) — both converge on this one job. See
 * .plans/client-story-review-mining.implementation-plan.md Phases 5-6.
 */
import PgBoss from 'pg-boss'
import { prisma, type ResolvedAccount } from '@omniply/shared'
import { accountMemberIds } from '@omniply/shared'
import { logger } from '../lib/logger'
import { sendFailureAlert } from '../lib/alerts'
import { billingWindows } from '../article-pipeline/billing-window'
import { createBatchFromDates, advanceBatch } from '../article-pipeline/content-batch'
import { captureReviews } from '../article-pipeline/client-stories/capture'
import { persistNewReviews } from '../article-pipeline/client-stories/fingerprint'
import { triagePendingReviews } from '../article-pipeline/client-stories/triage'

export interface ClientStorySpiderJobData {
  spiderRunId: string
}

function dateRangeStrings(from: Date, to: Date): string[] {
  const out: string[] = []
  for (let ts = from.getTime(); ts <= to.getTime(); ts += 86_400_000) {
    out.push(new Date(ts).toISOString().slice(0, 10))
  }
  return out
}

async function resolveAccount(accountId: string): Promise<ResolvedAccount | null> {
  const account = await prisma.account.findUnique({ where: { id: accountId }, select: { ownerUserId: true } })
  const memberUserIds = await accountMemberIds(accountId)
  const ownerUserId = account?.ownerUserId ?? memberUserIds[0]
  if (!ownerUserId) return null
  return { userId: ownerUserId, accountId, ownerUserId, memberUserIds }
}

/** For a flagged account, auto-generate every date in the new cycle's production window —
 * the same createBatchFromDates/advanceBatch calls "Generate selected" already uses. Only
 * dates that actually resolve to planned content produce a batch item; the rest are skipped
 * automatically by createBatchFromDates itself. */
async function maybeAutoGenerateCycle(accountId: string, cycleStart: Date, cycleEnd: Date): Promise<void> {
  const resolved = await resolveAccount(accountId)
  if (!resolved) return

  const dates = dateRangeStrings(cycleStart, cycleEnd)
  const created = await createBatchFromDates(resolved, dates)
  if (!created) {
    logger.info({ accountId }, '[client-story-spider] auto-generate: nothing planned for the new cycle')
    return
  }
  await advanceBatch(created.batchId)
  logger.info(
    { accountId, batchId: created.batchId, itemCount: created.itemCount },
    '[client-story-spider] auto-generated the new cycle',
  )
}

export async function clientStorySpiderHandler(jobs: PgBoss.Job<ClientStorySpiderJobData>[]): Promise<void> {
  for (const job of jobs) {
    const { spiderRunId } = job.data
    const run = await prisma.clientStorySpiderRun.findUnique({ where: { id: spiderRunId } })
    if (!run) {
      logger.warn({ spiderRunId }, '[client-story-spider] run not found — skipping')
      continue
    }
    if (run.status !== 'running') {
      logger.info({ spiderRunId, status: run.status }, '[client-story-spider] already settled — skipping')
      continue
    }

    logger.info({ spiderRunId, accountId: run.accountId, pgBossJobId: job.id }, '[client-story-spider] starting')
    try {
      const brand = await prisma.brandSettings.findFirst({
        where: { user: { accountId: run.accountId } },
        select: { googleBusinessProfileUrl: true },
      })
      const gbpUrl = brand?.googleBusinessProfileUrl?.trim()
      if (!gbpUrl) {
        logger.info({ spiderRunId }, '[client-story-spider] no GBP URL configured — nothing to spider')
      } else {
        const reviews = await captureReviews(gbpUrl)
        const newIds = await persistNewReviews(run.accountId, reviews)
        await triagePendingReviews(run.accountId, newIds)
        logger.info(
          { spiderRunId, accountId: run.accountId, captured: reviews.length, new: newIds.length },
          '[client-story-spider] completed',
        )
      }

      await prisma.clientStorySpiderRun.update({
        where: { id: spiderRunId },
        data: { status: 'completed', completedAt: new Date() },
      })

      // Chain into full-cycle auto-generation if this account has opted in — regardless
      // of whether this run was started by the auto-generate cron or an on-demand click.
      const owner = await prisma.account.findUnique({ where: { id: run.accountId }, select: { ownerUserId: true } })
      const settings = owner?.ownerUserId
        ? await prisma.settings.findUnique({ where: { userId: owner.ownerUserId }, select: { autoGenerateNextCycle: true } })
        : null
      if (settings?.autoGenerateNextCycle) {
        const acct = await prisma.account.findUnique({
          where: { id: run.accountId },
          select: { subscriptionStartedAt: true },
        })
        if (acct?.subscriptionStartedAt) {
          const w = billingWindows(acct.subscriptionStartedAt)
          await maybeAutoGenerateCycle(run.accountId, w.from, w.executableUntil)
        }
      }
    } catch (err) {
      logger.error({ spiderRunId, accountId: run.accountId, err }, '[client-story-spider] failed')
      await prisma.clientStorySpiderRun
        .update({ where: { id: spiderRunId }, data: { status: 'failed', completedAt: new Date() } })
        .catch(() => {})
      const owner = await prisma.account.findUnique({ where: { id: run.accountId }, select: { ownerUserId: true } })
      if (owner?.ownerUserId) {
        await sendFailureAlert({
          userId: owner.ownerUserId,
          errorType: 'client_story_spider_failed',
          message: err instanceof Error ? err.message : String(err),
          context: { spiderRunId, accountId: run.accountId },
        }).catch(() => {})
      }
      // No throw: a failed spider shouldn't retry-storm — the next cycle's rollover (or the
      // next on-demand generate attempt, once the 1-hour safety valve elapses) is the recovery path.
    }
  }
}
