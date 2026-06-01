# Social Automation — Logging & Observability Plan (Option B)

## Goal

Achieve comprehensive, searchable, end-to-end observability for every social post that flows
through the system — from automation spec processing through asset generation, GHL scheduling, and
direct publishing — with structured Pino logs that carry correlation IDs on every line, a
`logger.warn` whenever the LLM caption falls back, and a dedicated `/admin/social` page that
surfaces automation run health at a glance.

---

## Audit Baseline (current state)

| Area | Status |
|---|---|
| `dispatcher.ts` (api) | **No logging at all** — silent success / silent failure |
| `publish.ts` handler | `console.log/error` — not indexed by Logtail, no correlation IDs |
| `analytics.ts` handler | `console.log` — not indexed by Logtail |
| `platform-caption.ts` | catch block silently falls back — nobody knows LLM failed |
| `spec-processor.ts` | Pino present for errors only; no start / complete info lines |
| `run.ts` | One `logger.info` ("already claimed"); run start/end not logged |
| `schedule-posts.ts` | `logger.warn` on GHL failure; no success log per post |
| Admin errors page | `context` JSON not rendered; no social-specific filtering |
| Admin UI | No page for automation runs |

---

## Phase 1 — Fix the Gaps in Existing Flows

### 1a. Structured Pino in `dispatcher.ts`

**File:** `apps/api/src/social/dispatcher.ts`

Add an optional `LogContext` parameter to `dispatchPublish` so callers from the automation engine
can pass `{ runId, slotKey, jobId }`. The context is spread into every log line.

Changes:
- Import `logger` from `../lib/logger`.
- Add an optional `logCtx?: { runId?: string; slotKey?: string; jobId?: string }` parameter to
  `dispatchPublish`, `publishViaGhl`, and `publishViaDirect`.
- In `publishViaGhl`:
  - `logger.info` on every successful GHL create: `{ userId, platform, provider: 'ghl', ghlPostId, postUrl, ...logCtx }`.
  - `logger.warn` when `creds` is null or `accountId` is missing (config gap, not a hard error).
  - `logger.error` in the `catch` block: `{ userId, platform, err, ...logCtx }`.
- In `publishViaDirect`:
  - `logger.info` on success for each platform branch: `{ userId, platform, provider: 'direct', postId, ...logCtx }`.
  - `logger.error` on failure returned by underlying API clients (check `result.success === false`).
- Thread `logCtx` from `schedulePostsForSpec` → `dispatchPublish`.

**Also update:** `apps/web/src/lib/social/dispatcher.ts` — this is the frontend proxy; it doesn't
need Pino but should at minimum surface `console.error` on failure so browser devtools catch it
(it already calls `fetch`; add a `console.error` guard if `!result.success`).

---

### 1b. Replace `console.*` in `publish.ts` Handler

**File:** `apps/api/src/handlers/publish.ts`

All `console.log/error` calls replaced with Pino equivalents:

| Old | New | Extra Fields |
|---|---|---|
| `console.log('[publish] job … — …')` | `logger.info(...)` | `{ jobId: job.id, platform, userId }` |
| `console.error('[publish] job … failed')` | `logger.error(...)` | `{ jobId: job.id, platform, userId, error: result.error }` |
| `console.log('[publish] job … succeeded')` | `logger.info(...)` | `{ jobId: job.id, platform, userId, postUrl }` |
| `console.log('[publish-scheduled] tick …')` | `logger.info(...)` | `{ jobCount: jobs.length }` |
| `console.log('[publish-scheduled] found …')` | `logger.info(...)` | `{ count: scheduledPosts.length }` |
| `console.log('[publish-scheduled] skipping reply …')` | `logger.debug(...)` | `{ postId: post.id, parentPostId: post.parentPostId }` |
| `console.log('[publish-scheduled] published …')` | `logger.info(...)` | `{ published: published.length, failed: failed.length }` |
| failure update log | `logger.error(...)` | `{ postId, platform, error }` |

---

