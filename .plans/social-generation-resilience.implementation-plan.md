# Social Generation Resilience — Implementation Plan

Status: **planned** (2026-07-08). Not started.

## Why

Social generation runs (`SOCIAL_GENERATE`, matrix runs of 6 slots) make many external
calls — Anthropic LLM (bullets/captions/pitch/plan), Fal.ai (video + image), ElevenLabs
(voiceover), S3 (upload). Two production incidents on staging exposed how fragile this is:

1. **Hang incident (2026-07-08):** a Fal.ai video call **hung with no client timeout**.
   The job sat `active` forever, occupied the worker's **single `batchSize:1` slot**, and
   blocked **every other social run** (jobs piled up in `created`). No alert fired — found
   only by manual DB/log forensics. Recovery was fully manual (restart worker, delete piled
   jobs, reset + re-enqueue).

2. **403 incident (same day):** Fal.ai ran out of credits and returned `403 Forbidden`.
   This failed *gracefully* — the two Fal-dependent slots (P1 video, P3 carousel) failed
   fast, the run delivered 3/6, and the dependency guard cleanly failed S3 ("Feed carousel
   P3 required"). But: **no fallback** (video/carousel just vanish) and **thin observability**
   (a bare "Forbidden" — no provider, status code, or context logged).

The failure chain to break:
```
external call hangs (no timeout) → job stuck 'active' → single worker slot occupied
  → ALL clients' social runs blocked → no alert → manual recovery
```

## Goals

- One hung/slow external call must **not** wedge a run, and **never** block other clients.
- Runs **self-heal** (auto-recover) without manual SSH.
- We get **alerted** on stalls/provider degradation before a client notices.
- Provider outages **degrade gracefully** (partial delivery + fallbacks), not silent loss.

## Current-state facts this builds on

- `apps/api/src/worker.ts` — `boss.work(QUEUES.SOCIAL_GENERATE, { batchSize: 1 }, …)` — **single global concurrency**.
- `apps/api/src/social/automation/run.ts` — `runSocialAutomation` iterates feed then story slots; each slot wrapped in per-slot try/catch (`processMatrixSlot` / `processStorySlot`) that marks the slot failed and continues. Story slots already guard on missing feed assets (dependency cascade works).
- `apps/api/src/social/automation/enqueue.ts` — jobs sent with `expireInSeconds: 3*3600` (3h — far too long for a wedged job).
- External call sites with **no timeout**: `generate-video-assets.ts` (Fal video via `buildVideoReel`/`buildHookVideo`), `generate-assets.ts` (`generateCarouselBackground` Fal image), LLM adapters, ElevenLabs (`buildPerSlideNarration`).
- `withSentry(...)` already wraps handlers — errors that *throw* are captured; hangs are not.
- `sendFailureAlert(...)` already fires on failed slots/runs — extend for stalls.

---

## Phase 1 — Timeouts + bounded retries on every external call *(highest priority)* — IMPLEMENTED (2026-07-08)

Kills the root cause. A hang becomes a caught error, so the existing per-slot handling fires
(slot fails, run continues, alert). This alone converts the hang incident into the (good)
403-style fast-fail.

- Add an `withTimeout(promise, ms, label)` helper (AbortController-based) and apply per op type:
  - LLM ~60–90s, image ~2–3 min, **video ~6–8 min**, ElevenLabs ~60s, S3 ~30s.
  - Bound Fal's poll loop with a max total wait (not just per-poll).
- Retry transient failures (timeout / 429 / 5xx) with **exponential backoff + jitter**, capped 2–3 attempts.
- Make retries **idempotent** (stable asset keys / provider idempotency keys) so we don't double-charge Fal or double-upload.
- Touch: `social/generate-video-assets.ts`, `social/generate-assets.ts`, `social/compositors/carousel.ts` (Fal image), LLM factory/adapters, `lib/elevenlabs/*`, a new `lib/net/with-timeout.ts` + `lib/net/retry.ts`.

**Done:**
- `lib/net/with-timeout.ts` — `withTimeout(fn, ms, label)`, AbortController-based, races a timer and aborts + rejects with `TimeoutError` on expiry.
- `lib/net/retry.ts` — `withRetry(fn, opts)` with exponential backoff + jitter; `isRetryableNetworkError` explicitly excludes 401/403/404/422 (auth/balance/validation) so a Fal "Exhausted balance" 403 — exactly the second 2026-07-08 incident — fails fast instead of burning the retry budget.
- Applied:
  - `social/video/seedance.ts` (`generateSeedanceClip`) — the actual hang site. 8 min timeout, 2 attempts, `abortSignal` threaded through so timeout actually cancels the in-flight Fal status check.
  - `social/compositors/carousel.ts` (`generateCarouselBackground`) — 3 min timeout, 2 attempts.
  - `article-pipeline/image-generation.ts` (`generateFeaturedImage`) — its existing 3-attempt loop had no per-attempt timeout (so a hang never even reached the retry logic); added `withTimeout` per attempt + short-circuit on non-retryable errors.
  - `newsletter/logo-process.ts` (`birefnetCutout`) — bare fetch, added `AbortSignal.timeout(60s)`.
  - `lib/elevenlabs/client.ts` — all 4 bare fetches had zero timeout; added per-op timeouts (admin 30s, upload 60s, TTS 90s).
  - `article-pipeline/llm/anthropic.ts` / `llm/openai.ts` — both SDKs default to a 10-minute timeout; set explicit `timeout: 120_000` (covers the largest maxTokens=8000 completions used in this codebase) via the SDK's own timeout option (which also drives its built-in retry-on-timeout).
  - `gemini.ts` already had a 180s timeout — left unchanged.
- 17 new tests (`lib/net/__tests__/with-timeout.test.ts`, `retry.test.ts`); full suite 408/408 passing.
- **Not done in this pass** (deferred, not required to fix the incident): idempotency keys for retries (Fal calls are only retried on timeout/5xx before any charge is confirmed, so double-charge risk is low but not eliminated), LLM adapters don't get an additional external `withRetry` wrapper (the SDKs' own built-in retry already covers 429/5xx/timeout — stacking our retry on top risked retry storms).

