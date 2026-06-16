# Newsletter Creation Workflow — Complete Reference

> **Scope:** This document describes, in full detail, how a newsletter is generated in Omniply — every orchestration step, every AI sub-step, every prompt, every model, and every nuance. It covers content from the moment a generation run is triggered up to a fully-populated `Newsletter` record that is validated and ready for review. **It deliberately excludes GHL publishing/delivery** (email send, community posts, scheduling), which is documented separately.

---

## 1. High-Level Overview

A "newsletter" is a single `Newsletter` database record tied to **one practice** and **one `ContentTopic`** (a single calendar day). Generation happens in two layers:

1. **Shared research content** — generated **once per topic** and reused across every practice. This includes the YouTube video and (if applicable) the recipe. Stored on the `ContentTopic` record.
2. **Per-practice content** — generated **uniquely for each practice**, using that practice's writing style and target audience. This is the bulk of the newsletter (main article, article summaries, tips, facts, trivia, joke, day-specific content, email metadata). Stored on the `Newsletter` record.

The split exists for cost efficiency: expensive shared research (video search, recipe with image) runs only once, while voice-specific content is regenerated per client so every practice's newsletter reads in their own style.

### Entry point

```
POST /api/newsletters/generate   (app/api/newsletters/generate/route.ts)
  → getCurrentPractice()                     // resolve the calling practice from auth
  → body.days (default 30, clamped 1–90)
  → generateNewslettersForPractice(practiceId, days)
       (lib/services/newsletter-generation.ts)
```

> **Nuance — two generation services exist.** The production route imports `generateNewslettersForPractice` from `lib/services/newsletter-generation.ts`. There is also `lib/services/newsletter-generation-enhanced.ts` (with cost-limit gating, per-component `executeWithRetry`, and notifications) which is **not** wired into the `/generate` route. The enhanced version omits day-specific content, email metadata, and summary generation. **This document describes the production path (`newsletter-generation.ts`).** Differences are flagged where relevant.

### The pipeline at a glance

```
generateNewslettersForPractice(practiceId, days)
│
├─ 1. Load practice  (must have a writingStyle, else abort)
├─ 2. Load global ContentTopics for the next N days
│       where practiceId == null, isTest == false, date in [today, today+N]
│
└─ For each topic (ordered by date asc):
   ├─ 3. If topic research incomplete → generateTopicResearchContent()   [SHARED, once per topic]
   │        ├─ YouTube research (Gemini query → Oxylabs search → extract)
   │        │     Phase 1: AI query ×3 retries → Phase 2: raw topic title ×3 retries
   │        ├─ Upload YT thumbnail to S3
   │        └─ Recipe (if topic.recipe || topic.recipeHint) ×3 retries
   │
   ├─ 4. Skip if a Newsletter already exists for (practiceId, topicId)
   │
   └─ 5. createNewsletterForTopic(practice, topic)                       [PER-PRACTICE]
         ├─ Create draft Newsletter row (to get an ID for logging/costs)
         ├─ Step 1: Article Summaries ×3   (Promise.allSettled)
         ├─ Step 2: Content Writers        (Tips, Facts, Joke, Trivia — Promise.allSettled)
         ├─ Step 3: Main Article           (10 internal sub-steps incl. image)
         ├─ Step 4: Day-specific content   (Kids Snack / Recipe-derived / Tech-Free Activity + Kids Article)
         ├─ Step 5: Email metadata         (subject line + preview text)
         ├─ Step 6: Email summary          (only if practice.defaultSendMode == 'summary')
         ├─ Update Newsletter with all fields
         └─ validateNewsletter() → log completion %
```

---

## 2. Data Model

### `ContentTopic` (the input + shared content)

The calendar feeds these. Key input fields:

| Field | Meaning |
|---|---|
| `date` | The day this topic/newsletter is for |
| `topic` | The main subject line of the edition (drives the main article) |
| `bullet1`, `bullet2`, `bullet3` | The three sub-angles. Each bullet drives one **Article Summary** (web research) |
| `recipeHint` / `recipe` | Recipe topic. `recipe` is the new calendar field; `recipeHint` is legacy. Either triggers recipe generation |
| `dayType` | `"Monday"`, `"Wednesday"`, or `"Friday"` — controls day-specific content |
| `kidsSnack` | Snack idea string (Mondays) |
| `techFreeActivity` | Activity idea string (Fridays) |
| `isTest` | Excludes test topics from production runs |
| `practiceId` | **`null` for global topics.** Production reads only global topics |

