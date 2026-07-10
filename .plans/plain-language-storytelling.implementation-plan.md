# Plain-Language Storytelling Injection — Implementation Plan

Status: **implemented** (2026-07-10). Phases 1–4 + 6 shipped: schema (`PlainLanguageConfig` +
`PlainLanguageBlock`), the four `pl_*` prompts + chiro exemplar config (seed.ts + staging seeder),
the article enrichment pass (hooked after GEO restructure), and the newsletter pass (hooked in
`generateArticle` with `data-pl-box` markers styled by `render.ts`). 25 unit tests. Phase 5
(admin CRUD page for the config) deliberately deferred until output quality has been reviewed on
real content — exemplars/restrictions are editable via DB until then.

## Goal

Readers today skim and stall on technical language. Our articles and newsletters are well-researched
and fact-checked but often too dense for the average (≈5th-grade) reading level. This feature makes
complex content graspable **without touching a single fact-checked sentence**: after the final
version of each article/newsletter article exists, we detect jargon terms and complex concepts and
**inject** professional, brand-voiced metaphors and micro-stories next to them — additively, never
rewriting.

Example: an article that (correctly) uses "subluxation" gains, right where the term first appears,
a plain-English analogy a layperson instantly gets — while the original sentence stays byte-identical.

## Decisions locked (2026-07-10 discussion)

1. **Inject, never rewrite.** A "rewrite for 5th grade" pass was explicitly rejected — LLM
   paraphrase drifts claims away from citations and degrades SEO structure. The fact-checked prose
   is never modified; explanations are *added* adjacent to it. Fact-checking survives by
   construction.
