# Article Production Pipeline — Levercast v1 Implementation Plan

> **Status: IMPLEMENTED** (audited 2026-07-09) — the article pipeline is live (steps 0–13, quality gate, enrichment, publishing). Header previously said implementation-ready pending the DO droplet, which has long since shipped.
>
> **Purpose:** Complete, self-contained specification for the article production feature in Levercast/Socioply. Adapted from a generic source plan (originally a single-tenant WordPress publisher) into Levercast's multi-tenant, multi-output-target model.
>
> **Scope:** Pipeline phases 1–18 (pre-approval generation + approval chain) **plus a mandatory enrichment phase that produces Mermaid diagrams**. Output is decoupled from generation via pluggable targets (Preview / WordPress REST / HTML export / Bundle export). Translation is **out of scope for v1** (deferred — see §13).
>
> **Hard prerequisite:** This feature requires the DigitalOcean Droplet + Fastify worker described in Phase 8 of `Migration-DigitalOcean-Plan.md`. A single article run is 8–25 minutes wall-time, which exceeds Vercel's 300 s function ceiling by 5–10×. Do not begin implementation before Phase 8 ships.

---

## 0. Levercast Adaptations vs. Source Plan

This file is a fork of a source spec written for a different (single-tenant, WordPress-only, auto-publishing) app. The following deltas apply across every section below; sections explicitly call out the Levercast behavior where the source plan diverged.

| Area | Source plan | Levercast v1 |
|---|---|---|
| Output destination | Hard-coded "publish to own Next.js routes + auto-push to WordPress" | **Pluggable output targets** — user picks Preview, WordPress REST, HTML export, or Bundle export per article |
| Publishing trigger | Auto on approval | **Manual** — explicit button per output target after enrichment completes |
| Translation (Phase C, steps 19–24) | Auto-translate to 8 languages on approval | **Out of scope for v1** — deferred to v2 |
| Enrichment (Phase D, steps 25–26) | Optional, fire-and-forget, Napkin AI | **Mandatory, blocking, Mermaid** — runs on every article; export buttons hidden until complete |
| Diagram storage | Inline `<img>` tags pointing at Napkin CDN | **SVG stored in DB (canonical), PNG cached on S3 (derived)** — reusable for social media posts |
| Topic modes | Single mode (article only) | **Three modes**: `social_only` (existing flow, unchanged), `article_first` (article → optional social), `article_only` |
| Social media posts | Not in scope | **Reuses existing `/api/ai/generate`** with `source: 'article'` flag; manual trigger after article published |
| Authoring identity | Internal `ArticleAuthor` table | Per-tenant `WordPressConnection`; author maps to WP user |
| Categories | Internal `ArticleCategory` table | Resolved against the **target WordPress site** at publish time, not stored in our DB |
| Schema markup | Programmatic JSON-LD (`SchemaBatchService`) | **WP plugins handle this** (Yoast/RankMath); we do not generate JSON-LD ourselves |
| `SitePage` model | Public-facing routable page | **Internal-only** — never exposed as a public route on Levercast; serves as a draft container |

**Engine reuse (unchanged from source plan):** the generation engine itself — `PipelineExecutor`, `StepRunner`, `VariableResolver`, `OutputCleaner`, retry/quota logic, LLM adapter pattern, cost/token tracking, and the verbatim prompts for Steps 1–13, 15, 17, 18 — is lifted intact. That code is the valuable part of the source plan and ports cleanly.

---

## Table of Contents

