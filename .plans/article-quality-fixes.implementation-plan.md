# Article Quality Fixes — Implementation Plan

> **Status: IMPLEMENTED** (audited 2026-07-09) — quality fixes live in the pipeline + quality gate.
> **Estimated effort:** 8–10 hours of focused work
> **Estimated cost increment:** ~$0.001–0.003 per article (one extra LLM call for inline citations) + OxyLabs residential proxy costs (~$0.10/GB, negligible at article scale)
> **Prerequisite:** Current main branch (commit `0a13919`) deployed
> **Scope:** Three independent fixes that can be implemented and deployed incrementally

---

## 0. Goals & Success Criteria

| Outcome | Verification |
|---|---|
| No GEO H2 heading is truncated or missing terminal `?` | Manual review of 3+ enriched articles |
| ToC anchor links have no `geo-` or `sec-` prefixes | Inspect enriched `bodyHtml` in admin — IDs are clean slugs |
| Citations are validated (no 404s) before insertion | Worker logs show validation results per URL |
| Each citation appears as an inline hyperlink exactly once in the article body | Inspect enriched `bodyHtml` — each citation URL appears in at most one `<a>` tag |
| No existing prompt templates are modified by seed | Verify via `prisma.promptTemplate.upsert` with `update: {}` |

---

## 1. Fix A — GEO Heading Completeness & Question Mark Enforcement

### 1.1 Problem

GEO questions that become H2 headings can be truncated or missing their terminal `?`. Three sources:

- **Step 101 (question matching):** LLM paraphrases/truncates FAQ questions instead of copying them verbatim
- **Step 102 (keyword→question):** LLM occasionally returns incomplete sentences
- **Step 103 (rephrase):** Rephrased question may lose its question mark

No validation exists between question generation and `geoByPosition.set()`.

### 1.2 Changes

#### A1. Question sanitizer function — NEW file `apps/api/src/article-pipeline/enrichment/geo-question-sanitizer.ts`

```typescript
export function sanitizeGeoQuestion(question: string): string | null
```

