# Newsletter Topic Override — Implementation Plan

Status: **implemented** (2026-07-10). All 5 phases + the "Also ready to review" removal complete.
Typecheck + full API test suite (446/446) + `next build` all clean on both apps. Not yet deployed/
verified on staging as of this line — the new `nl_topic_expand` prompt also needs the staging
seed script run manually (staging doesn't run the full `seed.ts`, per standing deploy notes).

## Goal

Today, an account's newsletter content for a given date is *always* whatever the admin-curated
`NewsletterCalendar` (auto-routed by specialization × hemisphere) says it is — no per-account
override exists. Give users the same topic-editing parity articles already have: pick from their
idea bank (shared with articles), or keep the admin default. The hard problem this plan solves:
admin-curated newsletter content is high-quality specifically *because* of a real, automated
research pipeline (real YouTube search, real web-search-grounded recipe research, real scraped
source articles for each teaser) that is driven by **structured input** (topic + 3 bullets +
optional recipe hints) — not by admin authority. A user picking their own topic must get that same
structured input filled in before the same research pipeline runs, so output quality is
mechanically identical regardless of source.

## Decisions locked (2026-07-09 discussion)

1. **The override is locked the moment generation starts.** Before that, a user can freely swap
   between the admin default and any idea-bank entry, or revert. Once generation is triggered for
   that date, the topic is frozen — no more swapping. (User, verbatim: *"yes, for sure."*)
2. **Custom research/drafting only runs at generation time, not at assignment time.** Picking an
   idea for a date just records the choice; the expensive LLM-draft + real-research work only
   happens when the user actually clicks Generate for that date — which is also the same moment
   the topic locks. This also means there's no "discard vs. cache research on revert" question:
   revert is only ever possible in the pre-research state, so there's nothing to discard.
3. **One shared idea bank.** Any idea-bank entry (the existing per-account `Topic` rows, today
   used for articles) is fair game as a newsletter topic too — no tagging/gating by content type.
4. **No intermediate review step.** The user does not review the auto-drafted bullets/recipe/
   secondary-topic or the research outputs — only the final generated newsletter (existing
   `ready_for_review` flow, unchanged). The auto-draft step should fill in **all** the fields an
   admin's CSV row would supply (topic refinement, bullet1–3, secondary topic, recipe hints) — not
   just bullets — then the *existing, unmodified* research + generation pipeline runs on top.
   Model: **Gemini 2.5 Flash** — confirmed as the codebase's de-facto stable choice (used by
   essentially every other newsletter/article grounded step); `gemini-3-flash-preview` exists in
   the prompt registry but only for one unrelated, explicitly preview-tagged step, so 2.5 Flash is
   the right call over anything "3.x."
5. **`secondaryTopic` is always populated, not conditionally skipped** — cost (a full second
   grounded article, doubling generation cost for that edition) is accepted in exchange for real
   parity with admin defaults. It must be grounded in the account's specialization the same way
   the admin CSV's secondary topics are: drafted with recent secondary topics from the account's
   *routed* `NewsletterCalendar` as exemplars, so a custom edition's secondary article "fits into
   the same content schedule for the specialization" rather than being invented in isolation.

## Current-state facts this builds on

- **`Topic`** (`packages/db/prisma/schema.prisma:490`): per-account (`userId`), freeform idea
  bank (`scheduledDate` nullable = idea; a date = scheduled). This is the "same idea bank" the
  user wants newsletters to draw from — no changes needed to this model.
- **`NewsletterTopic`** (`schema.prisma:1037`): NOT per-account. Belongs to a shared
  `NewsletterCalendar` (`calendarId` required, `@@unique([calendarId, date])`), auto-routed to
  users via `user.newsletterCalendarId` (specialization × hemisphere). Structured shape: `topic`
  (feature headline), `bullet1/2/3` (required strings), `secondaryTopic`/`recipe`/`recipe2`/
  `videoUrl` (optional), plus `research: Json?` + `researchStatus`.
- **Research pipeline** (`apps/api/src/newsletter/research.ts`, `ensureTopicResearch(topicId)`):
  a pure function of the `NewsletterTopic` row — real YouTube search for `videoUrl` (if unset),
  real web-search-grounded recipe research + written recipe + generated image for `recipe`/
  `recipe2` (if set), and for **each** of `bullet1/2/3` a real Google search → domain-filtered →
  HTTP-200-validated → LLM-picked → scraped source article (`researchOneTeaser`). Idempotent
  (skips if `researchStatus === 'complete'`). Doesn't care where the row came from.
