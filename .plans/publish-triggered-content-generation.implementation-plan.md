# Implementation Plan: Publish-Triggered Content Generation

**Goal:** When a user clicks Publish, automatically generate the LinkedIn article, Medium article, and 12-post social set in the background — with automatic retries so nothing gets stuck.

**Status:** Planning

---

## 0. Context & Design Decisions

| Topic | Decision |
|---|---|
| Trigger point | Article `status → published` (the Publish button) — semantically correct: content is final and locked |
| Syndication execution | Move from **synchronous inline** to **async pg-boss queue** (`syndication-generate` job) — prevents Publish button hanging 30–90s |
| Social automation | Already async via `social-generate` queue — move trigger from post-enrichment to post-publish |
| Retry strategy | Automatic via safety watchdog (already exists for social; extend pattern to syndication) |
| One-shot guard | Replace article-level "already generated" block with per-platform `status` check — allows clean per-platform retry |
| Manual fallback | Keep existing manual buttons for both syndication and social set as re-trigger / override |
| UX | Publish confirmation dialog listing what will auto-generate; workflow page shows live status for all three content types |
| Notification on failure | In-app `ErrorLog` alert (existing `sendFailureAlert` infrastructure) + visible status on workflow page |

---

## 1. Status & Sequence After This Change

```
enriched  →  [user clicks Publish]  →  published
                                              │
                          ┌───────────────────┼───────────────────┐
                          ▼                   ▼                   ▼
               syndication-generate    social-generate      (future: email)
               (LinkedIn + Medium)     (12-post set)
                  pg-boss async           pg-boss async
                          │                   │
                  SyndicationArticle    SocialAutomationRun
                  status per platform    status per spec/slot
                          │                   │
               safety watchdog (new)  safety watchdog (existing)
                 re-enqueues stuck       re-enqueues stuck
```

---

## 2. What Changes

### Phase A — Move syndication to an async queue

**Why first:** Everything else depends on this. Without it, attaching syndication to Publish would make the button block for 30–90s.

#### A1 — New pg-boss queue + handler

- Add `SYNDICATION_GENERATE: 'syndication-generate'` to `apps/api/src/queues/index.ts`
- Create `apps/api/src/handlers/syndication-generate.ts`:
  - Accepts `{ jobId: string, userId: string }`
  - Calls `generateSyndicationArticles(jobId, userId)` (existing function, no changes needed)
  - On failure: updates each `SyndicationArticle` with `status: 'failed'` + `errorMessage`, calls `sendFailureAlert`
  - pg-boss retry config: `retryLimit: 2`, `retryDelay: 60` (2 retries, 60s apart)

#### A2 — Update `SyndicationArticle` to track pending/processing status

The `status` field already exists (`pending | completed | failed`) but is never set to `pending` — rows are created only when the synchronous call completes. We need:
- Create `SyndicationArticle` rows with `status: 'pending'` at enqueue time (one row per platform: `linkedin`, `medium`)
- Set `status: 'processing'` when the handler picks them up
- Set `status: 'completed'` or `status: 'failed'` on completion

No schema migration needed — `status` field and `errorMessage` already exist.

#### A3 — New enqueue helper

Create `apps/api/src/article-pipeline/syndication/enqueue.ts`:

```typescript
export async function enqueueSyndication(jobId: string, userId: string): Promise<void>
```

Logic:
1. Check if any `SyndicationArticle` for this `jobId` is `completed` — if so, skip (already done)
2. Check if any is `pending` or `processing` — if so, skip (already in flight)
3. Upsert `SyndicationArticle` rows for `linkedin` and `medium` with `status: 'pending'`
4. Enqueue `syndication-generate` pg-boss job with `singletonKey: syndication-${jobId}`

#### A4 — Register handler in worker

- Add `syndication-generate` worker registration in `apps/api/src/worker.ts`
- pg-boss `work()` call alongside the existing `social-generate` worker

#### A5 — Keep the manual syndication route working