### 1c. Replace `console.*` in `analytics.ts` Handler

**File:** `apps/api/src/handlers/analytics.ts`

| Old | New | Extra Fields |
|---|---|---|
| `console.log('[analytics-sync] starting …')` | `logger.info(...)` | `{ jobCount: jobs.length }` |
| `console.log('[analytics-sync] N post(s) to sync')` | `logger.info(...)` | `{ count: postsToSync.length }` |
| `console.log('[analytics-sync] done')` | `logger.info(...)` | `{ synced, skipped, failed }` |
| `console.log('[analytics-sync] skipping …')` | `logger.debug(...)` | `{ postId, platform, reason }` |
| `console.error(...)` in catch | `logger.error(...)` | `{ postId, platform, err }` |

Add a specific `logger.debug` when a GHL post is skipped because the user has no GHL analytics
integration, including `{ postId, ghlPostId, reason: 'no_ghl_analytics' }` — currently this skips
silently.

---

### 1d. Warn on LLM Caption Fallback

**File:** `apps/api/src/social/generators/platform-caption.ts`

The `catch` block on line 79 currently falls back to `buildPlatformCaption` with no trace. Change:

```typescript
} catch (err) {
  logger.warn(
    { platform: opts.platform, slotKey: opts.slotKey, err },
    '[platform-caption] LLM generation failed — falling back to template',
  )
  return buildPlatformCaption(opts.platform, opts.articleCtx, opts.slotKey)
}
```

Also call `sendFailureAlert` here with `errorType: 'social_caption_fallback'` so it appears in
`/admin/errors` for tracking:

```typescript
await sendFailureAlert({
  errorType: 'social_caption_fallback',
  message: `LLM caption failed for ${opts.platform}/${opts.slotKey}: ${err instanceof Error ? err.message : String(err)}`,
  context: { platform: opts.platform, slotKey: opts.slotKey },
}).catch(() => {})   // fire-and-forget, don't block caption generation
```

---

### 1e. Render `context` JSON in Admin Errors Page

**File:** `apps/web/src/app/admin/errors/page.tsx`

After the `errorMessage` paragraph, add a collapsible `<details>` block that renders
`context` JSON when it exists:

```tsx
{err.context && (
  <details className="mt-2">
    <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
      Context
    </summary>
    <pre className="mt-1 text-xs bg-muted/40 rounded p-2 overflow-x-auto whitespace-pre-wrap break-all">
      {JSON.stringify(err.context, null, 2)}
    </pre>
  </details>
)}
```

Also add a `?type=social_automation_spec` (and related types) filter pill alongside the existing
Unresolved / Resolved tabs so social errors can be viewed in isolation.

---

## Phase 2 — Per-Spec Start / Complete Info Logs

### 2a. Run-level Start and Finish Logs

**File:** `apps/api/src/social/automation/run.ts`

Add at the top of `runSocialAutomation` (after successful claim):

```typescript
logger.info(
  { runId, userId: run.userId, jobId: run.jobId, scheduledDate: run.scheduledDate, totalSlots: slots.length },
  '[social-automation] run started',
)
```

Add after `finalizeRunCounts(runId)`:

```typescript
const final = await prisma.socialAutomationRun.findUnique({ where: { id: runId } })
logger.info(
  { runId, userId: run.userId, completed: final?.completedSpecs, failed: final?.failedSpecs, status: final?.status },
  '[social-automation] run finished',
)
```

---

### 2b. Spec-level Start and Complete Logs

**File:** `apps/api/src/social/automation/spec-processor.ts`

At the top of `processAutomationSpec`, before the upsert:

```typescript
logger.info(
  { runId: run.id, slotKey, userId: run.userId, jobId: run.jobId ?? undefined, postType: spec.postType },
  '[social-automation] spec started',
)
```

After the `schedulePostsForSpec` call, before the `socialAutomationSpecResult.update`:

```typescript
logger.info(
  { runId: run.id, slotKey, scheduled: scheduleResult.scheduled, skipped: scheduleResult.skipped, failed: scheduleResult.failed },
  '[social-automation] spec completed',
)
```

