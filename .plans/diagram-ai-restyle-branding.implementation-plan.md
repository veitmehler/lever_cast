
# Implementation Plan — AI-Restyled, Branded Article Diagrams (Nano Banana)

Status: **approved-for-planning (do not implement yet)** · Author: design discussion 2026-06-22

## Goal

Replace the flat Mermaid diagrams produced during article enrichment with **stylish,
on-brand 1:1 images**, while never losing a diagram if the AI step fails:

- Take each rendered Mermaid diagram and **redesign it with Google "Nano Banana"**
  (`gemini-3.1-flash-image`, image-to-image) using an editable, business-specific style guide.
- Tailor the prompt per business: `{industry} business specializing in: {specialization}`.
- Overlay a **semi-transparent logo** (bottom-right) for branding.
- Output every diagram at a **1:1 aspect ratio**.
- Keep the Mermaid SVG as the **automatic fallback** for legibility + reliability.

## Decisions locked (from design discussion)
1. **Scope:** every diagram, **always on** (no per-business toggle).
2. **Embedding:** the stylized image **replaces** the in-article figure; the Mermaid **SVG is the fallback** when Gemini refuses/errors/returns nothing.
3. **Logo:** **bottom-right** watermark, width ≈22% of canvas, semi-transparent (~40% alpha), small inset margin. Fixed (not user-configurable in v1).
4. **Style guide UI:** extend the existing **Diagram style** settings card with a large textarea, **seeded with the default** style guide; per-business editable.
5. **Aspect ratio:** **1:1** — feed the already-square padded PNG (image-to-image preserves the input canvas), then normalize to exact 1:1 with sharp.
6. **Model/keys:** `gemini-3.1-flash-image` default; key via `getSystemApiKey('gemini')`; cost logged to `LLMUsage`.
7. **Logo source:** `BrandSettings.organizationLogoUrl`, falling back to `socialLogoUrl`.
8. **Dark variant:** dropped for stylized diagrams (a designed branded image has its own background); the single stylized 1:1 image is used everywhere.

## Current-state facts this plan builds on
- Enrichment pipeline (`apps/api/src/article-pipeline/enrichment/index.ts`), per H2 section:
  `selectDiagramType → generateMermaidDiagram (LLM) → renderMermaidToSvg → rasterizeSvg(1200) → postprocessDiagramPng (cropToContent + squarePad) → upload SVG + light/dark PNG to CDN → ArticleDiagram row + buildFigureHtml() into body`.
  After `postprocessDiagramPng` we already hold a **square light PNG** — the ideal Gemini input.
