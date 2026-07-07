
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

---

## Phase 8 — Story posts (IMPLEMENTED 2026-07-07)

**Status: shipped.** Derived story matrix + processor added; 387 API tests pass.
Files: `weekly-matrix.ts` (`StorySlot`, `storySlotsForDay`), `story-processor.ts` (new —
`processStorySlot`, `storyOffsetMinutes`, pitch/quote/tips resolution), `generate-assets.ts`
(`generateTipsBulletStoryAsset`), `compositors/carousel.ts` (`buildBulletStoryPng`),
`media-register.ts` (`tips_story` source), `run.ts` (feed→story ordering, `priorAssets`
hand-off, S1/S2/S3 keys, per-story retry), `SocialPreviewPanel.tsx` (`tips_story` label).
Story slots derive 1:1 from feed slots; pitch stories reuse the companion feed asset via
`loadPriorAssets`; each story schedules at its feed hour + a random 2–8 min offset.

_Original discussion below._



**Constraint that shapes everything:** the Instagram/Facebook Content Publishing API
**cannot add link stickers** (or any interactive stickers) to stories. So stories can't
link out — they **promote the full post on the profile** ("see the full carousel/video
on our profile"), exactly like the existing S4 (`pitch_carousel`) / S6 (`pitch_hook`).

**Platforms:** IG + FB stories only (`STORY_PLATFORMS`). **Format:** 9:16.

**Timing:** each story posts a **randomized 2–8 minutes after** its related feed post
(a per-story random offset), so it points followers to the fresh on-profile post.

### Per-day story lineup (3/day)
| Day | Story 1 | Story 2 | Story 3 |
|---|---|---|---|
| **Tue/Thu (article)** | Promote **diagram carousel** — S4 `pitch_carousel` (9:16 pitch over the carousel) | Promote **hook video** — S6 `pitch_hook` (hook clip 9:16 + pitch) | **Quote** story |
| **Mon/Wed/Fri/Sat (newsletter)** | Promote **image carousel** — S4 `pitch_carousel` | **Tips bullet-point** story — *static* 9:16 with the newsletter **overview diagram** (cover/summary image) as the background (not a video), bullets = **Tips of the Day** | **Quote** story |

Notes:
- **Quote story every day** (Item 1): article days = a pull-quote from the article; newsletter
  days = a quote (source TBD — pick a distinct source so it doesn't duplicate the feed "tips
  quote" or the tips-bullet story, e.g. a feature-article pull-quote or fun-fact).
- **Newsletter tips-bullet story** (Item 2): new compositor — a **static image background**
  (the newsletter's overview/cover image, e.g. `summaryImageUrl`) with the Tips-of-the-Day
  bullets overlaid (9:16), *instead of* a Fal video background. Reuse the reel bullet layout.

### Implementation notes
- Stories **reuse the day's feed asset** (carousel backgrounds / hook clip), like S4↔F4 and
  S6↔F6 — so the run must generate the feed post first, then the story (dependency ordering +
  passing `priorAssets` between slots; the legacy 12-slot flow did this via `SPEC_PROCESS_ORDER`).
  The matrix run needs a feed→story ordering + asset hand-off.
- New generator: **static bullet-point story** (image bg + bullet overlay) for the newsletter tips story.
- Story slots extend the weekday matrix (or a parallel story matrix) with their own scheduled
  offset (feed time + random 2–8 min) and `isStory: true`.

### Open decisions
- Quote-story source on **newsletter** days (avoid duplicating the tips content).
- Whether the overview-diagram background is the newsletter **cover** (`summaryImageUrl`) or a
  dedicated "topics overview" visual — confirm the exact asset.
- Story CTA copy (see the Call-to-Action discussion — link-in-bio strategy).

---

## Phase 9 — Call-to-Action / link-in-bio (app-side IMPLEMENTED 2026-07-07)

**Status: app-side shipped.** NO prompt templates were modified — the existing
`{{call_to_action}}` placeholder mechanism is reused; only the *value* injected into
it changed (computed in `brand-theme.ts`).
Files: `schema.prisma` + migration `20260707200000_social_bio_cta` (`socialPrimaryGoal`,
`socialBioUrl` on BrandSettings), `brand-theme.ts` (`resolveSocialCta` — newsletter/booking
presets emit "link in our bio" guidance; null/custom = legacy verbatim, backward-compatible),
`brand-settings/route.ts` (allowed fields), `SocialPostsSection.tsx` (goal selector + bio-URL
input), `useSettingsData.ts` (state/load/save). 391 API tests pass.
Still GHL-side / deferred: the snapshot bio page, tag alignment, custom domain, bio-URL
auto-fetch (GHL v2 Funnels API), Google-Drive lead magnets, booking options.

_Original discussion below._



**The constraint that decides the architecture:** individual feed posts can't carry a
clickable link (except limited LinkedIn text), and — per the story constraint above — the
API **cannot add link stickers to stories**. So the **only reliable clickable destination on
every platform is the single profile bio link.** Every CTA, on every post and story, funnels
through that one link. The job is therefore: (1) give each business one good bio destination,
and (2) make our post/story copy drive people to it.

### Where the bio page lives — GoHighLevel (decided)
Build the bio page **inside the business's whitelabel GHL account**, not as our own hosted page.
Rationale:
- **Data already lives in GHL.** The newsletter audience is GHL contacts (tagged); booking is
  GHL calendars. A GHL bio-page signup form → **tagged contact → the same audience our newsletter
  campaigns already target** → the "social → subscribe → newsletter nurtures → books" flywheel is
  automatic. No new plumbing.
- **Domains/CNAME + SSL are native in GHL.** Per-business **custom domain** (better social branding)
  with GHL handling SSL — avoids building per-tenant domain + cert infra ourselves.
- **Consistent** with the GHL-centric stack (Omniply social + GHL email campaigns).

**Key limitation that shapes the split:** GHL **funnels/pages are NOT creatable/editable via the
public API** (only email/contacts/calendars are, which is all our current integration uses:
`/emails/public/v2/locations/{locationId}/campaigns/...`). So the page is distributed as a
**whitelabel snapshot** funnel loaded into each sub-account, and businesses tweak it in GHL.
**Our app does not own the page content.**

### App-side scope (small; independent of the snapshot — can build in parallel)
1. **"Link in bio" URL** setting on `BrandSettings` — the business's bio-page URL.
   - v1: **manual paste** (trivial, zero risk).
   - later polish: **auto-fetch via GHL v2 Funnels API** (list funnels/pages → URL + custom domain).
     Requires expanding our GHL integration beyond the email endpoints to the v2 funnels scope.
   - Caveat either way: we can't set the IG/FB **profile** bio link via API — the business pastes
     the URL into their profile manually. Auto-fetch only saves pasting into *our* settings.
2. **Purposeful CTA copy** — extend the existing `socialCallToAction` (`{{call_to_action}}`) so every
   post/story ends with a verbal "link in bio" CTA aligned to the business's **primary goal**
   (default: **newsletter signup** = lead-gen flywheel; secondary: **book appointment**). Educational
   posts get a soft "free weekly tips → link in bio"; occasional harder "ready to feel better? book → link in bio".

### GHL-side / snapshot (the business + their GHL account own this — NOT app code)
- Bio-page **funnel in the whitelabel snapshot** (Item 2 of the discussion) — the snapshot doesn't
  exist yet; **not a blocker**, the app tracks can proceed and the page slots in when ready.
- **Signup form tag = the newsletter audience tag** our campaigns already target (so signups auto-join
  the newsletter). Provide the exact tag value when building the snapshot.
- **Per-business custom domain** (CNAME + SSL handled by GHL).

### Deferred (own features, don't block the bio page)
- **Lead magnets on Google Drive** → visitor requests access → platform **auto-captures them as a GHL
  lead**. Separate upcoming feature.
- **Bookings** — give users different bio-page options (embed GHL calendar vs external link vs multiple);
  user still deciding the model. Not a blocker.

### Open decisions
- Primary-CTA default + whether it's a single per-business setting or rotates by funnel stage.
- Auto-fetch bio URL (GHL v2 Funnels API) now vs manual-paste-only for v1.
- Story CTA copy wording (ties back to Phase 8).
