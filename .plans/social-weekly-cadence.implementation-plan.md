
# Implementation Plan — Weekly Social Cadence (3/day, newsletter + article sourced)

Status: **approved-for-planning (do not implement yet)** · Author: design discussion 2026-06-26

## Goal
Replace the current "every article fires 12 posts, newsletters fire none" model with a
**fixed weekly cadence of 3 feed posts/day, Mon–Sat**, sourced by weekday:
- **Newsletter days** (Mon, Wed, Fri, Sat) → posts built from the week's newsletter.
- **Article days** (Tue, Thu) → posts built from the article.

This cuts volume on article days and adds coverage on newsletter days.

## Decisions locked (2026-06-26 discussion)
1. **Content-triggered (1:1):** an approved article/newsletter schedules *its own* day's 3 posts; the post-type set is chosen by that content's weekday.
2. **"Video post" = Hook video (F6 style)** (Seedance intro + narrated section slideshow).
3. **Feed only** for v1. Story variants come later, kept in sync with feed.
4. **Diagram shortfall → fall back to an image carousel** from that section.

## The weekday matrix (feed, 9am / 12pm / 3pm, user's social timezone)
| Day | Source | 9am | 12pm | 3pm |
|---|---|---|---|---|
| Mon | newsletter | Reel — overview | Quote — tips | Image carousel — feature article |
| Tue | article | Diagram carousel — diagram-section #1 | Reel — Key Takeaways | Hook video — a different section |
| Wed | newsletter | Image carousel — feature article | Quote — tips | Reel — overview |
| Thu | article | Hook video — diagram-section #1 | Reel — Key Takeaways | Diagram carousel — diagram-section #2 |
| Fri | newsletter | Reel — overview | Quote — tips | Image carousel — feature article |
| Sat | newsletter | Image carousel — feature article | Reel — overview | Quote — tips |

**Source selectors** (drive content resolution per slot):
- `nl_overview` — reel bullets from the newsletter's topics (`featureArticle.title` + `secondaryArticle.title` + `teasers[].title`).
- `nl_tips` — quote card from `Newsletter.quickHits.tips`.
- `nl_feature` — image carousel from `Newsletter.featureArticle` (`{title,teaser,tldr,body}`).
- `art_diagram_0` / `art_diagram_1` — diagram carousel (F4) from the 1st / 2nd article section that has a stylized diagram; **fallback** image carousel from that section.
- `art_keytakeaways` — reel bullets from the article's Key Takeaways.
- `art_hook_diagram0` — hook video from the 1st diagram section.
- `art_hook_other` — hook video from a section ≠ that day's diagram-carousel section.

`postType` per slot: `video_reel`, `quote`, `carousel` (image), `carousel`+diagram (F4), `hook_video`. (Diagram vs image carousel is the same generator with/without a `diagramBackground` — the source selector decides.)

## Current-state facts this builds on
- Social is **article-only**: `SocialAutomationRun` requires `jobId` + `sitePageId`; `runSocialAutomation` throws without them. Triggered post-enrichment by `maybeEnqueueSocialAutomationAfterEnrichment(jobId)` → `enqueueSocialAutomation` (`enqueue.ts`), `scheduledDate` = article publishing date.
- Slots come from a **flat 12-row** `DEFAULT_SOCIAL_POST_SPECS` (`default-specs.ts`) → per-user `SocialPostSpec` rows (`ensure-specs.ts`); `spec-processor.ts` iterates them, scheduling each at `spec.timeHour/Minute` via `slotToUtc`, then dispatches to GHL/Omniply.
- Content resolver is **article-only**: `buildArticleContentContext(sitePage)` + `resolveSlotContent` + `H2_SLOT_SECTION_INDEX` (`content.ts`). `ArticleContentContext` already exposes `keyTakeawaysText` and `h2Sections`.
- **Newsletter content already exists** (no new generation): `Newsletter.quickHits.tips`, `featureArticle {title,teaser,tldr,body,imageUrl}`, `secondaryArticle`, `teasers[]`. Newsletter is approved at `routes/newsletters.ts:177` (status → `scheduled`, `approvedAt`, `ghlCampaignId`).
- Diagram availability: `ArticleDiagram.stylizedPngS3Key` marks sections that have a stylized (Nano Banana) diagram; ordered by `position`.
- Generators all exist: `video_reel`, `quote`, `carousel` (±`diagramBackground` for F4), `hook_video`, plus S4/S6 (out of scope for feed-only v1).

---

## Phase 0 — Weekday matrix + run-source schema
**Matrix:** new `weekly-matrix.ts` exporting `DEFAULT_WEEKLY_SOCIAL_MATRIX: Record<Weekday, DaySlot[]>` where `DaySlot = { hour: number; postType: string; source: PostSource }` (the table above). Replaces `DEFAULT_SOCIAL_POST_SPECS` as the source of truth for *which* posts run on a given day. (Per-user editable specs deferred; v1 is code-defined.)

**Schema:** add `newsletterId String?` + relation to `SocialAutomationRun` (alongside the existing `jobId`/`sitePageId`); default `totalSpecs` 12 → 3 (set per run). Migration additive.

**Tests:** matrix shape (3 slots/day, times 9/12/15, Mon–Sat), source selectors valid.

## Phase 1 — Newsletter content context
New `newsletter-content.ts`: `buildNewsletterContentContext(newsletter)` → `{ overviewTopics: string[], tips: string[], feature: {title, body, ...} }`, plus a `resolveNewsletterSlotContent(source, ctx)` returning the shape each generator needs (reel bullets / quote text / carousel content). Parallels `content.ts`.