Shared content written back to the topic by research: `ytVideoUrl`, `ytThumbnail480px`, `ytVideoTitle`, `ytThumbnailS3Url`, `ytManualInputRequired`, `recipeIntro`, `recipeIngredients`, `recipeInstructions`, `recipeImageUrl`, `recipeImageFilename`.

### `Newsletter` (the output)

One row per `(practiceId, contentTopicId)` — enforced by a unique constraint. Holds all per-practice content fields (main article, 3 article summaries, 4 tips, 4 facts, trivia Q/A, joke, kids snack, tech-free activity, 3 age-tier kids articles, email metadata). Starts as `status: 'draft'`, `sendMode: 'full_email'`.

> **Nuance — day-to-age mapping.** Mondays → `kidsArticleYoung` (4–8), Wednesdays → `kidsArticleOlder` (8–12), Fridays → `kidsArticleTeen` (13–17). Only the field matching the topic's `dayType` is populated.

---

## 3. Prompt & Model Configuration System

Every AI step is parameterized by two database-backed lookups:

### 3.1 Prompts — `SystemPrompt` table

All prompts live in the `SystemPrompt` table, keyed by a string `key` (e.g. `article_writer_system`). Service code fetches the row at runtime, then does literal `{{variable}}` substitution via regex. **If a prompt key is missing, the step throws** ("… not configured. Please configure it in Admin > Newsletter Prompts.").

- Seeded by `prisma/seed.ts` (main article, summaries, content writers, recipe, URL selector, YouTube query) and `scripts/seed-research-prompts.ts` (kids article researcher, tech-free activity researcher).
- Editable live in **Admin → Newsletter Prompts**.
- Variable syntax: `{{variableName}}`. There is also a special token `{{ $now.year }}` replaced with the current calendar year in the content-writer prompts.

> **Nuance — some prompts are hard-coded, not DB-backed.** The **email metadata** (subject line + preview text) and **email summary** prompts are inline string literals in their service files (`email-metadata-generator.ts`, `newsletter-summarizer.ts`), not in `SystemPrompt`. They cannot be edited from the admin UI.

### 3.2 Models — `AiModelConfig` table + `DEFAULT_MODELS`

Each step has a `step` key resolved by `getModelForStep(step)` (`lib/ai-model-resolver.ts`): it looks up `AiModelConfig` by step, and falls back to the hard-coded `DEFAULT_MODELS` map if no row exists. Default model assignments:

| Step key | Provider | Default model |
|---|---|---|
| `youtube_query` | google_gemini | gemini-2.5-flash-lite |
| `article_url_selector` | google_gemini | gemini-2.5-flash-lite |
| `article_summarizer_1/2/3` | openrouter | anthropic/claude-3.5-sonnet |
| `tips_writer`, `facts_writer`, `joke_writer`, `trivia_writer` | openrouter | anthropic/claude-3.5-sonnet |
| `recipe_researcher` | google_gemini | gemini-2.5-pro |
| `recipe_writer`, `recipe_image_prompt` | openrouter | anthropic/claude-3.5-sonnet |
| `recipe_image` | fal_ai | flux-pro/v1.1-ultra |
| `kids_snack_researcher` | google_gemini | gemini-2.5-pro |
| `kids_snack_writer`, `kids_snack_image_prompt` | openrouter | anthropic/claude-3.5-sonnet |
| `kids_snack_image` | fal_ai | flux-pro/v1.1-ultra |
| `tech_free_activity_researcher` | google_gemini | gemini-2.5-pro |
| `tech_free_activity_writer` | openrouter | anthropic/claude-3.5-sonnet |
| `kids_article_researcher` | google_gemini | gemini-2.5-pro |
| `kids_article_writer` | openrouter | anthropic/claude-3.5-sonnet |
| `article_outline` | google_gemini | gemini-2.5-pro |
| `article_intro` | google_gemini | gemini-2.5-pro |
| `article_faq` | google_gemini | gemini-2.5-flash |
| `article_faq_facts` | google_gemini | gemini-2.5-pro |
| `article_facts` | google_gemini | gemini-2.5-pro |
| `article_writer` | openrouter | anthropic/claude-3.5-sonnet |
| `article_image_prompt` | openrouter | anthropic/claude-3.5-sonnet |
| `article_image` | fal_ai | flux-pro/v1.1-ultra |

Email metadata + summary always use `gemini-2.5-flash-lite` (hard-coded, not resolved via `AiModelConfig`).

