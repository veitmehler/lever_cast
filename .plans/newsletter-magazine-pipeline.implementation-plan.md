# Magazine-Style Newsletter Pipeline — Implementation Plan

**Status: COMPLETE** (audited 2026-07-09) — phases 1a–1d shipped; PR #75 merged 2026-06-16. Shared research + per-client voiced generation + render + review flow all live.
**Author:** planning session 2026-06-16
**Reference workflow:** [[newsletter-creation-workflow.md]] (a *different* app's chiropractic newsletter system — we port its **creation workflow**, not its code/domain models)
**Builds on:** the shipped promo-email GHL client (`createGhlEmailCampaign`/`scheduleGhlEmailCampaign`/tags), the article pipeline, `PromptTemplate`, `image-generation.ts`, pg-boss queues.

---

## 1. Goal & confirmed decisions

A productized, **magazine-style newsletter**: admin-managed content calendars (per industry + specialization) drive AI-generated, per-customer newsletters that the end-user reviews/approves on our platform, after which we render an email and schedule it as a GHL campaign.

| Topic | Decision |
|---|---|
| Content source | **Admin-uploaded CSV calendars**, scoped per **industry + specialization**. No AI calendar generation. |
| Customer → calendar | **Explicit admin assignment** (not auto-match), surfacing best matches by industry+specialization. |
| Content blocks | Domain-neutral **core** (feature article, 3 teasers, tips, facts, trivia, joke, video, subject, preview) + **industry modules** driven purely by *populated CSV columns* (recipe, kids snack, tech-free activity) + a **secondary full-length article** (specialization). |
| Feature & secondary article | **Lightweight inline article chain** (outline→intro→FAQ→faq-facts→facts→write→image), Gemini Google-Search-grounded research + Fal image. |
| Teasers + video research | **Oxylabs SERP + residential-proxy** validate/scrape (account confirmed to include SERP scraping). |
| Video | Optional `video_url` CSV column → use directly (title/thumbnail via **YouTube oEmbed through the residential proxy**); else Oxylabs YouTube search. |
| Two-layer model | **Shared per (calendar topic/date)** = video + recipe + curated teaser source URLs/extracts; **per-customer** = all voiced content. |
| Send flow | **Review on our app** → per-section regenerate/edit → approve (per edition + "approve all") → **auto-schedule GHL campaign**. One batch review session/month; email user when a month is ready. |
| Email rendering | **We render the magazine HTML** (email-safe), customizable by the end-user (header bg, font-family, font-color, font-weights, footer bg). |
| Prompts | **All** newsletter prompts are DB-backed (`PromptTemplate`, new string `key`, `nl_*`), edited in the **admin Newsletter** section (even subject/preview, which the reference hard-coded). |
| Navigation | New **"Newsletter"** sidebar link in **both** the end-user (`Sidebar.tsx`) and admin (`AdminSidebar.tsx`) sections. |
| Trigger | **Manual admin "generate"** for now; the **monthly billing-driven** trigger is deferred until the payment system exists (same generate fn, called by a webhook later). |

---

## 2. Architecture overview

```
ADMIN                                   PER-CUSTOMER GENERATION (pg-boss)
─────                                   ────────────────────────────────
NewsletterCalendar (industry+spec)      enqueueNewsletterGeneration(userId, calendarId, [from,to])
  └─ CSV upload → NewsletterTopic rows     │
        (date, topic, bullets,             ├─ per topic in range, skip if Newsletter(userId,topicId) exists
         secondary_topic, recipe,          ├─ 1) SHARED research on the topic (idempotent, reused across customers):
         kids_snack, tech_free,            │       • video: video_url→oEmbed | else Oxylabs YouTube search
         video_url)                        │       • recipe (if column): research→write→image
assign calendar → customer (explicit)      │       • teaser SOURCES (×3 bullets): Oxylabs SERP→filter→proxy-validate(200)→select→scrape→extract
                                           └─ 2) PER-CUSTOMER voiced content → Newsletter row:
ENDUSER                                            feature article (inline chain) · secondary article (if topic) ·
───────                                            3 teaser summaries (voiced) · tips · facts · trivia · joke ·
review queue (month) ── ready_for_review            recipe/kids_snack/tech_free copy (if modules) · subject · preview
  ├─ preview (rendered email)            → render magazine HTML → status = ready_for_review → notify user (transactional email)
  ├─ 🔄 regenerate section / edit
  └─ approve (per / all) ───────────────→ createGhlEmailCampaign(html) + scheduleGhlEmailCampaign(date, newsletter tag) → scheduled
template settings (colors/fonts)
```

Mirrors the promo-email/syndication pattern: enqueue → worker handler → safety sweep; everything prompt-template-driven; cost tracked via `LLMUsage`.

---

## 3. Data model (`packages/db/prisma/schema.prisma`)

### New models
```prisma
model NewsletterCalendar {
  id             String            @id @default(cuid())
  name           String
  industry       String                                  // matches BrandSettings.industry
  specialization String?                                 // e.g. "family care", "sports"
  topics         NewsletterTopic[]
  assignments    User[]            @relation("UserNewsletterCalendar")
  createdAt      DateTime          @default(now())
  updatedAt      DateTime          @updatedAt
  @@map("newsletter_calendars")
}

model NewsletterTopic {
  id            String   @id @default(cuid())
  calendarId    String
  calendar      NewsletterCalendar @relation(fields: [calendarId], references: [id], onDelete: Cascade)
  date          DateTime
  topic         String              // feature article
  bullet1       String
  bullet2       String
  bullet3       String
  secondaryTopic     String?        // → second full article
  recipe             String?        // module hints (populated column ⇒ generate)
  kidsSnack          String?
  techFreeActivity   String?
  videoUrl           String?        // explicit video override
  // shared research write-back (computed once, reused across customers in this calendar)
  research      Json?               // { video:{url,title,thumbnailUrl,s3Url,manual}, recipe:{...}, teaserSources:[{bullet,url,extract}] }
  researchStatus String  @default("pending") // pending|complete|partial|failed
  newsletters   Newsletter[]
  @@unique([calendarId, date])
  @@index([calendarId])
  @@map("newsletter_topics")
}

model Newsletter {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  topicId       String
  topic         NewsletterTopic @relation(fields: [topicId], references: [id], onDelete: Cascade)
  status        String   @default("pending") // pending|researching|generating|ready_for_review|approved|scheduled|sent|failed
  // voiced content — JSON per section so a single-section regenerate writes one column
  featureArticle   Json?   // {title,teaser,tldr,body,imageUrl}
  secondaryArticle Json?
  teasers          Json?   // [{title,body,cta,link} ×3]
  quickHits        Json?   // {tips:[..4], facts:[..4]}
  fun              Json?   // {triviaQuestion,triviaAnswer,joke}
  modules          Json?   // {recipe?,kidsSnack?,techFreeActivity?}
  subjectLine      String?
  previewText      String?
  renderedHtml     String? @db.Text
  validation       Json?   // completion score + issues
  // delivery
  ghlCampaignId String?
  scheduledFor  DateTime?
  sentAt        DateTime?
  approvedAt    DateTime?
  // cost
  cost          Float    @default(0)
  inputTokens   Int      @default(0)
  outputTokens  Int      @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  @@unique([userId, topicId])
  @@index([userId, status])
  @@map("newsletters")
}
```

### Extend existing
- **`BrandSettings`** — reuse `industry` + `who` (target audience). Add:
  - `specialization String?` (drives calendar matching + voice).
  - Newsletter email template: `nlHeaderBgColor`, `nlFooterBgColor`, `nlFontFamily`, `nlFontColor`, `nlHeadingFontWeight`, `nlBodyFontWeight`, `nlLinkColor` (all `String?`, with sensible renderer defaults). Consistent with the existing `articleFont*` / `diagram*` precedent.
- **`User`** — back-relation `newsletterCalendar NewsletterCalendar? @relation("UserNewsletterCalendar", ...)` (the explicitly-assigned calendar) + `newsletters Newsletter[]`.
- **`PromptTemplate`** — add `key String? @unique` (nullable; existing rows stay `stepNumber`-keyed). Newsletter prompts are looked up by `key`.

Migration: one new migration adding the three tables + BrandSettings columns + `PromptTemplate.key` + the relation join. (Prod auto-seeds prompts on deploy; see §5.)

---

## 4. CSV ingestion

**Columns** (one row = one dated edition): `date` (ISO), `topic`, `bullet1`, `bullet2`, `bullet3` (required); `secondary_topic`, `recipe`, `kids_snack`, `tech_free_activity`, `video_url` (optional). Module/secondary generation is driven purely by column presence — no `dayType` logic.

- Admin uploads a CSV against a chosen calendar → parse (stream, validate headers + per-row required fields + date format + dedupe by date) → upsert `NewsletterTopic` rows (`@@unique(calendarId,date)`). Re-upload is idempotent (upsert), with a dry-run/preview + row-error report before commit.
- Parsing in the API (`apps/api/src/newsletter/csv.ts`); a small, dependency-light CSV parser (or `csv-parse` if already vendored).

---

## 5. Prompts & models

- Newsletter prompts live in `PromptTemplate` keyed by `nl_*` strings; provider/model per row (reuse `defaultProvider`/`defaultModel`). Mapping mirrors the reference (gemini for grounded research, anthropic for writers, fal for images). **All** prompts are DB-backed — including subject/preview (the reference hard-coded these).
- **Article chain (used for BOTH feature & secondary article):** `nl_article_outline`, `nl_article_intro`, `nl_article_faq`, `nl_article_faq_facts`, `nl_article_facts`, `nl_article_writer_system`, `nl_article_writer_user`, `nl_article_image_prompt`.
- **Teasers:** `nl_teaser_url_selector`, `nl_teaser_summarizer_system`, `nl_teaser_summarizer_user`.
- **Quick-hits/fun:** `nl_tips_system|user`, `nl_facts_system|user`, `nl_trivia_system|user`, `nl_joke_system|user`.
- **Video / email:** `nl_youtube_query`, `nl_subject_line`, `nl_preview_text`.
- **Chiropractor modules:** `nl_recipe_researcher`, `nl_recipe_writer_system|user`, `nl_recipe_image_prompt`, `nl_kids_snack_researcher`, `nl_kids_snack_writer_system|user`, `nl_kids_snack_image_prompt`, `nl_tech_free_researcher`, `nl_tech_free_writer_system|user`.
- Voice variables injected: `{{writingStyle}}` (`Settings.writingStyle`), `{{targetAudience}}` (`BrandSettings.who`), `{{industry}}`, `{{specialization}}`, plus topic/bullets/article context — same `{{var}}` regex substitution the article pipeline uses.
- Seeded in `seed.ts` (prod auto-seeds on deploy) + a targeted `scripts/seed-newsletter-prompts.ts` for staging (which doesn't run the seed step), following the promo-email pattern. Editable at **`/admin/newsletter/prompts`**.

---

## 6. Shared research (per calendar topic — idempotent, reused across customers)

`ensureTopicResearch(topicId)` writes `NewsletterTopic.research`; skips if `researchStatus=complete`.
- **Video:** if `videoUrl` set → YouTube **oEmbed via residential proxy** for title+thumbnail; else **Oxylabs `youtube_search`** (2-phase: AI query → raw topic), 3× backoff; thumbnail → S3. Unfound → `manual` flag (non-blocking).
- **Recipe** (if `recipe` column): `nl_recipe_*` chain (Gemini research + Claude write + Fal image), uniqueness via prior titles.
- **Teaser sources (×3 bullets):** Oxylabs `google_search` (geo) → filter (`.com`, drop socials) → **validate each via residential proxy, require HTTP 200**, collect ≤10 → `nl_teaser_url_selector` picks best → scrape (proxy) → extract `<h1/h2/h3/p/li>` → store `{bullet,url,extract}`.

> New infra: `apps/api/src/newsletter/oxylabs.ts` — SERP (`google_search`/`youtube_search`) + Scraper (`universal`) clients over the residential proxy (today we only use Oxylabs as a citation HEAD-check proxy). **Prereq confirmed:** account includes SERP scraping.

---

## 7. Per-customer voiced content (`apps/api/src/newsletter/generate.ts`)

For an assigned customer × topic, create the `Newsletter` row, then (fault-tolerant per section, `Promise.allSettled`/try-catch — a failed block leaves its JSON null, only a thrown feature article aborts that edition):
- **Feature article** — inline chain over `topic` (Gemini-grounded research → Claude writer → Fal image). → `featureArticle`.
- **Secondary article** (if `secondaryTopic`) — same chain over `secondaryTopic`. → `secondaryArticle`.
- **Teasers ×3** — voice each shared teaser source via `nl_teaser_summarizer_*`. → `teasers`.
- **Tips/Facts/Trivia/Joke** — `nl_*` writers. → `quickHits`, `fun`.
- **Modules** (if present on topic) — voice recipe/kids-snack/tech-free copy. → `modules`.
- **Email metadata** — `nl_subject_line`, `nl_preview_text`. → `subjectLine`, `previewText`.
- **Validate** (port `validateNewsletter`) → `validation` (logged, non-blocking).
- **Render** magazine HTML (§8) → `renderedHtml`; set `status=ready_for_review`.

Queue: `QUEUES.NEWSLETTER_GENERATE` + handler (`apps/api/src/handlers/newsletter-generate.ts`) + a `NEWSLETTER_SAFETY` sweep — same shape as promo-email/syndication. After a full batch completes for a customer-month, send the **"ready for review"** transactional email (reuse the `lib/alerts.ts` channel; confirm it's a real outbound path).

---

## 8. Magazine email renderer (`apps/api/src/newsletter/render.ts`)

A server-side function `renderNewsletterHtml(newsletter, brand)` → a single **email-safe HTML** string (stored as `renderedHtml`, fed to GHL `editorContent`). This is the preview *and* the sent email — net-new and first-class.

**Quality constraints I'll build to:**
- **Table-based layout**, ~600px centered, all critical CSS **inline**; a `<style>` block only for progressive-enhancement (media queries, dark-mode) that degrades gracefully.
- **Outlook/MSO** conditional comments for spacing/buttons; **alt text** on every image; a hidden **preheader** span = `previewText`; `<meta name="color-scheme">` + dark-mode-aware colors.
- Web-safe **font stack** with the user's `nlFontFamily` as primary + robust fallbacks; headings use `nlHeadingFontWeight`, body `nlBodyFontWeight`; body text `nlFontColor`; links `nlLinkColor`.
- **Sections (in order):** preheader → **header** (`organizationLogoUrl` on `nlHeaderBgColor`) → **feature article** (hero image, title, tldr, body, optional read-more) → **secondary article** (if present) → **"Around the web"** (3 teaser cards: title, blurb, CTA link) → **tips** / **facts** lists → **video card** (thumbnail image linking to the YouTube URL with a play-button overlay) → **fun** (trivia Q/A, joke) → **modules** (recipe: intro/ingredients/instructions + image; kids snack; tech-free) → **footer** (`nlFooterBgColor`, org name/address; unsubscribe — rely on GHL's injected unsubscribe, leave a placeholder).
- Pure function (no DB) → unit-testable with snapshot tests; images are absolute https URLs (S3/Fal).

**End-user customization** (the requested controls) lives at **`/newsletter/template`** writing the `BrandSettings.nl*` fields, with a live preview rendered from a sample newsletter.

---

## 9. Review workflow (end-user, on our app)

- **`/newsletter`** — review queue: the month's editions grouped, each with status + completion score; "Approve all ready" action.
- **`/newsletter/[id]`** — one edition: rendered **preview** + a section list; per section **🔄 Regenerate** (re-runs just that generator → rewrites the one JSON column → re-renders) and light **inline edit**; **Approve**.
- **Approve** (per edition or batch) → ensure `renderedHtml` → `createGhlEmailCampaign(editorContent=html)` → `scheduleGhlEmailCampaign(sendAt = edition date @ configured time, tagIds=[newsletter tag])` → `status=scheduled`. Reuses the shipped GHL client + `formatLocalSendAt` (local wall-clock) + the slotToUtc-correct conversion.

API: `GET /api/newsletters?status=ready_for_review`, `GET /api/newsletters/:id`, `POST /api/newsletters/:id/regenerate` `{section}`, `PATCH /api/newsletters/:id` (edits), `POST /api/newsletters/:id/approve`, `POST /api/newsletters/:id/approve-all` — web proxies under `apps/web/src/app/api/newsletters/*`.

---

## 10. Navigation & pages

**Admin** (`AdminSidebar.tsx` → add `{ label: 'Newsletter', href: '/admin/newsletter' }`):
- `/admin/newsletter` — overview.
- `/admin/newsletter/calendars` — list/create calendars (industry+specialization), **CSV upload** (dry-run preview), edit topics.
- `/admin/newsletter/calendars/[id]/assign` (or on the customer page) — **explicit calendar→customer assignment**, surfacing matches by industry+specialization.
- `/admin/newsletter/prompts` — the `nl_*` prompt editor (reuse the `/admin/prompts` editor component; filter to `nl_*`).
- `/admin/newsletter/generate` — **manual generate** trigger (pick calendar + customer + date range) for testing.

**End-user** (`Sidebar.tsx` + `MobileNav.tsx`/`BottomNav.tsx` → add "Newsletter"):
- `/newsletter` (review queue), `/newsletter/[id]` (review one), `/newsletter/template` (email template customization), `/newsletter/history` (scheduled/sent).

---

## 11. Triggers, reliability, cost

- **Trigger now:** manual admin generate (`POST /api/admin/newsletters/generate` → `enqueueNewsletterGeneration`). **Later:** a billing webhook calls the same enqueue for the billed month — no rework.
- **Reliability:** JSON writers retry 3× (port `retryWithBackoff`/`parseLLMJsonResponse`); Gemini/LLM 429 handled by adapters; Oxylabs SERP/scrape 3× backoff + the validate-200 gate; idempotent via `@@unique(userId,topicId)` + `researchStatus`; safety sweep re-enqueues stuck rows.
- **Cost:** every call tracked via `LLMUsage` linked to the newsletter (+ Fal image cost). Shared research charged once per topic.
- **Graceful degradation:** any voiced block can fail to null without aborting the edition (review surfaces gaps); regenerate fixes them.

---

## 12. Open items / risks

1. **Oxylabs SERP+Scraper integration** is the biggest net-new component and the flakiest (scraping). Port the doc's filtering/validation; budget for latency (×3 teasers × multi-step).
2. **Email HTML across clients** — Outlook/Gmail/Apple Mail quirks; mitigate with table layout + inline CSS + snapshot tests + a few real-client test sends via GHL before go-live.
3. **Transactional "ready for review" email** — confirm `lib/alerts.ts` is a usable outbound channel (or add one).
4. **GHL send-time/timezone & unsubscribe** — reuse `formatLocalSendAt`; confirm GHL injects the unsubscribe footer (don't duplicate).
5. **Connection budget** — generation is worker-side (existing pool); the new admin/enduser pages add web DB reads (mind the shared-cluster cap until the DO pool lands — see [[staging-web-db-url]]).
6. **Scale of shared research** — for one customer it's moot; the per-(calendar,topic) research store makes multi-customer cheap later.

---

## 13. Phased delivery

- **Phase 1a — data + calendars + CSV:** schema/migration, `PromptTemplate.key`, CSV ingestion, admin calendars + assignment UI, `nl_*` prompt seeds + admin prompt editor, sidebar links.
- **Phase 1b — research:** Oxylabs SERP/scraper/proxy module, video (oEmbed/search), recipe, teaser sources; `ensureTopicResearch`.
- **Phase 1c — generation:** inline article chain (feature+secondary), voiced blocks, modules, email metadata, validation; queue/worker/safety; manual admin trigger.
- **Phase 1d — render + review + deliver:** magazine renderer + `/newsletter/template` customization; review queue + per-section regenerate + approve; GHL schedule on approve; ready-for-review notification.
- **Deferred:** monthly billing-driven trigger (wire the existing enqueue to the payment webhook).

---

## 14. File-change checklist (high level)

**DB:** `schema.prisma` (3 models + BrandSettings cols + `PromptTemplate.key` + relations) · migration · `seed.ts` + `scripts/seed-newsletter-prompts.ts`.
**API:** `newsletter/csv.ts`, `newsletter/oxylabs.ts`, `newsletter/research.ts`, `newsletter/generate.ts`, `newsletter/render.ts`, `newsletter/enqueue.ts`; `handlers/newsletter-generate.ts` + `newsletter-safety.ts`; `queues/index.ts` (+2 queues); `worker.ts` (register + safety cron); routes `routes/newsletters.ts` + `routes/admin-api/newsletters.ts`.
**Web:** admin pages under `app/admin/newsletter/*` + `AdminSidebar.tsx`; enduser pages under `app/(protected)/newsletter/*` + `Sidebar.tsx`/`MobileNav.tsx`/`BottomNav.tsx`; proxies under `app/api/newsletters/*` + `app/api/admin/newsletters/*`; a `NewsletterTemplateSettings` form component.
**Tests:** CSV parser, renderer snapshots, schedule-time reuse, generate idempotency, route authz.
