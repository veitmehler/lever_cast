# Multi-Tenancy Hardening + GHL Payment Lifecycle — Implementation Plan

**Status: PLANNED (user sign-off on all product decisions 2026-07-11/12). Not started.**

Companion to the readiness analysis (PM doc) and the throughput plan (complete). Covers the six
items the user greenlit "now" plus the GHL payment integration that drives the lifecycle piece.
Explicitly deferred by user decision: B4 DB cluster upsize (pre-launch tripwire, welded to
first paid onboarding), per-vertical content packs (first batch = chiros only), automated
account-health validation (manual onboarding checklist covers the concierge batch).

## Locked product decisions (user, 2026-07-11/12)

- **Billing runs through GHL** (whitelabel SaaS mode; Stripe under GHL's hood). GHL owns all
  client-facing dunning UI ("payment failed — update details" happens on the subaccount).
  SaaS Configurator auto-suspend stays ON — subaccount suspension and our pause fire off the
  same underlying event.
- **GHL auto-cancel on exhausted retries: OFF.** Failed subscriptions rest in `Unpaid`; OUR
  60-day clock owns pause→cancelled.
- **Pause = non-payment.** No generation AND no publishing (the period was never paid).
- **Cancel = voluntary end.** No new generation; publishing continues through `paidThrough`
  (they paid for it). Invariant: **`paidThrough` governs publishing; `status` governs
  generation.**
- **Clocks:** paused > 60 days → cancelled. Cancelled > 90 days → hard delete (max retention
  150 days). Deletion must ALSO be manually invokable (statutory deletion requests).
- **Re-anchor on every successful payment**: `subscriptionStartedAt` becomes "current cycle
  anchor", updated by each payment-cleared event. Reactivation is just a successful payment —
  no special case. Reactivation burst covers ONLY the current cycle (no retrospective months),
  and only future-dated items.
- **LLMUsage survives account deletion** (anonymous cost records — detach, never delete).
- **Client websites are out of scope** for lifecycle/deletion: WordPress (85%) + exported HTML
  live on client servers; we control content production only.

## GHL signal layer (verified against docs 2026-07-12)

- Subscription lifecycle is exposed via **workflow triggers** (Payments → Subscription), NOT
  marketplace API webhooks (those cover invoices only: InvoicePaid etc.).
- Architecture (same pattern as the review-mining webhook design): **one GHL workflow per
  status filter → webhook action → our receiver**. Snapshot-deployable.
- Status timing: `Overdue` fires on the FIRST failed renewal attempt (retries still pending —
  default 3 × 1 day, configurable 1–3 × 1/3/5/7d); `Unpaid` after retries exhaust;
  `Canceled` on manual/auto cancel; `Active` fires on every successful payment INCLUDING
  mid-retry recovery and reactivation.
- We subscribe to: `Active` (→ active + re-anchor + paidThrough bump), `Overdue` (→ paused
  immediately; cost door closes day one, matches GHL subaccount suspension), `Unpaid` +
  `Canceled` (confirmation/escalation). Optional belt-and-braces: `InvoicePaid` native
  marketplace webhook.
- Cost exposure is bounded regardless of trigger choice: generation is gated on
  payment-cleared, so an unpaid cycle can never burst.
- **To verify live at build time** (cannot be confirmed from docs): exact payload of the
  Subscription trigger's webhook action — whether locationId/contact comes through, or we
  encode account identity in a per-workflow URL token (receiver supports both; the review
  design already assumed URL tokens and works regardless).

## Phase A — Account state machine + enforcement gates — ✅ IMPLEMENTED 2026-07-12

No GHL dependency; admin drives statuses manually until Phase B lands (admin Users page →
Billing column: status select + paid-through date + comp checkbox; PATCH /admin/accounts/:id).
As-built notes: gates live in `apps/api/src/lib/account-billing.ts`
(`generationGateForUser` / `publishingGateForUser`); generation gate enforced at
content-plan generate, topics create + CSV import, ai generate (admin-exempt like the cap),
newsletter enqueue (inside the fn — covers the admin bulk route), and both social automation
enqueues; publishing gate enforced in publish-scheduled (posts on lapsed accounts are parked,
not failed — they auto-publish if paidThrough extends) and enqueueSocialDispatch (GHL
scheduling is where publishing leaves our control). Migration `20260712100000_account_lifecycle`
(status/statusChangedAt/paidThrough/billingExempt). 14 new tests (gate unit + route 402s +
publish parking).

**Schema (`packages/db/prisma/schema.prisma` — Account):**
```prisma
status          String    @default("active") // active | paused | cancelled
statusChangedAt DateTime?
paidThrough     DateTime? // publishing gate; null = legacy/unbilled (treat as unrestricted for admin/comp)
billingExempt   Boolean   @default(false) // comp accounts: bypass BOTH gates
// subscriptionStartedAt: comment updated — now re-anchored on every payment-cleared event
```
Migration: add columns, backfill `status='active'`.

**Gate helper (`apps/api/src/lib/account-billing.ts`, new):**
- `generationAllowed(accountId)` → status === 'active' || billingExempt (null-paidThrough
  legacy accounts: allowed, preserves current behavior for the admin/test accounts).
- `publishingAllowed(accountId)` → billingExempt || paidThrough == null || paidThrough >= now.

**Enforcement points (each returns a clear, user-visible error):**
- Generation: `routes/content-plan.ts` POST /generate; `routes/topics.ts` job creation;
  `routes/ai.ts` POST /generate (dashboard ad-hoc — stacks with the weekly cap);
  `newsletter/enqueue.ts`; cadence/dispatch entry (`social/automation/enqueue-dispatch.ts`).
- Publishing: `handlers/publish.ts` + the publish-scheduled path — skip (don't fail) posts
  whose account fails `publishingAllowed`; parked posts publish automatically if paidThrough
  later extends.
- Admin UI: status + paidThrough + billingExempt visible/editable on the admin account page
  (manual driving until Phase B, comp accounts forever).

**Tests:** gate helper unit tests; route tests for 402-style rejection on paused/cancelled;
publish skip test.

## Phase B — GHL webhook receiver + payment-driven cycle — ✅ IMPLEMENTED 2026-07-12

As-built: `routes/ghl-billing.ts` (POST /api/ghl/billing-events/:token; x-billing-secret
header vs `GHL_BILLING_WEBHOOK_SECRET` env — 503 if unset, 401 on mismatch, 404 on unknown
token, rate-limited 60/min); `lib/account-lifecycle.ts` (`applyBillingEvent` + re-dating +
burst); `GhlBillingEvent` audit table (every event logged incl. suppressed duplicates;
10-min same-type duplicate window); admin `POST /admin/accounts/:id/billing-token` mints
the per-account URL token. paidThrough = payment + 30 + 3 grace days. Burst offers every
future day of the re-anchored window to createBatchFromDates (which now skips topics that
already have a non-failed job — idempotence guard added) and honors the client-story gate
like the dashboard route. Re-dating only fires when the anchor gap exceeds one cycle +
grace (normal renewals need none — the old "next cycle" dates already line up); collisions
skip. 11 new tests. GHL-side workflow setup = at first real subscription (runbook below).

**Receiver (`apps/api/src/routes/ghl-billing.ts`, new):**
- `POST /api/ghl/billing-events/:token` — per-account URL token (webhook-action-friendly,
  no payload-shape dependency) + shared-secret header check. Token stored on Account
  (`ghlBillingToken`, generated at onboarding).
- Event body: `{ type: 'payment_cleared' | 'payment_failed' | 'cancelled', ... }` — the GHL
  workflow sets a static `type` field per workflow (three workflows, three fixed payloads —
  no dependence on GHL's internal payload shape).
- Idempotent: `GhlBillingEvent` log table (token, type, receivedAt, raw payload); duplicate
  suppression window; every transition audit-logged.

**Transitions:**
- `payment_cleared`: status → active; `subscriptionStartedAt` → now (re-anchor);
  `paidThrough` → now + cycleDays (+ small grace, e.g. 3 days, so a slow renewal doesn't
  park posts); THEN the burst hook (below).
- `payment_failed` (from Overdue): status → paused, statusChangedAt → now.
- `cancelled`: status → cancelled, statusChangedAt → now. paidThrough untouched — publishing
  runs out the paid period naturally.

**Burst-on-payment (`content-plan` reuse):**
- On payment_cleared, if the (re-anchored) current window has planned, undrafted,
  future-dated topics → auto-create the batch (reuses `createBatchFromDates` + dual-lane
  `advanceBatch`). This implements the PM-doc "auto-trigger generation when a cycle's
  payment clears" item.
- **Re-dating after a gap**: if the anchor jumped by more than ~1 cycle, planned topics from
  the stale "next cycle" Content Plan section are re-dated into the new window preserving
  their day-offsets from window start (topics keep content, get new dates). Only
  future-dated items generate; nothing produced retrospectively.

**GHL-side runbook (manual, agency account — add to onboarding runbook):**
1. Three workflows: Subscription trigger filtered Active / Overdue / Canceled (+ optionally
   Unpaid → same webhook as Canceled with type escalation), each → Webhook action to the
   account's token URL with the fixed `type` payload.
2. SaaS Configurator: auto-suspend ON, auto-cancel on exhausted retries OFF, retry policy
   default (3 × 1 day).
3. First-client verification: run a test payment + a forced failure; confirm both events land
   (this is also the live payload-shape check flagged above).

## Phase C — Lifecycle clocks + deletion path

**Clock cron (`handlers/account-lifecycle.ts`, new; daily via pg-boss):**
- paused && statusChangedAt < now − 60d → cancelled (statusChangedAt reset — 90d clock
  starts here).
- cancelled && statusChangedAt < now − 90d → enqueue ACCOUNT_DELETE for that account.
- Both transitions audit-logged + admin alert email (visibility before the irreversible one).

**Deletion job (`handlers/account-delete.ts`, new queue):**
- Invokable two ways: the 90-day cron AND an admin endpoint (statutory deletion requests) —
  same job, `reason` field distinguishes.
- Order: (1) LLMUsage detach — migration makes `LLMUsage.userId` nullable +
  `onDelete: SetNull` (cost records survive, anonymized); audit other business-record tables
  for the same treatment at build time. (2) S3 sweep by key prefix (inventory the prefixes at
  build time: newsletter/, tmp/featured/, social assets, media library, voiceovers).
  (3) DB cascade delete of account + users (verify every tenant model cascades — overlaps
  with Phase D3 audit). (4) GHL-side: delete our scheduled/unpublished posts in the
  subaccount; the subaccount itself is agency-owned — out of scope here.
- Dry-run mode first (logs what WOULD be deleted); verified on a staging clone account
  before the auto path is armed.

## Phase D — Hardening batch (independent of A–C, can interleave)

**D1. Social cost logging** (closes the last per-client margin blind spot): sweep the
social-side direct adapter calls missing LLMUsage rows — carousel-plan, platform-caption,
quote-selection, reel bullets, pitch-slide-text, video prompt steps (generate-video-assets),
hook teaser generation. Shared `recordLLMUsage(response, {userId, source})` helper; verify
against a staging social run that logged cost ≈ actual call count.

**D2. Failure-alert gap closure** (sendFailureAlert already exists + is wired into
newsletter-generate, quality-gate, social-automation-safety, promo-email-generate,
client-story-spider): add to `handlers/article-pipeline.ts` (terminal failure only — i.e.
after pg-boss retries exhaust, not each attempt; hook into the retryCount/boss state),
`article-enrichment.ts`, `article-output.ts`, `generate-social-from-article.ts`, and
`publish.ts` (a due post that errors). Rule: one email per terminal failure, never per retry.

**D3. Account-scope audit** (one-time, report as deliverable): every schema model with
userId/accountId checked against `ACCOUNT_SCOPED_MODELS` (packages/shared/src/prisma.ts) —
classify as scoped / deliberately-global / GAP; spot-check admin routes for role checks;
verify deletion-cascade coverage (feeds Phase C). Fix any gaps found.

**D4. Deploy hardening**: (a) paths filter on `deploy-api-staging.yml`
(apps/api/**, packages/db/**, packages/shared/**, pnpm-lock.yaml — mirror prod's);
(b) automated in-flight gate in BOTH deploy workflows: pre-deploy step SSHes to the droplet
and runs the in-flight check (active pgboss jobs / processing runs / in_progress articles);
loops up to N minutes waiting for idle, then fails with a clear message (manual override
input for emergencies). Kills the "human forgot to check" failure mode; with staggered
per-client bursts (user: clients generate in one monthly burst after onboarding, idle
otherwise) this covers deploy safety far past the concierge batch — full graceful drain
deferred until deploy-vs-burst collisions actually hurt.

## Pre-launch tripwire (deferred by user decision — do NOT lose)

- **B4 DB cluster upsize** before the first real multi-client bursts (25-conn cluster hit its
  cap once with ONE tenant + deploy overlap).
- Wire GHL workflows for the first paying client (Phase B runbook) + live payload
  verification.

## Suggested order & sizing

A (state machine + gates: the biggest single piece, ~half the batch) → D4a+D1 (small,
independent) → C-manual (deletion job, dry-run + admin trigger) → B (receiver + burst; GHL
workflows configurable only when a real subscription exists to test against) → C-auto
(clocks armed) → D2, D3, D4b fill gaps between phases. Everything except B's GHL-side setup
is fully testable on staging with curl-simulated events.

## Open items to resolve at build time

- Subscription-trigger webhook payload shape (live check, Phase B first client).
- Grace days on paidThrough (proposed 3) — pure config.
- S3 prefix inventory for the deletion sweep.
- Whether `Unpaid` gets its own workflow or rides the Canceled one with a type field.
