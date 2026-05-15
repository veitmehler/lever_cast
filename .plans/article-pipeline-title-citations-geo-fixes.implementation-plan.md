# Article Pipeline — Title Alignment, Citations & GEO Fixes — Implementation Plan

> **Status:** v1.0 — implementation-ready
> **Scope:** Four independent fixes that can be implemented and deployed incrementally
> **Prerequisite:** Current main branch deployed with Article Quality Fixes (commit `0a13919`)

---

## 0. Goals & Success Criteria

| Outcome | Verification |
|---|---|
| `{{title}}` resolves to Step 0 output in all pipeline steps | Use `{{title}}` in any prompt; verify it injects the Step 0 title string |
| Article H1, schema `headline`, and review panels all show the same canonical title | Inspect enriched article, schema JSON, and both review copy-paste areas |
| Step 13 only rewrites the title when it exceeds 60 characters | Run an article where Step 0 title is ≤60 chars; verify `seoTitle` is identical |
| Inline citation links survive enrichment | Inspect enriched `bodyHtml` — each citation URL appears in at least one `<a>` tag |
| GEO question headings are never truncated | Inspect enriched article ToC and H2s — all questions end with `?` and are complete sentences |

---

## 1. Fix A — `{{title}}` Variable for All Steps

### 1.1 Problem

There is no `case 'title':` handler in `variable-resolver.ts`. When any prompt uses `{{title}}`, the resolver falls through to the `default:` block, which only handles variables ending in `_output`. Since `title` does not end in `_output`, it silently resolves to an empty string.

This means every prompt that references `{{title}}` receives an empty string — the LLM has no canonical title and generates its own.

### 1.2 Changes

#### A1. Add `case 'title':` to the variable resolver

**File:** `apps/api/src/article-pipeline/variable-resolver.ts`

In the `resolveVariable` switch statement, add a new case immediately after the `case 'topic':` block (around line 110):

```typescript
case 'title':
  return ctx.completedSteps.get(0) ?? ''
```

**Why Step 0:** Step 0 (`generate_title`) produces the canonical article title — an SEO-optimized H1 that is the foundation for everything downstream. Its output is always present in `ctx.completedSteps` by the time any subsequent step runs, because:
- In Phase A: `executor.ts` runs steps sequentially from 0 upward
- In Phase B (approval): `approval-service.ts` loads all completed Phase A steps into `ctx.completedSteps` before running Steps 13–18
- In Phase C (enrichment): `enrichment/index.ts` does not use Step 0 directly, but if it ever needed to it would be available via a DB load

**No database migration needed.** This is a pure code change.

### 1.3 Impact on existing prompts

Any prompt that already uses `{{title}}` was silently getting an empty string. After this fix they will get the Step 0 title. Review all prompt templates (via `/admin/prompts`) to ensure they reference `{{title}}` wherever the canonical title is needed — particularly Steps 9, 13, and 16.

---

## 2. Fix B — Title Alignment Across Article, Schema, and Review Panels

### 2.1 Problem

Currently four different title values exist and can all diverge:

| Source | Variable | Current issue |
|---|---|---|
| Step 0 — `generate_title` | `{{title}}` | Not accessible (fixed in Fix A) |
| Step 9 — `write_article` | None — LLM chooses its own H1 | LLM paraphrases freely |
| Step 13 — `generate_seo_metadata` | produces `metaTitle` | Always generates a new title from scratch, ignoring Step 0 |
| Step 16 — `generate_schema_markup` | `{{article_title}}` → `sitePage.seoTitle` | Inherits Step 13's diverged title |

The result: the article H1, the SEO title, and the schema `headline` can all be different strings.

**Desired state:** Step 0 title is canonical. Step 13 uses it verbatim unless it exceeds 60 characters, in which case it shortens it. Schema and review panels inherit the result automatically.

### 2.2 Changes

#### B1. Step 9 prompt — instruct LLM not to write an H1

**Action:** Update the Step 9 (`write_article`) prompt in the database (via `/admin/prompts/9` or `reseed-prompts-v3.ts`).

Add to the `## Formatting:` section of the Step 9 user prompt:

```
- Do NOT include an H1 title. The article title is managed separately. Start the article content directly with the first paragraph or section.
```

Also add a line to the CONTEXT section so the LLM knows what the canonical title is:

```
## Article Title:

{{title}}
```

This ensures the LLM writes content that fits under the canonical title, even though it does not output the title itself.

**Note:** Step 11 already correctly says `"No title needed"` and `"ENSURE the first line of the article is in <p> tags"`. No change needed there.

#### B2. Step 13 prompt — preserve canonical title unless too long

**Action:** Update the Step 13 (`generate_seo_metadata`) prompt in the database.

Add to the CONTEXT section:

```
## ARTICLE TITLE:

{{title}}
```

Replace the current TASK section with:

