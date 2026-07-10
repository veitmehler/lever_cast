# De-AI the Writing — Dash Elimination + Storytelling Hooks — Implementation Plan

Status: **implemented** (2026-07-10). All phases shipped: two-tier dash sanitizer with token-diff
guard (`lib/text/dash-sanitizer.ts`, 20 unit tests) hooked into every output boundary in the
inventory table; hook prompts rewritten in their canonical source files (309/310 curated teasers
with hookType rotation + exemplars/restrictions + verify-regen-accept, 305 article_teaser line,
203 captions + in-code defaults in lockstep, 411/412 no-dash rule); exemplars + restrictions
rewritten dash-free; `st_dash_fix` (420) seeded create-only; `reseed-deai-prompts.ts` performs the
signed-off overwrite (must run on staging AND prod post-deploy — auto-seed is create-only).

## Goal

Remove the two loudest "written by AI" tells from all client-facing prose:

1. **Em-dash constructions** ("cold muscles are less pliable—increasing pressure") — **fully
   eliminated** (user decision), replaced with grammatically correct commas, colons, periods, or
   sentence splits. Everywhere: articles, newsletters, plain-language injections, teasers,
   captions, subjects, excerpts, syndication, promo emails.
2. **Summary-style teasers** that satisfy instead of hook. Rewritten as storytelling/metaphor
   hooks with a curiosity gap, across: the newsletter's **3 curated teasers**, the newsletter
   **article teaser field**, and **social captions** (user decision on scope).

## Decisions locked (2026-07-10 discussion)

