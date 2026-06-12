# Phase 7 — Test expansion

> Additive and the **safest** remaining phase — a bad test fails CI, it never breaks
> production. The only caveat: test *quality* depends on understanding the code, so
> it still benefits from focused (not exhausted) attention. Build out from the Phase 0
> characterization tests now that the structure is clean.

## Current test baseline (after Phases 0–5)
- Runner: Vitest, root orchestrator (`vitest.config.ts`) with per-project configs
  for `packages/shared`, `apps/api`, `apps/web`. CI runs `pnpm -r test`.
- ~70 tests today: encryption + storage (in `@socioply/shared`), api (clerk-context,
  error-handler, image-sniff, admin auth, media ownership, no-global-tls-disable,
  withNoVerifySsl, ssrf), web (oauth, api-proxy, sanitize-html).
- These are mostly **characterization/unit** tests at security boundaries.

## Priorities (highest value first)
1. **Publish pipeline** — `apps/api/src/handlers/publish.ts` and the scheduled-
   publish flow. This executes real outward actions (social posts); it deserves
   coverage of the decision logic (what's due, idempotency, error handling). Mock the
   platform adapters.
2. **Article pipeline stages** — `apps/api/src/article-pipeline/*` (executor,
   enrichment, output targets). Unit-test the pure transforms (html-parser, TOC,
   citation insertion) and the output-target selection/registry.
3. **Platform adapters** — once they live in `@socioply/shared` (the prisma/libs
   plan), test `twitterApi`/`linkedinApi`/etc. with mocked `fetch` + mocked prisma:
   token refresh, error paths, the `Response.json` handling.
4. **Authorization paths** — extend the `requireAdmin` / ownership-scoping coverage
   to more routes (the media ownership test is the template).
5. **SSRF + encryption** already covered — keep them green as the source of truth.

## Infrastructure
- Add a few **integration tests** against a disposable Postgres (Docker service in
  CI, or testcontainers) for the queue/ownership flows that are hard to unit-test
  meaningfully. Gate behind a separate CI job so the fast unit suite stays fast.
- Wire **coverage reporting** into CI as a *visibility* metric (e.g. vitest
  `--coverage`), **not** a hard gate initially — a coverage gate on a young suite
  causes more friction than value.

## Approach
- One area per PR; keep tests fast and deterministic (mock network, DB, clock).
- Prefer testing **behavior at boundaries** over implementation details.
- Reuse the established mocking patterns (`vi.mock` for prisma/clerk/fetch).

## Risk
None to runtime — additive only. The only failure mode is flaky/over-mocked tests,
mitigated by keeping them deterministic and boundary-focused.