**Provider clients** (`createLLMCompletion`, `createGeminiCompletion`):
- **Gemini**: optional Google Search grounding (`useGoogleSearch: true`) is used in all research/outline steps. Built-in 429 retry: up to 5 attempts, 60s apart.
- **OpenRouter / OpenAI / Anthropic**: unified via `createLLMCompletion`. Default `temperature 0.7`, `max_tokens 4096`; writers override to `0.75`. Same 5×60s 429 retry.

### 3.3 Cross-cutting reliability primitives

- **`retryWithBackoff`** (`lib/llm-utils`): wraps LLM calls that must return valid JSON. `maxAttempts: 3`, `initialDelayMs: 1000` (exponential). Used by every "writer" step.
- **`parseLLMJsonResponse` + `validateRequiredFields`**: strip code fences / surrounding quotes, parse JSON, and assert the required keys exist — otherwise it throws and triggers a retry.
- **`trackAiStepCost`**: every model call logs provider, model, token counts, duration, and links to `testRunId` and/or `newsletterId` for per-newsletter cost accounting.
- **`createLogger` / `ProcessLogger`**: structured step logging tied to the run.

> **Nuance — writing style as a variable.** Per-practice voice is injected via `{{writingStyle}}` and `{{targetAudience}}`. These come from `practice.writingStyle` / `practice.targetAudience`, falling back to system defaults from `SystemConfig` (`default_writing_style`, `default_target_audience`) via `getDefaults()`. A practice with **no** writing style and **no** configured default causes generation to throw. (The top-level `generateNewslettersForPractice` additionally hard-aborts up front if `practice.writingStyle` is unset.)

---

## 4. Orchestration Detail

### 4.1 `generateNewslettersForPractice(practiceId, days)`

1. **Load practice.** Abort if not found, or if `writingStyle` is empty.
2. **Date range.** `getTopicDateRange(days)` → `[start of today, end of today+days]`.
3. **Load topics.** `ContentTopic` where `practiceId: null`, `isTest: false`, `date` in range, ordered ascending. Abort if none ("Please upload content calendar").
4. **Per-topic loop.** For each topic, accumulate into a result object (`topicsProcessed`, `topicsNeedingResearch`, `newslettersCreated`, `errors[]`). Errors on one topic are caught and pushed to `errors[]`; the loop continues. The run is `success` only if `errors.length === 0`.

For each topic:
- **Completeness check** via `isTopicContentComplete(topic)`. If incomplete → generate shared research (§5). If research throws, the topic is skipped (error logged).
- **Duplicate guard.** If a `Newsletter` already exists for `(practiceId, topicId)`, skip.
- **Create** via `createNewsletterForTopic(practice, topic)` (§6).

There is also a single-topic wrapper, `generateNewsletter(practiceId, topicId)`, used by regeneration/admin tooling. It performs the same research-then-create flow for one topic, and only **throws on missing required content** (recipe when a recipe hint exists); a missing YouTube video is **non-fatal** (newsletter proceeds without video).

---

## 5. Shared Research Content (once per topic)

`generateTopicResearchContent(topicId, practiceId?, testRunId?)` → updates and returns the `ContentTopic`.

### 5.1 YouTube research (required-ish)

Goal: find one relevant, high-quality video. Two phases, each with 3 retries and exponential backoff (2s, 4s, 8s):

**Phase 1 — AI-generated query** (`researchYouTubeVideo`):
1. **Generate search query** — `youtube_query` step (Gemini Flash Lite, no Google Search).
   - Prompt key `youtube_query_generator`, variable `{{topic}}`:
     > *"To find the best, highest quality, and most informative video for the topic "{{topic}}", what would be the best YouTube query to use to find the most valuable videos on YouTube for chiropractic patients? I want to find chiropractic, osteopathic, or exercise information. ONLY return the search query, nothing else. No explanation. No commentary."*
2. **Search YouTube** via **Oxylabs** `youtube_search` source (`duration: '4-20'`, `hd: true`).
3. **Extract** the first video: `videoId` → `https://www.youtube.com/watch?v=<id>`, thumbnail (`thumbnails[1]` preferred, else `[0]`), and title. Throws if any of the three is missing.

**Phase 2 — raw topic title** (`searchYouTubeDirectly`): if all Phase-1 attempts fail, retry the Oxylabs search using the literal `topic.topic` string as the query (skips AI query generation), again ×3.

**Outcome handling:**
- If a video is found → save URL/thumbnail/title; `ytManualInputRequired = false`.
- If **all** attempts fail → `ytManualInputRequired = true`. The topic is then considered "complete enough" (`isTopicContentComplete` treats "marked for manual input" as satisfying the YouTube requirement) so newsletter creation isn't blocked; a human supplies the video later.

