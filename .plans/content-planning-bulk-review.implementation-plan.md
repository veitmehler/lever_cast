# Implementation Plan — Content Planning, Bulk Generation, Auto Quality Gate & Collaborative Review

Status: **approved-for-planning (do not implement yet)** · Author: design discussion 2026-06-19

## Goal

Give end-users the **most ways to capture/plan article + newsletter topics** and the
**simplest path to finished, published content**:

- Capture ideas, upload CSVs, and receive admin-curated article content calendars.
- See the next 30 days of article **and** newsletter topics on the dashboard (table default, grid toggle), editable inline.
- Bulk-select days → generate sequentially → one "ready to review" email → approve/publish from a dashboard inbox.
- Articles pass an **automated quality gate** (Gemini 3.1 Pro → GPT-4o-mini judge) so the human only reviews the **final enriched** article.
- A **collaborative edit-request** flow: a reviewer highlights text + writes a note, hands it to another account user (the "assistant") to action, who then requests re-review.

## Decisions locked
1. Article calendars route by **specialization × hemisphere** (reuse the newsletter resolver), but are **separate** from newsletter calendars.
2. Plan view: **table + grid with a toggle; table is the default.**
3. Dashboard **Review & Approve** opens the relevant editor in a **modal**; user must read; bottom bar **Save | Approve**; Approve → auto-publish (WP/GHL) + start social generation + close → next item.
4. Quality gate: **Gemini 3.1 Pro evaluates → GPT-4o-mini judges** (structured `pass | revise | fail`).
5. Rewrite loop: **max 2 attempts**, then mark `needs_review` and **notify admin**.
6. Accounts: **up to 3 users per account, all equal permissions.**
7. Edit requests block Approve/publish until the round is resolved; assistant email defaults from account settings, overridable per send; highlights use **text-quote anchoring** rendered as an overlay (never baked into `bodyHtml`).

## Current-state facts this plan builds on
- `Topic` (required `scheduledDate`, `mode`, outline/keyword config) → `ArticleJob` → Phase A (steps 0–12) → `completed` → **manual** Gemini check + `approveArticleJob` (Phase B 13–18, schema step 16 is deterministic) → Phase C enrichment → final.
- Newsletter: `NewsletterCalendar` (specialization × hemisphere, auto-routed) → `NewsletterTopic` → `Newsletter` status `ready_for_review` → Resend review email → approve → schedule via GHL.
- Existing reusable UI: `ArticleEditor.tsx`, `FinalReviewPanel.tsx`, `ReviewContentPanel.tsx`, newsletter editor at `/newsletter/[id]`, `ContentCalendar` (currently social posts), user CSV import at `/topics/csv`.
- Auth is **Clerk**; email is **Resend**; admin alerts via `lib/alerts.ts`; social via `apps/api/src/social/automation/`.
- No team/multi-user/comment models exist today; everything is keyed by `userId`.

---

## Phase 0 — Multi-user accounts (up to 3, equal permissions) [foundational]

**Why first:** the edit-request assignee and shared content visibility both require an account concept.

**Approach:** use **Clerk Organizations** for membership + invites (native: members, invitations, 3-seat cap), and mirror to a local `Account` for data scoping. Each `User` belongs to exactly one `Account`. All members share equal permissions.

**Data model**
- `Account { id, clerkOrgId @unique, name, createdAt, updatedAt }`.
- `User.accountId` (FK → Account). Backfill: create one Account per existing user; set membership.
- Move the **brand-level singletons to the account**: `BrandSettings` → `accountId` (one brand profile per account), and newsletter routing (`newsletterCalendarId`) → account-level (so all members share the same routed calendar). Other per-user content (`Topic`, `ArticleJob`, `Newsletter`, ideas) gains an `accountId` for shared visibility while keeping `userId` as the creator.

**Access layer**
- Helper `resolveAccount(clerkUserId) → { accountId, memberUserIds[] }`.
- Replace `where: { userId }` content reads with `where: { accountId }` (or `userId IN memberUserIds` for tables not yet re-keyed). Centralize so the migration is mechanical.

**API / web**
- Settings → **Team** panel: list members (≤3), invite by email (Clerk invitation), remove member. Default **assistant email** field for edit requests.
- Clerk org sync webhook → upsert `Account`/membership.

**Risks**: this is the largest refactor (re-keying ownership). Mitigation: introduce `accountId` columns + backfill, dual-read during transition, flip reads table-by-table. Phases 1–5 can proceed against `userId` and adopt `accountId` as it lands; **Phase 7 hard-depends on Phase 0.**

**Tests**: account creation/backfill; member cap = 3; cross-member content visibility; brand-settings shared.

---

## Phase 1 — Idea bank (dashboard capture + undated CSV)

**Goal:** the dashboard input becomes idea capture (brainstorm/save-for-later), not generate-now. Scheduling an idea makes it the **primary** article topic for that date.