```
# TASK:

1. Review the ARTICLE TITLE, PRIMARY KEYWORD, and SEARCH INTENT INTRO in your CONTEXT.

2. Generate SEO metadata:

## Meta Title:
- Use the ARTICLE TITLE as the Meta Title exactly as provided.
- ONLY shorten or rewrite it if it exceeds 60 characters. In that case, condense it to 50-60 characters while keeping the primary keyword and preserving the core meaning as closely as possible.
- If the ARTICLE TITLE is already 60 characters or fewer, use it verbatim — do NOT rephrase or optimize it.

## Meta Description:
- Generate a Meta Description (150-160 characters, compelling, include primary keyword and CTA)
- Make it action-oriented and optimized for click-through rate

## URL Slug:
- Take the Primary Keyword and hyphenate it to create the URL Slug
- SEO-friendly, lowercase, hyphens only
- MAKE SURE the URL slug is the exact PRIMARY KEYWORD hyphenated.

Return as JSON with metaTitle, metaDescription, and urlSlug fields.

CRITICAL: No Commentary. No Explanation. No extra characters.
```

#### B3. Step 16 prompt — use `{{title}}` for schema headline

**Action:** Update the Step 16 (`generate_schema_markup`) prompt in the database.

Change the CONTEXT line:

```
Article Title: {{article_title}}
```

to:

```
Article Title: {{title}}
```

This ensures the schema `headline` is sourced from the Step 0 canonical title, not the `sitePage.seoTitle` (which could be a shortened version).

**Note:** `{{article_title}}` resolves via a DB lookup (`sitePage.seoTitle ?? sitePage.title`). After Fix B2, `sitePage.seoTitle` will usually equal the Step 0 title anyway, but using `{{title}}` directly is more reliable and removes the indirection.

#### B4. `resolveBestTitle` in the workflow UI — align review panels

**File:** `apps/web/src/app/(protected)/workflow/[jobId]/page.tsx`

Currently `resolveBestTitle` returns `sp.seoTitle` (the Step 13 metaTitle) once Step 13 completes. After Fix B2, `sp.seoTitle` will usually equal the Step 0 title (unless it was shortened), so the review panels will naturally align.

No code change is required here as a result of Fix B2. However, if you want the review panels to always show the Step 0 title (even when Step 13 shortened it for SEO), update `resolveBestTitle` to prefer Step 0 output:

```typescript
function resolveBestTitle(
  sp: SitePage,
  pipelineSteps: PipelineStep[],
  isApproving: boolean,
): string {
  // Always prefer Step 0 canonical title
  const step0Output = pipelineSteps.find((s) => s.stepNumber === 0 && s.status === 'completed')?.output?.trim()
  if (step0Output) return step0Output
  // Fall back to seoTitle / title from SitePage
  return sp.seoTitle ?? sp.title ?? ''
}
```

This is optional but recommended if you want the review panels to show the full H1 title rather than a potentially shortened SEO title.

---

## 3. Fix C — Move Inline Citations to Phase A (Step 12.5)

### 3.1 Problem

Currently inline citation insertion (Step 110) runs during Phase B (approval) on clean Step 11 HTML. The result is stored in `SitePage.bodyHtml`. However, `SitePage.originalBodyHtml` is always set to the **un-linked** Step 11 HTML.

Phase C enrichment starts from `originalBodyHtml` (to prevent stale diagrams accumulating on re-runs). This erases all inline citation links. A post-enrichment re-insertion attempt (Fix 1 from the previous plan) fails because the LLM chokes on the large enriched HTML (SVGs + GEO summaries) and its H2 count drops, triggering the safety check that discards its output.

**Root cause:** The wrong HTML (`step11` without links) is stored as `originalBodyHtml`.

**Solution:** Move citation validation and insertion into Phase A, immediately after Step 12 completes, while the HTML is still small and clean. Store the linked HTML as `originalBodyHtml`. Enrichment then inherits the links for free because it only adds content around headings — it never modifies paragraph `<p>` text where `<a>` tags live.

### 3.2 Changes

#### C1. Add Step 12.5 to `executor.ts`

**File:** `apps/api/src/article-pipeline/executor.ts`

After the Step 12 `StepRunner` call completes in the `PHASE_A_STEPS` loop, add a dedicated post-Step-12 block that:

1. Extracts `{ title, url }` pairs from the Step 12 output using `extractCitationsForValidation` (already exists in `approval-service.ts` — extract it to a shared utility or import directly)
2. Calls `validateCitationUrls` (from `citation-validator.ts`)
3. Filters out dead citations
4. Calls `insertInlineCitations` (from `citation-inserter.ts`) on the current Step 11 HTML
5. Stores the linked HTML back into `ctx.completedSteps.set(11, linkedHtml)` so downstream steps and Phase B pick it up correctly

