# Production Throughput & Multi-Tenancy Hardening — Implementation Plan

Status: **Phases 1a–1h implemented + measured on staging** (2026-07-11). 1a–1f: concurrency util +
per-provider limiter, diagram tail parallelism (serial type/mermaid head preserves diversity
chains; Chromium pages max 4, mmdc max 2, pooled browser now worker-lifetime), newsletter
feature∥secondary + teasers∥ + quickHits∥fun, carousel slides ×3, direct-Gemini image routing
(fal fallback, black-frame check, LLMUsage logging), article retryLimit 2 + failed-step reset.
1g: two-wave social runs + global ffmpeg semaphore (max 2). 1h: dual-lane batch advancement.
Provider caps tier-sized (Anthropic Scale, Gemini Tier 2): anthropic 8, gemini 16, openai 6.

**Measured results (staging, 2026-07-11):**
| Item | Baseline | Phase 1 | Δ |
|---|---|---|---|
| Article enrichment (6 diagram sections) | ~15 min | **5m 23s** | −64% |
| Full newsletter generation | ~12 min | **4m 27s** | −63% |
| Social run, two waves (6 specs) | ~25 min | **7m 14s** | −71% |
| Direct-Gemini carousel image | — | 9.3 s, clean | new path |

Quality held throughout: plain-language boxes/glosses normal, 0 caption dashes, 6/6 specs
first-try, no provider-gate congestion warnings. Estimated burst: ~18 h → **~5–6 h**/client/cycle.

⚠️ Operational finding: a deploy's container-overlap briefly EXHAUSTED the 25-connection DB
cluster ("slots reserved for SUPERUSER") — recovered on retry, but Phase-1 parallelism widens
pool usage moments. **The B4 cluster upsize should precede multi-client bursts.** Also: the
staging deploy workflow has NO paths filter (every push deploys, docs included) — adding one is
a cheap ops fix.

Phases 2 (post cap) and 3/3b (drift guard + remediation) still pending. Prod rollout pending.

## Goal

Cut per-item generation latency and per-client monthly burst time roughly in half using safe
parallelism and a direct image-API migration, and close the two operational gaps that bite at
multi-client scale (failed-article retries, uncapped user-requested posts). Grounded in the
2026-07-11 prod E2E measurements.

## Measured baselines (prod E2E, 2026-07-11)

| Item | Today | Driver |
|---|---|---|
| Article incl. enrichment | ~25–40 min | 13 sequential Phase A LLM steps; diagrams are the enrichment long pole (5–10 min serial) |
| Newsletter edition | ~12 min | feature + secondary articles generated serially (the bulk), teasers serial |
| Social run (carousel-heavy) | ~25 min | 8 serial image gens per carousel + serial specs |
| Monthly burst per client | ~18 h worker wall-clock | all of the above × ~47 content items + ~26 social runs |

Constraint analysis: the droplet idles during runs (LLM/image calls are network waits). Real
ceilings are provider rate limits (Gemini RPM, fal queue, Anthropic TPM) and local Chromium/ffmpeg.
pg-boss and DB pooling are NOT constraints for intra-job parallelism.

## Decisions locked (2026-07-11 discussion)

1. **Phase 1 only.** Phase 2 (Phase A research DAG, GEO/PL-detect parallelization) is SHELVED:
   ~3–5 min/article extra for real risk to the executor's resume logic. Revisit at >8–10 clients
   with phase-1 measurements in hand.
2. **Bounded, GLOBAL concurrency.** Semaphores span jobs (article batchSize 2 × social 3 already
   multiply per-job allowances). Chromium pages capped globally.
3. **Plain-language writes stay sequential** per section (the imagery-dedup chain depends on
   order); only independent work parallelizes.
4. **Direct Gemini image API for nano-banana workloads** (steps 150 + 218; diagram restyle is
   already direct). fal stays for FLUX (newsletter heroes) + Seedance (video). Fal is at best
   price-parity with Google for proxied Google models; the concurrency/rate-limit win is the
   point, cost parity the floor.
5. **Article retry parity**: retryLimit 2 like newsletters — cheap because the executor resumes
   from completed steps (proven during the E2E when the writer timeout was manually salvaged).
