# Newsletter Template Redesign — Implementation Plan

**Status: IMPLEMENTED** (audited 2026-07-09) — redesigned edition + genericized content model + composited cover all live (render.ts, cover.ts).
**Supersedes:** the §8 renderer + parts of §4/§7 of `newsletter-magazine-pipeline.implementation-plan.md` (Phases 1a–1d shipped to the `staging` branch).
**Goal:** restructure the newsletter edition (order + visual hierarchy), genericize the CSV/content model away from family-care-specific columns, and add a composited "cover" summary image at the top.

---

## 1. Final content model (genericized)

One edition contains: **1 feature article + 3 curated teasers + 1 specialization (secondary) article + 1–2 recipes + a video**, plus auto-generated **tips, facts, trivia Q/A, joke, a 3-word title, and a cover summary image**.

"Family care" is just one example specialization — the secondary article + recipes auto-focus on the customer's `{{specialization}}`, so a sports/pediatric/etc. clinic needs no schema change.

### CSV columns (final)
**Required:** `date`, `topic`, `bullet1`, `bullet2`, `bullet3`
**Optional:** `secondary_article`, `recipe`, `recipe_2`, `video_url`

| Column | Drives |
|---|---|
| `topic` | Feature article (inline article chain) |
| `bullet1/2/3` | 3 curated teasers — web-search each angle, summarize the best source article |
| `secondary_article` | 2nd written article, specialization-focused (article chain) |
| `recipe` | Recipe #1 (recipe chain) |
| `recipe_2` | Recipe #2 (recipe chain) |
| `video_url` | Optional explicit video; else Oxylabs YouTube search |

**Dropped:** `secondary_topic`, `kids_snack`, `tech_free_activity` (consolidated: `secondary_topic`+`tech_free_activity` → one `secondary_article`; `kids_snack` → `recipe_2`).

### Section order (final)
1. Header (logo, header-bg band)
2. Trivia **question**
3. **Cover summary image** (new)
4. Video (thumbnail → YouTube)
5. "Did you know?" — 4 facts
6. **Teaser 1** (heading = real source article title)
7. Tips of the day — 4 tips
8. **Teaser 2**
9. Joke of the day
10. **Feature article** (title, TL;DR, body)
11. **Teaser 3**
12. **Secondary article** (specialization)
13. **Recipe**, **Recipe 2** (image, ingredients, instructions)
14. Trivia **answer** (read-to-the-end payoff)
15. Footer (logo, address, unsubscribe)

Sections with no data drop out.

---

## 2. Visual hierarchy

- Full-width **colored section bands** with white, bold, large display headings, separating white content blocks (mirrors the reference). Bands **cycle through 4 content colors**.
- **6 color pickers** in the Template editor: header bg, footer bg, content colors 1–4.
  - Defaults (from the example template): content `#fa00bb` / `#00bbf9` / `#00142b` / `#00dd81`; header `#fa00bb`; footer `#011328`.
- **Display font caveat:** email clients strip `@font-face`/`@import`, so the reference's script font won't load. Use a bold, large, web-safe display treatment (no dependence on a custom font). Body uses existing `nlFontFamily` / `nlFontColor` / weights / `nlLinkColor`.
- **Logo:** header band only; end-user uploads + sets width in the Template editor.

---

## 3. Cover summary image

