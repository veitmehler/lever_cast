# Rollback Runbook — Remediation Plan

Companion to [`.plans/Remediation-Plan.md`](../.plans/Remediation-Plan.md). Each
remediation phase ships as one or more small PRs behind a git tag so any change
can be reverted independently. This runbook records how to undo each phase and
what external state (env vars, migrations, generated clients) is involved.

## General principles

- **Tag before deploy.** Tag the commit that goes to production for each phase:
  `git tag phase-<n>-<short-desc> && git push --tags`. Rollback = redeploy the
  previous tag.
- **One concern per PR.** Reverting a PR should never undo an unrelated change.
- **Revert command.** For a merged PR, prefer `git revert -m 1 <merge-sha>` (keeps
  history) over force-pushing. Redeploy after the revert merges.
- **Deploy targets:**
  - `apps/web` → Vercel (auto-deploys on push to `main`; roll back via the Vercel
    dashboard "Promote to Production" on a previous deployment, or revert + push).
  - `apps/api` + worker → DigitalOcean via `deploy-api.yml` (GHCR image tagged with
    the commit SHA; roll back by redeploying the previous SHA tag).

## Phase 0 — Test foundation (this PR)

**What it changes:** Adds Vitest config (`vitest.config.ts`, `apps/*/vitest.config.ts`),
characterization tests under `apps/*/src/**/__tests__/`, `typecheck`/`test` scripts,
the `vitest` devDependency, and `.github/workflows/ci.yml`. **No runtime code changes.**

**Risk:** None — additive tooling only. Nothing ships to Vercel or the DO API.

**Rollback:** Revert the PR. No env vars, migrations, or deploy artifacts are
affected. If only CI is noisy, delete/disable `.github/workflows/ci.yml` rather
than reverting the tests.

**Verification before merge:**
- `pnpm install` succeeds.
- `pnpm -r typecheck` → exit 0.
- `pnpm -r lint` → exit 0 (warnings allowed).
- `pnpm test` → all characterization tests pass.

## Phase 1 — Surgical security fixes

**Involves:** `isomorphic-dompurify` dep (M3), a Fastify preHandler setting
`req.clerkId` (M1), error-handler message change (L3), upload content sniffing (L4),
admin-route auth (L2). No DB/env changes.

**Rollback:** Revert per-fix PRs individually. Redeploy web (Vercel) and/or API (DO).

## Phase 2 — TLS scoping + SSRF guard

**Involves:**
- **H1:** removing global `NODE_TLS_REJECT_UNAUTHORIZED=0`; Postgres-scoped SSL.
  May require shipping the DO CA cert + a `sslrootcert`/`ssl.ca` env or file.
- **H2:** `validateExternalUrl()` in `wp-connections.ts`.

**Rollback:** **Highest-risk phase for connectivity.** If the API/worker can't reach
Postgres after deploy, redeploy the previous GHCR SHA immediately. Keep the prior
image tag noted in the deploy PR. Verify on staging first.

## Phase 3 — Encryption hardening

**Involves:** running `scripts/migrate-encryption.ts` against production (data
mutation), then tightening `decrypt()`. `ENCRYPTION_KEY` / `ENCRYPTION_KEY_OLD`
env vars are in play.

**Rollback:** The code tightening is revertible. The **data migration is not auto-
reversible** — take a DB snapshot before running it. Keep `ENCRYPTION_KEY_OLD` set
through the rollback window so previously-encrypted rows still decrypt.

## Phase 4 — Single Prisma schema

**Involves:** deleting `apps/web/prisma/schema.prisma` and `apps/api/prisma/schema.prisma`
in favor of `packages/db`. Build config (Dockerfile, Vercel) changes for `prisma generate`.

**Rollback:** Revert restores the per-app schemas. Confirm both deploy targets
regenerate the client. No data change (schemas are identical going in).

## Phase 5 — Shared library extraction

**Involves:** moving duplicated libs into a shared workspace package, one per PR.

**Rollback:** Revert the specific library's PR. Behavior is unchanged by design, so
rollback is low-risk.

## Phase 6 — File decomposition + hygiene

**Involves:** splitting oversized components; relocating root docs/scripts.

**Rollback:** Revert per-file PRs. No behavior change.

## Phase 7 — Test expansion

**Involves:** more tests + coverage reporting. Additive.

**Rollback:** Revert the PR; no runtime impact.
