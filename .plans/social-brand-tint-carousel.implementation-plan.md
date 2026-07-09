# Brand-Tinted Carousels (Wed/Sat) — Implementation Plan

Status: **implemented** (2026-07-10). All 4 phases done; 457/457 tests passing (11 new
contrast-math tests); visual preview artifact approved. Known limitation: the dashboard's
single-slide regenerate UI doesn't pass `designVariant` yet (the API supports it), so
regenerating one slide of a tinted carousel from the UI produces a classic slide.

## Goal

Add feed variety: of the 6 weekly `nl_feature`/article carousels, the **Wed and Sat**
newsletter carousels (P1, 9am) get a distinct "brand tint" design — the whole slide washed
in the client's brand color at 0.85 opacity, slide text centered vertically + horizontally,
and the client's light-or-dark logo bottom-right. Mon/Fri (and the Tue/Thu article
carousels) keep the classic design → **4 classic + 2 tinted carousels per week**.

## Decisions locked (2026-07-10 discussion)

1. **Trigger is the matrix slot, not the content source** — Wed(3) + Sat(6) carousel slots
   only. Mon/Fri also run `nl_feature` carousels and must stay classic.
2. **All slides tinted** — hook, content, and CTA slides all get the full-frame brand
   overlay + centered text.
3. **Logo on every slide, bottom-right**, with a "stylish" margin to bottom and right.
4. **Keep per-slide AI background images** (0.15 of the image shows through as texture;
   the ~$0.55/carousel savings from a shared background was offered and declined).
5. **Stories inherit automatically** — Wed/Sat's `pitch_carousel` story reuses the feed
   asset, so the tinted look cascades to stories with zero extra work (the pitch
   compositor adds its own dark scrim on top; acceptable).
6. **Text color is measured, not configured**: WCAG relative-luminance contrast decides
   white vs. near-black text against the brand color at 0.85 opacity, accounting for the
   unknown image underneath (worst-case blend). The logo variant (light/dark) follows the
   text decision.

## Current-state facts this builds on

- **Slides are already sharp-composited** (`apps/api/src/social/compositors/carousel.ts`):
  Fal background (`flux/schnell`, admin-overridable via Step 218) + SVG overlay per slide
  type (`buildHookSlideOverlaySvg` / `buildContentSlideOverlaySvg` / `buildCtaSlideOverlaySvg`)
  → `renderCarouselSlide()`. A new design = new overlay builders + a flag. No prompt or
  image-model changes.
- **`CarouselSlideInput` already has a variant mechanism** — `diagramMode` /
  `diagramVariant` for F4 diagram carousels. The tint variant follows the same pattern.
- **`logoBuffer` is already loaded and passed into `CarouselSlideInput`** by
  `generate-assets.ts` — but `renderCarouselSlide` never composites it today (only the
  org-name text watermark is rendered). The tint variant will actually use it.
- **Brand color already exists**: `SocialBrandTheme.primaryColor` via `themeFromBrand()`
  (from `BrandSettings.diagramPrimaryColor`, with a default when unset). No schema change.
- **Light/dark logo variants already exist**: `nlLogoLightUrl` / `nlLogoDarkUrl`
  (white/navy transparent, auto-generated from one upload), with cached
  `diagramLogoLightUrl/DarkUrl` equivalents. Fallback chain for tinted slides:
  `nlLogo{Light|Dark}Url` → `diagramLogo{Light|Dark}Url` → raw
  `socialLogoUrl`/`organizationLogoUrl` (best effort) → none (skip logo).
- **A WCAG luminance picker already exists** (`pickContrastingText` in
  `article-pipeline/enrichment/diagram-theme.ts`, private) — the new helper extends the
  same math to the α-blend case.
- **The weekly matrix is the source of truth for what runs when**
  (`social/automation/weekly-matrix.ts`, `DEFAULT_WEEKLY_SOCIAL_MATRIX`): Wed = weekday 3
  slot `{hour 9, carousel, nl_feature}`, Sat = weekday 6 slot `{hour 9, carousel,
  nl_feature}`. The matrix processor (`matrix-processor.ts` case `'carousel'`) calls
  `generateCarouselAssets()`.

## Phase 1 — Contrast scheme helper (pure, tested)

New `apps/api/src/social/compositors/brand-tint.ts`:

```ts
export interface TintScheme {
  overlayColor: string      // normalized brand hex
  overlayOpacity: number    // 0.85, bumped to 0.92 when neither text color clears AA
  textColor: '#FFFFFF' | '#111111'
  logoVariant: 'light' | 'dark'   // light = white logo (dark/mid backgrounds)
}

export function tintScheme(brandHex: string, alpha = 0.85): TintScheme
```