2. **Two tiers, both from day one:**
   - **Terms** — single jargon words/phrases ("subluxation", "proprioception") → short inline
     gloss woven in right after the sentence where the term first appears.
   - **Concepts** — complex mechanisms spanning a passage (e.g., "adjustment → nervous-system
     realignment → vagus-nerve communication") → a 3–6 sentence story/metaphor in a styled callout
     box after the anchor paragraph.
3. **Hybrid presentation** (user-confirmed): terms inline (boxing one-liners is noisy), concepts
   boxed (stories deserve the visual break and break up text walls).
4. **Box labels rotate through variations** to keep content fresh: e.g. "In Plain English",
   "Simply Put", "Think of It This Way", "What This Means for You", "The Simple Version".
   Deterministic rotation (hash of page id + section position) so re-runs are stable.
5. **Budget: max 1 box per article section** (user-set; detection prompt instructed to be
   selective, so typical density lands at 2–4 boxes/article), plus max 2 inline glosses per
   section. Each term explained at most **once per article** (first occurrence wins). Every
   article re-explains its terms — each article is a standalone search landing page and most
   readers' first contact; only *within*-article repetition is deduped.
6. **Section-by-section processing** (user-directed, mirroring the GEO/answer-engine optimization
   pass): the LLM never sees the whole article at once. Detection runs per H2 section, exactly like
   `enrichment/geo-question-matcher` / `geo-html-restructurer` work today.
7. **Exemplar-guided generation, not a variant bank** (user's design): the "bank" stores **3–5
   gold-standard exemplar metaphors per industry** + an **advertising-claim restrictions block**.
   Generation is per-article few-shot: the LLM writes *fresh* metaphors in the account's writing
   voice, guided by the exemplars' craft and bound by the restrictions. This covers open-ended
   concepts (which no pre-written glossary can anticipate), kills cross-client duplicate content,
   and scales per-industry (5 exemplars once), not per-term.
8. **Zero end-user curation.** Clients never see or edit the bank. Global, admin-managed (same
   philosophy as the prompt registry). Claude drafts the seed exemplars; user approves them via
   this plan.
9. **Compliance is a first-class constraint.** Chiropractic advertising is regulated
   (AHPRA-style rules). The restrictions block + a verify pass enforce: a metaphor may only
   illustrate what the adjacent fact-checked text already asserts — never extend it, never promise
   outcomes, never make cure/treat-disease claims. Verify-fail → one regeneration → skip the
   injection entirely (graceful degradation: skipping = the article exactly as it is today).
10. **Scope: articles + newsletter feature/secondary articles only.** Social posts, teasers, quick
    hits etc. are excluded (already short-form, and social derives from this content anyway).
11. **NO existing prompts are altered or overwritten** (explicit user requirement). All new prompts
    are new registry keys; seeding follows the established create-if-missing convention (`seed.ts`
    upserts never overwrite an existing row's content, and the staging seeder is targeted).

## Current-state facts this builds on

- **Article enrichment (Phase C)** — `apps/api/src/article-pipeline/enrichment/index.ts` — is the
  architecturally-guaranteed "additive only" zone: it always restarts from
  `SitePage.originalBodyHtml`, wipes its own artifacts, and injects (GEO restructure → key
  takeaways + TOC → per-section diagrams). It already loops per H2 section via
  `extractH2Sections()` and excludes FAQ/conclusion/takeaways headings via `GEO_EXCLUDE`.
- **GEO restructuring** (`geo-html-restructurer.ts`) rewrites section headings and produces
  `geoHtml`; key takeaways/TOC and diagrams run downstream of it. Our pass hooks **immediately
  after GEO restructure, before the takeaways/TOC step** (still within UI milestone 19), so TOC
  anchors, heading IDs, and diagram placement all operate on the box-bearing HTML. Boxes contain no
  headings, so TOC is unaffected; diagrams append at section ends, boxes sit mid-section — no
  collisions.
- **Newsletter articles** — `apps/api/src/newsletter/article.ts` `generateArticle()` produces
  `{title, teaser, tldr, body}` where `body` is HTML, called for feature + secondary from BOTH
  `generateNewsletterForCustomer` and `regenerateNewsletterSection`. Hooking inside
  `generateArticle` (after the writer step, before return) covers both call sites automatically.
  `VoiceVars` already carries `{writingStyle, targetAudience, industry, specialization}` — exactly
  the voice inputs generation needs.
- **Newsletter rendering** — `render.ts` `renderNewsletterHtml()` wraps `a.body` via `para()` with
  inline-styled email HTML and has the brand theme (fonts, `nlSectionColor*`). Injection therefore
  places a **neutral marker element** in the body; `render.ts` swaps markers for fully-styled
  email-safe boxes at render time (styling stays centralized where the theme lives).
- **Prompt registry** — string-keyed templates with mandatory unique `stepNumber` (newsletter uses
  300–337, client-story triage 400). This feature takes **410–413** with key prefix `pl_*`.
  `runNewsletterJsonPrompt(key, vars, opts)` in `newsletter/llm.ts` is the generic DB-prompt JSON
  runner (already reused cross-domain by `cs_story_triage`).
- **Brand context available at both hook points**: articles — `brandSettingsForUser` is already
  imported in enrichment (used by diagram theming, incl. brand colors for the box accent);
  newsletters — `VoiceVars`. `BrandSettings.who` (target audience) drives metaphor *domain*
  selection (sports metaphors for a sports-chiro audience, household/parenting for a family
  practice) — the single biggest automatic-quality lever.
- **Human-review backstop**: clients review finished articles/newsletters before publishing;
  the injected metaphors are part of what they review. No new review workflow.

## Data model (new)

```prisma
/// Global, admin-managed per-industry exemplar bank + advertising-claim restrictions
/// for plain-language metaphor generation. Clients never see or edit this.
/// See .plans/plain-language-storytelling.implementation-plan.md.
model PlainLanguageConfig {
  id           String   @id @default(cuid())
  industry     String   @unique // matches BrandSettings.industry, case-insensitive lookup w/ fallback
  exemplars    Json     // Array<{ kind: 'term'|'concept', subject: string, metaphor: string, note?: string }>
  restrictions String   @db.Text // advertising-claim limitation instructions injected into every generation
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@map("plain_language_config")
}

/// Per-run record of injected blocks (observability + admin QA). Wiped and
/// re-created by each enrichment run, same lifecycle as SectionEnrichment.
model PlainLanguageBlock {
  id              String   @id @default(cuid())
  sitePageId      String
  sitePage        SitePage @relation(fields: [sitePageId], references: [id], onDelete: Cascade)
  sectionPosition Int
  kind            String   // 'term' | 'concept'
  subject         String   // the term, or a one-line concept summary
  label           String?  // box label used (concept only)
  generatedText   String   @db.Text
  verified        Boolean  @default(false)
  llmProvider     String?
  llmModel        String?
  inputTokens     Int      @default(0)
  outputTokens    Int      @default(0)
  cost            Float    @default(0)
  createdAt       DateTime @default(now())

  @@index([sitePageId])
  @@map("plain_language_blocks")
}
```

`SitePage` gains the back-relation `plainLanguageBlocks PlainLanguageBlock[]`. Newsletter-side
injections are not persisted separately (the body carries them; costs flow through the existing
`UsageRecorder`).

Industry lookup: exact case-insensitive match on `BrandSettings.industry`; if no row exists for the
account's industry, **the whole pass is skipped** (safe default for industries we haven't curated
yet — no generic fallback config, because exemplar quality IS the feature).

## Prompts (new registry keys — nothing existing is touched)

All four are new `PromptTemplate` rows seeded via a new `packages/db/prisma/plain-language-prompts.ts`
(mirroring `client-story-prompts.ts`), included in `seed.ts`'s create-if-missing loop + a targeted
staging seeder `packages/db/scripts/seed-plain-language-prompts.ts`. Admin-editable like all others.

### `pl_detect_section` (stepNumber 410, gemini / gemini-3.1-flash-lite, jsonMode)

Input vars: `sectionHeading`, `sectionText` (plain text, tags stripped), `industry`, `audience`.
Task: identify AT MOST 2 jargon terms a layperson would stumble on (each with the exact sentence it
first appears in) and AT MOST 1 complex mechanism/concept genuinely worth a story (with a one-line
summary and a short verbatim anchor quote from the passage). Explicitly instructed: *"Most sections
need nothing — return empty arrays unless an explanation genuinely helps a low-attention reader.
Never flag terms the section itself already explains."* Output JSON:
`{ "terms": [{ "term", "sentence" }], "concept": { "summary", "anchorQuote" } | null }`.

### `pl_write_gloss` (stepNumber 411, anthropic / claude-sonnet-4-5)

Input vars: `term`, `sentence`, `sectionExcerpt`, `writingStyle`, `audience`, `industry`,
`exemplars`, `restrictions`, `alreadyUsedMetaphors` (comma list, to prevent two garden-hose
metaphors in one article). Task: ONE continuation sentence (max two) that glosses the term in plain
language, written to flow directly after `sentence` in the article's voice; concrete everyday
imagery matched to the audience; **must not assert anything beyond what `sectionExcerpt` already
states**. Output: the sentence(s) only, no preamble.

### `pl_write_story` (stepNumber 412, anthropic / claude-sonnet-4-5)

Input vars: `conceptSummary`, `sectionExcerpt`, `writingStyle`, `audience`, `industry`,
`exemplars`, `restrictions`, `alreadyUsedMetaphors`. Task: a 3–6 sentence story/extended metaphor
that makes the mechanism graspable to a 5th-grade reading level while sounding professional (the
exemplars define the bar); one central image carried through, no mixed metaphors; ends by
connecting the image back to the reader's body/experience. Same hard rule: illustrate only what the
excerpt asserts. Output: the story text only.

### `pl_verify` (stepNumber 413, gemini / gemini-3.1-flash-lite, jsonMode)

Input vars: `sectionExcerpt`, `generatedText`, `restrictions`. Judges: (1) does the text introduce
any factual/medical claim not present in the excerpt? (2) does it promise any health outcome or
violate the restrictions? (3) is it condescending? Output `{ "ok": boolean, "reason": string }`.
On `ok:false` → regenerate once with `reason` appended to the prompt → verify again → still false →
**skip this injection** (log, continue).

## Seed content (chiropractic) — the soul of the feature

To be seeded into `PlainLanguageConfig` for `industry: "Chiropractor"` (plus alias row or
normalized matching for "Chiropractic"). **User reviews/edits these five before implementation
completes — this one curation session is the quality investment.**

### Exemplars (draft for user approval)

1. **term — subluxation**: "Think of a garden hose watering a row of plants: kink one spot even
   slightly, and the plants furthest along the row are the first to droop. A subluxation is that
   kink in your spine — a segment that has shifted out of its normal position and changed how the
   joint moves and how nearby nerves carry their signals."
2. **concept — adjustment → nervous system → vagus nerve**: "Your nervous system runs your body
   the way a control tower runs an airport — thousands of messages landing and taking off every
   second, all on precise timing. The spine is the main runway those messages travel through. When
   an adjustment restores normal motion to a stuck segment, it's like clearing debris off that
   runway: the tower and the planes were always talking, but now the messages move the way they
   were designed to. The vagus nerve is the busiest route of all — the direct line between the
   tower and your body's engine rooms: heart, lungs, digestion."
3. **term — proprioception**: "Close your eyes and touch your nose. You didn't miss — because
   millions of tiny position sensors in your joints and muscles are constantly telling your brain
   exactly where every part of you is. That built-in GPS is called proprioception."
4. **concept — acute vs. chronic inflammation**: "Acute inflammation is a campfire you light on
   purpose: your body starts it to cook a repair, then puts it out. Chronic inflammation is a
   smoldering fire that never gets extinguished — quiet, low, but slowly baking everything around
   it. The goal isn't to never have fire; it's to make sure every fire gets put out when its job
   is done."
5. **concept — spinal discs need motion**: "The discs between your vertebrae have almost no blood
   supply of their own — they feed like a sponge in a shallow dish of water. Leave the sponge
   sitting still and it barely drinks; squeeze and release it, and it pulls water in. Movement is
   how your discs eat. That's why long hours in one position leave your back feeling starved."

### Restrictions block (draft for user approval)

> You are writing for a licensed healthcare practice whose advertising is regulated. Hard rules:
> NEVER claim or imply that care cures, treats, or prevents any disease or medical condition.
> NEVER promise outcomes or timelines ("you will feel...", "this fixes..."). NEVER use fear-based
> imagery about what happens without care. NEVER disparage other health professions. NEVER
> overstate mechanisms — your metaphor may only illustrate what the adjacent article text already
> says; if the article says "may support", your image must carry the same hedging, never upgrade it
> to certainty. Avoid "boosts immunity", "heals", "life force", "toxins". Tone: warm, professional,
> respectful — explain like a great teacher, never like you're talking down to a child.

## Injection mechanics

**Module**: `apps/api/src/article-pipeline/enrichment/plain-language.ts` — pure-ish helpers +
orchestrated pass, mirroring the GEO module family. **All splicing is code, not LLM** — the LLM
only ever produces gloss/story text; code decides where it lands.

- **Inline gloss (terms)**: find the term's first occurrence across the article (earliest section
  wins; later sections' duplicate detections dropped). Within that paragraph's HTML, locate the end
  of the sentence containing the term (first `.`/`!`/`?` after the term's text-node position,
  ignoring tags) and splice ` ` + gloss after it, wrapped
  `<span class="plain-gloss">…</span>` (unstyled by default — renders as body text; class is a
  future styling hook). Fallback when sentence-boundary detection fails (nested markup, term inside
  a heading): append the gloss as its own `<p class="plain-gloss">` right after the anchor
  paragraph.
- **Story box (concepts)**: locate the paragraph containing `anchorQuote` (substring match against
  stripped text, fallback: first paragraph of the section) and insert after its closing `</p>`:

  ```html
  <div class="plain-language-box" style="border-left:4px solid {brandAccent};background:{brandAccentFaint};
       padding:16px 20px;margin:20px 0;border-radius:6px;">
    <p style="margin:0 0 6px;font-weight:600;font-size:0.95em;">{rotatedLabel}</p>
    <p style="margin:0;">{storyText}</p>
  </div>
  ```

  Inline styles (WordPress-theme-proof, same approach as `geo-summary`/figures) + class for site
  CSS override. `{brandAccent}` from `themeFromBrand` (already brand-color-aware in enrichment);
  neutral gray fallback when no brand colors.
- **Label rotation**: `LABELS = ['In Plain English', 'Simply Put', 'Think of It This Way', 'What This Means for You', 'The Simple Version']`,
  index = stable hash(sitePageId + sectionPosition) % 5 — varied across an article and across
  articles, stable across re-runs.
- **Adjacency rule**: never insert a box directly adjacent to another injected block (existing
  `geo-summary` div or another box) — if the anchor lands there, shift one paragraph down.
- **Newsletter marker**: `generateArticle` inserts
  `<div data-pl-box data-pl-label="{label}"><p>{storyText}</p></div>` and plain gloss sentences
  directly (glosses need no styling). `render.ts` replaces `data-pl-box` markers with an
  email-safe inline-styled block using the theme (`nlSectionColor` accent + `para()` typography) —
  a small regex/replace in `buildRenderInput` or `renderNewsletterHtml`. Markers that somehow
  survive to render unstyled still read fine (plain div + paragraph).

### Article pass flow (per enrichment run, inside milestone 19 after GEO restructure)

1. Load `PlainLanguageConfig` by account industry → absent = skip pass entirely (log once).
2. Load voice: `brandSettingsForUser(job.userId)` → writingStyle (from `Settings.writingStyle`),
   `who`, `industry`; wipe previous `PlainLanguageBlock` rows for the sitePage.
3. `extractH2Sections(geoHtml)`, filter `GEO_EXCLUDE` — same eligibility as GEO.
4. Per section (sequential, like GEO): `pl_detect_section` → cap results (≤2 terms after
   cross-section dedup, ≤1 concept) → for each: write (`pl_write_gloss` / `pl_write_story`) →
   `pl_verify` → regenerate-once-or-skip → splice into `geoHtml` → record `PlainLanguageBlock` +
   accumulate `alreadyUsedMetaphors` (one-line image summaries) for subsequent sections.
5. Per-section try/catch — one section's failure never kills the run (GEO's exact pattern).
   Costs/tokens accumulate into the run's existing `totalCost` counters.

### Newsletter pass flow (inside `generateArticle`, after the writer step)

Same detect→write→verify chain over the article body's H2 sections (or the whole body as one
"section" when it has no H2s — newsletter articles are short), budget **1 box + 2 glosses total per
newsletter article**, voice from `VoiceVars`, costs via `usage.record()`. Non-fatal: any error →
return the body unmodified (same convention as the image step). Skip when no
`PlainLanguageConfig` row matches the industry.

