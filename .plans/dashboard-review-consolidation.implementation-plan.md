# Dashboard Review Consolidation — Implementation Plan

Status: **all 4 phases implemented and pushed to staging** (2026-07-09).

## Goal

Today, content approval (article body / newsletter HTML) happens via a dashboard modal
(`ReviewApproveModal`), but social-post review happens on two separate full pages
(`/workflow/[jobId]` for articles, `/newsletter/[id]` for newsletters) that the user has to
remember to visit — the dashboard has **no signal at all** that social posts are ready. Goal:
surface social review as a second "Review & Approve"-style action directly from the dashboard's
Content Plan, via modals, so both review stages are reachable from one place.

## Decisions locked (2026-07-09 discussion)

- **Newsletter modal = full page**, not just social posts. It opens the equivalent of
  `/newsletter/[id]` (metadata edit, regenerate-section controls, HTML preview, AND
  `NewsletterSocialPreview`) inside a modal — matches the user's literal ask ("opens up this
  page … as a modal popover").
- **Additive, not a replacement.** `/workflow/[jobId]` and `/newsletter/[id]` keep working
  exactly as they do today (bookmarkable/shareable links, fallback path). The dashboard modal
  is a new, faster primary path — nothing existing is removed.
- **Content approval is unchanged.** `ReviewApproveModal` stays as-is.
- **Two distinct affordances, not one merged queue.** Content approval and social review are
  different pipeline stages that unlock at different times (social often isn't ready when
  content approval happens) — a second, distinctly-labeled button ("Review Social Posts" or
  similar) appears once social is ready, separate from the existing "Review & Approve" button.

## Current-state facts this builds on

- `ReviewApproveModal` (`features/dashboard/ReviewApproveModal.tsx`) handles content approval
  for both `kind: 'article' | 'newsletter'`, triggered from `ContentPlan.tsx`'s `ReviewBtn`.
  Approving triggers social generation in the background (unchanged, out of scope here).
- `/api/review-inbox` (backend: `routes/content-plan.ts` `GET /review-inbox`) is what powers
  the dashboard's ready-to-review queue. It only queries `ArticleJob.status` (`enriched`,
  `needs_review`) and `Newsletter.status` (`ready_for_review`) — **zero awareness of
  `SocialAutomationRun.status`**. This is the gap that needs closing.
- `SocialPreviewPanel` (`features/social/SocialPreviewPanel.tsx`) is already a fully
  self-contained preview/approve/retry UI, driven by a `runs` prop + callbacks. It already has
  its own approve-all (`POST /api/social-automation/:runId/approve`) and per-slot retry/approve
  — **the new modals need zero new approve logic**, just chrome around this existing component.
- `NewsletterSocialPreview` (`features/social/NewsletterSocialPreview.tsx`) is a ~70-line
  self-contained wrapper: fetches `/api/newsletters/:id/social-automation`, polls while
  generating, renders `SocialPreviewPanel`. Already exactly the shape needed for reuse.
- `SocialMediaSetSection` (`features/workflow/SocialMediaSetSection.tsx`) is the article
  equivalent, but its data comes from the large `useWorkflowJob()` hook rather than a small
  standalone hook — needs a **new, smaller hook** for modal use rather than reusing
  `useWorkflowJob` wholesale (that hook also drives error logs/schema/syndication/export, all
  irrelevant to social review).
- `/newsletter/[id]/page.tsx` is a plain `'use client'` component keyed only off the `id` route
  param — no server-rendering entanglement. Genuinely portable: extract its body into a shared
  component both the route and the new modal render.
- Confirmed: `GET /api/articles/:jobId/social-automation` and
  `GET /api/newsletters/:id/social-automation` already exist and return the run(s) needed.

## Phase A — Backend: surface "social ready" on the dashboard — IMPLEMENTED (2026-07-09)

- Extend `GET /review-inbox` (`routes/content-plan.ts`) to also query
  `SocialAutomationRun` for the account's articles/newsletters and return, per item, its social
  status. Minimum viable: a `socialReady: { articles: [{jobId}], newsletters: [{newsletterId}] }`
  (or fold into the existing `articles`/`newsletters`/`flagged` shape with a `socialStatus`
  field) for runs in `status: 'ready'`.
- Nice-to-have (not required for v1): also report `processing` (show a subtle "generating…"
  indicator) and `failed` (so the user knows to check/retry) — easy follow-on, same query
  shape, can ship after the core `ready` case works.