- **Nano Banana is already integrated:** `generateWithGeminiImage(apiKey, prompt, model='gemini-3.1-flash-image', aspectRatio='1:1', inputImage?)` in `packages/shared/src/imageGeneration.ts`. With `inputImage` set it does **image-to-image** and the input canvas drives output size (aspectRatio ignored).
- **Reference usage:** `apps/api/src/newsletter/cover.ts` calls `generateWithGeminiImage`, resolves the key via `getSystemApiKey('gemini')`, reads an **admin-editable style-guide config row with a `FALLBACK_STYLE_GUIDE` constant default**, and falls back to Fal.ai on error. Same default-with-override pattern we want.
- **Logo compositing via sharp** already exists: `apps/api/src/social/compositors/*` (`.composite([{ input, blend, left, top }])`), `apps/api/src/newsletter/logo-process.ts`, `apps/api/src/article-pipeline/enrichment/png-postprocess.ts` (`cropToContent`, `squarePad`, `postprocessDiagramPng`).
- `BrandSettings` already has `industry`, `specialization` (legacy free-text), `primarySpecialization` (Specialization.key), `organizationLogoUrl`, `socialLogoUrl`, and Mermaid color fields (`diagramPrimaryColor`, etc.). Settings UI: `apps/web/src/features/settings/DiagramStyleSection.tsx` + `useSettingsData.ts`.
- Diagram theming: `apps/api/src/article-pipeline/enrichment/diagram-theme.ts` (`themeFromBrand`, init directives). The Mermaid render stays as-is (it's the fallback + the Gemini input).
- Brand resolution for the pipeline: `brandSettingsForUser` (already imported into `index.ts`); specialization label resolution exists for prompt variables (reuse it).
- `ArticleDiagram` model persists per-diagram artefacts (svg/png keys, dims). `buildFigureHtml()` in `html-parser.ts` builds the `<figure>` (currently SVG-first with PNG fallback).

---

## Phase 0 — Style guide default + per-business setting

**Goal:** a default style guide every business sees and can edit.

**Data model**
- Add `BrandSettings.diagramStyleGuide String? @db.Text`. Migration (additive, nullable).

**Shared**
- New constant `DEFAULT_DIAGRAM_STYLE_GUIDE` (the discussed "Jewel-Box Data Capsules / Plasma-Current Power Flows" guide, including the **"NO GLOBAL BLACK BORDER"** exclusion and the ✓/✗ visual checks) in a shared module (e.g. `packages/shared/src/diagram-restyle.ts` or alongside the restyle service in the api package). Export so both the resolver and the settings seed use one source of truth.

**Settings (web)**
- Extend `DiagramStyleSection.tsx`: add a large textarea "AI diagram style guide" beneath the color pickers. When `diagramStyleGuide` is empty, **prefill the textarea with `DEFAULT_DIAGRAM_STYLE_GUIDE`** so the user edits a real default (don't silently store it — empty means "use default" at render time too).
- Wire `diagramStyleGuide` through `useSettingsData.ts` (state + save) and the settings PATCH route that persists `BrandSettings`.

**Tests:** PATCH persists the field; empty value falls back to the default at resolve time.

---

## Phase 1 — Diagram restyle service (prompt + Gemini call + fallback)

**Goal:** a single function that turns a square diagram PNG into a stylized branded one, or signals fallback.

**Approach** — new module `apps/api/src/article-pipeline/enrichment/diagram-restyle.ts`:
- `buildRestylePrompt({ industry, specialization, styleGuide })` → assembles the `# TASK` + `# STYLE GUIDE` text, substituting `{industry}` and `{specialization}` into:
  `"please redesign this diagram more stylish for a {industry} business specializing in: {specialization}. Design appropriately for that audience WITHOUT any branding. Keep it professional, NOT cartoonish."` + the resolved style guide.
  - `industry` ← `brand.industry` (fallback generic, e.g. "wellness").
  - `specialization` ← resolved label from `brand.primarySpecialization` (Specialization.label) → `brand.specialization` (legacy) → omit clause if neither.
  - `styleGuide` ← `brand.diagramStyleGuide?.trim() || DEFAULT_DIAGRAM_STYLE_GUIDE`.
- `restyleDiagram({ squarePng, prompt, model, geminiKey }) → { png: Buffer } | null`:
  - call `generateWithGeminiImage(geminiKey, prompt, model, '1:1', { mimeType:'image/png', data: squarePng.toString('base64') })`.
  - validate: non-empty buffer, decodable by sharp, plausible dimensions. On any throw/refusal/invalid → return `null` (caller falls back to Mermaid SVG).
  - log cost to `LLMUsage` (image step), mirroring cover.ts accounting.
- Model id: constant `RESTYLE_MODEL = 'gemini-3.1-flash-image'`; optionally read an admin config row override later (out of scope for v1, leave a TODO hook).

**Tests:** prompt interpolation (industry/specialization variants incl. missing); `restyleDiagram` returns null on API error / empty / undecodable; cost logged on success.

---

## Phase 2 — Logo watermark overlay

**Goal:** composite a semi-transparent brand logo bottom-right onto the stylized image.

**Approach** — helper `overlayLogo(basePng, logoBuffer, opts) → Buffer` (in `diagram-restyle.ts` or a small `diagram-logo.ts`):
- Resolve logo URL: `brand.organizationLogoUrl || brand.socialLogoUrl`; download once per job (cache the buffer across the job's diagrams).
- With sharp: resize logo to `round(canvas * 0.22)` width (preserve aspect), pre-multiply alpha to ~0.40 (composite the logo through a uniform-alpha mask, as in the existing compositors), then `.composite([{ input: logo, gravity: 'southeast' }])` (or computed `left/top` with an inset margin ≈ 3% of canvas).
- If no logo configured or download fails → skip overlay (return base image unchanged), log a warning. Branding is best-effort; never fail the diagram on a missing logo.

**Tests:** overlay produces same-size output; missing/failed logo returns base unchanged; alpha actually reduced (spot-check a pixel) — or at least no throw.

---

## Phase 3 — Pipeline integration (replace figure, SVG fallback)

**Goal:** wire restyle+logo into enrichment so the stylized image is the embedded figure, with SVG fallback.

**Approach** — in `enrichment/index.ts` `saveDiagramAndInsert()` (and the inline save path):
- After producing the square light PNG (`postprocessDiagramPng`), call `restyleDiagram(...)`.
  - **Success:** `overlayLogo(...)`, normalize to exact 1:1 (sharp resize/extend if off-by-pixels), upload as a new CDN object (`articles/{userId}/{jobId}/diagrams/{n}-stylized.png`), and have `buildFigureHtml()` use **this PNG** as the `<img src>`. Still upload the SVG so it's retained.
  - **Fallback (null):** keep current behavior exactly — SVG-first figure (today's output).
- **Concurrency:** sections currently process sequentially. Keep that order, but the per-diagram Gemini call adds latency × N. Add **bounded concurrency** for the restyle calls (e.g. process the Mermaid steps as today, collect square PNGs, then restyle with a small pool, p-limit ≈ 2–3) — OR accept sequential and just document the longer enrichment time. (Recommend bounded pool to cap wall-clock.)
- **Persistence:** extend `ArticleDiagram` with `stylizedPngKey String?` (+ width/height) so re-runs and the admin view can reference it. `buildFigureHtml` prefers `stylizedPngKey` when present.
- **Idempotent re-runs:** the existing run wipes `articles/{userId}/{jobId}/diagrams/` prefix + `ArticleDiagram` rows + diagram `Media`; the new `-stylized.png` objects live under the same prefix, so cleanup already covers them. Confirm `Media` rows for stylized images are created/soft-deleted the same way.

**Figure/markup**
- `buildFigureHtml()` (`html-parser.ts`): when a stylized PNG exists, emit `<img>` with its CDN URL + square dims; else current SVG-first path. WordPress publish + standalone HTML both consume this figure HTML, so no separate change needed there.

**Tests:** integration — success path embeds stylized PNG; failure path embeds SVG (snapshot the two figure HTML shapes); re-run cleanup removes stale stylized objects; `ArticleDiagram.stylizedPngKey` set on success only.

---

## Phase 4 — Cost, observability, rollout

- **Cost:** every article now incurs N Gemini-image calls. Log each to `LLMUsage`; surface total in the existing per-job cost rollup. Note in admin job view.
- **Latency:** measure enrichment step 21 duration before/after; ensure the bounded pool keeps it acceptable. The quality gate / batch monitor timeouts may need a bump if enrichment runs much longer.
- **Errors:** restyle failures log `enrichment_diagram_restyle_failed` (non-fatal) so they're visible without breaking the run; the article still ships with SVG diagrams.
- **Admin diagram view** (`apps/web/src/app/admin/articles/[jobId]/page.tsx`): show the stylized image alongside the Mermaid source for QA.
- **Rollout:** ship to staging, generate a test article end-to-end, eyeball label fidelity + branding + 1:1, check cost/latency, then promote.

---

## Risks & mitigations
- **Label fidelity:** AI may garble/drop small labels. Mitigation: prompt hard-requires "preserve every label and connection exactly"; SVG fallback always available; admin QA view. If fidelity proves poor at article width, revisit the "social/email only, keep SVG in-article" embedding option.
- **Latency/cost blow-up on diagram-heavy articles:** bounded concurrency + cost logging + timeout review. (If it's too heavy in practice, a per-business toggle or a per-article cap becomes the natural follow-up — schema already additive.)
- **Safety refusals:** Gemini may refuse some content → handled by null-fallback.
- **Aspect ratio drift:** image-to-image returns ~input canvas; we feed a square PNG and still normalize to exact 1:1 with sharp as a guarantee.
- **Missing/over-large logos:** best-effort overlay; skip on failure; resize defensively.

## Touch list (files)
- `packages/db/prisma/schema.prisma` (+ migration): `BrandSettings.diagramStyleGuide`, `ArticleDiagram.stylizedPngKey` (+ dims).
- `packages/shared/src/imageGeneration.ts` (already has `generateWithGeminiImage` — no change expected) + new `DEFAULT_DIAGRAM_STYLE_GUIDE` constant location.
- `apps/api/src/article-pipeline/enrichment/diagram-restyle.ts` (new): prompt build, Gemini call, logo overlay, fallback.
- `apps/api/src/article-pipeline/enrichment/index.ts`: integrate restyle + bounded pool + persistence.
- `apps/api/src/article-pipeline/enrichment/html-parser.ts`: `buildFigureHtml` prefers stylized PNG.
- `apps/web/src/features/settings/DiagramStyleSection.tsx` + `useSettingsData.ts` + settings PATCH route: `diagramStyleGuide` textarea seeded from default.
- `apps/web/src/app/admin/articles/[jobId]/page.tsx`: QA view (optional).
- Tests across prompt, restyle fallback, overlay, figure HTML, settings persistence.

---

## Status (2026-06-22)
Phases 0–3 implemented, committed (`ba4a13f`), deployed to staging (both migrations applied, healthy).

**Staging aspect-ratio test** (4 real diagrams, source ratios 0.27 / 1.12 / 2.29 / 5.04):
- 1:1 output **confirmed** — Gemini returns 1024×1024 for every input ratio; `ensureSquare` is a no-op guard.
- Smart reflow: wide chains re-composed into radial/grid layouts that fill the square; the jewel-box/plasma style + bottom-right watermark render correctly.
- Near-square diagrams look excellent + legible; very dense (ultra-wide/tall, many nodes) shrink text at the 1024px output cap.
- Watermark used the **raw** `organizationLogoUrl` (full-color, with baked-in text) → too heavy on the dark background.

---

## Phase 5 — Light/dark watermark + reflow prompt (refinements)

**Decisions (from 2026-06-22 discussion):**
- Watermark uses **light/dark transparent logo variants** (same ones `processLogo` makes for newsletters), selected by a new per-business toggle; default **light** (the default style guide is a dark background).
- When a business has no newsletter variants, **auto-generate** light/dark from `organizationLogoUrl` via `processLogo`, cached so it runs at most once per logo change.
- Prompt explicitly **permits spatial re-layout to fill the square** while preserving the exact informational flow.

**Logo resolution (per job, in `buildDiagramRestyleConfig`):**
1. Newsletter variants: `nlLogoLightUrl` / `nlLogoDarkUrl`.
2. Else auto-generate from `organizationLogoUrl` via `processLogo(ownerUserId, organizationLogoUrl)` → cache into new `diagramLogoLightUrl` / `diagramLogoDarkUrl` (+ `diagramLogoSourceUrl` to detect staleness; regenerate only when the org logo changes).
3. Else raw `organizationLogoUrl` → `socialLogoUrl` → no watermark.
Variant chosen by `BrandSettings.diagramLogoVariant` (`'light' | 'dark'`, default `light`).

**Data model:** `BrandSettings.diagramLogoVariant`, `diagramLogoLightUrl`, `diagramLogoDarkUrl`, `diagramLogoSourceUrl` (+ migration).

**Overlay:** default opacity 0.40 → **0.30** (clean transparent marks read better subtle).

**Prompt:**
- Fixed task line (`buildRestylePrompt`, always applies): *"You MAY rearrange the spatial layout — reflow long horizontal/vertical chains into a balanced composition that fills the entire square canvas edge-to-edge. Preserve the exact informational flow: every node, label, connection, arrow direction, and the hierarchy/sequence stays identical and clearly readable. Never add, remove, rename, or merge anything; reproduce all text verbatim."*
- Soften `DEFAULT_DIAGRAM_STYLE_GUIDE`'s "Layout stays faithful to the source diagram's structure" → "preserve the informational structure; you may re-arrange spatial placement to best fill the square."

**Settings UI:** light/dark toggle in the Diagram style card (`useSettingsData` + `DiagramStyleSection` + brand-settings route).

**Deferred (optional, not in this pass):** density/extreme-ratio threshold that keeps the SVG when a diagram is too dense to restyle legibly — the reflow-to-fill-square change may largely address this; revisit after seeing real output. Admin QA view (Phase 4) also still open.