## Phases

**Phase 1 — Schema + config seed**: `PlainLanguageConfig` + `PlainLanguageBlock` models,
migration (hand-verified against `@@map` names), seed the chiropractic config (exemplars +
restrictions above, post-user-approval) in `seed.ts` + targeted staging seeder script.

**Phase 2 — Prompts**: `packages/db/prisma/plain-language-prompts.ts` with the four `pl_*`
templates (full prompt text), wired into `seed.ts` (create-if-missing) + staging seeder. Explicit
guarantee: no existing prompt row is modified — new keys only, and the seeding convention never
overwrites existing rows anyway.

**Phase 3 — Article enrichment pass**: `enrichment/plain-language.ts` (detection driver, splice
helpers, label rotation, adjacency rule) + hook in `enrichment/index.ts` between GEO restructure
and the takeaways step. Unit tests for the pure helpers: sentence-boundary splice (incl. nested
tags + fallback), box insertion + adjacency shift, label rotation stability, cross-section term
dedup, marker HTML shape.

**Phase 4 — Newsletter pass**: hook in `newsletter/article.ts` + marker-replacement styling in
`render.ts`. Unit tests: marker replacement produces email-safe HTML; body without markers passes
through untouched; error → body unmodified.

**Phase 5 — Admin visibility (small)**: `/admin` page for `PlainLanguageConfig` CRUD
(pattern: specializations/music admin) so exemplars/restrictions are editable without deploys;
read-only list of recent `PlainLanguageBlock` rows per article for QA. Can ship after 1–4 if the
user prefers to see output quality first.