**Done:** added a 4th parallel query (`SocialAutomationRun` where `status: 'ready'`) to
`/review-inbox`, scoped by `userId: account.userId` — confirmed `SocialAutomationRun` is
already in `ACCOUNT_SCOPED_MODELS` (`packages/shared/src/prisma.ts`), so this single-userId
filter is transparently broadened to the whole account team by the existing Prisma extension,
matching the exact pattern the other three queries in this route already use. Response gains:
```json
"socialReady": { "articleJobIds": string[], "newsletterIds": string[] }
```
Deduped via `Set` (a run only ever has one of `jobId`/`newsletterId`, but multiple runs can
exist per article/newsletter over time). No titles included — Phase D's dashboard already has
titles for anything visible in the plan; out-of-window titling is a Phase D detail, not Phase A.
Verified directly against staging data (not just typechecked): queried with the July 10
newsletter run's owning `userId` and confirmed `newsletterIds` correctly includes
`cmr3t5bkj002npc01j8oij5di` alongside 5 other ready newsletters and 13 ready articles.
`processing`/`failed` reporting deferred as originally planned — not implemented.
436 tests pass (no new tests — this route has no existing test coverage; the added logic is a
2-line Set-dedup, consistent with this codebase's convention of not unit-testing thin
DB-orchestrating route handlers).
- `ContentPlan.tsx` already carries `jobId`/`newsletterId` per day (`ArticleEntry.jobId`,
  `Day.newsletter.newsletterId`) — matching the new social-ready IDs against visible days is
  the same pattern already used for `readyArticleIds`/`readyNewsletterIds`.

## Phase B — Article social review modal — IMPLEMENTED (2026-07-09)

- New component, e.g. `features/dashboard/SocialReviewModal.tsx` (or
  `features/social/ArticleSocialReviewModal.tsx`) — modal chrome (header, close, title) wrapping
  a **new small self-contained hook/component** mirroring `NewsletterSocialPreview`'s pattern:
  fetch `/api/articles/:jobId/social-automation`, poll while generating, render
  `SocialPreviewPanel` with its existing retry/approve wiring. Do **not** reuse `useWorkflowJob`
  (too much unrelated state).
- Triggered from a new button in `ContentPlan.tsx`'s `ReviewActions`/day cell, shown when the
  new `socialReady` signal includes that day's `jobId`.

**Done:**
- `features/social/ArticleSocialPreview.tsx` — new, self-contained, structurally a near-exact
  mirror of the already-proven `NewsletterSocialPreview.tsx` (fetch `/api/articles/:jobId/social-automation`,
  5s poll while `pending`/`processing`/`scheduling`, retry via `/api/social-automation/:runId/retry/:slotKey`,
  renders the existing `SocialPreviewPanel` which already owns its own approve-all/per-slot-approve
  logic — zero new approve logic needed). No section header — the modal chrome owns the title.
  Added `Loading…`/`No social posts yet` states neither `SocialMediaSetSection` nor
  `NewsletterSocialPreview` needed (they only render once runs already exist), since this modal
  can now be opened directly without that guarantee.
- `features/dashboard/SocialReviewModal.tsx` — new modal chrome, structurally mirroring
  `ReviewApproveModal`'s large-review-modal convention (`h-[90vh] max-w-6xl`, explicit close
  button, no backdrop-click-to-close). Deliberately does **not** port `/workflow/[jobId]`'s other
  panels (error logs, schema, syndication, export) — focused purely on social review, per the
  2026-07-09 discussion.
