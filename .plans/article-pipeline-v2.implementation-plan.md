# Article Pipeline V2 — Implementation Plan

> **Status: IMPLEMENTED** (audited 2026-07-09) — V2 pipeline live in production.

> **Goal:** Bring the article pipeline up to feature parity with the original production system documented in `active-prompts-from-db.md`, by (1) wiring all required prompt variables into the resolver, (2) adopting the production-tuned prompts (with persona stripped), (3) building per-tenant article brand profile UI, (4) adopting the 12-outline-framework system with admin management, and (5) migrating all LLM API keys to platform-owned (no longer per-user).
>
> **Deferred (out of scope for this plan):** Translation pipeline (Steps 19–26), newsletter generation (Steps 27–28), GEO enrichment (Steps 101–106), Mermaid-diagram enrichment removal/replacement.
>
> **Plan owner:** Single-developer execution.
> **Plan length:** 4 waves + 1 prerequisite wave (W0). Each wave is independently shippable.

---

## 0. Decisions Locked In (recap)

| Topic | Decision |
|---|---|
| Outline framework storage | Row-per-framework `OutlineFramework` table (NOT 12 columns on a singleton) |
| LLM API keys | Platform-owned. Eliminate from user `/settings`. ALL LLM calls (article pipeline + social-post generation + image generation) use platform-owned keys. Telegram bot token + social OAuth tokens remain per-user. |
| Outline framework dropdown | 13 options: "Auto-select (recommended)" + 12 named frameworks. "Auto-select" is the default selection. Triggers server-side LLM assignment. |
| Outline framework LLM fallback | Server-side. Triggered when `Topic.outlineFrameworkNumber` is null at pipeline trigger time — this includes: user picking "Auto-select" on the dashboard, CSV upload with blank `Outline Framework` column, or any programmatic trigger. Uses platform OpenAI `gpt-4o-mini`. |
| Outline framework body content | Genericize the 12 bodies. Strip Dominican-Republic real-estate specifics, preserve structural intent. |
| CSV columns for new fields | Defer adding `outlineSpecialInstructions` / `realCaseStudies` columns to a later "CSV refresh" phase. Existing `Outline Framework` column stays. |
| Brand voice UI placement | Single existing `/settings` page. New section "Article Brand Profile" (NOT a duplicate of Writing Style). `{{writing_style}}` variable reads from existing `Settings.writingStyle`. |
| Step 9 / Step 11 persona | Generic persona injection with strong fallback text. Replace hardcoded "Lic. Guido / Sosúa / DR" references with `{{author_name}}` + `{{who}}` + `{{our_experience}}` injection. |
| Wave bundling | W1 + W2 (per user request) ship together. W0 (API key migration) is a prerequisite. W3 ships separately. W4 ships separately. |

---

## 1. Wave Map

```
W0 — Platform-owned LLM API keys           [PREREQUISITE]
       │
       ▼
W1 — Variable plumbing + DB schema  ──┐
                                       ├─ ship together
W2 — Outline framework system        ──┘
       │
       ▼
W3 — Article Brand Profile UI + reseeded prompts
       │
       ▼
W4 — Schema markup + organization fields
```

---

## Wave 0 — Platform-Owned LLM API Keys

### Goal

Move all LLM/image-generation API keys from per-user storage to platform-owned. The platform absorbs all LLM costs from day one (consistent with the existing cost-tracking model).