**Phase 6 — Staging verification**: deploy (in-flight check first), seed prompts + config on
staging, run one real article enrichment + one newsletter generation, eyeball: gloss flow,
box styling on the site page + in WP preview + in the email render, verify-pass behavior, costs.

## Costs

Per article (~8 sections): 8 detect calls (flash-lite, ~1k tokens each) + ~4–6 write calls (Sonnet,
~150–400 output tokens) + ~4–6 verify calls (flash-lite) ≈ **$0.02–0.04/article**. Newsletter
articles: 2 per edition, 1–3 LLM calls each ≈ **<$0.01/edition**. Negligible against the ~$0.65
article baseline.

## Risks / open details for implementation time

- **Sentence-splice robustness** — terms inside `<strong>`/`<a>` or with punctuation edge cases.
  Mitigated by the paragraph-append fallback; the splice helper gets the densest unit tests.
- **Verify pass is instruction-following, not human review** — backstopped by the existing human
  review of enriched articles/newsletters pre-publish, and by skip-on-doubt degradation.
- **Metaphor sameness across a client's catalog** — `alreadyUsedMetaphors` only spans one article.
  Cross-article variety comes from fresh generation + rotating labels; if sameness shows up in
  practice, a cheap fix is feeding the account's last N box subjects into the write prompt (defer
  until observed).