**Thumbnail to S3.** If a thumbnail exists, it is downloaded and re-uploaded to S3 (`uploadYouTubeThumbnailToS3`) → `ytThumbnailS3Url`. Failure is non-fatal (keeps original URL). Skipped silently if S3 isn't configured.

### 5.2 Recipe (conditional)

Runs only if `topic.recipe || topic.recipeHint`. Up to 3 attempts with exponential backoff. `generateRecipe(recipeHint, topicId, practiceId|'system', date)` is a 7-step sub-pipeline:

1. **Research recipes** — `recipe_researcher` (Gemini 2.5 Pro **with Google Search**). Prompt `recipe_researcher`, variable `{{recipeHint}}`. Acts as a "world-class chef" and returns **3 related recipe ideas** (`## Recipe 1/2/3`) to fuse, in a Gordon-Ramsay-style direction.
2. **Write recipe** — `recipe_writer` (Claude 3.5 Sonnet, temp 0.75). System prompt `recipe_writer_system` (variables `{{recipeHint}}`, `{{recipeResearch}}`, `{{previousRecipeTitles}}`), user prompt `recipe_writer_user` (`"Write the recipe based on the context provided in the system prompt."`).
   - **Uniqueness:** `getPreviousRecipeTitles()` pulls the last 100 non-test recipe `<h2>` titles and injects them, instructing the model to avoid repeats.
   - **Hard dietary rules** in the system prompt: never mention Gordon Ramsay by name; never cook/bake avocado (raw only); always recommend avocado oil / coconut oil / butter for medium-high heat, never olive oil.
   - Output is strict JSON: `recipe_intro`, `recipe_ingredients`, `recipe_instructions` (HTML using only `<h2>/<ul>/<ol>/<li>/<p>`, no `<body>`/`<article>`).
3. **Image prompt** — `recipe_image_prompt` (Claude, temp 0.7). Prompt `recipe_image_prompt_generator`, variable `{{recipeContent}}`. Produces a photo-realistic, text-free, people-free Flux prompt.
4. **Filename** — `<practiceId>-<YYYY_MM_DD>-<recipeHint>-<timestamp>-recipe_img`.
5. **Image** — Fal.ai `flux-pro/v1.1-ultra`, `16:9`, `720px`, JPEG, 1 image. 3 attempts (2s backoff).
6. **S3 upload** — `uploadRecipeImageToS3`; non-fatal on failure (keeps Fal URL).

Results saved to the topic: `recipeIntro`, `recipeIngredients`, `recipeInstructions`, `recipeImageUrl`, `recipeImageFilename`.

> **Nuance — required vs optional shared content.** `isTopicContentComplete` requires a YouTube video **or** the manual-input flag, plus (only if `recipeHint` set) all three recipe fields. YouTube being unfound is tolerated via the manual flag; a missing recipe when a hint exists is a genuine blocker in the single-topic `generateNewsletter` path.

---

## 6. Per-Practice Content — `createNewsletterForTopic`

Resolves `writingStyle` / `targetAudience` (practice value or default), then **creates a draft `Newsletter` row first** so every downstream AI call can attach costs/logs to the real newsletter ID. Then runs the steps below. Each step is fault-tolerant: a failed component leaves its fields `null` rather than aborting the whole newsletter.

### Step 1 — Article Summaries (×3)

For each non-empty bullet, `researchArticle(bullet, writingStyle, targetAudience, index, _, newsletterId)` runs **in parallel** via `Promise.allSettled` (a rejected summary just becomes `null`). Each summary is an 8-step web-research pipeline:

