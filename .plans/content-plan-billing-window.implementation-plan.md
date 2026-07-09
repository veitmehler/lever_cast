# Content Plan Billing Window — Implementation Plan

Status: **implemented** (2026-07-09). All 5 phases complete: schema + `billingWindows()` +
tests (10 new, 446/446 total passing), `GET /content-plan` planning window + `executableUntil`,
`POST /content-plan/generate` production gate, dashboard two-tier day treatment (table + grid),
and the admin `subscriptionStartedAt` control on `/admin/users`. Typecheck + `next build` clean
on both apps. Not yet deployed/verified on staging as of this line.

## Goal

Today, the dashboard's Content Plan shows a **rolling 30 days from today** — the window silently
slides forward every day, giving unbounded cumulative forward visibility over time. The actual
product intent is a **30-day content-planning allotment per billing cycle**, anchored to when the
account paid, not to "today." Since real billing doesn't exist yet, build the real mechanism now
(the same field/logic a Stripe integration will populate later) and seed it manually for the test
account in the meantime.

## Decisions locked (2026-07-09 discussion)

1. **Two overlapping windows, not one**, both derived from a single anchor date:
   - **Planning window (60 days = current cycle + next cycle)**: what the dashboard shows and
     what's editable — topic assignment, CSV import, idea-bank scheduling, "edit options". Both
     cycles fully editable.
   - **Production window (30 days = current cycle only)**: the boundary for what can actually be
     *generated*. The next cycle is visible/editable but not executable yet — "you can plan 30
     days ahead, but can only produce what you've paid for." This lets users (or an automated
     trigger, later) queue up next month's plan without having to log in on day 1 of a new cycle.
   - Confirmed rationale (user, verbatim): *"a user can edit their content plan 30 days in
     advance, but can only produce the content for it, if they paid. That way, they don't have to
     log into the platform on day 1 of the billing cycle... they can just trigger it, or we can
     trigger it automatically when the payment clears."*
2. **Cycle length: fixed 30 days**, not calendar-month. Simplest, matches today's existing
   `29 * 86400000` rolling-window math exactly. Accepted trade-off: real Stripe billing period
   boundaries (typically calendar-month) could drift a day or two from this over many cycles —
   cosmetic, not functional; revisit only if it becomes a real problem.
3. **One field, `Account.subscriptionStartedAt`** (not two) — store only the *original* anchor
   date. The current cycle boundary is always *derived* via date math (`elapsedDays mod
   cycleDays`), not stored/synced separately. This is the key design choice that makes "fake it
   now, wire up real billing later" trivial: a real Stripe integration just sets this field once,
   on `checkout.session.completed` (first payment) — never touched again. No renewal webhook
   needed to keep the computed window correct.
4. **Account-level, not User-level.** Billing is per-account (up to 3 members share one account),
   matching how `BrandSettings` etc. are already account-scoped.
5. **Backward-compatible / additive.** `subscriptionStartedAt` is nullable. Accounts without it
   set keep today's existing rolling-30-day-from-today behavior unchanged — nothing breaks for
   any account until this is deliberately turned on for them.