### What stays per-user
- Telegram bot token (it's their bot to their channel)
- Social OAuth tokens (LinkedIn, Twitter, Facebook, Instagram, Threads — inherently per-user)

### What moves to platform-owned
- OpenAI API key
- Anthropic API key
- Google Gemini API key
- OpenRouter API key (if used)
- Fal.ai API key
- OpenAI DALL-E API key (image-only)
- Replicate API key

### Source of truth for platform keys

Use `LlmKey` table (already exists per past conversation, accessible via `/admin/llm-keys`). Each row: `provider`, `apiKey` (encrypted), `isActive`. Single source of truth for all LLM/image calls.

Fallback chain when API code needs a key:
```
1. PlatformLlmKey table (admin-managed, primary source)
2. process.env[`${PROVIDER}_API_KEY`] (env-var fallback for local dev / emergency)
3. → throw "no key configured" error
```

### Tasks

#### W0.1 Audit existing infrastructure
- Verify `LlmKey` model exists in `packages/db/prisma/schema.prisma` (likely from earlier admin work).
- Verify `/admin/llm-keys` page covers all 7 providers above. Add UI rows for any missing providers.
- Verify backend `getApiKey(provider, userId)` helper used by article pipeline. Refactor to `getApiKey(provider)` (no userId).

#### W0.2 Refactor LLM client factory
File: `apps/api/src/article-pipeline/llm/factory.ts` (and any other LLM call sites).

Current shape (probably):
```ts
async function getApiKey(provider: string, userId: string) {
  const key = await prisma.apiKey.findUnique({ where: { userId_provider: { userId, provider } } })
  return decrypt(key.encryptedKey)
}
```

New shape:
```ts
async function getApiKey(provider: string) {
  const platformKey = await prisma.llmKey.findFirst({
    where: { provider, isActive: true }
  })
  if (platformKey) return decrypt(platformKey.encryptedKey)
  const envKey = process.env[`${provider.toUpperCase()}_API_KEY`]
  if (envKey) return envKey
  throw new Error(`No API key configured for provider: ${provider}`)
}
```

All call sites lose the `userId` parameter.

#### W0.3 Migrate ALL pipeline call sites
Audit grep for `prisma.apiKey.findUnique` / `userId.*provider`. Affected files (estimated):
- `apps/api/src/article-pipeline/llm/factory.ts`
- `apps/api/src/article-pipeline/executor.ts` (passes userId to factory)
- `apps/api/src/article-pipeline/step-runner.ts`
- `apps/api/src/article-pipeline/enrichment/*` (Mermaid diagram step)
- `apps/api/src/article-pipeline/approval/*` (Steps 13/15/17/18)
- `apps/web/src/app/api/ai/generate-post/route.ts` (or wherever social-post generation lives — also needs migration)
- `apps/web/src/app/api/ai/analyze-writing-style/route.ts` (this is a proxy, real call lives in API)
- `apps/api/src/routes/ai.ts` (writing style analyzer)
- Image generation routes (Fal, DALL-E, Replicate)

#### W0.4 Remove user-side UI
File: `apps/web/src/app/(protected)/settings/page.tsx`

Remove these sections:
- "AI Provider Settings" (lines ~885–1078) — the whole `<div>` block including the `select` for default provider, model selection per provider, and API key input grid for openai/anthropic/gemini/openrouter
- "AI Image Generation Settings" (lines ~1080–1273) — the whole block including provider/model selection and API key input grid for fal/openai-dalle/replicate

Keep these sections:
- "Theme Settings"
- "Writing Style" (this is brand-side, not API-key-side)
- "Connected Accounts" (OAuth + Telegram bot token)

Also remove related state hooks (`apiKeys`, `maskedKeys`, `selectedProvider`, `selectedModels`, `providerModels`, `imageApiKeys`, `imageMaskedKeys`, `selectedImageProvider`, `selectedImageModels`, `imageProviderModels`, `defaultImageStyle`, all their setters, and their fetch effects). Keep `editingApiKeys`/`apiKeys.telegram` only as needed for the Telegram block.

#### W0.5 Cleanup: deprecated user-level columns

The `Settings` model contains `defaultProvider`, `defaultModel`, `defaultImageProvider`, `defaultImageModel`, `defaultImageStyle`, `defaultImagePromptLlmProvider`, `defaultImagePromptLlmModel`. These were per-user model preferences for the legacy social-post flow.

**Decision (confirmed):** Keep columns dormant on the database — no schema migration needed. Remove all frontend reads/writes for these columns. No backend code should read them after W0. Mark as deprecated in schema comment. Drop in a future cleanup migration wave once we are confident no code path reads them.

Frontend changes: remove the `defaultProvider`, `selectedModels`, `defaultImageProvider`, `selectedImageModels`, `defaultImageStyle` state and their PATCH calls from the settings page (they all go away with the AI Provider / AI Image sections being deleted in W0.4).

#### W0.6 Cleanup: deprecated `ApiKey` rows for LLM/image providers

The `ApiKey` table holds rows for `openai`, `anthropic`, `gemini`, `openrouter`, `fal`, `openai-dalle`, `replicate`, `telegram`.

**Decision (confirmed):** Leave all existing `ApiKey` rows intact on the database. Do NOT delete or soft-delete them. Stop reading them in code (back-end no longer queries `ApiKey` for LLM/image providers). `telegram` rows continue to be read/written for Telegram bot token functionality. No data migration needed. Schema stays as-is. The rows become inert for LLM/image providers once the backend switches to reading from `LlmKey` table only.

### Acceptance criteria
- [ ] User loads `/settings`. No LLM/image API key inputs visible.
- [ ] Admin loads `/admin/llm-keys`. All 7 LLM/image providers configurable.
- [ ] Article pipeline runs to completion using platform keys only.
- [ ] Social-post generation works using platform keys only.
- [ ] Writing-style analyzer works using platform keys only.
- [ ] No code path reads `prisma.apiKey.findUnique({ where: { userId, provider: 'openai' }})` or similar.

### Risk
- **Medium.** Touches a lot of code paths. Local dev users with custom keys lose them. Mitigation: env-var fallback continues to work.

---

## Wave 1 — Variable Plumbing + DB Schema

### Goal

Wire every variable referenced by the active prompts into the `VariableResolver`. Empty-string fallback when missing. After this wave, every variable will resolve correctly even if the user hasn't filled in any brand profile or admin hasn't loaded any framework.

### DB Schema Changes

#### W1.1 New model — `OutlineFramework`

```prisma
model OutlineFramework {
  id          String   @id @default(cuid())
  number      Int      @unique                 // 1..12 (for compat with existing CSV column)
  label       String                            // e.g., "Pillar / Educational Foundation"
  description String?  @db.Text                 // Short "when to use this" text — used for LLM auto-assignment context
  body        String   @db.Text                 // Full framework body (substituted into prompts at runtime)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("outline_frameworks")
}
```

Seeded with 12 rows (genericized — see W1.6).

#### W1.2 New model — `PlatformSettings` (singleton)

```prisma
model PlatformSettings {
  id               String   @id @default("singleton")  // hardcoded ID — only one row ever exists
  googleGuidelines String?  @db.Text
  updatedAt        DateTime @updatedAt

  @@map("platform_settings")
}
```

Seeded with one row containing the canonical Google Helpful Content guidelines text.

#### W1.3 New model — `BrandSettings` (per user, 1:1)

```prisma
model BrandSettings {
  id                   String   @id @default(cuid())
  userId               String   @unique
  user                 User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Article context (Tier B Wave 3 fields)
  geolocation          String?  @db.Text
  who                  String?  @db.Text
  ourExperience        String?  @db.Text
  articleGoal          String?  @db.Text
  specialInstructions  String?  @db.Text
  defaultAuthorName    String?
  defaultAuthorWebsite String?

  // Schema markup / organization (Wave 4 fields — added in W1 schema, populated via W4 UI)
  organizationName     String?
  organizationWebsite  String?
  organizationEmail    String?
  organizationPhone    String?
  organizationAddress  String?  @db.Text
  socialMediaLinks     Json?                              // [{ platform: string, url: string }]

  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  @@map("brand_settings")
}
```

Add relation on `User`:
```prisma
model User {
  // ... existing fields ...
  brandSettings BrandSettings?
}
```

#### W1.4 Topic field additions

```prisma
model Topic {
  // ... existing fields ...

  // outlineFrameworkNumber Int? already exists from previous work

  outlineSpecialInstructions String?  @db.Text   // NEW — per-article focus areas
  realCaseStudies            String?  @db.Text   // NEW — per-article real anecdotes (optional)
  outlineFrameworkSource     String?              // NEW — diagnostic: 'user' | 'csv' | 'llm_assigned'
}
```

#### W1.5 Migration

Single Prisma migration: `add_brand_outline_platform_models`. Run via `prisma migrate dev` locally, deployed via existing CI/CD step "3. Run Prisma migrations".

#### W1.6 Seeding — `OutlineFramework` (genericized)

The original 12 framework bodies live in `.plans/article-outlines.implementation-plan.md`. They are heavily DR-real-estate-specific. **Genericization approach:**

For each framework, preserve:
- Section headings
- Section purpose blurbs
- Structural rules (e.g., "Use 3-5 bullets, not paragraphs")
- AI-specific guidance (e.g., "front-load value in first 10 words")
- HTML templates

Replace with placeholder language:
- "Law 108-05" / "CONFOTUR" → "[domain-specific regulation]" or "[applicable law/standard]"
- "Sosúa / Cabarete / North Coast" → "[your geographic focus]" or "[your market]"
- "Toronto buyer" → "[a typical client]"
- "Real estate" specifics → genericize to "the topic"

Example before/after for Framework 1, Section 2 (Statement of Purpose):

**Before (verbatim):**
> "This guide is for foreign investors evaluating the North Coast real estate market in 2026, based on the legal cases and land transactions I personally handled last year."

**After (genericized):**
> "This article is for [your target audience — defined by `{{who}}`] evaluating [the topic], based on the real experience and work I've done in this area."

The 12 genericized bodies will be seeded as initial values. Admin can edit them in `/admin/outline-instructions` (Wave 2) to inject domain-specific phrasing per their tenant's needs.

#### W1.7 Seeding — `PlatformSettings.googleGuidelines`

Single hardcoded text block summarizing Google's Helpful Content guidelines. Sourced from the original Implementation Plan or canonically from Google's published doc. ~2000 words.

#### W1.8 Seeding — no `BrandSettings` rows seeded

`BrandSettings` is per-user. Auto-create an empty row on first `/settings` page load (handled in Wave 3 UI). Pipeline gracefully handles null with empty-string fallback.

### Variable Resolver Additions

File: `apps/api/src/article-pipeline/variable-resolver.ts`

Add to the `PipelineContext` interface:
```ts
export interface PipelineContext {
  // ... existing fields ...
  brandSettingsCache?: BrandSettings | null
  platformSettingsCache?: PlatformSettings | null
  outlineFrameworkCache?: OutlineFramework | null
}
```

Add helper functions:
```ts
async function getBrandSettings(ctx: PipelineContext): Promise<BrandSettings | null> {
  if (ctx.brandSettingsCache !== undefined) return ctx.brandSettingsCache
  const bs = await prisma.brandSettings.findUnique({ where: { userId: ctx.userId } })
  ctx.brandSettingsCache = bs
  return bs
}

async function getPlatformSettings(ctx: PipelineContext): Promise<PlatformSettings | null> { /* ... */ }
async function getOutlineFramework(ctx: PipelineContext): Promise<OutlineFramework | null> { /* ... */ }
async function getUserSettings(ctx: PipelineContext): Promise<{ writingStyle: string | null }> { /* ... */ }
```

Add cases to `resolveVariable()`:

| Variable | Source | Notes |
|---|---|---|
| `outline_framework` | `OutlineFramework.body` where `number = topic.outlineFrameworkNumber` | If number still null at this point, log warning and return `''`. (Should never happen after Wave 2's pre-flight assignment.) |
| `writing_style` | `Settings.writingStyle` for `topic.userId` | Reads existing field. |
| `google_guidelines` | `PlatformSettings.googleGuidelines` (singleton) | |
| `geolocation` | `BrandSettings.geolocation` | |
| `who` | `BrandSettings.who` | |
| `our_experience` | `BrandSettings.ourExperience` | |
| `article_goal` | `BrandSettings.articleGoal` | |
| `special_instructions` | `BrandSettings.specialInstructions` | |
| `outline_special_instructions` | `Topic.outlineSpecialInstructions` | |
| `real_case_studies` | `Topic.realCaseStudies` | |
| `author_name` | `BrandSettings.defaultAuthorName` | (W3 populates) |
| `author_website` | `BrandSettings.defaultAuthorWebsite` | (W3 populates) |
| `organization_name` | `BrandSettings.organizationName` | (W4 populates) |
| `organization_website` | `BrandSettings.organizationWebsite` | (W4 populates) |
| `organization_email` | `BrandSettings.organizationEmail` | (W4 populates) |
| `organization_phone` | `BrandSettings.organizationPhone` | (W4 populates) |
| `organization_address` | `BrandSettings.organizationAddress` | (W4 populates) |
| `social_media_links` | Format `BrandSettings.socialMediaLinks` JSON as `["url1", "url2"]` string | (W4 populates) |

All cases use empty-string fallback when source is null.

### Acceptance criteria
- [ ] Migration runs cleanly on production DB.
- [ ] All 12 `OutlineFramework` rows seeded (verifiable via `/admin` once W2 ships, or via direct DB query).
- [ ] `PlatformSettings` row seeded with Google guidelines.
- [ ] Existing pipeline runs produce identical output (no behaviour change yet — variables resolve to `""` when not yet populated).
- [ ] Resolver never throws when a variable's source is missing.
- [ ] Smoke test: trigger a pipeline run, verify all variables resolve (most to empty string).

### Risk
- **Low.** Pure additive change. No prompt changes yet. No UI changes yet.

---

## Wave 2 — Outline Framework System (admin UI + dropdown + LLM fallback)

### Goal

Operationalize the `OutlineFramework` system: admin can edit the 12 frameworks, users select one when creating an article, and a server-side LLM fallback handles cases where no framework was specified.

### Tasks

#### W2.1 Admin page — `/admin/outline-instructions`

New file: `apps/web/src/app/admin/outline-instructions/page.tsx`

UI:
- Header: "Article Outline Frameworks"
- For each of the 12 frameworks (sorted by `number`):
  - Collapsible card titled `{N}. {label}`
  - Inputs:
    - Label (1-line text)
    - Description (textarea, 3 rows) — used for LLM auto-assignment
    - Body (textarea, 25 rows) — substituted into prompts
    - Active toggle
  - Save button per framework
- A separate "Google Helpful Content Guidelines" card at the top with a 25-row textarea + Save button (this is `PlatformSettings.googleGuidelines`)

Backend:
- `GET /api/admin/outline-frameworks` → returns all 12 + `platformSettings.googleGuidelines`
- `PUT /api/admin/outline-frameworks/:number` → update a single framework
- `PUT /api/admin/platform-settings` → update googleGuidelines

Authorization: `requireAdmin` middleware (already exists per past conversation).

Sidebar nav: add "Outline Frameworks" link to the admin sidebar (`apps/web/src/components/admin/AdminSidebar.tsx` or wherever the existing `/admin/prompts` link lives).

#### W2.2 Dashboard new-article form — outline dropdown with Auto-select

Existing file: probably `apps/web/src/app/(protected)/workflow/page.tsx` or `apps/web/src/components/workflow/NewArticleForm.tsx`.

Add a new field above the "Submit" button:

```tsx
<div>
  <label>Article Outline Framework</label>
  <select value={outlineFrameworkNumber ?? ''} onChange={...}>
    <option value="">Auto-select (recommended)</option>
    {frameworks.map(f => (
      <option key={f.number} value={f.number}>
        {f.number}. {f.label}
      </option>
    ))}
  </select>
  <p className="text-xs text-muted-foreground mt-1">
    {selectedFramework
      ? selectedFramework.description
      : 'The AI will choose the best structure for your topic automatically.'}
  </p>
</div>
```

Behaviour:
- **Default selection:** "Auto-select (recommended)" (empty value = null).
- **When "Auto-select":** `outlineFrameworkNumber` is sent as `null` in the trigger payload. Server-side LLM assignment runs before the pipeline starts.
- **When user picks a specific framework:** integer 1–12 is sent and persisted directly; LLM assignment is skipped.
- Field is **not required** — user can always leave it on Auto-select.
- No description hint is shown when Auto-select is active.

Load the 12 frameworks from `GET /api/article-pipeline/outline-frameworks` (thin proxy to `GET /api/admin/outline-frameworks`, returning only `number`, `label`, `description` — no body).

Backend `POST /api/article-pipeline/trigger`:
- Accepts `outlineFrameworkNumber: number | null` in the body.
- If provided: persists to `Topic.outlineFrameworkNumber`, sets `outlineFrameworkSource = 'user'`.
- If null: persists null, LLM assignment runs immediately before pg-boss enqueue, sets `outlineFrameworkSource = 'llm_assigned'`.

#### W2.3 Server-side LLM assignment

Runs any time `Topic.outlineFrameworkNumber` is null at trigger time. This covers three paths:
1. **Dashboard "Auto-select"** — user left the dropdown on the default option.
2. **CSV upload with blank `Outline Framework` column** — column missing or empty.
3. **Programmatic / API trigger** — no framework provided.

Run an LLM call synchronously before enqueueing the pg-boss job (takes ~1 second, negligible for UX since the pipeline itself takes minutes).

New file: `apps/api/src/article-pipeline/outline-assignment.ts`

```ts
export async function assignOutlineFrameworkIfMissing(topicId: string): Promise<{
  number: number,
  source: 'user' | 'csv' | 'llm_assigned',
}> {
  const topic = await prisma.topic.findUniqueOrThrow({ where: { id: topicId } })

  if (topic.outlineFrameworkNumber && topic.outlineFrameworkNumber >= 1 && topic.outlineFrameworkNumber <= 12) {
    return { number: topic.outlineFrameworkNumber, source: topic.outlineFrameworkSource as any ?? 'user' }
  }

  const frameworks = await prisma.outlineFramework.findMany({
    where: { isActive: true },
    orderBy: { number: 'asc' },
    select: { number: true, label: true, description: true },
  })

  const systemPrompt = `You are an editorial assistant. Given a topic, choose the outline framework number (1-12) that best fits the topic.`
  const userPrompt = `Topic: "${topic.topic}"

Available frameworks:
${frameworks.map(f => `${f.number}. ${f.label} — ${f.description ?? '(no description)'}`).join('\n')}

Respond with ONLY a single integer between 1 and 12. No commentary.`

  const response = await callOpenAIChat({
    model: 'gpt-4o-mini',
    systemPrompt,
    userPrompt,
    maxTokens: 8,
    temperature: 0,
  })

  const parsed = parseInt(response.trim(), 10)
  const number = (Number.isInteger(parsed) && parsed >= 1 && parsed <= 12) ? parsed : 1  // default to Pillar

  await prisma.topic.update({
    where: { id: topicId },
    data: { outlineFrameworkNumber: number, outlineFrameworkSource: 'llm_assigned' },
  })

  await logInfo(`Outline framework auto-assigned: ${number} (LLM)`, { topicId, source: 'llm_assigned' })

  return { number, source: 'llm_assigned' }
}
```

Wire into the trigger endpoint: call `assignOutlineFrameworkIfMissing(topic.id)` before `pgBoss.send('article-pipeline', ...)`.

LLM cost: ~8 output tokens × gpt-4o-mini = ~$0.000005/article. Negligible.

LLM provider: uses platform-owned OpenAI key (W0 prerequisite).

#### W2.4 Track usage / cost

Log this LLM call to `LLMUsage` table same as pipeline steps. Step number = `0` (pre-flight) or a sentinel value. Record actual token count + cost.

#### W2.5 CSV importer compatibility

The CSV parser (`lib/csv-parser.ts` per the doc) already reads `Outline Framework` column → `Topic.outlineFrameworkNumber`. Verify:
- Column name is case-insensitive
- Empty value → null (so LLM fallback kicks in)
- Out-of-range values (0, 13, "abc") → reject with validation error

Set `outlineFrameworkSource = 'csv'` when the CSV provided a value.

If the existing parser doesn't already handle this, fix it in W2.

### Acceptance criteria
- [ ] Admin loads `/admin/outline-instructions`, sees 12 frameworks + Google guidelines.
- [ ] Admin can edit any framework's label/description/body and save. Edit is reflected in next article run.
- [ ] User cannot submit dashboard new-article form without picking a framework.
- [ ] CSV upload without `Outline Framework` column triggers LLM auto-assignment, persists number to topic, logs `outlineFrameworkSource = 'llm_assigned'`.
- [ ] CSV upload WITH `Outline Framework` column persists user's choice, sets source = `'csv'`.
- [ ] Pipeline run uses the same framework number across Step 1 and Step 9 (no per-step rerolls — eliminated by persistent `Topic.outlineFrameworkNumber`).
- [ ] `LLMUsage` table records the auto-assignment call with provider + token count + cost.
- [ ] Sidebar nav has "Outline Frameworks" link in admin.

### Risk
- **Low to medium.** New admin UI is straightforward. Pre-flight LLM call is tiny. Main risk: CSV parser regression if existing column handling is brittle.

---

## Wave 3 — Article Brand Profile UI + Reseeded Prompts

### Goal

Bring the production-grade prompts online. Build the UI for the per-tenant brand profile fields. This is the wave that delivers the biggest article-quality jump.

### Tasks

#### W3.1 New `/settings` section — "Article Brand Profile"

File: `apps/web/src/app/(protected)/settings/page.tsx`

Add a new section between "Writing Style" and "Connected Accounts":

```tsx
<div className="rounded-lg border border-border bg-card p-6">
  <h2 className="text-xl font-semibold text-card-foreground mb-2">Article Brand Profile</h2>
  <p className="text-sm text-muted-foreground mb-4">
    Context about you and your business that the AI uses to write articles in your voice.
    These fields are used in long-form article generation only — not in social posts.
  </p>

  <div className="space-y-4">
    <Field
      label="Geographic focus"
      placeholder='e.g., "United States" or "Sydney, Australia" or "Global"'
      help="Used to constrain facts/statistics. Required for accurate localised research."
      value={geolocation}
      onChange={setGeolocation}
    />

    <Field
      label="About you / your business (long form)"
      placeholder="Who are you? What do you do? Who do you serve? Write in your own voice."
      help="Substituted as {{who}} in article prompts."
      multiline rows={4}
      value={who}
      onChange={setWho}
    />

    <Field
      label="Your relevant experience"
      placeholder="Years in the field, types of work, areas of expertise. Concrete details only — no fluff."
      help="Substituted as {{our_experience}}. Grounds the article's authority claims."
      multiline rows={4}
      value={ourExperience}
      onChange={setOurExperience}
    />

    <Field
      label="Goal of your articles"
      placeholder="What outcome do you want each article to drive? Newsletter subscriptions, leads, education, brand authority, etc."
      help="Substituted as {{article_goal}}. Steers tone and CTA."
      multiline rows={3}
      value={articleGoal}
      onChange={setArticleGoal}
    />

    <Field
      label="Special instructions for every article"
      placeholder="Standing rules: e.g., always use Oxford commas, never mention competitors, write at 8th-grade reading level."
      help="Substituted as {{special_instructions}}."
      multiline rows={3}
      value={specialInstructions}
      onChange={setSpecialInstructions}
    />

    <Field
      label="Default author name"
      placeholder="e.g., Veit Mehler"
      help="Substituted as {{author_name}} (Step 9 / Step 11). The article's bylined voice."
      value={defaultAuthorName}
      onChange={setDefaultAuthorName}
    />

    <Field
      label="Default author website"
      placeholder="https://example.com/about"
      help="Substituted as {{author_website}} (used in schema markup)."
      value={defaultAuthorWebsite}
      onChange={setDefaultAuthorWebsite}
    />

    <Button onClick={saveBrandProfile} disabled={isSaving}>Save Brand Profile</Button>
  </div>
</div>
```

Backend:
- `GET /api/brand-settings` → returns the user's `BrandSettings` row (creates one if missing).
- `PATCH /api/brand-settings` → upsert by `userId`.

Auto-create empty `BrandSettings` row when user first visits `/settings` if one doesn't exist (so the UI always has something to bind to).

#### W3.2 Per-article "Specific focus" + "Real case studies" inputs

In the new-article form (already opened in W2 for the framework dropdown), add two collapsible/optional fields:

```tsx
<details>
  <summary>Advanced (optional)</summary>
  <div className="space-y-3 mt-3">
    <Field
      label="Specific focus areas for this article"
      placeholder="What angles or sub-topics should the article emphasise? Optional."
      multiline rows={3}
      value={outlineSpecialInstructions}
      onChange={setOutlineSpecialInstructions}
    />
    <Field
      label="Real case studies or anecdotes (optional)"
      placeholder="Paste any real (anonymised) client stories, examples, or anecdotes you want the article to reference. Empty is fine — the AI will write in general terms."
      multiline rows={5}
      value={realCaseStudies}
      onChange={setRealCaseStudies}
    />
  </div>
</details>
```

These map to the new `Topic.outlineSpecialInstructions` and `Topic.realCaseStudies` fields.

Send via the existing `POST /api/article-pipeline/trigger` payload.

#### W3.3 Reseed prompts

Update `packages/db/prisma/seed.ts` to align prompts with `active-prompts-from-db.md`. Key changes:

| Step | Action |
|---|---|
| 1 (`generate_outline`) | **Replace** with active version. Uses `{{topic}}`, `{{outline_framework}}`, `{{who}}`, `{{our_experience}}`, `{{article_goal}}`, `{{special_instructions}}`, `{{outline_special_instructions}}`. Default model: `gemini-2.5-flash`. |
| 2 (`keyword_research`) | **Hybrid.** Keep our flat-JSON output schema (proven to work). Inject `{{geolocation}}` per active version. Default model: `gemini-2.5-flash` (NOT `gemini-3-pro-preview` — too aggressive a model upgrade for now; can revisit). |
| 3 (`find_supporting_keywords`) | **Replace** with active version. Uses `{{primary_keyword}}`, `{{secondary_keywords}}`, `{{salient_entities}}`. Default model: `gemini-2.5-flash`. |
| 4 (`optimize_outline_seo`) | **Replace** with active version. Uses outline output + all keyword vars + `{{find_supporting_keywords_output}}` + `{{who}}` + `{{google_guidelines}}`. Default model: `gemini-2.5-flash`. |
| 5 (`write_search_intent_intro`) | **Replace** with active version. Uses `{{generate_outline_output}}` + keyword vars + `{{writing_style}}`. Default model: `gemini-2.5-flash`. |
| 6 (`research_faqs`) | **Replace** with active version. Uses `{{optimize_outline_seo_output}}` + keyword vars + `{{find_supporting_keywords_output}}`. Default model: `gemini-2.5-flash`. |
| 7 (`find_faq_facts`) | **Replace** with active version. Uses `{{research_faqs_output}}` + `{{geolocation}}`. Default model: `gemini-2.5-flash` (kept from prior fix — quota-safe). |
| 8 (`find_article_facts`) | **Replace** with active version. Uses `{{optimize_outline_seo_output}}` + `{{geolocation}}`. Default model: `gemini-2.5-flash`. |
| 9 (`write_article`) | **Replace** with active version BUT with persona stripping (see W3.4 below). Default model: `claude-sonnet-4-5-20250929`. |
| 10 (`fact_check_article`) | **Replace** with active version. Uses `{{write_article_output}}` + `{{geolocation}}` + `{{current_date}}`. Default model: `gemini-2.5-flash`. |
| 11 (`adjust_incorrect_facts`) | **Replace** with active version BUT with persona stripping. Default model: `claude-sonnet-4-5-20250929`. |
| 12 (`find_citations`) | **Replace** with active version. Uses `{{write_article_output}}` + `{{geolocation}}` + `{{current_date}}`. Default model: `gemini-2.5-flash`. |
| 13 (`generate_seo_metadata`) | **Replace** with active version. Uses `{{write_search_intent_intro_output}}`. Default model: `gemini-2.5-flash` (active uses this). |
| 14 (`select_category`) | **Add — currently missing.** Active version verbatim. Default model: `gpt-4o-mini`. |
| 15 (`generate_image_prompt`) | Already identical. No change. |
| 17 (`generate_excerpt`) | Already identical. No change. |
| 18 (`generate_legal_disclaimer`) | Already identical. No change. |
| 16 (`generate_schema_markup`) | **Defer to Wave 4.** |

**Note on models:** the active DB has many steps using `gemini-3-pro-preview`, which is presumably an internal Google preview that may not be available on the public API. We'll default to `gemini-2.5-flash` everywhere and let the admin upgrade per-step via `/admin/prompts` once a stable Pro model is available.

#### W3.4 Persona stripping for Steps 9 & 11

The active version of Step 9's user prompt opens with:
> "You are Lic. Guido Luis Perdomo Montalvo, a cynical but deeply knowledgeable real estate lawyer in Sosúa, Dominican Republic, with 40 years of experience..."

Strip this. Replace with generic persona injection backed by brand profile fields:

**Replacement (conceptual):**
```text
# ROLE

You are {{author_name}}, writing for {{who}}.

If {{author_name}} is empty, you are an experienced practitioner writing for a knowledgeable
audience. Use first-person voice ("I", "we"), share real experience grounded in {{our_experience}},
and write in the {{writing_style}} voice.

You love to use visceral, real-life, simple but dimensional language, and build a desire in the
reader to read the full article.

First you will receive your context, then you will receive your task.
```

The fallback handling for empty fields is implemented at the **prompt level** (not the resolver), via natural-language conditionals like the example above. Empty `{{author_name}}` results in a still-coherent prompt. Same approach for Step 11.

Other than the persona block, the rest of Step 9/11 remains verbatim (the entire 5000-line writing-style/anti-AI corpus is preserved).

#### W3.5 Reseed strategy — one-time migration script

**Decision (confirmed):** One-time named migration script.

Current seed behavior: `upsert` by `stepNumber`, only inserts when missing — so `seed.ts` alone will not overwrite existing rows that admins may have manually edited.

Instead, a dedicated one-time script (e.g., `packages/db/scripts/reseed-prompts-v3.ts`) will explicitly overwrite the 14 affected steps with their new prompt bodies. This script:
- Runs once, manually, at the W3 deploy.
- Is idempotent (safe to re-run — always overwrites to the same values).
- Is NOT wired into the automatic deploy CI pipeline (unlike `seed.ts` which runs on every deploy).
- Documents which steps it touches and what it changed in a header comment.
- After W3 ships, future prompt tweaks go via admin UI `/admin/prompts` or a new versioned script.

After W3, consider adding a `seedVersion` integer to `PromptTemplate` (default 1) so future scripts can be version-gated, but this is not required for W3 itself.

### Acceptance criteria
- [ ] User loads `/settings`, sees "Article Brand Profile" section with 7 fields.
- [ ] User saves brand profile, fields persist to `BrandSettings` row.
- [ ] User creates new article, sees "Specific focus" and "Real case studies" optional fields.
- [ ] Pipeline run uses brand-profile values in prompts (verifiable via verbose LLM logging — check that `{{who}}` was substituted, not literal).
- [ ] All Step 1–14 prompts updated to active versions (with persona stripped on 9/11).
- [ ] Step 14 added; `select_category` runs successfully.
- [ ] Article output quality jumps significantly (subjective — qualitatively check vs a previous run).
- [ ] No prompt references variables that don't exist in the resolver (verifiable by running every step on a synthetic topic and grepping output for unresolved `{{...}}`).

### Risk
- **High.** Largest wave. Touches every prompt. Seed overwrite needs careful handling so we don't blow away admin's prior manual edits unintentionally.

---

## Wave 4 — Schema Markup + Organization Fields

### Goal

Bring back LLM-driven Schema.org JSON-LD generation for SEO. Add the organization-level fields the schema needs.

### Tasks

#### W4.1 Extend `/settings` Article Brand Profile

Add a new sub-section "Organization (for schema markup)" inside the existing Article Brand Profile section:

- Organization name
- Organization website
- Organization email
- Organization phone
- Organization address (textarea)
- Social media links — repeating `{ platform: 'twitter|linkedin|facebook|instagram|threads|other', url: 'https://...' }` rows. Add/remove buttons.

UI: collapsible accordion under the main brand profile fields. Saved into the same `BrandSettings` row.

#### W4.2 Add resolver cases

`{{published_date}}` → `Topic.publishingDate?.toISOString() ?? new Date().toISOString()`
`{{article_url}}` → `${process.env.PUBLIC_SITE_URL}/${seoSlug}` where `seoSlug = parsedSteps.get(13)?.urlSlug`

#### W4.3 Reseed Step 16 (`generate_schema_markup`)

Adopt the active version verbatim. Default model: `gpt-4o-mini`. References:
`{{article_title}}`, `{{seo_description}}`, `{{author_name}}`, `{{author_website}}`, `{{published_date}}`, `{{article_url}}`, `{{article}}`, `{{citation_urls}}`, `{{organization_name}}`, `{{organization_website}}`, `{{organization_email}}`, `{{organization_phone}}`, `{{organization_address}}`, `{{social_media_links}}`.

#### W4.4 Wire Step 16 into the pipeline

If Step 16 is currently disabled (programmatic schema generation in `enrichment/`?), re-enable it in the pipeline executor. Check the existing executor to see whether Step 16 is invoked.

If Step 16 was skipped in favour of programmatic schema generation, decide:
- **(a)** Replace programmatic with LLM (more flexible, costs ~$0.0001/article)
- **(b)** Keep programmatic; skip Step 16 entirely (no schema cost, less flexible)

→ Recommendation: **(a)** for richer, citation-integrated schema. Programmatic was a stopgap.

### Acceptance criteria
- [ ] `BrandSettings` organization fields populated via UI.
- [ ] Step 16 runs, produces valid JSON-LD.
- [ ] Schema markup persists in `SitePage.schemaJson` (or equivalent existing column).
- [ ] All schema variables resolve correctly (no literal `{{...}}` in JSON-LD output).

### Risk
- **Medium.** Step 16 was always finicky in the original (lots of escaping rules). LLM may produce invalid JSON-LD occasionally. Need robust validation.

---

## 2. Cross-Cutting: Schema Diff Summary

```diff
 model User {
   // ... existing ...
+  brandSettings BrandSettings?
 }

 model Topic {
   // ... existing ...
   outlineFrameworkNumber Int?
+  outlineSpecialInstructions String?  @db.Text
+  realCaseStudies            String?  @db.Text
+  outlineFrameworkSource     String?
 }

+model OutlineFramework { ... }      // 12 rows
+model PlatformSettings { ... }      // 1 row
+model BrandSettings { ... }         // 1 row per user
```

No changes to `Settings` table (writingStyle already there).

---

## 3. Variable Resolver — Final Map

After all 4 waves, the resolver supports:

| Variable | Source | Fallback |
|---|---|---|
| `topic` | `ctx.topicText` | `''` |
| `slug` | `ctx.topicSlug` | `''` |
| `excludedKeywords` / `excluded_keywords` | global excludes + `Topic.excludedKeywords` | `''` |
| `outline` | step 1 output | `''` |
| `keywords` | step 2 raw output | `''` |
| `primaryKeyword` / `primary_keyword` / `primaryKeywords` | parsed step 2 | `''` |
| `secondary_keywords` | parsed step 2 | `''` |
| `salient_entities` | parsed step 2 | `''` |
| `searchIntent` / `intro` | step 5 output | `''` |
| `faqQuestions` / `faqs` | step 6 output | `''` |
| `facts` | step 8 output | `''` |
| `article` / `article_html` | step 11 output, fallback step 9 | `''` |
| `factCheckIssues` | step 10 output | `''` |
| `article_title` | `SitePage.seoTitle` or `.title` or topic | `''` |
| `articleSummary` / `article_summary` | first 1000 chars of article | `''` |
| `article_excerpt` | `SitePage.excerpt` | `''` |
| `article_disclaimer` | `SitePage.disclaimer` | `''` |
| `seo_title` / `seo_description` / `article_slug` | parsed step 13 | `''` |
| `citation_urls` | parsed step 12 | `''` |
| `current_date` | `new Date().toISOString()` | `''` |
| `outline_framework` (W1) | `OutlineFramework.body` by `topic.outlineFrameworkNumber` | `''` |
| `writing_style` (W1) | `Settings.writingStyle` for user | `''` |
| `google_guidelines` (W1) | `PlatformSettings.googleGuidelines` | `''` |
| `geolocation` (W1) | `BrandSettings.geolocation` | `''` |
| `who` (W1) | `BrandSettings.who` | `''` |
| `our_experience` (W1) | `BrandSettings.ourExperience` | `''` |
| `article_goal` (W1) | `BrandSettings.articleGoal` | `''` |
| `special_instructions` (W1) | `BrandSettings.specialInstructions` | `''` |
| `outline_special_instructions` (W1) | `Topic.outlineSpecialInstructions` | `''` |
| `real_case_studies` (W1) | `Topic.realCaseStudies` | `''` |
| `author_name` (W1) | `BrandSettings.defaultAuthorName` | `''` |
| `author_website` (W1) | `BrandSettings.defaultAuthorWebsite` | `''` |
| `organization_name` (W4) | `BrandSettings.organizationName` | `''` |
| `organization_website` (W4) | `BrandSettings.organizationWebsite` | `''` |
| `organization_email` (W4) | `BrandSettings.organizationEmail` | `''` |
| `organization_phone` (W4) | `BrandSettings.organizationPhone` | `''` |
| `organization_address` (W4) | `BrandSettings.organizationAddress` | `''` |
| `social_media_links` (W4) | format JSON list | `''` |
| `published_date` (W4) | `Topic.publishingDate` or now | `''` |
| `article_url` (W4) | `${PUBLIC_SITE_URL}/${seoSlug}` | `''` |
| `<step_name>_output` | generic step output accessor | `''` |

---

## 4. Wave Sequencing & Dependencies

```
W0 ──► W1 ──► W2 ──► W3 ──► W4
            │       │      │
            └─ W1 + W2 ship together (per user request)
```

**Cannot reorder:**
- W0 must precede W1 (the LLM auto-assignment fallback in W2 depends on platform-owned keys).
- W1 must precede W2 (W2 needs the `OutlineFramework` table).
- W3 must precede W4 (W4 reuses the `/settings` Article Brand Profile UI built in W3).

**Could reorder:**
- W0 could happen after W1 if we tolerate user-keyed pre-flight LLM call temporarily.

---

## 5. Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Genericized framework bodies lose structural quality | Medium | Medium | Side-by-side review of original vs genericized before seeding. Admin can edit per-tenant via /admin UI. |
| Reseed in W3 overwrites admin's manual prompt edits | High | High | Use one-time named migration script, not automated reseed. Document that admin should re-apply local edits after W3. |
| New prompts reference variables not yet in resolver | Medium | Medium | Build a CI check: parse all `{{var}}` from seed.ts prompts, fail build if any var isn't in the resolver's known list. |
| Step 16 LLM produces invalid JSON-LD | Medium | Low | Add `tryParseJSON` + fallback to programmatic schema if LLM output unparseable. Already a graceful-degradation pattern. |
| W0 breaks local dev (devs lose their personal API keys) | High | Medium | Keep `process.env[PROVIDER]_API_KEY` fallback in `getApiKey`. Devs use env vars going forward. Update README. |
| User confusion: Brand Profile vs Writing Style | Low | Low | Strong copy on the UI clarifying distinction: Writing Style = HOW you write; Brand Profile = WHO you are + WHAT you do. |

---

## 6. Out of Scope (intentionally deferred)

- Translation pipeline (Steps 19–26)
- Newsletter generation (Steps 27–28)
- GEO enrichment (Steps 101–106) — replaces current Mermaid-diagram enrichment, but that's a separate product question
- Mermaid-diagram enrichment changes
- CSV importer column additions for `outlineSpecialInstructions` / `realCaseStudies` (defer to a "CSV refresh" phase)
- Migration of `Settings.defaultProvider` etc. to `PlatformSettings` (W0 keeps these columns dormant)
- `version` field on `PromptTemplate` for idempotent seed updates (consider after W3)
- Per-tenant `googleGuidelines` (locked: platform-wide singleton)

---

## 7. Definition of Done (for the entire plan)

- [ ] All Wave 0–4 acceptance criteria pass.
- [ ] CI/CD deploys cleanly with no manual intervention.
- [ ] Admin can edit any prompt, framework, or platform setting via the admin UI.
- [ ] User can fill in their full Article Brand Profile in `/settings`.
- [ ] User cannot start an article without picking an outline framework.
- [ ] CSV uploads with missing framework column trigger LLM auto-assignment.
- [ ] All LLM costs are tracked in `LLMUsage` and attributed to platform (not per-user).
- [ ] Smoke-test article run produces output of measurably better quality than current pipeline (subjective qualitative review).
- [ ] No `{{unresolved_variable}}` strings appear in any LLM prompt sent to the provider (verifiable via verbose LLM logs).

---

## 8. Estimated Effort (rough)

| Wave | Effort |
|---|---|
| W0 | 0.5–1 day (audit + refactor + UI removal) |
| W1 | 0.5 day (schema + resolver — purely additive) |
| W2 | 1 day (admin UI + dropdown + LLM fallback + CSV verification) |
| W3 | 1.5–2 days (UI section + reseed all prompts + persona stripping + migration script) |
| W4 | 0.5–1 day (extra UI fields + Step 16 reseed + new resolver cases) |
| **Total** | **4–5.5 days of focused work** |

---

## 9. All Decisions Locked — Ready to Implement

| # | Decision | Resolution |
|---|---|---|
| W0.5 | Deprecated `Settings` columns (`defaultProvider` etc.) | Keep on DB, dormant. Remove all frontend reads/writes. Drop in a future cleanup migration. |
| W0.6 | `ApiKey` rows for LLM/image providers | Leave intact on DB. Stop reading them in backend code. Only `telegram` rows remain actively used. |
| W2.2 | Outline dropdown on dashboard | "Auto-select (recommended)" is the default option (triggers server-side LLM assignment). 12 named framework options below it. User can always leave it on Auto-select. |
| W2.3 | LLM auto-assignment trigger conditions | Dashboard Auto-select, CSV blank column, any programmatic trigger with null framework. |
| W3.5 | Reseed strategy | One-time named migration script (`reseed-prompts-v3.ts`). Not wired into CI. Run manually once at W3 deploy. |

**No open questions remain. Ready to implement on "go".**
