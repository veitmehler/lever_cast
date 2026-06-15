# Phase 7 — Test expansion

> Additive and the **safest** remaining phase — a bad test fails CI, it never breaks
> production. The only caveat: test *quality* depends on understanding the code, so
> it still benefits from focused (not exhausted) attention. Build out from the Phase 0
> characterization tests now that the structure is clean.
>
> **Status (2026-06-15): PAUSED — unit-testable surface essentially exhausted.**
> 16 additive PRs shipped (#48–#63), all merged to prod and verified.
> **~80 → ~383 tests** (api 264 + web 15 + shared 104). What remains is mostly
> prisma/LLM/browser **orchestration** that's better served by integration tests
> than mock-heavy unit tests — deliberately deferred (see "Paused / deferred" below).

## What got done (PRs #48–#63, all on prod)

Deploy-free (`packages/shared`/`apps/web`): #48 telegram+socialConnections, #51
twitter/linkedin/threads/instagram (read+refresh+analytics), #53 twitter/linkedin
post+thread, #56 twitter/linkedin image-upload. **→ the entire shared platform-adapter
layer is covered.**

api-path (each triggered a verified prod deploy): #49 publish + scheduled-publish
handler; #50 keyword-sanitizer + citation-validator + citation-inserter; #52
output-cleaner + schema-builder + grounding-resolver + output registry; #54 topics +
wp-connections routes; #55 ghl routes; #57 voice routes; #58 articles +
social-automation routes; #59 images routes; #60 ai routes; #61 enrichment/html-parser;
#62 output/html-target buildHtmlBody; #63 enrichment faq-parse + geo-question-sanitizer
+ diagram-theme.

**Route groups covered (authz + validation): ALL api route files except `social.ts`** —
media, admin, topics, wp-connections, ghl, voice, articles, social-automation, images, ai.
**Article-pipeline pure layer covered:** keyword/citation transforms, output-cleaner,
schema-builder, grounding, output registry, html-parser, buildHtmlBody, faq-parse,
geo-question-sanitizer, diagram-theme.

## Paused / deferred (NOT done — intentionally)

Mostly **orchestration** (prisma + LLM + headless-browser + S3/archiver). These are
better as **integration tests against a throwaway Postgres** (separate CI job, see
"Infrastructure" below); as mock-heavy unit tests they mostly restate the
implementation and stay brittle. Decision (2026-06-15): pause rather than force them.
- `output/payload-builder.ts buildOutputPayload` (deep nested prisma `include`).
- `variable-resolver.ts resolveVariables` (prisma + LLM-context, ~350 lines).
- `outline-assignment.ts assignOutlineFramework` (prisma + LLM).
- `enrichment/index.ts runArticleEnrichment` (top-level orchestrator: LLM + puppeteer raster).
- `output/bundle-target.ts` / `output/wordpress-target.ts` `class.publish()` (archiver/S3 / WP REST fetch; their pure helpers are internal/not exported).
- `social.ts` generation handlers (rate-limit config + generation deps).
- Small remaining unit gaps, low value: `citation-validator` OxyLabs-proxy branch;
  `postToLinkedIn` image + media-error-retry path (needs a 20s fake timer);
  `mermaid-generator.extractMermaidConcepts` (pure, but its module imports the LLM factory → needs a mock).

**The highest-leverage next step (if/when resumed) is the integration-test harness, NOT
more mock-heavy unit tests.**

---


## Current test baseline (after Phases 0–6)
- Runner: **Vitest**. Four configs: root orchestrator `./vitest.config.ts` +
  per-project `apps/api/vitest.config.ts`, `apps/web/vitest.config.ts`,
  `packages/shared/vitest.config.ts`.
- **Run:** `pnpm -r test` (all projects), or `pnpm --filter @socioply/api test`
  (one project), or `pnpm --filter @socioply/api exec vitest run <path>` (one file).
  `vitest` (no `run`) for watch mode.
- **Convention:** tests are colocated in `__tests__/` next to the code, named
  `*.test.ts`. (No `*.spec.ts` in use.)
- **~70 tests across 16 files today:**
  - `packages/shared/src/__tests__/`: `encryption.test.ts`, `storage.test.ts`
  - `apps/api/src/**/__tests__/`: `no-global-tls-disable`, `lib/error-handler`,
    `lib/image-sniff`, `lib/ssrf`, `middleware/clerk-context`,
    `queues/withNoVerifySsl`, `routes/admin.auth`, `routes/media.ownership`,
    `social/dispatcher-media`, `social/video/music`
  - `apps/web/src/lib/__tests__/`: `api-proxy`, `oauth`, `sanitize-html`
- These are mostly **characterization/unit** tests at security boundaries (the Phase 0
  safety net). Keep them green — they are the source of truth for H1/H2/M1/M2/M3/L2/L4.

## ⚠️ Operational gotcha — api tests trigger a PROD deploy on merge
Unlike Phase 6 (which was almost all web-only and skipped `deploy-api`), Phase 7
touches `apps/api`. **`deploy-api.yml` auto-runs on push to `main` for paths
`apps/api/**`, `packages/db/**`, `pnpm-lock.yaml`.** So:
- Merging a PR that adds tests under **`apps/api/`** → **auto prod API + worker
  container recreate** (even though the test files don't change runtime behavior).
- Tests under **`packages/shared/`** and **`apps/web/`** do NOT trigger `deploy-api`
  (those paths aren't in the filter) — deploy-free.
- **Before merging an `apps/api` test PR, run the in-flight-job check** from the
  `staging-deploy-inflight-check` memory (container recreate kills running jobs:
  article pipeline, social/video generation, scheduled publish — all on the worker).
  Prod has no end users yet, but scheduled publishing runs on the prod worker.
- `deploy-api-staging.yml` is manual (`gh workflow run deploy-api-staging.yml
  -f ref=<branch>`), so staging only redeploys when you trigger it.
- **Optional nicety:** GitHub `paths` supports `!` negation — could add
  `- '!apps/api/**/__tests__/**'` to `deploy-api.yml` so *test-only* api changes
  skip the prod deploy. Verify behavior before relying on it (if a push changes only
  test files, the deploy is skipped; mixed changes still deploy).

## ⚠️ api build compiles test files
`apps/api/tsconfig.json` is `include: ['src/**/*']`, `exclude: ['node_modules','dist']`
— it does **not** exclude `__tests__`. So `tsc` (the `build` script + `typecheck`)
compiles the test files. Consequences:
- A **type error in a test breaks CI `typecheck` AND the Docker build** — tests must
  typecheck cleanly. (Good: tests are typechecked. Bad: sloppy test = red build.)
- This already works today (10 api tests coexist with passing deploys), so following
  the existing `__tests__/*.test.ts` convention is safe; don't introduce a new layout.

## CI (the gate)
`.github/workflows/ci.yml` (`verify` job) runs on every PR:
prisma generate → build `@socioply/shared` → `pnpm -r typecheck` → `pnpm -r lint`
→ `pnpm -r test`. The required green checks on a PR are **`verify`** + **`Vercel –
socioply`**; ignore the chronically-failing stale `lever-cast`, `lever-cast-7rhk`,
`social-calendar` Vercel projects.

## Priorities (highest value first)
1. **Publish pipeline** — `apps/api/src/handlers/publish.ts` and the scheduled-
   publish flow. Real outward actions (social posts); cover the decision logic
   (what's due, idempotency / already-published guards, error handling, per-platform
   dispatch incl. GHL/Omniply vs direct). **Mock the platform adapters + prisma.**
   (api path → triggers deploy on merge.)
2. **Article pipeline stages** — `apps/api/src/article-pipeline/*`. Unit-test the
   **pure transforms** first (low-risk, high-value): `citation-inserter.ts`,
   `citation-validator.ts`, `keyword-sanitizer.ts`, `keyword-validator.ts`,
   `grounding-resolver.ts`, html-parser/TOC, and the output-target
   selection/registry. Leave the `executor.ts` orchestration + `enrichment/` for
   integration-style tests. (api path.)
3. **Platform adapters** — now in `@socioply/shared` (`twitterApi`/`linkedinApi`/
   `telegramApi`/`threadsApi`/`socialConnections`/`instagramUsername`). Test with
   mocked `fetch` + mocked prisma: token refresh, error paths, `Response.json`
   handling. **Deploy-free** (packages/shared). Note `threadsApi` has no consumers
   yet but is intentionally kept — and Threads is slated for GHL/Omniply management
   too (see `threads-via-gohighlevel` memory).
4. **Authorization paths** — extend `requireAdmin` / ownership-scoping coverage to
   more routes; `routes/__tests__/media.ownership.test.ts` is the template, and
   `routes/__tests__/admin.auth.test.ts` for authz. (api path.)
5. **SSRF + encryption** already covered — keep them green as the source of truth.

## Templates to copy (existing tests)
- Ownership / route-handler test → `apps/api/src/routes/__tests__/media.ownership.test.ts`
- Admin/authz → `apps/api/src/routes/__tests__/admin.auth.test.ts`
- Social dispatch w/ mocks → `apps/api/src/social/__tests__/dispatcher-media.test.ts`
- Pure-engine unit test → `apps/api/src/social/video/__tests__/music.test.ts`
- Mocked `fetch`/prisma + security → `apps/api/src/lib/__tests__/ssrf.test.ts`,
  `packages/shared/src/__tests__/encryption.test.ts`
- Web boundary → `apps/web/src/lib/__tests__/oauth.test.ts`

## Infrastructure
- **Integration tests against a disposable Postgres** for queue/ownership flows that
  are hard to unit-test meaningfully: use a **Docker service in CI or testcontainers**
  — a throwaway DB, NEVER the shared DO cluster. ⚠️ **Connection budget (B4):** the
  managed cluster is ~22–25 slots, already shared by prod + staging; do NOT point
  integration tests at it. Gate integration tests behind a **separate CI job** so the
  fast unit suite stays fast.
- Wire **coverage reporting** into CI as a *visibility* metric (`vitest --coverage`),
  **not** a hard gate initially — a coverage gate on a young suite causes more
  friction than value.

## Per-PR validation workflow
1. `pnpm -r typecheck && pnpm -r lint && pnpm -r test` locally. (Do NOT run
   `next build` while the local dev server is up — shared `.next`.)
2. Push → PR. Wait for **`verify`** + **`Vercel – socioply`** green (ignore stale
   Vercel projects).
3. **If the PR touches `apps/api/`:** before merging to main, check for in-flight
   jobs (per `staging-deploy-inflight-check`) since merge auto-redeploys prod api.
   `packages/shared` / `apps/web` test PRs are deploy-free.
4. Merge `gh pr merge N --merge --delete-branch`. If api/db changed, verify the prod
   droplet after (api healthy, worker up, pgboss=5/prisma idle=2 per memory).

## Approach
- **One area per PR**; keep tests fast and deterministic (mock network, DB, clock).
- Prefer testing **behavior at boundaries** over implementation details.
- Reuse the established mocking patterns (`vi.mock` for prisma/clerk/fetch) — copy
  from the templates above.

## Suggested first PR
Start with a **deploy-free, pure-logic** target to re-validate the harness before
touching api-deploy paths: either the `@socioply/shared` adapters (#3) or the pure
article-pipeline transforms — actually those are api-path. The cleanest very-first
PR is a `packages/shared` adapter test (deploy-free, mocked fetch/prisma), then move
to `handlers/publish.ts` (highest value, but api-path → mind the deploy).

## Risk
None to runtime — additive only. The only failure modes: (a) flaky/over-mocked tests
(mitigate: deterministic, boundary-focused); (b) a type-error in a test reddening the
api build (mitigate: typecheck locally); (c) an unnecessary prod api redeploy from a
test-only merge (mitigate: in-flight-job check, or the `!__tests__` paths nicety).
