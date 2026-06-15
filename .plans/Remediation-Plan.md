# Socioply Remediation & Optimization Plan

> Phased plan to fix the security findings and structural debt identified in the
> codebase review, sequenced for safety. Planning document only — no code changes
> until each phase is approved.

## Guiding principles

1. **Safety net first.** No structural change ships until there are tests covering the boundary it touches. This is why test scaffolding leads, not trails.
2. **One concern per PR.** Each phase is a series of small, independently revertable PRs. A schema change and a security fix never ride together.
3. **Migrate before you tighten.** For anything involving stored data (encryption), prove the new path works on all existing rows *before* removing the old path.
4. **Staging parity.** Connectivity-sensitive changes (TLS, SSRF, DB SSL) get verified on a preview/staging deploy against the real DigitalOcean Postgres and a real WordPress site before production.
5. **Behavior-preserving refactors are validated by diff + tests, not by re-reading.** Duplicated-code extraction must produce byte-identical behavior.

---

## Current status (updated 2026-06-15)

**Phases 0–6 COMPLETE and on prod. Phase 7 PAUSED** (unit-testable surface
essentially exhausted — 16 PRs, ~80→~383 tests; remainder is orchestration best
done as integration tests). Detailed running log lives in the
`remediation-effort-status` memory; the Phase 6 PR-by-PR table is in
`Phase6-File-Decomposition.md`; the Phase 7 PR list + paused items are in
`Phase7-Test-Expansion.md`.

- **Phase 0** ✅ — Vitest + CI (`.github/workflows/ci.yml` `verify` job:
  prisma generate → build shared → `pnpm -r typecheck`/`lint`/`test`) + Phase-0
  characterization tests.
- **Phase 1** ✅ — M3 sanitize-html, M1 rate-limit key, L3 generic 500s, L4 upload
  content-type sniff, L2 admin in-route auth.
- **Phase 2** ✅ — H1 (TLS verify scoped to Postgres; prod DB via private VPC
  endpoint) + H2 (WordPress SSRF guard).
- **Phase 3** ✅ — M2 strict v2 encryption (migrate → verify → tighten).
- **Phase 4** ✅ — A1 single canonical Prisma schema in `packages/db`. (Incl. **B2**
  migration baseline so a fresh DB builds from migrations.)
- **Phase 5** ✅ — A2 shared libs consolidated into `@socioply/shared` (encryption,
  storage, imageGeneration, twitterApi, telegramApi, threadsApi, linkedinApi,
  socialConnections, instagramUsername + the single globalThis Prisma client).
