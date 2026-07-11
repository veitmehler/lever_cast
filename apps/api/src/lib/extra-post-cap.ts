/**
 * Weekly cap on user-requested (dashboard) social posts — cost control for
 * multi-tenancy (.plans/production-throughput.implementation-plan.md Phase 2).
 *
 * Counting basis: `drafts` rows created in the rolling 7-day window. Dashboard
 * ad-hoc posts are the only thing that creates drafts (the automated cadence
 * writes `posts` with no draft), so no origin flag is needed. The Draft model
 * is account-scoped in the shared Prisma extension, so a userId filter counts
 * the whole account. Regenerating content for an existing draft creates no new
 * draft and never counts.
 */
import { prisma } from '@socioply/shared'

const WINDOW_MS = 7 * 24 * 60 * 60 * 1000
const DEFAULT_CAP = 3

export interface ExtraPostQuota {
  cap: number
  used: number
  remaining: number
  /** When the oldest counted post rolls out of the window (null when unused). */
  resetsAt: Date | null
}

export async function weeklyExtraPostQuota(userId: string): Promise<ExtraPostQuota> {
  const settings = await prisma.platformSettings.findUnique({
    where: { id: 'singleton' },
    select: { weeklyExtraPostCap: true },
  })
  const cap = settings?.weeklyExtraPostCap ?? DEFAULT_CAP

  const since = new Date(Date.now() - WINDOW_MS)
  // Account-scoped: the shared extension broadens userId to all account members.
  const inWindow = await prisma.draft.findMany({
    where: { userId, createdAt: { gte: since } },
    select: { createdAt: true },
    orderBy: { createdAt: 'asc' },
  })

  const used = inWindow.length
  return {
    cap,
    used,
    remaining: Math.max(0, cap - used),
    resetsAt: inWindow.length > 0 ? new Date(inWindow[0].createdAt.getTime() + WINDOW_MS) : null,
  }
}

/** Human message for the 429 — includes the reset date when known. */
export function quotaExceededMessage(quota: ExtraPostQuota): string {
  const reset = quota.resetsAt
    ? ` You can create another post after ${quota.resetsAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}.`
    : ''
  return `Weekly limit of ${quota.cap} extra posts reached.${reset}`
}
