# Newsletter Offers — Implementation Plan

**Status:** proposed (awaiting approval)
**Date:** 2026-06-18

## Goal

Let an end-user (e.g. a chiropractic clinic) include promotional **offers** in
their newsletter — configured **once** and **auto-included** by schedule, never
edited per edition.

- **Evergreen offer** (no date window) → primary, **after the featured article**.
- **Seasonal offer** (date window) → **after "Tips Of The Day,"** auto-appears /
  auto-expires by date.

Each offer = headline + pitch + CTA button + optional **16:9 banner image** (clean
visual; copy stays as selectable HTML). Optional AI helpers: generate the banner
image (Gemini 3.1 Flash Image) and draft the copy (Gemini 3.1 Flash text).

## Data model

New table **`NewsletterOffer`**:
`id, userId, title, body, ctaLabel, ctaUrl, imageUrl?, startDate?, endDate?, enabled (default true), sortOrder (default 0), createdAt, updatedAt` + index on `userId`.

- **Evergreen** = `startDate` & `endDate` both null.
- **Seasonal** = has a date window (inclusive).

## Selection (render time, by the edition's `topic.date` in UTC)

- **Evergreen slot:** first `enabled` offer with no dates, ordered by `sortOrder`.
- **Seasonal slot:** first `enabled` offer whose `[startDate, endDate]` contains
  `topic.date` (UTC comparison, matching the scheduling fix), ordered by `sortOrder`.
- Each slot ≤ 1 offer; either may be empty → no card.

## Renderer (`render.ts`)

- New `offerCard(offer, theme)`: accent band (e.g. "Special Offer") + optional
  **16:9 image** (full width above the text) + headline + pitch (`para`) + CTA
  button (reuse the existing button helper) + spacer.
- Placement in the existing order:
  - **seasonal** card right after the **Tips Of The Day** section.
  - **evergreen** card right after the **feature article** ("Article Of The Day").
- `RenderInput` gains `evergreenOffer?` / `seasonalOffer?`; `renderAndSave`
  selects them from the DB (by `userId` + `topic.date`) and passes them in.

## API (Fastify, `requireAuth`, per-user)

- `GET/POST/PUT/DELETE /newsletters/offers[/:id]` — CRUD.
- `POST /newsletters/offers/:id/generate-image` — Gemini 3.1 Flash Image,
  text→**16:9** banner from the offer copy + industry/brand; "clean high-quality
  advertising visual, no text, attention-grabbing." Store to
  `newsletter/offers/<userId>/<offerId>-<vtoken>.jpg`, GC old versions, save `imageUrl`.
- `POST /newsletters/offers/draft` — Gemini 3.1 Flash (text); a one-line brief →
  `{ title, body, ctaLabel }` (editable). Backed by an admin-editable prompt row
  `nl_offer_draft` (mirrors the other `nl_*` prompts).
- Manual image upload reuses the slot-style logo route pattern (offer image slot).
- Web proxy routes under `app/api/newsletters/offers/*`.

(Confirm `gemini-3.1-flash` text model id at build; fall back to the Gemini flash
text model already used by the pipeline.)

## Settings UI — "Offers" manager

A dedicated **Offers** page/section in the newsletter area:
- List of offers: headline, schedule badge ("Always" / date range), enabled toggle, edit, delete, drag/sort.
- Add/Edit form:
  - Headline, pitch (textarea), button label, button URL.
  - **Schedule:** "Always show" vs "Show between [start]–[end]" (two date pickers).
  - Enabled toggle, priority.
  - **Image:** 16:9 preview + **"Generate ad image (AI)"** + Upload + Remove.
  - **"Draft with AI"**: brief input → fills headline/pitch/button label.

## Cost / perf

AI image is generated **on demand in the editor** (~$0.05) and **reused across all
editions** — not per send. Copy draft is a cheap text call. No recurring cost.

## Tests

- Selection: evergreen chosen; seasonal included only when `topic.date` ∈ window; disabled skipped; UTC boundary.
- Render: seasonal card after Tips, evergreen after feature; `offerCard` emits image + CTA + link; no card when slots empty.
- Endpoints: CRUD ownership; image-gen stores 16:9 + GC; draft returns fields (mock Gemini).

## Rollout

1. Migration + merge to `staging` → deploy.
2. Create a sample evergreen + a seasonal offer for the test user; regenerate an edition; verify both cards land in the right slots and the AI image/draft work.

## Out of scope / later

- Per-edition toggle/override during review.
- Promo codes / countdown timers.
- Full text-baked banner image (we chose clean visual + HTML copy).