**Data model**
- `Topic.scheduledDate` → **nullable**.
- `Topic.status` gains `idea` (unscheduled). Add `source` enum: `idea | csv | article_calendar | manual`.
- Optional `primaryForDate` semantics: a scheduled idea wins over a calendar topic for the same date (see Phase 4 precedence).

**API / web**
- Dashboard input: "Capture idea" → creates `Topic{ status:'idea', scheduledDate:null }`. Keep an explicit "generate now" affordance for power users.
- Idea bank list (panel/tab): edit, delete, **assign to a date** (→ becomes scheduled primary).
- `/topics/csv`: accept rows **without** a date (→ idea bank) alongside dated rows (→ scheduled).

**Tests**: capture idea; schedule idea→date; CSV mixed dated/undated.

---

## Phase 2 — Article content calendars (admin-curated, routed)

**Goal:** an admin-managed article topic calendar, mirroring newsletters, auto-populating each client's plan.

**Data model** (parallel to newsletter, **separate**)
- `ArticleCalendar { id, name, industry, specializationKey?, hemisphere?, @@unique([specializationKey, hemisphere]) }`.
- `ArticleCalendarTopic { id, calendarId, date, topic, angle/bullets, outlineFrameworkNumber?, keywords?, ... }` — article-shaped fields (cadence ~1–2/week), distinct from `NewsletterTopic`.
- Reuse `effectiveHemisphere` / routing; add `Account.articleCalendarId` (account-level, same resolver as newsletter).

**API / web**
- Admin: Article Calendars CRUD + CSV upload (reuse newsletter CSV importer pattern + a template) + assign/auto-route.
- Client: article-calendar topics surface in the 30-day plan (Phase 4) as the per-day default.

**Tests**: routing parity with newsletter; CSV import idempotency; per-day default resolution.

---

## Phase 3 — Auto quality gate + lifecycle re-sequence

**Goal:** remove the manual "paste into Gemini" step; the human reviews only the **final enriched** article.

**New lifecycle**
```
Phase A (body) → completed
  → (auto) QUALITY GATE
       1. Gemini 3.1 Pro evaluates the markdown body
       2. GPT-4o-mini judges Gemini's prose → { verdict: pass|revise|fail, severity, reasons[] }
            framing: minor/optional suggestions = PASS; fail only for substantive issues;
                     verdict usually stated in the first paragraph.
  → PASS → auto approveArticleJob (Phase B 13–18) → Phase C enrichment → status ready_for_review (FINAL)
  → REVISE/FAIL → rewrite body → re-gate (max 2 attempts) → still bad → status needs_review + notify admin (email + lib/alerts)
  → JSON-LD: deterministic VALIDATOR (parse + schema.org Article required fields + Google Rich-Results constraints);
             on error rebuild once, else log/flag (non-fatal, as today)
```
- The existing `approve` endpoint becomes **internal/automatic**; the human's dashboard "Approve" becomes a **publish** action (Phase 6).

**Implementation**
- New `apps/api/src/article-pipeline/quality-gate.ts`: `evaluateWithGemini(markdown)`, `judgeVerdict(geminiText)` (GPT-4o-mini, structured JSON), `validateSchemaJsonLd(schemaJson)`.
- Hook at end of Phase A executor: enqueue `article-quality-gate` job; on pass auto-enqueue approval; on fail enqueue rewrite (bounded).
- Persist every verdict (audit) for tuning before fully trusting the gate.
- `gate` applies **uniformly** to all article generations (idea-bank, calendar, bulk).

**Risks**: added cost/latency; trust boundary. Mitigations: per-article cost ceiling surfaced in batch summary; `needs_review` fallback queue; admin verdict log.

**Tests**: judge framing (minor suggestions → pass; substantive → fail); rewrite bound = 2 → needs_review; schema validator pass/rebuild; verdict persistence.

---

## Phase 4 — Unified 30-day content plan view

**Goal:** one surface showing the next 30 days of **article + newsletter** topics; editable; the launch point for bulk generation.

**UI**
- New "Content Plan" view (upgrade `/calendar` or new tab). **Table default**, **grid toggle**.
- Per day, two tracks: **Article** and **Newsletter**.
  - Article cell = resolved primary topic, **precedence: user-scheduled idea > article-calendar topic > empty**; non-chosen shown as swappable alternatives; inline editable; idea-bank picker.
  - Newsletter cell = routed `NewsletterTopic` (largely read-only; optional client override).
- Multi-select days/items → **"Generate selected"** (→ Phase 5).

**API**
- `GET /content-plan?from&to` → merged article+newsletter topics per day with source/precedence + alternatives.
- Inline edit endpoints (topic text, swap idea, override).

**Tests**: precedence resolution; merge of two tracks; inline edit; selection model.

---

## Phase 5 — Bulk generation + review email + approval inbox

**Goal:** generate selected days sequentially; one email when all are review-ready; approve/publish from the dashboard.

