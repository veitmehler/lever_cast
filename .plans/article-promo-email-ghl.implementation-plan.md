# Article Promotional Email via GHL Campaign — Implementation Plan

**Status:** Draft / not started
**Author:** planning session 2026-06-15
**Related:** [[social-media-automation-ghl.implementation-plan.md]], [[publish-triggered-content-generation.implementation-plan.md]], [[ghl-integration-plan.md]]

---

## 1. Goal & confirmed product decisions

For **every article**, when it is **published**, the app automatically:

1. Generates a promotional email (subject + HTML body) from the article using an **editable prompt**.
2. Creates a **GoHighLevel Email Campaign** targeting **one globally-configured tag / smart list**.
3. **Schedules** that campaign to send at a **configured time of day on the article's publishing date**.

Decisions locked in with the user:

| Question | Decision |
|---|---|
| Send mechanism | **Create a GHL Email Campaign via the GHL V2 email-marketing API** (not per-contact Conversations API, not draft-only). |
| Automation | **Fully automatic** — no human review/approval step before send. |
| Tag/audience scope | **Global setting only** — one tag configured once, used for every article. |
| Send timing | **Scheduled time of day on the publish date** (e.g. 09:00 in the user's timezone). |

This feature is modelled directly on the existing **syndication** feature (LinkedIn/Medium article generation on publish), which has the same shape: publish-triggered → prompt-template-driven LLM generation → stored row → idempotent queue job. Reusing that pattern de-risks the build substantially.

---

## 2. Key external dependency: GHL Email Marketing V2 API

GHL ships public V2 email-marketing endpoints (List / Create / Update / Schedule / Delete Email Campaign):

- List: `https://marketplace.gohighlevel.com/docs/ghl/emails/list-email-campaigns-v-2/`
- Create: `https://marketplace.gohighlevel.com/docs/ghl/emails/create-email-campaign-v-2/`
- Schedule: `https://marketplace.gohighlevel.com/docs/ghl/emails/schedule-campaign-v-2/`
- Tags (audience source): `GET /locations/{locationId}/tags`

> ⚠️ **OPEN TECHNICAL RISK — resolve in Phase 0 before coding the client.** The detailed schema pages are JS-rendered and could not be scraped during planning. Before implementing `apps/api/src/lib/ghl/client.ts`, confirm the **exact request/response shape** by either (a) pulling the GHL OpenAPI spec, or (b) a throwaway authenticated call against the user's account. Specifically confirm:
> 1. **Audience targeting** — can a campaign be targeted **directly by tag/smart-list id** in the create or schedule call, or does it require a saved audience/segment id created separately? This determines whether "select a tag" maps 1:1 to the API.
> 2. **Email body** — inline HTML+subject vs. a pre-built template id. (We assume inline HTML; if a template id is required, we must create/update a template via API first.)
> 3. **Sender identity** — whether `fromName` / `fromEmail` / verified sending domain is a required field.
> 4. **Schedule semantics** — does `schedule` take an absolute ISO timestamp? Time zone handling?
> 5. **Scopes** — which scopes the Private Integration key must carry (`emails.write` / `campaigns.write` or similar) and whether the user's existing key has them.

Everything below assumes the most likely answer (inline HTML, tag-targetable, ISO schedule timestamp). Phase 0 findings may adjust field names but not the overall architecture.

---

## 3. Architecture overview

```
Article published (POST /api/articles/:jobId/publish, articles.ts ~L476)
        │  (fire-and-forget, gated on promoEmailEnabled)
        ▼
enqueuePromoEmail(jobId, userId)         ← new, mirrors enqueueSyndication
        │  pg-boss QUEUES.PROMO_EMAIL_GENERATE  (singletonKey per job)
        ▼
promoEmailGenerateHandler (worker)       ← new, mirrors syndicationGenerateHandler
        │
        ├─ 1. generatePromoEmail(jobId,userId)   ← new, mirrors generateSyndicationArticles
        │       • load SitePage (title/excerpt/body/url)
        │       • load PromptTemplate stepNumber=32 (editable in /admin/prompts)
        │       • LLM via getLLMAdapter → { subject, bodyHtml }
        │       • upsert ArticleEmailCampaign row (status=generated)
        │
        ├─ 2. resolve global config from GhlSettings (tag id, send time, tz)
        │       + decrypt API key (getGhlCredentials)
        │
        ├─ 3. createGhlEmailCampaign(...)  → ghlCampaignId
        │
        ├─ 4. compute scheduledFor = publishingDate @ promoEmailSendTime (tz-aware)
        │       (if that instant is already past → send now)
        │
        └─ 5. scheduleGhlEmailCampaign(ghlCampaignId, scheduledFor)
                • update ArticleEmailCampaign: status=scheduled, ghlCampaignId, scheduledFor

Safety sweep cron (every 10 min)          ← new, mirrors syndicationSafetyHandler
        • re-enqueue rows stuck in pending/generated, surface failures
```

**Visibility:** prompt is editable at `/admin/prompts/32` (existing UI, free). A read-only status panel in the workflow detail page shows generated subject/body + GHL campaign id + scheduled time + status.

---

## 4. Data model changes (`packages/db/prisma/schema.prisma`)

### 4.1 New model `ArticleEmailCampaign`

Mirrors `SyndicationArticle` (one row per article job).

```prisma
model ArticleEmailCampaign {
  id            String     @id @default(cuid())
  jobId         String     @unique
  job           ArticleJob @relation(fields: [jobId], references: [id], onDelete: Cascade)
  userId        String
  subject       String
  bodyHtml      String     @db.Text
  status        String     @default("pending") // pending | generated | scheduled | sent | failed
  ghlCampaignId String?
  tagId         String?    // tag/smart-list snapshot used at send time
  tagName       String?
  scheduledFor  DateTime?
  sentAt        DateTime?
  errorMessage  String?    @db.Text
  inputTokens   Int        @default(0)
  outputTokens  Int        @default(0)
  cost          Float      @default(0)
  provider      String?
  model         String?
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  @@index([userId])
  @@index([status])
  @@map("article_email_campaigns")
}
```

Add the back-relation on `ArticleJob`:
```prisma
  articleEmailCampaign  ArticleEmailCampaign?
```

### 4.2 Extend `GhlSettings` with global promo-email config

```prisma
  promoEmailEnabled    Boolean  @default(false)
  promoEmailTagId      String?
  promoEmailTagName    String?
  promoEmailSendTime   String?  @default("09:00") // "HH:mm" 24h, in promoEmailTimezone
  promoEmailTimezone   String?  @default("America/New_York")
  promoEmailFromName   String?  // only if Phase 0 confirms sender identity is required
  promoEmailFromEmail  String?  // "
```

> Rationale for putting config on `GhlSettings` rather than `Settings`: it is GHL-scoped, needs `locationId`, and lives next to the API key it depends on. (`socialTimezone` precedent lives on `Settings`; we keep a dedicated `promoEmailTimezone` so the two automations can differ.)

### 4.3 Migration

- `pnpm --filter @socioply/db migrate:dev --name add_article_email_campaigns` to author the migration locally.
- Migration file lands in `packages/db/prisma/migrations/<timestamp>_add_article_email_campaigns/`.
- Deploy path: `migrate:deploy` (already wired in CI/release).
- Run `pnpm --filter @socioply/db generate` to refresh the Prisma client.

---

## 5. Prompt template (the editable prompt — step 32)

### 5.1 Seed a new `PromptTemplate`

- `stepNumber = 32`, `stepName = "Promotional Email"`.
- Add to **both** the canonical seed (`packages/db/prisma/seed.ts`) and the reseed script (`packages/db/scripts/reseed-prompts-v3.ts`) following the step 30/31 (syndication) entries.
- `defaultProvider` / `defaultModel`: match syndication defaults (or whatever the user prefers — editable later anyway).
- `maxTokens`: ~2000 (email is short).
- `isActive: true`.

### 5.2 Output contract & variables

The prompt must produce a **subject line + HTML body**. Use the same first-line convention as syndication (`extractTitleAndContent` extracts `# Subject` from line 1, rest = body) **OR** instruct the model to return strict JSON `{ "subject": "...", "bodyHtml": "..." }` and parse it. **Recommendation: JSON output** — cleaner for an email where subject is mandatory and body is HTML. Add a tolerant parser with a fallback (first line = subject, remainder = body) so a malformed response still yields a usable email.

Variables exposed (same substitution style as `generateSyndicationArticles`):
- `{{title}}` — article SEO title
- `{{excerpt}}` — article excerpt/summary
- `{{primary_keyword}}`
- `{{article_body}}` — plain-text body (via existing `stripHtmlTags`)
- `{{article_url}}` — **NEW**: canonical published URL. Confirm where this lives (`SitePage` slug + site base URL, or `WordPressConnection`/published permalink). Needed so the email links back to the article. If no reliable public URL exists at publish time, this is an open item (see §10).

### 5.3 Editing UI — already exists

`/admin/prompts/32` works automatically via the existing `apps/web/src/app/admin/prompts/[stepNumber]/PromptEditor.tsx`. No new prompt-editing UI required. Verify the prompts list page (`/admin/prompts`) renders step 32 (it iterates active templates, so it should).

---

## 6. API / backend (`apps/api`)

### 6.1 GHL client additions — `apps/api/src/lib/ghl/client.ts`

Add (exact bodies pending Phase 0):

```ts
export async function listGhlTags(apiKey: string, locationId: string): Promise<GhlTag[]>
// GET /locations/{locationId}/tags

export interface CreateGhlEmailCampaignInput {
  apiKey: string; locationId: string;
  name: string; subject: string; bodyHtml: string;
  tagId: string;                       // audience (Phase 0: confirm)
  fromName?: string; fromEmail?: string;
}
export async function createGhlEmailCampaign(input): Promise<{ campaignId: string }>
// POST /emails/... (V2 create)

export async function scheduleGhlEmailCampaign(
  apiKey: string, locationId: string, campaignId: string, sendAt: string /* ISO */,
): Promise<void>
// POST /emails/.../schedule (V2)
```

Reuse the existing private `ghlRequest` helper (auth header, version header, error parsing). Add `GhlTag` to `apps/api/src/lib/ghl/types.ts` (and mirror in `apps/web/src/lib/ghl/types.ts`).

### 6.2 Settings helper — `apps/api/src/lib/ghl/settings.ts`

Extend `getGhlCredentials` (or add `getPromoEmailConfig(userId)`) to return the new promo fields alongside the decrypted key + locationId. Keep returning `null` when not configured/enabled so callers can cheaply gate.

### 6.3 Routes — `apps/api/src/routes/ghl.ts`

- **`GET /ghl/tags`** — new. Auth → load `GhlSettings` → decrypt key → `listGhlTags(apiKey, locationId)` → return `{ tags }`. Mirror the error handling / `lastError` writeback pattern of `GET /ghl/accounts`. Returns `400` with a helpful message if key/location missing or scope error.
- **Extend `PUT /ghl/settings`** — accept and persist `promoEmailEnabled`, `promoEmailTagId`, `promoEmailTagName`, `promoEmailSendTime`, `promoEmailTimezone`, (`promoEmailFromName/Email`). Validate `promoEmailSendTime` matches `^\d{2}:\d{2}$` and timezone is a valid IANA zone. Return the new fields in the response.
- **Extend `GET /ghl/settings`** — include the new fields so the panel can hydrate.

### 6.4 Generator — `apps/api/src/article-pipeline/promo-email/generate.ts` (new)

Close clone of `syndication/generate.ts`:
- Load `SitePage` (title/seoTitle/excerpt/bodyHtml/primaryKeyword + URL source).
- Load `PromptTemplate` stepNumber 32; skip (warn) if missing/inactive.
- Resolve variables; call `getLLMAdapter(template.defaultProvider).call({...})`.
- Parse `{ subject, bodyHtml }` (JSON-first, fallback parser).
- Upsert `ArticleEmailCampaign` (`status: 'generated'`, token/cost/provider/model).
- Return the parsed result for the handler to send.

### 6.5 Enqueue — `apps/api/src/article-pipeline/promo-email/enqueue.ts` (new)

Clone `syndication/enqueue.ts`:
- Idempotent: skip if row already `scheduled`/`sent`, or in-flight (`pending`/`generated` recently).
- Upsert a `pending` placeholder row.
- `boss.send(QUEUES.PROMO_EMAIL_GENERATE, { jobId, userId }, { singletonKey: 'promo-email-${jobId}', expireInSeconds: 1800, retryLimit: 2, retryDelay: 60 })`.

### 6.6 Queue + worker registration

- `apps/api/src/queues/index.ts`: add `PROMO_EMAIL_GENERATE: 'promo-email-generate'` and `PROMO_EMAIL_SAFETY: 'promo-email-safety'` to `QUEUES`.
- `apps/api/src/handlers/promo-email-generate.ts` (new): clone `syndication-generate.ts` — mark pending→processing, call generator, then **create + schedule the GHL campaign**, update row to `scheduled`; on error mark `failed`, `sendFailureAlert`, rethrow.
- `apps/api/src/handlers/promo-email-safety.ts` (new): clone `syndication-safety.ts` — re-enqueue rows stuck in `pending`/`generated` past a threshold; surface persistent failures.
- `apps/api/src/worker.ts`: register `boss.work(QUEUES.PROMO_EMAIL_GENERATE, { batchSize: 2 }, withSentry(...))` and `boss.schedule(QUEUES.PROMO_EMAIL_SAFETY, '*/10 * * * *', {})` + its worker, alongside the syndication block.

### 6.7 Publish hook — `apps/api/src/routes/articles.ts` (~L476)

Inside the existing `if (job.sitePage?.id)` block, next to `enqueueSyndication`:

```ts
const ghl = await prisma.ghlSettings.findUnique({ where: { userId: user.id } })
if (ghl?.promoEmailEnabled && ghl.promoEmailTagId) {
  enqueuePromoEmail(jobId, user.id).catch((err) =>
    logger.error({ jobId, err }, '[publish] failed to enqueue promo email'),
  )
}
```

The publish-date for scheduling is the same `publishingDate` already computed there (`job.topic.publishingDate ?? job.topic.scheduledDate ?? new Date()`). Pass it through the job payload (or re-derive in the handler) so the handler can compute `scheduledFor`.

### 6.8 Schedule-time computation

In the handler, compute the absolute send instant:
- Combine `publishingDate` (date part) + `promoEmailSendTime` (HH:mm) interpreted in `promoEmailTimezone` → UTC ISO. Use a tz-aware approach (the codebase already deals with `socialTimezone`; reuse whatever utility social automation uses — check `apps/api/src/social/automation/schedule.ts`).
- **Past-time rule (decision needed, see §10):** if the computed instant is already in the past at publish time, default to **send immediately** (schedule for `now + small buffer`, or call a send-now variant if the API distinguishes).

### 6.9 Status read API

Add `GET /api/articles/:jobId/promo-email` returning the `ArticleEmailCampaign` row (subject, status, scheduledFor, ghlCampaignId, errorMessage) for the workflow UI. Web proxy route under `apps/web/src/app/api/articles/[jobId]/promo-email/route.ts` via `proxyToApi`.

---

## 7. Frontend (`apps/web`)

### 7.1 Settings panel — `apps/web/src/components/GhlSettingsPanel.tsx`

Add a "Promotional Email" section:
- **Enable toggle** (`promoEmailEnabled`).
- **Tag dropdown** — fetch from new `GET /api/ghl/tags`; show tag name, store id+name. Include a refresh button (mirrors the "load accounts" pattern already in the panel). Handle the "save key first" / scope-error states like the accounts loader.
- **Send time** picker (HH:mm) + **timezone** select.
- (If Phase 0 requires) **From name / from email** inputs.
- Persist via the extended `PUT /api/ghl/settings`. Hydrate from extended `GET /api/ghl/settings`.

### 7.2 Web proxy + types

- `GET /api/ghl/tags` proxy route → `apps/web/src/app/api/ghl/tags/route.ts` (use `proxyToApi` / the `createProxyHandlers` helper).
- Add `GhlTag` type to `apps/web/src/lib/ghl/types.ts`.

### 7.3 Workflow detail status panel

- New read-only component (e.g. `PromoEmailPanel.tsx`) in `apps/web/src/features/workflow/`, rendered on the published workflow page next to `SyndicationPanels`. Shows: status badge, subject, scheduled time, GHL campaign id/link, and error message if failed. Fetch via `GET /api/articles/[jobId]/promo-email` (wire into `useWorkflowJob.ts` like syndication, or a small dedicated hook).
- Since the flow is fully automatic, this panel is informational only — no send/edit buttons in v1. (A "regenerate" button could be a fast-follow.)

---

## 8. Tests

Follow existing patterns (`apps/api/src/routes/__tests__/ghl.routes.test.ts`, `apps/api/src/handlers/__tests__/*`, vitest):

- **GHL client** — `listGhlTags`, `createGhlEmailCampaign`, `scheduleGhlEmailCampaign`: mock `fetch`, assert path/method/headers/body and response parsing + error throwing.
- **Generator** — given a fake SitePage + step-32 template, asserts variable substitution, JSON/ fallback parsing, and `ArticleEmailCampaign` upsert. Mock the LLM adapter.
- **Schedule-time computation** — unit test tz + HH:mm → correct UTC instant; past-time → send-now branch.
- **Routes** — `GET /ghl/tags` (success, missing-key 400), `PUT /ghl/settings` validation of send time / timezone.
- **Enqueue idempotency** — skips when already scheduled/sent/in-flight.
- **Publish hook** — enqueues only when `promoEmailEnabled && promoEmailTagId`.

---

## 9. Rollout / ops

- Default `promoEmailEnabled = false` → zero behaviour change until the user opts in. Safe to ship dark.
- **Deploy order:** migrate DB → deploy api+worker (new queue/handlers) → deploy web (settings UI). Worker must be running for jobs to drain.
- **In-flight check** before any container-recreating deploy (see [[staging-deploy-inflight-check.md]] / memory): confirm no promo-email/syndication jobs mid-flight; recreates kill running jobs. Safety cron will recover stuck rows.
- Seed step-32 prompt as part of release (`pnpm --filter @socioply/db seed` or the reseed script) so the template exists before the first publish with the feature on.
- Cost: one extra short LLM call per published article (~2k tokens). Tracked on `ArticleEmailCampaign` token/cost fields and via existing `LLMUsage` if the adapter records there.

---

## 9b. Implementation status (2026-06-15)

**Built on branch `feat/article-promo-email-ghl`.** All phases implemented; typecheck + lint clean; 396 tests pass (13 new). DB migrate:deploy + prompt seed + `promoEmailEnabled` opt-in remain for rollout.

Phase 0 findings (recorded):
- **Tags** — confirmed via official OpenAPI repo: `GET /locations/{locationId}/tags` → `{ tags: [{ id, name, locationId }] }`. Implemented as `listGhlTags`.
- **Email campaign V2** — the create/schedule endpoints are documented on the marketplace but are NOT in the public OpenAPI repo and the doc pages are JS-rendered. Client methods (`createGhlEmailCampaign` / `scheduleGhlEmailCampaign`) are built against the documented V2 paths (`POST /emails/public/v2/locations/{locationId}/campaigns[/{id}/schedule]`) with resilient id extraction, isolated in `apps/api/src/lib/ghl/client.ts`. **Exact field names (`html`/`tagIds`/`scheduleTimestamp`, sender identity) still need confirming against a live call before enabling in prod.**
- **Pre-existing bug discovered:** `slotToUtc` in `social/automation/schedule.ts` diverges (returned 2026-06-17 for 9am ET on 2026-06-20) — its iterative day/month terms overshoot once the guess crosses midnight. Out of scope to fix; promo-email scheduling uses a correct inline offset-method conversion (`computeSendAt`) instead. **Worth a separate ticket** — social automation send-times may be affected.

## 10. Open items to resolve

1. **[Phase 0 — blocking]** Exact GHL Create/Schedule Email Campaign schema: audience-by-tag support, inline HTML vs template id, sender identity, schedule timestamp format, required scopes. (See §2.)
2. **[Decision]** "Published after the configured send time" rule — recommend **send immediately**. Confirm.
3. **[Data]** Canonical `{{article_url}}` source at publish time — `SitePage` slug + site base URL, WordPress permalink, or other? Needed for the email's link-back. If no reliable URL, decide fallback (omit link, or use a landing page).
4. **[Decision]** GHL prerequisites the user must complete in their account once: verified sending domain / from-address, Private Integration key scopes. Document in settings UI as a checklist.
5. **[Nice-to-have / fast-follow]** Regenerate-email button and/or a one-time preview before first real send, even though v1 is fully automatic.

---

## 11. File-change checklist

**DB**
- [ ] `packages/db/prisma/schema.prisma` — `ArticleEmailCampaign` model + `ArticleJob` relation + `GhlSettings` fields
- [ ] new migration `add_article_email_campaigns`
- [ ] `packages/db/prisma/seed.ts` + `packages/db/scripts/reseed-prompts-v3.ts` — step-32 prompt

**API**
- [ ] `apps/api/src/lib/ghl/client.ts` — `listGhlTags`, `createGhlEmailCampaign`, `scheduleGhlEmailCampaign`
- [ ] `apps/api/src/lib/ghl/types.ts` — `GhlTag`
- [ ] `apps/api/src/lib/ghl/settings.ts` — promo config accessor
- [ ] `apps/api/src/routes/ghl.ts` — `GET /ghl/tags`, extend `GET`/`PUT /ghl/settings`
- [ ] `apps/api/src/article-pipeline/promo-email/generate.ts` (new)
- [ ] `apps/api/src/article-pipeline/promo-email/enqueue.ts` (new)
- [ ] `apps/api/src/handlers/promo-email-generate.ts` (new)
- [ ] `apps/api/src/handlers/promo-email-safety.ts` (new)
- [ ] `apps/api/src/queues/index.ts` — 2 new queue names
- [ ] `apps/api/src/worker.ts` — register worker + safety cron
- [ ] `apps/api/src/routes/articles.ts` — publish hook
- [ ] `apps/api/src/routes/articles.ts` (or routes file) — `GET /api/articles/:jobId/promo-email`
- [ ] tests under `apps/api/src/**/__tests__/`

**Web**
- [ ] `apps/web/src/lib/ghl/types.ts` — `GhlTag`
- [ ] `apps/web/src/app/api/ghl/tags/route.ts` (new proxy)
- [ ] `apps/web/src/app/api/articles/[jobId]/promo-email/route.ts` (new proxy)
- [ ] `apps/web/src/components/GhlSettingsPanel.tsx` — promo-email section
- [ ] `apps/web/src/features/workflow/PromoEmailPanel.tsx` (new) + wire into workflow detail page / `useWorkflowJob.ts`

---

## 12. Phased delivery

- **Phase 0 — GHL API verification** (blocking): confirm §2 unknowns; lock client signatures.
- **Phase 1 — Data + prompt**: schema migration, `ArticleEmailCampaign`, `GhlSettings` fields, step-32 seed. Prompt editable in `/admin/prompts`.
- **Phase 2 — GHL client + tags + settings**: client methods, `GET /ghl/tags`, settings GET/PUT, settings-panel UI (tag picker, time, toggle).
- **Phase 3 — Generation + send pipeline**: generator, enqueue, queue, handlers, worker registration, publish hook, schedule-time computation.
- **Phase 4 — Visibility + tests**: workflow status panel, status API, full test suite.
- **Phase 5 — Rollout**: seed prompt, deploy (migrate → api/worker → web), enable for the user, verify end-to-end on one published article.