## Phase 2 — Contain the blast radius (concurrency & queue isolation) — IMPLEMENTED (2026-07-08)

So one client's slow/hung run never blocks others.

- **Split queues by weight**: heavy media (video/hook/carousel bg) → its own worker pool; light work (quotes/captions/tips) → another. A hung video can't block quote posts.
- **Bounded concurrency** on the heavy pool (`batchSize`/`teamSize` 2–4) instead of 1 — bounded because media gen is resource-heavy (CPU for ffmpeg, memory).
- **Per-slot hard deadline** (`Promise.race`) as a backstop even if a call lacks its own timeout.
- (Later) **per-tenant fairness** so one client can't monopolize the queue.
- Touch: `worker.ts`, `queues/index.ts`, `matrix-processor.ts`/`story-processor.ts` (deadline wrapper).

**Done:**
- **Concurrency, not `batchSize`.** Investigated pg-boss v10 source directly: `socialGenerateHandler` (and every handler in this codebase) processes its `jobs` array with a sequential `for...of` — so raising `batchSize` alone would NOT let two runs process in parallel, it would just fetch more jobs into the same serial loop. pg-boss v10 also has **no `teamSize`/`teamConcurrency` option** (removed vs v9) — each `boss.work()` call spawns exactly one polling `Worker` instance (confirmed in `manager.js`'s `watch()`/`Worker.start()`). The documented-by-source pattern for N-way concurrency on one queue is **N independent `.work()` registrations** (each gets its own `worker.id`, polls and claims jobs independently — pg-boss's job-claim SQL already handles concurrent claims safely). `worker.ts` now registers `SOCIAL_GENERATE` **3 times** in a loop (`SOCIAL_GENERATE_CONCURRENCY = 3`) — this is the actual fix for "one client's hung run held the only slot and blocked everyone."
  - **Not done:** the weighted-queue split (heavy media vs. light local-render slots as physically separate queues). This would require decomposing `runSocialAutomation`'s single-job-per-run for-loop into a per-slot job fan-out (each slot its own pg-boss job, with a coordinator aggregating completion) — a real architecture change, not a config change. Deferred as a distinct future phase given the risk of destabilizing the just-shipped Phase 8/9 story/CTA work; the 3-way concurrency bump already gives most of the practical benefit (3 different clients' runs no longer queue behind each other) without that risk.
- **Per-slot hard deadline backstop** (`withTimeout` wrapping the full resolve→generate→build pipeline): `SLOT_DEADLINE_MS = 20 min` in `matrix-processor.ts` (feed slots — may include fresh Fal image/video generation with retries), `STORY_SLOT_DEADLINE_MS = 15 min` in `story-processor.ts` (stories mostly reuse an already-generated feed asset). Funnels into the existing per-slot catch → marks the slot failed → run continues, same as any other error.
- **Closed a real gap the backstop's design was meant to catch**: `runFfmpeg`/`probeVideo` (`video/ffmpeg.ts`) used `execFile` with **no timeout** — a stuck/runaway ffmpeg process had no natural end. Added `timeout: 5 min` (ffmpeg) / `60s` (ffprobe). `downloadToFile` (used to reuse F2/F6 raw video for S2/S6) was also a bare `fetch()` with no timeout — added `AbortSignal.timeout(3 min)`.
- No new unit tests added for the wiring itself (`worker.ts`/`matrix-processor.ts`/`story-processor.ts` have no existing unit tests — they're DB-orchestrating, not pure logic, consistent with this codebase's existing test coverage pattern); verified via `tsc` + full suite (408/408, no regressions) + a live staging regeneration smoke test after deploy.