1. **Google search** (Oxylabs `google_search`, `geo: California,United States`, `parse: true`, `pages: 4`) for the bullet text → collect organic URLs.
2. **Filter URLs**: keep only `.com`, drop social/aggregator domains (youtube, facebook, instagram, medium, linkedin, twitter/x, tiktok, pinterest, reddit, snapchat, whatsapp).
3. **Validate URLs**: Oxylabs `universal` fetch must return HTTP 200. Stop at 10 valid URLs.
4. **Select best URL** — `article_url_selector` (Gemini Flash Lite, no Search). Prompt `article_url_selector` (`{{bulletPoint}}`, `{{urlCount}}`, `{{urls}}`): pick the single highest-quality, most-educational URL for chiropractic patients; **return only the URL**. (If it returns something not in the list, fall back to URL #1.)
6. **Scrape** the chosen URL (Oxylabs `universal`).
7. **Extract content**: regex-pull `<h1/h2/h3/p/li>` into a normalized text block (`# Article Title:`, `## Article Subtitle:`, paragraphs, `- ` list items).
8. **Summarize** — `article_summarizer_<index>` (Claude 3.5 Sonnet) wrapped in `retryWithBackoff`.
   - System prompt `article_summarizer_system` (`{{writingStyle}}`, `{{targetAudience}}`, `{{articleIndex}}`): a 30-year-veteran chiropractic newsletter writer; 5th-grade reading level; single quotes only; strict JSON-only output.
   - User prompt `article_summarizer_user` (`{{bulletPoint}}`, `{{articleContent}}`, `{{articleIndex}}`): write a **3-paragraph teaser (≈50 words each)** plus **1 punchy CTA paragraph**, focusing only on content after `# Article Title:`.
   - Output JSON: `article_<i>_title`, `article_<i>_body` (HTML `<p>` only), `article_<i>_cta` (HTML `<p>` only).
   - Returns `{ link, title, body, cta }` (link = selected URL).

The three results form a `contentContext` (topic, bullets, and each summary's title+body) passed to the content writers and main article.

> **Nuance — step numbering.** The summarizer logs "Step 4/6/7/8" with no Step 5 — step 5 was a removed validation pass; the numbering is historical.

### Step 2 — Content Writers (Tips, Facts, Trivia, Joke)

All four run **in parallel** (`Promise.allSettled`), each Claude 3.5 Sonnet, temp 0.75, `retryWithBackoff`, strict JSON. Each has a `*_system` and `*_user` prompt. Shared variables: system prompt gets `{{writingStyle}}`, `{{targetAudience}}`, `{{ $now.year }}`; user prompt gets `{{topic}}`, `{{bullet1..3}}`, and `{{article1..3Title}}` / `{{article1..3Body}}`.

| Writer | Step key | Output keys | Key constraints |
|---|---|---|---|
| **Tips** | `tips_writer` | `tip_1..4` | Exactly 4 tips, each ≤ 25 words, punchy; single quotes only |
| **Facts** | `facts_writer` | `fact_1..4` | Exactly 4 "Did You Know" facts, each ≤ 50 words; don't mention the year in every fact |
| **Joke** | `joke_writer` | `joke` (HTML `<p>` × 2) | "Joke of the Day" written **in the style of George Carlin**; must be very funny |
| **Trivia** | `trivia_writer` | `trivia_question`, `trivia_answer` | Suspenseful question; answer must **not** mention "newsletter" or the edition |

All four "writer" system prompts share the same voice scaffold: "expert writer for a chiropractor with 30 years' experience," visceral/real-life/simple language, 5th-grade reading level, vary grammar per paragraph, correct punctuation, single quotes only, JSON-only output starting with `{` and ending with `}`.

### Step 3 — Main Article (10 internal sub-steps)

`generateArticle(newsletterId, practiceId, topic, bullet1..3, date, article1..3Title/Body, writingStyle, targetAudience, …)`. This is the centerpiece and chains research → writing → image:

1. **Outline** — `article_outline` (Gemini 2.5 Pro **+ Google Search**). Prompt `article_outline_generator` (`{{topic}}`, `{{bullet1..3}}`, `{{targetAudience}}`): a detailed, "People-First"/Helpful-Content-compliant outline for a **Rich-Schefren-style ~750-word report**. Returns only the outline.
2. **Intro** — `article_intro` (Gemini 2.5 Pro **+ Google Search**). Prompt `article_intro_generator` (`{{articleOutline}}`, `{{writingStyle}}`): a "search-intent introduction" that hooks the reader; plain text, no bold/italic/quotes.
3. **FAQs** — `article_faq` (Gemini 2.5 **Flash** + Search). Prompt `article_faq_generator` (`{{articleOutline}}`, `{{articleTopic}}`): find **4 "People Also Ask" questions**.
4. **FAQ facts** — `article_faq_facts` (Gemini 2.5 Pro + Search). Prompt `article_faq_facts_generator` (`{{articleFAQs}}`): **2 facts/stats with sources per FAQ question**.
5. **Article facts** — `article_facts` (Gemini 2.5 Pro + Search). Prompt `article_facts_generator` (`{{articleOutline}}`): **2 facts/stats with sources per outline section**.
6. **Write article** — `article_writer` (Claude 3.5 Sonnet, **temp 0.75**, `retryWithBackoff`).
   - System prompt `article_writer_system`: the long "write like a human" guide — high perplexity/burstiness, factual accuracy (no hallucinations, stick to provided data), conversational tone, **a large banned-phrase list** (AI/marketing clichés like "in today's fast-paced world," "unlock the potential," "tapestry," "robust," etc.), no ALL-CAPS in the body, and a deliberately quirky instruction to *add a few spelling/grammar imperfections* to read human.
   - User prompt `article_writer_user` (`{{topic}}`, `{{article1..3Title/Body}}`, `{{articleFacts}}`, `{{articleOutline}}`, `{{articleFAQs}}`, `{{faqFacts}}`, `{{articleIntro}}`, `{{writingStyle}}`): write a **500–750 word** educational article using the topic as the angle, weaving in the facts and FAQ answers, opening from the search-intent intro, never referencing the summary articles directly.
   - Output JSON: `article_teaser` (≈50-word plain text), `article_title` (≤5 words plain text), `article_tldr` (≈12-word plain text), `article_body` (HTML using only `<h2>/<ul>/<li>/<p>`, no title, no `<body>`/`<article>`).
7. **Image prompt** — `article_image_prompt` (Claude, temp 0.7). Prompt `article_image_prompt_generator` (`{{articleIntro}}`): photo-realistic, text-free, people-free, "home improvement magazine" style, for Flux Pro v1.1 Ultra.
8. **Filename** — `<practiceId(first 8 chars)>-<YYYY_MM_DD>-<topic>-<timestamp>-article_img`.
9. **Image** — Fal.ai `flux-pro/v1.1-ultra`, `16:9`, `720px`, JPEG, 1 image (3 attempts, 2s backoff).
10. **S3 upload** — `uploadArticleImageToS3`; non-fatal (falls back to Fal URL).

Returns `article_teaser/title/tldr/body`, `article_image_url` (S3 or Fal), `article_image_filename`.

> **Nuance — heavy Gemini usage.** Five of the article's sub-steps call Gemini with live Google Search grounding, so the main article is the most token- and latency-expensive part of a newsletter, and the most exposed to Gemini 429 rate limits (mitigated by the 5×60s retry in `createGeminiCompletion`).

### Step 4 — Day-Specific Content

Driven by `topic.dayType`. All wrapped in `try/catch`; failure leaves the field(s) `null`.

- **Monday → Kids Snack** (if `topic.kidsSnack`): `generateKidsSnack(snackHint, practiceId, date)` — a 7-step pipeline mirroring the recipe one:
  1. Research — `kids_snack_researcher` (Gemini 2.5 Pro + Search), prompt `kids_snack_researcher` (`{{snackHint}}`).
  2. Write — `kids_snack_writer` (Claude, temp 0.75). System `kids_snack_writer_system` (`{{snackHint}}`, `{{snackResearch}}`, `{{previousSnackTitles}}`), user `kids_snack_writer_user`. Uniqueness via last-100 `kidsSnackIntro` `<h2>` titles. Output: `kids_snack_intro/ingredients/instructions`.
  3–6. Image prompt (`kids_snack_image_prompt`) → filename → Fal image → S3.
  Saved: `kidsSnackIntro/Ingredients/Instructions/ImageUrl/ImageFilename`.
- **Friday → Tech-Free Activity** (if `topic.techFreeActivity`): `generateTechFreeActivity(activityHint)` — 2 steps, **no image**:
  1. Research — `tech_free_activity_researcher` (Gemini 2.5 Pro + Search), prompt `tech_free_activity_researcher` (`{{activityHint}}`).
  2. Write — `tech_free_activity_writer` (Claude, temp 0.75). System/user prompts with `{{activityHint}}`, `{{research}}`, `{{previousActivityTitles}}` (uniqueness from last-100 `techFreeActivityIntro` titles). Output: `tech_free_activity_intro/materials/instructions`.
- **Any day with an article body → Kids Article**: `generateKidsArticleForDayType(topic, articleBody, dayType)` maps `dayType` → age group (Mon=young 4–8, Wed=older 8–12, Fri=teen 13–17; other days → skipped):
  1. Research — `kids_article_researcher` (Gemini 2.5 Pro + Search), prompt `kids_article_researcher` (`{{topic}}`, `{{ageGroup}}`, `{{ageRange}}`): age-appropriate, safe, accurate facts.
  2. Write — `kids_article_writer` (Claude, temp 0.7). System `kids_article_writer_system` + user `kids_article_writer_user` (`{{ageGroup}}`, `{{ageRange}}`, `{{topic}}`, `{{mainArticleBody}}`, `{{research}}`): rewrite the main article topic for that age group. Output: `kids_article`.
  Saved to `kidsArticleYoung` / `kidsArticleOlder` / `kidsArticleTeen` based on the day.

> **Nuance — Wednesday recipe.** The Wednesday "Family Recipe" itself is part of **shared** research (§5.2, on the `ContentTopic`), not generated here. Step 4 on Wednesday only adds the older-kids article; the recipe is reused from the topic.

> **Nuance — `kids_snack_researcher` / writer prompts are not in the committed seeds.** `seed.ts` seeds article/summary/content-writer/recipe prompts; `seed-research-prompts.ts` seeds the kids-article and tech-free-activity researchers. The kids-snack prompts and the kids-article/tech-free *writer* prompts must already exist in the DB (seeded elsewhere or added via admin) or those steps throw and the fields stay `null`.

### Step 5 — Email Metadata

`generateEmailMetadata(topic)` — always runs. Uses **Gemini 2.5 Flash Lite** with two **inline (non-DB) prompts**, input = topic only (not full content):
- **Subject line**: 40–60 chars, keyword-rich, curiosity-driven, no spam triggers, no emojis. → `subjectLine`.
- **Preview text**: 80–100 chars, complements (doesn't repeat) the subject, ends with a benefit/CTA, no emojis. → `previewText`.

Length is checked and warned-on but not enforced.

### Step 6 — Email Summary (conditional)

Only if `practice.defaultSendMode === 'summary'`. `generateNewsletterSummary(input, practice)` — **Gemini 2.5 Flash Lite**, inline prompt. Builds a highlights list (main article title + day-specific items + the kids-article age focus) and writes a **2-paragraph, 120–150-word plain-text** summary: paragraph 1 summarizes, paragraph 2 drives urgency and **must end with "Read the full newsletter in our community →"** (the actual link is added programmatically downstream). → `emailSummary`. For `full_email` practices this step is skipped.

### Final write + send mode

All collected fields are written to the `Newsletter` in one `update`, and `sendMode` is set from `practice.defaultSendMode`.

---

## 7. Validation

After the update, `validateNewsletter(newsletter, topic)` (`lib/newsletter-validation.ts`) scores completeness. Components checked: the 3 article summaries (title+body+link), tips (4), facts (4), trivia (Q+A), joke, main article (title/body/teaser/tldr), YouTube (url/title/thumbnail on the topic), and recipe (only if `recipeHint`). Each has presence checks plus minimum-length **quality checks** (e.g. main article body ≥ 200 chars, tips/facts ≥ 20 chars).

Returns `{ isValid, completionPercentage, missingComponents, incompleteComponents, qualityIssues }`. The production path **logs** this but does not block — a partially complete newsletter is still saved as a draft for human review. `isNewsletterReadyForDelivery` (validity + 100%) is the stricter gate used elsewhere.

> **Nuance — what validation does and doesn't cover.** It does not validate day-specific content (kids snack/article, tech-free activity), email metadata, or the summary — those are best-effort. Completion % is the ratio of fully-complete components to applicable components.

---

## 8. Error Handling, Cost & Idempotency Summary

- **Idempotency:** the `(practiceId, contentTopicId)` unique constraint + the explicit existing-newsletter check prevent duplicates. Re-running a generation skips topics that already have a newsletter.
- **Graceful degradation:** article summaries and content writers use `Promise.allSettled`; day-specific/metadata/summary steps use `try/catch`. Any single component can fail to `null` without killing the newsletter. Only the main-article `generateArticle` throwing (after its own 3× retry) would abort `createNewsletterForTopic` for that topic.
- **Retries:** JSON writers retry 3× (1s backoff); image generation 3× (2s); Gemini/LLM 429s retry 5× (60s); YouTube and recipe research retry 3× (2/4/8s) at the research orchestration level.
- **Cost tracking:** every model call records tokens/duration/cost against the newsletter via `trackAiStepCost`. (The **enhanced** generation service additionally enforces a per-newsletter cost limit and emits completion/cost-limit notifications; the production service does neither.)
- **Logging:** verbose `console.log` per sub-step plus structured `ProcessLogger` entries tied to `testRunId`/`newsletterId`.

---

## 9. Appendix — Step → Prompt Key → Model Map

| Pipeline stage | Step key | Prompt key(s) | Default model | Google Search |
|---|---|---|---|---|
| YT query | `youtube_query` | `youtube_query_generator` | gemini-2.5-flash-lite | no |
| YT search | — | (Oxylabs, no LLM) | — | — |
| Recipe research | `recipe_researcher` | `recipe_researcher` | gemini-2.5-pro | yes |
| Recipe write | `recipe_writer` | `recipe_writer_system` / `_user` | claude-3.5-sonnet | no |
| Recipe image prompt | `recipe_image_prompt` | `recipe_image_prompt_generator` | claude-3.5-sonnet | no |
| Recipe image | `recipe_image` | — | flux-pro/v1.1-ultra | — |
| Summary search/scrape | — | (Oxylabs, no LLM) | — | — |
| Summary URL select | `article_url_selector` | `article_url_selector` | gemini-2.5-flash-lite | no |
| Summary write ×3 | `article_summarizer_1/2/3` | `article_summarizer_system` / `_user` | claude-3.5-sonnet | no |
| Tips | `tips_writer` | `tips_writer_system` / `_user` | claude-3.5-sonnet | no |
| Facts | `facts_writer` | `facts_writer_system` / `_user` | claude-3.5-sonnet | no |
| Joke | `joke_writer` | `joke_writer_system` / `_user` | claude-3.5-sonnet | no |
| Trivia | `trivia_writer` | `trivia_writer_system` / `_user` | claude-3.5-sonnet | no |
| Article outline | `article_outline` | `article_outline_generator` | gemini-2.5-pro | yes |
| Article intro | `article_intro` | `article_intro_generator` | gemini-2.5-pro | yes |
| Article FAQs | `article_faq` | `article_faq_generator` | gemini-2.5-flash | yes |
| Article FAQ facts | `article_faq_facts` | `article_faq_facts_generator` | gemini-2.5-pro | yes |
| Article facts | `article_facts` | `article_facts_generator` | gemini-2.5-pro | yes |
| Article write | `article_writer` | `article_writer_system` / `_user` | claude-3.5-sonnet | no |
| Article image prompt | `article_image_prompt` | `article_image_prompt_generator` | claude-3.5-sonnet | no |
| Article image | `article_image` | — | flux-pro/v1.1-ultra | — |
| Kids snack research | `kids_snack_researcher` | `kids_snack_researcher` | gemini-2.5-pro | yes |
| Kids snack write | `kids_snack_writer` | `kids_snack_writer_system` / `_user` | claude-3.5-sonnet | no |
| Kids snack image | `kids_snack_image_prompt` → `kids_snack_image` | `kids_snack_image_prompt_generator` | claude-3.5-sonnet → flux | no |
| Tech-free research | `tech_free_activity_researcher` | `tech_free_activity_researcher` | gemini-2.5-pro | yes |
| Tech-free write | `tech_free_activity_writer` | `tech_free_activity_writer_system` / `_user` | claude-3.5-sonnet | no |
| Kids article research | `kids_article_researcher` | `kids_article_researcher` | gemini-2.5-pro | yes |
| Kids article write | `kids_article_writer` | `kids_article_writer_system` / `_user` | claude-3.5-sonnet | no |
| Subject line | `subject_line_generator` | inline (hard-coded) | gemini-2.5-flash-lite | no |
| Preview text | `preview_text_generator` | inline (hard-coded) | gemini-2.5-flash-lite | no |
| Email summary | `newsletter_summarizer` | inline (hard-coded) | gemini-2.5-flash-lite | no |

---

## 10. Key Source Files

| Concern | File |
|---|---|
| API entry | `app/api/newsletters/generate/route.ts` |
| Orchestration (production) | `lib/services/newsletter-generation.ts` |
| Orchestration (enhanced, unused by `/generate`) | `lib/services/newsletter-generation-enhanced.ts` |
| Shared research (YouTube + recipe) | `lib/services/content-research.ts` |
| YouTube research | `lib/services/youtube-research.ts` |
| Recipe | `lib/services/recipe-writer.ts` |
| Article summaries | `lib/services/article-research.ts` |
| Content writers | `lib/services/content-writers.ts` |
| Main article | `lib/services/article-writer.ts` |
| Kids snack | `lib/services/kids-snack-writer.ts` |
| Tech-free activity | `lib/services/tech-free-activity-writer.ts` |
| Kids article | `lib/services/kids-article-writer.ts` |
| Email metadata | `lib/services/email-metadata-generator.ts` |
| Email summary | `lib/services/newsletter-summarizer.ts` |
| Validation | `lib/newsletter-validation.ts` |
| Topic completeness utils | `lib/newsletter-utils.ts` |
| Model/prompt resolver | `lib/ai-model-resolver.ts` |
| Prompt seeds | `prisma/seed.ts`, `scripts/seed-research-prompts.ts` |
| Schema | `prisma/schema.prisma` (`ContentTopic`, `Newsletter`) |