In the `catch` block (already present), add to the existing `sendFailureAlert` call:
- Extend `context` with `{ runId: run.id, slotKey, userId: run.userId, jobId: run.jobId }`.

---

### 2c. Per-Post Success Log in `schedule-posts.ts`

**File:** `apps/api/src/social/automation/schedule-posts.ts`

After `prisma.post.create(...)` succeeds (both GHL and direct branches), add:

```typescript
logger.info(
  { runId, slotKey, platform, postId: created.id, ghlPostId: result.ghlPostId ?? undefined, scheduledAt, provider: result.provider },
  '[social-automation] post scheduled',
)
```

---

## Phase 3 — End-to-End Correlation via Shared Context Object

### 3a. Define `AutomationLogContext`

**New file:** `apps/api/src/social/automation/log-context.ts`

```typescript
export interface AutomationLogContext {
  runId: string
  userId: string
  jobId?: string
  slotKey?: string
  platform?: string
  postId?: string
  ghlPostId?: string
}
```

This is a pure type file — zero runtime cost.

---

### 3b. Thread Context Through the Full Call Chain

Update function signatures to accept and forward `logCtx: AutomationLogContext`:

| File | Function | Change |
|---|---|---|
| `run.ts` | `runSocialAutomation` | Build `baseCtx = { runId, userId, jobId }` and pass to `processAutomationSpec` |
| `spec-processor.ts` | `processAutomationSpec` | Accept `logCtx`, add `slotKey` before passing down |
| `spec-processor.ts` | `retryAutomationSpec` | Build `logCtx` from run fields |
| `schedule-posts.ts` | `schedulePostsForSpec` | Accept `logCtx`, extend with `platform` per iteration, pass to `dispatchPublish` |
| `dispatcher.ts` | `dispatchPublish` / `publishViaGhl` / `publishViaDirect` | Accept `logCtx?`, spread into every log call |
| `platform-caption.ts` | `generatePlatformCaption` | Accept `logCtx?`, include in `logger.warn` and `sendFailureAlert` |

All existing `logger.*` calls in those files are updated to spread `logCtx` (only the fields
that are in-scope at that point):

```typescript
logger.info({ ...logCtx, someField }, 'message')
```

This ensures every log line in a given automation run shares the same `runId`, `userId`, and
`jobId`, making Logtail queries like `runId = "abc-123"` return the complete trace.

---

## Phase 4 — `/admin/social` Page

### 4a. API Route

**File:** `apps/api/src/routes/admin-social.ts` (new file, registered in `apps/api/src/index.ts`)

```
GET  /admin/social-automation
     Query params: userId?, status?, page?, limit?
     Returns: paginated list of SocialAutomationRun rows with
              { id, userId, user.email, jobId, job.topic.title, scheduledDate,
                status, totalSpecs, completedSpecs, failedSpecs, currentSpec, error,
                specResults[{ slotKey, status, postsCreated, error }] }

GET  /admin/social-automation/:runId
     Returns: single run with full specResults, linked article title/URL,
              and posts[] created by this run (platform, status, postUrl, slotKey)
```

Both endpoints require admin role check (reuse the pattern from other admin API routes).

---

### 4b. Next.js Proxy Routes

**New files:**
- `apps/web/src/app/api/admin/social-automation/route.ts` — proxies `GET` to
  `$API_URL/admin/social-automation` with `?` forwarded.
- `apps/web/src/app/api/admin/social-automation/[runId]/route.ts` — proxies `GET` to
  `$API_URL/admin/social-automation/:runId`.

Both use the same `proxyRequest` / `apiFetch` pattern used by other admin proxy routes.

---

### 4c. Admin Page `/admin/social`

**New file:** `apps/web/src/app/admin/social/page.tsx`

Server component (matches other admin pages). Layout:

1. **Header row:** "Social Automation Runs" title + KPI chips:
   - `processing` count (yellow)
   - `failed` (unresolved) count (red)
   - `completed today` count (green)