6. **User-requested extra social posts capped at 3/week** per account (cost control; ~$8.60/mo
   worst-case at carousel prices). Admin-configurable.

## Phase 1a — Diagram section parallelism (biggest single win)

`enrichment/index.ts` diagram loop → process sections through a concurrency-limited pool
(concurrency 3). Per-section chain stays intact (concepts → type → mermaid → SVG render →
rasterize → dark variant → AI restyle → logo → uploads → caption); sections are independent.

- **Global Chromium page semaphore (max 4)** in `diagram-browser-pool.ts`, spanning all jobs —
  acquire/release around render+rasterize. The pool must hand out isolated pages under
  concurrency (verify current implementation; add page-per-acquire if it reuses one page).
- Cost accounting: per-section cost accumulators become per-task sums merged after the pool
  drains (no shared-counter races).
- Failure isolation unchanged: per-section try/catch, SKIP markers as today.
- Expected: 5–10 min → 2.5–4 min per article.
- Tests: semaphore unit tests (limit honored, release on throw); enrichment integration behavior
  unchanged on single-section articles.

## Phase 1b — Newsletter internal parallelism

`newsletter/generate.ts`:
- **Feature ∥ secondary article** (`Promise.all` — independent; distinct imageKeys; PL pass is
  per-article so imagery dedup is unaffected; `usage.record` does DB increments → verify
  concurrency-safe (increment ops are) ).
- **Teasers ×3 in parallel** (independent sources; hookType rotation is index-based, stays
  deterministic).
- quickHits/fun/subject/preview: already short; optionally `Promise.all` quickHits+fun.
- Expected: ~12 min → ~6–7 min per edition.
- Watch: 2× concurrent Sonnet writers per edition × parallel editions in a burst — covered by the
  per-provider limiter (1d).

## Phase 1c — Carousel slide parallelism

`generate-assets.ts` slide loop: background generations through the same pool util, concurrency
3–4. Compositing (sharp) stays serial per slide after its background arrives (fast). Slide order
preserved by index, not completion order.
- Expected: ~160 s → ~50 s per carousel; multiplies across every carousel in every run.
- With direct Gemini (1e) the queue behavior improves further.

## Phase 1d — Global per-provider concurrency limiter

In `lib/net/instrument.ts` (`instrumentCall` wraps every external call — the one choke point):
a keyed semaphore `provider → max concurrent` (defaults: gemini 8, anthropic 4, openai 4,
fal-ai 5; env-tunable). Queued waiters logged when wait > 5 s.
- This is the safety net that makes 1a–1c safe under multi-client bursts, and the future knob
  when providers throttle.
- Tests: limiter honors cap, FIFO-ish fairness, release on error.

## Phase 1e — Direct Gemini image API for nano-banana workloads

Template: `diagram-restyle.ts` already calls `gemini-3.1-flash-image` directly (auth via system
gemini key, per-image ≈ 1290 output tokens).
- New `generateImageWithGemini(prompt, opts)` in the shared image layer; `generateCarouselBackground`
  + featured-image generation route by provider prefix of the configured model (`fal-ai/*` → fal,
  `gemini*` → direct).
- **Safety-filter parity**: fal path needed `enable_safety_checker: false` (benign prompts
  black-framed). Google path: set permissive safety settings + keep the existing black-frame
  detection fallback from the carousel work. A/B eyeball slides on staging before prod cutover.
- Config flips (admin rows, no deploy): step 150 + 218 → provider `gemini`,
  model `gemini-3.1-flash-image`. Cost-table entry for per-image pricing (~$0.04) so dashboards
  stay truthful. fal remains the fallback on gemini failure (resilience wrapper).
- Prod's 218 was aligned to staging's intent (`fal-ai/nano-banana-2`) on 2026-07-11 as an interim
  step — the migration then swaps both environments to the direct model.

## Phase 1g — Two-wave social run parallelism (IMPLEMENTED 2026-07-11 — measured 25m → 7m14s, 6/6 specs first-try)

User-proposed during Phase-1 review; matches the run's actual dependency graph.