**Data model**
- `ContentBatch { id, accountId, createdByUserId, status, itemCount, readyCount, flaggedCount, createdAt, completedAt }`.
- `ContentBatchItem { id, batchId, kind: article|newsletter, topicId/newsletterId, status }`.

**Execution**
- Enqueue items; **concurrency 1 per account** (cost + LLM rate-limit control); run sequentially.
- Articles flow through the quality gate (Phase 3); newsletters use existing generation.
- When all items reach review-ready/flagged → **one** Resend email summarizing **ready** + **flagged** counts, linking to the dashboard inbox.

**UI**
- Dashboard **approval inbox**: list of review-ready items (article + newsletter), each with a **Review & Approve** button (→ Phase 6) and flagged/needs_review items surfaced.

**Tests**: sequential ordering; partial failure handling; single-email-on-complete; flagged summary.

---

## Phase 6 — Review & Approve modal

**Goal:** read-gated review + one-click approve→publish, advancing through the inbox.

**UI**
- Clicking **Review & Approve** opens a **modal** embedding the existing editor (`ArticleEditor` / newsletter editor) for that item.
- **Must-read gate:** Approve disabled until the user **scrolls to the bottom** of the content.
- Bottom bar: **Save** (persist edits) | **Approve**.
- **Approve** → persist edits → **publish** (article → WP; newsletter → schedule GHL at `publishingDate`) → **enqueue social generation** (articles only, using `defaultOutputTargets`) → close → **advance to next** ready item.
- Also a **"Request edits"** path (→ Phase 7) instead of approving.

**Tests**: scroll-gate enables Approve; save-then-approve; publish + social enqueue; advance-to-next.

---

## Phase 7 — Collaborative edit requests (highlight → note → assistant → re-review)

**Depends on Phase 0 (accounts) + Phase 6 (modal).**

**Data model**
- `ArticleEditRequest { id, sitePageId, requestedByUserId, assigneeUserId/assigneeEmail, quotedText, prefixContext, suffixContext, note, status: open|resolved|wont_fix|orphaned, reviewRoundId, createdAt, resolvedAt, resolvedByUserId }`.
- `reviewRoundId` groups one "send to assistant" action and drives the round-trip status.

**Anchoring**
- **Text-quote anchoring** (W3C Web Annotation / Hypothes.is): store `quotedText` + prefix/suffix context + approximate offset. Re-locate on load to scroll/highlight; if the span was rewritten → `orphaned` (note still shown). Highlights rendered as an **overlay**, never persisted into `bodyHtml`.

**Flow**
```
Reviewer (in Review & Approve modal):
  select text → write note → (repeat) → "Send edits to assistant"
    → create ArticleEditRequests (one reviewRound) → email assignee (an account member)
    → article status: edits_requested  (Approve/publish BLOCKED)

Assistant (account member; lands on editing page via email deep-link):
  requests panel: open items; click → scroll to anchor; edit body; mark each done (struck through)
    → "Request review" → email reviewer
    → status: re_review_requested

Reviewer: reopens → sees resolved (struck-through) edits → Approve (→ publish) or send another round
```

**API / web**
- Endpoints: create round (+ requests), list requests for a sitePage, resolve/reopen request, request-review (round complete).
- Assistant editing page = `ArticleEditor` + docked **requests panel** + highlight/anchor overlay (shared with the reviewer modal).
- Emails (Resend): to assignee ("X requested N edits — start here") and back to reviewer ("Edits ready to review"), both deep-linking to the page + first open anchor.
- Assignee defaults from account settings (Phase 0), overridable per send.

**Tests**: anchor re-location + orphan detection; round-trip status transitions; publish blocked while a round is open; deep-link scroll-to-anchor; cross-member assignment.

---

## Suggested build order & dependencies
1. **Phase 0** (accounts) — foundational; Phase 7 hard-depends on it; brand/content scoping.
2. **Phase 1** (idea bank) — independent, quick win.
3. **Phase 3** (quality gate) — independent, high value; removes the manual Gemini step.
4. **Phase 2** (article calendars) — reuses newsletter infra.
5. **Phase 4** (plan view) — needs 1+2.
6. **Phase 5** (bulk + email + inbox) — needs 3+4.
7. **Phase 6** (modal) — needs 5.
8. **Phase 7** (edit requests) — needs 0+6.

(Phases 1–5 can proceed against `userId` scoping and adopt `accountId` as Phase 0 lands; only Phases 6/7 strictly require accounts.)

## Cross-cutting
- **Cost/latency**: gate + rewrite add LLM spend; enforce per-article ceiling, show in batch summary, keep verdict audit log.
- **Email**: all via Resend; deep links carry account/auth context (Clerk).
- **Safety**: `needs_review` queue + admin alert is the backstop for removing the human mid-review.
- **Migrations**: account re-keying is the riskiest; do additive columns + backfill + table-by-table read flips.
