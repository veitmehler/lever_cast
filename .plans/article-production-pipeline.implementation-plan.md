# Article Production Pipeline — Full Implementation Plan

> **Purpose:** This document is a complete, self-contained specification of how articles are produced in the workflow stage of this codebase. It is intended to be detailed enough that a developer could replicate the same feature in another piece of software, with the same behavior, prompts, models, parsing logic, persistence model, and UI/API surface.
>
> **Scope:** Pipeline phases 1–18 inclusive (pre-approval LLM chain, approval chain, SEO/image/excerpt/disclaimer). Translation (19–24) and enrichment (25–26) are summarized at the end for completeness.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Database Models](#2-database-models)
3. [LLM Provider Adapters](#3-llm-provider-adapters)
4. [Variable Substitution System](#4-variable-substitution-system)
5. [Pipeline Orchestration](#5-pipeline-orchestration)
6. [Step-by-Step Pipeline Specification](#6-step-by-step-pipeline-specification)
   - [Phase A — Pre-Approval (Steps 1–12)](#phase-a--pre-approval-steps-112)
   - [Phase B — Approval Chain (Steps 13–18)](#phase-b--approval-chain-steps-1318)
7. [Verbatim Prompt Templates](#7-verbatim-prompt-templates)
8. [Output Parsing & Cleaning](#8-output-parsing--cleaning)
9. [Topic Ingestion & Job Creation](#9-topic-ingestion--job-creation)
10. [Image Generation & Storage](#10-image-generation--storage)
11. [Cost & Token Tracking](#11-cost--token-tracking)
12. [Retry, Rate-Limit & Error Handling](#12-retry-rate-limit--error-handling)
13. [Translation Pipeline (Steps 19–24)](#13-translation-pipeline-steps-1924)
14. [Enrichment Pipeline (Steps 25–26)](#14-enrichment-pipeline-steps-2526)
15. [API Surface](#15-api-surface)
16. [Replication Checklist](#16-replication-checklist)

---

## 1. Architecture Overview

### 1.1 Conceptual flow

```
CSV upload  →  Topic rows
         │
         ▼
POST /api/pipeline/trigger  →  ArticleJob (status=pending)
         │
         ▼
PipelineExecutor.execute()       ── Phase A (Pre-Approval) ──
   for each PromptTemplate where stepNumber ∈ [1..12]:
     StepRunner.execute()
        ├─ load template
        ├─ resolve {{variables}}
        ├─ pick provider/model
        ├─ call LLM (optionally with Google Search tool)
        ├─ parse (JSON for steps 2/12/13, text otherwise)
        ├─ persist PipelineStep.output
        └─ aggregate cost/tokens
   ArticleJob.status = "completed"
         │
         ▼  (user reviews & clicks Approve in UI)
approveJobDirectly(jobId)        ── Phase B (Approval) ──
   Step 13 generate_seo_metadata
   Step 14 select_category (or AI-assignment)
   Step 15 generate_image_prompt → Fal.ai → S3
   create/update SitePage
   Step 17 generate_excerpt
   Step 18 generate_legal_disclaimer
   ArticleJob.isApproved = true
         │
         ▼
triggerTranslationPipeline()     ── Phase C (Steps 19–24) ──
         │
         ▼
executeEnrichmentPipeline()      ── Phase D (Steps 25–26, background) ──
```

### 1.2 Key files

| File | Role |
|------|------|
| `lib/pipeline/executor.ts` | Sequentially runs steps 1–12 |
| `lib/pipeline/step-runner.ts` | Executes a single LLM step (resolve → call → parse → persist) |
| `lib/pipeline/variable-resolver.ts` | Substitutes `{{variable}}` placeholders |
| `lib/pipeline/approval-service.ts` | Steps 13–18, creates `SitePage`, kicks off translation/enrichment |
| `lib/pipeline/output-cleaner.ts` | Robust JSON cleaning/parsing helpers |
| `lib/pipeline/json-validator.ts` | Validation hints for malformed JSON |
| `lib/pipeline/keyword-validator.ts` | Global primary-keyword uniqueness |
| `lib/pipeline/image-generation.ts` | Fal.ai image generation with retry |
| `lib/pipeline/image-uploader.ts` | Download from Fal → upload to S3 → create `Media` |
| `lib/pipeline/category-assignment.ts` | AI category selection |
| `lib/pipeline/translation-batch-service.ts` | Steps 19–22 (parallel translation batches) |
| `lib/pipeline/schema-batch-service.ts` | Steps 23–24 (programmatic JSON-LD) |
| `lib/pipeline/enrichment-pipeline.ts` | Steps 25–26 (Napkin diagrams) |
| `lib/llm/adapter.ts` | `LLMAdapter` interface |
| `lib/llm/factory.ts` | `getLLMAdapter(provider)` |
| `lib/llm/{gemini,openai,anthropic,openrouter,fal}.ts` | Provider implementations |
| `lib/utils/logger.ts` | Structured logging (`logPrompt`, `logRawLLMResponse`, etc.) |
| `prisma/schema.prisma` | Database schema |
| `prisma/seed.ts` | Default prompt templates |
| `app/api/pipeline/trigger/route.ts` | Per-topic trigger |
| `app/api/pipeline/process-all/route.ts` | Batch trigger |
| `app/api/pipeline/resume/route.ts` | Resume failed job |
| `app/api/upload-csv/route.ts` | CSV → `Topic` rows |

### 1.3 High-level execution loop (annotated)

```typescript
// lib/pipeline/executor.ts (paraphrased)
const promptTemplates = await prisma.promptTemplate.findMany({
  where: { stepNumber: { gte: 1, lte: 12 } },
  orderBy: { stepNumber: 'asc' },
})

for (const template of promptTemplates) {
  // Resume support: skip if already completed
  const existing = await prisma.pipelineStep.findFirst({
    where: { jobId, stepNumber: template.stepNumber, status: 'completed' },
  })
  if (existing) continue

  if (template.stepNumber === 2) {
    await executeStep2WithValidation(context)   // uniqueness retry loop
  } else {
    const runner = new StepRunner(context)
    const result = await runner.execute()
    if (!result.success) throw new Error(...)
  }

  await prisma.articleJob.update({
    where: { id: jobId },
    data: { currentStep: template.stepNumber },
  })
}
```

---

## 2. Database Models

All models defined in `prisma/schema.prisma`. Postgres + Prisma ORM.

### 2.1 `Topic` (the input)

```prisma
model Topic {
  id                     String    @id @default(cuid())
  topic                  String
  scheduledDate          DateTime
  excludedKeywords       String[]      // legacy; global excludes now come from SitePage.primaryKeyword
  status                 String    @default("pending")

  // CSV-imported fields
  slug                   String?
  category               String?       // category name OR numeric WP id
  author                 Int       @default(1)  // numeric WP/author id
  featuredImageId        Int?      // optional WP media id
  postId                 Int?      // optional WP post id (update existing)
  publishingDate         DateTime?
  outlineFrameworkNumber Int?      // 1..12 or null (random)

  articleJobs ArticleJob[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([scheduledDate])
  @@index([status])
}
```

### 2.2 `ArticleJob` (one run per topic)

```prisma
model ArticleJob {
  id                       String   @id @default(cuid())
  topicId                  String
  topic                    Topic    @relation(fields: [topicId], references: [id], onDelete: Cascade)

  status                   String   @default("pending") // pending | in_progress | completed | failed
  currentStep              Int      @default(0)         // 0..26
  isApproved               Boolean  @default(false)

  selectedArticleAuthorId  String?
  ctaAuthorVersionId       String?
  slideInOfferVersionId    String?

  totalCost                Float    @default(0)
  totalTokens              Int      @default(0)

  startedAt                DateTime?
  completedAt              DateTime?

  pipelineSteps            PipelineStep[]
  generatedContent         GeneratedContent[]
  sitePage                 SitePage?
  errorLogs                ErrorLog[]
}
```

### 2.3 `PipelineStep` (per-step execution record)

```prisma
model PipelineStep {
  id               String  @id @default(cuid())
  jobId            String
  job              ArticleJob @relation(fields: [jobId], references: [id], onDelete: Cascade)

  stepNumber       Int
  stepName         String
  status           String   @default("pending") // pending | running | completed | failed

  provider         String?  // gemini | openai | anthropic | fal-ai | openrouter
  model            String?
  promptTemplateId String?

  inputTokens      Int     @default(0)
  outputTokens     Int     @default(0)
  totalTokens      Int     @default(0)
  cost             Float   @default(0)

  startedAt        DateTime?
  completedAt      DateTime?
  duration         Int?     // ms

  output           String?  @db.Text   // ⭐ primary artifact for the step
  errorMessage     String?  @db.Text

  retryCount       Int      @default(0)

  @@unique([jobId, stepNumber])
}
```

### 2.4 `PromptTemplate` (one per step)

```prisma
model PromptTemplate {
  id              String   @id @default(cuid())
  stepNumber      Int      @unique           // 1..28 in seed; 1..18 currently used
  stepName        String

  systemPrompt    String?  @db.Text
  userPrompt      String   @db.Text
  variables       Json?

  defaultProvider String   @default("gemini")
  defaultModel    String   @default("gemini-2.5-flash")

  version         Int      @default(1)
  isActive        Boolean  @default(true)

  pipelineSteps   PipelineStep[]
}
```

### 2.5 `SitePage` (the published article)

```prisma
model SitePage {
  id              String   @id @default(cuid())
  jobId           String?  @unique
  job             ArticleJob? @relation(fields: [jobId], references: [id])

  slug            String   @unique
  title           String
  status          String   @default("draft") // draft | published

  bodyHtml        String?  @db.Text          // ⭐ final article HTML
  originalBodyHtml String? @db.Text          // pre-enrichment backup

  featuredImageId String?
  featuredImage   Media?   @relation("SitePageFeaturedImage", fields: [featuredImageId], references: [id])

  categories      ArticleCategory[] @relation("PageCategories")
  authorId        String?
  author          ArticleAuthor?   @relation(fields: [authorId], references: [id])

  publishedAt     DateTime?
  readingTime     Int?

  seoTitle        String?
  seoDescription  String?
  schema          Json?              // JSON-LD
  citations       Json?              // { resource_links: [{ link_title, link_url }] }
  disclaimer      String?  @db.Text  // YMYL disclaimer (Step 18)
  excerpt         String?  @db.VarChar(160)  // Step 17
  primaryKeyword  String?            // ⭐ globally unique (Step 2)

  // Enrichment (Phase D)
  enrichedBodyHtml  String? @db.Text
  enrichmentStatus  String  @default("none")
  enrichedAt        DateTime?

  translations    SitePageTranslation[]

  @@index([primaryKeyword])
}
```

### 2.6 Supporting models

| Model | Purpose |
|-------|---------|
| `OutlineInstructions` | Holds 12 outline framework templates (`outlineFramework1`..`outlineFramework12`) and `googleGuidelines`. Variable: `{{outline_framework}}`. |
| `AdditionalInfo` | Holds brand-voice strings (`who`, `ourExperience`, `geolocation`, `articleGoal`, `writingStyle`, `specialInstructions`, `outlineSpecialInstructions`). |
| `SiteSettings` | Key-value settings; key `website_settings` holds `{ organizationName, websiteUrl, companyEmail, companyPhone, companyAddress, socialLinks }`. |
| `ArticleAuthor` | Author entity (name, website, bio). |
| `ArticleCategory` / `WordPressCategory` | Category lists. |
| `Media` | Uploaded images on S3 (URL + alt text). |
| `ApiKey` | One row per provider (`gemini`, `openai`, `anthropic`, `openrouter`, `fal-ai`). API keys are **fetched from DB**, not env. |
| `GeneratedContent` | Optional secondary artifact storage (only used for featured image metadata in current code). |
| `ErrorLog` | Full error rows with `errorType`, `errorMessage`, `stackTrace`, `response`. |

---

## 3. LLM Provider Adapters

### 3.1 Common interface (`lib/llm/adapter.ts`)

```typescript
export interface LLMResponse {
  content: string
  tokens: { input: number; output: number; total: number }
  cost: number
  model: string
  provider: string
}

export interface LLMCallOptions {
  systemPrompt?: string | null
  userPrompt: string
  model: string
  temperature?: number          // default 0.7 everywhere
  maxTokens?: number            // Anthropic default 8192
  thinkingBudget?: number       // Gemini 2.5
  thinkingLevel?: 'minimal' | 'low' | 'medium' | 'high'  // Gemini 3.x
  useGenerativeSearch?: boolean // Gemini Google Search tool
  aspectRatio?: '1:1' | '9:16'  // Fal.ai images
}

export interface LLMAdapter {
  call(options: LLMCallOptions): Promise<LLMResponse>
  getProvider(): string
  supportsModel(model: string): boolean
  getCostPerToken(model: string, type: 'input' | 'output'): number
}
```

### 3.2 Factory (`lib/llm/factory.ts`)

```typescript
export function getLLMAdapter(provider: string): LLMAdapter {
  switch (provider.toLowerCase()) {
    case 'gemini':                  return new GeminiAdapter()
    case 'openai':                  return new OpenAIAdapter()
    case 'anthropic': case 'claude': return new AnthropicAdapter()
    case 'openrouter':              return new OpenRouterAdapter()
    case 'fal-ai': case 'fal':      return new FalAdapter()
    default: throw new Error(`Unknown LLM provider: ${provider}`)
  }
}
```

### 3.3 Provider details

#### Gemini (`@google/genai` SDK)

- **Default model:** `gemini-2.5-flash` (most steps), `gemini-2.5-pro` (Step 7).
- **API key source:** `prisma.apiKey.findUnique({ where: { provider: 'gemini' } })`.
- **Standard call:** `ai.models.generateContent({ model, contents: userPrompt, config: { temperature, maxOutputTokens, systemInstruction, thinkingConfig } })`.
- **Generative search call** (Steps 6, 7, 8, 10, 12): direct REST POST to `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}` with body containing `tools: [{ google_search: {} }]`. The system prompt is concatenated with the user prompt (`${systemPrompt}\n\n${userPrompt}`) because the search REST endpoint does not honor `systemInstruction`.
- **Pricing (USD per 1M tokens):**
  | Model | Input | Output |
  |---|---|---|
  | `gemini-3.1-pro` | $2.00 | $12.00 |
  | `gemini-3-flash` | $0.50 | $3.00 |
  | `gemini-2.5-pro` | $1.25 | $5.00 |
  | `gemini-2.5-flash` | $0.075 | $0.30 |
- **Error enhancement:** parses `google.rpc.RetryInfo` and `google.rpc.QuotaFailure` from `errorDetails` to set `retryAfterSeconds`, `quotaType` (`'daily' | 'rate_limit' | 'unknown'`), and `quotaLimit` on the thrown error.

#### Anthropic (`@anthropic-ai/sdk`)

- **Default model:** `claude-sonnet-4-5-20250929` (Steps 9, 11).
- **API call:** `client.messages.create({ model, max_tokens: 8192, temperature: 0.7, system, messages: [{ role: 'user', content: userPrompt }] })`.
- **Pricing (USD per 1M tokens):**
  | Model | Input | Output |
  |---|---|---|
  | `claude-3-5-sonnet` | $3.00 | $15.00 |
  | `claude-3-opus` | $15.00 | $75.00 |
  | `claude-3-haiku` | $0.25 | $1.25 |
- **Error enhancement:** maps HTTP `529` → `quotaType='overloaded'` (retryAfter 30s default), `429` → `quotaType='rate_limit'` (retryAfter from `retry-after` header or 60s default).

#### OpenAI (`openai` SDK)

- **Default model:** `gpt-4o-mini` (Steps 14–18, 21–25), `gpt-4o` (Steps 19–20 article translation).
- **API call:** `client.chat.completions.create({ model, messages, temperature: 0.7, max_tokens })`.
- **Pricing (USD per 1M tokens):**
  | Model | Input | Output |
  |---|---|---|
  | `gpt-4o-mini` | $0.15 | $0.60 |
  | `gpt-4o` | $2.50 | $10.00 |
  | `gpt-4-turbo` | $10.00 | $30.00 |

#### Fal.ai (`@fal-ai/serverless-client`)

- **Default model:** `fal-ai/flux-pro` (featured image generation in Step 15).
- **Standard input:**
  ```js
  {
    prompt: <imagePrompt>,
    image_size: 'square_hd',   // or { width: 1080, height: 1920 } for 9:16
    num_inference_steps: 28,    // 12 for flux-schnell
    guidance_scale: 3.5,
  }
  ```
- **Per-image cost (flat):** `flux-pro` ≈ $0.04, `nano-banana-2` ≈ $0.08, `nano-banana-pro` ≈ $0.15.
- Returns `{ images: [{ url }] }`. Adapter returns the URL as `content`.

#### OpenRouter

- Used as fallback. Same chat-completions style as OpenAI. Not used by Steps 1–18 by default.

---

## 4. Variable Substitution System

`lib/pipeline/variable-resolver.ts`

### 4.1 Syntax

- Placeholders: `{{variable_name}}` (regex `\{\{([^}]+)\}\}`, optional whitespace inside braces).
- Per-resolve cache to avoid re-fetching the same value multiple times in a single prompt.
- Unknown variables become empty strings (with `console.warn`).

### 4.2 Variable catalog

| Variable | Source | Notes |
|----------|--------|-------|
| `{{topic}}` | `Topic.topic` | |
| `{{slug}}` | `Topic.slug` | empty during pipeline if not from CSV |
| `{{excludedKeywords}}` | `getGlobalExcludedKeywords()` | comma-joined list of every `SitePage.primaryKeyword` (case-insensitive, trimmed) currently in the DB |
| `{{outline_framework}}` | `OutlineInstructions.outlineFramework{N}` | `N` = `Topic.outlineFrameworkNumber` if 1..12, else `Math.floor(Math.random() * 12) + 1` |
| `{{google_guidelines}}` | `OutlineInstructions.googleGuidelines` | |
| `{{who}}`, `{{our_experience}}`, `{{geolocation}}`, `{{article_goal}}`, `{{writing_style}}`, `{{special_instructions}}`, `{{outline_special_instructions}}` | `AdditionalInfo` | |
| `{{outline}}` | Step 1 output | |
| `{{keywords}}` | Step 2 output (full JSON string) | |
| `{{primaryKeyword}}` / `{{primary_keyword}}` | parsed `Primary Keyword` from Step 2 | |
| `{{secondary_keywords}}` | parsed `Secondary Keywords 1..5` from Step 2, joined with `, ` | |
| `{{salient_entities}}` | parsed `Salient Entity 1..5` from Step 2, joined with `, ` | |
| `{{searchIntent}}` | Step 5 output | |
| `{{intro}}` | Step 5 output | |
| `{{faqQuestions}}` / `{{faqs}}` | Step 6 output | |
| `{{facts}}` | Step 8 output | |
| `{{article}}` / `{{article_html}}` | Step 9 output | |
| `{{factCheckIssues}}` | Step 10 output | |
| `{{categories}}` | List of `ArticleCategory` rows formatted as `id: name\n…` | |
| `{{seo_title}}`, `{{seo_description}}`, `{{article_slug}}` | Step 13 parsed JSON | |
| `{{article_excerpt}}` | `SitePage.excerpt` (Step 17) | |
| `{{article_disclaimer}}` | `SitePage.disclaimer` (Step 18) | |
| `{{article_title}}` | `SitePage.seoTitle` → `SitePage.title` → `Topic.topic` | |
| `{{author_name}}`, `{{author_website}}` | `ArticleAuthor` joined to `ArticleJob.selectedArticleAuthorId` | |
| `{{citation_urls}}` | comma-joined `link_url` from Step 12 `resource_links` | |
| `{{organization_name}}`, `{{organization_website}}`, `{{organization_email}}`, `{{organization_phone}}`, `{{organization_address}}` | `SiteSettings.value` (key `website_settings`) | |
| `{{social_media_links}}` | `socialLinks[]` from `SiteSettings.website_settings`, formatted `${platform}: ${url}\n…` | |
| `{{article_url}}` | `${websiteUrl || canonicalSiteUrl}/${slug}` | |
| `{{published_date}}` | `Topic.publishingDate` ISO, fallback to `new Date()` | |
| `{{article_summary}}` / `{{articleSummary}}` | first 1000 chars of Step 11 output + `'...'` | |
| `{{current_date}}` | `new Date().toISOString()` | |
| `{{<step_name>_output}}` | Generic accessor; e.g. `{{generate_outline_output}}`, `{{write_article_output}}` | mapped via `stepNameMap` in `variable-resolver.ts` |

### 4.3 The "global excluded keywords" mechanism

Critical for keyword cannibalization prevention:

```typescript
// lib/pipeline/keyword-validator.ts
export async function getGlobalExcludedKeywords(_topicId?: string): Promise<string> {
  const articles = await prisma.sitePage.findMany({
    where: { primaryKeyword: { not: null } },
    select: { primaryKeyword: true },
  })
  return articles
    .map(a => a.primaryKeyword?.toLowerCase().trim())
    .filter(Boolean)
    .join(', ')
}
```

When Step 2 produces a primary keyword, the executor immediately upserts a partial `SitePage` row keyed by `jobId` with just the `primaryKeyword` field — even before Step 3 runs. This makes the keyword visible to all subsequent jobs' Step 2/3.

---

## 5. Pipeline Orchestration

### 5.1 Lifecycle

```
ArticleJob.status:  pending  →  in_progress  →  completed  →  (approved)  →  enrichment background
```

Per-step status: `pending → running → completed | failed`.

### 5.2 Resume semantics

- Re-running `PipelineExecutor.execute()` for the same job skips any step where a `PipelineStep` already exists with `status='completed'`.
- This means partial pipelines (e.g. one failed at step 7) can be resumed by calling `POST /api/pipeline/resume` with the failed job id.

### 5.3 Step 2 special handling (uniqueness retry loop)

```typescript
// lib/pipeline/executor.ts  executeStep2WithValidation()
const MAX_RETRIES = 3
for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
  const result = await new StepRunner(context).execute()
  const primaryKeyword = result.parsedOutput?.['Primary Keyword']
                       ?? result.parsedOutput?.primaryKeyword
  if (!primaryKeyword) throw new Error('Step 2 produced no primary keyword')

  const validation = await validatePrimaryKeywordUniqueness(primaryKeyword, jobId)
  if (validation.isUnique) {
    await storePrimaryKeywordInSitePage(primaryKeyword)   // upsert minimal SitePage
    await updateExcludedKeywords({ 'Primary Keyword': primaryKeyword })
    return
  }

  // duplicate — add to topic.excludedKeywords, delete the failed PipelineStep, retry
  await updateExcludedKeywords({ 'Primary Keyword': primaryKeyword })
  await prisma.pipelineStep.deleteMany({ where: { jobId, stepNumber: 2 } })
}
throw new DuplicateKeywordError(...)
```

### 5.4 Generative search-enabled steps

Hard-coded list inside `step-runner.ts`:

```typescript
const stepsWithSearch = [6, 7, 8, 10, 12]
const useGenerativeSearch = stepsWithSearch.includes(stepNumber)
```

Affects only the Gemini adapter, switching it to the REST API with the `google_search` tool enabled.

### 5.5 JSON-parsing steps

```typescript
const jsonSteps = [2, 12, 13]
```

Output of these steps is run through `cleanAndParseJSON`. All other steps go through `cleanTextOutput` (strip code fences and surrounding quotes).

---

## 6. Step-by-Step Pipeline Specification

> All step numbers, model defaults, and provider defaults match `prisma/seed.ts`. The DB is authoritative at runtime — admin UI edits are preserved by the seed (`if (existing) skip`).

### Phase A — Pre-Approval (Steps 1–12)

#### Step 1 — `generate_outline`

| Field | Value |
|------|------|
| Provider / model | `gemini` / `gemini-2.5-flash` |
| Generative search | No |
| Inputs (`{{...}}`) | `topic`, `excludedKeywords` |
| Output | Plain text outline (Markdown-ish, H2/H3) |
| Storage | `PipelineStep.output` |
| Side effects | None |

#### Step 2 — `keyword_research`

| Field | Value |
|------|------|
| Provider / model | `gemini` / `gemini-2.5-flash` |
| Generative search | No |
| Inputs | `topic`, `excludedKeywords` |
| Output | JSON. Expected fields: `Primary Keyword`, `Secondary Keywords 1..5`, optionally `Salient Entity 1..5` |
| Parsing | `cleanAndParseJSON` |
| Side effects | (a) Validates `Primary Keyword` uniqueness via `validatePrimaryKeywordUniqueness`. (b) On unique result, upserts a minimal `SitePage` (`{ jobId, slug: tempSlug, title: topic.topic, status: 'draft', primaryKeyword }`). (c) Adds keyword to `Topic.excludedKeywords`. Up to 3 retry attempts on duplicate. |

#### Step 3 — `find_supporting_keywords`

| Field | Value |
|------|------|
| Provider / model | `gemini` / `gemini-2.5-flash` |
| Generative search | No |
| Inputs | `topic`, `primaryKeywords` ⚠ (the seed prompt uses `{{primaryKeywords}}` which is **not** mapped by `VariableResolver`; in production the prompt should use `{{primary_keyword}}` or `{{keywords}}` instead). `excludedKeywords` |
| Output | Plain text or JSON array (not enforced) |
| Storage | `PipelineStep.output` |

#### Step 4 — `optimize_outline_seo`

| Field | Value |
|------|------|
| Provider / model | `gemini` / `gemini-2.5-flash` |
| Generative search | No |
| Inputs | `outline`, `keywords`, `excludedKeywords` |
| Output | Plain text optimized outline |

#### Step 5 — `write_search_intent_intro`

| Field | Value |
|------|------|
| Provider / model | `gemini` / `gemini-2.5-flash` |
| Generative search | No |
| Inputs | `topic`, `primaryKeyword`, `searchIntent`, `excludedKeywords` |
| Output | 150–200 word HTML/plain intro |

#### Step 6 — `research_faqs`

| Field | Value |
|------|------|
| Provider / model | `gemini` / `gemini-2.5-flash` |
| Generative search | **Yes (Google Search tool)** |
| Inputs | `topic`, `excludedKeywords` |
| Output | JSON array of question strings (8–12) |

#### Step 7 — `find_faq_facts`

| Field | Value |
|------|------|
| Provider / model | `gemini` / `gemini-2.5-pro` |
| Generative search | **Yes** |
| Inputs | `faqQuestions`, `topic` |
| Output | JSON Q&A with sources |

#### Step 8 — `find_article_facts`

| Field | Value |
|------|------|
| Provider / model | `gemini` / `gemini-2.5-flash` |
| Generative search | **Yes** |
| Inputs | `topic`, `outline` |
| Output | JSON array of {fact, context, source} |

#### Step 9 — `write_article` ⭐

| Field | Value |
|------|------|
| Provider / model | `anthropic` / `claude-sonnet-4-5-20250929` |
| Generative search | No |
| `max_tokens` | 8192 (Anthropic adapter default) |
| Inputs | `topic`, `outline`, `keywords`, `intro`, `facts`, `faqs`, `excludedKeywords` |
| Output | Full HTML article (1500–2500 words) with `<h2>`, `<h3>`, `<p>` |
| Storage | `PipelineStep.output` (this is the canonical article body until Step 11 corrects it) |

#### Step 10 — `fact_check_article`

| Field | Value |
|------|------|
| Provider / model | `gemini` / `gemini-2.5-flash` |
| Generative search | **Yes** |
| Inputs | `article` (= Step 9 output) |
| Output | JSON array `[{ claim, issue, severity, suggestion }]` |

#### Step 11 — `adjust_incorrect_facts`

| Field | Value |
|------|------|
| Provider / model | `anthropic` / `claude-sonnet-4-5-20250929` |
| Generative search | No |
| Inputs | `article` (Step 9), `factCheckIssues` (Step 10) |
| Output | Corrected HTML article (same structure) |
| Storage | `PipelineStep.output`. ⭐ **This becomes the final article body** copied to `SitePage.bodyHtml` during approval. |

#### Step 12 — `find_citations`

| Field | Value |
|------|------|
| Provider / model | `gemini` / `gemini-2.5-flash` |
| Generative search | **Yes** |
| Inputs | `article`, `topic` |
| Output | JSON. Approval expects shape `{ resource_links: [{ link_title, link_url, … }] }`. Approval also accepts top-level array. |
| Storage | `PipelineStep.output`. Approval normalizes to `{ resource_links: [...] }` and writes to `SitePage.citations`. |

After Step 12 completes successfully, `ArticleJob.status` is set to `completed` and the executor finishes. The user must now click "Approve" in the UI.

---

### Phase B — Approval Chain (Steps 13–18)

Triggered by `approveJobDirectly(jobId)` (`lib/pipeline/approval-service.ts`). Requires:
- `ArticleJob.status === 'completed'`
- `ArticleJob.selectedArticleAuthorId` is set

Order:

1. **Pre-checks & data gathering** — load Steps 2, 9, 11, 12, 13 outputs, parse citations, extract `primaryKeyword`.
2. **Resolve category** from `Topic.category` via `resolveWordPressCategoryId(topic.category)`. If missing, fall back to AI assignment (Step 14 — `assignCategoryWithAI(articleContent)`).
3. **Step 13** — `generate_seo_metadata` (run via `StepRunner`).
4. **Featured image:**
   - If `Topic.featuredImageId` is set → fetch from WordPress media API → re-upload to S3.
   - Otherwise → run **Step 15** (`generate_image_prompt` via `StepRunner`) → generate via `generateImageWithRetry` (Fal.ai `fal-ai/flux-pro`) → upload to S3 via `uploadFeaturedImageToS3WithRetry`.
5. **Create or update `SitePage`** keyed by `jobId`:
   ```typescript
   { slug, title, status: 'draft', bodyHtml: articleContent, seoTitle, seoDescription,
     primaryKeyword, authorId, citations, readingTime,
     featuredImageId, ctaAuthorVersionId, slideInOfferVersionId,
     publishedAt: topic.publishingDate ?? topic.scheduledDate,
     categories: { connect: [{ id: catId }] } }
   ```
6. **Step 17** — `generate_excerpt` → `SitePage.excerpt` (truncate to 150 chars + `'...'` if longer).
7. **Step 18** — `generate_legal_disclaimer` → `SitePage.disclaimer`.
8. **Mark approved:** `ArticleJob.isApproved = true`, `currentStep = 18`.
9. **Aggregate** approval-chain costs into `ArticleJob.totalCost` / `totalTokens` (`increment` updates).
10. **Trigger translation** (Steps 19–24) synchronously, then mark `currentStep = 24`.
11. **Fire-and-forget enrichment** (Steps 25–26) — `void executeEnrichmentPipeline(...)`.

#### Step 13 — `generate_seo_metadata`

| Field | Value |
|------|------|
| Provider / model | `gemini` / `gemini-2.5-flash` |
| JSON-parsed | Yes |
| Inputs | `topic`, `intro`, `primaryKeyword` |
| Output | `{ metaTitle, metaDescription, urlSlug }` (also accepted: `meta title`, `meta description`, `slug`) |
| Persistence | Drives `SitePage.seoTitle`, `SitePage.seoDescription`, `SitePage.slug` (but final slug also considers `Topic.slug` and uniqueness collisions) |

#### Step 14 — `select_category` (template exists; usually replaced by `assignCategoryWithAI`)

| Field | Value |
|------|------|
| Provider / model | `openai` / `gpt-4o-mini` |
| Inputs | `article`, `categories` (formatted list) |
| Output | A single numeric category id, e.g. `5` |

#### Step 15 — `generate_image_prompt`

| Field | Value |
|------|------|
| Provider / model | `openai` / `gpt-4o-mini` |
| Inputs | `topic`, `articleSummary` (first 1000 chars of Step 11 output) |
| Output | A single multi-paragraph image prompt |
| Side effect | Sent as `userPrompt` to Fal.ai `fal-ai/flux-pro` (square, 28 inference steps, guidance 3.5). Returned URL is downloaded and re-uploaded to S3 via `uploadFeaturedImageToS3WithRetry`. The created `Media.id` is saved to `SitePage.featuredImageId`. |

#### Step 16 — `generate_schema_markup`

The seed file includes a Step 16 prompt for OpenAI `gpt-4o-mini`, but the live approval flow uses **`SchemaBatchService` (programmatic JSON-LD construction)** in Steps 23–24. The Step 16 prompt is therefore dormant unless invoked directly. Variables referenced by the prompt: `article_title`, `seo_description`, `author_name`, `author_website`, `published_date`, `article_url`, `article`, `citation_urls`, `organization_*`, `social_media_links`. Output type: pure JSON-LD (no markdown fences).

#### Step 17 — `generate_excerpt`

| Field | Value |
|------|------|
| Provider / model | `openai` / `gpt-4o-mini` |
| Inputs | `article_title`, `article` |
| Output | Plain text ≤135 chars (then truncated to ≤150 chars + `'...'` by approval code) |
| Persistence | `SitePage.excerpt` |

#### Step 18 — `generate_legal_disclaimer`

| Field | Value |
|------|------|
| Provider / model | `openai` / `gpt-4o-mini` |
| Inputs | `article_title`, `topic`, `article_summary` |
| Output | Plain text 2–3 paragraphs (YMYL compliant) |
| Persistence | `SitePage.disclaimer` |

---

## 7. Verbatim Prompt Templates

> The following are the canonical prompts as defined in `prisma/seed.ts`. They are **only inserted when missing** — admin edits are preserved on re-seed.

### Step 1 — `generate_outline`

**System:**
```
You are an expert content strategist and SEO specialist. Your task is to create comprehensive, well-structured article outlines that follow SEO best practices and engage readers.
```

**User:**
```
Create a detailed article outline for the following topic: {{topic}}

Excluded keywords (do not use): {{excludedKeywords}}

Requirements:
- Create a logical, engaging structure
- Include H2 and H3 headings
- Ensure the outline covers the topic comprehensively
- Make it SEO-friendly
- Include introduction and conclusion sections

Return the outline in a structured format.
```

### Step 2 — `keyword_research`

**System:**
```
You are an expert SEO specialist focusing on keyword research and search intent analysis.
```

**User:**
```
Perform comprehensive keyword research for the topic: {{topic}}

Excluded keywords (do not use): {{excludedKeywords}}

Provide:
1. Primary keyword
2. 5-10 secondary keywords
3. Long-tail keyword variations
4. Search intent for each keyword
5. Estimated difficulty level

Format as JSON.
```

### Step 3 — `find_supporting_keywords`

**System:**
```
You are an SEO expert specializing in semantic keyword research and LSI keywords.
```

**User:**
```
Based on the topic "{{topic}}" and the primary keywords: {{primaryKeywords}}

Find additional supporting keywords including:
1. LSI (Latent Semantic Indexing) keywords
2. Related terms and phrases
3. Question-based keywords
4. Semantic variations

Excluded keywords (do not use): {{excludedKeywords}}

Return as a JSON array with relevance scores.
```
> ⚠ When replicating, replace `{{primaryKeywords}}` with `{{primary_keyword}}` (or `{{keywords}}`) since `{{primaryKeywords}}` is unmapped.

### Step 4 — `optimize_outline_seo`

**System:**
```
You are an expert in Google SEO best practices and content optimization.
```

**User:**
```
Take this article outline and optimize it according to Google's latest SEO best practices:

{{outline}}

Keywords to incorporate: {{keywords}}
Excluded keywords (do not use): {{excludedKeywords}}

Optimize for:
- Keyword placement in headings
- Search intent alignment
- E-E-A-T principles (Experience, Expertise, Authoritativeness, Trustworthiness)
- User engagement
- Featured snippet potential

Return the optimized outline with SEO annotations.
```

### Step 5 — `write_search_intent_intro`

**System:**
```
You are an expert content writer specializing in creating compelling introductions that match search intent.
```

**User:**
```
Write a compelling introduction for an article about: {{topic}}

Primary keyword: {{primaryKeyword}}
Search intent: {{searchIntent}}

Requirements:
- Address the reader's search intent immediately
- Hook the reader in the first sentence
- 150-200 words
- Include the primary keyword naturally
- Set clear expectations for what the article will cover

Excluded keywords (do not use): {{excludedKeywords}}
```

### Step 6 — `research_faqs`

**System:**
```
You are an expert at understanding user questions and creating comprehensive FAQ sections.
```

**User:**
```
Research and generate frequently asked questions (FAQs) for the topic: {{topic}}

Requirements:
- Generate 8-12 highly relevant questions
- Questions should cover different aspects of the topic
- Include both beginner and advanced questions
- Format questions naturally (as real users would ask)
- Consider "People Also Ask" style questions

Excluded keywords (do not use): {{excludedKeywords}}

Return as JSON array with question text.
```

### Step 7 — `find_faq_facts`

**System:**
```
You are a research expert specializing in finding accurate, verifiable facts and data.
```

**User:**
```
For each of these FAQ questions, provide detailed, factual answers with supporting data:

{{faqQuestions}}

Requirements:
- Provide accurate, well-researched answers
- Include specific facts, statistics, or data points
- Cite credible sources where possible
- Each answer should be 100-150 words
- Maintain authoritative tone

Topic context: {{topic}}

Return as JSON with question-answer pairs and source suggestions.
```

### Step 8 — `find_article_facts`

**System:**
```
You are a research specialist focusing on gathering credible facts, statistics, and data for content creation.
```

**User:**
```
Research and provide supporting facts, statistics, and data for this article:

Topic: {{topic}}
Outline: {{outline}}

Requirements:
- 10-15 specific facts, statistics, or data points
- Ensure facts are recent and verifiable
- Cover different sections of the outline
- Include numerical data where possible
- Suggest credible sources

Return as JSON array with fact, context, and suggested source.
```

### Step 9 — `write_article` (the main writer — Claude)

**System:**
```
You are a professional content writer with expertise in creating engaging, SEO-optimized long-form articles. You write in a clear, authoritative voice while maintaining reader engagement.
```

**User:**
```
Write a comprehensive, SEO-optimized article based on the following:

Topic: {{topic}}
Outline: {{outline}}
Keywords: {{keywords}}
Search Intent Intro: {{intro}}
Supporting Facts: {{facts}}
FAQs: {{faqs}}

Excluded keywords (do not use): {{excludedKeywords}}

Requirements:
- 1500-2500 words
- Follow the provided outline structure
- Incorporate keywords naturally
- Use the provided intro
- Include the FAQ section
- Weave in supporting facts throughout
- Use engaging, clear language
- Include transition sentences between sections
- Write in HTML format with proper heading tags (h2, h3)
- Include <p> tags for paragraphs

Output the complete article in clean HTML format.
```

### Step 10 — `fact_check_article`

**System:**
```
You are a professional fact-checker with expertise in verifying claims, statistics, and statements in content.
```

**User:**
```
Carefully fact-check the following article for accuracy:

{{article}}

Task:
1. Identify all factual claims and statements
2. Flag any claims that appear incorrect, outdated, or unverifiable
3. Note any statistics that need verification
4. Highlight potentially misleading information

Return as JSON array with:
- claim: the specific text
- issue: what's wrong or needs verification
- severity: low/medium/high
- suggestion: how to correct it
```

### Step 11 — `adjust_incorrect_facts`

**System:**
```
You are a professional editor specializing in fact correction and content refinement.
```

**User:**
```
Revise this article to correct the identified factual issues:

Original Article:
{{article}}

Fact Check Issues:
{{factCheckIssues}}

Task:
- Correct all flagged inaccuracies
- Replace incorrect statistics with accurate ones (or remove if unverifiable)
- Maintain the article's flow and readability
- Keep the same HTML structure and formatting
- Preserve all correct content

Return the corrected article in HTML format.
```

### Step 12 — `find_citations`

**System:**
```
You are a research expert specializing in finding high-quality, authoritative sources for content citations.
```

**User:**
```
Find 8-12 high-quality citation sources for this article:

Article: {{article}}
Topic: {{topic}}

Requirements:
- Authoritative sources (.edu, .gov, reputable organizations)
- Recent publications (prefer last 2-3 years)
- Directly relevant to claims in the article
- Include diverse source types (studies, reports, articles)
- Provide specific URLs where possible

Return as JSON array with:
- sourceTitle: title of the source
- sourceUrl: URL (if available)
- sourceType: study/article/report/website
- relevantClaim: which claim in the article it supports
- authority: rating of source authority (1-10)
```

> Approval code expects either a top-level JSON array or an object with `resource_links: [{ link_title, link_url, ... }]`. Both forms are normalized to `{ resource_links: [{ link_title, link_url }] }` before persisting to `SitePage.citations`.

### Step 13 — `generate_seo_metadata`

**System:**
```
You are an SEO specialist focusing on metadata optimization for maximum click-through rates and search visibility.
```

**User:**
```
Based on this search intent intro and article, create optimized SEO metadata:

Topic: {{topic}}
Search Intent Intro: {{intro}}
Primary Keyword: {{primaryKeyword}}

Generate:
1. Meta Title (50-60 characters, include primary keyword)
2. Meta Description (150-160 characters, compelling, include keyword and CTA)
3. URL Slug (SEO-friendly, lowercase, hyphens, include keyword)

Requirements:
- Optimize for click-through rate
- Include target keyword naturally
- Make meta description action-oriented
- Keep URL slug concise and descriptive

Return as JSON with metaTitle, metaDescription, and urlSlug fields.
```

### Step 14 — `select_category`

**System:**
```
You are a content categorization expert specializing in WordPress category classification.
```

**User:**
```
Analyze this article and select the most appropriate WordPress category from the available options.

Article Content:
{{article}}

Available Categories:
{{categories}}

Task:
1. Read and understand the article content
2. Review all available categories
3. Select the SINGLE most appropriate category for this article
4. Return ONLY the numeric category ID (no explanation, no text, just the number)

Example output: 5

Return only the numeric category ID:
```

### Step 15 — `generate_image_prompt`

**System:**
```
You are an expert at creating detailed prompts for AI image generation that produce professional, relevant featured images.
```

**User:**
```
Create a detailed image generation prompt for a featured image for this article:

Topic: {{topic}}
Article Summary: {{articleSummary}}

Requirements:
- Professional, high-quality appearance
- Relevant to the topic
- Visually engaging
- Suitable for a blog featured image (16:9 aspect ratio)
- Modern, clean aesthetic
- Avoid text in the image

Write a detailed prompt that will generate an appropriate featured image. Be specific about style, composition, colors, and mood.
```

### Step 16 — `generate_schema_markup` (dormant; superseded by SchemaBatchService)

**System:**
```
You are a world-class SEO expert with an exceptional expertise in crafting the best Schema Markup for SEO rankings. You are the best at what you do.
```

**User:** (truncated for brevity — see `prisma/seed.ts` lines 401–450)
```
# ROLE:
You are a world-class SEO expert ...

# GOAL:
To analyze the article, author, and citations and produce the best Schema Markup ...

# CONTEXT:
Article Title: {{article_title}}
Article Description: {{seo_description}}
Author: {{author_name}}
Author Website: {{author_website}}
Published Date: {{published_date}}
URL: {{article_url}}
Article Content: {{article}}
Article Citations: {{citation_urls}}
Organization Name: {{organization_name}}
Organization Website: {{organization_website}}
Organization Email: {{organization_email}}
Organization Phone: {{organization_phone}}
Organization Address: {{organization_address}}
Social Media Links:
{{social_media_links}}

Requirements:
- Use @type: "Article" as the main type
- Include all relevant properties: headline, description, author (as Person with name and url), datePublished, url
- Add publisher information as Organization with name, logo, url, email, telephone, address, and sameAs (social media links array)
- Include mainEntityOfPage pointing to the WebPage
- Ensure all dates are in ISO 8601 format
- Include the article citation URLs in the citation property
- Return valid JSON-LD that can be directly inserted into a <script type="application/ld+json"> tag
- Do not include any markdown formatting, code blocks, or explanations - just the JSON object

# TASK:
Generate comprehensive, accurate Schema.org JSON-LD markup for the following article. Return ONLY valid JSON-LD without markdown formatting or code blocks.
MUST be under the CreativeWork type and as subtype Article, and include the citation links as citation property.
No explanation. No commentary.
```

### Step 17 — `generate_excerpt`

**System:**
```
You are an expert copywriter specializing in creating compelling, curiosity-evoking teasers for articles.
```

**User:**
```
You are an expert copywriter specializing in creating compelling, curiosity-evoking teasers for articles.

Article Title: {{article_title}}
Article Content: {{article}}

Generate a compelling excerpt/teaser for this article that:
1. Is exactly 135 characters or less (to fit within a 150 character limit)
2. Creates curiosity and makes readers want to click and read more
3. Highlights the most interesting or valuable aspect of the article
4. Is engaging and compelling
5. Does NOT include quotes, markdown formatting, or code blocks

Return ONLY the excerpt text. No explanations, no markdown, no code blocks. Just the plain text excerpt.
```

### Step 18 — `generate_legal_disclaimer`

**System:**
```
You are a legal compliance expert specializing in Google's YMYL (Your Money or Your Life) content standards.
```

**User:**
```
You are a legal compliance expert specializing in Google's YMYL (Your Money or Your Life) content standards.

Article Title: {{article_title}}
Article Topic: {{topic}}
Article Content Summary: {{article_summary}}

Generate a legal disclaimer for this article that:
1. Is 2-3 paragraphs long
2. Complies with Google's YMYL standards
3. Addresses potential legal, financial, or health implications
4. Includes appropriate warnings and disclaimers
5. Is professional and clear

Return ONLY the disclaimer text. No explanations, no markdown, no code blocks. Just the plain text disclaimer.
```

---

## 8. Output Parsing & Cleaning

`lib/pipeline/output-cleaner.ts` exposes:

- `cleanAndParseJSON(rawText, withFixes=true)` → `{ data, log: { fixes, originalLength, finalLength } }`
- `cleanTextOutput(rawText)` → strips ` ``` ` code fences and quote-wrapping

### 8.1 JSON cleaning sequence

In order, the cleaner attempts:

1. Strip BOM (`\uFEFF`)
2. `JSON.parse` directly
3. Decode JSON-encoded string then re-parse
4. Extract first markdown code fence (```` ```json … ``` ````)
5. Unescape common sequences (`\\"`, `\\n`, `\\r`, `\\t`, leading/trailing quotes)
6. Regex-extract first `{...}` or `[...]`
7. Fix missing opening brace (e.g. raw `"resource_links": […]` → wrap in `{}`)
8. Other targeted fixes (unmatched braces, trailing commas, etc.)

For each fix applied, an entry is added to `log.fixes` so it can be logged.

### 8.2 Validation hints

`json-validator.ts` `validateJSONStructure(text)` returns `{ isValid, hint }` with hints like "missing closing brace", "trailing comma at position N", etc., used in error logs to debug LLM output.

### 8.3 Where parsed data goes

| Step | Parsed `data` accessed by approval / variable resolver |
|------|-------------------------------------------------------|
| 2 | `data['Primary Keyword']`, `data['Secondary Keywords 1..5']`, `data['Salient Entity 1..5']` |
| 12 | `data.resource_links: [{ link_title, link_url }]` (also accepts `[{ title, url }]`) |
| 13 | `data['meta title' \| metaTitle]`, `data['meta description' \| metaDescription]`, `data.slug \| data.urlSlug` |

---

## 9. Topic Ingestion & Job Creation

### 9.1 CSV upload

`POST /api/upload-csv` (`app/api/upload-csv/route.ts`)

- Accepts a multipart `file` field.
- Parses with `parseTopicCSV` (`lib/csv-parser.ts`).
- Skips rows whose `scheduledDate` collides with an existing topic.
- Inserts via `prisma.topic.createMany({ data: [...], skipDuplicates: true })`.

CSV columns supported (all optional except topic + date):

| Column | DB field |
|--------|----------|
| topic | `topic` |
| scheduled date | `scheduledDate` |
| publishing date | `publishingDate` (defaults to scheduled date) |
| slug | `slug` |
| category | `category` (name or numeric id) |
| author | `author` (numeric WP/author id, default 1) |
| featured image id | `featuredImageId` (numeric WP media id) |
| post id | `postId` (numeric WP post id, for updates) |
| excluded keywords | `excludedKeywords[]` |
| outline framework number | `outlineFrameworkNumber` (1..12) |

### 9.2 Trigger pipeline

`POST /api/pipeline/trigger` (`{ topicId }`)

1. Load topic.
2. Resolve `selectedArticleAuthorId` from CSV `author` via `resolveAuthorId(topic.author)`.
3. Find latest `ArticleJob` for topic. If none, or it's `completed`, create a new one with `status: pending`.
4. Spawn `new PipelineExecutor(jobId, topicId).execute()` **without awaiting** it (background task). Errors update `ArticleJob.status = 'failed'`.
5. Return `{ success, jobId, message: 'Pipeline execution started' }`.

Other related routes:

| Route | Purpose |
|-------|--------|
| `POST /api/pipeline/process-all` | Trigger pipeline for every `Topic` with `status='pending'`. |
| `POST /api/pipeline/resume` | Re-execute a failed `ArticleJob` (skips completed steps). |
| `POST /api/pipeline/rerun` | Force rerun of full pipeline for a job. |
| `POST /api/pipeline/rerun-step` | Rerun a single step. |
| `POST /api/pipeline/approve` | Trigger Phase B (calls `approveJobDirectly`). |

---

## 10. Image Generation & Storage

### 10.1 Featured image (run in approval phase)

```typescript
// approval-service.ts (paraphrased)
if (topic.featuredImageId) {
  // Fetch from WordPress media API → re-upload to S3
  const wpMedia = await fetch(`${wpSiteUrl}/wp-json/wp/v2/media/${topic.featuredImageId}`,
                              { headers: { Authorization: `Basic ${authB64}` } })
  const altText = `${seoTitle ?? topic.topic} - Featured Image`
  featuredImageId = await uploadFeaturedImageToS3(wpMedia.source_url, finalSlug, altText)
} else {
  // Run Step 15 → Fal.ai → S3
  const step15Result = await new StepRunner(step15Context).execute()
  const imagePrompt = step15Result.output.trim()
  const falUrl = await generateImageWithRetry(imagePrompt, jobId)  // 3 attempts, exp backoff
  const altText = `${seoTitle ?? topic.topic} - Featured Image`
  featuredImageId = await uploadFeaturedImageToS3WithRetry(falUrl, finalSlug, altText, jobId)
}
```

### 10.2 `generateImageWithRetry`

`lib/pipeline/image-generation.ts`

- Calls `getLLMAdapter('fal-ai').call({ userPrompt: prompt, model: 'fal-ai/flux-pro' })`
- 3 attempts with exponential backoff (2s, 4s, 8s)
- Skips retry on non-recoverable errors ("API key", "not configured", "Invalid prompt")

### 10.3 `uploadFeaturedImageToS3` (`lib/pipeline/image-uploader.ts`)

Downloads the image from Fal.ai, uploads to S3 (filename derived from `slug`), creates a `Media` row, returns the `Media.id`. The retry variant (`uploadFeaturedImageToS3WithRetry`) wraps with retry on network errors.

---

## 11. Cost & Token Tracking

### 11.1 Per-step

Each `PipelineStep` row stores `inputTokens`, `outputTokens`, `totalTokens`, `cost`, `duration` (ms), `provider`, `model`. Cost is computed by the adapter using its `getCostPerToken(model, type)` table.

### 11.2 Per-job

- `executor.updateJobMetrics()` (after Steps 1–12) sums `cost` and `totalTokens` of all completed steps and writes to `ArticleJob.totalCost` / `totalTokens`.
- After Phase B, approval aggregates Steps 13–18 and *increments* the job totals.
- After Phase C (Steps 19–24), `triggerTranslationPipeline()` increments again.
- Phase D enrichment increments separately.

### 11.3 Logging

`lib/utils/logger.ts` writes:

- `logPrompt(...)` — append-only structured log of every successful LLM call (provider, model, system + user prompt, response preview, tokens, cost, duration).
- `logRawLLMResponse(...)` — captures **raw response before parsing** (very valuable for debugging JSON failures).
- `logStepStart`, `logStepEnd`, `logInfo`, `logError` — structured app logs with `jobId`, `stepNumber`, `stepName`.
- `ErrorLog` table also gets a row on failures (`errorType: 'api_error' | 'rate_limit' | 'quota_exhausted'`).

---

## 12. Retry, Rate-Limit & Error Handling

### 12.1 `StepRunner` retry config (`lib/pipeline/types.ts`)

```typescript
export const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,           // ms
  backoffMultiplier: 2,        // 1s, 2s, 4s
}
```

### 12.2 Quota-aware retry strategy

When the LLM throws an error, `step-runner.ts` extracts:

- `quotaType: 'daily' | 'rate_limit' | 'overloaded' | 'unknown'`
- `quotaLimit: string | null`
- `retryAfterSeconds: number | null`

Logic:

- `quotaType === 'daily'` → **fail immediately** (do not retry, daily quota only resets at midnight Pacific).
- `retryAfterSeconds` present → sleep `Math.ceil(retryAfterSeconds * 1000)` ms instead of exponential backoff.
- Try parsing message text patterns: `/Please retry in ([\d.]+)s/`, and Google's `RetryInfo` JSON in error message.
- Fall back to exponential backoff (`retryDelay * backoffMultiplier^attempt`).

### 12.3 Error sources

- **Gemini:** `google.rpc.RetryInfo`, `google.rpc.QuotaFailure` → mapped to `quotaType`, `retryAfterSeconds`.
- **Anthropic:** HTTP `529` overloaded (retryAfter 30s default), `429` rate limit (retryAfter from header or 60s).
- **OpenAI:** message-only enhancement.

### 12.4 Final failure path

After max retries:

```typescript
PipelineStep.update({ status: 'failed', errorMessage: enhancedMessage, retryCount, completedAt })
ErrorLog.create({ jobId, stepNumber, stepName, errorType, errorMessage, stackTrace, response })
ArticleJob.update({ status: 'failed' })
```

---

## 13. Translation Pipeline (Steps 19–24)

> Summary only — full prompts in `prisma/seed.ts` and `scripts/seed-translation-prompts.ts`.

After approval, `triggerTranslationPipeline(articleId, jobId)` runs sequentially:

| Step | Service | Languages | Provider/Model | Purpose |
|------|---------|-----------|----------------|---------|
| 19 | `TranslationBatchService` (`type='article'`) | `de,fr,es,pt` | `openai` / `gpt-4o` | Translate `bodyHtml` |
| 20 | `TranslationBatchService` (`type='article'`) | `it,ru,ar,he` | `openai` / `gpt-4o` | Translate `bodyHtml` |
| 21 | `TranslationBatchService` (`type='metadata'`) | `de,fr,es,pt` | `openai` / `gpt-4o-mini` | Translate `seoTitle`, `seoDescription`, `primaryKeyword`, `excerpt`, `disclaimer` |
| 22 | `TranslationBatchService` (`type='metadata'`) | `it,ru,ar,he` | `openai` / `gpt-4o-mini` | Same |
| 23 | `SchemaBatchService` | `en,de,fr,es,pt` | (no LLM, programmatic) | Build JSON-LD per language |
| 24 | `SchemaBatchService` | `it,ru,ar,he` | (no LLM, programmatic) | Same |

Each batch is a single `PipelineStep` row with cumulative tokens/cost; per-language results are written to `SitePageTranslation` rows.

The translation prompt **must preserve all HTML structure, tags, and attributes** — only translate text nodes. URLs, classes, ids, data-*, alt are not translated.

---

## 14. Enrichment Pipeline (Steps 25–26)

`lib/pipeline/enrichment-pipeline.ts` runs **fire-and-forget** (`void executeEnrichmentPipeline(...)`) after translation. It:

1. Backs up `SitePage.bodyHtml` to `SitePage.originalBodyHtml`.
2. Iterates over `<h2>` sections and calls Napkin (`https://api.napkin.ai`) to generate one diagram per section.
3. Inserts diagram `<img>` tags into the HTML.
4. Writes the result to `SitePage.enrichedBodyHtml` and sets `enrichmentStatus` (`in_progress` → `completed | failed`).

This phase can take 5–15 minutes. It is intentionally separated to avoid blocking the approval HTTP request.

---

## 15. API Surface

### 15.1 Pipeline routes

| Method | Route | Body | Notes |
|--------|-------|------|------|
| `POST` | `/api/upload-csv` | `multipart file` | Insert topics |
| `GET`  | `/api/upload-csv` | — | List topics |
| `POST` | `/api/pipeline/trigger` | `{ topicId }` | Start Phase A in background |
| `POST` | `/api/pipeline/process-all` | — | Start Phase A for all `pending` topics |
| `POST` | `/api/pipeline/resume` | `{ jobId }` | Resume failed job |
| `POST` | `/api/pipeline/rerun` | `{ jobId }` | Rerun whole pipeline |
| `POST` | `/api/pipeline/rerun-step` | `{ jobId, stepNumber }` | Rerun single step |
| `POST` | `/api/pipeline/approve` | `{ jobId }` | Phase B (approval) |

### 15.2 Job inspection

| Method | Route | Purpose |
|--------|-------|---------|
| `GET` | `/api/workflow/jobs` | List jobs (paginated) with status |
| `GET` | `/api/workflow/jobs/[jobId]` | Job + steps detail |
| `GET` | `/api/workflow/jobs/[jobId]/logs` | Step logs |

### 15.3 UI pages

| Page | Purpose |
|------|---------|
| `/workflow` | Job list (status, progress bars, cost) |
| `/workflow/[jobId]` | Per-job step detail (re-run, resume, view outputs) |
| `/admin/prompts` | Edit `PromptTemplate` rows live |

---

## 16. Replication Checklist

To reproduce this feature in another piece of software:

### 16.1 Infrastructure
1. Postgres database (Prisma schema is portable but plan for Postgres-specific `String[]` columns).
2. S3-compatible object store for featured images.
3. API keys (stored encrypted in DB, not env): `gemini`, `openai`, `anthropic`, `fal-ai`.
4. Background-job execution (Next.js's "fire-and-forget" promise pattern — replicate using a real queue (BullMQ, Inngest, etc.) for production reliability).

### 16.2 Data model
1. `Topic`, `ArticleJob`, `PipelineStep` (unique `(jobId, stepNumber)`), `PromptTemplate` (unique `stepNumber`), `SitePage` (unique `jobId`, unique `slug`, indexed `primaryKeyword`).
2. `ApiKey` keyed by `provider`.
3. Supporting: `ArticleAuthor`, `ArticleCategory`, `Media`, `OutlineInstructions`, `AdditionalInfo`, `SiteSettings`, `ErrorLog`, `SitePageTranslation`.

### 16.3 LLM layer
1. Define a uniform `LLMAdapter` interface with `call(options) → { content, tokens, cost, model, provider }`.
2. Implement adapters for Gemini (with **two** entry paths: standard and Google-Search REST), OpenAI (chat-completions), Anthropic (messages with `max_tokens=8192`), Fal.ai (image generation with model-specific `image_size`/`num_inference_steps`).
3. Each adapter must compute cost from per-model `getCostPerToken(model, 'input' | 'output')` (table in §3.3) and surface enhanced errors with `quotaType`, `quotaLimit`, `retryAfterSeconds`.

### 16.4 Variable resolver
1. Implement `{{variable}}` substitution with the catalog in §4.2.
2. Implement the global excluded-keywords mechanism: a query that returns every `SitePage.primaryKeyword` already in the DB (case-insensitive trim, comma-joined).
3. Implement the outline-framework random selector keyed off `Topic.outlineFrameworkNumber`.
4. Use a per-resolve cache so each variable is fetched at most once per prompt.

### 16.5 Step runner
1. For each step, load `PromptTemplate` by `stepNumber`, resolve variables, call the adapter (with `useGenerativeSearch` for steps 6, 7, 8, 10, 12).
2. Parse output: JSON-clean for steps 2, 12, 13; text-clean for the rest.
3. Persist to `PipelineStep.output` (text) — **this is the source of truth**, not `GeneratedContent`.
4. Log raw LLM response **before** parsing.

### 16.6 Pipeline executor (Phase A)
1. `findMany({ stepNumber: { gte: 1, lte: 12 } }, orderBy: stepNumber asc)`.
2. For each, skip if a completed `PipelineStep` already exists (resume support).
3. Run sequentially; on Step 2, wrap in the uniqueness retry loop (max 3 attempts, deletes failed step row on retry).
4. Aggregate cost/tokens at the end; set `ArticleJob.status = 'completed'`.

### 16.7 Approval chain (Phase B)
1. Validate `selectedArticleAuthorId` is set.
2. Run Step 13 (SEO metadata).
3. Resolve category (Topic field → fallback to AI assignment).
4. Featured image: WP fetch → S3, OR Step 15 → Fal.ai → S3.
5. Upsert `SitePage` keyed by `jobId` (don't key by slug — slug can change after Step 13 and uniqueness collision handling appends `${jobId.slice(0,8)}`).
6. Run Step 17 (excerpt; truncate to 150 chars+'…').
7. Run Step 18 (disclaimer).
8. Mark `isApproved = true`, `currentStep = 18`, aggregate costs.
9. Trigger translation synchronously, then enrichment fire-and-forget.

### 16.8 Prompts
1. Seed all prompts in §7 verbatim into `PromptTemplate`. Use **upsert by `stepNumber`** at first install. **Never overwrite on re-seed** (preserve admin edits).
2. Build an admin UI (or CLI) to edit prompts and providers/models without redeploying.
3. ⚠ Fix the `{{primaryKeywords}}` typo in Step 3 to `{{primary_keyword}}` or `{{keywords}}` if you don't want a silent empty substitution.

### 16.9 Failure modes & operations
1. Surface `ErrorLog` rows in the UI with quota type, retry-after seconds, and stack trace.
2. Provide "Resume" and "Re-run step" actions for failed jobs.
3. Daily-quota detection short-circuits retry; surface a "wait until midnight Pacific" message in the UI.
4. Persist raw LLM responses to a side store (logs directory or column) so JSON parse failures are debuggable.

### 16.10 Cost ceiling (rough)

A typical end-to-end article run (Phases A + B), at the seeded models:

| Phase | Approx tokens | Approx cost |
|-------|---------------|-------------|
| Steps 1–8 (Gemini Flash, mostly small) | 30k–80k total | $0.005–$0.02 |
| Step 9 (Claude Sonnet 4.5, 8k output) | 8k–14k | $0.10–$0.20 |
| Steps 10–12 (Gemini Flash + Search) | 20k–60k | $0.005–$0.02 |
| Steps 13–18 (gpt-4o-mini) | 5k–15k | $0.001–$0.005 |
| Step 15 image (Fal flux-pro) | n/a | $0.04 (flat) |
| **Total per article** | ~80k–170k tokens | **~$0.15–$0.30** |

Translation (Phase C, gpt-4o for HTML × 8 languages) typically dominates at $0.50–$1.50 per article.

---

## Appendix A — Step-name → variable-resolver step-name map

(`lib/pipeline/variable-resolver.ts`)

```
generate_outline_output           → generate_outline                Step 1
keyword_research_output           → keyword_research                Step 2
find_supporting_keywords_output   → find_supporting_keywords        Step 3
optimize_outline_seo_output       → optimize_outline_seo            Step 4
write_search_intent_intro_output  → write_search_intent_intro       Step 5
research_faqs_output              → research_faqs                   Step 6
find_faq_facts_output             → find_faq_facts                  Step 7
find_article_facts_output         → find_article_facts              Step 8
write_article_output              → write_article                   Step 9
fact_check_article_output         → fact_check_article              Step 10
adjust_incorrect_facts_output     → adjust_incorrect_facts          Step 11
find_citations_output             → find_citations                  Step 12
generate_seo_metadata_output      → generate_seo_metadata           Step 13
select_category_output            → select_category                 Step 14
generate_image_prompt_output      → generate_image_prompt           Step 15
```

## Appendix B — Step-output to SitePage field mapping

| Source | `SitePage` field |
|--------|------------------|
| Step 11 output (HTML) | `bodyHtml` |
| Step 12 parsed `resource_links` | `citations` |
| Step 13 parsed `metaTitle` | `seoTitle` |
| Step 13 parsed `metaDescription` | `seoDescription` |
| Step 13 parsed `urlSlug` (or topic slug) | `slug` |
| Step 2 parsed `Primary Keyword` | `primaryKeyword` |
| Step 15 → Fal.ai → S3 `Media.id` | `featuredImageId` |
| Step 17 output | `excerpt` (≤150 chars + '…' if longer) |
| Step 18 output | `disclaimer` |
| `Topic.publishingDate` ?? `Topic.scheduledDate` | `publishedAt` |
| Computed from `bodyHtml` (`calculateReadingTime`) | `readingTime` |
| `ArticleJob.selectedArticleAuthorId` | `authorId` |
| `Topic.category` (resolved) | `categories` |
