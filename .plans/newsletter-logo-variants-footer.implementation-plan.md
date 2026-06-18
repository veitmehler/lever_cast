# Newsletter Logo Variants + Footer Polish — Implementation Plan

**Status:** proposed (awaiting approval)
**Date:** 2026-06-18
**Builds on:** PR #91 (footer: logo/contact/social/disclaimer/unsubscribe)

## Goal

Let an end-user upload **one** logo and automatically get a **light (white)** and
**dark (navy)** transparent version, assign each to the header/footer, and resize
them — plus finish the footer (stacked address, editable disclaimer).

Validated by spike: Nano Banana reproduces the exact logo with high fidelity, but
the editing API only returns **JPEG (no alpha)**. So we take alpha **from
luminance** deterministically — one generation yields clean transparent white AND
navy (see `/tmp/prev_white_on_navy.png`, `/tmp/prev_navy_on_white.png`).

## Engine (decided)

Per-logo processing = **1 Nano Banana call + deterministic recolor**:
1. Image-to-image: "recreate this EXACT logo in pure white on solid black (#000)" → JPEG.
2. **Alpha = luminance** (white→opaque, black→transparent) with a black-point (~12) to kill JPEG noise.
3. Recolor the alpha master to **white** and **navy** (any color is just a fill).
4. **Trim** to the alpha bounding box.
5. Upload both PNGs to S3.

Cost ~$0.04/logo, ~10s. Recolor/trim are free + deterministic (clean anti-aliased edges, real transparency). Server-side image ops via **sharp** (confirm dep; add if missing).

## Data model (BrandSettings migration)

Logo assets (set in Settings):
- `nlLogoSourceUrl` — the original upload (kept so "re-process" needs no re-upload)
- `nlLogoLightUrl` — white-on-transparent (for dark backgrounds)
- `nlLogoDarkUrl` — navy-on-transparent (for light backgrounds)

Placement (set on the template editor):
- `nlHeaderLogoVariant` — `'auto' | 'light' | 'dark'` (default `auto`)
- `nlFooterLogoVariant` — `'auto' | 'light' | 'dark'` (default `auto`)
- `nlLogoWidth` — header width (exists; slider-backed)
- `nlFooterLogoWidth` — footer width (new; slider-backed)

Footer text:
- `nlFooterDisclaimer` — editable; renderer falls back to the current default

Migration keeps `nlLogoUrl` as a read fallback (existing logos keep working until re-processed). `organizationLogoUrl` untouched (schema/social use).

## Components

### 1. Logo processing module (`apps/api/src/newsletter/logo-process.ts`)
`processLogo(sourceUrl, { dark = '#011328' }): Promise<{ lightUrl; darkUrl }>`
- `generateWithGeminiImage` image-to-image (extend the shared fn to accept an input image buffer + prompt) → white-on-black JPEG.
- sharp: greyscale → black-point curve → alpha; `joinChannel` onto solid white / solid navy; `.trim()`; PNG.
- Upload `newsletter/logos/<userId>-light-<vtoken>.png` / `-dark-…` (unique keys; GC old via `deleteOldVersions`).

### 2. Shared image layer (`packages/shared/src/imageGeneration.ts`)
Extend `generateWithGeminiImage` with an optional `inputImage?: { mimeType; data }` so it can do image-to-image (adds an `inline_data` part). Returns the JPEG buffer.

### 3. Logo upload endpoint (`apps/web/src/app/api/newsletters/logo/route.ts`)
Add a `slot` form field:
- `source` (default): store as `nlLogoSourceUrl`, run `processLogo`, set light/dark. Returns all three URLs.
- `light` | `dark`: **manual override** — upload straight into that variant (skip processing).
- New action `?reprocess=1`: re-run `processLogo` on the stored source.
- DELETE supports a `slot` to clear source/light/dark.
- Processing runs synchronously (UI shows a spinner); ~10s is acceptable.

### 4. Settings UI (Brand Profile / newsletter section)
- Upload control (source logo).
- Preview light + dark (each shown on a contrasting swatch + checkerboard).
- **Re-process** button; per-variant **Replace** (manual override) + Remove.

### 5. Template editor (`newsletter/template/page.tsx`)
- Header logo: variant select (Auto/Light/Dark) + width slider (`nlLogoWidth`).
- Footer logo: variant select + width slider (`nlFooterLogoWidth`).
- Footer disclaimer textarea (`nlFooterDisclaimer`).
- Persist via the existing template PATCH (extend its allowed field list).

### 6. Renderer (`render.ts`)
- `pickLogo(variant, bgColor)`: if `auto`, choose by **bg luminance** (dark bg→light logo, light bg→dark logo); else explicit. Fall back `nlLogoLightUrl/nlLogoDarkUrl → nlLogoUrl → organizationLogoUrl`.
- Header uses header bg + `nlLogoWidth`; footer uses footer bg + `nlFooterLogoWidth`.
- **Address stacked** into 3 lines from structured fields (fallback to `organizationAddress`):
  - L1 `addressLine1` (+ `addressLine2`)
  - L2 `{addressLocality}, {addressRegion} {postalCode}, {addressCountryName}`
  - L3 phone
- Disclaimer from `nlFooterDisclaimer` (fallback default).
- `RenderBrand` + `toRenderBrand`: add the new logo fields, variant/width fields, structured address sub-fields, `nlFooterDisclaimer`.

## Auto-variant luminance rule
`luminance = 0.2126R + 0.7152G + 0.0722B` (0–255). `< 140` → dark bg → **light** logo; else → **dark** logo. (Header default pink → dark logo; footer navy → light logo.)

## Tests
- `processLogo`: luminance→alpha→recolor→trim produces RGBA, trimmed, correct fills (mock the Gemini call).
- render: header/footer pick correct variant by bg (auto), explicit override honored, width applied, address stacked, disclaimer from field + fallback.
- logo route: slot routing (source/light/dark), reprocess.

## Rollout
1. Migration + merge to `staging` → deploy.
2. Process the test user's logo; verify header (light on navy? header is pink→dark) / footer (light on navy) render correctly; check stacked address + disclaimer.
3. Regenerate an edition to confirm end-to-end.

## Out of scope / notes
- Generalizing light/dark to non-newsletter surfaces (kept newsletter-scoped for now).
- If a logo recolors poorly to monochrome, the **manual override** upload is the escape hatch.
- Social links + structured address already captured in Brand Profile — no new input UI needed there.
