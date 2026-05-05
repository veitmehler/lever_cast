# Workflow Detail Page — UI Enhancements

> **Scope:** Five enhancements to the article detail page (`/workflow/[jobId]`): Schema Review section with validation link, "Rerun Enrichment" button, gated "Publish" → Export flow, "Rewrite Article" (partial rerun steps 7–12), and higher-contrast Approve button. Includes one new `published` status, two new backend endpoints, and frontend changes to a single page component.

> **Prerequisite:** Phase C enrichment expansion (GEO, Key Takeaways, TOC, WP Category) is deployed and operational. `SitePage.schemaJson` is populated by Step 16 during the approval service.

---

## Table of Contents

1. [Overview & Decisions Log](#1-overview--decisions-log)
2. [Status Flow Change](#2-status-flow-change)
3. [Backend: New `published` Status](#3-backend-new-published-status)
4. [Backend: `POST /articles/:jobId/publish`](#4-backend-post-articlesjobidpublish)
5. [Backend: `POST /articles/:jobId/rewrite`](#5-backend-post-articlesjobidrewrite)
6. [Backend: Include `schemaJson` in Job Detail Response](#6-backend-include-schemajson-in-job-detail-response)
7. [Frontend: Schema Review Panel](#7-frontend-schema-review-panel)
8. [Frontend: Publish & Rerun Enrichment Buttons](#8-frontend-publish--rerun-enrichment-buttons)
9. [Frontend: Rewrite Article Button](#9-frontend-rewrite-article-button)
10. [Frontend: High-Contrast Approve Button](#10-frontend-high-contrast-approve-button)
11. [Frontend: Export Section Gating](#11-frontend-export-section-gating)
12. [Button Visibility Matrix](#12-button-visibility-matrix)
13. [File Inventory](#13-file-inventory)
14. [Implementation Checklist](#14-implementation-checklist)

---

## 1. Overview & Decisions Log

Decisions from user feedback (logged for traceability):

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Schema validation link → Google Rich Results Test only** | Schema.org validator is redundant when Rich Results Test exists; one link avoids confusion. If Schema is invalid, the validator will flag it. |
| 2 | **`published` status (Option A)** | Clean workflow state machine — `enriched → published → export unlocked`. Irreversible. |
| 3 | **Rewrite = partial rerun (steps 7–12 only)** | Steps 1–6 (outline, keywords, FAQs) are retained. Only fact research (7–8), article writing (9), fact-checking (10), fact adjustment (11), and citations (12) are re-run. No parameter changes allowed — prevents users from generating unlimited articles per month. |
| 4 | **Rewrite only at `completed` status** | Cannot rewrite after approval/enrichment, because enrichment builds on the article foundation (GEO questions, heading restructuring, diagrams). |
| 5 | **Publish is irreversible** | Once published, no re-enrichment or rewrite is possible. User must create a new article if they want changes. |
| 6 | **Approve button: higher colour contrast, not size increase** | Current `bg-purple-600` with `text-white` on `size="sm"` is fine in size. Needs brighter/more vivid styling (e.g. gradient or ring/glow). |

---

## 2. Status Flow Change

**Current flow:**

```
pending → in_progress → completed → approved → enriched → (export)
                             ↑             ↓
                          failed ←── (any step failure)
```

**New flow — adds `published` after `enriched`:**

```
pending → in_progress → completed → approved → enriched → published
                 │            │          │           │
                 ↓            ↓          ↓           ↓
               failed      rewrite   re-enrich    export
              (resume)   (→in_progress) (→approved)  (only here)
```

- `completed` → user can **Rewrite** (goes back to `in_progress`) or **Approve** (goes to `approved`).
- `enriched` → user can **Rerun Enrichment** (goes back to `approved`) or **Publish** (goes to `published`).
- `published` → Export buttons appear. No going back.

### Schema status comment update

In `schema.prisma`, the status comment should be updated:

```prisma
status String @default("pending") // pending | in_progress | completed | approved | enriched | published | failed
```

This is a comment-only change — no migration needed.

---

## 3. Backend: New `published` Status

### 3a. Status label constant (`apps/web`)

Add `published` to the `STATUS_LABELS` map in the frontend page:

```typescript
published: {
  label: 'Published',
  color: 'text-emerald-700 dark:text-emerald-300',
  bg: 'bg-emerald-50 dark:bg-emerald-900/40',
},
```

### 3b. Allow exports at `published` status

The Export panel currently checks `displayStatus !== 'enriched'` to gate the buttons. Change to `displayStatus !== 'published'` (export buttons only at `published`).

### 3c. Attempts fetching

The `useEffect` that fetches output attempts currently triggers on `job?.status === 'enriched'`. Update to trigger on `['enriched', 'published'].includes(job?.status)` — attempts should load at both.

---

## 4. Backend: `POST /articles/:jobId/publish`

**File:** `apps/api/src/routes/articles.ts`

**Logic:**
1. Authenticate user, load job.
2. Verify `job.status === 'enriched'`. If not → 400 error.
3. Update `ArticleJob.status = 'published'`.
4. Return `{ ok: true }`.

**Why it's irreversible:** No endpoint reverses the status from `published`. The frontend also hides the re-enrich button at `published`.

**Frontend proxy route (new file):**
`apps/web/src/app/api/articles/[jobId]/publish/route.ts`

```typescript
import { NextRequest } from 'next/server'
import { proxyToApi } from '@/lib/api-proxy'

type Ctx = { params: Promise<{ jobId: string }> }

export async function POST(request: NextRequest, { params }: Ctx) {
  const { jobId } = await params
  return proxyToApi(request, `/api/articles/${jobId}/publish`, { method: 'POST' })
}
```

---

## 5. Backend: `POST /articles/:jobId/rewrite`

**File:** `apps/api/src/routes/articles.ts`

**Logic:**
1. Authenticate user, load job.
2. Verify `job.status === 'completed'`. If not → 400 error (`Cannot rewrite a job with status: ${status}. Job must be at 'completed'.`).
3. Delete pipeline steps 7–12 (keep steps 1–6):
   ```typescript
   await prisma.pipelineStep.deleteMany({
     where: { jobId, stepNumber: { gte: 7, lte: 12 } },
   })
   ```
4. Reset job to `in_progress` with `currentStep: 6`:
   ```typescript
   await prisma.articleJob.update({
     where: { id: jobId },
     data: { status: 'in_progress', currentStep: 6 },
   })
   ```
5. Fire-and-forget `runPipelinePhaseA(jobId)`:
   - The executor already has **resume support** — it checks `ctx.completedSteps` and skips steps 1–6 because they still exist as `completed` in the DB. Steps 7–12 have been deleted, so the executor runs them fresh.
   - No changes needed to `executor.ts`.
6. Return `{ ok: true, message: 'Article rewrite started' }`.

**Important:** Step 2 already validated keyword uniqueness and upserted the `SitePage` with the keyword during the original run. Since we keep steps 1–6 intact, the `SitePage` and its `primaryKeyword` remain unchanged. The executor's step-2 validation code is simply skipped (already completed).

**Frontend proxy route (new file):**
`apps/web/src/app/api/articles/[jobId]/rewrite/route.ts`

```typescript
import { NextRequest } from 'next/server'
import { proxyToApi } from '@/lib/api-proxy'

type Ctx = { params: Promise<{ jobId: string }> }

export async function POST(request: NextRequest, { params }: Ctx) {
  const { jobId } = await params
  return proxyToApi(request, `/api/articles/${jobId}/rewrite`, { method: 'POST' })
}
```

---

## 6. Backend: Include `schemaJson` in Job Detail Response

**File:** `apps/api/src/routes/articles.ts` — `GET /articles/:jobId`

The `sitePage` include currently does not select `schemaJson`. The `include: { sitePage: ... }` block does not restrict fields via `select` (it uses `include` for relations), so `schemaJson` is **already included** in the response by default — Prisma includes all scalar fields unless a `select` is used.

**Verification:** Double-check by reading the full query. If it uses `include: { sitePage: true }` or `include: { sitePage: { include: { ... } } }`, all scalar fields are returned. No backend change needed.

**Frontend:** Add `schemaJson?: string | null` to the `SitePage` type in the page component.

---

## 7. Frontend: Schema Review Panel

**Position:** Between the Diagrams section and the Export section.

**Visibility:** When `['approved', 'enriched', 'published'].includes(displayStatus)` AND `sitePage?.schemaJson` is non-null.

**Layout:**

```
┌─ Schema Markup ─────────────────────────────────────────┐
│  📄 Schema Markup                                       │
│  ─────────────────────────────────────────────────────── │
│  <pre class="...overflow-x-auto max-h-60 overflow-y-auto">
│    {                                                     │
│      "@context": "https://schema.org",                  │
│      "@type": "Article",                                │
│      ...                                                │
│    }                                                     │
│  </pre>                                                  │
│                                                          │
│  🔗 Validate on Google Rich Results Test ↗               │
│                                                          │
│  ── Action bar (enriched only) ────────────────────────  │
│  [🔄 Rerun Enrichment]            [✅ Publish Article]  │
└──────────────────────────────────────────────────────────┘
```

- The schema JSON is displayed in a collapsible `<pre>` block, pretty-printed with `JSON.stringify(parsed, null, 2)`.
- The validation link opens `https://search.google.com/test/rich-results` in a new tab (the user pastes their live URL or the schema there).
- The "Rerun Enrichment" and "Publish Article" buttons are placed in the action bar **inside this panel**, visible only at `enriched` status.

---

## 8. Frontend: Publish & Rerun Enrichment Buttons

### Publish Button

- **Visible at:** `enriched` status only.
- **Styling:** `bg-emerald-600 hover:bg-emerald-700 text-white` — green to signal "go/finalize".
- **Click handler `handlePublish`:**
  1. `setIsPublishing(true)`
  2. `POST /api/articles/${jobId}/publish`
  3. On success: `toast.success('Article published — export options are now available')`, `fetchJob()`.
  4. On error: `toast.error(...)`.
  5. `setIsPublishing(false)`.
- **After click:** Status becomes `published` → button disappears, Export section appears, "Rerun Enrichment" disappears.

### Rerun Enrichment Button

- **Visible at:** `enriched` status only (hidden at `published`).
- **Reuse existing `handleReEnrich`** — it already calls `POST /api/articles/${jobId}/re-enrich`.
- **Styling:** `variant="outline"` with a `RefreshCw` icon. Same as current "Retry Diagrams" but always visible at `enriched`.
- **Remove** the old "Retry Diagrams" button that was conditional on `enrichmentStatus === 'failed'`. The new placement in the Schema panel replaces it.

---

## 9. Frontend: Rewrite Article Button

- **Visible at:** `completed` status only (before approval).
- **Position:** Next to the "Approve Article" button inside the Review Content panel header.
- **Styling:** `variant="outline"` with an `orange` accent: `border-orange-300 text-orange-600 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-900/30`.
- **Click handler `handleRewrite`:**
  1. `setIsRewriting(true)`
  2. `POST /api/articles/${jobId}/rewrite`
  3. On success: `toast.success('Rewrite started — re-running fact research and writing…')`, clear live SSE state, `fetchJob()`, `startSSE()`.
  4. On error: `toast.error(...)`.
  5. `setIsRewriting(false)`.
- **Disappears** once "Approve" is clicked (status moves beyond `completed`).

### New state variable

```typescript
const [isRewriting, setIsRewriting] = useState(false)
const [isPublishing, setIsPublishing] = useState(false)
```

---

## 10. Frontend: High-Contrast Approve Button

**Current styling:**

```tsx
className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
```

**New styling — gradient with glow ring for attention:**

```tsx
className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/25 ring-2 ring-purple-400/50 gap-1.5"
```

This adds:
- A purple→indigo gradient (more eye-catching than flat purple).
- A `shadow-lg` with purple tint for a subtle glow effect.
- A semi-transparent ring for additional visual emphasis.
- No size change — stays at `size="sm"`.

---

## 11. Frontend: Export Section Gating

**Current behavior:** Export panel is always rendered. Buttons are locked behind `displayStatus !== 'enriched'`.

**New behavior:**

- **Render the Export panel only when `displayStatus === 'published'`** — it's completely hidden before that.
- Remove the lock message ("🔒 Export buttons unlock once enrichment completes") since the section simply doesn't exist until published.
- The "Preview" link currently lives inside the Export panel. Move the Preview link to the Article Metadata section so it's accessible at any post-completion status.

---

## 12. Button Visibility Matrix

| Button | `completed` | `approved` | `enriched` | `published` |
|--------|:-----------:|:----------:|:----------:|:-----------:|
| **Approve Article** | ✅ (gradient, prominent) | — | — | — |
| **Rewrite Article** | ✅ (outline, orange) | — | — | — |
| **Approving…** (disabled) | — | ✅ (while Phase B runs) | — | — |
| **Approved** badge | — | ✅ | ✅ | ✅ |
| **Adding Diagrams…** | — | ✅ (while enrichment runs) | — | — |
| **Rerun Enrichment** | — | — | ✅ | — |
| **Publish Article** | — | — | ✅ | — |
| **Export buttons** | — | — | — | ✅ |
| **Preview link** | ✅ | ✅ | ✅ | ✅ |

---

## 13. File Inventory

| File | Action | Description |
|------|--------|-------------|
| `apps/api/src/routes/articles.ts` | MODIFY | Add `POST /articles/:jobId/publish` and `POST /articles/:jobId/rewrite` endpoints |
| `apps/web/src/app/api/articles/[jobId]/publish/route.ts` | CREATE | Next.js proxy route for publish |
| `apps/web/src/app/api/articles/[jobId]/rewrite/route.ts` | CREATE | Next.js proxy route for rewrite |
| `apps/web/src/app/(protected)/workflow/[jobId]/page.tsx` | MODIFY | All frontend UI changes (Schema panel, buttons, gating, styling) |
| `packages/db/prisma/schema.prisma` | MODIFY | Update status comment to include `published` (comment-only, no migration) |

---

## 14. Implementation Checklist

- [ ] **1. Backend: `POST /articles/:jobId/rewrite` endpoint** — Delete steps 7–12, reset to `in_progress` at step 6, fire `runPipelinePhaseA(jobId)`
- [ ] **2. Backend: `POST /articles/:jobId/publish` endpoint** — Validate `enriched` status, set to `published`
- [ ] **3. Frontend proxy: `rewrite/route.ts`** — Proxy POST to backend
- [ ] **4. Frontend proxy: `publish/route.ts`** — Proxy POST to backend
- [ ] **5. Frontend: Add `published` status label** — Emerald green badge
- [ ] **6. Frontend: Add `schemaJson` to SitePage type** — Extend TypeScript type
- [ ] **7. Frontend: Schema Review panel** — Pretty-print JSON-LD, validation link, collapsible
- [ ] **8. Frontend: Rerun Enrichment + Publish buttons** — In Schema panel, visible at `enriched` only
- [ ] **9. Frontend: Rewrite Article button** — In Review Content header, visible at `completed` only
- [ ] **10. Frontend: High-contrast Approve button** — Gradient + glow ring styling
- [ ] **11. Frontend: Gate Export section to `published` only** — Hide until published, move Preview link
- [ ] **12. Frontend: New state variables** — `isRewriting`, `isPublishing`
- [ ] **13. Frontend: Update SSE/attempts triggers** — Account for `published` status in effect dependencies
- [ ] **14. Schema comment update** — Add `published` to status enum comment in `schema.prisma`
- [ ] **15. TypeScript build verification** — `tsc --noEmit` passes in both `apps/api` and `apps/web`
