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

## Phase 7 — Broaden test coverage (A4, ongoing)

**Goal:** Build out from the Phase 0 characterization tests into real coverage now that the structure is clean.

**Work:**
- Prioritize: the publish pipeline (`handlers/publish.ts`), the article pipeline stages, social-platform adapters (using the now-shared libs), and the admin authorization paths.
- Add a few integration tests against a disposable Postgres (Docker) for the queue/ownership flows.
- Wire coverage reporting into CI as a visibility metric (not a hard gate initially).

**Risk:** None — additive.

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