```typescript
// After Step 12 completes inside the PHASE_A_STEPS loop:
if (stepNumber === 12) {
  const step11Html = ctx.completedSteps.get(11) ?? ''
  const rawCitations = extractCitationsForValidation(ctx.completedSteps.get(12) ?? '')
  if (step11Html && rawCitations.length > 0) {
    try {
      logger.info({ jobId, count: rawCitations.length }, '[executor] step 12.5 — validating citation URLs')
      const validated = await validateCitationUrls(rawCitations, jobId)
      const liveCitations = validated.filter((c) => c.status !== 'dead')
      if (liveCitations.length > 0) {
        const { linkedHtml, insertedCount } = await insertInlineCitations(
          step11Html,
          liveCitations,
          jobId,
          ctx,
        )
        ctx.completedSteps.set(11, linkedHtml)
        logger.info({ jobId, insertedCount }, '[executor] step 12.5 — inline citations inserted')
      }
    } catch (err) {
      // Non-fatal — log and continue with un-linked HTML
      logger.warn({ jobId, err }, '[executor] step 12.5 — citation insertion failed, continuing without inline links')
    }
  }
}
```

**Why override Step 11 in `ctx.completedSteps`:** The `{{article}}` variable resolves to `ctx.completedSteps.get(11)`. By updating it in place, Step 110 in Phase B (if it were ever called again) and anything else that reads `{{article}}` automatically gets the linked version. It also means `step11Raw` in `approval-service.ts` (line 201) picks up the linked HTML naturally.

#### C2. Update `approval-service.ts` — store linked HTML as `originalBodyHtml`

**File:** `apps/api/src/article-pipeline/approval-service.ts`

The approval service currently:
- Runs its own citation validation + insertion block (lines 249-282)
- Sets `originalBodyHtml: step11` (the un-linked version)

After Fix C1, the citation insertion already happened in Phase A. The approval service's citation block becomes redundant. Remove it (lines 249-282) and change the SitePage upsert so that `originalBodyHtml` is set from `step11Raw` which now contains the linked HTML (because `ctx.completedSteps.get(11)` was updated in Phase A).

Specifically, in the upsert (lines 297-327), change:

```typescript
originalBodyHtml: step11,  // was always the un-linked version
```

to:

```typescript
originalBodyHtml: articleBodyHtml,  // now the linked version from Phase A
```

Where `articleBodyHtml` is defined as `step11` at the top of the approval flow (line 253). Since Phase A now stores the linked HTML in Step 11's output, `step11Raw` (loaded from `ctx.completedSteps.get(11)`) will already contain the inline links.

Remove the redundant imports from `approval-service.ts` if they are no longer used:
- `validateCitationUrls` (from `citation-validator.ts`)
- `insertInlineCitations` (from `citation-inserter.ts`)

Keep them if Step 110 is still referenced elsewhere in the approval chain.

#### C3. Remove Fix 1 from `enrichment/index.ts`

**File:** `apps/api/src/article-pipeline/enrichment/index.ts`

Remove:

1. The `extractCitationsFromJson` function (lines 861-882)
2. The entire citation re-insertion block inside `finishEnrichment` (lines 899-949) — the `try/catch` that loads `SitePage.citations`, builds a minimal `PipelineContext`, and calls `insertInlineCitations`
3. The now-unused imports at the top: `insertInlineCitations`, `PipelineContext` (type), `ValidatedCitation` (type)

The `finishEnrichment` function simplifies back to:

```typescript
async function finishEnrichment(...): Promise<void> {
  const normalizedHtml = normalizeH2Questions(enrichedHtml)

  await prisma.sitePage.update({
    where: { id: sitePageId },
    data: {
      bodyHtml: normalizedHtml,
      enrichmentStatus: 'completed',
      enrichedAt: new Date(),
      enrichmentError: null,
      keyTakeawaysHtml,
      tocHtml,
    },
  })
  // ... job status update
}
```

#### C4. Move `extractCitationsForValidation` to a shared location

**File:** `apps/api/src/article-pipeline/approval-service.ts` (lines 109-130) — this function currently lives inside `approval-service.ts`.

Since `executor.ts` now also needs it, extract it to a shared utility file. Options:

- Move it to `apps/api/src/article-pipeline/citation-validator.ts` (already imports related logic)
- Or move it to a new `apps/api/src/article-pipeline/citation-utils.ts`

Then import it from both `executor.ts` and `approval-service.ts` (if still needed there).

---

## 4. Fix D — GEO Question Truncation (Thinking Tokens)

### 4.1 Problem

GEO questions generated by Step 102 (`generateQuestionFromKeyword`) use Gemini 2.5 Flash with `maxTokens: 256`. Gemini 2.5 Flash has **thinking enabled by default**. Thinking tokens count against `maxOutputTokens`. With only 256 tokens budgeted, the model uses most of them for internal reasoning and truncates the actual question text mid-sentence.