- `tsc --noEmit` and `eslint` both clean. Not yet wired into any page — that's Phase D
  (`ContentPlan.tsx`'s trigger button + modal state). No live smoke test possible until then;
  confidence comes from the close structural match to two already-deployed, working components
  (`NewsletterSocialPreview`, `ReviewApproveModal`).

## Phase C — Newsletter social review modal (full page) — IMPLEMENTED (2026-07-09)

- Extract `/newsletter/[id]/page.tsx`'s body into a shared component, e.g.
  `features/newsletter/NewsletterEditionContent.tsx`, taking `newsletterId` as a prop (all its
  data-fetching already keys off `id` alone — straightforward extraction, no route-only
  dependencies found).
- `/newsletter/[id]/page.tsx` becomes a thin wrapper rendering
  `<NewsletterEditionContent newsletterId={id} />` (behavior-preserving refactor — same page,
  same URL, same everything, just relocated body).
- New `features/dashboard/NewsletterReviewModal.tsx` — modal chrome wrapping the same
  `<NewsletterEditionContent newsletterId={id} />`.
- Triggered from a new button in `ContentPlan.tsx`, shown when `socialReady.newsletters`
  includes that day's `newsletterId`.

**Done:**
- `features/newsletter/NewsletterEditionContent.tsx` — the extracted body (metadata edit,
  regenerate-section controls, HTML preview, `NewsletterSocialPreview`), unchanged logic,
  `newsletterId` as a plain string prop. Deliberately **excludes** route-navigation chrome (the
  "All editions" back link, outer page width/padding) — a modal has no "navigate away" concept
  and provides its own sizing, so those stay with each caller instead.
- `/newsletter/[id]/page.tsx` — now a ~20-line thin wrapper: outer width/padding + the back link
  + `<NewsletterEditionContent newsletterId={id} />`. Same URL, same behavior, verified via a
  full production build (not just typecheck) — `npx next build` succeeded with `/newsletter/[id]`
  compiling correctly.
- `features/dashboard/NewsletterReviewModal.tsx` — modal chrome matching `SocialReviewModal`'s
  exact convention (`h-[90vh] max-w-6xl`, explicit close, no backdrop-click-to-close), wrapping
  the same shared content component so the route and the modal can never drift out of sync.
- `tsc --noEmit`, `eslint`, and a full `next build` all clean. Not yet wired into the dashboard —
  that's Phase D.
  includes that day's `newsletterId`.

## Phase D — Dashboard wiring — IMPLEMENTED (2026-07-09)

- `ContentPlan.tsx`: load the new `socialReady` data alongside the existing `inbox` fetch.
- Add the second button (distinct label/icon from "Review & Approve") next to/near the existing
  `ReviewBtn` in the day cell, for both table and grid views (mirror the existing dual-rendering
  pattern already used for `ReviewBtn`).
- Decide button label: candidates — "Review Social Posts", "Review Posts", "Social Ready ●".
  Pick during implementation; not architecturally significant.
- `outOfWindow`-equivalent handling: an item whose social posts become ready after it's scrolled
  out of the visible date range should still be reachable — mirror the existing `outOfWindow`
  pattern already in `ContentPlan.tsx` for content-review items.

**Done:**
- `Inbox` interface gains `socialReady?: { articleJobIds: string[]; newsletterIds: string[] }` —
  no extra fetch needed, it rides along on the existing `/api/review-inbox` call.
- Two new state slots (`socialReviewArticle` / `socialReviewNewsletter`, each `{ id, title } | null`
  — separate slots rather than one generic one, since `SocialReviewModal` and
  `NewsletterReviewModal` take different prop shapes by design).
- `socialReadyArticleIds` / `socialReadyNewsletterIds` derived `Set`s, mirroring the existing
  `readyArticleIds`/`readyNewsletterIds` pattern exactly.
- New `SocialReviewBtn` — **corrected 2026-07-09**: initially shipped with a distinct label
  ("Review Social Posts") and outline styling, which was my own unilateral judgment call while
  writing this plan, not something actually agreed with the user (the two things explicitly
  confirmed were the newsletter modal scope and keeping the old pages — button styling was never
  asked about). User feedback: all review buttons should look the same for consistency. Now
  identical to `ReviewBtn` — same label ("Review & Approve"), same icon (`CheckCircle2`), same
  solid-primary styling. Still a structurally separate component (different click target/modal),
  just no longer visually distinguished. Wired into `ReviewActions` (shared by both table and grid views
  automatically, since both already call the same function) for both article and newsletter,
  independent of the existing assigned/ready/flagged states — a day can show both a content
  action and a social action at once if applicable.
- On modal close, `void load()` re-fetches `/review-inbox` so the button disappears once the run
  moves past `'ready'` (e.g. after approving) — matches the existing `onApproved` pattern for
  content review.
- **Out-of-window handling deliberately deferred** (see Risks below) — the button only appears
  for days visible in the current 30-day plan window, where a title (`a.topic`/`nl.topic`) is
  already available from the day-plan data. Phase A's `socialReady` only returns bare IDs, so an
  out-of-window social-ready item has no title to show yet; extending this would mean going back
  to Phase A's endpoint to add titles. Judged low-value for v1: social generation typically
  completes within days of approval, well inside the 30-day window, making this a rare edge case
  — not implemented now, easy follow-up if it turns out to matter in practice.
- Verified via `tsc --noEmit`, `eslint`, and a full `next build` (not just typecheck) — `/dashboard`
  grew 24.1→25.7 kB (expected, two new modal imports); `/newsletter/[id]`'s own chunk actually
  *shrank* 5.68→3.19 kB, since Next.js now shares the `NewsletterEditionContent` chunk between the
  route and the dashboard modal bundle rather than duplicating it — confirms the Phase C
  extraction is genuinely shared, not copy-pasted.

## Touch list (files)

- `apps/api/src/routes/content-plan.ts` — extend `/review-inbox` query (Phase A).
- `apps/web/src/features/dashboard/ContentPlan.tsx` — new button, new modal state, load new data (Phase D).
- `apps/web/src/features/dashboard/SocialReviewModal.tsx` — new (Phase B).
- `apps/web/src/features/social/ArticleSocialPreview.tsx` (or similar name) — new small hook/component, article-side equivalent of `NewsletterSocialPreview` (Phase B).
- `apps/web/src/features/newsletter/NewsletterEditionContent.tsx` — new, extracted from `/newsletter/[id]/page.tsx` (Phase C).
- `apps/web/src/app/(protected)/newsletter/[id]/page.tsx` — becomes a thin wrapper (Phase C).
- `apps/web/src/features/dashboard/NewsletterReviewModal.tsx` — new (Phase C).

## Risks / open details for implementation time

- Confirm whether `processing`/`failed` social states should be visible in v1 or deferred (leaning defer, per Phase A).
- Button/icon design for the day cell — table view is already fairly dense; needs a compact treatment.
- Whether the social review modal should support the same "hasNext, auto-advance to the next item" queue behavior `ReviewApproveModal` has. Leaning yes for consistency, not decided.