1. **Em-dashes: full elimination**, not a cap — "zero" is verifiable, "tasteful" isn't. Numeric
   ranges between digits (2–4) may stay (they're legitimate typography, not the AI tell); only
   dashes adjacent to words are eliminated.
2. **No naive regex swap**: em-dashes map to different punctuation depending on grammatical role.
   Two-tier sanitizer — deterministic code for the safe cases, a flash-lite sentence-level
   micro-edit for the rest, with a **token-diff guard** that rejects any rewrite touching more
   than punctuation + small function words (fact-check preserved by construction).
3. **Prompt-level "never use em-dashes" instructions are added but never trusted** — the
   sanitizer is the enforcement; prompts just reduce its workload.
4. **Teaser craft**: a hook must open a loop it refuses to close. Three-beat structure: relatable
   scene/metaphor → the specific surprising claim (specificity separates curiosity from
   clickbait) → stop before the payoff. Never "this article covers/explains". Hook **types rotate
   across the 3 curated teasers** per edition (scene | metaphor | question) so the pattern never
   reads as formula.
5. **Band title stays the real source-article title** (user decision) — readers see what they're
   being teased about. Prompt constraint that falls out: the teaser body must tease BEYOND the
   title, never restate it.
6. **Reuse the plain-language machinery**: `PlainLanguageConfig` exemplars (metaphor quality bar)
   + restrictions (AHPRA-aware compliance) feed teaser and caption generation for configured
   industries. No config row → hook structure still applies, exemplars/restrictions vars empty
   with a generic honesty baseline in the prompt.
7. **Social captions get the hook craft platform-adapted**, not copy-pasted: IG's first line
   before the "…more" fold is the whole game; LinkedIn tolerates a longer story beat; feed posts
   have no clickable link (CTA orientation = link-in-bio / engagement, which existing
   platform-tone strings already encode).
8. **Prompt overwrites — USER SIGNED OFF 2026-07-10** for exactly this set (the one deliberate
   exception to the never-overwrite convention, because changing these prompts is the point):
   - `nl_teaser_summarizer_system` (309) + `nl_teaser_summarizer_user` (310) — hook rewrite
   - `social_platform_caption` (stepNumber 203, numbered template) — hook rewrite
   - `nl_article_writer_system` (305) — ONLY the `article_teaser` field guidance line in its JSON
     output spec (minimal targeted change to the big article writer prompt)
   - `pl_write_gloss` (411) + `pl_write_story` (412) — add the no-dash style rule
   - `PlainLanguageConfig` "Chiropractor" `exemplars` — rewritten without em-dashes (exemplars
     teach the writers; today's five model the dash habit)
   Everything else stays untouched; the reseed script overwrites ONLY these keys.

## Current-state facts this builds on (verified in code 2026-07-10)

- **Curated teasers**: `voiceTeasers()` (`newsletter/generate.ts` ~line 64) loops
  `research.teaserSources`, calls `runNewsletterWriterJson('nl_teaser_summarizer_system',
  'nl_teaser_summarizer_user', {bulletPoint, articleContent, writingStyle, who, industry})` →
  `{title, body, cta}`. Render: `teaserHeading()` = `t.headline || t.title` (headline IS the real
  source title — decision 5 already holds today); body + CTA + Read More button.
  Current prompt output shape: "three ~50-word paragraphs" summary + CTA — the exact
  summary-that-satisfies pattern we're replacing.
- **Article teaser field**: `article_teaser` (~50 words) from the newsletter article writer JSON
  (spec lives in `nl_article_writer_system`, 305). Surfaces verified: (a) input text for
  newsletter-day social posts (`social/automation/newsletter-content.ts:50` joins tldr+body+teaser
  into slot source), (b) review UI display. It does NOT render in the email itself (the email
  shows `tldr`). So hook-styling it is safe: it feeds caption generation (good — hooks in, hooks
  out) and the dashboard preview.
- **Captions**: `social/generators/platform-caption.ts` loads template **by stepNumber 203** (not
  string key), fills vars via `.replace()` chains, has **in-code `DEF_SYS`/`DEF_USER` fallbacks
  that must be updated in lockstep** with the DB row. Has `PLATFORM_TONE` map + char limits.
  Brand vars already available (`loadSocialBrandTheme`); `who`/`writingStyle` already passed.
- **Dash reality check**: live content confirms the tell (today's test article: "…or waking too
  early—compared to only 15 to 22 percent…"). The plain-language exemplars I seeded also use
  (spaced) em-dashes.
- **Output-boundary inventory** (where prose leaves an LLM and enters a stored artifact) — the
  sanitizer hook points:

  | Surface | Where | Tier |
  |---|---|---|
  | Article body (post fact-adjust) | executor, step 11 output before citation insertion | 1+2 |
  | Article title / SEO meta / excerpt / disclaimer | executor, steps 0, 13, 17, 18 outputs | 1+2 |
  | Newsletter article title/teaser/tldr/body | `generateArticle()` return | 1+2 |
  | Curated teasers title/body/cta | `voiceTeasers()` | 1+2 |
  | Quick hits, fun, subject, preview | their generators in `generate.ts` | 1+2 |
  | Plain-language gloss/story | `generateVerified()` result in `plain-language.ts` | 1+2 |
  | Social captions | `generatePlatformCaption()` return | 1+2 |
  | Social reel bullets / story pitch slides | their generators | 1+2 |
  | Syndication articles (LinkedIn/Medium), promo email | steps 30/31/32 outputs | 1+2 |
  | Quote cards | **excluded** — verbatim article quotes; article body is already sanitized |  |

## Phase 1 — Dash sanitizer module

New `apps/api/src/lib/text/dash-sanitizer.ts`:

- `normalizeDashes(text)`: `--`/`–`-between-words → `—` (single canonical form to process).
- **Tier 1 (sync, deterministic)** `stripSafeDashes(text)`:
  - Paired parenthetical em-dashes within one sentence → `, … ,` (with comma-collision cleanup).
  - `—` immediately before a coordinating conjunction (and/but/or/so/yet) → `,`.
  - Digit–digit en-dashes untouched; hyphens untouched.
- **Tier 2 (async)** `sanitizeDashes(text, ctx)`:
  1. Tier 1 first.
  2. Split remaining text into sentences; for each sentence still containing a word-adjacent
     em/en dash, call new prompt **`st_dash_fix`** (stepNumber 420, gemini-3.1-flash-lite):
     "Rewrite this sentence with correct punctuation instead of the dash — comma, colon, or two
     sentences. Change NOTHING else: same words, same order, same meaning."
  3. **Token-diff guard** (the fact-check safety property): lowercase word-token sequences of
     original vs rewrite must be identical except for ≤2 insertions from an allowlist
     (and, but, so, because, which, that, it, is, this) and 0 deletions. Guard fails → keep the
     original sentence (a dash survives rather than risking drift; log it).
  4. Splice rewritten sentences back in code. HTML-aware: operate on text nodes only (reuse the
     tag-skipping scan pattern from `plain-language.ts`'s `sentenceEndAfterTerm`).
- Works on plain text AND simple HTML (paragraph-wise). Unit tests: paired-dash → commas,
  conjunction case, guard rejecting a paraphrase, guard accepting a comma-only rewrite, ranges
  untouched, HTML attributes/tags untouched, idempotency (running twice = no-op).

Cost: ~3–8 flash-lite sentence calls per article, fractions of a cent.

## Phase 2 — Hook the sanitizer into every output boundary

Per the inventory table above. Article pipeline: in the executor after step 11 completes (worker
context, async fine) + the small text steps. Newsletter/social/plain-language: at the listed
generator returns. Each hook is 1–3 lines calling the shared module; failures degrade to the
unsanitized text (log, never fatal). Also add the one-line style rule ("Never use em-dashes;
use commas, colons, or separate sentences") to the main writer prompts' seed text — **new
generations only** (create-only seeding; existing rows get it only via the Phase 6 reseed where
signed off, or admin edits later — the sanitizer enforces regardless).

## Phase 3 — Exemplar + plain-language prompt dash cleanup (signed-off overwrites)

Rewrite the 5 Chiropractor exemplars comma-style (e.g. "A subluxation is that kink in your
spine: a segment that has shifted out of its normal position, changing how the joint moves and
how nearby nerves carry their signals."). Add the no-dash rule to `pl_write_gloss` /
`pl_write_story`. Ships via the Phase 6 reseed script.

## Phase 4 — Curated-teaser hook rewrite

New prompt texts for 309/310 (drafted in full at implementation time, structure locked here):

- **System (309)**: veteran email-newsletter hook writer; 5th–7th grade level; voice-matched;
  JSON `{title, body, cta}` (unchanged shape — render untouched); body = 2–3 short paragraphs
  (~35–45 words each, slightly tighter than today); **never summarize, never resolve; the reader
  already sees the source title above your text — tease beyond it, never restate it**; no
  generic clickbait ("you won't believe"); curiosity through specificity; no em-dashes; respect
  `{{restrictions}}`; study `{{exemplars}}` for metaphor craft when present.
- **User (310)**: adds `{{hookType}}` — `scene` (drop the reader into a 1–2 sentence relatable
  moment), `metaphor` (open with one striking, audience-matched image), `question` (open with
  the specific surprising question the article answers) — plus beats 2–3: pivot to the article's
  most surprising specific claim, stop before the payoff; CTA = one line that names what the
  reader will get without giving it ("The part about X alone is worth the click.").
- **`voiceTeasers()` changes**: pass `hookType` by teaser index (deterministic rotation
  scene→metaphor→question), plus `exemplars`/`restrictions` from
  `loadPlainLanguageConfig(voice.industry)` (empty strings when no config). Optional (include):
  run `pl_verify` on each teaser body with the restrictions — skip-on-fail is wrong here (a
  teaser slot shouldn't vanish), so on fail fall back to ONE regeneration, then accept (teasers
  are lower-stakes than injected medical explanations; log for QA).

## Phase 5 — Article teaser + captions

- **`article_teaser` (305, minimal targeted overwrite)**: JSON-spec line changes from
  "~50 words plain text" to "~50 words plain text — a curiosity hook, not a summary: open with a
  concrete image or moment, land on the article's most surprising specific point, never resolve
  it, no em-dashes". Everything else in 305 byte-identical.
- **Captions (203 overwrite + in-code `DEF_SYS`/`DEF_USER` in `platform-caption.ts` updated in
  lockstep)**: keep all existing vars/rules (char limit, no markdown, platform tone), add: first
  line must hook before the fold (scene, image, or surprising specific — never the title
  restated, never a summary); story-beat length per platform tone; add `{{exemplars}}`/
  `{{restrictions}}` vars, populated in `generatePlatformCaption` via
  `loadPlainLanguageConfig` (one extra parallel load next to `loadSocialBrandTheme`); no
  em-dashes. Caption output runs through the dash sanitizer regardless.

## Phase 6 — Rollout (the signed-off overwrite reseed)

New `packages/db/scripts/reseed-deai-prompts.ts`: **explicitly overwrites** exactly the rows in
decision 8 (updates prompt text + the Chiropractor exemplars JSON), prints before/after diff
summary per key, refuses to touch anything else. Run on staging after deploy; **must also be run
on prod after the prod deploy** (prod's auto-seed is create-only and will NOT propagate changed
text). `st_dash_fix` (420) is a new key — normal create-only seeding via `seed.ts` + the script.

## Phase 7 — Staging verification

1. Regenerate the test edition's `teasers` section → eyeball all 3 hook types, confirm titles
   untouched, bodies tease beyond titles, zero dashes.
2. Regenerate feature article → `article_teaser` reads as a hook; body dash-free.
3. Re-run one article enrichment + check step-11 sanitization: `grep -c '—'` on final bodyHtml ≈ 0
   (allowing guard-kept survivors, expected rare).
4. Trigger one social caption generation (or approve a pending slot) → first-line hook present,
   no dashes, char limits respected.
5. Confirm plain-language boxes still generate cleanly with the rewritten exemplars.

## Costs

Dash Tier 2: <$0.01/article, less for shorter surfaces. Teaser/caption changes: cost-neutral
(same calls, new text). Optional teaser verify: 3 flash-lite calls/edition ≈ negligible.

## Risks / open details for implementation time

- **Token-diff guard strictness**: too strict → dashes survive (acceptable, logged); too loose →
  drift risk. Start strict (allowlist above), tune from logs.
- **Sentence splitting on HTML** is the fiddliest part — reuse and extend the tag-aware scanning
  already proven in `plain-language.ts`; densest unit tests here.
- **Hook quality regression risk on captions**: platform captions currently perform fine; the 203
  overwrite changes live behavior for every automated post. Mitigation: staging eyeball across
  all 6 platforms' tones before prod reseed; the old prompt text is recoverable from git.
- **`--` in code/technical content**: not a real concern for this content vertical; sanitizer
  skips inside `<code>`/`<pre>` anyway (cheap guard).
- **Idempotency**: sanitizer runs at generation time only (stored content untouched); re-running
  on already-clean text is a no-op by construction.
- **Retroactive content**: existing articles/newsletters keep their dashes; they self-heal only
  on regeneration. No backfill pass planned (could be added later as a one-off script over
  `site_pages.bodyHtml` if wanted).

## Touch list (files)

- `apps/api/src/lib/text/dash-sanitizer.ts` (new) + `__tests__/dash-sanitizer.test.ts`
- `packages/db/prisma/deai-prompts.ts` (new: `st_dash_fix` + the overwrite text blobs for 203/305/309/310/411/412 + rewritten exemplars, single source of truth)
- `packages/db/prisma/seed.ts` — additive: `st_dash_fix` create-only
- `packages/db/scripts/reseed-deai-prompts.ts` (new, explicit-overwrite, staging + prod)
- `apps/api/src/article-pipeline/executor.ts` — step 11/0/13/17/18 sanitize hooks
- `apps/api/src/newsletter/generate.ts` — `voiceTeasers` (hookType/exemplars/restrictions/verify) + quickHits/fun/subject/preview sanitize
- `apps/api/src/newsletter/article.ts` — sanitize returns
- `apps/api/src/article-pipeline/enrichment/plain-language.ts` — sanitize generated text
- `apps/api/src/social/generators/platform-caption.ts` — DEF_SYS/DEF_USER update + exemplars/restrictions load + sanitize
- Social reel-bullets / story-slide generators + syndication (30/31) / promo email (32) call sites — sanitize hooks
