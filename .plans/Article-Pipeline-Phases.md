# Article Production Pipeline — Phased Implementation Plan

> **Status: IMPLEMENTED** (audited 2026-07-09) — all phases live in production (pipeline steps 0–13, quality gate, enrichment). Originally a phased roadmap derived from `article-production-pipeline.implementation-plan.md`.
> **Estimated total effort:** 5–7 weeks for one focused developer
> **Estimated cost increment:** ~$0–10/mo infrastructure (LLM costs are use-driven, see §3)
> **Prerequisite:** Phases 0–10 of `Migration-DigitalOcean-Plan.md` complete (✅), Phase 9 hardening complete (✅)
> **Source-of-truth spec:** `article-production-pipeline.implementation-plan.md` (2,550 lines) — this document references it but does not duplicate prompts/schemas

---

## 0. Decisions Recorded

These decisions were made before phasing and apply across all phases below.

| # | Topic | Decision |
|---|---|---|
| D1 | **Cost model** | We absorb all LLM costs. Per-user usage is tracked from day 1 for future quota enforcement. No billing integration in v1. |
| D2 | **Future quotas (NOT enforced in v1, designed-for)** | 3 articles/week per user. (LinkedIn / Medium / 18 social posts / 5 newsletters per week — built later, after article pipeline ships.) |
| D3 | **API keys** | Article pipeline uses **system-owned** LLM keys (configured via env vars + admin UI). Existing per-user `ApiKey` flow stays for `social_only` mode (users can bring their own keys for that). |
| D4 | **Rollout** | Available to all signed-up users immediately on ship. No feature flag. |
| D5 | **UI patterns** | Reuse existing dashboard component patterns. Build a dedicated `/admin/*` area (admin-only, role-gated) for cost management, API keys, AI model management, prompt templates, error logs, and pipeline run inspection. |
| D6 | **Per-tenant Settings** | Light — adds a "Settings" tab where users provide WordPress connections, plus optional info that flows into prompts (clarified per-phase). |
| D7 | **Prompt template editing** | Admin-only. No per-tenant prompt overrides in v1. |
| D8 | **Test strategy** | Heavy on detailed output tracking + error logging in admin (every LLM call's input + output persisted and viewable). Light on automated tests for LLM outputs (snapshot tests are too flaky). Unit tests for deterministic helpers (parsers, validators). |
| D9 | **Admin role** | New column `User.role` (enum: `user` \| `admin`). Set via DB SQL initially. Middleware enforces on `/admin/*` and admin API routes. |

---

## 1. Phasing Overview

The plan splits into **6 sequential implementation phases** plus an admin area that grows incrementally with each phase.

| Phase | Title | Effort | Ship Goal |
|---|---|---|---|
| **A1** | Foundation: data model, LLM layer, system keys, topic ingestion, admin shell | 5–7 days | Topic created via API; admin area accessible; system LLM keys configured |
| **A2** | Article generation MVP — Phase A pipeline (steps 1–12), Preview output | 7–10 days | Generate full article (no images, no SEO meta yet) end-to-end. Internal beta only. |
| **A3** | Approval chain — Phase B (steps 13, 15, 17, 18), featured image, SitePage | 4–6 days | User can review article, click Approve, get featured image + SEO metadata + SitePage. |
| **A4** | Mandatory enrichment — Phase C (Mermaid diagrams) | 5–8 days | Every approved article has working diagrams or clear, actionable failure mode. |
| **A5** | Output targets — Phase D (HTML, Bundle, WordPress) + WP connection setup | 7–10 days | User can publish to WordPress, download HTML, or download a zip bundle. |
| **A6** | Article-to-social handoff (Phase E) + CSV upload + dashboard mode toggle + prompt admin UI | 5–7 days | Users can upload topic CSV; trigger social posts from article content; admin can edit prompts via UI. |
| **Total** | | **33–48 days** | (~7–10 weeks calendar time with normal interruptions) |

**Cross-cutting work** (admin area expansion, cost tracking, error logging) is integrated into each phase, not a separate phase.

---

## 2. Cross-Cutting Concerns

### 2.1 Admin Area — built incrementally across all phases

The admin area is a **first-class concern** because it's where you'll diagnose every issue, track every cost, and monitor health. It grows phase by phase.

#### Architecture

```
apps/web/src/app/admin/                    ← Next.js app router admin pages
├── layout.tsx                              ← admin role gate + sidebar
├── page.tsx                                ← admin dashboard (cost summary, queue depths)
├── llm/page.tsx                            ← system LLM keys + model registry (A1)
├── prompts/page.tsx                        ← prompt template editor (A6)
├── articles/page.tsx                       ← all article jobs across users (A2 grows this)
├── articles/[jobId]/page.tsx               ← per-job detail with full step trace (A2)
├── users/page.tsx                          ← user list with usage stats (A1)
├── errors/page.tsx                         ← ErrorLog viewer (A1, grows with each phase)
└── costs/page.tsx                          ← cost breakdown by user/model/day (A1)
```

#### Access control pattern

```typescript
// apps/web/src/app/admin/layout.tsx
export default async function AdminLayout({ children }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')
  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (user?.role !== 'admin') redirect('/dashboard')
  return <AdminShell>{children}</AdminShell>
}
```

API routes follow the same pattern via a `requireAdmin()` middleware.

#### Initial admin bootstrap

After Phase A1 deploys:
```sql
UPDATE users SET role = 'admin' WHERE email = 'mehler.veit@gmail.com';
```

### 2.2 Cost tracking — designed for D2 quotas from day 1

Every LLM call writes a row to `LLMUsage`. Aggregations roll up to `User.weeklyUsage` and `User.monthlyUsage` JSON columns refreshed nightly.

```prisma
model LLMUsage {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  jobId       String?  // null for ad-hoc generations (social_only)
  stepNumber  Int?
  provider    String   // gemini | openai | anthropic | fal-ai | openrouter
  model       String
  inputTokens Int
  outputTokens Int
  cost        Float    // USD, computed from cost table
  source      String   // 'article-pipeline' | 'social-only' | 'enrichment' | 'image-gen'
  createdAt   DateTime @default(now())

  @@index([userId, createdAt])
  @@index([jobId])
  @@index([source])
}
```

**Admin view** (`/admin/costs`):
- Total cost last 7 days / 30 days / 90 days (org-wide)
- Per-user cost ranking (top 10)
- Per-model cost breakdown
- Per-source cost (article-pipeline vs social-only vs image-gen)
- Daily trend graph

**Future quota check (stub now, enforced later):**
```typescript
async function checkQuota(userId: string, source: 'article-pipeline'): Promise<{ allowed: boolean; reason?: string }> {
  const weekStart = startOfWeek(new Date())
  const articleCount = await prisma.articleJob.count({
    where: { userId, status: { in: ['completed', 'approved', 'enriched', 'exported'] }, startedAt: { gte: weekStart } }
  })
  // Quota table will be added later — for now always allow but log usage
  return { allowed: true }
}
```

### 2.3 Detailed output tracking — every LLM call captured

Per D8, every LLM interaction is persisted in `PipelineStep` (already in schema). The admin per-job view (`/admin/articles/[jobId]`) shows:

- **Inputs:** resolved prompt (after `{{variable}}` substitution), system prompt, model, params
- **Outputs:** raw LLM response, parsed result, parse errors if any, retry attempts
- **Metadata:** input/output tokens, cost, duration, provider, model
- **Status:** completed/failed/pending with error message

For non-step calls (Mermaid generation, image generation, social handoff), separate tables persist the same data.

### 2.4 Error logging — single source of truth

Existing `ErrorLog` model gets a tenant `userId` column and a viewer at `/admin/errors`:

- Filter by user / step / quota type / date range
- Stack trace + retry-after seconds
- Link to the article job that produced it
- "Mark resolved" workflow for follow-up

### 2.5 Test strategy

Per D8: **detailed observability over heavy automated testing**.

| Test type | Coverage | Tooling |
|---|---|---|
| **Unit tests** | Deterministic helpers: parsers, validators, variable resolver, output cleaner, JSON parsers | Vitest |
| **Integration tests** | DB models, queue handlers (mocked LLM), API routes | Vitest + test DB |
| **Manual testing** | LLM-output quality, prompt regressions, end-to-end flows | Manual via admin UI |
| **Snapshot tests** | Skipped (LLM outputs are non-deterministic) | — |
| **End-to-end tests** | Skipped in v1 — admin observability covers this | — |

Trade-off: we move faster but rely on heavy admin tooling to spot regressions in production. Acceptable given low user volume initially.

### 2.6 Logging conventions

Every pipeline step logs (via shared pino `logger`):
- `[article-pipeline] step started` with `{ jobId, stepNumber, userId }`
- `[article-pipeline] step completed` with `{ jobId, stepNumber, duration_ms, inputTokens, outputTokens, cost }`
- `[article-pipeline] step failed` with `{ jobId, stepNumber, err, retry }`

Errors hit Sentry with tags `pipeline:article` and the job + step context.

---

## 3. Cost Estimates (Operational)

Per the source plan §16.15:

| Phase | Approx tokens | Approx cost per article |
|---|---|---|
| A — Steps 1–12 | 50k–140k | $0.11–$0.24 |
| B — Steps 13, 15, 17, 18 | 5k–15k + Fal flat | $0.04–$0.05 |
| C — Mermaid enrichment | 5k–15k | $0.03–$0.08 |
| **Total per article (no exports)** | **~85k–185k** | **~$0.18–$0.38** |

At quota (3 articles/week per user):
- **1 user:** ~$1.14/month
- **10 users:** ~$11.40/month
- **100 users:** ~$114/month
- **1000 users:** ~$1,140/month — at this point quota enforcement becomes financially critical

Plan: monitor monthly cost in `/admin/costs`. Set alert in Better Stack when daily cost > $10/day.

---

## 4. Phase A1 — Foundation: data model, LLM layer, system keys, topic ingestion, admin shell

**Effort:** 5–7 days
**Goal:** All plumbing in place. User can create a Topic via API, but pipeline doesn't run yet. Admin area accessible.

### 4.1 Goals & success criteria

- ☐ All new Prisma models created and migrated (Topic mode column, ArticleJob, PipelineStep, PromptTemplate, SitePage, ArticleDiagram, WordPressConnection, OutputAttempt, LLMUsage, User.role)
- ☐ `packages/llm/` package exists with all 5 provider adapters (Gemini, OpenAI, Anthropic, OpenRouter, Fal.ai)
- ☐ System LLM keys configured via env vars; admin UI shows them (read-only, masked)
- ☐ `POST /api/topics` creates a Topic row; returns `{ topicId, articleJobId? }`
- ☐ pg-boss queues `article-pipeline`, `article-enrichment`, `article-output`, `generate-social-from-article` registered (handlers stubbed)
- ☐ Admin layout + role gate works; `/admin` shows a dashboard skeleton
- ☐ All 18 prompt templates seeded into DB (verbatim from source plan §7)
- ☐ `LLMUsage` table populated on every LLM call (tested with stub call)

### 4.2 Files to create / modify

#### Database (Prisma)
- `packages/db/prisma/schema.prisma`
  - Add `User.role` enum (`user` \| `admin`), default `user`
  - Add all new tables per source plan §2
  - Add `LLMUsage` table (this plan §2.2)
  - Add migration

#### LLM package (new)
- `packages/llm/package.json`
- `packages/llm/src/adapter.ts` — `LLMAdapter` interface
- `packages/llm/src/factory.ts` — `getLLMAdapter(provider, userId, source)`
- `packages/llm/src/cost-table.ts` — model → input/output cost per 1M tokens
- `packages/llm/src/usage-tracker.ts` — writes `LLMUsage` row after every call
- `packages/llm/src/{gemini,openai,anthropic,openrouter,fal}.ts` — provider implementations
- `packages/llm/src/index.ts` — barrel export

#### System key resolution
- `apps/api/src/lib/system-keys.ts` — `getSystemApiKey(provider)` reads env var, falls back to `SystemApiKey` DB row if env missing
- `packages/db/prisma/schema.prisma` — add `SystemApiKey` table (provider, encryptedKey, updatedAt)

#### API routes
- `apps/api/src/routes/topics.ts` — `POST /topics`, `GET /topics`
- `apps/api/src/routes/admin/index.ts` — registers admin sub-routes
- `apps/api/src/routes/admin/llm-keys.ts` — `GET /admin/llm-keys` (masked), `PUT /admin/llm-keys/:provider`
- `apps/api/src/routes/admin/costs.ts` — `GET /admin/costs?period=7d|30d|90d`
- `apps/api/src/routes/admin/users.ts` — `GET /admin/users`, `PATCH /admin/users/:id` (role)
- `apps/api/src/routes/admin/errors.ts` — `GET /admin/errors` paginated
- `apps/api/src/middleware/admin.ts` — `requireAdmin(req)` middleware

#### pg-boss
- `apps/api/src/queues/index.ts` — already has the 4 article queues registered ✅
- `apps/api/src/handlers/article-pipeline.ts` — STUB: log and exit
- `apps/api/src/handlers/article-enrichment.ts` — STUB
- `apps/api/src/handlers/article-output.ts` — STUB
- `apps/api/src/handlers/generate-social-from-article.ts` — STUB
- Wire into `apps/api/src/worker.ts`

#### Frontend (Next.js admin shell)
- `apps/web/src/app/admin/layout.tsx` — auth/role gate, sidebar nav
- `apps/web/src/app/admin/page.tsx` — dashboard placeholder (cost summary widget)
- `apps/web/src/app/admin/llm/page.tsx` — system LLM keys (masked, button to update)
- `apps/web/src/app/admin/costs/page.tsx` — cost breakdown
- `apps/web/src/app/admin/users/page.tsx` — user list with role + total cost
- `apps/web/src/app/admin/errors/page.tsx` — error log viewer
- `apps/web/src/components/admin/Sidebar.tsx`, `KpiCard.tsx`, `DataTable.tsx` — reusable

#### Seed data
- `packages/db/prisma/seed.ts` — extend to seed all 18 PromptTemplate rows (verbatim from source plan §7)
- Run with `pnpm prisma db seed`

### 4.3 Tasks

#### Day 1 — Prisma & migrations
1. Update `schema.prisma`: add `User.role`, all article-pipeline tables, `LLMUsage`, `SystemApiKey`
2. Run migration locally, verify schema
3. Generate updated Prisma client
4. Test in local dev (no app code yet — just `prisma studio` to inspect)

#### Day 2 — `packages/llm/`
1. Scaffold the package with `pnpm init`, add to `pnpm-workspace.yaml`
2. Implement `LLMAdapter` interface (matches source plan §3)
3. Implement Gemini, OpenAI, Anthropic adapters first (most common)
4. Implement `cost-table.ts` with current pricing
5. Implement `usage-tracker.ts` — after every adapter call, INSERT into `LLMUsage`
6. Test with a one-off script that calls Gemini and confirms a `LLMUsage` row exists

#### Day 3 — System keys & topic API
1. Implement `system-keys.ts` (env first, DB fallback)
2. Move `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `OPENROUTER_API_KEY`, `FAL_KEY` from droplet's `.env.production` (verify they're already there or add)
3. Update `apps/api/src/routes/topics.ts` to handle `POST /topics` for `social_only`, `article_only`, `article_first` modes
4. Stub: in v1, only `social_only` invokes existing path; `article_only` and `article_first` enqueue `article-pipeline` (which is also a stub)

#### Day 4 — Admin role + middleware + first admin pages
1. Add `User.role` middleware in `apps/api/src/middleware/admin.ts`
2. Add `apps/web/src/app/admin/layout.tsx` with Clerk + role check
3. Build `/admin` dashboard skeleton (queue depths card, cost-last-7-days card, recent-errors card)
4. Build `/admin/llm` page (read-only display of system keys, masked)
5. Bootstrap own user as admin via SQL: `UPDATE users SET role='admin' WHERE email='mehler.veit@gmail.com';`

#### Day 5 — Cost & error & user pages, prompt seeding
1. Build `/admin/costs` with daily-trend graph (use Recharts, already in app)
2. Build `/admin/errors` paginated table
3. Build `/admin/users` with role toggle + total-cost column
4. Seed all 18 PromptTemplate rows from source plan §7 (use upsert-by-stepNumber)
5. Verify in `prisma studio`

#### Day 6 — pg-boss handler stubs + integration test
1. Stub all 4 article queue handlers (just log + exit)
2. Verify worker starts cleanly with new queues
3. Test end-to-end: `POST /api/topics` (mode=`article_only`) → DB row → `article-pipeline` job → handler logs "TODO Phase A2" → exits cleanly
4. Verify `/admin/articles` (placeholder) shows the new ArticleJob row

#### Day 7 — Buffer / polish
- Fix anything that broke
- Document setup in runbook
- Deploy via CI

### 4.4 Ship checkpoint

After A1:
- ✅ Admin area accessible at `https://app.socioply.com/admin` (admin-only)
- ✅ Topics can be created via API in 3 modes
- ✅ Existing `social_only` flow unchanged (regression test)
- ✅ pg-boss processes article-pipeline jobs (stubs)
- ✅ All 18 prompts in DB
- ✅ System LLM keys verified working via a manual test call

### 4.5 Risks for A1

| Risk | Mitigation |
|---|---|
| Prisma migration on production DB takes too long / locks tables | Test on a copy of prod DB first; small-table additions only — should be fast |
| `User.role` change breaks existing auth flow | Default to `user`; existing logic doesn't read role anywhere yet |
| Admin layout conflicts with existing dashboard | Admin lives at `/admin/*` — totally separate route group |
| System keys exposed accidentally | All admin routes role-gated; keys masked in UI |

---

## 5. Phase A2 — Article generation MVP (Phase A pipeline, Preview output)

**Effort:** 7–10 days
**Goal:** End-to-end article generation works for a single Topic. User sees full draft in Preview UI. Internal beta only.

### 5.1 Goals & success criteria

- ☐ Variable resolver implemented and tested
- ☐ Step runner runs steps 1–12 sequentially with retry/quota handling
- ☐ Step 2 uniqueness retry loop works (same job retries up to N times if keyword collides with existing user articles)
- ☐ Steps 6, 7, 8, 10, 12 use Google Search tool via Gemini
- ☐ Steps 2, 12, 13 parsed as JSON with the source plan's robust parsers
- ☐ Article generates end-to-end in ~8–15 minutes
- ☐ Cost per article visible in `/admin/articles/[jobId]` (target: $0.10–$0.20 for Phase A only)
- ☐ Admin can resume a failed job from any step
- ☐ User-facing UI: `/workflow` list + `/workflow/[jobId]` detail (basic)
- ☐ SSE endpoint streams status updates to UI without polling

### 5.2 Files to create

- `apps/api/src/article-pipeline/variable-resolver.ts` — `{{variable}}` substitution
- `apps/api/src/article-pipeline/step-runner.ts` — single step execution
- `apps/api/src/article-pipeline/executor.ts` — Phase A loop (steps 1–12)
- `apps/api/src/article-pipeline/output-cleaner.ts` — JSON cleanup helpers
- `apps/api/src/article-pipeline/json-validator.ts` — validation hints
- `apps/api/src/article-pipeline/keyword-validator.ts` — uniqueness check (per-user scope)
- `apps/api/src/handlers/article-pipeline.ts` — replaces stub, calls executor
- `apps/api/src/routes/articles.ts` — `GET /articles`, `GET /articles/:jobId`, `GET /articles/:jobId/events` (SSE)
- `apps/web/src/app/workflow/page.tsx` — job list
- `apps/web/src/app/workflow/[jobId]/page.tsx` — job detail with progress bar + step list

#### Admin extensions
- `apps/web/src/app/admin/articles/page.tsx` — all jobs across users
- `apps/web/src/app/admin/articles/[jobId]/page.tsx` — full step trace including resolved prompts and raw outputs

### 5.3 Tasks (high level)

1. **Day 1–2:** Variable resolver + JSON cleaner + keyword validator (deterministic helpers, unit-tested)
2. **Day 3–4:** StepRunner with retry/backoff/quota detection (test against a stub adapter, then real Gemini)
3. **Day 5–6:** Pipeline executor — Phase A loop, resume support, Step 2 uniqueness loop
4. **Day 7:** SSE endpoint + UI live updates
5. **Day 8:** Admin per-job view (resolved prompts, raw outputs, step costs)
6. **Day 9:** End-to-end testing — generate 5 real articles, verify cost matches estimates
7. **Day 10:** Buffer / fixes / deploy

### 5.4 Ship checkpoint

User can:
1. Create a Topic via dashboard (single text input form for now)
2. See it appear in `/workflow`
3. Click to see live step-by-step progress
4. After ~10 minutes, see the completed article body (HTML) in a Preview pane
5. Admin can see the full step-by-step trace including each LLM input/output

**Not yet:**
- No featured image
- No SEO metadata
- No diagrams
- No Approve button (status stays `completed`)
- No exports

### 5.5 Risks for A2

| Risk | Mitigation |
|---|---|
| **Step 2 keyword uniqueness fails repeatedly** (same keyword as another user's article) | Cap retries at 5; surface clear error in UI; admin can override |
| **LLM JSON parsing fails** | Use the source plan's robust output-cleaner; persist raw response for debugging |
| **Cost exceeds estimates** | Per-step cost visible in admin; set Sentry alert if total job > $0.50 |
| **Step 9 (Claude Sonnet 4.5, 8k output) timeout** | Explicit timeout 300s; retry once with backoff |
| **Worker crash mid-pipeline** | pg-boss durability + resume support — restart picks up from last completed step |
| **Step 2 daily quota exhausted on free Gemini tier** | Detect quota error specifically; surface "wait until midnight Pacific" UX |

---

## 6. Phase A3 — Approval chain (Phase B): featured image + SEO + SitePage

**Effort:** 4–6 days
**Goal:** User can approve a generated article. System runs steps 13, 15, 17, 18, generates featured image, upserts SitePage.

### 6.1 Goals & success criteria

- ☐ "Approve" button in `/workflow/[jobId]` (gated to `status=completed`)
- ☐ Step 13 generates SEO metadata (title, description, slug)
- ☐ Step 15 generates image prompt → Fal.ai (`flux-pro`) → S3 upload → `Media` row
- ☐ Step 17 generates excerpt
- ☐ Step 18 generates legal disclaimer
- ☐ `SitePage` row created with all fields populated
- ☐ Status transitions `completed → approved`
- ☐ Image visible in `/workflow/[jobId]` Preview
- ☐ Admin can re-run individual approval steps if one fails

### 6.2 Files to create

- `apps/api/src/article-pipeline/approval-service.ts` — orchestrates steps 13/15/17/18
- `apps/api/src/article-pipeline/image-generation.ts` — Fal.ai wrapper with retry (already exists for ad-hoc; refactor to share)
- `apps/api/src/article-pipeline/image-uploader.ts` — download → S3 → Media row
- `apps/api/src/routes/articles.ts` — add `POST /articles/:jobId/approve`, `POST /articles/:jobId/rerun-step`
- `apps/web/src/app/workflow/[jobId]/page.tsx` — add Approve button + status transitions

### 6.3 Ship checkpoint

User can generate, review, click Approve, see featured image + SEO meta + slug. Status `approved`. No exports yet.

### 6.4 Risks

| Risk | Mitigation |
|---|---|
| Fal.ai image generation fails | Existing `image-generation.ts` has retry; surface failure in UI; admin can retry |
| Generated image is wildly off-topic | Step 15 prompt is the source of truth — log + iterate |
| Slug collision per user | Schema has `@@unique([userId, slug])`; append numeric suffix on collision |

---

## 7. Phase A4 — Mandatory enrichment (Phase C): Mermaid diagrams

**Effort:** 5–8 days
**Goal:** Every approved article gets working Mermaid diagrams in body. **Highest-risk phase** — LLM-generated Mermaid is often invalid.

### 7.1 Goals & success criteria

- ☐ Approval auto-enqueues `article-enrichment` job
- ☐ Worker parses bodyHtml, finds all `<h2>` sections
- ☐ For each section, LLM generates Mermaid syntax
- ☐ `mermaid.parse()` validates syntax — 1 retry on failure
- ☐ `mmdc` renders SVG; `resvg-js` rasterizes to PNG
- ☐ PNG uploaded to `cdn.socioply.com/diagrams/{jobId}/{n}.png`
- ☐ `ArticleDiagram` row stores Mermaid syntax + SVG + PNG S3 key
- ☐ bodyHtml rewritten with `<figure><img>...<figcaption>` blocks
- ☐ Status transitions `approved → enriched`
- ☐ Admin per-job view shows each diagram with syntax + retry history
- ☐ "Re-enrich" button in admin (wipes diagrams, restores original bodyHtml, re-enqueues)
- ☐ **Reliability target:** ≥80% of articles get all sections enriched on first try
- ☐ **Reliability target:** ≥95% after 1 retry

### 7.2 Files to create

- `apps/api/src/article-pipeline/enrichment/index.ts` — orchestrator
- `apps/api/src/article-pipeline/enrichment/mermaid-generator.ts` — LLM call + validation
- `apps/api/src/article-pipeline/enrichment/svg-renderer.ts` — `mmdc` wrapper
- `apps/api/src/article-pipeline/enrichment/svg-rasterizer.ts` — `resvg-js` wrapper
- `apps/api/src/handlers/article-enrichment.ts` — replaces stub
- `apps/web/src/app/workflow/[jobId]/page.tsx` — show diagrams + status
- `apps/web/src/app/admin/articles/[jobId]/page.tsx` — diagram syntax + retry log

### 7.3 Tasks

1. **Day 1:** Add `@mermaid-js/mermaid-cli` + Chromium + `@resvg/resvg-js` to Docker image; test Mermaid CLI works in container
2. **Day 2:** Implement Mermaid generator (Claude Sonnet 4.5) with `mermaid.parse()` validation
3. **Day 3:** Implement SVG renderer + PNG rasterizer; smoke-test with a known-good Mermaid string
4. **Day 4:** Wire enrichment into the approval flow; persist `ArticleDiagram` rows; rewrite bodyHtml
5. **Day 5:** Manual test: generate 20 articles end-to-end; measure success rate; iterate on prompt
6. **Day 6–7:** Re-enrich button, error UX, admin diagram viewer
7. **Day 8:** Buffer / polish / deploy

### 7.4 Ship checkpoint

Every approved article has functioning diagrams or a clear admin-actionable error. The 80%/95% reliability targets are measurable in `/admin/articles` (filter by `enrichmentError IS NOT NULL`).

### 7.5 Risks for A4

| Risk | Mitigation |
|---|---|
| **Mermaid generation reliability lower than 80%** | Iterate on prompt; consider rule-based simplification of complex topics; fall back to "no diagram for this section" without failing the whole article |
| **`mmdc` Docker / Chromium issues** | Use a known-working Alpine + Chromium combo; pre-build image and test thoroughly |
| **Per-article cost balloons** | Each section is ~$0.01–$0.02; budget 5 sections × $0.02 = $0.10/article max; alert if > $0.20 |
| **Articles without `<h2>` sections** | Skip enrichment cleanly; status still goes to `enriched` (no diagrams) |
| **Slow enrichment blocks approval UX** | Run async via pg-boss; UI polls/SSE for completion (10s–2min wall time) |

---

## 8. Phase A5 — Output targets (Phase D)

**Effort:** 7–10 days
**Goal:** Users can publish to WordPress, download HTML, or download a zip bundle.

### 8.1 Goals & success criteria

- ☐ Output target interface defined; registry of available targets
- ☐ HTML target: builds standalone HTML file with inline CSS, uploads to S3, returns signed URL
- ☐ Bundle target: builds zip with `article.html`, `article.md`, `metadata.json`, `images/featured.{ext}`, `images/diagrams/*.png`
- ☐ WordPress target: uploads featured image + diagrams to WP media library, then creates post; rewrites `<img>` URLs
- ☐ WordPressConnection CRUD (settings page `/settings/wordpress`)
- ☐ App-password verification on connection setup (`/wp-json/wp/v2/users/me?context=edit`)
- ☐ Output buttons in `/workflow/[jobId]` are gated until `status=enriched`
- ☐ `OutputAttempt` row created/updated for every export
- ☐ Re-publish per target works (creates new OutputAttempt)
- ☐ Admin sees all OutputAttempts with target, status, output URL/error

### 8.2 Files to create

- `apps/api/src/article-pipeline/output/types.ts` — `OutputTarget` interface
- `apps/api/src/article-pipeline/output/registry.ts` — `getOutputTarget(name)`
- `apps/api/src/article-pipeline/output/html-target.ts` — simplest, build first
- `apps/api/src/article-pipeline/output/bundle-target.ts` — uses `archiver`
- `apps/api/src/article-pipeline/output/wordpress-target.ts` — most complex
- `apps/api/src/handlers/article-output.ts` — replaces stub, dispatches by target
- `apps/api/src/routes/wp-connections.ts` — CRUD (encrypted appPassword)
- `apps/api/src/routes/articles.ts` — add `POST /articles/:jobId/output/:target`
- `apps/web/src/app/settings/wordpress/page.tsx` — connection setup UI
- `apps/web/src/app/workflow/[jobId]/page.tsx` — gated output buttons

### 8.3 Phasing within A5

Sequence within the phase:
1. **Days 1–2:** OutputTarget interface + HTML target (simplest)
2. **Days 3–4:** Bundle target
3. **Days 5–6:** WordPressConnection CRUD + settings page
4. **Days 7–8:** WordPress target (media upload + post create + URL rewriting)
5. **Days 9–10:** Re-publish, error UX, admin OutputAttempt viewer, buffer

### 8.4 Risks for A5

| Risk | Mitigation |
|---|---|
| **WordPress media upload fails for various reasons** (file size, type, plugins blocking) | Verify connection on setup; surface specific WP error messages; document common WP plugin conflicts |
| **App-password gets revoked silently by WP user** | `verify` endpoint can be called from settings page; show last-success timestamp |
| **WP slug collision** | WP appends `-2`, `-3` automatically; surface final slug in OutputAttempt |
| **Bundle zip too large** (large diagrams) | Compress diagrams during rasterization; cap per-image ≤ 500KB |
| **Featured image cropped / wrong dimensions in WP** | WP handles resizing; verify featured image set on post |

---

## 9. Phase A6 — Article-to-social handoff + CSV upload + dashboard mode toggle + prompt admin UI

**Effort:** 5–7 days
**Goal:** v1 feature-complete. Users can upload topic CSVs, generate social posts from articles, and admin can edit prompts in the UI.

### 9.1 Goals & success criteria

- ☐ "Generate Social Posts" button in `/workflow/[jobId]` (gated to `enriched`)
- ☐ Calls existing AI generation pipeline (no prompt changes for v1)
- ☐ Resulting Draft has `sourceArticleId` set
- ☐ Platform preview shows diagram-attachment options when `sourceArticleId` present
- ☐ Diagram rasterization-on-demand with S3 caching (per source plan §14.6)
- ☐ CSV upload page (`/topics/csv`) with column-mapping preview
- ☐ Mode toggle on `/dashboard` (social_only / article_first / article_only)
- ☐ Default `social_only` (no behavior change for existing users)
- ☐ Admin prompt editor (`/admin/prompts`) — edit, version, activate
- ☐ Save prompt creates a new version; old version preserved (audit trail)

### 9.2 Files to create

- `apps/api/src/article-pipeline/social-handoff.ts` — payload builder
- `apps/api/src/handlers/generate-social-from-article.ts` — replaces stub
- `apps/api/src/routes/topics.ts` — extend with `POST /topics/csv`
- `apps/api/src/routes/admin/prompts.ts` — CRUD (versioned upserts)
- `apps/web/src/app/topics/csv/page.tsx` — CSV upload + column mapping
- `apps/web/src/app/dashboard/page.tsx` — add mode toggle
- `apps/web/src/app/admin/prompts/page.tsx` — list + edit
- `apps/web/src/app/admin/prompts/[stepNumber]/page.tsx` — single template editor

### 9.3 Ship checkpoint

Article pipeline v1 feature-complete. From dashboard idea or CSV → article generated → enriched → exported → social posts created with diagram attachments.

### 9.4 Risks for A6

| Risk | Mitigation |
|---|---|
| **CSV column mapping confuses users** | Show preview of first 5 rows with auto-detected columns + manual override |
| **Diagram rasterization-on-demand slows social post generation** | Cache PNGs at standard sizes (LinkedIn 1200×627, Twitter 1200×675) on first request |
| **Admin edits a live prompt and breaks generation** | Version + activate model; only `isActive=true` template used; rollback button |
| **Mode toggle breaks existing social_only users** | Default = `social_only`; new modes opt-in |

---

## 10. Cross-Phase Risk Register

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| LLM provider rate limits hit during burst | Medium | Medium | `teamSize` caps in pg-boss; per-provider rate-limit detection in adapters |
| Cost balloons unexpectedly | Medium | High | Daily Sentry alert if org-wide cost > $X/day; admin UI shows real-time cost |
| Mermaid enrichment unreliable | High in A4, low after | High | Heavy iteration in A4 ship checkpoint; explicit "no diagram" fallback |
| Pipeline takes too long for users (8–25 min wall time) | Low (designed-for) | Medium | SSE updates + clear progress UI; users get email when done (future v1.1) |
| WordPress integration fails for unusual WP setups | Medium | Medium | Pre-flight verification; document tested WP versions |
| Worker crash mid-pipeline | Low | Low | pg-boss durability + step resume support |
| New CI/CD deploy breaks pipeline silently | Low | High | Admin error feed surfaces failures fast; Sentry alerts |
| Prompt template changes regress quality | Medium | Medium | Versioned templates; admin can rollback |
| Free Gemini quota exhausted before paid kicks in | Low | Medium | System keys are paid tier; quota detection in adapters |

---

## 11. Definition of Done — Article Pipeline v1

The whole pipeline is complete when:

1. ☐ A logged-in user can create a topic via dashboard or CSV in any of 3 modes
2. ☐ For article modes, a full pipeline run completes in 8–25 min wall time
3. ☐ User reviews, approves, and gets featured image + SEO meta + diagrams
4. ☐ User exports to WordPress / HTML / Bundle from the UI
5. ☐ User generates social posts from the article with diagram attachments
6. ☐ Admin can see every job's full trace, costs, errors, retry history
7. ☐ Admin can edit prompt templates with version history
8. ☐ Admin can adjust system LLM keys and switch models without redeploy
9. ☐ Per-user cost is tracked in `LLMUsage` ready for future quota enforcement
10. ☐ Sentry catches any failure within 30 seconds with full context
11. ☐ Better Stack logs every pipeline step with structured fields
12. ☐ End-to-end cost per article matches estimates ($0.18–$0.38)
13. ☐ Zero regressions to existing `social_only` flow
14. ☐ Runbook updated with article-pipeline incident playbooks

---

## 12. Timeline (Realistic Calendar Time)

Assuming one focused developer with normal interruptions (meetings, reviews, occasional fires):

| Phase | Effort (days) | Calendar (weeks) | Cumulative Calendar |
|---|---|---|---|
| A1 | 5–7 | 1–1.5 | 1.5 |
| A2 | 7–10 | 1.5–2 | 3.5 |
| A3 | 4–6 | 1 | 4.5 |
| A4 | 5–8 | 1–1.5 | 6 |
| A5 | 7–10 | 1.5–2 | 8 |
| A6 | 5–7 | 1–1.5 | 9.5 |
| **Total** | **33–48 days** | **7–10 weeks** | |

**Beta-ready after A4** (~6 weeks): articles generate, get approved, get diagrams. Just no exports yet. You could ship to internal testing here.

**v1 ship after A6** (~10 weeks): full feature set.

---

## 13. Future Work (NOT in v1)

For reference, deferred work is captured here so it's not lost.

- **LinkedIn article output target** — based on `article-pipeline` content
- **Medium article output target** — based on `article-pipeline` content
- **Newsletter output target**
- **Quota enforcement** — uses `LLMUsage` data already collected; enforces 3 articles/week, etc.
- **Billing integration** — Stripe; users pay for additional quota beyond free tier
- **Translation pipeline** — already designed in source plan §13, deferred for v1
- **Per-tenant prompt overrides** — currently admin-only edits all prompts globally
- **Snapshot tests for LLM outputs** — accepted technical debt, revisit if regressions become frequent
- **Email notification when article ready** — useful UX given 8–25 min wall time
- **Automatic Mermaid simplification** — if reliability is poor, add a layer that simplifies diagram requests

---

## 14. Recommended Next Step

Read this plan, push back on anything that feels off, then we start with **Phase A1**.

A1 is the lowest-risk phase but unlocks everything else. Once it's done, you'll have:
- The admin area you want
- All system plumbing for cost tracking
- A working API to enqueue article jobs (even if they're stubs)
- Confidence in the pattern before tackling the heavy generation logic in A2

If you want, I can start A1 implementation by asking 3–5 specific clarification questions (e.g., admin UI styling, exact env var names for system keys, etc.), then implement the whole phase in one focused session.