`POST /api/articles/:jobId/syndication/generate` currently calls `generateSyndicationArticles` synchronously. Change it to call `enqueueSyndication` instead, returning `{ enqueued: true }` immediately. The workflow page already polls for syndication status so no UI changes needed for the button itself.

---

### Phase B — Move social automation trigger to Publish

#### B1 — Remove post-enrichment auto-trigger

Remove the `maybeEnqueueSocialAutomationAfterEnrichment` call from `apps/api/src/article-pipeline/enrichment/index.ts`. Social automation should no longer fire automatically after enrichment.

#### B2 — Wire both triggers into the Publish endpoint

In `apps/api/src/routes/articles.ts`, after `prisma.articleJob.update({ status: 'published' })`:

```typescript
// Fire-and-forget both background jobs
await enqueueSyndication(jobId, user.id).catch((err) =>
  logger.error({ jobId, err }, '[publish] failed to enqueue syndication')
)
await enqueueSocialAutomation({ userId: user.id, jobId, sitePageId, publishingDate, timeZone }).catch((err) =>
  logger.error({ jobId, err }, '[publish] failed to enqueue social automation')
)
```

The Publish endpoint must now also fetch `sitePage.id` and `topic.publishingDate` — update the `select` on the initial job fetch.

#### B3 — Tighten the `generate-social-set` manual endpoint

Change the status guard from `enriched || published` to **`published` only**. Remove the `enriched` path — social posts before publishing is the exact problem we're solving.

---

### Phase C — Syndication safety watchdog

Mirror the existing `social-automation-safety` watchdog for syndication.

#### C1 — Create `apps/api/src/handlers/syndication-safety.ts`

Logic (runs every 10 minutes via pg-boss cron):
- Find `SyndicationArticle` rows with `status: 'processing'` and `updatedAt < 20 min ago` → reset to `pending`, re-enqueue
- Find rows with `status: 'pending'` and `createdAt < 10 min ago` → re-enqueue (job may have been lost)
- Dedup re-enqueues with `singletonKey: syndication-retry-${jobId}`

#### C2 — Register cron in `apps/api/src/worker.ts`

```typescript
await boss.schedule('syndication-safety', '*/10 * * * *', {})
await boss.work('syndication-safety', withSentry('syndication-safety', syndicationSafetyHandler))
```

---

### Phase D — Publish confirmation dialog (UI)

#### D1 — Confirmation modal in workflow page

Before the Publish API call fires, show a modal:

> **Publish this article?**
> 
> Publishing is irreversible. Once published, we'll automatically generate:
> - LinkedIn Article
> - Medium Article  
> - 12-post social set (Facebook, Instagram, LinkedIn, Threads, Twitter, Telegram)
>
> You can review all content before it goes live. Social posts are scheduled via Omniply — you have full control there.
>
> [Cancel] [Publish & Generate All Content]

This is a simple `useState`-driven modal in `apps/web/src/app/(protected)/workflow/[jobId]/page.tsx` — no new component needed.

---

### Phase E — Status visibility on workflow page

#### E1 — Syndication status display (enhancement)

The workflow page already shows syndication articles when `syndicationGenerated` is true. Add a pending/processing state:
- If `SyndicationArticle` rows exist with `status: 'pending'` or `status: 'processing'`, show a "Generating LinkedIn & Medium articles…" loading indicator with a spinner
- Poll every 5s while status is active (same pattern as social runs)
- On `failed`, show an error message with a "Retry" button that calls the manual endpoint

#### E2 — Social automation status display (already exists)

The social runs panel already polls every 5s for active runs. No changes needed here.

---

### Phase F — Error notifications

#### F1 — Syndication failure alert

In `apps/api/src/handlers/syndication-generate.ts`, on catch:
```typescript
await sendFailureAlert({
  userId,
  jobId,
  errorType: 'syndication_generate_failed',
  message: err.message,
  context: { jobId, platforms: ['linkedin', 'medium'] },
})
```

This writes to the `ErrorLog` table, which already appears in the admin errors UI.

#### F2 — Admin errors UI filter (minor)

Add `syndication_generate_failed` as a filter pill in `apps/web/src/app/admin/errors/page.tsx` alongside the existing social automation error types.

