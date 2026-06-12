# Phase 5 (remainder) — Prisma client + platform-lib consolidation

> Completes Phase 5. The self-contained libs (`encryption`, `storage`,
> `imageGeneration`) are already consolidated into `@socioply/shared` and live in
> production. What remains is the **prisma-coupled platform-lib cluster**, which
> needs the Prisma *client* shared first. This is the judgment-heavy piece — do it
> in a fresh session with full attention, and validate **connection behavior** on
> staging, not just a green build.

## Current state (already done)

- `@socioply/shared` exists: a **built** workspace package (CJS + `.d.ts`).
  - Exports: `encryption`, `storage`, `imageGeneration` (via `src/index.ts`).
  - Deps it already declares: `@aws-sdk/client-s3`, `@fal-ai/client`, `openai`,
    `@anthropic-ai/sdk`, `@google/generative-ai`.
  - Has `src/global.d.ts` — the ambient `Response.json(): Promise<any>` override
    the platform libs were written against (mirrors `apps/api/src/types/global.d.ts`).
  - `packages/shared/dist/` is **gitignored** (rebuilt by every consumer).
- Build wiring (the current order is **build shared → prisma generate → build apps**):
  - **CI** (`.github/workflows/ci.yml`): a "Build shared package" step
    (`pnpm --filter @socioply/shared build`) runs **after** prisma generate,
    **before** `pnpm -r typecheck`.
  - **Web/Vercel** (`apps/web/package.json` `build`/`vercel-build`):
    `pnpm --filter @socioply/shared build && prisma generate && next build`.
  - **API Dockerfile**: copies `packages/shared` (manifest before install, source
    after), runs `pnpm --filter @socioply/shared build` before `cd apps/api && npx
    prisma generate && npx tsc`, and copies `packages/shared` into the runtime stage.
- Both apps consume the **single canonical Prisma schema** (`packages/db`) from
  Phase 4; each still has its **own** `prisma.ts` client wrapper.

## The remaining libs and why they're not a trivial move

All 6 are **byte-identical** between `apps/web/src/lib` and `apps/api/src/lib`:
`twitterApi`, `telegramApi`, `threadsApi`, `socialConnections`,
`instagramUsername`, `linkedinApi`. But they form a **prisma-coupled cluster**:

| lib | depends on |
|---|---|
| `socialConnections` | **`prisma`** (reads/writes the SocialConnection table) |
| `twitterApi` | `prisma` + `socialConnections` |
| `telegramApi` | `prisma` |
| `instagramUsername` | `prisma` |
| `threadsApi` | `socialConnections` (→ transitive `prisma`) |
| `linkedinApi` | `socialConnections` (→ transitive `prisma`) |

The two client wrappers **differ on purpose**:
- `apps/api/src/lib/prisma.ts` — module-level singleton (long-running api/worker
  process), with `log` config.
- `apps/web/src/lib/prisma.ts` — `globalThis` pattern (prevents Next.js hot-reload
  from creating duplicate clients in dev).

So the libs can't move until the Prisma client is shared.

## The plan: consolidate the Prisma client into `@socioply/shared`, then move the cluster

### Step 1 — Shared Prisma client
- Add `packages/shared/src/prisma.ts` using the **globalThis pattern** (it is
  correct for **both** runtimes: the api process loads the module once → effectively
  a singleton; web gets hot-reload protection in dev and a fresh client per
  serverless invocation in prod). Keep the api's `log` config.
- Export it from `src/index.ts` (`export { prisma } from './prisma'`).
- Add `@prisma/client` to `packages/shared` dependencies (match version `6.19.3`).
- **Do NOT** generate a client inside shared. It imports the same hoisted
  `@prisma/client` both apps generate from the canonical schema; this keeps it a
  single client definition, not a second instance.

### Step 2 — Build-order inversion (the careful part)
`shared` now imports `@prisma/client`, whose **types only exist after `prisma
generate`**. So the order must flip to **prisma generate → build shared → build apps**:
- **CI**: move the "Build shared package" step to run **after** Generate Prisma client (it already does — verify) and confirm typecheck still passes.
- **Web/Vercel**: change to `prisma generate && pnpm --filter @socioply/shared build && next build`.
- **Dockerfile**: the API build currently does `pnpm --filter @socioply/shared build`
  **before** `cd apps/api && npx prisma generate`. **Reorder** so prisma generate
  runs first: e.g. `cd apps/api && npx prisma generate && cd /app && pnpm --filter
  @socioply/shared build && cd apps/api && npx tsc`. (Validate the generated client
  resolves from `packages/shared` in the Docker flat-`node_modules` layout — this is
  the resolution question that can behave differently than local/Vercel.)

### Step 3 — Move the cluster
- Move `socialConnections` first (the root dependency), then `twitterApi`,
  `telegramApi`, `instagramUsername`, `threadsApi`, `linkedinApi`. Since they're
  byte-identical, they can go in **one PR** once the shared prisma client exists.
- Internal imports become relative within `shared` (`./prisma`, `./socialConnections`).
- Repoint **~70 `prisma` import sites** across both apps from their local `prisma.ts`
  to `@socioply/shared`, then delete both `prisma.ts` wrappers.
- **Gotchas we hit on earlier moves — check for all of these:** dynamic
  `await import('@/lib/...')`, `vi.mock('../../lib/...')` in tests, and any
  `@/lib/prisma` / `../lib/prisma` / `./prisma` variants.

### Step 4 — Validate (connection behavior, not just the build)
- typecheck + tests + CI green.
- **Staging deploy** + **Vercel preview** (both build paths).
- **THE KEY CHECK** (the quiet failure mode): on the staging droplet after deploy,
  confirm the worker is `Up` and **not opening extra DB connections** — watch for the
  `remaining connection slots are reserved` error (B4). Verify api + worker each hold
  the expected small connection count. A green build will NOT reveal a client-
  duplication / connection-leak regression; this check will.
- Then prod (api deploy + Vercel), with the same connection check on the prod worker.

## Risks & why fresh context matters
- Build-order + generated-client resolution differ across Docker / Vercel / local —
  reason about each, don't assume.
- Getting prisma instantiation subtly wrong = connection leaks, which only surface
  later as exhaustion (we just fixed B4). Validate connections explicitly on staging.
- ~70 import sites = high chance of a missed dynamic import / mock.

## Optional follow-up
- Replace the ambient `Response.json(): Promise<any>` override with proper runtime
  type guards in the platform libs (the override's own comment calls this out).