- **Density tuning** — "max 1 box/section" is a ceiling, not a target; if real output feels
  over-decorated, tighten the detection prompt (admin-editable, no deploy).
- **Non-English or non-chiro accounts** — no config row → pass silently skips. Azavea (AI
  Consulting) gets a config row only when we curate one.
- **Rewrite/regeneration flows** — article rewrite re-runs enrichment from `originalBodyHtml`;
  newsletter section regeneration re-runs `generateArticle`. Both re-run this pass idempotently by
  construction.
- **`Settings.writingStyle` may be empty** for some accounts — prompts must degrade gracefully
  (voice vars optional, exemplars carry the tone).

## Touch list (files)

- `packages/db/prisma/schema.prisma` — 2 new models + SitePage relation
- `packages/db/prisma/migrations/<ts>_plain_language_storytelling/migration.sql`
- `packages/db/prisma/plain-language-prompts.ts` (new)
- `packages/db/prisma/seed.ts` — additive: import + seed loop for `pl_*` templates + chiro config
- `packages/db/scripts/seed-plain-language-prompts.ts` (new, staging)
- `apps/api/src/article-pipeline/enrichment/plain-language.ts` (new) + `__tests__/plain-language.test.ts`
- `apps/api/src/article-pipeline/enrichment/index.ts` — hook after GEO restructure
- `apps/api/src/newsletter/article.ts` — post-writer hook
- `apps/api/src/newsletter/render.ts` — `data-pl-box` marker → styled email block
- (Phase 5) `apps/web/src/app/(protected)/admin/plain-language/…` + API routes, pattern-copied from specializations admin