6. **A real (small) admin control** to set `subscriptionStartedAt` per account — not a one-off SQL
   hack. This is how the test account gets "paid" now, and it's a genuinely useful support tool
   later (comping a subscription start, adjusting a customer's cycle) regardless of when real
   billing lands.

## Current-state facts this builds on

- `GET /api/content-plan` (`apps/api/src/routes/content-plan.ts`): `from = today` (UTC midnight,
  unless overridden by `?from=`), `to = from + 29 days` (unless overridden by `?to=`). Pure
  rolling window, no billing concept exists anywhere in the schema today.
- `POST /api/content-plan/generate` (`{ dates: string[] }`): the **single** production-trigger
  endpoint — calls `createBatchFromDates(account, dates)` then `advanceBatch(batchId)`. This is
  the one real enforcement point for the production-window gate.
- `Account` model (`packages/db/prisma/schema.prisma`): `id, name, ownerUserId, assistantEmail,
  articleCalendarId, createdAt, updatedAt` — no billing/subscription fields at all today.
- `apps/web/src/features/dashboard/ContentPlan.tsx`: fetches `/api/content-plan` with no
  query params (always the default window); `selectableDates` currently = every day with an
  article or newsletter; `generateSelected()` POSTs the selected dates with no date-eligibility
  check client-side either.
- `apps/web/src/app/admin/users/page.tsx` — existing admin table, one row per **User** (not
  Account), with an established inline-editable-field pattern (`RoleToggle.tsx`, a small client
  component embedded in a table cell) to mirror for the new subscription-date control. Note:
  `subscriptionStartedAt` lives on `Account`, and an account can have up to 3 users — whether to
  extend this existing per-user page (joining through to the account) or add a small dedicated
  accounts view is an implementation-time call, not architecturally significant.

## Phase 1 — Schema + core computation (done)

- Migration: `Account.subscriptionStartedAt DateTime?` (nullable).
- New pure helper, e.g. `apps/api/src/article-pipeline/billing-window.ts`:
  ```ts
  export interface BillingWindow {
    from: Date            // start of the CURRENT cycle
    to: Date               // end of the PLANNING window (current + next cycle)
    executableUntil: Date  // end of the CURRENT (paid) cycle — the production boundary
  }

  export function billingWindows(
    subscriptionStartedAt: Date,
    now: Date = new Date(),
    cycleDays = 30,
  ): BillingWindow {
    const msPerDay = 86_400_000
    const elapsedDays = Math.floor((now.getTime() - subscriptionStartedAt.getTime()) / msPerDay)
    const cyclesElapsed = Math.floor(elapsedDays / cycleDays)
    const currentCycleStart = new Date(subscriptionStartedAt.getTime() + cyclesElapsed * cycleDays * msPerDay)
    const executableUntil = new Date(currentCycleStart.getTime() + (cycleDays - 1) * msPerDay)
    const planningUntil = new Date(currentCycleStart.getTime() + (2 * cycleDays - 1) * msPerDay)
    return { from: currentCycleStart, to: planningUntil, executableUntil }
  }
  ```
  Pure, deterministic, easily unit-testable (inject `now` — same testing pattern already
  established for `lib/net/circuit-breaker.ts`'s injectable clock). Handles `now` *before*
  `subscriptionStartedAt` (e.g. a future-dated anchor) gracefully — `elapsedDays` goes negative,
  `Math.floor` of a negative still lands on the correct (most recent past-or-current) cycle
  boundary; worth a dedicated test case.
- Tests: cycle-boundary edges (exactly on day 0, day 29, day 30 of a cycle), multi-cycle-elapsed
  correctness, `now` before the anchor date, `now` far in the future (many cycles elapsed).

## Phase 2 — `GET /content-plan`: planning window + `executableUntil` (done)

- Look up `account.accountId`'s `subscriptionStartedAt` (one extra `select` field on the existing
  `prisma.account.findUnique` call already in this route — no new query).
- When set (and no explicit `?from=`/`?to=` override — preserve those for admin/debug use):
  `from`/`to` = `billingWindows(...).from` / `.to` (the 60-day planning window, replacing today's
  hardcoded 29-day rolling default).
- When unset: **unchanged** — today's rolling-30-day-from-today default, exactly as now.
- Response gains `executableUntil: string | null` (ISO date, `null` when no
  `subscriptionStartedAt` — meaning "no production gate, everything selectable," matching today's
  ungated behavior for accounts without billing set up).

## Phase 3 — `POST /content-plan/generate`: the real gate (done)

- Re-derive `executableUntil` the same way (same account lookup + `billingWindows()` call).
- Filter `request.body.dates` to only those `<= executableUntil` (when set). If any requested
  dates were dropped, respond with a clear signal (e.g. `{ itemCount, skippedDates: [...] }`, or a
  `400` if *all* requested dates are beyond the boundary) rather than silently generating a subset
  with no explanation — the client should be able to tell the user why.
- This is a **server-side, independent check** — not just trusting the frontend's disabled
  checkboxes. The frontend gate (Phase 4) is UX; this is the actual enforcement.

## Phase 4 — Dashboard UI: two-tier day treatment (done)

- `ContentPlan.tsx`: read `executableUntil` from the `/content-plan` response.
- Days `<= executableUntil` (or `executableUntil === null`, ungated): unchanged today —
  selectable, checkbox enabled, full "Generate selected" eligibility.
- Days `> executableUntil`: **still fully editable** (topic assignment, CSV, idea-bank, "edit
  options" — no change to `ArticleCell`/`NewsletterCell`/`materializeAndEdit`/`assignIdea`/etc.),
  but the row's checkbox is disabled/hidden with a label such as *"Plan ahead — unlocks {date}"*.
  Both table and grid views need this (mirror the existing dual-rendering pattern already used
  elsewhere in this file).
- `selectableDates` (used for the "select all" checkbox) must also respect the boundary — should
  not include planning-only dates.

## Phase 5 — Minimal admin control to set `subscriptionStartedAt` (done)

- Extend `apps/web/src/app/admin/users/page.tsx` (or a small new accounts view — implementation-
  time call) with an inline date field per account, mirroring the existing `RoleToggle.tsx`
  pattern (small client component, single field, immediate save).
- New admin API route (e.g. `PATCH /api/admin/accounts/:id` or extend an existing admin users
  route) to persist the date. Admin-only, matching this codebase's existing admin-route auth
  pattern.
- This is how the test account gets "paid" now: an admin sets a date (today, or a past date to
  simulate being mid-cycle) via this control — no SQL required, and the same control remains
  useful for support purposes indefinitely.

## Touch list (files)

- `packages/db/prisma/schema.prisma` + new migration — `Account.subscriptionStartedAt`.
- `apps/api/src/article-pipeline/billing-window.ts` — new, `billingWindows()` + tests.
- `apps/api/src/routes/content-plan.ts` — `GET /content-plan` (planning window + `executableUntil`), `POST /content-plan/generate` (server-side gate).
- `apps/web/src/features/dashboard/ContentPlan.tsx` — two-tier day treatment, `selectableDates` boundary.
- `apps/web/src/app/admin/users/page.tsx` (or new accounts view) + a small new inline-edit component (mirrors `RoleToggle.tsx`) — Phase 5.
- New admin API route to persist `subscriptionStartedAt`.

## Risks / open details for implementation time

- Exact response shape for `POST /content-plan/generate` when some/all requested dates are
  rejected (`skippedDates` array vs. hard `400`) — a UX call, not architecturally significant.
- Whether to extend the existing per-user admin page or build a dedicated per-account view for
  Phase 5 — accounts with >1 member would show the same date on multiple rows either way; low
  stakes given most test/current usage is 1-user-per-account.
- Future extension (explicitly out of scope now, no implementation): auto-triggering generation
  for pre-planned next-cycle topics when a cycle rolls over (real Stripe webhook, or a daily cron
  comparing `now` against each account's computed `executableUntil`). The data model here is
  deliberately designed to make that a clean addition later — `billingWindows()` already exposes
  everything such an automation would need — but nothing about it should be built until real
  billing events exist to trigger off.