2. **Filter bar:** status filter pills (all / pending / processing / completed / failed) + optional
   user email text search.

3. **Run table** (one row per `SocialAutomationRun`, newest first):

   | Column | Value |
   |---|---|
   | Date | `scheduledDate` formatted |
   | User | `user.email` |
   | Article | `job.topic.title` truncated, linked to `/admin/articles/:jobId` |
   | Status | badge: pending / processing / completed / failed |
   | Specs | `completedSpecs / totalSpecs` with `failedSpecs` shown in red if > 0 |
   | Error | truncated `run.error` if present |
   | Actions | "Details" link → `/admin/social/:runId` |

4. **Run detail page** `apps/web/src/app/admin/social/[runId]/page.tsx`:
   - Run metadata panel (user, article, dates, status).
   - Spec results grid: one card per slot key showing status badge, `postsCreated`, error message,
     and `assets` type (image/video/carousel).
   - Posts created table: platform, status, postUrl, slotKey, scheduledAt.

---

### 4d. AdminSidebar Link

**File:** `apps/web/src/components/admin/AdminSidebar.tsx`

Add to `navItems`:

```typescript
{ label: 'Social Runs', href: '/admin/social', icon: Share2 }
```

Import `Share2` from `lucide-react`.

---

## File Change Summary

| File | Type | Phase |
|---|---|---|
| `apps/api/src/social/dispatcher.ts` | Modify | 1a, 3b |
| `apps/web/src/lib/social/dispatcher.ts` | Modify (minor) | 1a |
| `apps/api/src/handlers/publish.ts` | Modify | 1b |
| `apps/api/src/handlers/analytics.ts` | Modify | 1c |
| `apps/api/src/social/generators/platform-caption.ts` | Modify | 1d, 3b |
| `apps/web/src/app/admin/errors/page.tsx` | Modify | 1e |
| `apps/api/src/social/automation/run.ts` | Modify | 2a, 3b |
| `apps/api/src/social/automation/spec-processor.ts` | Modify | 2b, 3b |
| `apps/api/src/social/automation/schedule-posts.ts` | Modify | 2c, 3b |
| `apps/api/src/social/automation/log-context.ts` | **New** | 3a |
| `apps/api/src/routes/admin-social.ts` | **New** | 4a |
| `apps/api/src/index.ts` | Modify | 4a |
| `apps/web/src/app/api/admin/social-automation/route.ts` | **New** | 4b |
| `apps/web/src/app/api/admin/social-automation/[runId]/route.ts` | **New** | 4b |
| `apps/web/src/app/admin/social/page.tsx` | **New** | 4c |
| `apps/web/src/app/admin/social/[runId]/page.tsx` | **New** | 4c |
| `apps/web/src/components/admin/AdminSidebar.tsx` | Modify | 4d |

**No schema changes are required.** All data is already present in `SocialAutomationRun`,
`SocialAutomationSpecResult`, and `Post`.

---

## Verification Steps

After all phases are implemented:

1. `pnpm --filter @socioply/api exec tsc --noEmit` — zero errors.
2. `pnpm --filter @socioply/web exec tsc --noEmit` — zero errors.
3. Trigger a social automation run manually via the workflow page.
4. In the terminal / Logtail, confirm:
   - `[social-automation] run started` with `runId`, `userId`, `jobId`.
   - `[social-automation] spec started` and `spec completed` for each slot.
   - `[social-automation] post scheduled` with `postId`, `platform`, `ghlPostId`.
   - `[dispatcher] GHL post created` (or `direct post published`) with full context.
5. Visit `/admin/social` — confirm runs appear with correct status and spec counts.
6. Click into a run — confirm spec results and posts are listed.
7. Force a caption LLM failure (e.g. empty API key) — confirm `logger.warn` fires and an
   `ErrorLog` entry with `errorType: 'social_caption_fallback'` appears in `/admin/errors`.
8. Visit `/admin/errors` — confirm `context` JSON renders under each social error entry.
