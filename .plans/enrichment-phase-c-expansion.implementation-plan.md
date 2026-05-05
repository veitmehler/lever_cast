# Phase C Enrichment Expansion — GEO Enrichment, Key Takeaways, TOC & WP Category

> **Scope:** Expand the existing Phase C enrichment orchestrator (`enrichment/index.ts`) from Mermaid-diagram-only to a full enrichment pipeline: GEO question/summary injection, heading restructuring, Key Takeaways generation, collapsible Table of Contents, and conditional WordPress category assignment. Translation (Steps 105–106) is **out of scope**.

> **Prerequisite:** Phase C Mermaid enrichment is already deployed and working (htmlLabels fix shipped). Prompt templates 101–104 are already seeded in the `PromptTemplate` table.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Enrichment Execution Order](#2-enrichment-execution-order)
3. [Step 101 — GEO Question Matching](#3-step-101--geo-question-matching)
4. [Step 102 — GEO Keyword-to-Question (Fallback)](#4-step-102--geo-keyword-to-question-fallback)
5. [Step 103 — GEO Uniqueness Rephrase](#5-step-103--geo-uniqueness-rephrase)
6. [Step 104 — GEO AI Summary](#6-step-104--geo-ai-summary)
7. [HTML Heading Restructuring](#7-html-heading-restructuring)
8. [Key Takeaways Generation (New Step 107)](#8-key-takeaways-generation-new-step-107)
9. [Collapsible Table of Contents](#9-collapsible-table-of-contents)
10. [Mermaid Diagrams (Existing)](#10-mermaid-diagrams-existing)
11. [Final HTML Assembly](#11-final-html-assembly)
12. [WordPress Category Selection (Conditional)](#12-wordpress-category-selection-conditional)
13. [Database Changes](#13-database-changes)
14. [File Inventory](#14-file-inventory)
15. [Error Handling & Reliability](#15-error-handling--reliability)
16. [Cost Estimation](#16-cost-estimation)
17. [Implementation Checklist](#17-implementation-checklist)

---

## 1. Architecture Overview

Phase C currently runs as a single pg-boss worker on the `article-enrichment` queue. This plan **extends that same worker** — no new queue is needed. The enrichment orchestrator (`enrichment/index.ts`) gains additional stages that run sequentially before the existing Mermaid stage.

```
article-enrichment worker (enrichment/index.ts)
│
├─ 1. Load job + SitePage + Phase A step outputs
├─ 2. Extract H2/H3 sections from bodyHtml
├─ 3. GEO enrichment (Steps 101–104)
│  ├─ 101: Match FAQ questions to H2 sections
│  ├─ 102: Generate questions for unmatched sections
│  ├─ 103: Uniqueness rephrase (if collision detected)
│  └─ 104: AI summary per section (40–60 words)
├─ 4. HTML heading restructuring (H2→H3, H3→H4, inject question H2 + summary)
├─ 5. Key Takeaways generation (new Step 107)
├─ 6. TOC generation (deterministic, no LLM)
├─ 7. Mermaid diagrams (existing, runs on restructured HTML)
├─ 8. Final HTML assembly (Key Takeaways + TOC + restructured body + diagrams)
├─ 9. WP category selection (conditional — only if Topic.wordPressConnectionId is set)
└─ 10. Finish: update SitePage.bodyHtml, mark enriched
```

### Why this order matters

- **GEO (101–104) before Mermaid**: The heading restructuring changes the H2s. Mermaid uses H2 headings to decide what diagrams to create. Running GEO first means diagrams are contextually matched to the final heading structure.
- **Key Takeaways before TOC**: The TOC should include the "Key Takeaways" heading if one is generated.
- **TOC after heading restructuring**: The TOC must reflect the final heading hierarchy (question H2s, demoted H3s/H4s).
- **WP category at the end**: It's a metadata operation, not an HTML transformation.

---

## 2. Enrichment Execution Order

| Order | Stage | LLM Calls | Provider / Model | Failure Mode |
|-------|-------|-----------|------------------|-------------|
| 1 | Load data + extract sections | 0 | — | Fatal (throw) |
| 2 | Step 101: Question matching | 1 | openai / gpt-4o-mini | Non-fatal; skip GEO for all sections |
| 3 | Step 102: Keyword→question (per unmatched) | 0–N | gemini / gemini-2.5-flash | Non-fatal; section gets no question |
| 4 | Step 103: Uniqueness rephrase (per collision) | 0–N | openai / gpt-4o-mini | Non-fatal; use original question |
| 5 | Step 104: AI summary (per section) | N | anthropic / claude-sonnet-4-5 | Non-fatal; section gets no summary |
| 6 | Heading restructuring | 0 | — (DOM manipulation) | Non-fatal; use original HTML |
| 7 | Step 107: Key Takeaways | 1 | anthropic / claude-sonnet-4-5 | Non-fatal; no takeaways block |
| 8 | TOC generation | 0 | — (deterministic) | Non-fatal; no TOC block |
| 9 | Mermaid diagrams (existing) | N | anthropic / claude-sonnet-4-5 | Existing failure handling |
| 10 | Final HTML assembly | 0 | — | Fatal if no HTML |
| 11 | WP category (conditional) | 1 | openai / gpt-4o-mini | Non-fatal; no category set |

**Total new LLM calls per article** (assuming ~5 H2 sections):
- Step 101: 1 call
- Step 102: ~2 calls (assumes ~2 sections don't match FAQ)
- Step 103: ~1 call (assumes ~1 collision)
- Step 104: ~5 calls (one per section)
- Step 107: 1 call
- WP category: 0 or 1 call
- **Total new: ~10 calls** (in addition to ~5 existing Mermaid calls)

---

## 3. Step 101 — GEO Question Matching

### Purpose

Match research FAQ questions (from Step 6 output) to article H2 sections. Each section gets the most topically relevant FAQ question, or `null` if no good fit.

### Input

- `sections`: JSON array of `{ position, heading, contentSnippet }` derived from extracted H2 sections
- `candidates`: JSON array of FAQ question strings parsed from Step 6 output (`research_faqs`)

### Prompt (from DB — `enrichment_question_matching`)

- **System**: "You are an expert content strategist helping match research questions to article sections."
- **User**: Provides sections + candidates, rules (1:1 matching, no duplicates, respond with JSON array of strings or null)
- **Provider**: openai / gpt-4o-mini
- **Output**: JSON array — e.g. `["Why is X important?", null, "How does Y work?", null, "What are the risks?"]`

### Implementation

New file: `apps/api/src/article-pipeline/enrichment/geo-question-matcher.ts`

```typescript
interface QuestionMatchResult {
  matches: (string | null)[]  // one entry per section, aligned by index
  inputTokens: number
  outputTokens: number
  cost: number
}

export async function matchQuestionsToSections(opts: {
  sections: Array<{ position: number; heading: string; contentSnippet: string }>
  faqQuestions: string[]
  jobId: string
}): Promise<QuestionMatchResult>
```

### Parsing Step 6 output

Step 6 (`research_faqs`) outputs plain text in the format:
```
# Question 1:
"Why is location important for real estate?"
# Question 2:
"How do property taxes work in the DR?"
...
```

A helper `parseFaqQuestions(step6Output: string): string[]` will extract the question strings from this format using a regex: `/^#\s*Question\s*\d+.*?\n+"?(.+?)"?\s*$/gmi`

---

## 4. Step 102 — GEO Keyword-to-Question (Fallback)

### Purpose

For sections that received `null` from Step 101 (no matching FAQ question), generate a natural search question from the section's heading and relevant secondary keywords.

### Input

- `keyword`: A secondary keyword related to the section (from Step 2 output)
- `sectionHeading`: The H2 heading text

### Prompt (from DB — `enrichment_keyword_to_question`)

- **System**: "You are an expert SEO specialist converting keywords into natural search questions."
- **User**: Converts keyword into a clear question relevant to the section heading
- **Provider**: gemini / gemini-2.5-flash
- **Output**: Plain text question string

### Implementation

New file: `apps/api/src/article-pipeline/enrichment/geo-question-generator.ts`

```typescript
export async function generateQuestionFromKeyword(opts: {
  keyword: string
  sectionHeading: string
  jobId: string
  position: number
}): Promise<{ question: string; inputTokens: number; outputTokens: number; cost: number }>
```

### Keyword selection strategy

Step 2 (`keyword_research`) returns JSON with `secondary_keywords` (or `Secondary Keywords`). For each unmatched section, pick the secondary keyword whose text is most related to the section heading. A simple heuristic: find the keyword that shares the most words with the heading. If no secondary keywords are available, use the section heading itself as the keyword input.

---

## 5. Step 103 — GEO Uniqueness Rephrase

### Purpose

Ensure that the assigned question for a section doesn't duplicate a question already used across other articles on the same site. This is a **global uniqueness** check.

### When to run

Only called when a question (from Step 101 or 102) already exists in the `SectionEnrichment` table (new model — see §13) for the same `userId`. This is a DB lookup, not an LLM call.

### Prompt (from DB — `enrichment_uniqueness_rephrase`)

- **System**: (empty)
- **User**: "Rephrase the following question to convey the same meaning with different wording."
- **Provider**: openai / gpt-4o-mini
- **Output**: Plain text rephrased question

### Implementation

Added to: `apps/api/src/article-pipeline/enrichment/geo-question-generator.ts`

```typescript
export async function rephraseForUniqueness(opts: {
  question: string
  jobId: string
  position: number
}): Promise<{ question: string; inputTokens: number; outputTokens: number; cost: number }>
```

### Collision detection

```sql
SELECT COUNT(*) FROM section_enrichments
WHERE "userId" = $userId AND question = $question AND "sitePageId" != $currentSitePageId
```

If count > 0, call Step 103 to rephrase. Limit to one rephrase attempt — if the rephrased version also collides, accept it anyway (diminishing returns).

---

## 6. Step 104 — GEO AI Summary

### Purpose

For each section that has a matched question, generate a concise 40–60 word AI-optimized summary that directly answers the question. This summary is designed for Generative Engine Optimization (GEO) — it's the text that AI search engines (Google SGE, Perplexity, etc.) extract as a featured answer.

### Input

- `content`: Plain text of the article section content (HTML stripped)
- `question`: The matched question for this section

### Prompt (from DB — `enrichment_ai_summary`)

- **System**: "You are an expert content writer creating concise AI-optimised summaries for Generative Engine Optimisation (GEO)."
- **User**: "Write a concise 40-60 word answer to the following question, based on the article section content provided."
- **Provider**: anthropic / claude-sonnet-4-5
- **Output**: Plain text paragraph (40–60 words)

### Implementation

New file: `apps/api/src/article-pipeline/enrichment/geo-summary-generator.ts`

```typescript
export async function generateAiSummary(opts: {
  question: string
  sectionContent: string
  jobId: string
  position: number
}): Promise<{ summary: string; inputTokens: number; outputTokens: number; cost: number }>
```

### Content extraction

The section HTML is stripped of tags to produce plain text for the prompt. Use the existing `stripTags()` from `html-parser.ts` (make it exported). Truncate to ~2000 chars to keep token usage reasonable.

---

## 7. HTML Heading Restructuring

### Purpose

Transform the article HTML so that each H2 section becomes a GEO-optimized knowledge unit:

```
BEFORE:
  <h2>Original Section Title</h2>
  <p>Section content...</p>
  <h3>Subsection</h3>
  <p>More content...</p>

AFTER:
  <h2 id="geo-{anchor}">How does [matched question]?</h2>
  <div class="geo-summary" data-question="How does [matched question]?">
    <p>[40–60 word AI summary]</p>
  </div>
  <h3>Original Section Title</h3>       ← demoted from H2
  <p>Section content...</p>
  <h4>Subsection</h4>                   ← demoted from H3
  <p>More content...</p>
```

### Sections without a question/summary

If a section has no matched question (Steps 101-103 all failed/returned null) or no generated summary (Step 104 failed), that section is **left unchanged** — the original H2 stays as-is, no heading demotion occurs.

### Implementation

New file: `apps/api/src/article-pipeline/enrichment/geo-html-restructurer.ts`

```typescript
interface GeoSectionData {
  position: number
  question: string       // the matched/generated question
  summary: string        // the 40–60 word AI summary
}

export function restructureHtmlWithGeo(
  bodyHtml: string,
  geoSections: GeoSectionData[],
): string
```

### Algorithm

1. Parse all `<h2>` and `<h3>` positions in the HTML.
2. For each H2 section that has a `GeoSectionData` entry:
   a. Insert a new `<h2>` with the question text before the original H2.
   b. Insert the `<div class="geo-summary">` block after the new H2.
   c. Demote the original `<h2>` to `<h3>`.
   d. Demote all `<h3>` tags within that section to `<h4>`.
3. Sections without GEO data are left untouched.
4. Process from back to front (descending offset) so insertions don't shift earlier offsets.

### CSS classes

- `geo-summary`: Styled as a subtle callout box (light background, border-left accent).
- The question H2 gets an `id="geo-{anchor}"` for TOC linking.

---

## 8. Key Takeaways Generation (New Step 107)

### Purpose

Generate a "Key Takeaways" section with 3–5 declarative bullet points that summarize the article's most important findings. Placed **after the introduction, before the first H2 section**.

### Prompt (New — `enrichment_key_takeaways`, Step 107)

**System prompt:**
```
You are an expert content strategist creating "Key Takeaways" sections for Generative Engine Optimization (GEO). Your takeaways must be declarative statements packed with specific data, entities, and actionable insights.
```

**User prompt:**
```
Generate a "Key Takeaways" section for the following article.

Article HTML:
{{bodyHtml}}

Primary keyword: {{primaryKeyword}}

Rules:
- Write exactly 3–5 bullet points.
- Each bullet must be a declarative sentence (not a question).
- Front-load the most important information in the first 10 words of each bullet.
- Include specific numbers, names, laws, or locations from the article where available.
- Each bullet should use a bold lead-in label (2–3 words), then the statement.
- Do NOT use vague language like "important considerations" or "key factors."
- Respond with ONLY the HTML list — no heading, no explanation.

Example format:
<ul>
  <li><b>Infrastructure Reality</b>: While Starlink (RD$2,900/mo) has solved internet issues, electricity remains unstable; solar ROI is now under three years.</li>
  <li><b>Legal Necessity</b>: Never purchase DR property without a verified Deslinde (Law 108-05) to avoid boundary disputes.</li>
</ul>
```

**Provider:** anthropic / claude-sonnet-4-5
**Max tokens:** 512

### Implementation

New file: `apps/api/src/article-pipeline/enrichment/key-takeaways-generator.ts`

```typescript
export async function generateKeyTakeaways(opts: {
  bodyHtml: string
  primaryKeyword: string
  jobId: string
}): Promise<{
  html: string          // the <ul>...</ul> block
  inputTokens: number
  outputTokens: number
  cost: number
}>
```

### HTML output structure

```html
<section class="key-takeaways" aria-label="Key Takeaways">
  <h2>Key Takeaways</h2>
  <ul>
    <li><b>Bold Label</b>: Declarative statement with data...</li>
    ...
  </ul>
</section>
```

### Placement

Injected after the introduction (everything before the first `<h2>`) and before the first H2 section. The injector finds the first `<h2` tag offset and inserts the Key Takeaways block just before it.

### Seed the prompt template

Add to the `PromptTemplate` table:

```
stepNumber: 107
stepName: 'enrichment_key_takeaways'
defaultProvider: 'anthropic'
defaultModel: 'claude-sonnet-4-5-20250929'
isActive: true
systemPrompt: [system prompt above]
userPrompt: [user prompt above]
```

---

## 9. Collapsible Table of Contents

### Purpose

Generate an anchor-linked Table of Contents from the final heading structure (after GEO restructuring). H3s are indented under their parent H2. The TOC is collapsible via a `<details>/<summary>` element.

### Implementation

Added to: `apps/api/src/article-pipeline/enrichment/html-parser.ts` (extends existing module)

```typescript
interface TocEntry {
  level: 2 | 3
  text: string
  anchor: string
}

export function extractHeadingsForToc(html: string): TocEntry[]
export function buildTocHtml(entries: TocEntry[]): string
```

### Algorithm (deterministic — no LLM)

1. Regex-scan the (already restructured) HTML for `<h2` and `<h3` tags.
2. For each heading, extract:
   - `level`: 2 or 3
   - `text`: inner text (HTML stripped)
   - `anchor`: existing `id` attribute, or generate one via `slugify(text)`
3. If the heading doesn't have an `id` attribute, inject one into the HTML during final assembly.
4. Build the TOC as a nested HTML list.

### HTML output structure

```html
<nav class="article-toc" aria-label="Table of Contents">
  <details open>
    <summary>Table of Contents</summary>
    <ul>
      <li><a href="#geo-anchor-1">Question H2 text?</a>
        <ul>
          <li><a href="#original-heading">Original Heading (now H3)</a></li>
        </ul>
      </li>
      <li><a href="#geo-anchor-2">Another question?</a>
        <ul>
          <li><a href="#sub-heading">Sub-heading (now H3)</a></li>
        </ul>
      </li>
    </ul>
  </details>
</nav>
```

### Placement

Injected **after** the Key Takeaways section, before the first content H2. The order in the article is:

1. Introduction (everything before the first H2)
2. **Key Takeaways** (new)
3. **Table of Contents** (new)
4. First H2 section (GEO-restructured)
5. ...remaining sections...

### Styling

The `<details>` element provides native browser collapsibility. CSS for `.article-toc`:
- Subtle border, muted background
- `<summary>` styled as bold label with cursor pointer
- Nested `<ul>` items with proper indentation for H3 items

---

## 10. Mermaid Diagrams (Existing)

No changes to the existing Mermaid diagram pipeline. It continues to:

1. Extract H2 sections from the (now restructured) HTML
2. Generate Mermaid syntax per section (Claude)
3. Render SVG → PNG → S3
4. Store `ArticleDiagram` rows
5. Queue figure HTML for insertion

The one behavioral difference: after GEO restructuring, the "H2 sections" the diagram generator sees are now the **question-H2s**, not the original topic headings. This is correct — the diagrams should illustrate the content under each question, which includes the original section content (now under a demoted H3).

---

## 11. Final HTML Assembly

After all enrichment stages complete, the final HTML is assembled in this order:

```
[Introduction — untouched]
[Key Takeaways section]
[Table of Contents]
[GEO-restructured H2 sections with diagrams inserted]
[Conclusion / FAQ — if they exist as H2 sections, they are also restructured]
```

The assembly happens in the existing `finishEnrichment()` function, which already writes the final HTML to `SitePage.bodyHtml`.

### Exclusion rules

Certain H2 sections should be **excluded** from GEO restructuring (they don't benefit from question+summary treatment):
- Sections whose heading matches: "Frequently Asked Questions", "FAQ", "Conclusion", "Key Takeaways"
- The regex: `/^(FAQ|Frequently Asked Questions|Conclusion|Key Takeaways)/i`

These sections keep their original H2 heading unchanged.

---

## 12. WordPress Category Selection (Conditional)

### When to run

**Only** when `Topic.wordPressConnectionId` is not null — meaning the user has linked this topic to a WordPress site for export.

### Flow

1. Load the `WordPressConnection` associated with the topic.
2. Fetch categories from the WP REST API: `GET {siteUrl}/wp-json/wp/v2/categories?per_page=100`
   - This endpoint is already called in `routes/wp-connections.ts` during connection verification. We reuse the same fetch logic.
3. Call an LLM (gpt-4o-mini) with the article title/topic + list of available categories.
4. Store the selected `categoryId` on the `Topic` model (existing `category` field, repurposed to store the WP category ID).

### Prompt (New — `enrichment_wp_category`, Step 108)

**System prompt:**
```
You are a content categorization expert. Given an article topic and a list of WordPress categories, select the single most appropriate category.
```

**User prompt:**
```
Select the most appropriate WordPress category for this article.

Article topic: {{topic}}
Article title: {{title}}

Available categories (JSON):
{{categories}}

Rules:
- Select exactly ONE category from the list.
- Respond with ONLY the category ID as a number — nothing else.
- If no category is a good fit, respond with the ID of the most general/default category.
```

**Provider:** openai / gpt-4o-mini

### Implementation

New file: `apps/api/src/article-pipeline/enrichment/wp-category-selector.ts`

```typescript
export async function selectWordPressCategory(opts: {
  topic: string
  title: string
  siteUrl: string
  auth: string
  jobId: string
}): Promise<{
  categoryId: number | null
  inputTokens: number
  outputTokens: number
  cost: number
}>
```

### Storage

The selected categoryId is stored on `Topic.wpCategoryId` (new field — see §13). The `WordPressTarget.publish()` already checks for `categoryId` in its config, so the export path just needs to read this field.

### Cost guard

This step runs 0 or 1 LLM calls per article. If no WP connection is set, it's completely skipped — zero cost.

---

## 13. Database Changes

### New model: `SectionEnrichment`

Stores GEO enrichment data per section per article. Enables the uniqueness check (Step 103) and provides data for re-enrichment scenarios.

```prisma
model SectionEnrichment {
  id           String   @id @default(cuid())
  sitePageId   String
  sitePage     SitePage @relation(fields: [sitePageId], references: [id], onDelete: Cascade)
  userId       String
  position     Int                          // 1-based, aligned with original H2 position
  originalH2   String                       // the original H2 heading text
  question     String?                      // matched/generated question (null if skipped)
  summary      String?  @db.Text            // AI summary (null if skipped)
  questionSource String?                    // 'faq_match' | 'keyword_gen' | 'rephrased'
  llmProvider  String?
  llmModel     String?
  inputTokens  Int      @default(0)
  outputTokens Int      @default(0)
  cost         Float    @default(0)
  createdAt    DateTime @default(now())

  @@unique([sitePageId, position])
  @@index([userId, question])               // for uniqueness lookups
  @@index([sitePageId])
  @@map("section_enrichments")
}
```

### SitePage additions

```prisma
model SitePage {
  // ... existing fields ...
  keyTakeawaysHtml  String?  @db.Text       // generated Key Takeaways HTML
  tocHtml           String?  @db.Text       // generated Table of Contents HTML
  sectionEnrichments SectionEnrichment[]     // GEO enrichment data
}
```

### Topic additions

```prisma
model Topic {
  // ... existing fields ...
  wpCategoryId  Int?                        // WordPress category ID (from AI selection)
}
```

### New PromptTemplate seeds

| stepNumber | stepName | provider | model |
|------------|----------|----------|-------|
| 107 | `enrichment_key_takeaways` | anthropic | claude-sonnet-4-5-20250929 |
| 108 | `enrichment_wp_category` | openai | gpt-4o-mini |

---

## 14. File Inventory

### New files

| File | Purpose |
|------|---------|
| `apps/api/src/article-pipeline/enrichment/geo-question-matcher.ts` | Step 101: Match FAQ questions to sections |
| `apps/api/src/article-pipeline/enrichment/geo-question-generator.ts` | Steps 102 + 103: Generate questions, uniqueness rephrase |
| `apps/api/src/article-pipeline/enrichment/geo-summary-generator.ts` | Step 104: AI summary per section |
| `apps/api/src/article-pipeline/enrichment/geo-html-restructurer.ts` | HTML heading demotion + question/summary injection |
| `apps/api/src/article-pipeline/enrichment/key-takeaways-generator.ts` | Step 107: Key Takeaways generation |
| `apps/api/src/article-pipeline/enrichment/wp-category-selector.ts` | Step 108: WP category assignment (conditional) |

### Modified files

| File | Changes |
|------|---------|
| `apps/api/src/article-pipeline/enrichment/index.ts` | Add GEO, Key Takeaways, TOC, and WP category stages to the orchestrator |
| `apps/api/src/article-pipeline/enrichment/html-parser.ts` | Export `stripTags()`, add `extractHeadingsForToc()`, add `buildTocHtml()`, add `injectIdAttributes()` |
| `apps/api/src/article-pipeline/output/wordpress-target.ts` | Read `Topic.wpCategoryId` as fallback category source |
| `packages/db/prisma/schema.prisma` | Add `SectionEnrichment` model, add fields to `SitePage` and `Topic` |
| `packages/db/prisma/seed.ts` | Add Step 107 and 108 prompt templates |
| `apps/web/src/app/article-typography.css` | Add styles for `.geo-summary`, `.key-takeaways`, `.article-toc` |

---

## 15. Error Handling & Reliability

### Non-fatal stage failures

Every GEO enrichment stage is **non-fatal**. If any stage fails:

| Stage | Failure behavior |
|-------|-----------------|
| Step 101 (question matching) | Log + skip all GEO for this article. Mermaid still runs on original H2s. |
| Step 102 (keyword→question) | Log + that section gets no question/summary. Other sections proceed. |
| Step 103 (uniqueness rephrase) | Log + use the original (potentially duplicate) question. |
| Step 104 (AI summary) | Log + that section gets no summary. Question H2 is still injected but without a summary block. |
| Step 107 (Key Takeaways) | Log + no Key Takeaways block. TOC and everything else proceed. |
| TOC generation | Log + no TOC block. |
| WP category | Log + no category assigned. Export uses default. |

### Retry strategy

- GEO LLM calls use the same retry logic as the existing `StepRunner`: 3 attempts with exponential backoff.
- Mermaid retries are unchanged (1 retry with error feedback).

### Re-enrichment

The existing "re-enrich" flow (restore `originalBodyHtml`, delete `ArticleDiagram` rows, re-run) is extended:
- Also delete `SectionEnrichment` rows for the SitePage
- Clear `keyTakeawaysHtml` and `tocHtml`
- Re-run the full enrichment pipeline from scratch

---

## 16. Cost Estimation

Per article (assuming ~5 H2 sections, ~2 needing keyword-gen, ~1 uniqueness collision):

| Stage | Calls | Input tokens (est.) | Output tokens (est.) | Cost (est.) |
|-------|-------|---------------------|----------------------|-------------|
| Step 101 (gpt-4o-mini) | 1 | ~800 | ~100 | $0.0002 |
| Step 102 (gemini-2.5-flash) | 2 | ~200 | ~40 | $0.0001 |
| Step 103 (gpt-4o-mini) | 1 | ~100 | ~50 | $0.0001 |
| Step 104 (claude-sonnet-4-5) | 5 | ~5,000 | ~300 | $0.02 |
| Step 107 (claude-sonnet-4-5) | 1 | ~3,000 | ~200 | $0.01 |
| WP category (gpt-4o-mini) | 0–1 | ~300 | ~10 | $0.0001 |
| **GEO subtotal** | **~10** | **~9,400** | **~700** | **~$0.03** |
| Mermaid (existing) | ~5 | ~5,000–15,000 | ~3,000 | ~$0.03–$0.08 |
| **Total enrichment** | **~15** | **~15k–25k** | **~4k** | **~$0.06–$0.11** |

The GEO enrichment roughly doubles the enrichment cost per article, from ~$0.03–$0.08 to ~$0.06–$0.11. This is still well under $0.15/article for the entire enrichment phase.

---

## 17. Implementation Checklist

### Phase 1: Database & prompts

- [ ] Add `SectionEnrichment` model to Prisma schema
- [ ] Add `keyTakeawaysHtml` and `tocHtml` to `SitePage`
- [ ] Add `wpCategoryId` to `Topic`
- [ ] Run `prisma migrate dev`
- [ ] Seed Step 107 (`enrichment_key_takeaways`) prompt template
- [ ] Seed Step 108 (`enrichment_wp_category`) prompt template

### Phase 2: GEO enrichment modules

- [ ] Create `geo-question-matcher.ts` (Step 101)
- [ ] Create `geo-question-generator.ts` (Steps 102 + 103)
- [ ] Create `geo-summary-generator.ts` (Step 104)
- [ ] Create `geo-html-restructurer.ts` (heading demotion + injection)
- [ ] Export `stripTags()` from `html-parser.ts`
- [ ] Add `parseFaqQuestions()` helper to parse Step 6 output format

### Phase 3: Key Takeaways & TOC

- [ ] Create `key-takeaways-generator.ts` (Step 107)
- [ ] Add `extractHeadingsForToc()` and `buildTocHtml()` to `html-parser.ts`
- [ ] Ensure heading `id` attributes are injected for anchor linking

### Phase 4: Orchestrator integration

- [ ] Refactor `enrichment/index.ts` to run GEO → Key Takeaways → TOC → Mermaid → Assembly
- [ ] Wire up `SectionEnrichment` persistence (upsert per section)
- [ ] Wire up `keyTakeawaysHtml` and `tocHtml` persistence on SitePage
- [ ] Update `finishEnrichment()` for the new assembly order
- [ ] Update re-enrichment cleanup to also clear GEO data

### Phase 5: WP category (conditional)

- [ ] Create `wp-category-selector.ts` (Step 108)
- [ ] Add conditional WP category logic to orchestrator (check `Topic.wordPressConnectionId`)
- [ ] Update `WordPressTarget.publish()` to read `Topic.wpCategoryId` as fallback

### Phase 6: Frontend styling

- [ ] Add `.geo-summary` CSS to `article-typography.css`
- [ ] Add `.key-takeaways` CSS to `article-typography.css`
- [ ] Add `.article-toc` CSS to `article-typography.css`
- [ ] Verify TOC `<details>` collapsibility in article preview

### Phase 7: Testing & deployment

- [ ] Run a test article through the full enrichment pipeline locally
- [ ] Verify GEO question matching with real Step 6 output
- [ ] Verify heading restructuring produces valid HTML
- [ ] Verify TOC anchors link to correct headings
- [ ] Verify Key Takeaways placement (after intro, before first H2)
- [ ] Verify Mermaid diagrams still work on restructured HTML
- [ ] Verify WP category selection with a connected WP site
- [ ] Deploy to DigitalOcean
- [ ] Run a production test article and verify enriched output
