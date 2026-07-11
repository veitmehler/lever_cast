/**
 * Account lifecycle gates (multi-tenancy plan Phase A).
 *
 * Invariant: `paidThrough` governs publishing; `status` governs generation.
 * - Pause (= non-payment) closes both: the period was never paid, so nothing
 *   is owed and generation would be at our cost.
 * - Cancel keeps publishing through `paidThrough` (they paid for it) but never
 *   generates again.
 * - `billingExempt` (comp accounts) bypasses both gates, as do accounts with
 *   no Account row / null paidThrough (legacy + admin test accounts) so
 *   pre-billing behavior is unchanged until GHL events drive these fields
 *   (Phase B). Until then the admin accounts page drives them manually.
 */
import { prisma, accountIdForUser } from '@socioply/shared'

export interface BillingGate {
  allowed: boolean
  /** User-facing reason when blocked. */
  reason?: string
}

interface AccountBillingRow {
  status: string
  paidThrough: Date | null
  billingExempt: boolean
}

async function billingRowForUser(userId: string): Promise<AccountBillingRow | null> {
  const accountId = await accountIdForUser(userId)
  if (!accountId) return null
  return prisma.account.findUnique({
    where: { id: accountId },
    select: { status: true, paidThrough: true, billingExempt: true },
  })
}

export const GENERATION_BLOCKED_MESSAGE =
  'Content generation is paused on this account until the subscription payment is up to date.'

/** May this user's account produce NEW content (articles, newsletters, social, ad-hoc posts)? */
export async function generationGateForUser(userId: string): Promise<BillingGate> {
  const row = await billingRowForUser(userId)
  if (!row || row.billingExempt) return { allowed: true }
  if (row.status !== 'active') {
    return { allowed: false, reason: GENERATION_BLOCKED_MESSAGE }
  }
  return { allowed: true }
}

/** May this user's account still PUBLISH already-generated content? */
export async function publishingGateForUser(userId: string): Promise<BillingGate> {
  const row = await billingRowForUser(userId)
  if (!row || row.billingExempt) return { allowed: true }
  if (row.paidThrough && row.paidThrough.getTime() < Date.now()) {
    return { allowed: false, reason: 'The paid subscription period has ended.' }
  }
  return { allowed: true }
}