0. [Levercast Adaptations vs. Source Plan](#0-levercast-adaptations-vs-source-plan)
1. [Architecture Overview](#1-architecture-overview)
2. [Database Models](#2-database-models)
   - [2.7 ArticleDiagram](#27-articlediagram--new--mermaid-diagrams)
   - [2.8 WordPressConnection](#28-wordpressconnection--new--per-tenant-wp-credentials)
   - [2.9 OutputAttempt](#29-outputattempt--new--export-audit-log)
   - [2.10 Topic Modes](#210-topic-modes--levercast-specific)
3. [LLM Provider Adapters](#3-llm-provider-adapters)
4. [Variable Substitution System](#4-variable-substitution-system)
5. [Pipeline Orchestration](#5-pipeline-orchestration)
6. [Step-by-Step Pipeline Specification](#6-step-by-step-pipeline-specification)
   - [Phase A — Pre-Approval (Steps 1–12)](#phase-a--pre-approval-steps-112)
   - [Phase B — Approval Chain (Steps 13, 15, 17, 18) — Levercast v1](#phase-b--approval-chain-steps-13-15-17-18--levercast-v1)
7. [Verbatim Prompt Templates](#7-verbatim-prompt-templates)
8. [Output Parsing & Cleaning](#8-output-parsing--cleaning)
9. [Topic Ingestion & Job Creation](#9-topic-ingestion--job-creation)
10. [Image Generation & Storage](#10-image-generation--storage)
11. [Cost & Token Tracking](#11-cost--token-tracking)
12. [Retry, Rate-Limit & Error Handling](#12-retry-rate-limit--error-handling)
13. [Translation Pipeline — OUT OF SCOPE FOR LEVERCAST V1](#13-translation-pipeline--out-of-scope-for-levercast-v1)
14. [Enrichment Pipeline (Phase C — MANDATORY, Mermaid)](#14-enrichment-pipeline-phase-c--mandatory-mermaid)
   - [14a. Output Targets (Phase D — manual)](#14a-output-targets-phase-d--manual-post-enrichment)
   - [14b. WordPress Integration](#14b-wordpress-integration)
   - [14c. Article-to-Social Handoff (Phase E)](#14c-article-to-social-handoff-phase-e)
15. [API Surface (Levercast v1)](#15-api-surface-levercast-v1)
16. [Implementation Checklist (Levercast v1)](#16-implementation-checklist-levercast-v1)

---

## 1. Architecture Overview

### 1.1 Conceptual flow (Levercast v1)

```
Dashboard idea capture  ──┐
    OR                    ├──► POST /api/topics  →  Topic row
CSV upload  ──────────────┘                         (mode = article_first | article_only | social_only)
                                                            │
                                                            ▼
              ┌────────────────────────────────────────────────────────────────┐
              │ Branch by Topic.mode                                           │
              ├────────────────────────────────────────────────────────────────┤
              │ social_only      →  EXISTING /api/ai/generate flow (untouched)│
              │ article_first    →  pg-boss enqueue('article-pipeline', …)   │
              │ article_only     →  pg-boss enqueue('article-pipeline', …)   │
              └────────────────────────────────────────────────────────────────┘
                                                            │
                                                            ▼
   PipelineExecutor.execute()                        ── Phase A (Pre-Approval) ──
   for each PromptTemplate where stepNumber ∈ [1..12]:
     StepRunner.execute()
        ├─ resolve {{variables}}
        ├─ pick provider/model
          ├─ call LLM (Google Search tool for steps 6,7,8,10,12)
          ├─ parse (JSON for steps 2/12/13)
          └─ persist PipelineStep.output, aggregate cost/tokens
   ArticleJob.status = "completed"
         │
                                                            ▼  user clicks "Approve" in /workflow/[jobId]
   approveJobDirectly(jobId)                         ── Phase B (Approval Chain) ──
      Step 13  generate_seo_metadata
      Step 15  generate_image_prompt → Fal.ai → S3
      upsert SitePage (slug, title, bodyHtml, featuredImageId, …)
      Step 17  generate_excerpt
      Step 18  generate_legal_disclaimer
      ArticleJob.status = "approved"
                                                            │
                                                            ▼  auto-enqueued
   pg-boss('article-enrichment', jobId)              ── Phase C (Enrichment, MANDATORY) ──
      for each <h2> in bodyHtml:
        ├─ LLM (Claude) → Mermaid syntax
        ├─ validate via mermaid.parse()  (1 retry on parse failure)
        ├─ render Mermaid → SVG  (mmdc)
        ├─ rasterize SVG → PNG  (resvg-js)
        ├─ upload PNG to S3 (cdn.socioply.com/diagrams/{jobId}/{n}.png)
        ├─ INSERT ArticleDiagram { mermaidSyntax, svgContent, pngS3Key }
        └─ replace section anchor in bodyHtml with <img src="{cdn}/diagrams/…">
      SitePage.enrichmentStatus = "completed"
      ArticleJob.status = "enriched"  ⭐ exports unlocked here
                                                            │
                                                            ▼  user picks output target(s) in UI
   pg-boss('article-output', { jobId, target })      ── Phase D (Output, manual) ──
      WordPressTarget    → POST /wp-json/wp/v2/media + /posts
      HtmlExportTarget   → write .html to S3, return signed URL
      BundleExportTarget → zip { article.html, article.md, metadata.json,
                                 images/featured.{ext}, images/diagrams/*.png } to S3
                                                            │
                                                            ▼  user clicks "Generate Social Posts" (manual)
   pg-boss('generate-social-from-article', { jobId })  ── Phase E (Social handoff) ──
      builds payload { articleTitle, articleSummary, articleUrl, primaryKeyword,
                       availableDiagrams: ArticleDiagram[] }
      calls existing AI generation pipeline (same as social_only mode)
      creates Draft with sourceArticleId, Posts with optional diagram attachment
```

**Key state transitions on `ArticleJob.status`:**
`pending → in_progress → completed → approved → enriched → (any of: exported, partially_exported)`

Export targets can be invoked any number of times after `enriched`. The status does not regress.

### 1.2 Key files (Levercast layout)

> Lives under the Fastify worker monorepo package after Phase 8 of the migration plan: `apps/api/src/article-pipeline/...`. The Next.js app on Vercel only contains thin proxy routes and UI pages.

| File (worker) | Role |
|------|------|
| `apps/api/src/article-pipeline/executor.ts` | Sequentially runs steps 1–12 |
| `apps/api/src/article-pipeline/step-runner.ts` | Executes a single LLM step (resolve → call → parse → persist) |
| `apps/api/src/article-pipeline/variable-resolver.ts` | Substitutes `{{variable}}` placeholders |
| `apps/api/src/article-pipeline/approval-service.ts` | Steps 13, 15, 17, 18; upserts `SitePage`; enqueues enrichment |
| `apps/api/src/article-pipeline/output-cleaner.ts` | Robust JSON cleaning/parsing helpers |
| `apps/api/src/article-pipeline/json-validator.ts` | Validation hints for malformed JSON |
| `apps/api/src/article-pipeline/keyword-validator.ts` | Global primary-keyword uniqueness |
| `apps/api/src/article-pipeline/image-generation.ts` | Fal.ai image generation with retry (reused by Phase B + diagrams) |
| `apps/api/src/article-pipeline/image-uploader.ts` | Download → S3 upload → `Media` row |
| **`apps/api/src/article-pipeline/enrichment/index.ts`** | Mandatory Phase C orchestrator |
| **`apps/api/src/article-pipeline/enrichment/mermaid-generator.ts`** | LLM call → validated Mermaid syntax |
| **`apps/api/src/article-pipeline/enrichment/svg-renderer.ts`** | `mmdc` wrapper: Mermaid → SVG |
| **`apps/api/src/article-pipeline/enrichment/svg-rasterizer.ts`** | `resvg-js` wrapper: SVG → PNG (with size variants) |
| **`apps/api/src/article-pipeline/output/preview-target.ts`** | Renders preview HTML (no side effects) |
| **`apps/api/src/article-pipeline/output/wordpress-target.ts`** | WP REST publish (media + posts) |
| **`apps/api/src/article-pipeline/output/html-target.ts`** | Builds standalone HTML file |
| **`apps/api/src/article-pipeline/output/bundle-target.ts`** | Builds .zip archive |
| **`apps/api/src/article-pipeline/social-handoff.ts`** | Builds payload for existing AI generation, creates `Draft` with `sourceArticleId` |
| `packages/llm/src/adapter.ts` | `LLMAdapter` interface |
| `packages/llm/src/factory.ts` | `getLLMAdapter(provider)` |
| `packages/llm/src/{gemini,openai,anthropic,openrouter,fal}.ts` | Provider implementations |
| `packages/db/prisma/schema.prisma` | Database schema (extended with `ArticleDiagram`, `WordPressConnection`) |
| `packages/db/prisma/seed.ts` | Default prompt templates (Steps 1–13, 15, 17, 18 + new enrichment template) |
| `apps/api/src/routes/topics.ts` | `POST /topics`, `POST /topics/csv` |
| `apps/api/src/routes/articles.ts` | `GET /articles/:id`, `POST /articles/:id/approve`, `POST /articles/:id/output/:target`, `POST /articles/:id/generate-social` |
| `apps/api/src/queues/index.ts` | `pg-boss` worker registration (all queues from migration plan §3.2) |

> Files marked **bold** are net-new vs. the source plan.
> The source-plan files `translation-batch-service.ts`, `schema-batch-service.ts`, and the source `enrichment-pipeline.ts` (Napkin) are **not implemented** in v1.

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
  userId                 String                          // ⭐ tenant scope (Clerk user id)
  topic                  String
  scheduledDate          DateTime
  excludedKeywords       String[]      // legacy; global excludes now come from SitePage.primaryKeyword
  status                 String    @default("pending")

  // ⭐ Levercast-specific
  mode                   String    @default("social_only") // social_only | article_first | article_only
  defaultOutputTargets   String[]                          // pre-pick targets at topic creation: ["wordpress","html","bundle"]
  wordPressConnectionId  String?                           // resolved WP connection if "wordpress" is in targets

  // CSV-imported fields (article modes only)
  slug                   String?
  category               String?                           // free-form; resolved per output target
  publishingDate         DateTime?
  outlineFrameworkNumber Int?                              // 1..12 or null (random)

  articleJobs            ArticleJob[]
  wordPressConnection    WordPressConnection? @relation(fields: [wordPressConnectionId], references: [id])
  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt

  @@index([userId])
  @@index([scheduledDate])
  @@index([status])
  @@index([mode])
}
```

> **Removed from source plan:** `author Int` (Levercast does not have an author table; author is per-WP-connection), `featuredImageId Int` (Levercast does not pre-link to WP media; images always go S3-first), `postId Int` (Levercast does not support "update existing WP post" in v1).

### 2.2 `ArticleJob` (one run per topic)

```prisma
model ArticleJob {
  id                       String   @id @default(cuid())
  topicId                  String
  topic                    Topic    @relation(fields: [topicId], references: [id], onDelete: Cascade)
  userId                   String                                   // ⭐ duplicated from Topic for fast tenant filter

  // ⭐ Expanded status machine
  // pending → in_progress → completed → approved → enriched → (terminal: exported)
  // Side-track: failed (terminal until manual resume)
  status                   String   @default("pending")
  currentStep              Int      @default(0)                     // 0..18 (no 25/26 — enrichment is its own queue job)
  enrichmentJobId          String?                                  // pg-boss job id for the enrichment queue entry

  totalCost                Float    @default(0)
  totalTokens              Int      @default(0)

  startedAt                DateTime?
  completedAt              DateTime?
  approvedAt               DateTime?
  enrichedAt               DateTime?

  pipelineSteps            PipelineStep[]
  sitePage                 SitePage?
  errorLogs                ErrorLog[]
  outputAttempts           OutputAttempt[]                          // ⭐ history of WP/HTML/Bundle exports

  @@index([userId])
  @@index([status])
}
```

> **Removed from source plan:** `selectedArticleAuthorId`, `ctaAuthorVersionId`, `slideInOfferVersionId`, `isApproved`, `generatedContent` relation. Author is now resolved at output time per `WordPressConnection.defaultAuthorId`. The CTA/slide-in offer versions are not part of Levercast's product. `isApproved` is collapsed into `status='approved'`.

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

### 2.5 `SitePage` (internal article container — never publicly routable in Levercast)

```prisma
model SitePage {
  id              String   @id @default(cuid())
  jobId           String?  @unique
  job             ArticleJob? @relation(fields: [jobId], references: [id])
  userId          String                              // ⭐ tenant scope

  slug            String                              // unique per user, not globally
  title           String

  // Article body (canonical post-enrichment)
  bodyHtml        String?  @db.Text                   // ⭐ final article HTML with <img> tags pointing at S3-hosted PNGs
  originalBodyHtml String? @db.Text                   // pre-enrichment backup (Step 11 raw output)

  featuredImageId String?
  featuredImage   Media?   @relation("SitePageFeaturedImage", fields: [featuredImageId], references: [id])

  publishedAt     DateTime?                           // when first successfully exported to ANY target
  readingTime     Int?

  seoTitle        String?
  seoDescription  String?
  citations       Json?                               // { resource_links: [{ link_title, link_url }] }
  disclaimer      String?  @db.Text                   // YMYL disclaimer (Step 18)
  excerpt         String?  @db.VarChar(160)           // Step 17
  primaryKeyword  String?                             // ⭐ globally unique across all users (Step 2)

  // Enrichment (Phase C — mandatory)
  enrichmentStatus  String  @default("pending")       // pending | in_progress | completed | failed
  enrichmentError   String?
  enrichedAt        DateTime?

  diagrams        ArticleDiagram[]                    // ⭐ all generated Mermaid diagrams for this article
  derivedDrafts   Draft[]   @relation("ArticleSocialDrafts") // ⭐ social drafts spawned from this article

  @@unique([userId, slug])                            // slug uniqueness scoped to tenant
  @@index([primaryKeyword])
  @@index([userId])
}
```

> **Removed from source plan:** `categories` (resolved at output time per WP target, not stored), `authorId` + `ArticleAuthor` (same), `schema` JSON-LD (WP plugins handle this), `enrichedBodyHtml` (collapsed — `bodyHtml` *is* the enriched version after Phase C; `originalBodyHtml` keeps the pre-enrichment fallback), `translations` + `SitePageTranslation` (out of scope v1).
> **Slug uniqueness:** scoped to `userId` because two tenants can have articles with the same slug — they live on different WordPress sites or get different filenames in HTML/bundle exports.

### 2.6 Supporting models

| Model | Purpose | Levercast notes |
|-------|---------|------------------|
| `OutlineInstructions` | 12 outline framework templates + `googleGuidelines` | **Per-tenant** in Levercast; add `userId String @@unique` |
| `AdditionalInfo` | Brand-voice strings (`who`, `ourExperience`, `geolocation`, `articleGoal`, `writingStyle`, `specialInstructions`, `outlineSpecialInstructions`) | **Per-tenant**; add `userId String @@unique` |
| `Media` | Uploaded images on S3 (URL + alt text) | Already exists in Levercast; reused unchanged |
| `ApiKey` | Per-provider key (`gemini`, `openai`, `anthropic`, `openrouter`, `fal-ai`) | Already exists; **per-tenant** in Levercast; encrypted via `src/lib/encryption.ts` (AES-256-GCM after migration Phase 3) |
| `ErrorLog` | Failure rows: `errorType`, `errorMessage`, `stackTrace`, `response` | Add `userId String` for tenant scope |
| **`ArticleDiagram`** | ⭐ NEW — one row per Mermaid diagram in an article | See §2.7 |
| **`WordPressConnection`** | ⭐ NEW — per-tenant WordPress site credentials | See §2.8 |
| **`OutputAttempt`** | ⭐ NEW — history of every export attempt (WP/HTML/Bundle) | See §2.9 |
| ~~`ArticleAuthor`~~ | not used in v1 | author identity is per `WordPressConnection.defaultAuthorId` |
| ~~`ArticleCategory` / `WordPressCategory`~~ | not used in v1 | categories live on the target WP site; resolved at publish time via `GET /wp-json/wp/v2/categories` |
| ~~`SiteSettings`~~ | not used in v1 | the source plan used this for organization-wide JSON-LD; Levercast does not generate JSON-LD itself |
| ~~`GeneratedContent`~~ | not used | source plan only stored featured image metadata here; we use `Media` directly |

### 2.7 `ArticleDiagram` (⭐ new — Mermaid diagrams)

```prisma
model ArticleDiagram {
  id            String   @id @default(cuid())
  sitePageId    String
  sitePage      SitePage @relation(fields: [sitePageId], references: [id], onDelete: Cascade)

  position      Int                                  // ordering within article (1, 2, 3, ...)
  sectionAnchor String                               // h2 id used in bodyHtml (e.g. "what-is-x")
  sectionTitle  String                               // human-readable section heading
  caption       String?                              // optional alt-text / figure caption (LLM-generated)

  // Canonical sources (all retained for re-export at any size)
  mermaidSyntax String   @db.Text                    // raw Mermaid code from LLM
  svgContent    String   @db.Text                    // rendered SVG (resolution-independent)

  // Derived: pre-rasterized PNG cached for inline embed in bodyHtml + WP/HTML/Bundle exports
  pngS3Key      String?                              // s3 key of "default" PNG (1200px wide)
  pngWidth      Int?
  pngHeight     Int?
  pngGeneratedAt DateTime?

  // Generation metadata
  llmProvider   String                               // anthropic
  llmModel      String                               // claude-sonnet-4-5-20250929
  inputTokens   Int      @default(0)
  outputTokens  Int      @default(0)
  cost          Float    @default(0)

  createdAt     DateTime @default(now())

  @@unique([sitePageId, position])
  @@index([sitePageId])
}
```

**Reuse for social media posts:** when generating social posts (Phase E), the worker fetches `ArticleDiagram[]` for the parent article. For each platform that supports an attached image, the worker rasterizes `svgContent` to platform-specific dimensions on demand using `resvg-js`, uploads to `s3://.../diagrams/{jobId}/{position}-{platform}.png`, and attaches the URL to the post. The PNG cache uses path-based keys so the same SVG can produce LinkedIn (1200×627), X (1600×900), IG (1080×1080), Threads (1080×1350), etc., variants with one rasterization each.

### 2.8 `WordPressConnection` (⭐ new — per-tenant WP credentials)

```prisma
model WordPressConnection {
  id              String   @id @default(cuid())
  userId          String                                // Clerk user id
  label           String                                // user-friendly: "My Personal Blog"
  siteUrl         String                                // https://example.com (no trailing slash)
  username        String                                // WP username
  appPassword     String   @db.Text                     // ⭐ encrypted via AES-256-GCM (src/lib/encryption.ts)

  // Defaults applied when publishing
  defaultAuthorId Int?                                  // WP user id; null = use the connection's username
  defaultStatus   String   @default("draft")            // draft | publish | pending | private
  defaultCategoryId Int?

  // Health
  lastVerifiedAt  DateTime?
  lastError       String?

  topics          Topic[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([userId, siteUrl])
  @@index([userId])
}
```

> **Auth model:** WordPress Application Passwords (built into WP since 5.6 — `WP Admin → Users → Profile → Application Passwords`). Far safer than the user's real password since they're scoped, revocable, and don't grant admin UI access. The user pastes both `username` and the generated app-password into Levercast settings.

### 2.9 `OutputAttempt` (⭐ new — export audit log)

```prisma
model OutputAttempt {
  id            String   @id @default(cuid())
  jobId         String
  job           ArticleJob @relation(fields: [jobId], references: [id], onDelete: Cascade)
  userId        String

  target        String                                  // wordpress | html | bundle | preview
  targetRefId   String?                                 // WP post id, S3 key for html, S3 key for bundle

  status        String   @default("pending")            // pending | success | failed
  startedAt     DateTime @default(now())
  completedAt   DateTime?
  durationMs    Int?

  resultUrl     String?                                 // canonical link surfaced in UI: WP post URL or signed S3 URL
  errorMessage  String?

  payloadHash   String?                                 // sha256 of the export payload — lets us detect "was anything actually changed?" before re-publishing

  @@index([jobId])
  @@index([userId, target])
}
```

> Lets the UI show "Last published to WordPress 3 hours ago • View post • Re-publish" and lets you debug failed exports without losing context.

---

## 2.10 Topic Modes (⭐ Levercast-specific)

Every `Topic` carries a `mode` field. The mode determines which engine handles the work and what UI affordances appear.

| `mode` | Engine | Default `defaultOutputTargets` | Social posts produced? | Article produced? |
|---|---|---|---|---|
| `social_only` | **Existing `/api/ai/generate` flow** (unchanged from today) | `[]` (N/A) | ✅ on submit | ❌ |
| `article_first` | New article pipeline (Phases A → B → C) | user picks at topic creation; recommended `["wordpress"]` or `["bundle"]` | ✅ via manual "Generate Social Posts" button after enrichment | ✅ |
| `article_only` | Same as `article_first` | same | ❌ | ✅ |

### 2.10.1 Mode selection UX

**Dashboard idea capture (`/dashboard`):**
A small mode toggle above the existing textarea, defaulting to `social_only`:

```
┌──────────────────────────────────────────────────┐
│ ◉ Social posts only          (current behavior)  │
│ ○ Article first → social     (~10 min)           │
│ ○ Article only               (~10 min)           │
└──────────────────────────────────────────────────┘
[          your idea / topic here          ]
[ Generate ]   ← label changes to "Create Article" in article modes
```

When `article_first` or `article_only` is selected, a second row appears:

```
Default output targets when ready: [□ WordPress] [□ HTML] [□ Bundle]
WordPress site (if checked): [ Select connection... ▾ ]
```

**CSV upload (`/topics/csv`):**
Same fields available as columns. Default `mode` is `social_only` to keep CSV uploads safe-by-default.

### 2.10.2 Routing inside the worker

```typescript
// apps/api/src/routes/topics.ts (paraphrased)
const topic = await prisma.topic.create({ data: { ...body, userId } })

if (topic.mode === 'social_only') {
  // Hand off to existing in-app social generation; no queue, fast response
  return reply.code(200).send({ topicId: topic.id, mode: 'social_only' })
}

// article modes: enqueue, return immediately
const job = await prisma.articleJob.create({
  data: { topicId: topic.id, userId, status: 'pending' },
})
await boss.send('article-pipeline', { jobId: job.id })
return reply.code(202).send({ topicId: topic.id, jobId: job.id, mode: topic.mode })
```

### 2.10.3 What `social_only` does NOT change

The existing `/api/ai/generate` route, the `IdeaCapture` component, the platform preview UI, and all Vercel-side draft/post handling stay **byte-identical** to today. Adding article modes is additive — no regression risk to the flow that generates 100% of revenue today.

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

### Phase B — Approval Chain (Steps 13, 15, 17, 18) — Levercast v1

Triggered by `POST /api/articles/:id/approve` → `approvalService.approve(jobId)` (`apps/api/src/article-pipeline/approval-service.ts`).

**Preconditions:**
- `ArticleJob.status === 'completed'`
- `Topic.userId === currentUser.id` (tenant guard)

> **Removed from source plan:** the `selectedArticleAuthorId` precondition. Levercast does not have author entities; author identity is resolved per output target at publish time.

**Order of operations:**

1. **Pre-checks & data gathering** — load outputs of Steps 2, 9, 11, 12, parse citations, extract `primaryKeyword` from Step 2.
2. **Step 13** — `generate_seo_metadata` (run via `StepRunner`).
3. **Featured image** — always run **Step 15** (`generate_image_prompt`) → `generateImageWithRetry` (Fal.ai `fal-ai/flux-pro`) → `uploadFeaturedImageToS3WithRetry`. (The source plan's WP-media branch is removed: Levercast always generates a fresh image, since the user might publish to multiple targets.)
4. **Upsert `SitePage`** keyed by `jobId`:
   ```typescript
   {
     userId,
     slug: resolveSlug(parsedSeo.urlSlug, topic.slug, topic.topic, jobId),
     title: parsedSeo.metaTitle ?? topic.topic,
     bodyHtml: step11Output,                                  // ⭐ pre-enrichment HTML
     originalBodyHtml: step11Output,                          //   permanent backup
     seoTitle: parsedSeo.metaTitle,
     seoDescription: parsedSeo.metaDescription,
     primaryKeyword,
     citations,
     readingTime: calculateReadingTime(step11Output),
     featuredImageId,
     enrichmentStatus: 'pending',                             // ⭐ ready for Phase C
   }
   ```
5. **Step 17** — `generate_excerpt` → `SitePage.excerpt` (truncate to 150 chars + `'...'` if longer).
6. **Step 18** — `generate_legal_disclaimer` → `SitePage.disclaimer`.
7. **Mark approved:** `ArticleJob.status = 'approved'`, `approvedAt = now()`, `currentStep = 18`.
8. **Aggregate** approval-chain costs into `ArticleJob.totalCost` / `totalTokens` (atomic `increment` updates).
9. **Auto-enqueue Phase C** — `await boss.send('article-enrichment', { jobId })`. Store the returned `pgboss.jobId` in `ArticleJob.enrichmentJobId` for cancellation/inspection.
10. **Return immediately** — HTTP response is `202 Accepted` with the new status. The UI subscribes (SSE or polling) to watch enrichment progress.

> **Cut from source plan:** translation trigger (Phase C 19–24) and the source enrichment trigger (Napkin). Both are replaced by the new Phase C below.

#### Step 13 — `generate_seo_metadata`

| Field | Value |
|------|------|
| Provider / model | `gemini` / `gemini-2.5-flash` |
| JSON-parsed | Yes |
| Inputs | `topic`, `intro`, `primaryKeyword` |
| Output | `{ metaTitle, metaDescription, urlSlug }` (also accepted: `meta title`, `meta description`, `slug`) |
| Persistence | Drives `SitePage.seoTitle`, `SitePage.seoDescription`, `SitePage.slug` (but final slug also considers `Topic.slug` and uniqueness collisions) |

#### Step 14 — `select_category` — **NOT IMPLEMENTED IN LEVERCAST V1**

Dropped because Levercast does not have an internal category table. Categories live on the target WordPress site and are resolved at publish time by the `WordPressTarget` (see §10.WP).

The seed prompt template can remain in `prisma/seed.ts` as inactive (`isActive=false`) for forward-compat if a v2 ever wants AI-assigned categories.

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

## 13. Translation Pipeline — **OUT OF SCOPE FOR LEVERCAST V1**

The source plan's Steps 19–24 (translate `bodyHtml`, `seoTitle`, `seoDescription`, `primaryKeyword`, `excerpt`, `disclaimer` into 8 target languages, then build per-language JSON-LD) are **deferred to v2**.

**Reason for cutting in v1:**
- Multi-language is a separate go-to-market decision; not a quality gate for English-language Levercast users.
- Target output is WordPress (which has its own multilingual plugins, e.g. WPML, Polylang, TranslatePress) and HTML/Bundle exports (where the file is per-language anyway).
- Adds $0.50–$1.50 LLM cost per article, ~5–10 min wall time, and per-language QA burden — none of which v1 needs.

**If/when v2 needs it:**
- Add `SitePageTranslation` model back from the source plan.
- Re-introduce `TranslationBatchService` from source `lib/pipeline/translation-batch-service.ts`.
- Translation runs as its own queue: `boss.send('article-translation', { jobId })` after enrichment completes.
- WP target gets a `WordPressLanguageMap` config (which WPML/Polylang language id corresponds to which translation row).

---

## 14. Enrichment Pipeline (Phase C — **MANDATORY**, Mermaid)

> ⭐ **This is the most significant divergence from the source plan.** Source enrichment (Napkin, optional, fire-and-forget) is replaced with Mermaid (mandatory, blocking exports). The user-facing rule: **"enriched = exportable, period."** No export target buttons are visible in the UI until `ArticleJob.status === 'enriched'`.

### 14.1 Why mandatory and blocking

1. **Quality differentiator.** Articles with auto-generated diagrams read as professional content; without them, they read as "another LLM article." Making enrichment optional invites users to ship lower-quality output.
2. **Single-source-of-truth simplicity.** With one canonical `SitePage.bodyHtml` (post-enrichment), every export target uses the same payload. No "export with or without diagrams?" UX puzzle.
3. **Reusable artifacts.** SVGs stored in `ArticleDiagram` are re-rasterizable into platform-specific PNG sizes for social posts (LinkedIn, X, IG, Threads). The same Mermaid diagram becomes a hero image on a LinkedIn carousel and an inline `<img>` in the WP post.
4. **Cheap.** ~$0.05 incremental LLM cost per article (Claude generates ~500 tokens of Mermaid per H2 × ~5 H2s).

### 14.2 Architecture

`apps/api/src/article-pipeline/enrichment/index.ts` registered as a `pg-boss` worker on the `article-enrichment` queue (`teamSize=3`).

```
boss.work('article-enrichment', enrichmentWorker)

enrichmentWorker({ jobId }):
  1. Load SitePage by jobId (assert status='approved' or 'enriched' for re-runs).
  2. UPDATE SitePage.enrichmentStatus = 'in_progress'
  3. Parse bodyHtml → extract <h2> sections (use cheerio or linkedom)
  4. For each section i (1..N):
        a. Generate Mermaid syntax (LLM call — see §14.3)
        b. Validate via mermaid.parse()  →  if invalid, retry once with error feedback; on second failure, SKIP this section (log to ErrorLog, don't fail the whole job)
        c. Render Mermaid → SVG  (mmdc — see §14.4)
        d. Rasterize SVG → PNG @ 1200px wide  (resvg-js)
        e. Upload PNG to S3 → s3://socioply-images-prod/diagrams/{jobId}/{i}.png
        f. INSERT ArticleDiagram { sitePageId, position: i, sectionAnchor, sectionTitle,
                                   mermaidSyntax, svgContent, pngS3Key, pngWidth, pngHeight,
                                   llmProvider, llmModel, inputTokens, outputTokens, cost }
        g. Insert <figure><img src="{cdn}/diagrams/{jobId}/{i}.png" alt="{section}"><figcaption>{caption}</figcaption></figure> after the corresponding <h2> in working bodyHtml
  5. UPDATE SitePage.bodyHtml = workingHtml
  6. UPDATE SitePage.enrichmentStatus = 'completed', enrichedAt = now()
  7. UPDATE ArticleJob.status = 'enriched', enrichedAt = now(), totalCost += enrichmentCost, totalTokens += enrichmentTokens
  8. (UI sees status flip via SSE/polling → export buttons unlock)
```

**Failure semantics:**
- A single failed section (after retry) → log + skip; article still ships with the diagrams that succeeded
- All sections fail → `enrichmentStatus='failed'`, `ArticleJob.status='approved'` (not 'enriched'), error surfaced in UI with a "Retry enrichment" button
- The pre-enrichment `originalBodyHtml` is **never** mutated; it serves as the rollback target if a re-run is needed

### 14.3 Mermaid generation prompt (new template, seeded as `enrichment_generate_diagram`)

| Field | Value |
|---|---|
| Provider / model | `anthropic` / `claude-sonnet-4-5-20250929` (same as Step 9) |
| Temperature | 0.3 (lower than article writer to favor syntactically correct output) |
| Max tokens | 1024 |
| Inputs | `section_title`, `section_html`, `article_topic`, `primary_keyword` |
| Output | Mermaid block (raw, no markdown fences — output cleaner strips them defensively) |
| JSON-parsed | No |

**System:**
```
You generate Mermaid.js diagrams that visually summarize a section of an article. You output ONLY valid Mermaid syntax — no explanation, no code fences, no markdown. The diagram type must be appropriate to the content (flowchart for processes, sequenceDiagram for interactions, gantt for timelines, classDiagram for hierarchies, mindmap for concept maps, pie for proportions, timeline for chronologies). If no diagram type fits the section, output exactly the string SKIP.
```

**User:**
```
Article topic: {{article_topic}}
Primary keyword: {{primary_keyword}}

Section heading: {{section_title}}

Section HTML:
{{section_html}}

Output a Mermaid diagram that adds visual clarity to this section. Pick the most appropriate diagram type. Do not exceed 12 nodes. Use plain English labels. No code fences. No commentary.

If the section is purely narrative or doesn't benefit from a visual, output exactly: SKIP
```

> The `SKIP` sentinel lets the LLM gracefully decline to generate a diagram for sections that wouldn't benefit (e.g. an introduction or conclusion). The worker treats `SKIP` as a no-op for that section, not an error.

### 14.4 Mermaid → SVG rendering: `mmdc` wrapper

`apps/api/src/article-pipeline/enrichment/svg-renderer.ts`:

```typescript
import { spawn } from 'node:child_process'
import { writeFile, readFile, unlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'

export async function renderMermaidToSvg(mermaidSyntax: string): Promise<string> {
  const id = randomUUID()
  const inFile  = join(tmpdir(), `mermaid-${id}.mmd`)
  const outFile = join(tmpdir(), `mermaid-${id}.svg`)
  await writeFile(inFile, mermaidSyntax, 'utf8')
  try {
    await runMmdc(inFile, outFile)
    return await readFile(outFile, 'utf8')
  } finally {
    await Promise.all([unlink(inFile).catch(() => {}), unlink(outFile).catch(() => {})])
  }
}

function runMmdc(inFile: string, outFile: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn('mmdc', [
      '-i', inFile,
      '-o', outFile,
      '-t', 'default',
      '-b', 'white',
      '--width', '1200',
      '--puppeteerConfigFile', '/app/puppeteer-config.json',
    ], { stdio: ['ignore', 'pipe', 'pipe'] })
    let stderr = ''
    proc.stderr.on('data', (d) => { stderr += d.toString() })
    proc.on('error', reject)
    proc.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`mmdc exit ${code}: ${stderr}`))
    })
  })
}
```

**Docker image additions** (`apps/api/Dockerfile`):
```dockerfile
RUN apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont \
 && npm install -g @mermaid-js/mermaid-cli@^11
ENV PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
COPY puppeteer-config.json /app/puppeteer-config.json
```

`puppeteer-config.json`:
```json
{ "args": ["--no-sandbox", "--disable-setuid-sandbox"] }
```

### 14.5 SVG → PNG rasterization: `resvg-js` wrapper

`apps/api/src/article-pipeline/enrichment/svg-rasterizer.ts`:

```typescript
import { Resvg } from '@resvg/resvg-js'

export interface RasterizeResult {
  png: Buffer
  width: number
  height: number
}

export function rasterizeSvg(svg: string, targetWidth = 1200): RasterizeResult {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: targetWidth },
    background: '#ffffff',
    font: { defaultFontFamily: 'Inter, sans-serif', loadSystemFonts: true },
  })
  const out = resvg.render()
  return { png: out.asPng(), width: out.width, height: out.height }
}
```

**Why `resvg-js` over `sharp`:**
- Pure Node, no `libvips` system dep
- 5-10× faster than `sharp` for SVG → PNG specifically
- Better Mermaid SVG fidelity (handles foreignObject text correctly)
- Smaller Docker image impact

### 14.6 Reuse for social media (Phase E preview)

When `social-handoff.ts` builds the payload for the existing AI generation, it includes:

```typescript
availableDiagrams: ArticleDiagram[]   // sorted by position
```

The platform preview UI lets the user attach one (or more, for a carousel) to each post. On attach, the API route calls:

```typescript
async function attachDiagramToPost(diagramId: string, platform: PlatformKey): Promise<string> {
  const dim = PLATFORM_IMAGE_DIMS[platform]  // { width, height, fit: 'cover' | 'contain' }
  const cacheKey = `diagrams/${jobId}/${position}-${platform}-${dim.width}x${dim.height}.png`

  if (await s3HeadObject(cacheKey)) return cdnUrl(cacheKey)  // already rasterized

  const diagram = await prisma.articleDiagram.findUniqueOrThrow({ where: { id: diagramId } })
  const { png } = rasterizeSvg(diagram.svgContent, dim.width)  // resvg fits to width; pad letterbox if 'contain'
  const adjusted = dim.fit === 'cover'
    ? await coverCrop(png, dim.width, dim.height)              // sharp crop
    : await containPad(png, dim.width, dim.height, '#ffffff')  // sharp pad

  await s3PutObject(cacheKey, adjusted, 'image/png')
  return cdnUrl(cacheKey)
}
```

PLATFORM_IMAGE_DIMS is the canonical per-platform image-size table maintained alongside `src/lib/twitterApi.ts`, `linkedinApi.ts`, etc.

### 14.7 Cost & timing

| Per article | Range | Notes |
|---|---|---|
| LLM calls | 3–8 (one per H2) | Skipped sections are still LLM calls (return `SKIP`) |
| LLM tokens | 5k–15k total | Section HTML is 200–800 tokens input; Mermaid output ~200–600 tokens |
| LLM cost (Claude Sonnet 4.5) | **$0.03–$0.08** | Cheap |
| `mmdc` render time | 1–3 s per diagram | Headless Chromium spin-up dominates first call; warm process is faster |
| `resvg-js` rasterization | 100–500 ms per diagram | Negligible |
| S3 upload | 100–300 ms per diagram | Negligible |
| **Total wall time** | **30 s – 2 min per article** | Much faster than Napkin (5–15 min) |
| **Total cost** | **$0.03–$0.08 per article** | vs. $0.30–$2.40 for Napkin |

This is dramatically cheaper and faster than the source plan's enrichment, and it makes enrichment "always-on" economically viable.

---

## 14a. Output Targets (Phase D — manual, post-enrichment)

> All export targets share one rule: the UI button is disabled (and tooltip-explained) until `ArticleJob.status === 'enriched'`. There is no "export anyway" escape hatch in v1.

### 14a.1 The `ArticleOutputTarget` interface

`apps/api/src/article-pipeline/output/types.ts`:

```typescript
export interface OutputPayload {
  jobId: string
  userId: string

  // Canonical content (post-enrichment)
  title: string
  slug: string
  bodyHtml: string                                    // includes <img> tags pointing at S3 diagrams + featured image
  bodyMarkdown: string                                // server-side converted from bodyHtml (turndown)
  excerpt: string
  seoTitle: string
  seoDescription: string
  primaryKeyword: string
  disclaimer: string
  citations: Array<{ link_title: string; link_url: string }>

  featuredImage: { s3Key: string; cdnUrl: string; alt: string; width?: number; height?: number }
  diagrams: Array<{
    position: number
    sectionAnchor: string
    sectionTitle: string
    caption?: string
    cdnUrl: string                                    // pre-rasterized 1200px PNG
    svgContent: string                                // for HTML export inline embed option
    width: number
    height: number
  }>

  meta: {
    readingTime: number
    publishedAt?: Date
    category?: string                                 // free-form; targets resolve as needed
  }
}

export interface OutputTarget {
  name: string                                         // 'preview' | 'wordpress' | 'html' | 'bundle'
  publish(payload: OutputPayload, config: unknown): Promise<OutputAttemptResult>
}

export interface OutputAttemptResult {
  success: boolean
  resultUrl?: string                                   // canonical link surfaced in UI
  targetRefId?: string                                 // WP post id, S3 key, etc.
  errorMessage?: string
  durationMs: number
}
```

The router `apps/api/src/routes/articles.ts` exposes `POST /api/articles/:id/output/:target` which:
1. Loads `SitePage` + `ArticleDiagram[]` + featured `Media`, asserts ownership and `status='enriched'`.
2. Builds `OutputPayload` once.
3. Looks up the right target implementation (`registry[target]`).
4. Enqueues `boss.send('article-output', { jobId, target, payloadHash, configRef })`.
5. Returns `202 Accepted` with the new `OutputAttempt` row id.

The `article-output` worker calls `target.publish(payload, config)` and writes the result back into `OutputAttempt`.

### 14a.2 PreviewTarget

Built into the UI directly (no worker needed). The preview page `/workflow/[jobId]/preview` renders:

- Featured image hero
- `bodyHtml` styled with a typographic stylesheet (`/styles/article-preview.css`) that approximates a generic clean blog template
- "Google snippet preview" component showing `seoTitle` + URL + `seoDescription`
- Sidebar with `excerpt`, `disclaimer`, `citations`
- Diagram thumbnails (collapsible "regenerate this diagram" affordance for v2)

> No `OutputAttempt` row is created for preview (it has no side effect on external systems). Preview is always available once `status='enriched'`.

### 14a.3 HtmlExportTarget

`apps/api/src/article-pipeline/output/html-target.ts`:

Produces a single self-contained `.html` file uploaded to `s3://socioply-images-prod/exports/{userId}/{jobId}/article.html` and surfaces a 7-day signed CloudFront URL.

**File contents:**
```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>{{seoTitle}}</title>
  <meta name="description" content="{{seoDescription}}">
  <meta property="og:title" content="{{seoTitle}}">
  <meta property="og:description" content="{{seoDescription}}">
  <meta property="og:image" content="{{featuredImage.cdnUrl}}">
  <link rel="canonical" href="{{slug}}">
  <style>/* baked-in typography from /styles/article-export.css */</style>
</head>
<body>
  <article>
    <img class="hero" src="{{featuredImage.cdnUrl}}" alt="{{featuredImage.alt}}">
    <h1>{{title}}</h1>
    <p class="excerpt">{{excerpt}}</p>
    {{bodyHtml}}                                <!-- already includes inline diagram <img> tags -->
    <section class="citations">
      <h2>References</h2>
      <ol>{{#citations}}<li><a href="{{link_url}}">{{link_title}}</a></li>{{/citations}}</ol>
    </section>
    <footer class="disclaimer">{{disclaimer}}</footer>
  </article>
</body>
</html>
```

Diagram `<img>` tags continue to point at `cdn.socioply.com/diagrams/...` rather than being inlined as base64 — keeps the file small and lets users see fresh diagrams if you ever regenerate them.

**Config options** (per request):
- `inlineDiagrams: boolean` — if true, embed SVGs as inline `<svg>` instead of `<img>` references. Defaults to `false` (smaller, more portable file).
- `inlineCss: boolean` — defaults `true`.

### 14a.4 BundleExportTarget

`apps/api/src/article-pipeline/output/bundle-target.ts`:

Produces a `.zip` file uploaded to `s3://socioply-images-prod/exports/{userId}/{jobId}/article.zip`. Structure:

```
article.zip
├── article.html                  # same as HtmlExportTarget output, but with relative image refs
├── article.md                    # Markdown version (turndown conversion of bodyHtml)
├── metadata.json                 # full OutputPayload minus bodyHtml/bodyMarkdown
├── images/
│   ├── featured.{ext}            # downloaded from S3 (jpg/png/webp matching original)
│   └── diagrams/
│       ├── 1.png                 # 1200px wide
│       ├── 1.svg                 # for re-rendering at any size
│       ├── 2.png
│       ├── 2.svg
│       └── ...
└── README.md                     # explains the bundle structure + usage notes
```

`metadata.json` is the canonical machine-readable manifest:
```json
{
  "title": "...",
  "slug": "...",
  "excerpt": "...",
  "seo": { "title": "...", "description": "..." },
  "primaryKeyword": "...",
  "disclaimer": "...",
  "citations": [...],
  "featuredImage": { "file": "images/featured.jpg", "alt": "...", "width": 1024, "height": 1024 },
  "diagrams": [
    { "position": 1, "section": "...", "caption": "...",
      "files": { "png": "images/diagrams/1.png", "svg": "images/diagrams/1.svg" },
      "width": 1200, "height": 720 }
  ],
  "meta": { "readingTime": 7, "publishedAt": "2026-04-29T12:34:56Z" },
  "generatedBy": { "tool": "Levercast", "jobId": "...", "version": "v1" }
}
```

This bundle drops cleanly into Hugo, Astro, Next.js MDX, Eleventy, Jekyll, or any other static-site generator. The `metadata.json` is the integration contract.

**Inside the worker:**

```typescript
import { Pack } from 'tar-stream'                     // or 'archiver' for zip
import { gzipSync } from 'node:zlib'
import { fetchS3Object, putS3Object } from '@/lib/storage'

async function buildBundle(payload: OutputPayload): Promise<Buffer> {
  const archive = archiver('zip', { zlib: { level: 9 } })
  archive.append(buildHtmlBody(payload, { relativeImages: true }), { name: 'article.html' })
  archive.append(htmlToMarkdown(payload.bodyHtml), { name: 'article.md' })
  archive.append(JSON.stringify(buildManifest(payload), null, 2), { name: 'metadata.json' })
  archive.append(BUNDLE_README, { name: 'README.md' })

  const featured = await fetchS3Object(payload.featuredImage.s3Key)
  const ext = extFromContentType(featured.contentType)
  archive.append(featured.body, { name: `images/featured.${ext}` })

  for (const d of payload.diagrams) {
    const png = await fetchS3Object(d.cdnUrl)
    archive.append(png.body, { name: `images/diagrams/${d.position}.png` })
    archive.append(d.svgContent, { name: `images/diagrams/${d.position}.svg` })
  }

  await archive.finalize()
  return await streamToBuffer(archive)
}
```

### 14a.5 What happens after a successful export

1. `OutputAttempt.status='success'`, `resultUrl` set, `completedAt` set.
2. If first-ever success for this article and the target is "publish-grade" (WP), set `SitePage.publishedAt = now()`.
3. UI surfaces a card under the article: "Last exported to {target} {duration ago} • {action button}".
4. Multiple exports can target the same destination; each creates a new `OutputAttempt` row. UI shows the full history collapsibly.

---

## 14b. WordPress Integration

### 14b.1 Connection setup UX

New page `/settings/wordpress`:

```
┌── Connect a WordPress site ───────────────────────────────────┐
│ Site URL          [ https://example.com                    ]  │
│ Username          [ levercast-bot                          ]  │
│ Application       [ xxxx xxxx xxxx xxxx xxxx xxxx          ]  │
│ Password                                                       │
│   ► How to generate one (collapsible):                         │
│      1. Sign in to your WP admin                               │
│      2. Users → Profile → scroll to "Application Passwords"   │
│      3. Name it "Levercast" → Add New → copy the value         │
│                                                                │
│ Default status    ◉ Draft  ○ Publish  ○ Private               │
│ Default category  [ Loaded after verification           ▾ ]   │
│ Default author    [ Loaded after verification           ▾ ]   │
│                                                                │
│              [ Verify connection ]      [ Save ]               │
└────────────────────────────────────────────────────────────────┘
```

"Verify connection" calls `GET {siteUrl}/wp-json/wp/v2/users/me?context=edit` with the basic-auth header. On success, it loads the categories (`GET /categories?per_page=100`) and authors (`GET /users?roles=author,editor,administrator&per_page=100`) into the dropdowns. On failure, surface the specific WP error code.

The `appPassword` is encrypted with `src/lib/encryption.ts` (AES-256-GCM) before persisting.

### 14b.2 Publish flow

`apps/api/src/article-pipeline/output/wordpress-target.ts`:

```typescript
export class WordPressTarget implements OutputTarget {
  name = 'wordpress'

  async publish(payload: OutputPayload, config: { connectionId: string; status?: string; categoryId?: number; authorId?: number }): Promise<OutputAttemptResult> {
    const start = Date.now()
    const conn = await loadConnection(config.connectionId, payload.userId)
    const auth = basicAuthHeader(conn.username, decrypt(conn.appPassword))

    // 1. Upload featured image to WP media library (so WP holds its own copy)
    const featuredMediaId = await uploadFeaturedImage(conn.siteUrl, auth, payload.featuredImage)

    // 2. Upload diagram images to WP media library — ensures broken WP site doesn't accidentally
    //    serve broken Levercast CDN refs years later. Replace cdn.socioply.com URLs in bodyHtml
    //    with the new WP-hosted URLs.
    const diagramMap = new Map<string, { wpMediaId: number; wpSourceUrl: string }>()
    for (const d of payload.diagrams) {
      const result = await uploadWpMedia(conn.siteUrl, auth, d.cdnUrl, `${payload.slug}-diagram-${d.position}.png`, d.caption ?? d.sectionTitle)
      diagramMap.set(d.cdnUrl, result)
    }
    const wpReadyHtml = rewriteImageSrcs(payload.bodyHtml, diagramMap)

    // 3. Create the post
    const postBody = {
      title: payload.title,
      slug: payload.slug,
      content: wpReadyHtml,
      excerpt: payload.excerpt,
      status: config.status ?? conn.defaultStatus,
      author: config.authorId ?? conn.defaultAuthorId ?? undefined,
      categories: config.categoryId ? [config.categoryId] : (conn.defaultCategoryId ? [conn.defaultCategoryId] : []),
      featured_media: featuredMediaId,
      meta: {
        // Yoast SEO fields (if Yoast installed) — also covers RankMath via plugin compat
        _yoast_wpseo_title: payload.seoTitle,
        _yoast_wpseo_metadesc: payload.seoDescription,
        _yoast_wpseo_focuskw: payload.primaryKeyword,
      },
    }
    const post = await wpRequest(conn.siteUrl, auth, 'POST', '/wp-json/wp/v2/posts', postBody)

    return {
      success: true,
      resultUrl: post.link,
      targetRefId: String(post.id),
      durationMs: Date.now() - start,
    }
  }
}
```

### 14b.3 Failure modes & UX

| Failure | Detection | UX |
|---|---|---|
| Auth invalid (401) | WP returns `rest_cannot_create` | "Connection rejected — generate a new application password" + link to settings |
| Slug collision (409 from WP, or `wp_post_revision`) | response body inspection | Auto-append `-${jobId.slice(0,8)}` and retry once |
| Featured image upload failed but post would succeed | exception in step 1 | Fail whole publish (retry button); never publish post without image |
| Diagram image upload failed | exception in step 2 (per diagram) | Skip that diagram, log to ErrorLog, continue with `cdn.socioply.com` URL fallback for that one |
| WP site offline / DNS | network error | Mark `OutputAttempt.failed`, surface "WordPress site unreachable; try again" |

### 14b.4 What WordPress integration does NOT do in v1

- **No update of existing posts.** Re-publish = create a new WP post with `-${counter}` suffix on the slug. Updating an existing post is a v2 feature requiring `OutputAttempt.targetRefId` lookup + `POST /wp/v2/posts/{id}` semantics with conflict resolution (what if user edited it in WP?).
- **No Gutenberg block conversion.** Article body is shipped as raw HTML inside a "Classic" block. Yoast/RankMath/most themes render this fine. v2 could add a `wp:html` → `wp:paragraph`/`wp:heading`/`wp:image` parser if needed.
- **No WP user creation.** The user must already have a WP account on the target site that can author posts.
- **No multi-site / network publishing.** One `WordPressConnection` = one WP site. v2 could support choosing target at publish time.

---

## 14c. Article-to-Social Handoff (Phase E)

### 14c.1 When the user can trigger it

Only after `ArticleJob.status === 'enriched'`. The button "Generate Social Posts" appears next to the export buttons on `/workflow/[jobId]`. Available regardless of whether the article was actually exported to any target — the article and diagrams are reusable assets either way.

### 14c.2 Payload to the existing AI generation

`apps/api/src/article-pipeline/social-handoff.ts`:

```typescript
export async function generateSocialFromArticle(jobId: string, request: {
  platforms: PlatformKey[]
  templateId?: string
  twitterFormat?: 'single' | 'thread'
  attachDiagramIds?: string[]                  // user-pre-selected, optional
}): Promise<{ draftId: string }> {
  const { sitePage, diagrams, articleJob } = await loadEnriched(jobId)

  const articleSummary = sitePage.bodyHtml
    ? stripHtmlAndTruncate(sitePage.bodyHtml, 2000)
    : sitePage.excerpt ?? sitePage.title

  // Find published WordPress URL if available; falls back to nothing
  const lastWpAttempt = await prisma.outputAttempt.findFirst({
    where: { jobId, target: 'wordpress', status: 'success' },
    orderBy: { completedAt: 'desc' },
  })
  const articleUrl = lastWpAttempt?.resultUrl  // optional

  // Reuse the EXISTING /api/ai/generate path — same prompts, same providers
  return await callExistingAiGenerate({
    userId: articleJob.userId,
    rawIdea: articleSummary,                   // the article IS the idea
    sourceArticleId: sitePage.id,              // ⭐ links the resulting Draft.sourceArticleId
    sourceArticleMeta: {
      articleTitle: sitePage.seoTitle ?? sitePage.title,
      articleUrl,                               // optional — only present if WP-published
      primaryKeyword: sitePage.primaryKeyword,
      excerpt: sitePage.excerpt,
    },
    platforms: request.platforms,
    templateId: request.templateId,
    twitterFormat: request.twitterFormat,
    image: undefined,                          // featured image / diagrams attached separately
  })
  // The created Draft now has sourceArticleId set; the UI can show
  // the diagram picker + featured-image picker against it.
}
```

### 14c.3 Existing AI generation path — no changes required to prompts

The `/api/ai/generate` route already accepts a free-text idea and platform list. Levercast's existing prompts produce platform-specific posts from arbitrary text — an article excerpt is just longer, more structured input. Output quality is *better* with article input than with a one-line idea, because the AI has more context.

**Optional v2 enhancement:** add a "social-from-article" mode flag that switches the prompt template variant from "summarize this idea for {platform}" to "write a {platform} post that drives clicks to this article: {url}". This is small and additive; not required for v1.

### 14c.4 Image attachment UX

The platform preview component picks up the new `sourceArticle` relation on the draft and shows two image-source options per post:

```
Image:  ◉ None
        ○ Article featured image
        ○ Article diagram   [ Diagram 1 ▾ ]   (preview shows 200px thumb)
        ○ Upload custom image
        ○ Generate new image (Fal.ai)        ← existing flow
```

When the user picks a diagram, `attachDiagramToPost()` from §14.6 is invoked, returning a CDN URL of the platform-sized PNG. That URL becomes the post's image attachment via the existing per-platform publish path.

### 14c.5 What this preserves

- The existing `social_only` flow on `/dashboard` is **byte-identical**.
- The existing `Draft` and `Post` models work for article-derived posts too — `sourceArticleId` is the only new field, and it's nullable.
- All existing publish routes (LinkedIn, X, Facebook, Instagram, Threads, Telegram) work without modification.

---

## 15. API Surface (Levercast v1)

> All routes live on the DO Fastify API (`api.socioply.com`). The Vercel Next.js app calls them via the `@socioply/api-client` package built in Phase 2 of the migration plan. Auth = Clerk JWT in `Authorization: Bearer …` header; tenant is `userId` from the JWT.

### 15.1 Topic / pipeline routes

| Method | Route | Body | Returns | Notes |
|--------|-------|------|---------|------|
| `POST` | `/api/topics` | `{ topic, mode, scheduledDate?, defaultOutputTargets?, wordPressConnectionId?, … }` | `{ topicId, jobId? }` | If `mode='social_only'`, returns just `topicId` and the existing flow handles it. Otherwise enqueues `article-pipeline` and returns `jobId`. |
| `POST` | `/api/topics/csv` | `multipart file` | `{ count, topicIds[] }` | Same as above, batched. |
| `GET`  | `/api/topics` | — | `Topic[]` | Filter: `?mode=&status=&limit=&offset=` |
| `POST` | `/api/articles/:jobId/resume` | — | `{ ok }` | Resume failed job (skips completed steps) |
| `POST` | `/api/articles/:jobId/rerun` | — | `{ ok }` | Wipe `PipelineStep` rows and re-run from Step 1 |
| `POST` | `/api/articles/:jobId/rerun-step` | `{ stepNumber }` | `{ ok }` | Rerun a single step |
| `POST` | `/api/articles/:jobId/approve` | — | `202 { ok, status: 'approved' }` | Phase B; auto-enqueues enrichment |
| `POST` | `/api/articles/:jobId/reenrich` | — | `202 { ok }` | Re-run Phase C; restores `bodyHtml = originalBodyHtml`, then re-runs |

### 15.2 Output / publish routes

| Method | Route | Body | Returns | Notes |
|--------|-------|------|---------|------|
| `POST` | `/api/articles/:jobId/output/wordpress` | `{ connectionId, status?, categoryId?, authorId? }` | `202 { outputAttemptId }` | Requires `status='enriched'` |
| `POST` | `/api/articles/:jobId/output/html` | `{ inlineDiagrams?: bool, inlineCss?: bool }` | `202 { outputAttemptId }` | Requires `status='enriched'` |
| `POST` | `/api/articles/:jobId/output/bundle` | — | `202 { outputAttemptId }` | Requires `status='enriched'` |
| `GET`  | `/api/articles/:jobId/output/attempts` | — | `OutputAttempt[]` | History across all targets |
| `GET`  | `/api/articles/:jobId/output/attempts/:attemptId` | — | `OutputAttempt` | Includes signed URL for HTML/Bundle, WP post URL for `wordpress` |

### 15.3 Article-to-social handoff

| Method | Route | Body | Returns | Notes |
|--------|-------|------|---------|------|
| `POST` | `/api/articles/:jobId/generate-social` | `{ platforms[], templateId?, twitterFormat?, attachDiagramIds? }` | `{ draftId }` | Requires `status='enriched'`; calls existing AI generation |

### 15.4 WordPress connection management

| Method | Route | Body | Returns | Notes |
|--------|-------|------|---------|------|
| `GET`  | `/api/wp/connections` | — | `WordPressConnection[]` | `appPassword` redacted |
| `POST` | `/api/wp/connections` | `{ label, siteUrl, username, appPassword, defaultStatus?, defaultCategoryId?, defaultAuthorId? }` | `WordPressConnection` | Encrypts `appPassword` before persist; validates connection by calling `/wp-json/wp/v2/users/me` |
| `POST` | `/api/wp/connections/:id/verify` | — | `{ ok, categories[], authors[] }` | Re-verify and refresh dropdown options |
| `PATCH` | `/api/wp/connections/:id` | partial | `WordPressConnection` | Updates allowed fields; if `appPassword` provided, re-encrypts |
| `DELETE` | `/api/wp/connections/:id` | — | `{ ok }` | Cascade-detaches from any `Topic.wordPressConnectionId` (sets to null) |

### 15.5 Job inspection

| Method | Route | Purpose |
|--------|-------|---------|
| `GET` | `/api/articles` | List `ArticleJob` (paginated) with status, cost, target topic |
| `GET` | `/api/articles/:jobId` | Job + steps + diagrams + sitePage detail |
| `GET` | `/api/articles/:jobId/logs` | Step logs and ErrorLog rows |
| `GET` | `/api/articles/:jobId/preview` | Returns rendered HTML for `/workflow/[jobId]/preview` |
| `GET` | `/api/articles/:jobId/events` | Server-Sent Events stream of status transitions (used by UI to live-update without polling) |

### 15.6 Vercel-side UI pages

| Page | Purpose |
|------|---------|
| `/dashboard` | Idea capture (existing) + new mode toggle (§2.10.1) |
| `/topics` | List uploaded topics, with status per topic |
| `/topics/csv` | CSV upload with column-mapping preview |
| `/workflow` | Article job list (status, progress, cost, last export) |
| `/workflow/[jobId]` | Per-job detail: progress, steps, errors, diagrams, **export buttons (gated)**, "Generate Social Posts" button (gated) |
| `/workflow/[jobId]/preview` | Standalone preview render (matches HtmlExportTarget output) |
| `/settings/wordpress` | WordPress connection setup (§14b.1) |
| `/admin/prompts` | Edit `PromptTemplate` rows live (Steps 1–18 + enrichment template) |

---

## 16. Implementation Checklist (Levercast v1)

> Sequenced for execution after Phase 8 of `Migration-DigitalOcean-Plan.md` ships.

### 16.1 Infrastructure (largely covered by migration plan)
1. ✅ DO Managed Postgres (`socioply` DB) — already provisioned per migration plan Phase 1.
2. ✅ AWS S3 + CloudFront (`cdn.socioply.com`) — already live per migration plan Phase 5.
3. ✅ DO Droplet + Fastify worker — must be live per migration plan Phase 8 (hard prerequisite).
4. ✅ `pg-boss` queues — registered per migration plan Phase 8; add the new `article-pipeline`, `article-enrichment`, `article-output`, `generate-social-from-article` queues.
5. ✅ Encrypted `ApiKey` rows for `gemini`, `openai`, `anthropic`, `fal-ai` — already in place since migration plan Phase 3.
6. **NEW:** Add `mmdc` (`@mermaid-js/mermaid-cli`) + Chromium to the worker Docker image (§14.4 above).
7. **NEW:** Install npm deps in the worker package: `@resvg/resvg-js`, `cheerio` (or `linkedom`), `archiver`, `turndown`, `mermaid` (for parser-side validation only — not for rendering).

### 16.2 Data model migrations (Prisma)
1. Add `mode`, `defaultOutputTargets[]`, `wordPressConnectionId` to `Topic`.
2. Add `userId`, expand status enum, add `enrichmentJobId`, `approvedAt`, `enrichedAt` to `ArticleJob`.
3. Slim `SitePage`: drop `categories`, `authorId`, `schema`, `enrichedBodyHtml`, `translations`. Add `userId`, `enrichmentError`. Change `slug` unique to `@@unique([userId, slug])`.
4. Add `userId` to `OutlineInstructions`, `AdditionalInfo`, `ApiKey`, `ErrorLog` for tenant scope.
5. Create `ArticleDiagram`, `WordPressConnection`, `OutputAttempt` tables.
6. Add `sourceArticleId` to existing `Draft` model.
7. Run migration on dev, then prod.

### 16.3 LLM layer
1. Lift the `LLMAdapter` interface and adapters from the source plan (§3) into `packages/llm/`.
2. Wire `ApiKey` lookups to be `userId`-scoped (every adapter call resolves keys per tenant).
3. Cost tables stay as documented (§3.3).

### 16.4 Variable resolver
1. Lift `VariableResolver` from source (§4) into `apps/api/src/article-pipeline/variable-resolver.ts`.
2. Implement variable catalog (§4.2). **Drop variables that depended on removed entities:** `{{author_name}}`, `{{author_website}}`, `{{organization_*}}`, `{{social_media_links}}` (resolve to empty strings if any prompt references them).
3. **Fix the `{{primaryKeywords}}` typo** in Step 3 prompt to `{{primary_keyword}}` before seeding.
4. Implement global excluded-keywords with `userId` scope (`SitePage.userId = currentJob.userId`) — the source plan was global; in a multi-tenant world we should at minimum prevent within-tenant collisions and could choose to relax across-tenant uniqueness.

### 16.5 Step runner
1. Lift from source (§5) into `apps/api/src/article-pipeline/step-runner.ts`.
2. Generative-search list unchanged: `[6, 7, 8, 10, 12]`.
3. JSON-parse list unchanged: `[2, 12, 13]`.

### 16.6 Pipeline executor (Phase A)
1. Lift from source (§6 Phase A) into `apps/api/src/article-pipeline/executor.ts`.
2. Iterate `stepNumber ∈ [1..12]`, skip completed steps for resume support.
3. Step 2 uniqueness retry loop unchanged.
4. Set `ArticleJob.status = 'completed'` on success.

### 16.7 Approval chain (Phase B)
1. Implement `apps/api/src/article-pipeline/approval-service.ts` per §6 Phase B (Levercast version).
2. **No author validation** (removed).
3. **No category resolution** (removed).
4. **No translation trigger** (removed).
5. After Step 18: set `status='approved'`, **enqueue** `boss.send('article-enrichment', { jobId })`.

### 16.8 Enrichment (Phase C — MANDATORY) — ⭐ NEW
1. Register `boss.work('article-enrichment', enrichmentWorker)` with `teamSize=3`.
2. Implement HTML parsing with `cheerio` to find `<h2>` sections.
3. Implement `mermaid-generator.ts` (Claude Sonnet 4.5, validate with `mermaid.parse()`, 1 retry on parse fail).
4. Implement `svg-renderer.ts` (`mmdc` wrapper).
5. Implement `svg-rasterizer.ts` (`resvg-js` wrapper).
6. Insert `ArticleDiagram` rows; rewrite `bodyHtml` with `<figure><img>...<figcaption>` blocks.
7. Set `SitePage.enrichmentStatus='completed'`, `ArticleJob.status='enriched'`.
8. Aggregate cost/tokens into `ArticleJob`.

### 16.9 Output targets (Phase D — MANUAL) — ⭐ NEW
1. Implement `OutputTarget` interface and registry.
2. Implement `WordPressTarget` per §14b.2 (uploads featured image + diagrams to WP media, then creates post; rewrites `<img src>` to WP-hosted URLs).
3. Implement `HtmlTarget` per §14a.3 (single-file HTML, optional inline SVG/CSS).
4. Implement `BundleTarget` per §14a.4 (zip with HTML, MD, JSON manifest, images).
5. Register `boss.work('article-output', outputWorker)` with `teamSize=5`.
6. Implement `OutputAttempt` row creation/update; surface signed URLs to UI.

### 16.10 Article-to-social handoff (Phase E) — ⭐ NEW
1. Implement `social-handoff.ts` per §14c.2.
2. **Reuse the existing AI generation path** — no prompt changes required for v1.
3. Set `Draft.sourceArticleId` on the resulting draft.
4. Update the platform preview component to show diagram-attachment options when `sourceArticleId` is present (§14c.4).
5. Implement `attachDiagramToPost()` rasterization-on-demand with S3 caching (§14.6).

### 16.11 WordPress integration — ⭐ NEW
1. Implement encrypted `WordPressConnection` CRUD endpoints.
2. Implement settings page `/settings/wordpress`.
3. Verify endpoint hits `GET /wp-json/wp/v2/users/me?context=edit` and loads categories+authors.
4. WordPressTarget media upload: `POST /wp-json/wp/v2/media` (multipart, with `Content-Disposition: attachment; filename=…`).
5. Document app-password setup with screenshot/GIF in `/settings/wordpress` (collapsible).

### 16.12 Seed data
1. Seed `PromptTemplate` rows for Steps 1–13, 15, 17, 18 (skip 14, 16). Use the verbatim prompts from §7 of this plan.
2. Seed `enrichment_generate_diagram` template (§14.3) — not numbered as a "Step", referenced directly by the enrichment worker.
3. Seed default `OutlineInstructions` row per new tenant (12 frameworks + Google guidelines from source plan).
4. Use upsert-by-key for all seeds (preserve admin edits on re-seed).

### 16.13 UI (Vercel side)
1. Add mode toggle to `/dashboard` (§2.10.1). Default `social_only` — no behavior change for existing users.
2. Build `/topics` and `/topics/csv`.
3. Build `/workflow` and `/workflow/[jobId]` per §15.6, with **gated export buttons** that show "🔒 Available after enrichment completes" until `status='enriched'`.
4. Build `/workflow/[jobId]/preview` matching `HtmlTarget` output.
5. Build `/settings/wordpress`.
6. Build `/admin/prompts` (covers Steps 1–18 + enrichment template).
7. Use SSE on `/api/articles/:jobId/events` for live status updates (avoids polling cost on Vercel).

### 16.14 Failure modes & ops
1. Surface `ErrorLog` rows in `/workflow/[jobId]` with quota type, retry-after seconds, stack trace.
2. Provide "Resume" and "Re-run step" actions for failed jobs.
3. Provide "Re-enrich" action that wipes diagrams + restores `bodyHtml = originalBodyHtml` then re-enqueues.
4. Provide "Re-publish" action per output target (creates new `OutputAttempt`).
5. Daily-quota detection short-circuits retry; surface a "wait until midnight Pacific" message.
6. Persist raw LLM responses to logs directory (`logs/raw-llm/{jobId}-step{N}.json`) for JSON-parse debugging.
7. Alert (Sentry / Better Stack) on: enrichment failure, output failure, queue backlog > 50 jobs.

### 16.15 Cost ceiling (Levercast v1)

| Phase | Approx tokens | Approx cost |
|-------|---------------|-------------|
| Phase A — Steps 1–8 (Gemini Flash, mostly small) | 30k–80k | $0.005–$0.02 |
| Phase A — Step 9 (Claude Sonnet 4.5, 8k output) | 8k–14k | $0.10–$0.20 |
| Phase A — Steps 10–12 (Gemini Flash + Search) | 20k–60k | $0.005–$0.02 |
| Phase B — Steps 13, 17, 18 (gpt-4o-mini) | 5k–15k | $0.001–$0.005 |
| Phase B — Step 15 image (Fal flux-pro) | n/a | $0.04 (flat) |
| Phase C — Mermaid enrichment (Claude Sonnet 4.5, ~5 H2s) | 5k–15k | $0.03–$0.08 |
| **Total per article (no exports)** | **~85k–185k tokens** | **~$0.18–$0.38** |
| Phase D — WordPress export | 0 | ~$0.001 (S3+egress) |
| Phase D — HTML export | 0 | ~$0.0001 |
| Phase D — Bundle export | 0 | ~$0.001 (S3+egress) |
| Phase E — social posts (already costed in existing flow) | per platform | $0.01–$0.05 each |

> ⭐ Translation (~$0.50–$1.50/article in source plan) is **not** incurred in Levercast v1.

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