## Phase 3 — Detect & auto-recover (sweeper + pg-boss config) — IMPLEMENTED (2026-07-08)

Automates the manual recovery done during the incidents.

- **Realistic `expireInSeconds`** per queue (e.g. 15–20 min for a slot, not 3h) so a wedged `active` job is reclaimed/retried, not left for hours.
- **Stale-run sweeper cron**: find runs `processing` with `updatedAt` older than N min → reset to `pending` + re-enqueue (bounded auto-retries, e.g. max 2) and reclaim orphaned jobs. **Must dedupe** — the hang incident piled 5 redundant `created` jobs; the sweeper must not blindly re-enqueue.
- **Resumable retry**: on re-enqueue, skip already-`completed` slots instead of full regen (cost/time saver).
- Touch: `enqueue.ts` (expireInSeconds), new `social/automation/sweeper.ts` + cron registration in `worker.ts`, `run.ts` (resume-incomplete-slots mode).

**Key discovery: a sweeper already existed** — `handlers/social-automation-safety.ts`
(`socialAutomationSafetyHandler`, cron `*/5 * * * *`, pre-dating this plan) already resets
stuck `processing`/`pending` runs and re-enqueues. It almost certainly caused the "5 duplicate
`created` jobs" symptom observed during the hang incident: it re-enqueued every 5 minutes
without ever canceling the still-referenced stuck job, and (see below) `singletonKey`
provides **no actual protection** against this under the queue's default policy. Phase 3
became **fixing this existing sweeper**, not building a parallel one.

**Root-caused via pg-boss v10 source (not assumed):** `singletonKey` only de-duplicates on
queues created with `policy: 'short' | 'singleton' | 'stately'` (verified: `plans.js`'s
`insertJob` is a bare `INSERT ... ON CONFLICT DO NOTHING`, and the only unique indexes that
give that `ON CONFLICT` something to conflict against are `job_i1/i2/i3`, each `WHERE policy =
'<that policy>'`). This codebase's queues are all created via a plain `boss.createQueue(name)`
loop in `worker.ts` → default `'standard'` policy → `singletonKey` is inert. This directly
contradicts a comment in `enqueue-dispatch.ts` claiming `boss.send()` "returns null when
singletonKey prevents duplicate insertion" — corrected in place; not fixed further (see below).

**Done:**
- **Realistic `expireInSeconds`**: new `SOCIAL_GENERATE_EXPIRE_SECONDS = 30 min` (exported
  from `enqueue.ts`), replacing 3 hours in both `enqueueSocialAutomation` /
  `enqueueNewsletterSocialAutomation`, the safety handler's retry sends, and
  `enqueue-dispatch.ts`'s single-slot regenerate send.
- **`autoRecoverAttempts`** column on `SocialAutomationRun` (migration
  `20260708210000_social_run_auto_recover`) — bounded at `MAX_AUTO_RECOVER_ATTEMPTS = 2`;
  beyond that the sweeper marks the run `failed` + alerts for manual review instead of
  retrying forever.
- **Fixed the dedup gap** (`reclaimOrphanedSocialGenerateJob` in the safety handler):
  before every reset+re-enqueue, explicitly `DELETE FROM pgboss.job WHERE name=... AND
  state IN ('active','created') AND data->>'runId'=...` — the same manual step used during
  live incident recovery, now automatic. Applied to both the `stuckProcessing` and
  `stuckPending` branches; re-enqueues now reuse the **original** singleton key
  (`social-generate-${jobId}` / `social-generate-nl-${newsletterId}`) instead of a
  per-retry key, keeping the run's job identity stable across attempts.
- **Resumable retry**: `runSocialAutomation` gains a `resumeIncomplete` mode — skips slots
  with an existing `'completed'` `SocialAutomationSpecResult` row, only wipes `'ready'` posts
  for the slots being reprocessed (not the whole run), and doesn't reset the slide count or
  zero the progress counters. Threaded through `SocialGenerateJobData.resumeIncomplete` →
  `socialGenerateHandler` → `runSocialAutomation`. The sweeper always sends
  `resumeIncomplete: true`.