- **Wave 1: the day's feed slots (P1–P3) in parallel** — mutually independent (distinct post
  types/content sources, per-slot spec-result rows, per-slot try/catch + `retryAutomationSpec`
  already exist). **Wave 2: story slots (S1–S3) in parallel after wave 1 settles** — stories
  depend on feed assets (S1 needs P1's carousel backgrounds, pitch stories reuse feed slides;
  confirmed live: "Feed carousel P1 required before S1").
- **Prerequisite: a global ffmpeg semaphore (max 1–2 encodes)** — this is the first
  parallelization stacking CPU-BOUND local work (a feed wave can hold a video reel AND a hook
  video, two multi-minute encodes; concurrent encodes on a 2–4 vCPU droplet just steal each
  other's cores). Same pattern as the mmdc semaphore. The waiting-dominated parts (Seedance,
  image gen, captions) are where the overlap actually pays.
- `currentSpec`/"Creating X of N" UI semantics assume one in-flight spec — switch the chip to
  completed-count (or "n in progress") when this lands.
- **Check at implementation time**: any cross-slot dedup that's implicit in sequential order
  (e.g. same quote landing on the feed quote card and a story quote card the same day) gets the
  diagram treatment — select serially (cheap), generate in parallel.
- Expected: run time goes from ~sum of slots to ~max per wave — roughly **~12–15 min → ~7–10 min**
  post-Phase-1, across ~26 runs per client cycle.
- Sequencing: implement AFTER the Phase-1 timing test so there's a real before/after baseline.

## Phase 1h — Dual-lane batch advancement (IMPLEMENTED 2026-07-11)

User question during Phase-1 review: can bulk-selected articles + newsletters generate in
parallel? Yes — an article and a newsletter share zero state, and the Phase-1 semaphores govern
every real resource (provider caps, Chromium, mmdc, ffmpeg via 1g). The current one-item-at-a-time
behavior is `advanceBatch`'s start-next logic, not a resource limit.

- `advanceBatch` keeps **one article item AND one newsletter item generating concurrently** per
  account (dual lanes). Within each kind, items stay serial — preserves date-ordered review flow
  and keeps Anthropic-cap contention sane (writer + feature∥secondary writers already meet at the
  global cap of 4 during overlaps; graceful queuing, but >2 concurrent items per account has
  diminishing returns).
- Ready-for-review email logic already waits for ALL items — out-of-order completion is invisible
  to the user.
- Expected: article lane (~8 × ~20 min) and newsletter lane (~17 × ~7 min) overlap instead of
  stacking — roughly another 30–40% off a cycle burst's content-generation wall-clock.
- Watch: multiple accounts bursting funnel into the same global provider caps — platform
  throughput becomes provider-limited (correct failure mode: slower, never broken); caps are the
  env-tunable knobs as provider tiers grow.
- Sequencing: after 1g, each with its own before/after measurement.

## Phase 1f — Article retry parity

- `content-batch.ts` startItem + `routes/topics.ts` enqueue: add `retryLimit: 2, retryDelay: 120`
  to ARTICLE_PIPELINE sends (executor resume makes retries cheap — only failed steps re-run).
- Executor's claim guard: on pg-boss retry the job row is 'failed' → claim update must allow
  `failed → in_progress` (it does: `notIn: ['in_progress']`) and reset failed step rows before
  resuming (mirror the manual salvage: delete failed step rows for the job at claim time).
- Batch `checkItem` already handles terminal failure → item 'failed' + ready-email reporting.

## Phase 2 — User-requested social post cap (3/week)

- `platformSettings` (admin singleton) gains `weeklyExtraPostCap` (default 3).
- Count user-initiated generations per account per rolling 7 days (source: posts/runs created via
  the dashboard's manual endpoints, distinguished from cadence runs by origin flag — add
  `origin: 'user' | 'cadence'` to the run/post creation paths that lack it).