- **Article generation** (`apps/api/src/newsletter/article.ts`, `generateArticle(topicText,
  bullets, ...)`): bullets feed the **outline** step (`nl_article_outline`, Google-Search-grounded)
  and the final writer step — they're not decorative, they scope what the whole grounded chain
  (outline → intro → FAQs → FAQ facts → facts → write) covers. Used for BOTH the feature article
  and, if `secondaryTopic` is set, a full second grounded article — i.e. populating
  `secondaryTopic` roughly doubles this account's generation cost for that edition. Worth being
  deliberate about whether the auto-draft step should populate it (see Risks).
- **Generation trigger** (`apps/api/src/handlers/newsletter-generate.ts`,
  `newsletterGenerateHandler`): for each `{userId, topicId}` job, sets `Newsletter.status =
  'researching'`, calls `ensureTopicResearch(topicId)`, then `status = 'generating'` →
  `generateNewsletterForCustomer(userId, topicId)` → `ready_for_review`. **This is the exact hook
  point** for the new auto-draft step — run it (if needed) immediately before
  `ensureTopicResearch`, and everything downstream is unchanged.
- **Resolution to a `topicId` for a date** happens in two places today, both hard-coded to
  "the routed calendar's topic, nothing else":
  - `GET /content-plan` (`apps/api/src/routes/content-plan.ts:95-100`) — for display.
  - `createBatchFromDates` (`apps/api/src/article-pipeline/content-batch.ts:88-95`) — for
    generation. Note the **article** branch just above it (lines 56-86) already implements the
    exact "a user-scheduled row wins, else adopt the admin suggestion" pattern this plan needs to
    replicate for newsletters — same shape of problem, already solved once in this codebase.
- **Prompt registry**: DB-backed `PromptTemplate` rows keyed by string `key` (not `stepNumber`,
  though the column is still required+unique), seeded from `packages/db/prisma/newsletter-
  prompts.ts` (`nl_*` keys, `stepNumber` 300+). `GEMINI_FLASH = 'gemini-2.5-flash'` constant
  already defined there — the new prompt should reuse it.
- **Dashboard**: `apps/web/src/features/dashboard/ContentPlan.tsx` — `ArticleCell` already has the
  full "Use idea / Add topic / Edit options / Clear (back to idea bank)" pattern to mirror.
  `NewsletterCell` is currently pure display (topic + status badge), no editing at all. The
  existing idea-picker modal (`pickerDate` state + `/api/topics/ideas` + `assignIdea()`) is
  article-specific (`PATCH /api/topics/:id` with `scheduledDate`) and needs a newsletter-target
  variant.
- **"Also ready to review"** (`ContentPlan.tsx:420-433`, `outOfWindow`): catches review-ready
  articles/newsletters whose date falls outside the visible window (mainly: unreviewed content
  from a cycle that has since rolled over). Removing it means such items become invisible on the
  dashboard — only findable via `/workflow` — which is the explicitly intended tradeoff.

## Phase 1 — Schema: account-scoped `NewsletterTopic` rows (done)

Extend the existing model rather than building a parallel one, so the research/generation code
paths stay identical for admin and custom topics:

```prisma
model NewsletterTopic {
  id               String              @id @default(cuid())
  calendarId       String?             // null for an account-private override
  calendar         NewsletterCalendar? @relation(fields: [calendarId], references: [id], onDelete: Cascade)
  accountId        String?             // set only for an account-private override (mutually exclusive with calendarId)
  account          Account?            @relation(fields: [accountId], references: [id], onDelete: Cascade)
  sourceTopicId    String?             // the idea-bank Topic.id this was assigned from (traceability)
  draftedAt        DateTime?           // set once the auto-draft step has filled bullet1-3/etc; null = not yet drafted
  date             DateTime
  topic            String
  bullet1          String
  bullet2          String
  bullet3          String
  ...              // unchanged
  @@unique([calendarId, date])
  @@unique([accountId, date])
  @@map("newsletter_topics")
}
```

- `calendarId` becomes nullable (Postgres/Prisma: a unique index with a nullable column allows
  multiple NULLs, so admin rows and account rows don't collide with each other under the *other*
  index — no exclusion-constraint trickery needed).
- `bullet1/2/3` stay required strings; an account row is created with `''` placeholders at
  *assignment* time and filled at *generation* time (Decision 2). `draftedAt` distinguishes
  "assigned but not yet drafted" (bullets still `''`) from "drafted" — the generation handler's
  gate condition.
