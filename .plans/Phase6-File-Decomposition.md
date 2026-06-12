# Phase 6 — File decomposition & repo hygiene

> High-churn, **judgment-heavy**, and **weakly validated by automated gates** (UI
> behavior is verified by clicking through, not by typecheck). Do it in a fresh
> session, **one screen per PR**, with manual smoke-testing after each. The plan's
> own guidance: do this last so it doesn't collide with the security/structural work.

## Goal
Break up the God-files into reviewable, testable pieces **without changing
behavior**, and tidy the repo root.

## The oversized files (line counts at time of review)
| File | Lines |
|---|---|
| `apps/web/src/app/(protected)/settings/page.tsx` | 2515 |
| `apps/web/src/app/(protected)/workflow/[jobId]/page.tsx` | 2083 |
| `apps/web/src/components/IdeaCapture.tsx` | 1298 |
| `apps/web/src/app/(protected)/dashboard/page.tsx` | 1249 |
| `apps/web/src/app/(protected)/posts/[id]/page.tsx` | 1229 |
| `apps/web/src/app/api/social/[platform]/callback/route.ts` | 1059 |

(Also large: `apps/api/src/article-pipeline/enrichment/index.ts` ~966,
`apps/api/src/routes/articles.ts` ~872 — secondary candidates.)

## Approach (per file, one PR each)
1. Identify cohesive sub-units — a settings *section*, a workflow *panel*, a
   reusable *hook* — and extract them into child components/hooks. Lean into the
   existing `apps/web/src/features/` convention (only `features/social` exists today).
2. Keep behavior identical: same props in, same DOM out. No logic changes in the
   same PR as a move.
3. The `social/[platform]/callback/route.ts` is a server route, not a component —
   decompose it by extracting per-platform handlers into separate modules.

## Validation (the weak spot — plan for it)
- typecheck + lint + the Vercel **preview** build (catches compile/import errors).
- **Manual smoke-test** the decomposed screen on the Vercel preview before merge —
  there are no unit tests for these pages, so a green build is NOT proof the UI works.
  Click the primary flows: settings save, workflow steps, dashboard load, post edit.
- Consider adding a couple of component tests (React Testing Library) for the
  extracted pieces as you go — overlaps with Phase 7.

## Repo hygiene (low-risk, can be one small PR)
- Move the ~12 uppercase root `*.md` setup/fix docs into `.documentation/`
  (which already exists). Keep `README.md` at root.
- Archive or delete the completed one-off `scripts/*.js|*.ts` migration scripts
  (e.g. `add-*.js`, `fix-*.js`) — keep anything still referenced by a package script.
- Cosmetic: prod `DIRECT_URL` has a malformed `sslmode=r>` value (app tolerates it;
  backup handler hardcodes `require`). Fix to `require` opportunistically during a
  maintenance touch of `/opt/socioply/.env.production` — low priority.
- Operational reminder: keep the **staging worker stopped** when not testing
  (`cd /opt/socioply-staging && docker compose stop worker`) until B4's pool cap is
  validated under load.

## Risk
Low per-PR if strictly behavior-preserving, but **high churn** and **manual-only
validation** — hence one screen per PR and fresh attention.
