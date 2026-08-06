import type PgBoss from 'pg-boss'
import { prisma } from '@omniply/shared'
import type { ResolvedAccount } from '@omniply/shared'
import { logger } from '../lib/logger'
import { createBatchFromDates, advanceBatch } from '../article-pipeline/content-batch'

/**
 * Azavea vertical cadence (vertical-platform plan V3e; azavea-gated by
 * design): clinics generate via payment-burst content batches, but the
 * billing-exempt azavea account has no payments — this daily cron creates
 * today's batch from the calendar instead (Mon/Wed/Fri slots; days without a
 * calendar topic no-op). Idempotent: createBatchFromDates skips days whose
 * topic already has a non-failed job.
 */
export async function azaveaCadenceHandler(_jobs: PgBoss.Job<object>[]): Promise<void> {
  const accounts = await prisma.account.findMany({
    where: { vertical: 'azavea', articleCalendarId: { not: null }, status: 'active' },
    select: { id: true, ownerUserId: true },
  })

  const today = new Date().toISOString().slice(0, 10)

  for (const account of accounts) {
    if (!account.ownerUserId) continue
    const members = await prisma.user.findMany({ where: { accountId: account.id }, select: { id: true } })
    const resolved: ResolvedAccount = {
      userId: account.ownerUserId,
      accountId: account.id,
      ownerUserId: account.ownerUserId,
      memberUserIds: members.map((m) => m.id),
    }
    try {
      const batch = await createBatchFromDates(resolved, [today])
      if (batch) {
        await advanceBatch(batch.batchId)
        logger.info({ accountId: account.id, today, batchId: batch.batchId }, '[azavea-cadence] batch created')
      }
    } catch (err) {
      logger.error({ accountId: account.id, today, err }, '[azavea-cadence] failed')
    }
  }
}
