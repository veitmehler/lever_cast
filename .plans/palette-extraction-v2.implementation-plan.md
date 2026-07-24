# Palette Extraction v2 — full-page perception + deterministic composition

Goal: the onboarding palette must be *right* (brand-true, readable) and *repeatable*
(same site → same palette, no color that fails contrast can ever ship).

Motivating case: Coast Chiropractic (BmNW test onboarding, 2026-07-24). Viewport-only
screenshot missed the deep navy/green sections; gold was chosen as accent/link but has
~2.0:1 contrast on the cream body (light blue: ~1.6:1 — also fails); slate passes 6.5:1.
Green appears mid-page as a *supporting* band color — visible only in a full-page shot.

Principle: **which hues belong to the brand is perception (AI); which shade goes in
which role is arithmetic (code).** Separate them.

## Phase A — Full-page perception
- `screenshotHomepage`: `fullPage: true`, viewport width 1440, then sharp-resize to
  width 1080, height cap ~12000px, size guard < 15MB (Gemini inline limit 20MB).
  Color regions survive downscaling; text legibility is not needed.
- Single image (full page includes the top); keep 30s nav timeout + networkidle2.

## Phase B — Inventory extraction (LLM in "boring mode")
- New prompt returns a **brand color inventory**, not final role answers:
  `brandColors: [{hex, name, prominence: main|supporting|ground, observedRoles:
  [nav_background|hero_background|band|button_fill|link_text|icon_accent|footer_background],
  confidence}]` (5–8 entries). Explicit instruction: prominence = share of page area +
  structural importance (a band color seen once mid-page = supporting — the green case).
- `temperature: 0` + Gemini `responseSchema` (structured output) — also eliminates the
  trailing-junk parse class for good.
- **Pixel evidence validation** (deterministic): downscale screenshot to ~200px wide,
  quantize/histogram → top clusters with real coverage %. Every LLM hex must sit within
  ΔE of a cluster (snap to cluster centroid) or it's dropped; coverage % comes from
  clusters, never from LLM estimates. Encodes "green is present but supporting" as data.

## Phase C — Deterministic role composition (code, no LLM) — the reliability anchor
New `apps/api/src/onboarding/palette-compose.ts`: inventory → SemanticPalette
(same downstream shape) + per-role alternates + provenance.

Rules (unit-tested):
- ground/bodyBackground = highest-coverage light color (lum > 0.8), else #ffffff.
- headerBackground = color with nav_background role, else ground.
- button = observed button_fill if its label text (white or dark) passes ≥ 4.5:1;
  else darkest `main` color.
- link/accent = candidates in order: observed link_text → button color → most
  distinctive non-ground hue. First that passes ≥ 4.5:1 vs ground *within a small
  hue-preserving darkening* (≤ ~15 L points in HSL) wins; heavy darkening is a last
  resort (a gold that must fall to mud loses to a blue that darkens gracefully —
  Coast: light blue → ~#2f6272 links).
- sectionTints = two hue-diverse observed band colors lightened to lum ≥ 0.85.
- dark logo ink = darkest color with lum < 0.4 (the rule shipped 2026-07-24 moves here).
- Supporting colors (< ~10% coverage, no structural role) are eligible for tints only,
  never link/button, unless nothing else exists.
- Every output color carries `{value, source: extracted | derived(from #x) | fallback}`.
- WCAG utils: relative luminance, contrast ratio, hue-preserving lightness walk.

## Phase D — Wiring + reveal UI
- Crawl handler: fullpage shot → clusters → LLM inventory → compose →
  `stepData.palette` (unchanged shape → zero downstream churn) + `stepData.paletteInventory`.
- Reveal card: per-role tappable alternate chips (2–3, all pre-validated); hex popover
  stays for manual override. Manual picks are authoritative — never auto-corrected —
  but show a non-blocking "low contrast" badge when they fail 4.5:1.
- No schema/migration changes (stepData only).

## Phase E — Verification
- Scratchpad bench vs ~6 real chiro sites (Coast, one dark-theme, one SiteGround,
  one monochrome/pathological): print inventory + composed palette + contrast table.
- Lock the Coast fixture (and a dark + monochrome fixture) into palette-compose unit tests.
- Re-run crawl for BmNW; expected: navy/light-blue/gold inventory (green = supporting),
  links = darkened light blue ~#2f6272, gold kept as highlight/tint where safe.

Estimate: ~1 day. Files: site-analysis.ts (screenshot, prompt, schema),
palette-compose.ts (new), onboarding-crawl.ts (wiring), cards.tsx (chips + badge),
tests. Rollout: staging + prod, then re-crawl BmNW for user review.
