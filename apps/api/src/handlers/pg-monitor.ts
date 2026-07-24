import { prisma } from '@omniply/shared'
import { Sentry } from '../lib/sentry'
import { logger } from '../lib/logger'

const WARN_THRESHOLD = 16
const CRIT_THRESHOLD = 20

export async function pgMonitorHandler() {
  const rows = await prisma.$queryRaw<Array<{ state: string | null; count: number }>>`
    SELECT state, count(*)::int AS count
    FROM pg_stat_activity
    WHERE datname = 'socioply'
    GROUP BY state
  `

  const summary = Object.fromEntries(rows.map((r: { state: string | null; count: number }) => [r.state ?? 'null', r.count]))
  const active = rows.find((r: { state: string | null }) => r.state === 'active')?.count ?? 0
  const total = rows.reduce((acc: number, r: { count: number }) => acc + r.count, 0)

  logger.info({ pg: summary, active, total }, 'pg connection snapshot')

  if (active >= CRIT_THRESHOLD) {
    Sentry.captureMessage(
      `pg active connections CRITICAL: ${active} (threshold: ${CRIT_THRESHOLD})`,
      'error',
    )
  } else if (active >= WARN_THRESHOLD) {
    Sentry.captureMessage(
      `pg active connections HIGH: ${active} (threshold: ${WARN_THRESHOLD})`,
      'warning',
    )
  }
}