Logic:
1. Trim whitespace, strip wrapping quotes
2. If the question is shorter than 15 characters, return `null` (too short to be a real question → fall through to keyword generation)
3. Check for truncation: if the last character is a letter (no terminal punctuation) AND the last word appears to be cut off (doesn't match a known English word ending), return `null`
4. If the question starts with an interrogative word (`how`, `what`, `why`, `when`, `where`, `which`, `who`, `is`, `are`, `can`, `does`, `do`, `will`, `should`) but doesn't end with `?`, append `?`
5. Title-case the first letter
6. Return the sanitized question

#### A2. Apply sanitizer after each question source — `apps/api/src/article-pipeline/enrichment/index.ts`

At three points in the GEO loop (lines 175–232):

1. **After FAQ match (line 175):** `question = sanitizeGeoQuestion(matchByPos.get(e.position) ?? null)`
   - If `null`, falls through to keyword generation (existing behavior at line 183)
2. **After keyword generation (line 192):** `question = sanitizeGeoQuestion(g.question)`
   - If `null`, `continue` (skip this section)
3. **After rephrase (line 219):** `question = sanitizeGeoQuestion(r.question)`
   - If `null`, keep the pre-rephrase question (which already passed sanitization)

#### A3. Strict-match validation for step 101 — `apps/api/src/article-pipeline/enrichment/geo-question-matcher.ts`

After parsing the LLM response (line 77-82), fuzzy-match each returned string against the original `faqQuestions` array:
- For each match, find the candidate with the highest overlap (Levenshtein or word-overlap score)
- If the best candidate has >80% word overlap, use the original candidate text (not the LLM's paraphrase)
- If overlap is <80%, treat as `null` (fall through to keyword generation)

This ensures FAQ match headings are always the exact, complete FAQ question text.

#### A4. Run `normalizeH2Questions` on enriched HTML — `apps/api/src/article-pipeline/enrichment/index.ts`

In `finishEnrichment()` (line 832), before saving `enrichedHtml` to `SitePage.bodyHtml`, run:
```typescript
const normalizedHtml = normalizeH2Questions(enrichedHtml)
```

Import `normalizeH2Questions` from `../approval-service`. This catches any questions that slipped through without a `?`.

### 1.3 Files touched

| File | Action |
|---|---|
| `apps/api/src/article-pipeline/enrichment/geo-question-sanitizer.ts` | **NEW** — sanitizer function |
| `apps/api/src/article-pipeline/enrichment/index.ts` | Apply sanitizer at 3 points + call `normalizeH2Questions` in `finishEnrichment` |
| `apps/api/src/article-pipeline/enrichment/geo-question-matcher.ts` | Add strict-match validation after LLM parse |
| `apps/api/src/article-pipeline/approval-service.ts` | Export `normalizeH2Questions` (already exported) |

---

## 2. Fix B — Remove Programmatic Anchor Prefixes

### 2.1 Problem

`geo-html-restructurer.ts` generates heading IDs with `geo-` and `sec-` prefixes plus position suffixes:
- `<h2 id="geo-can-chiropractic-adjustments-help-with-headaches-1">`
- `<h3 id="sec-what-actually-happens-during-a-spinal-adjustment-1">`

Google flags these as CMS/template artifacts.

### 2.2 Changes

#### B1. Clean anchor IDs — `apps/api/src/article-pipeline/enrichment/geo-html-restructurer.ts`

Line 59: Change from:
```typescript
`<h2 id="geo-${slugify(q)}-${pos}">${q}</h2>${summaryBlock}` +
`<h3 id="sec-${anchor}">${titleInner}</h3>`
```

To:
```typescript
`<h2 id="${slugify(q)}">${q}</h2>${summaryBlock}` +
`<h3 id="${anchor}">${titleInner}</h3>`
```

No prefix, no position suffix. The `injectHeadingIds` function already handles deduplication for collisions by appending `-1`, `-2` etc., but it only adds IDs to headings that don't already have one. Since we're setting IDs here explicitly, we need to ensure uniqueness ourselves.

#### B2. Dedup within restructurer — `apps/api/src/article-pipeline/enrichment/geo-html-restructurer.ts`

Add a `usedIds` set to track IDs within the restructuring loop. If a slug collides, append a counter:
```typescript
const usedIds = new Set<string>()
// inside loop:
let id = slugify(q)
if (usedIds.has(id)) {
  let n = 1
  while (usedIds.has(`${id}-${n}`)) n++
  id = `${id}-${n}`
}
usedIds.add(id)
```

Same for the `<h3>` anchor.

### 2.3 Files touched

| File | Action |
|---|---|
| `apps/api/src/article-pipeline/enrichment/geo-html-restructurer.ts` | Remove `geo-`/`sec-` prefixes, remove `-${pos}` suffix, add dedup set |

---

## 3. Fix C — Inline Citation Linking with URL Validation

### 3.1 Architecture

The flow (all happening inside the approval service, Phase B):

```
Step 12 output (JSON citations from Phase A)
    ↓
[C1] Validate URLs via OxyLabs residential proxy (parallel HEAD requests)
    ↓
[C2] Filter out dead citations (4xx, 5xx, timeout)
    ↓
[C3] LLM call: insert validated citations as inline <a> links (each URL used exactly once)
    ↓
Use linked HTML as bodyHtml for SitePage upsert
```

This happens AFTER the existing step 13 (SEO metadata) and step 15 (image prompt) complete, but BEFORE the SitePage upsert. The linked HTML replaces the plain step 11 body.

### 3.2 OxyLabs Residential Proxy — Why and How

**Why residential proxy helps:**
- Many authoritative citation targets (.gov, .edu, medical journals, WHO, NIH, AIHW) aggressively block or throttle datacenter IPs
- A DigitalOcean droplet IP making HEAD requests will get 403, 429, or timeouts for perfectly valid pages
- Residential proxy makes the request appear as a normal browser visitor, dramatically reducing false negatives
- Without it, we'd incorrectly reject 30-50% of valid citations

**Integration approach:**
- OxyLabs Web Scraper API (simplest): `https://realtime.oxylabs.io/v1/queries` with `source: "universal"` and `url: <target>`
- OR direct residential proxy endpoint: `http://customer-{user}:password@pr.oxylabs.io:7777` as an HTTP proxy for standard `fetch`/`undici` requests
- The direct proxy approach is simpler for HEAD requests — just route through the proxy

**Config:**
- New env vars: `OXYLABS_USERNAME`, `OXYLABS_PASSWORD`
- If not configured, fall back to direct HEAD requests (no proxy) — graceful degradation
- Timeout: 8 seconds per URL
- Treat 403 as "possibly valid" (some sites block HEAD but allow GET — we'll keep these citations)
- Only reject on clear 404, 410 (Gone), or connection failure after timeout

### 3.3 Changes

#### C1. Citation URL validator — NEW file `apps/api/src/article-pipeline/citation-validator.ts`

```typescript
export interface ValidatedCitation {
  title: string
  url: string
  status: 'valid' | 'uncertain' | 'dead'
  httpStatus?: number
}

export async function validateCitationUrls(
  citations: Array<{ title: string; url: string }>,
  jobId: string,
): Promise<ValidatedCitation[]>
```

Logic:
1. Parse `OXYLABS_USERNAME` / `OXYLABS_PASSWORD` from env. If missing, use direct requests.
2. For each citation URL, issue a `HEAD` request in parallel (`Promise.allSettled`, concurrency limit 5)
3. Through OxyLabs proxy if configured, direct if not
4. Classification:
   - 200, 301, 302 → `valid`
   - 403 → `uncertain` (keep it — site blocks bots but page likely exists)
   - 404, 410 → `dead` (remove)
   - Timeout / network error → `uncertain` (keep it)
5. Log results: `logger.info({ jobId, total, valid, uncertain, dead }, '[citations] validation complete')`
6. Return all citations with their status — caller decides which to keep

#### C2. Inline citation inserter — NEW file `apps/api/src/article-pipeline/citation-inserter.ts`

```typescript
export async function insertInlineCitations(
  articleHtml: string,
  validCitations: ValidatedCitation[],
  jobId: string,
  ctx: PipelineContext,
): Promise<{ linkedHtml: string; insertedCount: number }>
```

Logic:
1. Filter to only `valid` and `uncertain` citations (exclude `dead`)
2. Call the LLM (using StepRunner with a new prompt template, step number **16b** — see C3) with:
   - The article HTML
   - The validated citations as JSON
   - Instructions to insert each citation as an inline `<a>` hyperlink at the most relevant claim/data point
   - **Critical instruction: each citation URL must appear AT MOST ONCE in the output**
   - **Critical instruction: do NOT remove any existing content, ONLY add `<a>` tags**
   - **Critical instruction: return the complete article HTML with links added**
3. Parse the LLM output
4. Post-validation: scan the output HTML for `<a href>` tags, count occurrences of each citation URL. If any appears more than once, strip the duplicates (keep only the first occurrence)
5. Return the linked HTML and count of inserted citations

#### C3. New prompt template — step number `110` (fits in enrichment range, won't collide)

Seed in `packages/db/prisma/seed.ts` — added to a new array, upserted with `update: {}` (never overwrites):

```
stepNumber: 110
stepName: 'insert_inline_citations'
defaultProvider: 'anthropic'
defaultModel: 'claude-sonnet-4-5-20250929'
systemPrompt: 'You are a professional editor specializing in adding inline citation hyperlinks to articles...'
userPrompt: (see below)
```

**System prompt:**
```
You are a professional editor specializing in adding inline citation
hyperlinks to HTML articles. You add links precisely at the most relevant
claim or data point, preserving the article's existing structure exactly.
```

**User prompt:**
```
Add inline citation hyperlinks to this article. Each citation must be
inserted as an <a> tag wrapping the most relevant phrase, sentence, or
data point in the article body.

Article HTML:
{{article}}

Validated Citations (JSON):
{{validated_citations}}

Rules:
- Each citation URL must appear AT MOST ONCE in the entire article.
- Wrap the most relevant existing text in an <a href="URL" target="_blank"
  rel="noopener noreferrer"> tag. Do NOT add new text — only wrap existing text.
- Place citations near the claim or data point they support.
- Do NOT modify any other HTML structure, headings, paragraphs, or content.
- Do NOT remove or rearrange any existing content.
- If a citation has no clearly relevant passage, skip it entirely.
- Return the COMPLETE article HTML with the citation links added.
- Output ONLY the HTML — no explanation, no markdown fences.
```

#### C4. Integration into approval service — `apps/api/src/article-pipeline/approval-service.ts`

Insert the citation validation + inline linking step after step 15 (image prompt) completes and before the SitePage upsert. Updated flow:

```
existing: Step 13 → Step 15 → Fal.ai image → ...
new:      Step 13 → Step 15 → Fal.ai image → [Validate citations] → [Insert inline citations] → SitePage upsert
```

Code insertion point (after line 209, before line 212 "upserting SitePage"):

```typescript
// ── Citation validation + inline linking ─────────────────────────────────
logger.info({ jobId }, '[approval] validating citation URLs')
const rawCitations = parseCitationsForValidation(ctx.completedSteps.get(12) ?? '')
let linkedArticleHtml = step11

if (rawCitations.length > 0) {
  const validated = await validateCitationUrls(rawCitations, jobId)
  const liveCitations = validated.filter(c => c.status !== 'dead')
  const deadCount = validated.length - liveCitations.length
  if (deadCount > 0) {
    logger.warn({ jobId, deadCount }, '[approval] removed dead citation URLs')
  }

  if (liveCitations.length > 0) {
    try {
      const { linkedHtml, insertedCount } = await insertInlineCitations(
        step11, liveCitations, jobId, ctx,
      )
      linkedArticleHtml = linkedHtml
      logger.info({ jobId, insertedCount, total: liveCitations.length },
        '[approval] inline citations inserted')
    } catch (err) {
      logger.error({ jobId, err }, '[approval] inline citation insertion failed — continuing without')
      Sentry.captureException(err, { tags: { phase: 'approval', step: 'inline_citations' } })
    }
  }
}
```

Then use `linkedArticleHtml` instead of `step11` in the SitePage upsert for `bodyHtml` and `originalBodyHtml`.

#### C5. Variable resolver — `apps/api/src/article-pipeline/variable-resolver.ts`

Add to `STEP_NAME_MAP`:
```typescript
insert_inline_citations: 110,
```

Add new case for `{{validated_citations}}`:
```typescript
case 'validated_citations':
  // Populated at call time by the approval service — not from completedSteps
  return ctx.completedSteps.get(110) ?? ''
```

Note: The approval service will temporarily set `ctx.completedSteps.set(110, JSON.stringify(liveCitations))` before calling the StepRunner, so the variable resolver can pick it up.

#### C6. Admin prompts UI — add step 110

In `apps/web/src/app/admin/prompts/page.tsx`:
- Add to `STEP_LABELS`: `insert_inline_citations: '14. Insert Inline Citations'`
- Add to `VISUAL_STEP_NUMBER`: `110: '14'`
- Add `110` to Phase B `steps` array (after `13`, before `15`)

In `apps/web/src/app/admin/prompts/[stepNumber]/PromptEditor.tsx`:
- Add to `STEP_LABELS`: `110: 'Phase B · Step 14 — Insert Inline Citations'`
- Add `{{validated_citations}}` to `ALL_VARIABLES`

#### C7. Env vars — `.env` / `.env.do`

Add (optional — graceful degradation when missing):
```
OXYLABS_USERNAME=
OXYLABS_PASSWORD=
```

### 3.4 Files touched

| File | Action |
|---|---|
| `apps/api/src/article-pipeline/citation-validator.ts` | **NEW** — URL validation with OxyLabs proxy |
| `apps/api/src/article-pipeline/citation-inserter.ts` | **NEW** — LLM-based inline citation insertion |
| `apps/api/src/article-pipeline/approval-service.ts` | Add validation + insertion step before SitePage upsert |
| `apps/api/src/article-pipeline/variable-resolver.ts` | Add `insert_inline_citations: 110` to map, add `validated_citations` case |
| `packages/db/prisma/seed.ts` | Add step 110 prompt template (upsert with `update: {}` — never overwrites) |
| `apps/web/src/app/admin/prompts/page.tsx` | Add step 110 to labels, visual numbers, Phase B group |
| `apps/web/src/app/admin/prompts/[stepNumber]/PromptEditor.tsx` | Add step 110 label + `{{validated_citations}}` variable |
| `.env` / `.env.do` | Add `OXYLABS_USERNAME`, `OXYLABS_PASSWORD` (optional) |

---

## 4. Order of Operations

Fixes are independent — can be done in any order. Recommended sequence:

```
Fix B  (anchor prefixes)     — smallest, zero risk, pure string change
  ↓
Fix A  (heading completeness) — moderate, isolated to GEO pipeline
  ↓
Fix C  (inline citations)    — largest, new files + LLM call + proxy integration
```

Each fix should be committed and deployed independently so regressions are easy to isolate.

---

## 5. What We Are NOT Doing

- **NOT modifying any existing prompt templates** — all seed operations use `update: {}` (no-op on existing rows)
- **NOT changing Phase A step numbering** — step 12 remains `find_citations`
- **NOT reordering enrichment pipeline steps** — GEO still runs in the same order
- **NOT adding a hard dependency on OxyLabs** — citation validation falls back to direct requests when credentials are missing
- **NOT changing the schema** — no migrations needed. The new step 110 is a prompt template row, not a schema change.

---

## 6. Risk Assessment

| Risk | Mitigation |
|---|---|
| LLM inline citation insertion breaks HTML structure | Post-validation: if output has fewer `<h2>` tags than input, discard and use original HTML |
| OxyLabs proxy adds latency | 8s timeout per URL, parallel execution, max ~3s total for 12 URLs |
| OxyLabs credentials missing in production | Graceful fallback to direct requests + log warning |
| Question sanitizer is too aggressive (rejects valid questions) | 15-char minimum is conservative; truncation detection uses simple heuristics (no terminal punctuation + ends mid-word) |
| Deduplication of citation `<a>` tags is imperfect | Regex scan of output HTML for each URL + strip duplicates is deterministic |
| Re-enrichment of existing articles still has old-style anchors | Only new enrichment runs produce clean anchors; existing articles keep their current IDs until re-enriched |