- Enforce at the manual generation endpoints with a clear error ("Weekly limit of 3 extra posts
  reached — resets <date>"); UI shows remaining count.
- Worst-case added cost stays ≤ ~$8.60/client/month (3 × 4.33 × $0.66 carousel).

## Phase 3 — Prompt-row drift guard (recurring bug class: 3 instances this week)

- `packages/db/scripts/diff-prompt-rows.ts`: connects to both DBs (or runs per-env producing a
  fingerprint file: stepNumber, key, provider, model, isActive, md5(system#user)), diffs and
  prints staging-only / prod-only / differing. Run before every prod deploy as part of the
  release checklist (documented in PM doc).
- Policy note: admin edits are per-environment by design; anything edited on staging that should
  ship must be replayed to prod deliberately (or edited on prod directly for config-type rows).

### Phase 3b — Remediate the drifts found in the 2026-07-11 audit

Each row change below is an overwrite of existing DB data → **individually sign-off-gated**
(same convention as the de-AI reseed):

1. **Step 202 `social_carousel_plan` (prod stale — confirmed live)**: prod's text returns a
   caption-shaped response; the in-code default-prompt retry rescues it but burns an LLM call and
   failed once during the E2E. Fix: overwrite prod's row with the current in-code/staging text
   (verify staging's text matches the in-code DEF first).
2. **Step 32 `generate_promotional_email` (direction unknown)**: staging and prod texts differ —
   one side was admin-edited at some point. Fix: eyeball both texts side by side, pick the
   intended one, sync the other. Decision needed from the user during implementation.
3. **Step 201 `social_quote_selection` (stale on BOTH, not drift)**: both environments still run
   `openai/gpt-4o-mini` with pre-current text vs. the in-code Anthropic default. Functional since
   the jsonMode adapter fix, but off-convention. Fix: refresh both rows to the current in-code
   defaults (provider anthropic, current prompt text).
4. **Staging orphan rows** (`nl_kids_snack_*` ×4, `nl_tech_free_*` ×3 — zero code references):
   delete from staging, or explicitly keep as parked experiments with a note. User's call;
   default recommendation: delete.
5. Step 218 residual: cosmetic stepName/dummy-text mismatch — auto-resolves when Phase 1e flips
   both rows to the direct Gemini model; no separate action.

## Expected outcomes

| Item | Today | After phase 1 |
|---|---|---|
| Article incl. enrichment | ~25–40 min | ~18–28 min |
| Newsletter | ~12 min | ~6–7 min |
| Carousel-heavy social run | ~25 min | ~15 min |
| Monthly burst per client | ~18 h | **~10–11 h** |
| Comfortable clients / worker | ~5–8 (staggered) | ~10–14 (staggered) |

## Risks / open details

- **Chromium pool under concurrency** is the only genuinely delicate piece of 1a — needs explicit
  page lifecycle + the global semaphore; test with a 6-section article on staging.
- **Provider bursts**: 1d must land before or with 1a–1c (it's the guard rail).
- **Gemini image safety filters** may behave differently than fal's toggle — the A/B eyeball on
  staging is mandatory before flipping prod configs.
- **Usage/cost accounting races** under Promise.all — use per-task accumulators, merge at the end
  (pattern already used in enrichment totals).
- Regeneration paths (single-slide regenerate, section regenerate) share the touched code — keep
  their behavior byte-compatible; they're the paths clients click interactively.

## Touch list

- `apps/api/src/lib/concurrency.ts` (new: semaphore/pool util) + tests
- `apps/api/src/lib/net/instrument.ts` — per-provider limiter
- `apps/api/src/article-pipeline/enrichment/index.ts` + `diagram-browser-pool.ts` — 1a
- `apps/api/src/newsletter/generate.ts` — 1b
- `apps/api/src/social/generate-assets.ts` (+ compositors/carousel.ts) — 1c, 1e routing
- shared image layer (`packages/shared/src/imageGeneration.ts` or api-side equivalent) — `generateImageWithGemini`
- `apps/api/src/article-pipeline/llm/cost-table.ts` — image pricing entry
- `apps/api/src/article-pipeline/content-batch.ts`, `apps/api/src/routes/topics.ts`, `executor.ts` — 1f
- cap: platformSettings schema addition + manual-generation endpoints + dashboard counter UI
- `packages/db/scripts/diff-prompt-rows.ts` (new)
