/**
 * Daily account lifecycle clock (multi-tenancy plan Phase C).
 *
 * - paused for > 60 days  → cancelled (statusChangedAt resets: the 90-day
 *   retention clock starts here). User policy: an unpaid account gets two
 *   billing cycles to recover before it counts as churned.
 * - cancelled for > 90 days → enqueue the deletion job. Hard deletion is
 *   env-gated (ACCOUNT_AUTO_DELETE_ENABLED=true); until armed, the clock
 *   enqueues a DRY RUN so the admin sees exactly what WOULD be deleted.
 * - billingExempt (comp) accounts are exempt from both clocks.
 *
 * Every transition is audit-visible via sendFailureAlert (errorLog + admin
 * email) — nothing irreversible happens silently.
 */
import type PgBoss from 'pg-boss'
import { prisma } from '@socioply/shared'
import { logger } from '../lib/logger'
import { sendFailureAlert } from '../lib/alerts'
import { getBoss, QUEUES } from '../queues/index'
import type { AccountDeleteJobData } from './account-delete'

const MS_PER_DAY = 86_400_000
export const PAUSE_TO_CANCEL_DAYS = 60
export const CANCEL_TO_DELETE_DAYS = 90

export async function accountLifecycleClockHandler(_jobs: PgBoss.Job<object>[]): Promise<void> {
  const now = Date.now()

  // paused > 60d → cancelled
  const stalePaused = await prisma.account.findMany({
    where: {
      status: 'paused',
      billingExempt: false,
      statusChangedAt: { lt: new Date(now - PAUSE_TO_CANCEL_DAYS * MS_PER_DAY) },
    },
    select: { id: true, name: true, statusChangedAt: true },
  })
  for (const acct of stalePaused) {
    await prisma.account.update({
      where: { id: acct.id },
      data: { status: 'cancelled', statusChangedAt: new Date() },
    })
    logger.warn({ accountId: acct.id }, '[lifecycle-clock] paused > 60d — account cancelled')
    await sendFailureAlert({
      errorType: 'account-lifecycle',
      message: `Account ${acct.name ?? acct.id} auto-cancelled after ${PAUSE_TO_CANCEL_DAYS} days paused (unpaid). 90-day retention clock started.`,
      context: { accountId: acct.id, pausedSince: acct.statusChangedAt },
    }).catch(() => {})
  }

  // cancelled > 90d → enqueue deletion (dry-run unless explicitly armed)
  const staleCancelled = await prisma.account.findMany({
    where: {
      status: 'cancelled',
      billingExempt: false,
      statusChangedAt: { lt: new Date(now - CANCEL_TO_DELETE_DAYS * MS_PER_DAY) },
    },
    select: { id: true, name: true, statusChangedAt: true },
  })
  const autoDeleteArmed = process.env.ACCOUNT_AUTO_DELETE_ENABLED === 'true'
  const boss = await getBoss()
  for (const acct of staleCancelled) {
    const data: AccountDeleteJobData = {
      accountId: acct.id,
      reason: 'auto-90d',
      dryRun: !autoDeleteArmed,
    }
    await boss.send(QUEUES.ACCOUNT_DELETE, data, {
      singletonKey: `account-delete-${acct.id}`,
      expireInSeconds: 3600,
    })
    logger.warn(
      { accountId: acct.id, dryRun: !autoDeleteArmed },
      '[lifecycle-clock] cancelled > 90d — deletion enqueued',
    )
  }
}