---

## 3. Files Changed Summary

| File | Change |
|---|---|
| `apps/api/src/queues/index.ts` | Add `SYNDICATION_GENERATE` and `SYNDICATION_SAFETY` queue names |
| `apps/api/src/handlers/syndication-generate.ts` | **New** — pg-boss handler for async syndication |
| `apps/api/src/handlers/syndication-safety.ts` | **New** — watchdog to re-enqueue stuck syndication jobs |
| `apps/api/src/article-pipeline/syndication/enqueue.ts` | **New** — enqueue helper with dedup logic |
| `apps/api/src/article-pipeline/syndication/generate.ts` | No changes — logic stays intact |
| `apps/api/src/routes/articles.ts` | Publish endpoint: enqueue both jobs; syndication route: call enqueue instead of inline; social route: remove `enriched` path |
| `apps/api/src/article-pipeline/enrichment/index.ts` | Remove `maybeEnqueueSocialAutomationAfterEnrichment` call |
| `apps/api/src/worker.ts` | Register `syndication-generate` worker + `syndication-safety` cron |
| `apps/web/src/app/(protected)/workflow/[jobId]/page.tsx` | Publish confirmation modal; syndication pending/processing state + polling |
| `apps/web/src/app/admin/errors/page.tsx` | Add `syndication_generate_failed` filter pill |

**No schema migrations required** — `SyndicationArticle` already has `status` and `errorMessage` fields. All new state fits in existing columns.

---

## 4. Retry Strategy Summary

| Layer | Mechanism | Timing |
|---|---|---|
| pg-boss built-in retry | `retryLimit: 2, retryDelay: 60s` on `syndication-generate` job | 1 min, 2 min after failure |
| Safety watchdog | `syndication-safety` cron re-enqueues stuck `processing` (>20 min) and `pending` (>10 min) rows | Every 10 min |
| Manual fallback | "Generate LinkedIn & Medium Articles" button on workflow page still works | On-demand |
| Social (existing) | `social-automation-safety` already handles stuck runs | Every 15 min |

---

## 5. What Users Experience

1. User finishes reviewing their article
2. Clicks **Publish** — confirmation modal explains what will auto-generate
3. Clicks **Publish & Generate All Content**
4. Workflow page immediately shows:
   - "Generating LinkedIn & Medium articles…" (spinner, auto-polls)
   - Social runs panel shows run as `pending` → `processing`
5. Within 1–3 minutes: LinkedIn article, Medium article, and social set are all ready
6. User reviews content (social posts are already in Omniply, LinkedIn/Medium drafts on the workflow page)
7. If anything fails: red status + Retry button on the workflow page; ErrorLog in admin

---

## 6. Task Tracking

### Completed Tasks
*(none yet)*

### Pending Tasks

- Phase A1: Add `SYNDICATION_GENERATE` queue + create `syndication-generate.ts` handler
- Phase A2: Update enqueue to pre-create `SyndicationArticle` rows with `status: 'pending'`
- Phase A3: Create `apps/api/src/article-pipeline/syndication/enqueue.ts`
- Phase A4: Register handler in `worker.ts`
- Phase A5: Update manual syndication route to call enqueue
- Phase B1: Remove `maybeEnqueueSocialAutomationAfterEnrichment` from enrichment pipeline
- Phase B2: Wire `enqueueSyndication` + `enqueueSocialAutomation` into Publish endpoint
- Phase B3: Tighten `generate-social-set` endpoint to `published` only
- Phase C1: Create `syndication-safety.ts` watchdog handler
- Phase C2: Register syndication-safety cron in `worker.ts`
- Phase D1: Publish confirmation modal in workflow page
- Phase E1: Syndication pending/processing status + polling in workflow page
- Phase F1: `sendFailureAlert` in syndication handler
- Phase F2: Add `syndication_generate_failed` filter in admin errors UI

### Backlog Tasks
- Email notification on generation failure (requires email service integration)
- Per-platform retry button (retry only LinkedIn or only Medium individually)
- Notification badge / in-app notification when content is ready to review