- Migration: verify physical table name via `@@map("newsletter_topics")` and `@@map("accounts")`
  before writing SQL (per this repo's standing migration-safety rule).

## Phase 2 — Assign / revert API (done)

New route file `apps/api/src/routes/newsletter-topic-override.ts` (mirrors `topics.ts`'s role for
articles):

- **`POST /api/content-plan/newsletter-topic`** — `{ date: string, ideaTopicId: string }`. Loads
  the idea (`Topic`, must belong to this account). Resolves the *currently active* topic for that
  date (override if one exists, else the calendar's) via a shared resolver (see Phase 3) and 409s
  if a `Newsletter` row already exists for it (locked, Decision 1). Otherwise upserts on
  `[accountId, date]`: `topic = idea.topic`, `bullet1/2/3 = ''`, `sourceTopicId = idea.id`,
  `draftedAt = null`. No CSV import, no separate newsletter idea-capture UI — "Add topic" for a
  newsletter just reuses the existing idea-bank capture flow, then this endpoint assigns it
  (Decision 3 — one shared bank, one capture path).
- **`DELETE /api/content-plan/newsletter-topic?date=YYYY-MM-DD`** — same lock check, then deletes
  the account-scoped row for that date. Falls back to whatever the calendar currently has for that
  date — dynamically, not a frozen snapshot (confirmed acceptable in discussion).
- Extract a small shared `resolveNewsletterTopicForDate(account, date)` helper (override row via
  `accountId` wins, else the routed calendar's row) and use it in **all three** call sites (this
  endpoint's lock check, `GET /content-plan`, `createBatchFromDates`) instead of duplicating the
  precedence logic three times.

## Phase 3 — Resolution: override wins over calendar (done)

Both existing resolution points get the same one-line-of-precedence change the article branch
already has:

- `GET /content-plan` (`content-plan.ts:95-100`): query account-scoped `NewsletterTopic` rows
  (`accountId`) in the date range alongside the calendar ones; per-day, prefer the override.
  Response's per-day newsletter object gains e.g. `isOverride: boolean` (or `source: 'account' |
  'calendar'`) so the frontend knows whether "Revert" is meaningful — `newsletterId` (already
  returned) continues to be the lock signal, no new field needed for that.
- `createBatchFromDates` (`content-batch.ts:88-95`): same precedence — check the account-scoped
  row first, fall back to the calendar's, exactly like the article branch just above it.

## Phase 4 — Auto-draft step (generation-time, no review) (done)

- New prompt `nl_topic_expand` in `newsletter-prompts.ts` (provider `gemini`, model
  `GEMINI_FLASH`), JSON output: `{ topic, bullet1, bullet2, bullet3, secondaryTopic, recipe?,
  recipe2? }`. Input: the idea's raw topic string + account's industry/specialization (via
  `brandSettingsForUser`, same source `VoiceVars` already uses). Instructed to produce 3 specific,
  factually-groundable bullets (this is what actually drives research quality downstream — see
  Risks). `recipe`/`recipe2` stay conditional — blank unless genuinely relevant to the industry,
  matching how an admin would leave those CSV columns blank for some verticals. `videoUrl` is
  intentionally never drafted — the existing pipeline already auto-searches when absent, same as
  it does for admin topics.
- **`secondaryTopic` grounding** (Decision 5): new helper analogous to `priorRecipeTitles()` in
  `research.ts` — e.g. `priorSecondaryTopics(calendarId, limit)` — pulls recent `secondaryTopic`
  values from the account's *routed* calendar (`user.newsletterCalendarId`; the custom row itself
  has `calendarId = null`, but we still know which calendar this account is normally served from)
  and passes them into `nl_topic_expand` as exemplars (`{{recentSecondaryTopics}}`), the same way
  `researchOneRecipe` already avoids recipe-title repeats. This is what makes a custom edition's
  secondary article read as "part of the same specialization's content schedule" rather than an
  isolated LLM guess. If the account has no routed calendar (edge case — `newsletterCalendarId`
  unset), fall back to specialization-label-only grounding, same as the rest of the prompt.
- Orchestration: in `newsletterGenerateHandler`, immediately before `ensureTopicResearch(topicId)`
  — if the resolved `NewsletterTopic` is account-scoped (`accountId` set) and `draftedAt` is null,
  run the `nl_topic_expand` call, `prisma.newsletterTopic.update()` with the results +
  `draftedAt = now()`, *then* fall through into the existing `ensureTopicResearch` /
  `generateNewsletterForCustomer` calls, completely unchanged. This is the only code path change
  needed in the generation handler — everything after it is identical for admin and custom topics
  by construction.
- This is also exactly where the "lock" naturally happens: a `Newsletter` row already exists by
  this point (created by `createBatchFromDates`/`startItem` before the job was even enqueued), so
  no separate "lock" write is needed — the assign/revert endpoints' existing-`Newsletter`-row check
  (Phase 2) is already sufficient.

## Phase 5 — Dashboard UI (done)

- `NewsletterCell` gains the same interaction pattern as `ArticleCell`, minus the article-specific
  "Edit options" (framework/outline fields don't apply to newsletters):
  - Not yet generated, no override: "Use idea" (opens the idea picker) — admin default topic shown
    as read display.
  - Not yet generated, overridden: shows the chosen idea's topic + "Revert to original topic"
    (calls the DELETE endpoint) + still able to "Use idea" again to pick a different one.
  - Generated (`newsletterId` present, from the existing response shape): read-only, exactly like
    `ArticleCell` once `p.jobId` exists.
- The idea-picker modal is currently article-only (`pickerDate: string | null` +
  `assignIdea(date, idea)` → `PATCH /api/topics/:id`). Generalize to a target discriminator, e.g.
  `pickerTarget: { date: string; kind: 'article' | 'newsletter' } | null`, with the newsletter
  branch calling the new `POST /api/content-plan/newsletter-topic` instead. The idea list itself
  (`/api/topics/ideas`) is unchanged — same bank, both targets (Decision 3).

## Also this session: remove "Also ready to review" (done)

Independent, small change, same PR:
- Delete the `outOfWindow` block (`ContentPlan.tsx:420-433`) and its now-dead supporting
  computations (`outOfWindow`, and `visibleArticleIds`/`visibleNewsletterIds` if nothing else uses
  them after removal — double check before deleting).
- Confirmed tradeoff (accepted): review-ready items whose date has rolled outside the 60-day
  window are no longer surfaced on the dashboard; `/workflow` remains the way to find them.

## Touch list (files)

- `packages/db/prisma/schema.prisma` + new migration — `NewsletterTopic.accountId`/`sourceTopicId`/
  `draftedAt`, `calendarId` nullable, new `@@unique([accountId, date])`.
- `apps/api/src/routes/newsletter-topic-override.ts` — new, assign/revert endpoints +
  `resolveNewsletterTopicForDate` helper (or place the helper in a shared location used by all
  three call sites).
- `apps/api/src/routes/content-plan.ts` — `GET /content-plan` override-aware newsletter
  resolution + `isOverride`/`source` field.
- `apps/api/src/article-pipeline/content-batch.ts` — `createBatchFromDates` override-aware
  newsletter resolution.
- `apps/api/src/handlers/newsletter-generate.ts` — auto-draft gate before `ensureTopicResearch`.
- `packages/db/prisma/newsletter-prompts.ts` — new `nl_topic_expand` prompt (+ staging seed
  script, since staging doesn't run the full `seed.ts` — see standing deploy-workflow notes).
- `apps/web/src/features/dashboard/ContentPlan.tsx` — `NewsletterCell` editing UI, generalized
  idea-picker target, removal of the "Also ready to review" section.

## Risks / open details for implementation time

- **Bullet quality is the actual quality lever.** The auto-draft step's bullets need to be
  specific and Google-searchable (vague bullets → `researchOneTeaser` finds nothing → `partial`
  research status → a thinner newsletter). Worth a few iterations on the `nl_topic_expand` prompt
  wording specifically optimizing for "will a real search on this bullet surface a good source
  article," not just "is this a reasonable bullet point."
- **`secondaryTopic` exemplar window.** How many recent calendar entries `priorSecondaryTopics()`
  should sample, and whether "recent" means by date proximity to the target date or just most-
  recently-created — an implementation-time call, not architecturally significant (direct parallel
  to `priorRecipeTitles()`'s existing `take: 100`).
- **Failure handling if the auto-draft step itself fails** (LLM error, empty response): the
  existing `newsletterGenerateHandler` catch-all already marks the `Newsletter` `failed` and alerts
  — confirm that's sufficient, or whether a bad draft (e.g. empty bullets surviving validation)
  needs an explicit guard before proceeding into `ensureTopicResearch` (which would otherwise just
  quietly produce a `failed`/`partial` research status from empty-string bullets).
- **`resolveNewsletterTopicForDate` placement** — a genuinely shared helper across 3 call sites is
  the right call, but exact module location (new file vs. added to an existing `newsletter/`
  module) is an implementation-time call, not architecturally significant.
