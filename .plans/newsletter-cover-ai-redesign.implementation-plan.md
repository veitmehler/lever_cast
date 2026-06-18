# Newsletter Cover Redesign — AI-generated cover + HTML masthead

**Status:** proposed (awaiting approval)
**Author:** Claude / Veit
**Date:** 2026-06-18

## Goal

Replace the current cover pipeline (6 text-free Fal icons composited into a grid
via headless Chrome) with a **single AI-generated cover image** from Google's
`gemini-3.1-flash-image` (Nano Banana flash), and move the title/date out of the
image into an **HTML masthead band** rendered like the email's section headers.

Validated by spike (see `/tmp/spike3_cover_*.png`): one prompt of
instructions + section content + short-label rule + the brand style guide
produces a cohesive, on-brand, correctly-spelled cover in one call
(~$0.048/image est., ~8–11s), with run-to-run consistency.

## Decisions (locked)

| Topic | Decision |
|---|---|
| Model | `gemini-3.1-flash-image` (flash). Fall back to the existing icon-composite on failure/refusal. |
| Output | 1:1, full-canvas art (no reserved title band). Native ~1024px. |
| Labels | Model writes a few short labels (1–3 words), one per icon, no duplicates. |
| Style guide | Admin-editable config row, like `nl_summary_icon_style`. |
| Title/date | **HTML band above the cover `<img>`**, not composited into the image. |
| Band text | Line 1 `In Today's Edition`, line 2 the date. |
| Date source | `topic.date` (= publishing date; `computeSendAt` derives the send time from it). Format in **UTC** (no off-by-one). |
| Band color | Featured-article navy = `theme.sections[2]` (end-user configurable). |
| Sizing | Controlled in render via `<img>` width; serve ~1024 for retina. |

## Changes by file

### 1. `packages/shared/src/imageGeneration.ts` — new Gemini image path
Add `generateWithGeminiImage(apiKey, prompt, model, aspectRatio='1:1'): Promise<Buffer>`:
- POST `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
- body: `{ contents:[{parts:[{text:prompt}]}], generationConfig:{ responseModalities:["IMAGE"], imageConfig:{ aspectRatio } } }`
- extract `candidates[0].content.parts[].inlineData.data` (base64) → Buffer; throw if no image part (lets caller fall back).
- Mirror the error/typing style of `generateWithFalAI`.

### 2. `packages/db/prisma/newsletter-prompts.ts` — style-guide config row
Add `nl_summary_style_guide` (PromptTemplate): `defaultProvider:'gemini'`,
`defaultModel:'gemini-3.1-flash-image'`, `userPrompt` = the approved style guide
(glowing-blueprint, duo-tone icy-white + copper, line-only, navy bg, glow).
Seed via existing upsert; also insert the live row in staging/prod DB
(seed uses `update:{}`, won't clobber).

### 3. `apps/api/src/newsletter/cover.ts` — rewrite `generateCoverImage`
- Build the prompt: visual-summary instructions + per-section content (from
  `items`/research) + "a few short labels, 1–3 words, one per icon, no
  duplicates, no sentences" + style guide (from the `nl_summary_style_guide`
  row, falling back to a constant).
- Call `generateWithGeminiImage` (model from the row's `defaultModel`).
- Upload art with a **unique key** (`vtoken()`), return `summaryImageUrl`.
- **Fallback:** on any failure/refusal, call the existing icon-composite path
  (keep `buildCoverHtml` + icon loop + `renderCover`) so we never regress.
- Drop the title overlay / reserved-band logic. `summaryTitle` no longer needed
  (title is HTML now) — stop writing it, or keep nullable for back-compat.
- Record usage/cost via `params.usage` as today.

### 4. `apps/api/src/newsletter/generate.ts` — call-site
- `buildCover` no longer needs `editionDate` (date moves to render). Keep passing
  `items`; drop `editionDate`/title handling as needed.

### 5. `apps/api/src/newsletter/render.ts` — masthead band
- Add `editionDate: Date | null` to `RenderInput`; populate from `nl.topic.date`
  in `renderAndSave`.
- In the cover block (~line 264): emit a **navy masthead band** above the
  `<img>` using `theme.sections[2]` (navy), white text, two lines
  (`In Today's Edition` / `formatUTC(editionDate)`), styled like `band()`/section
  headers. Date formatted with `toLocaleDateString('en-US', { timeZone:'UTC', month:'long', day:'numeric', year:'numeric' })`.
- Cover `<img>` now square — confirm display width (see open items).

### 6. Tests
- Unit: `generateWithGeminiImage` parses inlineData; throws on no-image.
- Unit: render emits the masthead band with the UTC-formatted date above the cover.
- Unit: cover falls back to composite when the Gemini path throws.
- Update existing cover/render tests for the new markup.

## Open items to confirm
1. **Cover display width** — square cover full body width (680) or a centered
   ~512 square under the masthead? (Affects render layout + perceived size.)
2. **Pricing** — confirm flash-image real price (estimate assumed $30/1M out tok).
3. **Seed** — pin for a stable recurring look, or embrace per-edition variety?
   (Default: no seed.)

## Rollout
1. Merge to `staging` → staging API deploy.
2. Insert `nl_summary_style_guide` live row in `socioply_staging`.
3. Regenerate edition 1 (existing trigger), verify cover + masthead end-to-end.
4. Carry to prod when the newsletter pipeline ships there.

## Out of scope / follow-ups
- S3 lifecycle rule for orphaned `newsletter/` assets (pre-existing follow-up).
- Optional: promote to `gemini-3-pro-image` if the quality bar rises.
- Optional: booklet-mockup framing (separate explicit instruction) if wanted.
