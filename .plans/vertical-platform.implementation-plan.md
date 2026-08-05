# Multi-Vertical Platform + Azavea Pilot — Implementation Plan

**Status: PLAN for review — 2026-08-05 · dual purpose: (1) market Omniply via
azavea.ai + LinkedIn NOW, (2) produce the reusable "launch a vertical"
template for every future industry.**

Locked design decisions (discussion 2026-08-05):
- **Single instance.** One repo, one Vercel project, one API, **shared DB**.
  No per-vertical deployments, no new repos — ever.
- **Vertical = subdomain + data.** Each industry gets `<vertical>.omniply.io`
  (branding: osteos must not feel like "a repurposed chiro platform"); all
  isolation is data-level. Pilot vertical: **`azavea.omniply.io`**.
- **Pipelines are invariant.** Content production structure NEVER changes per
  vertical — only prompt copy adapts (+ per-vertical data: calendars,
  masters, snapshot). This is the scaling law AND the rejection rule: a
  vertical that can't be expressed as data isn't a vertical we launch.
- **Term of art: `vertical`** (Account-level, authoritative, set at
  provisioning). `BrandSettings.industry` keeps its current meaning:
  intra-vertical flavor (chiro vs osteo can share a vertical's prompt set).
- Azavea vertical: signs as **Azavea Inc.**, mentions Omniply as the product;
  audience = chiropractic practice owners; publishes articles to
  **azavea.ai (WordPress)**; LinkedIn via **company page + Veit's personal
  profile**; cadence 2 articles/wk + month-one LinkedIn volume push.

---

## V0 · Vertical dimension in the data model (the only risky step — do first)

**Schema (one migration):**
- `Account.vertical String @default("chiro")` — backfills every existing
  account to `chiro`.
- `PromptTemplate.vertical String @default("default")` — and the unique
  constraints change from `stepNumber @unique` / `key @unique` to
  `@@unique([stepNumber, vertical])` / `@@unique([key, vertical])`.
  All existing rows stay `default` (the default set IS the chiro-tuned set —
  we deliberately do NOT clone rows to a 'chiro' vertical).

**Resolution (one shared helper, used everywhere):**
```
resolvePrompt({ key? , stepNumber?, vertical }):
  exact (key|stepNumber, vertical) row, active
  → else fallback (key|stepNumber, 'default')
```
plus `verticalForUser(userId)` (user → account.vertical, cached per run).

**Zero-behavior-change guarantee:** chiro accounts have `vertical='chiro'`,
which never has override rows → every lookup falls through to `default` →
byte-identical prompts. The migration + resolver deploy BEFORE any override
row exists, so nothing observable changes for clients.

**Call sites to route through the resolver** (the real work of V0 — every
`findUnique({ where: { key } })` / `{ stepNumber }` on PromptTemplate):
- `article-pipeline/step-runner.ts` (stepNumber path)
- `article-pipeline/enrichment/prompt-template.ts` (`loadPromptTemplate`)
- `newsletter/llm.ts` (`runNewsletterPrompt`, `runNewsletterWriterJson`,
  `runNewsletterJsonPrompt` — gain an optional `vertical` in RunOptions)
- de-AI, client-story, plain-language runners (key-based)
- `agent/engine.ts` + `routes/agent.ts` (agent_system/user_frame/greeting/
  summary — the chat agent inherits vertical resolution for free; NOTE for
  the template: agent GUARDRAILS (red-flag lexicon, emergency numbers,
  advertising rails) are health-vertical config and must become per-vertical
  before a non-health vertical ever gets the widget — out of scope here,
  recorded in the template doc)
- `seed.ts` + every targeted seeder + `reseed-prompts-v3.ts` + admin prompt
  routes (upsert keys become `{key_vertical}` / `{stepNumber_vertical}`
  composites)

**Regression gate:** full test suite + one staging article E2E on the dev
clinic BEFORE and AFTER — outputs must be identical (same prompts resolved).

## V1 · Subdomain host map (small)

- Vercel: add `azavea.omniply.io` domain to the existing project (+ DNS
  CNAME). No new project.
- `middleware.ts`: replace the hard-coded APP_HOSTS set with a
  `HOST_VERTICALS` map (`chiro.omniply.io → chiro`,
  `azavea.omniply.io → azavea`, staging hosts) — behavior otherwise
  unchanged; the map is the hook future per-vertical marketing pages read.
- The publishing target (azavea.ai WP) is intentionally independent of the
  app host — a template property every vertical inherits.

## V2 · Admin prompts: vertical inheritance UI

- `/admin/prompts` gains a vertical selector (default | azavea | …).
- Non-default view shows every prompt with state **Inherited** (grey, from
  default) or **Customized** (override row exists), plus:
  - "Customize for this vertical" → clones the default row as an override
  - "Revert to inherited" → deletes the override
- Admin API routes gain the `vertical` param; PUT writes the override row.
- Same treatment reaches `/admin/agents` when C2b builds it (one shared
  pattern).

## V3 · Azavea vertical pilot (the dual-purpose payload)

**3a — Account + brand (session work + user inputs):**
- Comp account on PROD: `vertical='azavea'`, `billingExempt`, owner = Veit.
- BrandSettings: Azavea Inc. voice ("signs as Azavea Inc., Omniply as the
  product solution"), WHO = chiropractic practice owners, industry = "B2B
  practice-growth software", azavea.ai palette/logo, author = Veit.
- WordPress connection → azavea.ai (**user input: WP application password**).

**3b — Seed pack** `packages/db/prisma/verticals/azavea-prompts.ts`:
- Override rows ONLY where the health tilt shows (~12–20 expected): article
  outline + write system framing (B2B essay, practice-economics voice, no
  patient-education framing/disclaimers), syndication LinkedIn + Medium tone,
  social caption set, newsletter section tones. Everything else inherits.
- Authoring rule (permanent): improving Azavea output NEVER touches a
  `default` row.

**3c — Calendar:** admin ArticleCalendar "Azavea — B2B Practice Growth",
~26 topics drafted from the master-pitch themes (patient drift, review
economics, content consistency, AI front desk, retention math, local
search…), **user edits before activation**.

**3d — Pilot gate:** ONE article end-to-end (generate → azavea.ai draft →
LinkedIn/Medium syndication outputs) → joint review → seed-copy iteration →
only then cadence on (2 articles/wk). The pilot answers the remaining open
question: whether prompt copy alone yields good B2B essays through the
unchanged chain. (Design constraint says it must; the pilot verifies.)

**3e — LinkedIn month-one volume:** social pipeline on for the Azavea
account (captions/posts) + article syndication outputs; assembled as a
**drafts backlog** for the user to post/schedule (manual first; GHL Social
Planner connection = later decision, needs the Azavea GHL location). Target:
enough queued pieces for 4–5 posts/wk for the first month.

**3f — Newsletter (second wave, after articles flow):** B2B prospect
newsletter via the same pipeline; sending via the Azavea/selling GHL
location. Deliberately after 3d — articles + LinkedIn are the outreach
prerequisite, the newsletter is not.

**3g — Quiz:** already exists — the Practice X-Ray IS the Azavea vertical's
lead-gen quiz (live on omniply.io). No build; the template records how a
vertical quiz slots in (Spine Check pattern).

## V4 · The template (deliverable, not documentation afterthought)

`.documentation/vertical-launch-template.md`, written WHILE doing V3 by
recording every step + friction point. Checklist skeleton:
1. Subdomain: DNS + Vercel domain + HOST_VERTICALS entry
2. `Account.vertical` value + provisioning path (checkout → vertical)
3. Prompt seed pack (authoring guide + which rows typically need overrides)
4. Calendar (topics × seasonality)
5. Lead-gen masters (guides) + interactive quiz instance
6. Newsletter section mix
7. GHL: agency snapshot for the vertical + Stripe product
8. Marketing page (sales letter) + funnel (X-Ray-pattern quiz)
9. Chat agent: per-vertical guardrails/compliance review (REQUIRED for any
   non-health vertical; health verticals inherit the current rails)
10. Pilot-article gate before cadence

## Sequencing & estimates (calibrated: my sessions + user decisions + external waits)

Two tracks in parallel; chat C2b/C3 (Track A) continues unblocked — different
subsystems except the small shared admin-UI pattern.

| Step | Work | Est. (mine) | Gates / waits |
|---|---|---|---|
| V0 | schema + resolver + call sites + regression E2E | 1 session | staging article E2E before/after |
| V1 | Vercel domain + host map | minutes | DNS propagation; Vercel access |
| V2 | admin inheritance UI | ~½ session | — |
| 3a | account + brand + WP connect | ~½ session | **user: WP app password** |
| 3b | seed pack | ~½ session | **user: copy review** |
| 3c | calendar draft | ~½ session | **user: topic edit** |
| 3d | pilot article | 1 cycle | **user: quality judgment** |
| 3e | LinkedIn backlog | ~½ session | user posts/schedules |
| 3f | newsletter | later wave | after 3d |
| V4 | template doc | alongside V3 | — |

Realistic wall-clock to "first article live on azavea.ai + LinkedIn backlog
in the user's hands": **2–4 days**, dominated by review cycles and
DNS/WP plumbing, not implementation.

## User inputs needed (collected once)

1. WordPress application password for azavea.ai (+ confirm REST API
   reachable).
2. Vercel access for adding the `azavea.omniply.io` domain (or user adds it).
3. Azavea GHL location for the (later) Social Planner + newsletter sending —
   the selling location, or a dedicated one?
4. Review points as they arrive: seed-pack copy → calendar topics → pilot
   article verdict.

## Explicit non-goals (this plan)

- No pipeline/structural changes per vertical (design law).
- No per-vertical chat-agent guardrails yet (recorded in template as a
  non-health-vertical prerequisite).
- No new repos, projects, or deployments.
- No osteo (or any second) vertical yet — but V0+V2+V4 make it a data-only
  exercise when it comes.
