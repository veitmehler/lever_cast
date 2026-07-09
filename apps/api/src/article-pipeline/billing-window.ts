/**
 * Content Plan billing-cycle windowing. See
 * .plans/content-plan-billing-window.implementation-plan.md.
 *
 * One stored anchor (`Account.subscriptionStartedAt`) is enough — the current
 * cycle boundary is always a pure function of that anchor and `now`, so this
 * never needs a renewal webhook to stay correct. A real Stripe integration
 * only ever needs to set the anchor once, on first payment.
 */

const MS_PER_DAY = 86_400_000

export interface BillingWindow {
  /** Start of the CURRENT cycle. */
  from: Date
  /** End of the PLANNING window (current cycle + next cycle). */
  to: Date
  /** End of the CURRENT (paid) cycle — the production/generation boundary. */
  executableUntil: Date
}

/**
 * Compute the current billing cycle's planning + production windows from a
 * fixed anchor date. Snaps `now` to whichever `cycleDays`-long block it falls
 * into relative to `subscriptionStartedAt` — including when `now` is before
 * the anchor (treated as still within the first/most-recent cycle boundary,
 * via `Math.floor` on a negative day count).
 */
export function billingWindows(
  subscriptionStartedAt: Date,
  now: Date = new Date(),
  cycleDays = 30,
): BillingWindow {
  const elapsedDays = Math.floor((now.getTime() - subscriptionStartedAt.getTime()) / MS_PER_DAY)
  const cyclesElapsed = Math.floor(elapsedDays / cycleDays)
  const currentCycleStart = new Date(subscriptionStartedAt.getTime() + cyclesElapsed * cycleDays * MS_PER_DAY)
  const executableUntil = new Date(currentCycleStart.getTime() + (cycleDays - 1) * MS_PER_DAY)
  const planningUntil = new Date(currentCycleStart.getTime() + (2 * cycleDays - 1) * MS_PER_DAY)
  return { from: currentCycleStart, to: planningUntil, executableUntil }
}