A composited "briefing cover" (like the approved example), built **server-side** (headless Chrome → PNG → S3) — **not** AI text-to-image (diffusion can't render legible headlines).

- **Title bar:** an LLM writes a **catchy 3-word title** (`nl_summary_title`), then we append the **edition date** (e.g. "Spine & Shine · Jul 1, 2026"). No logo on the cover.
- **Grid: cap at 6 tiles.** Priority: feature → teaser 1 → teaser 2 → teaser 3 → secondary article → recipe (recipe_2 spills to body only).
- **Each tile** = a **text-free Fal icon** + the **real headline** composited on top (gradient scrim for legibility).
  - Icons: ~6 Fal calls/edition. Prompt = derived from the headline/topic + a **fixed style suffix** (stored editable, e.g. `nl_summary_icon_style`) + a pinned seed, so the 6 icons read as a consistent set. No per-tile LLM call (cost).
- Stored on `Newsletter.summaryImageUrl` (+ `summaryTitle`). Rendered as an `<img>` after the trivia question. `renderAndSave` does **not** rebuild it (keeps re-render free); it's built during generation and on an explicit regenerate.

---

## 4. Schema changes (one migration; newsletter tables are not on prod yet → clean)

- **NewsletterTopic:** drop `kidsSnack`, `techFreeActivity`; add `recipe2 String?`. Keep `secondaryTopic` as the field backing the `secondary_article` CSV column (documented mapping).
- **BrandSettings:** add `nlSectionColor1..4`, `nlLogoUrl`, `nlLogoWidth Int?`. (Already have `nlHeaderBgColor`, `nlFooterBgColor`, `nlFontFamily`, `nlFontColor`, `nlHeadingFontWeight`, `nlBodyFontWeight`, `nlLinkColor`.)
- **Newsletter:** add `summaryImageUrl String?`, `summaryTitle String?`. `modules` JSON now `{recipe?, recipe2?}` (drop kidsSnack/techFreeActivity).
- Teaser source `headline` + `image` (og:image) live in the `NewsletterTopic.research` JSON → no migration.

## 5. Prompts
- **Add:** `nl_summary_title` (3-word catchy title); `nl_summary_icon_style` (icon style suffix, editable).
- **Retire:** `nl_kids_snack_*`, `nl_tech_free_*` (deactivate). `recipe_2` reuses `nl_recipe_*`; `secondary_article` reuses `nl_article_*`.

## 6. Code changes
- **CSV** (`newsletter/csv.ts`): new headers + aliases; drop old; update the downloadable `newsletter-topics-template.csv`.
- **Research** (`newsletter/research.ts`): capture each teaser source's **real headline** (`og:title`/`<title>`/`<h1>`) and **og:image** into `teaserSources[]`.
- **Generation** (`newsletter/generate.ts`): secondary article via article chain; recipe + recipe_2 via recipe chain; remove kids-snack/tech-free; then `nl_summary_title` + 6 Fal icons + cover composite → `summaryImageUrl`. Per-section regenerate adds `summaryImage` + `recipe2`.
- **Compositor** (new `newsletter/cover.ts`): build cover HTML (title bar + 2×3 tile grid, scrims) → headless-Chrome screenshot → `uploadBufferWithKey` → URL. **Infra check:** confirm a usable headless Chrome (mermaid-cli bundles puppeteer+chromium in the API image; may add `puppeteer-core` pointing at it). Fallback option: `@napi-rs/canvas`/`sharp` compositing (no browser) if Chrome proves awkward.
- **Renderer** (`newsletter/render.ts`): rewrite to the new order, per-teaser real source headline, 4-color band cycle, header logo sizing, summary image after trivia question.
- **Template editor** (`/newsletter/template` + `routes/newsletters.ts` settings): 6 color pickers + logo upload (reuse the Settings S3 upload) + width control + live preview; settings GET/PUT gains the new fields.
- **Tests:** CSV parser (new columns + dropped aliases), renderer snapshot (new order/colors/logo), cover compositor smoke.

---

## 7. Phasing
- **Phase 2a — content model:** migration (drop kids/tech, add recipe2 + Brand/Newsletter fields), CSV columns/aliases + template file, prompts (add title/icon-style, retire kids/tech), generation changes (secondary article, recipe_2, drop kids/tech), research captures teaser headline+og:image. No visual change yet.
- **Phase 2b — renderer + template editor:** new order, real teaser headlines, 4-color bands, header logo sizing; 6 color pickers + logo upload/resize + live preview. Renderer snapshot test.
- **Phase 2c — cover image:** `nl_summary_title`, Fal icons, `cover.ts` compositor, `summaryImageUrl`/`summaryTitle`, render placement, regenerate; compositor smoke test + infra check.

Deploy each phase to the `staging` branch; keep the staging worker running only during a generation test (connection budget). PROD worker is currently stopped (see [[staging-web-db-url]]) — restore it after testing.

## 8. Open/minor items
- Confirm headless-Chrome availability for the compositor early in 2b/2c (biggest unknown).
- Icon style consistency across 6 tiles (pin style + seed; review on first run).
- `secondaryTopic` DB field name kept for minimal churn (CSV `secondary_article` maps to it) — rename later if desired.