Math: with overlay opacity α over an unknown image, the effective backdrop luminance is
bounded: `L_eff ∈ [α·L(brand), α·L(brand) + (1−α)]` (image pixel black → white). For each
candidate text color, compute the WCAG contrast ratio against its *worst-case* end of that
range; pick the candidate with the higher minimum. If the winner still fails AA (4.5:1),
raise α to 0.92 (shrinks the image's influence, pulls contrast toward the pure brand
color) and recompute. `logoVariant` = `'light'` when text is white, `'dark'` when black.
Reuses/extracts the linearization from `diagram-theme.ts`'s `pickContrastingText` (export
a shared `relativeLuminance(hex)` rather than duplicating).

Tests: brand navy (#011328 → white text/light logo), white/near-white (→ dark), mid-teal
and orange (the AA-failure zone → verify the α bump + a deterministic winner), 3-digit hex,
invalid hex → fallback default, α bounds.

## Phase 2 — Matrix flag + threading

- `weekly-matrix.ts`: `DaySlot` gains optional `designVariant?: 'brand_tint'`; set it on
  the Wed(3) and Sat(6) carousel slots only. The matrix stays the single source of truth —
  no weekday re-derivation downstream.
- `matrix-processor.ts` (case `'carousel'`, and NOT the hook-video fallback path — a Tue/Thu
  fallback carousel stays classic): pass `designVariant` through to
  `generateCarouselAssets()`.
- `generate-assets.ts` `generateCarouselAssets()`: accept `designVariant`, resolve the
  `TintScheme` from `brand.primaryColor`, load the variant logo (new
  `loadTintLogo(brand, scheme.logoVariant)` in `brand-theme.ts` implementing the fallback
  chain above), and pass both into each `CarouselSlideInput`.

## Phase 3 — Tinted slide rendering

- `CarouselSlideInput` gains `tint?: TintScheme` (mutually exclusive with `diagramMode`).
- `renderCarouselSlide()`: when `tint` is set, use one new overlay builder for all three
  slide types (`buildTintedSlideOverlaySvg`):
  - Full-frame `<rect>` in `tint.overlayColor` at `tint.overlayOpacity`.
  - Slide text (headline: HelveticaNeue Medium; body: Light, same wrap utilities) centered
    **as one block** both vertically and horizontally, in `tint.textColor`. Hook slides
    have headline only; content slides headline+body; CTA slides headline+body — same
    centered treatment everywhere per Decision 2.
  - No org-name text watermark on tinted slides — the logo replaces it.
- Logo compositing (in `renderCarouselSlide`, sharp layer, not SVG — it's a PNG buffer):
  bottom-right, width ≈ 140px (preserve aspect), margin 48px right + 48px bottom (matches
  the F4 arrow margin the codebase already uses for corner elements).
- The auto-fit guard: if the centered text block would collide with the logo zone
  (bottom 240px right half), shrink body font (reuse the auto-fit pattern from
  `buildPitchSlidePng`).

## Phase 4 — Preview + verify

- Local render script (scratchpad, not committed): render sample tinted slides for 4-5
  brand colors (navy, white-ish, mid-teal, orange, brand default) → publish as an
  Artifact for visual sign-off before deploy.
- Typecheck, tests (Phase 1 suite + existing 446), deploy to staging (in-flight check
  first), then regenerate one Wed newsletter social run on staging and eyeball the real
  carousel + its pitch story.

## Touch list (files)

- `apps/api/src/social/compositors/brand-tint.ts` — new, `tintScheme()` + tests
  (`__tests__/brand-tint.test.ts`).
- `apps/api/src/article-pipeline/enrichment/diagram-theme.ts` — export shared
  `relativeLuminance` (no behavior change).
- `apps/api/src/social/automation/weekly-matrix.ts` — `DaySlot.designVariant` on Wed/Sat
  carousel slots.
- `apps/api/src/social/automation/matrix-processor.ts` — thread the flag.
- `apps/api/src/social/generate-assets.ts` — resolve scheme + variant logo, pass through.
- `apps/api/src/social/brand-theme.ts` — `loadTintLogo()` fallback chain.
- `apps/api/src/social/compositors/carousel.ts` — `tint` input, tinted overlay builder,
  logo compositing.

## Risks / notes

- **Mid-tone brand colors** can't reach AA against both ends of the blend range even at
  0.92 — the helper still returns the max-contrast choice deterministically; flagged in
  tests, not a blocker (real-world mid-tone failures are marginal, not unreadable).
- **Logo variants missing**: clients who never uploaded a logo through the newsletter flow
  have no light/dark variants; the raw logo fallback may clash with the tint (e.g. navy
  logo on navy tint). Acceptable best-effort; the existing variant auto-generation
  (one upload → white + navy transparent) is the real fix and already exists upstream.
- **Pitch story double-scrim**: the story reuses the tinted slide then adds its own dark
  0.72 overlay — the result is darker than the feed version by design of the story
  compositor. Confirmed acceptable (Decision 5); revisit only if it looks muddy in
  Phase 4's visual check.
- `slideCount` (6–12 slides) is unchanged — tint is orthogonal to slide count.