- **Re-tuned thresholds for consistency with Phase 2**: `PROCESSING_STUCK_MS` 15→**25 min**
  (must sit comfortably above the 20-min feed-slot hard-deadline backstop from Phase 2, or
  the sweeper could fire on a run still legitimately inside its own bounded window).
  `PENDING_STUCK_MS` 5→**15 min** (Phase 2's 3-way concurrency means a burst of legitimate
  runs can now leave a healthy run queued longer before this was tuned).
- **Fixed a cross-branch double-recovery bug this change surfaced**: `stuckPending` filtered
  on `createdAt`, not `updatedAt`. A run reset to `'pending'` by the `stuckProcessing` branch
  gets a fresh `updatedAt` but an unchanged (old) `createdAt` — so on the very next 5-minute
  tick, before its freshly re-enqueued job could even be picked up, it would immediately
  re-qualify as `stuckPending` too, double-incrementing `autoRecoverAttempts` and sending a
  redundant duplicate job. Changed to `updatedAt`, matching the other two branches.
- **Not done** (deliberately out of scope): adopting `policy: 'stately'` queue-wide (the more
  robust DB-level fix for the singletonKey gap — would need testing `ON CONFLICT` return
  semantics against every existing `send()` call site before rolling out); the same dedup
  fix for `enqueue-dispatch.ts`'s single-slot regenerate (comment corrected, no code fix —
  low-risk, user-initiated, single slot, narrow blast radius vs. the sweeper's multi-run
  impact); the `stuckScheduling`/`SOCIAL_DISPATCH` branch (different subsystem, out of this
  phase's SOCIAL_GENERATE-focused scope).
- No new unit tests (this is DB/pg-boss-orchestrating code, same rationale as Phase 2);
  verified via `tsc` (api + web) + full suite (408/408) + a live staging smoke test using
  `resumeIncomplete` against a real partially-completed run.

## Phase 4 — Observability & alerting

Know before the client does.

- **Per-call timing logs**: provider, op, duration, outcome (incl. status code) — so "Forbidden" becomes "Fal.ai image 403 in 220ms".
- **Progress heartbeat**: each slot bumps a `lastProgressAt`; a monitor alerts when a run hasn't progressed in N min (we diagnosed via `spec.updatedAt` — formalize + alert).
- **Metrics/dashboards**: per-provider latency/error/timeout rate, queue depth, oldest-active-job age, stuck-run count.
- **New alerts**: stuck/stalled run, provider degradation (timeout/error spike), growing backlog. Reuse `sendFailureAlert` plumbing.
- Touch: external call wrappers (timing), `run.ts`/processors (heartbeat), `lib/alerts.ts`, sweeper (stall alert).

## Phase 5 — Graceful degradation (product-level)

Deliver something useful during a provider outage.

- **Fallbacks**: Fal video times out/403s → fall back to an image post (or skip) — extend the existing diagram→image-carousel fallback pattern to video→image.
- **Partial delivery** (already supported): surface failed slots in the preview with one-click retry (retry endpoint already exists) once the provider recovers.
- **Provider/model failover**: secondary video/image provider or model when the primary degrades.
- Touch: `matrix-processor.ts` (video→image fallback), preview UI (surface failed + retry — mostly present), model config.

## Phase 6 — Circuit breaker + backpressure

Handle sustained provider outages (like the 403 credits incident).

- **Per-provider circuit breaker**: after N consecutive timeouts/failures, open → fail fast + alert instead of hanging every job on a down provider; half-open probes to recover.
- **Backpressure / queue caps** so an outage doesn't build an unbounded backlog.
- Touch: new `lib/net/circuit-breaker.ts`, wrap provider clients.

---

## Recommended priority order

1. **Phase 1** (timeouts + retries) — kills the root cause; makes existing error handling fire.
2. **Phase 2** (queue isolation / bounded concurrency) — the multi-tenant must-have.
3. **Phase 3** (sweeper + realistic expiration) — auto-recovery, no manual SSH.
4. **Phase 4** (heartbeat + alerting) — visibility.
5. **Phase 5** (fallbacks + resumable retry) — deliver partial, cheap retries.
6. **Phase 6** (circuit breaker / failover) — provider outages.

**The three that alone would have prevented the hang incident:** a Fal timeout (Phase 1),
queue isolation (Phase 2), and the sweeper (Phase 3).

## Key nuances / risks

- Video legitimately takes minutes — this is **not** "30s timeouts everywhere". Use
  op-specific generous timeouts **plus** a progress heartbeat to tell "slow" from "hung".
- **Idempotency** is essential before enabling retries (don't double-bill Fal / double-post).
- Bounded concurrency must respect worker CPU/memory (ffmpeg is heavy) — measure before raising.
- Sweeper auto-retries must be **capped + deduped** to avoid retry storms and job pile-ups.
