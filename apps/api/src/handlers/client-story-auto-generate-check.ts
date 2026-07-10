/**
 * Narrow rollover cron: only accounts with `Settings.autoGenerateNextCycle`
 * enabled — most accounts stay on the on-demand path (content-plan.ts's
 * generate gate) and this does nothing for them at all. Every 15 minutes so
 * "as soon as the new monthly payment clears" holds until real Stripe
 * webhooks exist. See
 * .plans/client-story-review-mining.implementation-plan.md Phase 5.
 */
import { prisma } from '@socioply/shared'
import { logger } from '../lib/logger'
import { getBoss, QUEUES } from '../queues/index'
import { billingWindows } from '../article-pipeline/billing-window'
import type { ClientStorySpiderJobData } from './client-story-spider'

export async function clientStoryAutoGenerateCheckHandler(): Promise<void> {
  const flaggedOwnerUserIds = await prisma.settings.findMany({
    where: { autoGenerateNextCycle: true },
    select: { userId: true },
  })
  if (flaggedOwnerUserIds.length === 0) return

  const accounts = await prisma.account.findMany({
    where: {
      ownerUserId: { in: flaggedOwnerUserIds.map((s) => s.userId) },
      subscriptionStartedAt: { not: null },
    },
    select: { id: true, subscriptionStartedAt: true },
  })

  const boss = await getBoss()
  for (const account of accounts) {
    if (!account.subscriptionStartedAt) continue
    const cycleStart = billingWindows(account.subscriptionStartedAt).from

    try {
      const run = await prisma.clientStorySpiderRun.create({
        data: { accountId: account.id, cycleStart },
        select: { id: true },
      })
      await boss.send(
        QUEUES.CLIENT_STORY_SPIDER,
        { spiderRunId: run.id } satisfies ClientStorySpiderJobData,
        { singletonKey: `client-story-spider-${run.id}`, expireInSeconds: 3600 },
      )
      logger.info({ accountId: account.id, cycleStart }, '[client-story-auto-generate-check] spidering new cycle')
    } catch (err) {
      // Unique constraint on (accountId, cycleStart) = already have a run for this cycle —
      // harmless no-op, exactly the idempotent dedup this check relies on.
      const isDuplicate = err instanceof Error && 'code' in err && (err as { code?: string }).code === 'P2002'
      if (!isDuplicate) {
        logger.warn({ accountId: account.id, err }, '[client-story-auto-generate-check] failed to create run')
      }
    }
  }
}
