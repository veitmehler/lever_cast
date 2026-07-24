import { prisma } from '@omniply/shared'
import { Sentry } from '../lib/sentry'
import { logger } from '../lib/logger'
import { QUEUES } from '../queues/index'
import { PROCESSING_STUCK_MS, MAX_AUTO_RECOVER_ATTEMPTS } from './social-automation-safety'

// Genuinely new signals the per-run sweeper (social-automation-safety.ts)
// doesn't surface: backlog depth, oldest-job age, and whether multiple runs
// are stuck AT ONCE (a systemic issue, vs. the sweeper's one-run-at-a-time
// alerts). Mirrors handlers/pg-monitor.ts's snapshot-log + threshold-alert shape.
const QUEUE_DEPTH_WARN = 5
const QUEUE_DEPTH_CRIT = 15
// SOCIAL_GENERATE_EXPIRE_SECONDS is 30 min — a job older than that should
// already have been reclaimed by pg-boss; still being here past it signals
// the expire mechanism itself may not be working.
const OLDEST_JOB_WARN_SEC = 20 * 60
const OLDEST_JOB_CRIT_SEC = 30 * 60
// A single stuck run is already alerted per-run by the sweeper; escalate here
// only when several are stuck simultaneously (a systemic, not one-off, issue).
const STUCK_RUNS_CRIT = 3

export async function socialGenerationHealthHandler(): Promise<void> {
  const jobRows = await prisma.$queryRawUnsafe<Array<{ state: string; n: number; oldest: Date }>>(
    `select state, count(*)::int as n, min(created_on) as oldest
     from pgboss.job where name = $1 and state in ('created','active')
     group by state`,
    QUEUES.SOCIAL_GENERATE,
  )
  const queueDepth = jobRows.reduce((sum, r) => sum + r.n, 0)
  const oldest = jobRows.reduce<Date | null>((min, r) => (!min || r.oldest < min ? r.oldest : min), null)
  const oldestJobAgeSec = oldest ? Math.floor((Date.now() - oldest.getTime()) / 1000) : 0

  const stuckCutoff = new Date(Date.now() - PROCESSING_STUCK_MS)
  const stuckRunCount = await prisma.socialAutomationRun.count({
    where: { status: 'processing', updatedAt: { lt: stuckCutoff } },
  })

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const exhaustedLast24h = await prisma.socialAutomationRun.count({
    where: { status: 'failed', autoRecoverAttempts: { gte: MAX_AUTO_RECOVER_ATTEMPTS }, updatedAt: { gt: since24h } },
  })

  logger.info(
    { queueDepth, oldestJobAgeSec, stuckRunCount, exhaustedLast24h, byState: jobRows },
    '[social-health] snapshot',
  )

  if (queueDepth >= QUEUE_DEPTH_CRIT) {
    Sentry.captureMessage(`SOCIAL_GENERATE backlog CRITICAL: ${queueDepth} jobs queued/active`, 'error')
  } else if (queueDepth >= QUEUE_DEPTH_WARN) {
    Sentry.captureMessage(`SOCIAL_GENERATE backlog HIGH: ${queueDepth} jobs queued/active`, 'warning')
  }

  if (oldestJobAgeSec >= OLDEST_JOB_CRIT_SEC) {
    Sentry.captureMessage(
      `SOCIAL_GENERATE has a job ${Math.floor(oldestJobAgeSec / 60)}min old — past its expiry window, pg-boss expiry may not be reclaiming it`,
      'error',
    )
  } else if (oldestJobAgeSec >= OLDEST_JOB_WARN_SEC) {
    Sentry.captureMessage(`SOCIAL_GENERATE has a job ${Math.floor(oldestJobAgeSec / 60)}min old`, 'warning')
  }

  if (stuckRunCount >= STUCK_RUNS_CRIT) {
    Sentry.captureMessage(
      `${stuckRunCount} social automation runs stuck simultaneously — likely a systemic issue, not one flaky run`,
      'error',
    )
  }
}