Examples of truncated questions from the last article run:
- "What is forward head posture and why is it considered a?" (missing "problem")
- "What is a five-minute daily routine that actually?" (missing "works")
- "What are the unexpected realities of the post-natal?" (missing "period")

There is currently **no `thinkingConfig`** anywhere in the codebase. The Gemini adapter builds `generationConfig` with only `temperature`, `maxOutputTokens`, and optional `responseMimeType`. Thinking is silently active.

### 4.2 Changes

#### D1. Add `thinkingBudget` to `LLMCallOptions`

**File:** `apps/api/src/article-pipeline/llm/adapter.ts`

Add an optional field to the interface:

```typescript
export interface LLMCallOptions {
  systemPrompt?: string | null
  userPrompt: string
  model: string
  temperature?: number
  maxTokens?: number
  useGenerativeSearch?: boolean
  jsonMode?: boolean
  /** Set to 0 to disable Gemini thinking entirely for simple generation tasks. */
  thinkingBudget?: number
}
```

#### D2. Apply `thinkingConfig` in the Gemini adapter

**File:** `apps/api/src/article-pipeline/llm/gemini.ts`

In `callStandard`, update `generationConfig`:

```typescript
generationConfig: {
  temperature,
  maxOutputTokens: maxTokens,
  ...(options.jsonMode ? { responseMimeType: 'application/json' } : {}),
  ...(options.thinkingBudget !== undefined
    ? { thinkingConfig: { thinkingBudget: options.thinkingBudget } }
    : {}),
},
```

In `callWithSearch`, update the raw fetch body similarly:

```typescript
generationConfig: {
  temperature,
  maxOutputTokens: maxTokens,
  ...(options.thinkingBudget !== undefined
    ? { thinkingConfig: { thinkingBudget: options.thinkingBudget } }
    : {}),
},
```

#### D3. Disable thinking and double token budget in Step 102

**File:** `apps/api/src/article-pipeline/enrichment/geo-question-generator.ts`

In `generateQuestionFromKeyword`, update the adapter call:

```typescript
adapter.call({
  systemPrompt: sys || undefined,
  userPrompt: usr,
  model,
  temperature: 0.3,
  maxTokens: 512,        // doubled from 256
  thinkingBudget: 0,     // disable thinking for this simple generation task
})
```

Step 103 (`rephraseForUniqueness`) defaults to `gpt-4o-mini` (no thinking), but update it as well defensively in case the prompt template is ever switched to Gemini:

```typescript
adapter.call({
  systemPrompt: t?.systemPrompt ?? null,
  userPrompt: usr,
  model,
  temperature: 0.4,
  maxTokens: 512,
  thinkingBudget: 0,
})
```

---

## 5. Deployment Order

The fixes are independent but the following order minimizes risk:

1. **Fix A** — variable resolver change. Zero user-facing impact. Deploy first.
2. **Fix D** — GEO thinking tokens. Self-contained to two files. Deploy second.
3. **Fix C** — Citation move to Phase A. Touches executor, approval-service, and enrichment. Test with a full article run before deploying. Deploy third.
4. **Fix B** — Prompt updates (done manually in DB via `/admin/prompts`). Apply after Fix A is deployed so `{{title}}` resolves correctly when the updated prompts run.

---

## 6. Task List

### Completed Tasks
- None

### Pending Tasks

- Fix A: Add `case 'title':` handler to `variable-resolver.ts`
- Fix B1: Update Step 9 prompt — add `{{title}}` to context and instruct LLM not to write H1
- Fix B2: Update Step 13 prompt — add `{{title}}` to context, change task to preserve title unless >60 chars
- Fix B3: Update Step 16 prompt — change `{{article_title}}` to `{{title}}`
- Fix B4: Update `resolveBestTitle` in `page.tsx` to prefer Step 0 output
- Fix C1: Add Step 12.5 citation block to `executor.ts` after Step 12 completes
- Fix C2: Update `approval-service.ts` — remove redundant citation block, set `originalBodyHtml: articleBodyHtml`
- Fix C3: Remove Fix 1 (citation re-insertion) from `enrichment/index.ts`
- Fix C4: Move `extractCitationsForValidation` to a shared location (`citation-validator.ts`)
- Fix D1: Add `thinkingBudget?: number` to `LLMCallOptions` in `adapter.ts`
- Fix D2: Apply `thinkingConfig` in Gemini `callStandard` and `callWithSearch`
- Fix D3: Set `maxTokens: 512` and `thinkingBudget: 0` in Step 102 and 103 calls

### Backlog Tasks
- Investigate whether other simple Gemini calls (e.g. diagram type selector, caption generator) would benefit from `thinkingBudget: 0`
- Verify OxyLabs residential proxy is active on next article run (no code change needed)