**Tests:** extraction from a sample Newsletter JSON (tips, overview, feature).

## Phase 2 — Article section/diagram selection
Helper `resolveArticleSocialSelectors(jobId)`: load `ArticleDiagram` rows with `stylizedPngS3Key` (ordered by position) + the H2 sections; expose:
- `diagramSection(n)` → { sectionText, diagramBuffer } for the nth diagram section, or `null`.
- `hookSection(excludeSectionIndex)` → a section ≠ the given one.
- Key Takeaways text (from `ArticleContentContext`).
Fallback rule baked in: when `diagramSection(n)` is null, the carousel slot becomes an image carousel of the nth available H2 section.

**Tests:** selection with 0 / 1 / 2+ diagram sections; "different section" logic; fallback.

## Phase 3 — Run branching + matrix-driven processor
- `runSocialAutomation`: branch on source — **article run** (jobId/sitePage, today's path) vs **newsletter run** (newsletterId → load newsletter + build newsletter context). Remove the hard "must have article" throw; require *either* source.
- `spec-processor.ts`: iterate the **weekday matrix** for `run.scheduledDate`'s weekday (not the flat `SocialPostSpec` rows). For each of the 3 slots: resolve content via the source selector, call the matching generator, schedule at the slot hour. `totalSpecs = 3`.
- `generate-spec.ts`: accept the resolved source/content (newsletter or article selector) instead of the hardcoded slotKey→section map; the F4 carousel path takes the diagram buffer from `art_diagram_*`.

**Tests:** an article run produces the Tue/Thu 3-post set; a newsletter run produces the Mon/Wed/Fri/Sat set; diagram fallback path.

## Phase 4 — Triggers (content-triggered, 1:1)
- **Article:** keep `maybeEnqueueSocialAutomationAfterEnrichment`; it now schedules the article's **weekday matrix** (Tue or Thu). If the publishing weekday isn't Tue/Thu, default to the **Tue** article matrix.
- **Newsletter (new):** `maybeEnqueueNewsletterSocialAutomation(newsletterId)` hooked at the newsletter approval transition (`routes/newsletters.ts:177`). Schedules the newsletter's **weekday matrix** (Mon/Wed/Fri/Sat); non-newsletter weekday → default **Mon** matrix. Respects `settings.socialAutomationEnabled` and a newsletter-level skip if present.
- `enqueue.ts`: generalize the in-progress/ready/completed dedupe to key on (jobId **or** newsletterId).

**Tests:** newsletter approval enqueues a 3-post run; article enrichment enqueues a 3-post run; dedupe.

## Phase 5 — Scheduling / timing policy
- Slot datetime = `run.scheduledDate` (content's day) at the slot hour, in `settings.socialTimezone`.
- **Late-approval policy:** if a slot's datetime is already in the past at processing time, **roll the whole matrix to the next occurrence of that weekday** (keeps the themed day intact) — *(default; alternative considered: post past-due slots ASAP staggered)*. Decide/confirm at implementation.
- Reuse existing `slotToUtc` + GHL/Omniply dispatch unchanged.

## Phase 6 — Cleanup, rollout
- Deprecate the flat 12-slot `DEFAULT_SOCIAL_POST_SPECS` path + `ensure-specs` seeding (or keep table dormant). Update/lock the admin social-automation spec UI if it edits the old slots.
- Cost/volume note: 3/day feed vs 12/burst — fewer Fal/LLM calls per piece.
- Rollout: staging end-to-end — approve a newsletter (verify Mon/Wed/Fri/Sat 3-post set) and enrich a Tue/Thu article (verify article 3-post set incl. diagram carousel + fallback).

---

## Risks & open details
- **Story posts (S-slots) deferred:** v1 is feed-only; the S4/S6 voiceover work stays but isn't scheduled by the new matrix until the story phase.
- **Diagram dependency:** article-day diagram slots need stylized diagrams; fallback to image carousel covers the gap (Phase 2).
- **Newsletter cardinality:** 1:1 means each newsletter fires its own day's posts. If a week has fewer newsletters than newsletter-days, those extra days simply won't post (acceptable under 1:1; revisit if you want a "latest newsletter feeds all newsletter days" model).
- **Off-cadence content:** manual articles/newsletters on unexpected weekdays use the default Tue/Mon matrices.
- **Late approval:** timing policy (Phase 5) — confirm "roll to next weekday" vs "post ASAP".
- **Admin per-user customization** of the matrix is out of scope for v1 (code-defined).

## Touch list (files)
- `packages/db/prisma/schema.prisma` (+ migration): `SocialAutomationRun.newsletterId` (+ relation), `totalSpecs` default 3.
- `apps/api/src/social/automation/weekly-matrix.ts` (new): matrix + source-selector types.
- `apps/api/src/social/automation/newsletter-content.ts` (new): newsletter context/resolvers.
- `apps/api/src/social/automation/content.ts`: article diagram-section/key-takeaways selectors.
- `apps/api/src/social/automation/run.ts`: source branching (article vs newsletter).
- `apps/api/src/social/automation/spec-processor.ts`: iterate the weekday matrix.
- `apps/api/src/social/automation/generate-spec.ts`: source-driven content + diagram buffer for F4.
- `apps/api/src/social/automation/enqueue.ts`: newsletter enqueue + dedupe by job/newsletter.
- `apps/api/src/routes/newsletters.ts`: trigger newsletter social on approval.
- `apps/api/src/social/automation/default-specs.ts` / `ensure-specs.ts`: deprecate flat 12-slot.
- Tests across matrix, newsletter context, article selectors, run branching, triggers.