- **Phase 6** ✅ — A3 all 7 God-files decomposed into `features/*` (PRs #23/#27/#31/
  #38/#42/#43/#44) + A5 hygiene (#46) + Twitter logging (#45) + social dedup (#47).
  All 8 original security findings (H1/H2/M1/M2/M3/L2/L3/L4) closed.

**Remaining to close out this plan** (Phase 7 unit work is paused, see below):
- **B1** — close public SSH / Tailscale-only deploy (NOT done).
- **B4 step 2** — durable connection-pool fix: DO PgBouncer pool for `socioply_staging`
  or cluster upsize (step 1, the pg-boss pool cap, is done).
- **Phase 7 integration-test harness** (optional remainder) — disposable Postgres +
  separate CI job for the orchestrators deferred in `Phase7-Test-Expansion.md`.
- **Minor papercuts** (tracked in `remediation-effort-status` memory): eager-decrypt-
  all-then-500 still unfixed on `/api/settings` + `/api/social/connections`; voice/GHL
  settings don't surface failed saves loudly; Vercel preview Clerk key scoping
  (preview URLs unusable for authed smoke).

**Done:** **B2** (migration baseline) ✅, **B3** (pg client bump) ✅, **B4 step 1**
(pg-boss pool cap) ✅. The user's separate `Phase9-Hardening-Observability.md` is out of
scope for this plan (not scheduled). Optional secondary God-files
(`article-pipeline/enrichment/index.ts` ~966, `routes/articles.ts` ~903) were never in
the core decomposition list.

⚠️ **Twitter end-to-end connect is unverified** (deferred): staging connect 403s at
`/2/users/me` (`client-not-enrolled`) because the dev Twitter app isn't attached to a
Twitter *Project* — an env/portal issue, not code. User is setting up a new Twitter
app. PR #44's callback code is verified correct up to that external boundary.

---

## Phase 0 — Foundation & safety net (no behavior change)

**Goal:** Make it possible to change code with confidence. Nothing here alters runtime behavior.

**Work:**
- Add a test runner (Vitest fits the TS/ESM setup) at the workspace root with per-app configs.
- Add a CI workflow (`.github/workflows/ci.yml`) that runs on every PR: `pnpm -r typecheck`, `pnpm -r lint`, `pnpm -r test`. This becomes the gate for all later phases.
- Write **characterization tests** (tests that lock in *current* behavior) for the four boundaries every later phase depends on:
  - `encryption.ts` — encrypt→decrypt round-trip, v2 format, legacy base64 decode, plaintext passthrough. (Locks behavior before Phase 3 changes it.)
  - `api-proxy.ts` — returns 401 without token, forwards Bearer token, handles upstream 503.
  - Ownership scoping — a representative `articles`/`media` handler returns 404/empty for another user's `userId`.
  - `oauth.ts` — state is single-use (second consume fails) and expires.
- Document a rollback runbook: each phase deploys behind a git tag; note the exact revert command and which env vars/migrations are involved.

**Verification:** CI green on a no-op PR. Tests pass against current `main`.

**Risk:** None — additive only.

---

## Phase 1 — Surgical security fixes (low blast radius)

**Goal:** Close the defensive gaps that are additive and don't touch connectivity or data-at-rest. Each is a tiny, self-contained PR.

**Work:**
- **M3 — Sanitize rendered HTML.** Add `isomorphic-dompurify`; wrap the `dangerouslySetInnerHTML` value in `ArticleEditor.tsx:272` through a `sanitize()` helper with an allowlist that preserves the article formatting the pipeline produces (headings, lists, links, code, tables, the diagram islands). Verify against a few real generated articles that nothing renders differently.
- **M1 — Fix rate-limit key.** Add a Fastify `preHandler` (or `onRequest` hook) that verifies the Clerk token once and sets `req.clerkId`, so the `keyGenerator` in `ai.ts`/`images.ts` keys on the real user instead of silently falling back to `req.ip`. Keep `?? req.ip` as the unauthenticated fallback. Verify the limiter triggers per-user in a test.
- **L3 — Generic 500 messages.** In the Fastify `setErrorHandler` (`index.ts:62`), return a generic message to the client for unhandled 500s while still logging full detail to Sentry/pino. Preserve intentional `statusCode`/`message` for handled 4xx.
- **L4 — Validate upload content type.** In `images.ts`/`media` upload handlers, sniff actual bytes (the existing `image-size` dep, or a magic-number check) instead of trusting the data-URL prefix and filename.
- **L2 — Defense-in-depth admin auth.** Add an in-route auth/role check to `apps/api/src/routes/admin.ts` so it's not protected by the Caddy block + `ADMIN_ENABLED` flag alone.

**Verification:** New unit tests for M1/M3; manual smoke of article rendering, an AI generate call, an image upload, and the admin page.

**Risk:** Low. M3 is the only one with user-visible potential (over-aggressive sanitization) — mitigated by testing against real article HTML before merge.

---

## Phase 2 — Connectivity-sensitive security fixes

**Goal:** Fix the two findings that touch outbound networking. These need staging verification against the real DO Postgres and a real WordPress site, because getting them wrong breaks DB or publishing.

**Work:**
- **H1 — Scope TLS verification to Postgres only.** Remove the three global `process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'` lines (`index.ts`, `worker.ts`, the migrate script) and the global effect of `queues/index.ts`. Replace with a Postgres-specific SSL config:
  - Preferred: obtain the DigitalOcean CA certificate, ship it with the API container, and pass `ssl: { ca: <cert>, rejectUnauthorized: true }` to both the Prisma datasource (via `?sslmode=verify-full` + `sslrootcert`) and the `pg-boss` connection (`queues/index.ts`).
  - Fallback if the CA can't be pinned cleanly: keep `rejectUnauthorized: false` **only** on the Postgres/pg-boss connection objects, never process-wide. This already restores TLS verification for Clerk/OpenAI/Anthropic/S3/WordPress, which is the actual security win.
  - **This is the riskiest single change** — if the DB SSL config is wrong, the API and worker won't connect. Verify on a staging deploy against the real DO database *and* confirm pg-boss starts, before touching production. Have the revert tag ready.
- **H2 — SSRF guard on WordPress fetches.** Add a `validateExternalUrl()` helper used by `verifyConnection`/`detectSeoPlugin` in `wp-connections.ts`: require `https`, resolve the hostname, and reject loopback / RFC-1918 / link-local (`169.254.0.0/16`, including the metadata IP) / unspecified ranges. Re-check after DNS resolution to defeat rebinding. Allow a configurable allowlist if any legitimate self-hosted internal WP instances exist. Verify a real external WordPress connection still validates and an internal IP is rejected.

**Verification:** Staging deploy connects to DO Postgres with verification enabled; pg-boss jobs run; a real WP connection verifies; SSRF test cases (localhost, 127.0.0.1, 169.254.169.254, a 10.x host) all rejected.

**Risk:** H1 medium-high (DB connectivity) — fully gated by staging. H2 low-medium (could reject a legit host) — mitigated by the allowlist escape hatch.

---

## Phase 3 — Encryption hardening (data-sensitive, strict ordering)

**Goal:** Make `decrypt()` reject anything that isn't authenticated v2 ciphertext — *without* orphaning existing rows. Order is non-negotiable: migrate first, prove it, then tighten.

**Work (in order):**
1. **Audit & migrate.** Run `scripts/migrate-encryption.ts` against production (in a maintenance window) to upgrade all legacy base64/plaintext credential rows to v2. First run it in report-only/dry-run mode to count how many rows are in each format.
2. **Verify.** Confirm every credential row now starts with `v2.` and that decrypt succeeds for all of them. Keep `ENCRYPTION_KEY_OLD` set during the window if key rotation is involved.
3. **Tighten.** Only after step 2 is clean: remove the legacy base64 and plaintext-passthrough branches from `decrypt()`, and change the failure mode from "return `''`" to "throw" (or return a typed error the callers handle explicitly), so a tampered/corrupt credential surfaces loudly instead of degrading to an empty key.
4. Keep the dev fallback key, but add a startup assertion that it's never reachable when `NODE_ENV=production`.

**Verification:** Characterization tests from Phase 0 updated to assert the new strict behavior; a manual decrypt of every provider's stored key in staging.

**Risk:** Medium — mismanaging the order could lock out stored OAuth tokens / API keys. The migrate-verify-then-tighten sequence and the maintenance window contain it.

---

## Phase 4 — Single source of truth for the Prisma schema (A1)

**Goal:** Eliminate the triplicated `schema.prisma`. This is the highest-value structural fix because schema drift corrupts data, not just types.

**Work:**
- Make `packages/db/prisma/schema.prisma` the canonical schema and `@socioply/db` export the generated client.
- Point both `apps/web` and `apps/api` at the shared generated client; remove `apps/web/prisma/schema.prisma` and `apps/api/prisma/schema.prisma`.
- Reconcile the `prisma generate` step in each app's build (and the Dockerfile / Vercel build) so the client is generated from the one schema.
- Confirm the three files are still byte-identical *before* deleting two of them (they are today) so this is a pure consolidation with no model change.

**Verification:** Typecheck passes in both apps against the shared client; a migration generated from the canonical schema is a no-op (proves no drift was hiding); staging build succeeds on both Vercel and the DO Docker image.

**Risk:** Medium — build-config heavy (Docker + Vercel both generate Prisma). Verify both deploy targets on staging. Pure structural move, no runtime logic change.

---

## Phase 5 — Shared library extraction (A2)

**Goal:** Collapse the copy-pasted libs into a shared workspace package so a fix is applied once.

**Work:**
- Create `packages/shared` (or `packages/integrations`).
- **First reconcile the diverged files** — `storage.ts` and `imageGeneration.ts` differ between web and api. Diff them, decide the correct unified behavior, and write tests pinning it *before* moving. (These are the dangerous ones precisely because they've already drifted.)
- Move the identical libs (`twitterApi`, `telegramApi`, `threadsApi`, `encryption`, `socialConnections`, `instagramUsername`, `linkedinApi`) into the shared package; update imports in both apps.
- Do this **one library per PR**, each gated by CI, starting with `encryption` (smallest, best-tested after Phase 3) to validate the extraction mechanics, then the larger `twitterApi` (1071 lines).

**Verification:** Per-PR: imports resolve, typecheck + tests green, behavior identical (the moved file is unchanged content). Smoke each platform integration touched.

**Risk:** Low-medium per library, contained by doing them individually. The diverged files are the only real thinking required.

---

## Phase 6 — File decomposition & repo hygiene (A3, A5)

**Goal:** Make the oversized files reviewable and de-clutter the root. Lowest urgency, highest churn — do it last so it doesn't collide with the security/structural work.

**Work:**
- Decompose the God-files incrementally, extracting cohesive sub-components/hooks without changing behavior: `settings/page.tsx` (2515), `workflow/[jobId]/page.tsx` (2083), `IdeaCapture.tsx` (1298), `dashboard/page.tsx` (1249), `posts/[id]/page.tsx` (1229), `social/[platform]/callback/route.ts` (1059). Lean into the existing `features/` folder convention.
- One file per PR; rely on React testing + manual smoke since these are UI-heavy.
- **A5 — Hygiene:** move the ~12 root `*.md` setup docs into `.documentation/`; archive or delete the completed one-off `scripts/*.js` migrations (keep anything still referenced by package scripts or runbooks). This is cosmetic and risk-free but improves navigability.

**Verification:** Manual smoke of each decomposed page; visual regression check on settings/workflow/dashboard.

**Risk:** Low individually, but high churn — strictly one screen per PR, no behavior change.

---

## Phase 7 — Broaden test coverage (A4) ← **PAUSED 2026-06-15 (unit surface exhausted)**

**Goal:** Build out from the Phase 0 characterization tests into real coverage now that the structure is clean.

**Outcome:** 16 additive PRs (#48–#63), all merged to prod and verified, took the suite
from ~80 → **~383 tests** (api 264 + web 15 + shared 104). Coverage now spans the entire
shared platform-adapter layer, the publish pipeline, the article-pipeline pure transforms,
and authz/validation for **every api route file except `social.ts`**. Full PR list + the
deliberately-deferred orchestration items are in `Phase7-Test-Expansion.md`.

**Why paused:** what's left is prisma/LLM/headless-browser **orchestration**
(`buildOutputPayload`, `resolveVariables`, `runArticleEnrichment`, the bundle/wordpress
publish targets, `social.ts` generation). As mock-heavy unit tests these mostly restate
the implementation and stay brittle; the real risk (DB query/`include` correctness, and
LLM/browser behavior) isn't exercised by stubs. They belong in **integration tests
against a throwaway Postgres (separate CI job)** — recorded as the optional remainder
above, not folded into the fast unit suite. No end users yet + manual staging smoke
already gates this layer, so the marginal ROI is low.

**Operational notes (still true, for whoever resumes):**
- api `tsconfig` includes `src/**/*` (no `__tests__` exclude) → a type-error in a test
  reddens CI typecheck AND the Docker build. Tests must typecheck.
- Merging tests under **`apps/api/`** auto-redeploys **prod** (deploy-api.yml paths) →
  run the `staging-deploy-inflight-check` before merge. `packages/shared`/`apps/web` are
  deploy-free.
- Integration tests: throwaway Docker Postgres / testcontainers, NEVER the shared DO
  cluster (B4 budget). Separate CI job. Optional: `vitest --coverage` as visibility, not a gate.

**Risk:** None — additive.

---

## Backlog — deferred hardening (not yet scheduled)

Items discovered during implementation that are worth doing but sit outside the
numbered phases. Recorded here so they aren't lost.

### B1 — Close the public SSH surface (Tailscale-only deploy)

**Finding:** `sudo ufw status` on the prod droplet (`socioply-api-01`) shows
`22/tcp ALLOW Anywhere` — public SSH is open to the internet, exposing it to
brute-force. The migration plan's D9 intent was SSH **closed publicly**, reachable
only over Tailscale, but in practice the implemented `deploy-api.yml` connects over
the public IP, so port 22 was left open. Tailscale is installed and used only for
human/admin access today, not for the CI deploy.

**Why:** an open port 22 is unnecessary attack surface; Tailscale SSH is already
running, so the private path exists.

**How to apply (both prod and the new staging droplet):**
1. Add the `tailscale/github-action` step to `deploy-api.yml` and
   `deploy-api-staging.yml` to join the runner to the tailnet.
2. Change the SSH target from the public IP to the droplet's MagicDNS name
   (`socioply-api-01` / `socioply-api-staging-01`); the `*_DROPLET_PUBLIC_IP`
   secret becomes unnecessary.
3. Once deploys succeed over Tailscale, `sudo ufw delete allow 22/tcp` on both
   droplets.

**Note:** this touches the production deploy workflow, so it must be validated on
staging first (same staging-parity rule as Phase 2). The Vercel → DO API link is
unaffected — that stays HTTPS + Clerk JWT, which is the correct model for a
serverless frontend (Vercel egress IPs can't be put on a tailnet). Tailscale is
only ever the SSH/admin layer, never the app-traffic layer.

### B2 — Migrations can't be replayed on a fresh database

**Finding:** standing up the empty `socioply_staging` database failed with
`P3018 / relation "users" does not exist` while applying
`20251105152615_add_templates_table`. That migration is timestamped **before**
`20251105185333_init` (the one that creates `users`), so on a from-scratch DB it
runs first and references a table that doesn't exist yet. Production never hit this
because its DB was loaded from a dump (the Supabase→DO migration), not replayed from
zero. Staging had to be provisioned by cloning prod's schema + `_prisma_migrations`
history (`pg_dump --exclude-schema=pgboss | psql`) instead.

**Why:** you currently cannot build a working database from migrations alone — this
breaks disaster recovery, any new environment, and clean local setup.

**How to apply:** fix during **Phase 4** (schema consolidation). Squash/baseline the
migration history so the canonical `packages/db` schema applies cleanly to an empty
database in the correct order. Verify by running `prisma migrate deploy` against a
throwaway empty DB in CI.

### B3 — Image Postgres client version lags the managed server (backups likely broken)

**Finding:** the managed cluster is **Postgres 18.4**, but the API image installs
**`postgresql16-client`** (Dockerfile). `pg_dump 16` refuses to dump an 18 server
(`server version mismatch`). The prod DB-backup handler shells out to `pg_dump`, so
**production backups are almost certainly failing.**

**Why:** no working backups is a serious operational risk; also blocks any
host/container-side `pg_dump`/`psql` against the cluster.

**How to apply:**
1. Bump the Dockerfile's `postgresql16-client` → `postgresql18-client` (Alpine
   package) to match the server.
2. Confirm the backup handler produces a valid dump after the bump.
3. Check whether recent prod backups actually succeeded; if not, take a manual dump
   once the client is fixed.

### B4 — Database connection budget too tight for prod + staging

**Finding:** the managed cluster is a small `db-s-1vcpu-1gb` (~22 connection slots).
With prod **and** staging both running — each with an app Prisma pool and a pg-boss
worker (pg-boss defaults to a ~10-connection pool) — the cluster saturates and new
connections fail with `FATAL: remaining connection slots are reserved for roles with
the SUPERUSER attribute`. Observed during Phase 2 staging work; stopping the idle
staging worker freed enough slots. Prod stayed up (no clients yet) but this would
starve prod under real load.

**Why:** two pg-boss workers + two app pools on a 22-slot cluster is over budget;
prod connection failures are a real risk once traffic arrives.

**How to apply (cheapest first):**
1. Cap the pg-boss pool in `queues/index.ts` via the `max` option (e.g. `max: 4`) —
   helps both prod and staging immediately.
2. Give staging its own DO **connection pool** (PgBouncer) and point staging's
   `DATABASE_URL` at it instead of the direct endpoint (staging currently uses the
   direct endpoint for both URLs, which doesn't multiplex).
3. If still tight, upsize the cluster or give staging its own small cluster.

**Interim:** keep the staging worker stopped when not actively testing
(`docker compose stop worker` in `/opt/socioply-staging`).

---

## Sequencing summary & rationale

| Phase | Theme | Why here |
|---|---|---|
| 0 | Test net + CI | Everything else leans on it |
| 1 | Surgical security | Low risk, immediate value, no staging needed |
| 2 | TLS + SSRF | Needs staging; isolate the DB-connectivity risk |
| 3 | Encryption tightening | Must follow a verified data migration |
| 4 | One Prisma schema | Highest structural value; needs Phase 0 net |
| 5 | Shared libs | Easier once schema is unified; per-lib PRs |
| 6 | File splits + hygiene | High churn, zero behavior change — do last |
| 7 | Test expansion | Build on clean structure |

**Immediate wins:** Phase 1 in its entirety (a day or two of small PRs, low risk), then H1 from Phase 2 (the single highest-impact security fix, since it currently disables TLS verification to every third party).

---

## Source findings reference

Security: **H1** global TLS disable, **H2** WordPress SSRF, **M1** rate-limit key falls back to IP, **M2** encryption fails open / plaintext passthrough, **M3** unsanitized `dangerouslySetInnerHTML`, **L2** admin route auth, **L3** error message leak, **L4** upload content-type trust.

Architecture: **A1** triplicated Prisma schema, **A2** duplicated libs across web/api, **A3** oversized files, **A4** no automated tests, **A5** root clutter.

Confirmed *not* vulnerable: SQL injection (Prisma only), shell injection (`execFile`/`spawn` with arg arrays), IDOR/ownership (consistently `userId`-scoped), OAuth CSRF (CSPRNG state + PKCE, single-use), committed secrets (none tracked; `.env*` gitignored).
