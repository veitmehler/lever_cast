# Social Post Quality + Preview-First — Implementation Plan

## Overview

This plan reworks the 12-post social automation so that (a) each post type is created the
way the reference handover doc `.plans/social-media-implementation-plan.md` describes, (b)
all generated content is **previewed and approved before anything is dispatched to GHL
(Omniply)**, (c) the LLM prompts are visible/editable in the admin area, and (d) content
variety is fixed (distinct H2 sections per slot, randomized slide counts).

We keep the existing 12-slot schedule (6 feed `F1–F6` + 6 story `S1–S6`) — only the
generation quality, the preview gate, and the editability change.

**Guiding principle:** generation and dispatch become two separate phases. Nothing reaches
GHL until the user reviews it on the workflow page and clicks "Approve & Schedule".

---

## 0. Decisions Locked In

| Topic | Decision |
|---|---|
| Post count | Keep 12 slots (6 feed + 6 story). No change to `default-specs.ts` slot keys/times. |
| Preview gate | **New.** Runs generate assets + captions and persist them with `status: 'ready'`. GHL dispatch only fires on explicit approval. |
| Approval granularity | Per-run "Approve & Schedule all" **and** per-slot "Approve" / "Regenerate". |
| H2 mapping | Each H2-based slot maps to a **distinct** H2 section (round-robin when fewer sections than slots). |
| Slide count | Randomized **6–12** per run, shared by carousel (F4) and hook video (F6). |
| Prompts | Surface steps 201/202/203 in admin; add a seeded reel-bullets prompt (204) and quote-video narration prompt (205). |
| Logo | Add optional social logo override (`socialLogoUrl`) in BrandSettings; fall back to `organizationLogoUrl`. |
| Caption source | Caption source text is per-slot (the slot's resolved section), not the whole-article blob. |

---

## 1. New Generation/Dispatch Split (the core change)

### Current (problem)
`schedulePostsForSpec` generates a caption then **immediately** calls `dispatchPublish` →
GHL, then writes the `Post` row. Generation and dispatch are fused.

### Target
Two phases keyed off `SocialAutomationRun.status`:

1. **`generating` → `ready`** — generate all assets + per-platform captions, persist them as
   `Post` rows with `status: 'ready'` (no GHL call). Store rendered preview data on
   `SocialAutomationSpecResult.assetsJson` and on each `Post`.
2. **`scheduling` → `completed`** — on approval, iterate `ready` posts and call
   `dispatchPublish` → GHL, flipping each to `status: 'scheduled'` (or `failed`).

### Schema changes (`packages/db/prisma/schema.prisma`)
- `Post.status` gains `ready` (already free-text; just a new value: `ready | scheduled | published | failed | deleted`).
- `SocialAutomationRun.status` gains `ready` and `scheduling`
  (`pending | processing | ready | scheduling | completed | failed | cancelled`).
- `SocialAutomationSpecResult` gains:
  - `previewJson Json?` — normalized preview payload (per-platform caption + media list + post type + story flag).
  - `approvedAt DateTime?`
- Add migration.

### Code changes
- **`schedule-posts.ts`** → split into:
  - `buildPostsForSpec()` — generates captions + creates `Post` rows with `status: 'ready'`; **no GHL**. Returns the preview payload, persists to `previewJson`.
  - `dispatchReadyPostsForRun()` (new file `dispatch-run.ts`) — loads `ready` posts for a run and dispatches each to GHL via `dispatchPublish`, updating status.
- **`spec-processor.ts`** → `processAutomationSpec` calls `buildPostsForSpec` instead of `schedulePostsForSpec`. A spec is "completed" when assets + preview are ready (not when scheduled).
- **`run.ts`** → at the end of generation, set run `status: 'ready'` (instead of `completed`). Add `dispatchSocialAutomationRun(runId)` entry point for the approval step.
- **`finalizeRunCounts`** → split into `finalizeGenerationCounts` (ready) and `finalizeDispatchCounts` (completed/failed).

### New API + queue
- New pg-boss handler reuse: approval enqueues `SOCIAL_DISPATCH` (new queue) → `dispatchSocialAutomationRun`.
- Routes:
  - `POST /api/articles/:jobId/social-automation/:runId/approve` → enqueue dispatch for all ready slots.
  - `POST /api/social-automation/:runId/approve/:slotKey` → dispatch one slot.
  - `POST /api/social-automation/:runId/regenerate/:slotKey` → regenerate one slot's assets (reuses existing retry path but stops at `ready`).
- Mirror Next.js proxy routes under `apps/web/src/app/api/...`.

---

## 2. Preview UI (workflow page)

In `apps/web/src/app/(protected)/workflow/[jobId]/page.tsx`, when a run is `ready`:

- Render a **Social preview panel** grouped by slot (F1…S6). For each slot show:
  - Post type + scheduled time + target platforms.
  - The rendered media (image / carousel thumbnails / `<video>` preview) from `previewJson`.
  - The per-platform caption (tabs or stacked), editable in a textarea (optional Phase 2).
  - Per-slot actions: **Approve**, **Regenerate**, status badge.
- Run-level action bar: **Approve & Schedule all to Omniply** (calls the run approve route), plus a count of ready/approved/failed.
- Polling: reuse the 2 s `fetchSocialRuns` loop while `processing | scheduling`; stop at `ready` (await user) and `completed`.

The publish confirmation modal copy updates: publishing the article now generates the
preview (not auto-schedule). Scheduling to Omniply is a separate, explicit click.

---

## 3. Per-Type Generation — align to reference doc

Each post type below restates the reference-doc method, adapted to our 12 slots. Content
source per slot is fixed in `content.ts` (see §4).

### Quote card (F1, F3, F5 feed; S1, S5 story)
- LLM **quote selection** (prompt 201) on the slot's section text.
- Sharp/SVG quote-card compositor — feed 1080×1080, story 1080×1920, brand bar + logo.
- No change to compositor; only the **input text** changes (per-slot section, §4).

### Carousel (F4)
- LLM **carousel plan** (prompt 202) with **randomized slide count 6–12** (§5).
- Flux background per slide + Sharp slide compositor.
- Twitter still capped via `trimSlidesForPlatform`.

### Hook video (F6)
- Same randomized slide count as F4 (shared per-run value).
- Slide 1 → Seedance 5 s 1:1 hook clip with title overlay; slides 2…N → feed slideshow body; concat.

### Video reel (F2)
- LLM **reel bullets** (prompt 204, newly seeded — §6) from key-takeaways.
- Flux background → Seedance 5 s 1:1 → bullet overlay.

### Looped story reel (S2, reuses F2)
- Center-crop F2 → 540×960 → loop 3× (already implemented). Keep.

### Quote video (S3)
- 3 story quote cards → 1080×1920 slideshow, 4 s/slide.
- Optional ElevenLabs VO from **narration prompt (prompt 205, newly seeded — §6)** instead of naive concatenation of quote texts.

### Pitch story — carousel (S4, reuses F4 title) & hook (S6, reuses F6 title)
- 2-card story (title + "view profile" CTA) via `renderPitchStory`. Keep.

### Per-platform captions (all slots)
- **Caption source becomes the slot's section text** (not the whole-article blob). Update `generatePlatformCaption` to accept the resolved `SlotContent.text` + title instead of concatenating intro+takeaways+h2 (§4).

---

## 4. Fix H2 Section Variety

### Problem
`buildArticleContentContext` reads only `sections[0]`; every H2-based slot reuses the same
section.

### Target
- `buildArticleContentContext` returns **all** H2 sections (`h2Sections: { heading, text }[]`), not just the first.
- `resolveSlotContent(slotKey, ctx)` assigns each H2-based slot a **distinct** section index, round-robin when there are fewer sections than slots:
  - Feed H2 slots: F4 → §0, F5 → §1, F6 → §2.
  - Story H2 slots: S4 → §3, S6 → §4 (wrap with modulo if fewer sections).
  - Non-H2 slots unchanged (F1/S1 intro, F2/F3/S2/S3/S5 takeaways).
- Caption source text uses the same per-slot section (§3).

This is the single biggest content-quality fix.

---

## 5. Randomized Slide Count (6–12)

- In `run.ts`, compute `const slideCount = 6 + Math.floor(Math.random() * 7)` (6–12) **once per run**.
- Thread `slideCount` through `processAutomationSpec` → `generateSpecAssets`.
- F4 carousel uses `slideCount`; F6 hook video uses `slideCount` (1 hook + N−1 body).
- Persist the chosen `slideCount` on the run (optional field) for reproducibility on retry; on per-slot retry, read it back so F4/F6 stay consistent.

---

## 6. Admin-Editable Prompts

### Surface existing social prompts
In `apps/web/src/app/admin/prompts/page.tsx`:
- Add a phase group **"Social Media Posts"** with steps `[201, 202, 203, 204, 205]`.
- Add `STEP_LABELS` + `VISUAL_STEP_NUMBER` entries for them.

### New seeded prompts (`packages/db/prisma/seed.ts`, `SOCIAL_TEMPLATES`)
- **204 `social_reel_bullets`** — migrate the hardcoded prompt from `reel-bullets.ts` into the DB; update `extractReelBullets` to `loadPromptTemplate(204)` with the current text as fallback.
- **205 `social_quote_video_narration`** — new prompt that turns the slot section into a short, spoken-friendly narration script for the S3 quote video (replaces naive quote-text concat).

### Caption prompt (203)
- Update the variable contract: caption now receives `{{sectionText}}` (per-slot) instead of the combined blob. Keep `{{platform}}`, `{{slotKey}}`, `{{postType}}`, `{{title}}`, `{{platformTone}}`, `{{charLimit}}`.

---

## 7. Social Logo Override

- `BrandSettings` gains `socialLogoUrl String?` (migration).
- `loadSocialBrandTheme` uses `socialLogoUrl ?? organizationLogoUrl`.
- Settings page: add an upload field "Social post logo (optional)" near the brand/logo section. Falls back to the org logo when empty.

---

## 8. Safety / Watchdog Updates

- The existing social safety watchdog must treat `ready` as a **terminal-for-generation** state (do not re-enqueue ready runs as if stuck).
- Add a watchdog for `scheduling` runs stuck > 15 min → re-enqueue `SOCIAL_DISPATCH`.

---

## 9. Files Touched (index)

```
API
├── packages/db/prisma/schema.prisma           Post.status 'ready'; run status; specResult previewJson/approvedAt; BrandSettings.socialLogoUrl
├── packages/db/prisma/migrations/...           New migration
├── packages/db/prisma/seed.ts                  Add prompts 204, 205; tweak 203 vars
├── apps/api/src/social/automation/content.ts   Return all H2 sections; per-slot distinct section mapping
├── apps/api/src/social/automation/generate-spec.ts   Accept slideCount; quote-video narration prompt
├── apps/api/src/social/automation/schedule-posts.ts  Split: buildPostsForSpec (no GHL)
├── apps/api/src/social/automation/dispatch-run.ts     NEW: dispatchReadyPostsForRun / dispatchSocialAutomationRun
├── apps/api/src/social/automation/spec-processor.ts   Call buildPostsForSpec; split finalize counts
├── apps/api/src/social/automation/run.ts              slideCount per run; end at 'ready'
├── apps/api/src/social/generators/platform-caption.ts Per-slot section source; prompt 203 vars
├── apps/api/src/social/generators/reel-bullets.ts     Load prompt 204
├── apps/api/src/social/generators/quote-video-narration.ts  NEW: prompt 205
├── apps/api/src/social/brand-theme.ts          socialLogoUrl fallback
├── apps/api/src/queues/index.ts                SOCIAL_DISPATCH queue
├── apps/api/src/worker.ts                       Register dispatch handler + scheduling watchdog
├── apps/api/src/handlers/social-dispatch.ts     NEW: pg-boss handler
└── apps/api/src/routes/.../social-automation.ts approve (run + slot), regenerate routes

WEB
├── apps/web/src/app/(protected)/workflow/[jobId]/page.tsx   Preview panel + approve/regenerate; publish modal copy
├── apps/web/src/app/api/articles/[jobId]/social-automation/...  Proxy approve routes
├── apps/web/src/app/api/social-automation/[runId]/approve/...   Proxy routes
├── apps/web/src/app/admin/prompts/page.tsx       Social prompt group (201–205)
└── apps/web/src/app/(protected)/settings/page.tsx Social logo upload field
```

---

## 10. Rollout Order (recommended)

1. **Schema + migration** (run/post status, previewJson, socialLogoUrl).
2. **Generation/dispatch split** (`buildPostsForSpec`, `dispatch-run.ts`, queue + handler, routes). Article publish now produces a `ready` run.
3. **Preview UI** on the workflow page (view + approve/schedule). End-to-end preview-first works here.
4. **H2 section variety** (`content.ts`) — biggest content win.
5. **Randomized slide count** (6–12, shared F4/F6).
6. **Admin prompts** (surface 201–203, add 204/205) + caption per-slot source.
7. **Social logo override** + settings field.
8. **Watchdog updates** for `ready`/`scheduling`.

After step 3 we can iterate each post type's visual/content quality safely, since nothing
auto-publishes to Omniply.

---

## 11. Task Tracking

### Completed Tasks
- T1. Schema + migration: run/post `ready` status, `previewJson`, `approvedAt`, `socialLogoUrl`
- T2. Split generation from dispatch (`buildPostsForSpec`, `dispatch-run.ts`)
- T3. SOCIAL_DISPATCH queue + handler + watchdog (scheduling recovery; `ready` not re-enqueued)
- T4. Approve/regenerate API routes (run + slot) + Next.js proxies
- T5. Workflow preview panel (media + captions + approve/regenerate/schedule)
- T6. H2 section variety in `content.ts` (distinct section per slot)
- T7. Randomized slide count 6–12 shared by F4/F6 (`SocialAutomationRun.slideCount`)
- T8. Surface social prompts 201–205 in admin; seed 204 (reel bullets) + 205 (quote-video narration)
- T9. Per-slot caption source in `platform-caption.ts` (`sectionText` / `sectionTitle`)
- T10. `socialLogoUrl` override + settings upload (`/api/brand-settings/social-logo`)
- T11. Publish modal copy update (preview-first wording)

### Pending Tasks
- (none — plan complete)

### Backlog Tasks
- Inline caption editing in preview before scheduling
- Per-platform media variants (e.g. true 9:16 native for IG vs cropped)
- True generative video beyond hook clips
- Multi-language social variants

---

## 12. Deploy checklist

1. `prisma migrate deploy` — `20260603150000_social_preview_first` + `20260603160000_social_slide_count`
2. Restart the **worker** so `SOCIAL_DISPATCH` is registered
3. Run DB seed (or `reseed:v3`) to create prompt steps **204** and **205** if missing
4. Publish flow: article → social run ends **`ready`** → review on workflow → **Approve & schedule** → Omniply
