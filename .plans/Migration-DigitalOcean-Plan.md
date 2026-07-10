# Migration Plan: Supabase + Vercel → Digital Ocean

> **Status: COMPLETE** (audited 2026-07-09) — all phases shipped, incl. monorepo (Phase 2), pg-boss worker (Phase 7), and endpoint cutover (Phase 8). The platform runs fully on DO droplets + DO managed Postgres; web on Vercel.
>
> **Changes from v3.1 (this revision):**
> - **Article pipeline elevated to primary driver.** Originally framed as "one of many" long-running workloads; the latest product alignment makes the article pipeline the *killer feature* that justifies the migration. Without the droplet (Phase 8), the article pipeline is functionally impossible to ship (single article = 8–25 min wall time vs. Vercel's 300 s ceiling).
> - **Translation queue removed.** Per the Levercast v1 scope of the article pipeline plan, the source plan's Steps 19–24 (translate to 8 languages) are deferred to v2. The `article-translation` queue is dropped from §3.2.
> - **Enrichment queue bumped (`teamSize` 2 → 3) and made mandatory.** Mermaid-based enrichment is now part of every article (vs. optional Napkin in source); cheaper and faster than Napkin (~$0.05 / 30–120 s per article instead of $0.30–$2.40 / 5–15 min).
> - **Two new queues added:** `article-output` (WP/HTML/Bundle export workers) and `generate-social-from-article` (manual-trigger social-from-article handoff).
> - **Cross-reference inserted** at end of §3 pointing at the article pipeline plan.
> - **Phase 8 prerequisite note** added (must ship before article pipeline implementation begins).
>
> **Changes from v3:**
> - **Object storage switched from DO Spaces → AWS S3 + CloudFront** (user decision: long-term durability, mature lifecycle/Glacier ecosystem, more global PoPs). Phases 1, 5, 9, 12 updated accordingly.
> - **Re-sequenced timeline**: Phases 2 (repo restructure), 3 (AES encryption), 4 (Postgres OAuth state) are non-destructive and run **in parallel** with Phase 1 (DO/AWS provisioning). They ship to current Vercel + Supabase and improve production immediately, regardless of when the rest of the migration completes.
>
> **Changes from v2 (kept from v3):**
> - Switched DB from "reuse existing 22-slot cluster" to **dedicated 1 GB DO Postgres cluster** ($15/mo, 22 connections) — recommended after analyzing the article-production-pipeline workload.
> - Added explicit `pg-boss` queue topology with `teamSize` caps (article pipeline does not starve scheduled publishing).
> - Added a phased DB scaling guide tied to user growth.
> - Added Phase 3 (AES-256-GCM encryption upgrade) and Phase 4 (Postgres-backed OAuth state) as standalone phases with concrete code edits, since both are blockers for multi-instance backend.
> - Added per-route inventory of cutover targets (every endpoint that exists today and where it goes).
> - Added rollback playbook for each phase.
> - Added concrete file paths, env diffs, code skeletons, and SQL.
>
> **Both prior open items are now resolved:**
> 1. ~~Storage retention model~~ — confirmed: **images stored until user deletes them**; AWS S3 + CloudFront is the canonical long-term store; no automatic lifecycle expiration on user content (90-day lifecycle still applied to `tmp/*` only).
> 2. ~~Cron / publish isolation~~ — confirmed: **separate `pg-boss` queues per workload** (`publish`, `publish-scheduled`, `analytics-sync`, `article-pipeline`, `article-enrichment`, `article-output`, `generate-social-from-article`).

---

## 0. Goals & Drivers

> **Primary driver (v3.2):** Ship the article production pipeline. This is the killer feature that makes the migration economically and architecturally necessary. Single-article wall time is 8–25 min (Phases A+B+C of the article pipeline plan), which is impossible on Vercel's 300 s (Fluid) function ceiling. Everything else below is secondary cleanup that the move enables.

| Goal | Priority | Driver |
|---|---|---|
| **Run the article pipeline (Phase A: 8–15 min, Phase B: 1–3 min, Phase C: 0.5–2 min)** | ⭐ **Primary** | Vercel cannot run > 300 s functions; pipeline = ~22 LLM calls + Mermaid rendering per article. See `.plans/article-production-pipeline.implementation-plan.md`. |
| Remove Supabase row/storage limits and tier-based pricing | High | Cost & data growth (drafts, posts, analytics JSON, articles, diagrams) |
| Run other long-running workloads (image gen, bulk publishing, threads, analytics sync) | High | Same Vercel ceiling; more workloads converge on the worker once it exists |
| Owned backend with predictable scaling (workers, queues, cron) | High | Avoid Vercel-specific lock-in (`vercel.json` cron, edge constraints, function ms billing) |
| Keep snappy frontend UX | Medium | Vercel CDN/ISR/Image optimizer still valuable |
| Deterministic concurrency control | High | Article pipeline must not exhaust DB pool or starve scheduled publishing |
| Minimize ops surface and monthly cost | Medium | Solo developer; no need for HA Redis or k8s |

---

## 1. Confirmed Decisions

| # | Decision | Choice | Rationale |
|---|---|---|---|
| D1 | Frontend hosting | **Next.js stays on Vercel.** Long-running work moves to a DO worker API. | Keep edge CDN, ISR, Image optimizer. |
| D2 | DB hosting | **Dedicated DO Managed Postgres `db-s-1vcpu-1gb`** ($15/mo, 22 connections), separate from existing cluster. | Article pipeline burstiness + uniqueness-scan would risk noisy-neighbor on shared cluster. Cost is negligible vs LLM spend. Easy to upgrade in-place. |
| D3 | Object storage | **AWS S3 + CloudFront** (canonical, long-term store). Bucket private; CloudFront via Origin Access Control. | User-uploaded and AI-generated images must be retained until the user deletes them. AWS gives mature lifecycle/Glacier tiers, more global PoPs, and decoupling from the DO blast radius. |
| D4 | Job queue | **`pg-boss`** (Postgres-backed). No Redis. | Removes a service. Sufficient until ~50 jobs/sec; we're at ≤1 jobs/sec even at heavy load. |
| D5 | OAuth state store | **Postgres table `oauth_states`** with TTL cleanup. | Replaces in-memory `Map`. Required for multi-instance backend; needed even before scale-out. |
| D6 | Worker runtime | **Node 20 + Fastify**, Dockerized. | Reuses existing TS code (`twitterApi.ts`, `linkedinApi.ts`, etc.). |
| D7 | Reverse proxy + TLS | **Caddy** (auto Let's Encrypt). | Zero-config TLS. |
| D8 | Container registry | **GitHub Container Registry (ghcr.io)**. | Free for our usage, same auth as the repo. |
| D9 | Network security | **Tailscale** on droplet. SSH closed publicly; admin tools accessible only over Tailscale. | Free for solo dev. Eliminates SSH brute-force surface. |
| D10 | Domain strategy | Frontend: `app.socioply.com` (Vercel) · API: `api.socioply.com` (DO) · CDN: `cdn.socioply.com` (CloudFront) | Avoids re-configuring all 6 OAuth providers' redirect URIs more than once. |
| D11 | Cutover style | Dual-write-then-flip with a 30-min read-only maintenance window for final DB delta sync. | Minimizes downtime, allows rollback. |
| D12 | Encryption | **AES-256-GCM** for `ApiKey.encryptedKey`, `SocialConnection.accessToken/refreshToken`. Key in env var, rotated via two-key window. | Current Base64 in `src/lib/encryption.ts` is not encryption. |
| D13 | Concurrency control | **`pg-boss` `teamSize` per queue**: `article-pipeline=5`, `article-translation=3`, `article-enrichment=2`, `publish=10`, `publish-scheduled=10`, `analytics-sync=2`. | Caps DB connection use, isolates workloads, prevents one feature from starving another. |

---

## 2. Workload Model (drives DB sizing & queue caps)

### 2.1 Today's workload (steady state, ~50 active users)

| Operation | Frequency | DB writes | LLM calls | Wall time |
|---|---|---|---|---|
| Create draft | ~5/user/day | 1–4 (1 draft + N posts) | 1–6 (gen + writing-style) | 10–60 s |
| Publish to platforms | ~3/user/day | 1–10 (1 per platform; threads = N) | 0 | 5–30 s |
| Scheduled publish (cron) | every minute | 0–N batched | 0 | 1–60 s |
| Analytics sync | daily | ~50–500 | 0 | 5–60 s |
| OAuth callbacks | rare | 1–2 | 0 | 1–10 s |

**Concurrent active connections**: typically 4–8 against Supabase pooler. Easy.

### 2.2 Future workload (article pipeline live, 100 users, mixed-day distribution) — v3.2

| Operation | Per user/day | DB writes/article | LLM calls/article | Wall time/article | Notes |
|---|---|---|---|---|---|
| Article pipeline Phase A+B (steps 1–13, 15, 17, 18) | 1–5 | 80–120 | ~17 | 8–25 min | Step 14 dropped (no internal categories); steps 16 dormant (no JSON-LD) |
| Article enrichment Phase C (Mermaid) | same as A+B | 5–15 | 3–8 | **0.5–2 min** | ⭐ Mandatory; replaces source plan's optional Napkin enrichment. Much cheaper & faster. |
| Article output Phase D (WP / HTML / Bundle) | 0–3 per article | 1 (OutputAttempt row) | 0 | **5–60 s** | Manual trigger; user picks target(s). WP is slowest (media uploads). |
| Article-to-social handoff Phase E | 0–1 per article | 1 draft + N posts | per existing flow | 10–30 s | Manual trigger; reuses existing `/api/ai/generate` |
| Image generation (Fal/DALL-E, ad-hoc) | 1–3 | 5 | 1–3 | 10–90 s | Unchanged |
| ~~Translation (source plan steps 19–24)~~ | — | — | — | — | ⭐ **Out of scope v1** |

**Bursty concurrency** (when 5 users hit "Run All" at once on 50 topics each): worst case **~250 in-flight articles**.
With `teamSize=5` cap on `article-pipeline`, only 5 run concurrently — the rest queue in `pgboss.job`. Each running article holds **~2 Prisma connections** during SQL bursts (idle most of the time during LLM waits, thanks to PgBouncer transaction-pool mode).

**Enrichment burst sizing:** at `teamSize=3` for `article-enrichment`, even if 50 articles all hit Phase C in the same minute (a 5-user burst with 10 articles each finishing Phase B simultaneously), the queue drains in ~50 / 3 × 1 min = ~17 min worst case — well within UX expectations since enrichment runs in background with status visible in UI.

**Output queue sizing:** users typically trigger one output target at a time per article. At `teamSize=5`, even a burst of 25 simultaneous "Publish to WordPress" clicks finishes inside 5 min (WP target is the slowest at ~60 s including all media uploads).

### 2.3 Why this drives a dedicated DB

A 22-slot pooler is fine for **steady-state** but leaves zero headroom for a burst that coincides with cron tick (`publish-scheduled` every minute) or analytics sync. Dedicated cluster gives:
- No noisy-neighbor risk from any other app on shared cluster.
- Full control over PgBouncer settings.
- In-place upgrade to 2 GB / 50 connections is a single click in the DO console (no re-restore).

Cost delta vs reuse: **+$15/mo**. LLM spend at "Medium" load is **$300–900/day**. Negligible.

---

## 3. Target Architecture

```
                       ┌──────────────────────────────┐
   Browser ─────────►  │ Vercel: Next.js (UI + auth   │
                       │ + thin /api routes proxying  │
                       │ to DO API)                   │
                       └────────────┬─────────────────┘
                                    │ HTTPS, Clerk JWT
                                    ▼
                       ┌──────────────────────────────┐
                       │ DO Droplet (api.socioply.com)│
                       │  Caddy → Fastify "API"       │
                       │  Fastify "Worker" (pg-boss)  │
                       │  + Tailscale (admin/SSH)     │
                       └─────┬────────────────┬───────┘
                             │ pgbouncer:25061│ S3 SigV4
             ┌───────────────▼──────┐  ┌──────▼─────────────────┐
             │ DO Managed Postgres  │  │ AWS S3 (private)       │
             │ db-s-1vcpu-1gb       │  │ socioply-prod          │
             │ (NEW, dedicated)     │  │   ↑ OAC                │
             │ DB: socioply         │  │ AWS CloudFront         │
             │ Schema: public,      │  │ cdn.socioply.com       │
             │   pgboss             │  │                        │
             └──────────────────────┘  └────────────────────────┘
```

### 3.1 What runs where (per route)

| Today's Vercel route | After migration | Notes |
|---|---|---|
| `GET /api/drafts`, `GET /api/templates`, `GET /api/settings`, `GET /api/posts/calendar` | **Vercel** (proxied to DO via `@socioply/api-client`) | Light reads; could stay direct if latency matters, but going through DO simplifies the connection budget |
| `POST /api/ai/generate`, `/api/ai/analyze-writing-style` | **DO API** | Long inputs (4 providers × 500+ words) |
| `POST /api/images/generate`, `/api/images/generate-prompt`, `/api/images/upload` | **DO API** | Fal/DALL-E/Replicate take 30–90 s |
| `POST /api/posts/publish` | **DO API → `boss.send('publish', …)`** | Returns `{jobId}` immediately; UI polls or subscribes via SSE |
| `GET /api/posts/publish-scheduled` (Vercel Cron) | **`pg-boss` per-post delayed job** | Per-second precision; no minute-cron drift |
| `GET /api/posts/sync-analytics` (Vercel Cron) | **`pg-boss` repeatable job** in worker | Drop entry from `vercel.json` |
| `GET /api/social/[platform]` (start OAuth) | **DO API** | OAuth state moved to Postgres; multi-instance safe |
| `GET /api/social/[platform]/callback` | **DO API** | Some callbacks (LinkedIn, Meta) >10 s |
| `GET /api/social/[platform]/pages`, `/settings`, `/instagram/refresh-username` | **DO API** | Co-locate with token store |
| `GET /api/social/connections` | **Vercel** (DB read via DO API) | Light read |
| `GET/POST/DELETE /api/api-keys/*` | **DO API** | After encryption upgrade, encryption key only lives on DO |
| **(NEW)** `POST /api/topics`, `POST /api/topics/csv` | **DO API → pg-boss `article-pipeline`** (article modes only; `social_only` skips queue) | See `.plans/article-production-pipeline.implementation-plan.md` §15.1 |
| **(NEW)** `POST /api/articles/:jobId/approve`, `/resume`, `/rerun`, `/rerun-step`, `/reenrich` | **DO API → pg-boss `article-pipeline` & `article-enrichment`** | Phase B/C control |
| **(NEW)** `POST /api/articles/:jobId/output/{wordpress,html,bundle}` | **DO API → pg-boss `article-output`** | One worker handles all three target types |
| **(NEW)** `POST /api/articles/:jobId/generate-social` | **DO API → pg-boss `generate-social-from-article`** | Manual trigger; reuses existing AI generation prompts |
| **(NEW)** `GET /api/articles`, `GET /api/articles/:jobId`, `GET /api/articles/:jobId/events` (SSE) | **DO API** | Job inspection + live status stream |
| **(NEW)** `GET/POST/PATCH/DELETE /api/wp/connections/*` | **DO API** | WordPress credential CRUD; `appPassword` encrypted with the same AES-256-GCM key as `ApiKey` |

### 3.2 `pg-boss` queue topology (final, v3.2)

| Queue | `teamSize` | `teamConcurrency` | Owner | Notes |
|---|---|---|---|---|
| `publish` | 10 | 1 | worker | Manual user publish; very short jobs |
| `publish-scheduled` | 10 | 1 | worker | Per-post delayed job; replaces Vercel Cron |
| `analytics-sync` | 2 | 1 | worker | Repeatable daily; can run parallel platforms |
| `article-pipeline` | **5** | 1 | worker | Phase A + Phase B (steps 1–18) of article generation |
| `article-enrichment` | **3** (was 2) | 1 | worker | ⭐ **Mandatory** Mermaid enrichment; bumped because every article now goes through this. Wall time 30 s – 2 min (vs. Napkin's 5–15 min) so 3 concurrent is safe. |
| **`article-output`** | **5** | 1 | worker | ⭐ NEW — handles WordPress publish, HTML export, and Bundle export. One worker per target type via discriminator in job payload. |
| **`generate-social-from-article`** | **5** | 1 | worker | ⭐ NEW — manual-trigger handoff that reuses the existing AI generation path. Short jobs (10–30 s). |
| `image-generate` | 5 | 1 | worker | Used by Article pipeline Step 15 + ad-hoc image generation + on-demand diagram-PNG re-rasterization for social posts |
| `oauth-state-cleanup` | 1 | 1 | worker | Hourly TTL purge |
| `db-backup` | 1 | 1 | worker | Weekly `pg_dump → S3` (`socioply-backups` bucket, Glacier after 30 d) |
| ~~`article-translation`~~ | — | — | — | ⭐ **REMOVED** — translation deferred to v2 (see article pipeline plan §13). |

**Total worker concurrency budget:** 10+10+2+5+3+5+5+5+1+1 = **47 in-flight jobs maximum**. Each holds 1–2 Prisma connections during DB bursts; idle most of the time during LLM waits. PgBouncer transaction-pool mode multiplexes effectively, so the dedicated 22-connection cluster handles this comfortably for ≤100 concurrent active users.

**Trigger dependencies:**
- `article-pipeline` completion → emits `article.approved` event → caller (UI button) explicitly `boss.send`s `article-enrichment`.
- `article-enrichment` completion → flips `ArticleJob.status='enriched'` → UI unlocks output buttons.
- `article-output` and `generate-social-from-article` are **always manual** — never auto-triggered after enrichment. The user explicitly clicks each.

**Total in-flight worker jobs (worst case)**: 47 (was 39 in v3.1; +5 for `article-output`, +5 for `generate-social-from-article`, -3 for removed `article-translation`, +1 from bumping `article-enrichment` 2→3). Each Prisma `connection_limit=2` → **at most 94 logical client connections, multiplexed by PgBouncer transaction-pool mode onto ≤16 physical Postgres backends.** Within budget (see §4).

---

### 3.3 Cross-reference: Article Production Pipeline

The full specification of the article-generation feature — including database models, prompt templates, pipeline orchestration, enrichment via Mermaid, output targets, and WordPress integration — lives in:

> **`.plans/article-production-pipeline.implementation-plan.md`** (Levercast v1, ~1900 lines)

This migration plan provisions the **infrastructure** (DO droplet, Postgres cluster, S3 bucket, queue topology) on which that pipeline runs. The two documents are tightly coupled:

| Migration plan responsibility | Article pipeline plan responsibility |
|---|---|
| DO droplet + Fastify worker (Phase 8) | Pipeline executor + step runner code that runs *on* the worker |
| Postgres `socioply` DB + `pgboss` schema | `Topic`, `ArticleJob`, `PipelineStep`, `SitePage`, `ArticleDiagram`, `WordPressConnection` table definitions |
| S3 bucket `socioply-images-prod` + CloudFront `cdn.socioply.com` | Image upload paths (`/diagrams/{jobId}/...`, `/exports/{userId}/{jobId}/...`) |
| `pg-boss` queue topology (§3.2) | Which queue each pipeline phase enqueues onto |
| AES-256-GCM encryption (Phase 3 — already shipped) | `WordPressConnection.appPassword` and `ApiKey.encryptedKey` encryption |

**Implementation order:** Phases 1–8 of this migration plan must complete before article pipeline implementation begins. Specifically:
- Phases 1–6 (DB cutover, repo restructure, encryption, OAuth state, S3 storage) — ✅ already shipped
- Phase 7 — pending (Vercel cron → pg-boss migration)
- **Phase 8 — pending and blocking** for article pipeline (DO droplet + Fastify worker + queue registration)

After Phase 8 ships, the article pipeline is implementable end-to-end per its own checklist (`.plans/article-production-pipeline.implementation-plan.md` §16).

---

## 4. Connection Budget — Dedicated 1 GB Cluster (22 slots)

PgBouncer endpoint at `:25061` runs `pool_mode=transaction`. We size the **physical** budget; PgBouncer multiplexes thousands of logical clients onto these 22 slots.

| Consumer | Physical connections | Notes |
|---|---|---|
| DO Worker (Fastify, Prisma `connection_limit=2`) | 6 | One Node process; bursts to 6 during high-frequency SQL |
| pg-boss internal polling + job locks | 4 | Polls `pgboss.job` every 2 s |
| DO API (Fastify, Prisma `connection_limit=2`) | 3 | Smaller because most SQL goes through worker via job results |
| Vercel proxy reads (rare; `connection_limit=1`/region, max 4 regions warm) | 2 | Most reads will go through DO API |
| Migrations / `psql` admin / monitoring | 3 | `prisma migrate deploy` uses `DIRECT_URL` (port 25060), not the pool; reserved here for ad-hoc |
| pg-boss admin UI / metrics | 1 | Read-only |
| Headroom | 3 | For unexpected spikes; below this triggers Sentry alert |
| **Total** | **22** | Fully allocated with 3-slot headroom |

**Critical setup actions:**
1. **PgBouncer endpoint (`:25061`) for app**, **direct port (`:25060`) only for migrations and admin**.
2. **Set Prisma `connection_limit` explicitly** in every connection string. Default is `num_cpus*2+1` which on a 4-core droplet would be 9 per process — would blow the budget.
3. **PgBouncer mode**: keep DO default `transaction`. Verify long-running explicit transactions (e.g. analytics sync) don't span LLM calls.
4. **Set `statement_timeout = '30s'`** at the role level: `ALTER ROLE socioply_app SET statement_timeout = '30s';` — protects against runaway queries pinning a slot.
5. **Monitoring**: hourly `pg-boss` job that runs `SELECT count(*), state FROM pg_stat_activity WHERE datname='socioply' GROUP BY state;` and emits Sentry breadcrumb if `active > 18`.

### 4.1 Phased DB scaling path

| Stage | Trigger | Action | Cost |
|---|---|---|---|
| **Stage 0 (launch)** | Up to ~10 paid users / 50 articles/day | `db-s-1vcpu-1gb` (22 conn) | $15/mo |
| **Stage 1** | `pg_stat_activity.active` sustains >16, or article queue depth >50 | Bump `article-pipeline.teamSize` 5→8, monitor | — |
| **Stage 2** | Stage 1 caps still hit, or 100+ paid users | Resize to `db-s-1vcpu-2gb` (50 conn) — single click, ~5 min downtime | $30/mo |
| **Stage 3** | Read-heavy analytics queries slow down writes | Add **read-only replica** ($15/mo); route analytics reads to replica via second `DATABASE_URL_RO` | $45/mo total |
| **Stage 4** | Sustained write throughput >500 writes/s | Resize to `db-s-2vcpu-4gb` (97 conn) + replica | $90/mo total |
| **Stage 5** | Multi-region or zero-downtime requirement | DO Postgres HA add-on (standby node) | $200+/mo |

We expect Stage 0 to last until roughly **product-market-fit** (100+ active users with the article pipeline enabled).

---

## 5. Phase-by-Phase Plan

> Phases 1–4 are independent and reversible. Phase 5 (storage), 6 (DB), and 8 (endpoint cutover) are the actual cutovers.

### Phase 0 — Pre-work (Day 0, ~1 h)

Before any provisioning:

1. **Confirm DNS provider** for `socioply.com` (Cloudflare? Route 53? DO DNS?) — needed for A/CNAME records in Phase 1.
2. **Confirm GitHub repo path** for the GHCR namespace (e.g. `ghcr.io/<org>/socioply-api`).
3. **Create Tailscale account** (free, GitHub SSO works).
4. **Pick maintenance window** (off-peak; recommend Sunday 03:00–04:00 your TZ for Phase 6).
5. **Decide log sink**: recommend **Better Stack** (free 1 GB/mo, Loki-style search). Set up account and grab ingest token.
6. ~~Confirm storage retention model~~ — resolved: AWS S3 + CloudFront, no expiration on user content.
7. ~~Confirm queue isolation~~ — resolved: separate queues per §3.2.
8. **Create AWS account** (root + IAM admin user). Required for Phase 1 step 2b.

**Deliverable**: a short runbook (private doc) with all credentials/paths pinned.

---

### Phase 1 — DO Infrastructure Provisioning (Day 1, ~2 h)

1. Create a **DO Project** "Socioply Production" (or add to existing).
2. Provision (DigitalOcean):
   - **Droplet**: `s-2vcpu-4gb` Ubuntu 24.04 — $24/mo. Add reserved IP. Same region as DB.
   - **Postgres cluster (NEW, dedicated)**: `db-s-1vcpu-1gb` PostgreSQL 16 — $15/mo. Same region as droplet. Daily backups enabled.
2b. Provision (AWS — can be done in parallel by a separate team member):
   - **S3 bucket** `socioply-prod` in `us-east-1` (or region matching droplet for lower cross-region transfer):
     - Block all public access (CloudFront-only).
     - Default encryption: SSE-S3 (free) or SSE-KMS (free for the AWS-managed key).
     - Versioning: **enabled** (cheap insurance against accidental deletes).
     - Lifecycle rule: `tmp/*` → expire after 90 days (article-pipeline scratch only). User content has **no expiration**.
   - **CloudFront distribution**:
     - Origin: the S3 bucket via **Origin Access Control (OAC)** — bucket stays private; CF gets read access via bucket policy.
     - Viewer protocol policy: redirect HTTP→HTTPS.
     - Default cache behavior: GET/HEAD; cache key includes nothing user-specific; long TTL (we use immutable + content-addressed-ish keys).
     - Compress objects automatically.
     - Price class: **PriceClass_100** (NA + EU only) — cheapest, fine for launch; bump to All later if needed.
   - **ACM certificate** for `cdn.socioply.com` in **`us-east-1`** (CF only accepts certs from that region). DNS validation.
   - Add `cdn.socioply.com` as alternate domain on the CloudFront distribution.
   - **IAM user** `socioply-app` with a programmatic access key, scoped policy:
     ```json
     { "Version": "2012-10-17", "Statement": [
       { "Effect": "Allow",
         "Action": ["s3:PutObject","s3:GetObject","s3:DeleteObject","s3:ListBucket"],
         "Resource": ["arn:aws:s3:::socioply-prod","arn:aws:s3:::socioply-prod/*"] } ] }
     ```
   - Save `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET=socioply-prod`, `S3_REGION=us-east-1`, `CDN_BASE=https://cdn.socioply.com` to 1Password.
3. On the new Postgres cluster, in the DO console:
   - Add a database `socioply`.
   - Add a user `socioply_app` (record password in 1Password / DO secrets vault).
   - Add the droplet's reserved IP to **Trusted Sources** (DB firewall).
   - Note both connection strings: `DATABASE_URL` (port 25061, `?sslmode=require&pgbouncer=true&connection_limit=2`) and `DIRECT_URL` (port 25060, `?sslmode=require`).
4. SQL bootstrap (run from your laptop with DB CA cert):
   ```sql
   ALTER ROLE socioply_app SET statement_timeout = '30s';
   ALTER ROLE socioply_app SET lock_timeout = '5s';
   ALTER ROLE socioply_app SET idle_in_transaction_session_timeout = '15s';
   -- give socioply_app full ownership of the public schema:
   GRANT ALL ON SCHEMA public TO socioply_app;
   ALTER DATABASE socioply OWNER TO socioply_app;
   -- pgboss schema will be auto-created by pg-boss on first start
   ```
5. Configure DNS (whichever provider you confirmed in Phase 0):
   - `api.socioply.com` A → droplet reserved IP
   - `cdn.socioply.com` CNAME → CloudFront distribution domain (e.g. `dxxxxxx.cloudfront.net`)
   - DNS-validation CNAME for the ACM cert (one-time, can be deleted after issuance — but AWS recommends leaving it for renewals)
   - (`app.socioply.com` already on Vercel — unchanged)
6. Bootstrap droplet:
   - Non-root sudo user, SSH-key-only initially.
   - `apt update && apt install -y docker.io docker-compose-v2 fail2ban unattended-upgrades`
   - **Install Tailscale**: `curl -fsSL https://tailscale.com/install.sh | sh && tailscale up --ssh`
   - UFW rules:
     ```
     ufw default deny incoming
     ufw default allow outgoing
     ufw allow in on tailscale0
     ufw allow 80/tcp
     ufw allow 443/tcp
     # Port 22 NOT opened publicly — SSH only via Tailscale
     ufw enable
     ```
   - Verify `tailscale ssh` works from your laptop, then close port 22 publicly: `ufw delete allow 22/tcp` (no-op if you never opened it).
7. Generate the AES encryption key (used in Phase 3):
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```
   Save as `ENCRYPTION_KEY` in 1Password and add to droplet's `.env.production` plus Vercel env (Preview + Production).

**Deliverable**: empty droplet ready, dedicated Postgres ready, S3 + CloudFront ready and serving a 1×1 test image at `https://cdn.socioply.com/healthcheck.png`, DNS pointing correctly, SSH only via Tailscale.

**Rollback**: destroy droplet/cluster/bucket/distribution — no production traffic touches them yet.

---

### Phase 2 — Codebase Restructuring (Day 2–3, ~6 h)

Convert from "Next.js monolith" to **two services in one repo** (pnpm monorepo).

```
/lever_cast
├── /apps
│   ├── /web         ← existing Next.js (frontend + thin proxy /api)
│   └── /api         ← NEW Fastify HTTP + Fastify worker
├── /packages
│   ├── /db          ← Prisma schema + client (shared)
│   ├── /platforms   ← linkedinApi.ts, twitterApi.ts, telegramApi.ts, threadsApi.ts, instagramApi.ts, facebookApi.ts, imageGeneration.ts
│   ├── /storage     ← spaces.ts (S3-compatible)
│   ├── /security    ← encryption.ts (AES-256-GCM), oauth.ts (DB-backed)
│   └── /shared      ← types, logger, errors
└── pnpm-workspace.yaml
```

Concrete tasks (each is a single PR):

#### PR 1: pnpm workspace + shared `packages/db`
- Add `pnpm-workspace.yaml`:
  ```yaml
  packages:
    - "apps/*"
    - "packages/*"
  ```
- Move `prisma/` → `packages/db/prisma/` and `src/lib/prisma.ts` → `packages/db/src/index.ts`. Update `package.json` scripts:
  ```json
  "scripts": {
    "db:generate": "prisma generate --schema packages/db/prisma/schema.prisma",
    "db:migrate": "prisma migrate deploy --schema packages/db/prisma/schema.prisma"
  }
  ```
- All app code: `import { prisma } from '@socioply/db'`.

#### PR 2: Move platform clients → `packages/platforms`
- Move `src/lib/{linkedinApi,twitterApi,telegramApi,threadsApi,instagramApi,facebookApi,imageGeneration,instagramUsername,socialConnections}.ts` to `packages/platforms/src/`.
- Replace `import ... from '@/lib/...'` → `from '@socioply/platforms'` in all callers (mostly `src/app/api/posts/publish/route.ts`, `src/app/api/posts/publish-scheduled/route.ts`).

#### PR 3: Create `apps/api`
- Fastify skeleton, Clerk JWT verification middleware (`@clerk/backend`), `/health`.
- `Dockerfile` (multi-stage: build → distroless runtime).
- Stub all routes with `501 Not Implemented`; we'll wire them in Phase 8.

#### PR 4: Initialize `pg-boss`
- `apps/api/src/queues.ts`:
  ```ts
  import PgBoss from 'pg-boss'
  export const boss = new PgBoss({
    connectionString: process.env.PGBOSS_DATABASE_URL,
    max: 4,                   // physical connection cap for pg-boss internals
    schema: 'pgboss',
    retentionDays: 7,
    deleteAfterDays: 30,
    monitorStateIntervalSeconds: 60,
  })
  ```
- Define queues per §3.2 (constants in `apps/api/src/queues/index.ts`).

#### PR 5: Shared API client for Vercel → DO calls
- `packages/api-client/src/index.ts` exports `socioplyApi.publish.create({ … })` etc., uses `fetch` with the user's Clerk session token.

> Tip: Ship PRs 1–5 to **Vercel first** (no behavior change). DO API and worker stay stubs until Phase 8.

**Rollback**: revert PRs; the monorepo restructure is non-destructive (paths only).

---

### Phase 3 — AES-256-GCM Encryption Upgrade (Day 3, ~3 h)

The current `src/lib/encryption.ts` does **base64**, not encryption. Token leakage = full account compromise. Fix before any cutover.

#### 3.1 New module — `packages/security/src/encryption.ts`

```ts
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

const ALGO = 'aes-256-gcm'
const KEY_B64 = process.env.ENCRYPTION_KEY
if (!KEY_B64) throw new Error('ENCRYPTION_KEY env var is required')
const KEY = Buffer.from(KEY_B64, 'base64')
if (KEY.length !== 32) throw new Error('ENCRYPTION_KEY must be 32 bytes (base64-encoded)')

// Old key for decrypting legacy ciphertexts during rotation window:
const OLD_KEY = process.env.ENCRYPTION_KEY_OLD
  ? Buffer.from(process.env.ENCRYPTION_KEY_OLD, 'base64')
  : null

const FORMAT_V2 = 'v2'   // gcm: v2.<iv_b64>.<tag_b64>.<ct_b64>

export function encrypt(plaintext: string): string {
  if (!plaintext) return ''
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGO, KEY, iv)
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${FORMAT_V2}.${iv.toString('base64')}.${tag.toString('base64')}.${ct.toString('base64')}`
}

export function decrypt(stored: string): string {
  if (!stored) return ''

  // v2 format
  if (stored.startsWith(`${FORMAT_V2}.`)) {
    const [, ivB64, tagB64, ctB64] = stored.split('.')
    const iv = Buffer.from(ivB64, 'base64')
    const tag = Buffer.from(tagB64, 'base64')
    const ct = Buffer.from(ctB64, 'base64')
    for (const k of [KEY, OLD_KEY].filter(Boolean) as Buffer[]) {
      try {
        const d = createDecipheriv(ALGO, k, iv)
        d.setAuthTag(tag)
        return Buffer.concat([d.update(ct), d.final()]).toString('utf8')
      } catch { /* try next key */ }
    }
    throw new Error('Failed to decrypt v2 ciphertext with any active key')
  }

  // Legacy: base64 from old encryption.ts (or plaintext fallback)
  try {
    const decoded = Buffer.from(stored, 'base64').toString('utf8')
    if (/^[\x20-\x7E]+$/.test(decoded)) return decoded
  } catch { /* fall through */ }
  return stored
}

export function maskApiKey(key: string): string {
  if (!key || key.length <= 4) return '••••••••'
  return '•'.repeat(Math.min(20, key.length - 4)) + key.slice(-4)
}
```

#### 3.2 Migration script — `scripts/migrate-encryption.ts`

```ts
import { prisma } from '@socioply/db'
import { encrypt, decrypt } from '@socioply/security'

async function main() {
  const apiKeys = await prisma.apiKey.findMany()
  for (const row of apiKeys) {
    if (row.encryptedKey.startsWith('v2.')) continue
    const plain = decrypt(row.encryptedKey)
    if (!plain) { console.warn('skip empty', row.id); continue }
    await prisma.apiKey.update({ where: { id: row.id }, data: { encryptedKey: encrypt(plain) } })
  }
  const conns = await prisma.socialConnection.findMany()
  for (const row of conns) {
    const updates: any = {}
    if (!row.accessToken.startsWith('v2.')) {
      const plain = decrypt(row.accessToken)
      if (plain) updates.accessToken = encrypt(plain)
    }
    if (row.refreshToken && !row.refreshToken.startsWith('v2.')) {
      const plain = decrypt(row.refreshToken)
      if (plain) updates.refreshToken = encrypt(plain)
    }
    if (Object.keys(updates).length) {
      await prisma.socialConnection.update({ where: { id: row.id }, data: updates })
    }
  }
  console.log('done')
}
main().catch(e => { console.error(e); process.exit(1) })
```

#### 3.3 Run order

1. Deploy the new `encryption.ts` (it can decrypt both v2 and legacy formats — backward compatible).
2. Set `ENCRYPTION_KEY` env var in Vercel + DO. Do **not** set `ENCRYPTION_KEY_OLD` yet.
3. Run `pnpm tsx scripts/migrate-encryption.ts` against production DB once, off-peak.
4. After 7 days of clean operation, remove the legacy fallback branch from `decrypt()`.

**Rollback**: revert deploy; legacy values still readable because decrypt fallback handles base64.

---

### Phase 4 — Postgres-backed OAuth State (Day 3, ~1 h)

`src/lib/oauth.ts` uses an in-memory `Map`. This breaks the moment we have >1 instance (already broken on Vercel between cold starts of different lambda regions).

#### 4.1 Schema change — append to `packages/db/prisma/schema.prisma`

```prisma
model OAuthState {
  state        String   @id
  clerkId      String
  platform     String   // "linkedin" | "twitter" | "facebook" | "instagram" | "threads"
  codeVerifier String?
  target       String?  // "personal" | "company" (LinkedIn only)
  expiresAt    DateTime
  createdAt    DateTime @default(now())

  @@index([expiresAt])
  @@index([clerkId, platform])
  @@map("oauth_states")
}
```

Run `pnpm prisma migrate dev --name add_oauth_states` locally, then `prisma migrate deploy` in CI.

#### 4.2 Replace `src/lib/oauth.ts` — `packages/security/src/oauth.ts`

```ts
import { randomBytes } from 'node:crypto'
import { prisma } from '@socioply/db'

const TTL_MS = 10 * 60 * 1000

export async function generateOAuthState(
  clerkId: string,
  platform: string,
  target?: 'personal' | 'company'
) {
  const state = randomBytes(32).toString('hex')
  const codeVerifier = randomBytes(32).toString('base64url')
  await prisma.oAuthState.create({
    data: { state, clerkId, platform, codeVerifier, target,
            expiresAt: new Date(Date.now() + TTL_MS) },
  })
  return { state, codeVerifier }
}

export async function verifyOAuthState(state: string, clerkId: string, platform: string) {
  const row = await prisma.oAuthState.findUnique({ where: { state } })
  if (!row) return { valid: false as const }
  // one-time use
  await prisma.oAuthState.delete({ where: { state } }).catch(() => {})
  if (row.expiresAt < new Date()) return { valid: false as const }
  if (row.clerkId !== clerkId || row.platform !== platform) return { valid: false as const }
  return {
    valid: true as const,
    codeVerifier: row.codeVerifier ?? undefined,
    target: row.target as 'personal' | 'company' | undefined,
  }
}
```

#### 4.3 Cleanup job

In the worker:
```ts
await boss.schedule('oauth-state-cleanup', '0 * * * *', {})   // hourly
boss.work('oauth-state-cleanup', { teamSize: 1 }, async () => {
  await prisma.oAuthState.deleteMany({ where: { expiresAt: { lt: new Date() } } })
})
```

**Rollback**: keep the old in-memory module under a feature flag for one release; remove in next release.

---

### Phase 5 — Storage Migration: Supabase → AWS S3 + CloudFront (Day 4, ~4 h)

Today: `src/lib/supabase.ts` uploads to bucket `post-images`, returns `https://<project>.supabase.co/storage/v1/object/public/post-images/<userId>/<file>`. URLs are stored in `Draft.attachedImage` and `Post.imageUrl`.

After this phase: uploads go to a private S3 bucket; reads go through CloudFront at `https://cdn.socioply.com/<key>`. The bucket is **private** (no public ACLs); CloudFront's Origin Access Control is the only thing allowed to read it.

#### 5.1 New module — `packages/storage/src/s3.ts`

```ts
import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3 = new S3Client({
  region: process.env.S3_REGION ?? 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})
const BUCKET = process.env.S3_BUCKET!
const CDN = process.env.CDN_BASE!   // e.g. https://cdn.socioply.com

export async function uploadImage(buffer: Buffer, mimeType: string, userId: string, opts?: { prefix?: string }) {
  const ext = mimeType.split('/')[1]?.split('+')[0] ?? 'jpg'
  const prefix = opts?.prefix ?? 'user'                       // user/ vs tmp/ vs articles/
  const key = `${prefix}/${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
    CacheControl: 'public, max-age=31536000, immutable',
    // No ACL — bucket is private; CloudFront OAC handles read access.
  }))
  return { url: `${CDN}/${key}`, key }
}

export async function downloadImage(url: string): Promise<Buffer> {
  // Public CloudFront URL — no signing needed for reads
  const res = await fetch(url)
  if (!res.ok) throw new Error(`fetch ${url}: ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

export async function deleteImage(urlOrKey: string) {
  const key = urlOrKey.startsWith(CDN) ? urlOrKey.slice(CDN.length + 1) : urlOrKey
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
}

export async function objectExists(key: string): Promise<boolean> {
  try { await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key })); return true }
  catch { return false }
}

/** Optional: pre-signed PUT for direct browser uploads (skips Vercel/DO bandwidth). */
export async function presignUpload(key: string, mimeType: string, ttlSeconds = 300) {
  const cmd = new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: mimeType })
  return getSignedUrl(s3, cmd, { expiresIn: ttlSeconds })
}

export function isCdnUrl(url: string) { return url.startsWith(CDN) }
export function isSupabaseUrl(url: string) {
  return /supabase\.co\/storage\/v1\/object\/public\/post-images\//.test(url)
}
```

#### 5.2 Env additions (`.env.example`, Vercel, DO)

```env
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET=socioply-prod
S3_REGION=us-east-1
CDN_BASE=https://cdn.socioply.com
```

> **Why no `ACL: 'public-read'`**: with CloudFront + OAC, S3 best practice is to keep the bucket fully private and let only the distribution read it. This is the default S3 security baseline since 2023 and avoids the entire class of "open S3 bucket" leaks. Reads still work for end users via the CloudFront URL.

#### 5.3 `next.config.ts` patch

Add the CloudFront CDN host to `remotePatterns`:

```ts
remotePatterns.push({
  protocol: 'https',
  hostname: 'cdn.socioply.com',
})
```

#### 5.4 Bulk migration — `scripts/migrate-storage.ts`

```ts
import { prisma } from '@socioply/db'
import { uploadImage, downloadImage, isCdnUrl, isSupabaseUrl } from '@socioply/storage'

async function migrateOne(field: 'drafts.attachedImage' | 'posts.imageUrl', id: string,
                          url: string, userId: string) {
  if (!isSupabaseUrl(url) || isCdnUrl(url)) return
  const buf = await downloadImage(url)
  const mime = url.endsWith('.png') ? 'image/png' : 'image/jpeg'
  const { url: newUrl } = await uploadImage(buf, mime, userId)
  if (field === 'drafts.attachedImage') {
    await prisma.draft.update({ where: { id }, data: { attachedImage: newUrl } })
  } else {
    await prisma.post.update({ where: { id }, data: { imageUrl: newUrl } })
  }
}

async function main() {
  const drafts = await prisma.draft.findMany({
    where: { attachedImage: { contains: 'supabase.co' } },
    select: { id: true, userId: true, attachedImage: true },
  })
  for (const d of drafts) await migrateOne('drafts.attachedImage', d.id, d.attachedImage!, d.userId)

  const posts = await prisma.post.findMany({
    where: { imageUrl: { contains: 'supabase.co' } },
    select: { id: true, userId: true, imageUrl: true },
  })
  for (const p of posts) await migrateOne('posts.imageUrl', p.id, p.imageUrl!, p.userId)

  console.log('migration done', { drafts: drafts.length, posts: posts.length })
}
main().catch(e => { console.error(e); process.exit(1) })
```

#### 5.5 Cutover

1. Deploy Phase 5 code (both S3 and Supabase paths usable; uploader writes to S3 only).
2. Run migration script (idempotent; safe to re-run).
3. Verify zero rows: `SELECT count(*) FROM drafts WHERE attached_image LIKE '%supabase.co%';`
4. Leave Supabase bucket intact for 30 days; delete in Phase 12.

**Lifecycle policy on S3** (set in AWS console after migration): expire `tmp/*` after 90 days only. User content (`user/*`, `articles/*`) has **no expiration** — kept until the user deletes the source row. Versioning is on for accident recovery.

**CloudFront invalidation**: not needed during migration since each new upload uses a unique key. Only needed if we ever re-issue under a previously-used key (we don't).

**Rollback**: revert env vars `AWS_*`, `S3_*`, `CDN_BASE` and re-deploy. New uploads go back to Supabase. Old URLs still resolve via CloudFront (we don't delete S3 objects).

---

### Phase 6 — Database Migration (Day 5, ~3 h work + ~30 min downtime)

Two-step: (a) baseline copy (no downtime), (b) delta sync (short downtime).

#### 6a. Baseline copy

```bash
# from a workstation with both endpoints whitelisted
pg_dump --no-owner --no-acl --format=custom \
  -h aws-1-us-east-1.pooler.supabase.com -p 5432 -U postgres.gmjzvhviihsjpzipocxe \
  postgres > baseline.dump

pg_restore --no-owner --no-acl --clean --if-exists \
  -h <new-do-cluster>.b.db.ondigitalocean.com -p 25060 -U socioply_app \
  -d socioply baseline.dump
```

Then run `pnpm prisma migrate deploy` against the new DO database to confirm schema parity (and apply `OAuthState` from Phase 4 if not already).

#### 6b. Smoke-test against new DB

- Spin up a **second** Vercel preview branch with `DATABASE_URL` pointing at DO Postgres (via `:25061` PgBouncer), `DIRECT_URL` at `:25060`.
- Validate: login (Clerk-only, no DB writes here), draft list, calendar GET, single Telegram test publish.
- Verify `pg_stat_activity` stays under 10 connections.

#### 6c. Cutover (announce 30-min maintenance)

1. Deploy a maintenance banner via a Vercel feature flag (`MAINTENANCE_MODE=true`).
2. Drain pg-boss queue (no new jobs accepted for now — only matters if you've already started Phase 7; safe to skip on first cutover).
3. Stop accepting writes (read-only middleware on `apps/web` — refuses POST/PUT/DELETE with 503).
4. Re-dump only **append-mostly tables** since baseline:
   ```sql
   COPY (SELECT * FROM posts WHERE updated_at > '<baseline_time>') TO STDOUT;
   COPY (SELECT * FROM drafts WHERE updated_at > '<baseline_time>') TO STDOUT;
   COPY (SELECT * FROM twitter_api_requests WHERE requested_at > '<baseline_time>') TO STDOUT;
   COPY (SELECT * FROM social_connections WHERE updated_at > '<baseline_time>') TO STDOUT;
   ```
   Apply via `INSERT ... ON CONFLICT (id) DO UPDATE` against DO.
5. Update env in Vercel & DO:
   ```env
   # Vercel (proxy reads only)
   DATABASE_URL=postgresql://socioply_app:<pw>@<new-do-cluster>.b.db.ondigitalocean.com:25061/socioply?sslmode=require&pgbouncer=true&connection_limit=1
   DIRECT_URL=postgresql://socioply_app:<pw>@<new-do-cluster>.b.db.ondigitalocean.com:25060/socioply?sslmode=require

   # DO API/Worker
   DATABASE_URL=postgresql://socioply_app:<pw>@<new-do-cluster>.b.db.ondigitalocean.com:25061/socioply?sslmode=require&pgbouncer=true&connection_limit=2
   DIRECT_URL=postgresql://socioply_app:<pw>@<new-do-cluster>.b.db.ondigitalocean.com:25060/socioply?sslmode=require
   PGBOSS_DATABASE_URL=postgresql://socioply_app:<pw>@<new-do-cluster>.b.db.ondigitalocean.com:25061/socioply?sslmode=require&pgbouncer=true&connection_limit=4
   ```
6. Re-deploy Vercel + restart DO services (`docker compose up -d`).
7. Smoke test: login, create draft, publish to Telegram test channel, check calendar.
8. Lift maintenance banner.

**Rollback**: revert env vars to Supabase, redeploy. Window: until first material write to DO Postgres after lift. If we need to roll back after writes, dump-back the deltas the same way.

---

### Phase 7 — pg-boss + Queue Topology (Day 6, ~3 h)

#### 7.1 Worker bootstrap — `apps/api/src/worker.ts`

```ts
import { boss } from './queues'
import { publishHandler, publishScheduledHandler } from './handlers/publish'
import { analyticsSyncHandler } from './handlers/analytics'
import { articlePipelineHandler } from './handlers/article'
import { translationHandler, enrichmentHandler } from './handlers/article-aux'
import { imageGenerateHandler } from './handlers/image'
import { oauthStateCleanupHandler } from './handlers/oauth'
import { dbBackupHandler } from './handlers/backup'

async function main() {
  await boss.start()

  // Repeatable schedules
  await boss.schedule('analytics-sync',       '0 2 * * *', {})        // daily 02:00 UTC
  await boss.schedule('oauth-state-cleanup',  '0 * * * *', {})        // hourly
  await boss.schedule('db-backup',            '0 3 * * 0', {})        // Sunday 03:00 UTC

  // Workers (teamSize per §3.2)
  boss.work('publish',              { teamSize: 10, teamConcurrency: 1 }, publishHandler)
  boss.work('publish-scheduled',    { teamSize: 10, teamConcurrency: 1 }, publishScheduledHandler)
  boss.work('analytics-sync',       { teamSize: 2,  teamConcurrency: 1 }, analyticsSyncHandler)
  boss.work('article-pipeline',     { teamSize: 5,  teamConcurrency: 1 }, articlePipelineHandler)
  boss.work('article-translation',  { teamSize: 3,  teamConcurrency: 1 }, translationHandler)
  boss.work('article-enrichment',   { teamSize: 2,  teamConcurrency: 1 }, enrichmentHandler)
  boss.work('image-generate',       { teamSize: 5,  teamConcurrency: 1 }, imageGenerateHandler)
  boss.work('oauth-state-cleanup',  { teamSize: 1 }, oauthStateCleanupHandler)
  boss.work('db-backup',            { teamSize: 1 }, dbBackupHandler)
}
main().catch(e => { console.error(e); process.exit(1) })
```

#### 7.2 `publishScheduledHandler` (replaces `vercel.json` cron)

The current `src/app/api/posts/publish-scheduled/route.ts` is a per-minute polling job. We replace it with **per-post delayed jobs** scheduled at draft creation/scheduling time:

```ts
// In the route that schedules a post:
await boss.send('publish-scheduled', { postId }, {
  startAfter: post.scheduledAt!,
  retryLimit: 5,
  retryBackoff: true,
  retryDelay: 60,            // seconds, exponential
  expireInHours: 24,
  singletonKey: `post:${postId}`, // dedup
})

// Worker:
export const publishScheduledHandler = async (job: Job<{ postId: string }>) => {
  const post = await prisma.post.findUnique({
    where: { id: job.data.postId },
    include: { user: true, draft: true },
  })
  if (!post || post.status !== 'scheduled') return  // already published / cancelled

  // For thread replies, ensure parent is published first; otherwise re-enqueue with 30s delay.
  if (post.parentPostId) {
    const parent = await prisma.post.findUnique({ where: { id: post.parentPostId }, select: { status: true, tweetId: true } })
    if (!parent || parent.status !== 'published' || !parent.tweetId) {
      throw new Error('parent-not-ready')   // pg-boss retries with backoff
    }
  }
  await dispatchToPlatform(post)            // existing logic, now extracted
}
```

**Migration of in-flight scheduled posts**: one-off script enqueues a `publish-scheduled` job for every existing `Post` with `status='scheduled'`.

#### 7.3 Drop `vercel.json` cron entries

After 48 h of clean operation:
```diff
- {
-   "crons": [
-     { "path": "/api/posts/publish-scheduled", "schedule": "* * * * *" },
-     { "path": "/api/posts/sync-analytics",   "schedule": "0 2 * * *" }
-   ]
- }
+ { "crons": [] }
```
(Or delete the file entirely.)

**Rollback**: re-add the cron entries; `publish-scheduled` route still works since handlers and DB queries are unchanged.

---

### Phase 8 — Endpoint Cutover (Day 6–7, ~4 h)

> ⭐ **Hard prerequisite for the Article Production Pipeline.** Phase 8 must complete before any work on `.plans/article-production-pipeline.implementation-plan.md` begins. Single-article wall time (8–25 min) exceeds Vercel's 300 s function ceiling by 5–10×; the DO worker is the only place this code can run. After Phase 8 ships, the article pipeline implementation can begin per its own checklist (§16 of the article plan).

Per route, replace the Vercel handler body with a thin proxy that forwards to DO API with the Clerk JWT.

#### 8.1 Proxy helper — `apps/web/src/lib/api-proxy.ts`

```ts
import { auth } from '@clerk/nextjs/server'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!  // https://api.socioply.com

export async function proxy(request: Request, path: string) {
  const { getToken } = await auth()
  const token = await getToken()
  const url = new URL(path, API_BASE)
  url.search = new URL(request.url).search
  const init: RequestInit = {
    method: request.method,
    headers: {
      'authorization': `Bearer ${token}`,
      'content-type': request.headers.get('content-type') ?? 'application/json',
    },
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer(),
  }
  const upstream = await fetch(url, init)
  return new Response(upstream.body, {
    status: upstream.status,
    headers: { 'content-type': upstream.headers.get('content-type') ?? 'application/json' },
  })
}
```

#### 8.2 Per-route migration table

Each Vercel route becomes a 3-line file:

```ts
// apps/web/src/app/api/ai/generate/route.ts
import { proxy } from '@/lib/api-proxy'
export async function POST(req: Request) { return proxy(req, '/ai/generate') }
```

| Vercel route | DO API path | Cutover order |
|---|---|---|
| `POST /api/ai/generate` | `POST /ai/generate` | 1 |
| `POST /api/ai/analyze-writing-style` | `POST /ai/analyze-writing-style` | 1 |
| `POST /api/images/generate` | `POST /images/generate` | 2 |
| `POST /api/images/generate-prompt` | `POST /images/generate-prompt` | 2 |
| `POST /api/images/upload` | `POST /images/upload` | 2 |
| `POST /api/posts/publish` | `POST /posts/publish` (enqueues `publish` job, returns `{jobId}`) | 3 |
| `GET /api/posts/calendar` | `GET /posts/calendar` | 4 |
| `GET /api/social/[platform]` | `GET /social/:platform` | 5 (LAST — see warning below) |
| `GET /api/social/[platform]/callback` | `GET /social/:platform/callback` | 5 |
| `GET /api/social/[platform]/pages` | `GET /social/:platform/pages` | 5 |
| `GET /api/social/[platform]/settings` | `GET /social/:platform/settings` | 5 |
| `GET /api/social/instagram/refresh-username` | `GET /social/instagram/refresh-username` | 5 |
| `GET /api/social/connections` | `GET /social/connections` | 5 |
| `GET /api/api-keys/*` | `GET /api-keys/*` | 6 |

**OAuth callback URL change** (cutover step 5): For each provider (LinkedIn personal, LinkedIn company, Twitter, Facebook, Instagram, Threads) update redirect URIs in their developer console **from** `https://app.socioply.com/api/social/{platform}/callback` **to** `https://api.socioply.com/social/{platform}/callback`. **Do this in a low-traffic window** so existing live OAuth flows aren't broken mid-flight. Keep the Vercel proxy for callbacks active for 24 h as fallback.

Per-route env additions on DO:

```env
LINKEDIN_REDIRECT_URI=https://api.socioply.com/social/linkedin/callback
LINKEDIN_COMPANY_REDIRECT_URI=https://api.socioply.com/social/linkedin/callback
TWITTER_REDIRECT_URI=https://api.socioply.com/social/twitter/callback
THREADS_REDIRECT_URI=https://api.socioply.com/social/threads/callback
# (Facebook & Instagram redirect URIs as configured)
```

**Rollback per route**: redeploy Vercel with the route's original body restored from git history. Each route is independently revertable.

---

### Phase 9 — Hardening & Observability (Day 7, ~4 h)

1. **Structured logging** (`pino` on `apps/api`) → ship to Better Stack. JSON logs include `userId`, `jobId`, `route`, `duration_ms`.
2. **Sentry** in both `apps/web` and `apps/api`. Tag releases with git SHA.
3. **Tailscale-only admin endpoints**: bind to `127.0.0.1`:
   ```
   /admin/queues   ← pg-boss UI (use https://github.com/timgit/pg-boss-ui or roll a small Fastify view)
   /admin/metrics  ← Prometheus exposition (Fastify-metrics)
   ```
   Access via `tailscale serve` or SSH port-forward.
4. **Connection-budget monitoring**: hourly pg-boss job:
   ```ts
   const rows = await prisma.$queryRaw<{count: bigint}[]>`SELECT count(*) FROM pg_stat_activity WHERE datname = 'socioply' AND state = 'active'`
   if (rows[0].count > 18n) Sentry.captureMessage('pg active connections > 18', 'warning')
   ```
5. **Backups**: weekly `pg_dump → S3` (`db-backup` job). Use a **separate S3 bucket** `socioply-backups` with Glacier transition after 30 days and a 7-year retention rule for compliance/peace of mind:
   ```bash
   pg_dump $DIRECT_URL | gzip | aws s3 cp - s3://socioply-backups/db-$(date +%Y%m%d).sql.gz
   ```
   IAM policy on `socioply-app` extended with `s3:PutObject` on `arn:aws:s3:::socioply-backups/*`. (DO Managed Postgres also has its own daily snapshots — this is the secondary, off-DO copy.)
6. **Healthchecks**: `GET /health` returns `{db: ok, boss: ok, s3: ok}` (S3 check is a `HeadBucket` against the bucket). Monitor via Better Uptime or DO monitoring (free).
7. **Rate-limit middleware** on `apps/api` per Clerk userId (in-memory token bucket; OK for single droplet — revisit at scale-out).
8. **Secrets handling**: all secrets in `/opt/socioply/.env.production`, owned by `root:docker`, mode `0640`. No secrets in image layers or git.

---

### Phase 10 — CI/CD (Day 7–8, ~3 h)

| Service | Pipeline |
|---|---|
| `apps/web` (Vercel) | unchanged — push to `main` deploys |
| `apps/api` (DO Droplet) | GitHub Actions: build Docker image → push to **GHCR** → SSH (over Tailscale) → `docker compose pull && docker compose up -d` |
| Migrations | GH Action runs `prisma migrate deploy` against DO Postgres (via `DIRECT_URL` :25060) **before** swapping API container |
| Secrets | GitHub Actions secrets + Tailscale OAuth client for SSH |

`/opt/socioply/docker-compose.yml`:
```yaml
services:
  api:
    image: ghcr.io/<org>/socioply-api:latest
    restart: unless-stopped
    ports: ["127.0.0.1:3001:3001"]
    env_file: .env.production
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://127.0.0.1:3001/health"]
      interval: 30s
  worker:
    image: ghcr.io/<org>/socioply-api:latest
    restart: unless-stopped
    command: ["node", "dist/worker.js"]
    env_file: .env.production
  caddy:
    image: caddy:2
    restart: unless-stopped
    ports: ["80:80","443:443"]
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy-data:/data
volumes:
  caddy-data:
```

`/opt/socioply/Caddyfile`:
```
api.socioply.com {
  encode gzip
  reverse_proxy api:3001
}
```

`.github/workflows/deploy-api.yml`:
```yaml
name: deploy-api
on:
  push:
    branches: [main]
    paths: ['apps/api/**', 'packages/**', 'prisma/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions: { contents: read, packages: write }
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile

      # 1. Migrate DB (using DIRECT_URL bypasses PgBouncer — needed for migrations)
      - run: pnpm --filter @socioply/db prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.DO_DIRECT_URL }}

      # 2. Build & push image to GHCR
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v5
        with:
          context: .
          file: apps/api/Dockerfile
          push: true
          tags: ghcr.io/${{ github.repository }}-api:latest

      # 3. Deploy via Tailscale SSH
      - uses: tailscale/github-action@v2
        with:
          oauth-client-id: ${{ secrets.TS_OAUTH_CLIENT_ID }}
          oauth-secret: ${{ secrets.TS_OAUTH_SECRET }}
          tags: tag:ci
      - run: |
          ssh -o StrictHostKeyChecking=no socioply-api \
            "cd /opt/socioply && docker compose pull && docker compose up -d --remove-orphans"
```

---

### Phase 11 — 30-Day Soak

Watch the dashboards. Fix anything that bleeds. Don't decommission yet.

KPIs to track:
- p95 request latency on `apps/api` — target <500 ms (excl. AI calls).
- pg-boss queue depth per queue — target <10 sustained.
- `pg_stat_activity.active` peak per hour — target <18.
- Error rate (Sentry) — target <0.5%.
- CloudFront 30-day egress — track to know if PriceClass_100 is enough and stay within free-tier (1 TB/mo for first 12 months).

---

### Phase 12 — Decommission Supabase (Day 30+)

1. Confirm zero rows referencing `*.supabase.co` in `attachedImage` / `Post.imageUrl` (final check).
2. Export final Supabase DB dump → archive to S3 under `s3://socioply-backups/supabase-final/`.
3. Delete Supabase Storage bucket `post-images`.
4. Pause / delete Supabase project.
5. Code cleanup PR:
   - Remove `@supabase/auth-helpers-nextjs`, `@supabase/ssr`, `@supabase/supabase-js` from `package.json`.
   - Delete `src/lib/supabase.ts`.
   - Remove `SUPABASE_*` env vars from Vercel / DO / `.env.example`.
   - Remove the Supabase remote pattern from `next.config.ts`.
6. Bump version, tag release `v1.0.0-do-migration`.

---

## 6. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Postgres connection budget exhausted** by article-pipeline burst | Medium | High | `teamSize` caps in §3.2; PgBouncer transaction-pool; hourly `pg_stat_activity` alert; one-click upgrade to 2 GB |
| **OAuth flows break during cutover** (redirect URI change) | Medium | High | Update redirect URIs in low-traffic window (Phase 8 step 5); keep Vercel callback proxies active for 24 h fallback |
| **Encryption key rotation corrupts tokens** | Low | Critical | Decrypt has dual-key fallback (`ENCRYPTION_KEY` + `ENCRYPTION_KEY_OLD`); test on DB copy first; idempotent migration script; worst-case force users to reconnect |
| **`pg-boss` job loss on droplet restart** | Low | High | Jobs are durable in Postgres; pg-boss auto-recovers; idempotent platform handlers |
| **CloudFront propagation delay or OAC misconfig** | Medium | Medium | Test serving from `cdn.socioply.com` before flipping public traffic; pre-warm by hitting each migrated URL once; have S3 direct-URL fallback ready in code |
| **Unexpected CloudFront egress bill** | Low | Medium | Set AWS budget alert at $50/mo; cache headers on all uploads (`max-age=31536000, immutable`); review CloudFront free-tier expiration date |
| **Tailscale outage locks us out of SSH** | Low | Medium | Keep DO web console as emergency access; document break-glass procedure |
| **Vercel proxy adds latency to UI flows** | Low | Low | For latency-sensitive flows (calendar GET) consider keeping them on Vercel directly to DO Postgres via pooler |
| **GHCR rate limits hit** | Low | Low | Free tier is generous; ~2-3 image pulls per deploy |
| **In-flight publish jobs lost during DB cutover** | Low | High | Maintenance banner refuses new publishes; `publish-scheduled` remains on Vercel Cron until Phase 7; gap is <30 min |
| **Article pipeline LLM-rate-limit cascading failures** | Medium | Medium | `teamSize=5` cap; provider-aware retry/backoff in `step-runner.ts`; Sentry alert on >3 consecutive failures per provider |

---

## 7. Cost Estimate (monthly)

| Item | Cost (launch) | Notes / scale |
|---|---|---|
| Droplet `s-2vcpu-4gb` | $24 | |
| **Postgres `db-s-1vcpu-1gb` (NEW, dedicated)** | **$15** | Includes daily backups |
| AWS S3 storage | ~$0.50–$2 | $0.023/GB-mo standard. ~20–80 GB at launch. |
| AWS S3 requests | ~$0.10 | Negligible at our PUT/GET rate |
| AWS CloudFront egress | ~$1–10 | $0.085/GB NA/EU. ~10–100 GB/mo at launch |
| AWS S3 backups bucket (Glacier after 30 d) | ~$0.50 | Weekly `pg_dump` ~50 MB, transitions cheaply |
| AWS data transfer S3 → CloudFront | $0 | Free (within AWS) |
| Container Registry (GHCR) | $0 | Free at our usage |
| Redis | — | Not used |
| Tailscale | $0 | Free tier |
| Sentry / Better Stack | $0 | Free tiers |
| **Total new monthly (launch)** | **~$42–52/mo** | |

vs current Supabase Pro tier (~$25/mo). Net cost change: **~$17–27/mo** for an order of magnitude more capability and headroom for the article pipeline.

**CloudFront egress watch-out**: a viral article driving 1 TB egress in a month would cost ~$85 (vs $5 flat on DO Spaces). At the volumes that justify viral traffic we'd happily absorb it; if it ever becomes an issue, switching to PriceClass_All + reserved capacity, or cache-aggressively-with-long-TTL, brings it down. CloudFront also has a free tier of 1 TB/mo for the first 12 months on new AWS accounts.

LLM spend at "Medium" article load (500 articles/day) is **$300–900/day** — infrastructure cost is irrelevant by comparison.

---

## 8. Order of Operations Cheat Sheet

```
0. Pre-work (DNS, GHCR namespace, Tailscale account, log sink)
1. Provision DO infra (droplet, dedicated Postgres) + AWS infra (S3, CloudFront, ACM) + DNS + Tailscale
2. Repo restructure → pnpm monorepo, Fastify skeleton (no behavior change)
3. AES-256-GCM encryption upgrade + one-off re-encryption
4. Postgres-backed OAuth state + cleanup job
5. Storage migration: Supabase → S3 + CloudFront (background, no downtime)
6. DB migration (30-min downtime)
7. pg-boss queue topology live; replace Vercel Cron
8. Endpoint cutover (one route at a time, OAuth callbacks LAST)
9. Hardening (Sentry, logs, monitoring, backups, Tailscale-only admin)
10. CI/CD (GHCR + Tailscale GH Action)
11. 30-day soak
12. Decommission Supabase
```

---

## 9. Timeline (Parallel Tracks)

Phases 2–4 are **non-destructive code refactors** that ship to your existing Vercel + Supabase setup. They can run on **Track A** in parallel with **Track B** (DO/AWS provisioning). Tracks converge at Phase 5.

| Day | Track A — Code (ships to current Vercel+Supabase) | Track B — Infra (no production impact) |
|---|---|---|
| 0 | Pre-work checklist done; runbook pinned | Confirm DNS provider, AWS account, Tailscale account |
| 1 | Phase 2: pnpm monorepo + `packages/db` + `packages/platforms` (PRs 1–2) | Phase 1: Provision droplet, dedicated Postgres, S3+CloudFront, DNS, Tailscale |
| 2 | Phase 2: `apps/api` skeleton + `pg-boss` init + `packages/api-client` (PRs 3–5). **Ships to Vercel as no-op.** | Phase 1: ACM cert validated, CloudFront live, S3 healthcheck.png served |
| 3 | Phase 3: AES-256-GCM encryption shipped + re-encrypt script run on Supabase DB. Phase 4: Postgres OAuth state shipped. | Decide log sink, maintenance window |
| 4 | — | Phase 5: Storage migration: Supabase → S3 (script runs against Supabase + S3 in parallel; URLs updated in current Supabase DB) |
| 5 | — | Phase 6: DB cutover (30-min maintenance window) |
| 6 | — | Phase 7: pg-boss live in worker; Vercel Cron drained |
| 6–7 | — | Phase 8: Long-running endpoints + OAuth callbacks moved to DO API |
| 7 | — | Phase 9: Hardening (logging, Sentry, Tailscale-only admin, backups) |
| 7–8 | — | Phase 10: CI/CD finalized (GHCR + Tailscale GH Action) |
| 8 → 38 | 30-day soak | |
| Day 38+ | Phase 12: Decommission Supabase | |

**Why this matters**: even if AWS/DNS/Tailscale slip by a few days, you're still shipping value to production every day on Track A. Track A alone closes two real production gaps (real encryption + multi-instance-safe OAuth state).

**Total active engineering work: ~6–8 days for one developer; calendar time ~2 weeks with verification windows; full cycle to Supabase decommission ~6 weeks.**

---

## 10. Rollback Playbook (Per Phase)

| Phase | Failure mode | Rollback action | Time |
|---|---|---|---|
| 1 | Droplet/cluster misconfigured | Destroy + re-provision | 30 min |
| 2 | Monorepo breaks `vercel build` | Revert PRs; restructure is path-only | 5 min |
| 3 | Decryption fails for some rows | Set `ENCRYPTION_KEY_OLD` to previous key (none in this case → tokens invalid → users reconnect) | 1 day worst case |
| 4 | OAuth state lookups fail | Re-deploy in-memory `Map` version under feature flag | 10 min |
| 5 | CloudFront serves wrong/missing images (OAC misconfig, cert issue) | Revert `next.config.ts` remotePatterns; new uploads go to Supabase; DB rows pointing at CloudFront continue to resolve (CF still up) | 5 min |
| 6 | DB cutover smoke test fails | Revert env vars to Supabase, redeploy. If post-write rollback needed, dump-back deltas | 30–60 min |
| 7 | Scheduled posts not firing | Re-add `vercel.json` cron entries; route handler still works | 10 min |
| 8 | Single endpoint regresses | Revert that one Vercel route from git | per-route, 5 min each |
| 9 | Observability gap | No user impact; iterate next deploy | n/a |
| 10 | Deploy pipeline broken | Manual `docker compose pull && up -d` over Tailscale SSH | 10 min |
| 12 | Supabase already deleted, regret | DB dump archived in `s3://socioply-backups/`; restore to a new Supabase project (or new DO DB) | 1–2 h |

---

## 11. Open Items

**None of these block Phase 2/3/4 (Track A — code refactoring).** They block specific later phases as noted.

| # | Item | Owner | Blocks | Default if unresolved |
|---|---|---|---|---|
| 1 | DNS provider for `socioply.com` | You | Phase 1 (DNS records for `api.` and `cdn.`) | Use DO DNS |
| 2 | AWS account ready (root + IAM user with S3 perms) | You | Phase 1 (S3 + CloudFront setup) | Create new AWS account; ~30 min |
| 3 | GitHub repo path for GHCR namespace | You | **Phase 10** (CI/CD only) | `ghcr.io/<your-gh-handle>/socioply-api` |
| 4 | Tailscale account exists (or create) | You | Phase 1 (droplet bootstrap) | Create new (free) |
| 5 | Log sink: Logtail vs Axiom vs Better Stack vs DO native | You or me | **Phase 9** (hardening) | Better Stack |
| 6 | Maintenance window for DB cutover | You | **Phase 6** (DB cutover) | Sunday 03:00–04:00 your TZ |
| 7 | When to enable article-pipeline in production | You | **Post-migration** | Behind `FEATURE_ARTICLE_PIPELINE` env flag, off by default |
| ~~8~~ | ~~Storage retention model~~ | — | Resolved | AWS S3 canonical, no expiration on user content (D3) |
| ~~9~~ | ~~Cron / publish queue isolation~~ | — | Resolved | Separate `pg-boss` queues per §3.2 |

---

## 12. When does each "free" choice need to scale up?

| Tool | Current (launch) | Tipping point to upgrade/replace |
|---|---|---|
| **`db-s-1vcpu-1gb`** Postgres (22 conn) | Up to 5–10 paid users on article pipeline | `pg_stat_activity.active` sustains >18 → upgrade to 2 GB / 50 conn |
| **`pg-boss`** (vs BullMQ + Redis) | ~0.1 jobs/sec | Sustained >50 jobs/sec, or sub-second job latency required, or need cross-process pub/sub for live UI |
| **`s-2vcpu-4gb` droplet** | <40 in-flight worker jobs | CPU >70% sustained, or memory pressure → vertical resize first |
| **AWS S3 + CloudFront PriceClass_100** | ~10–80 GB stored, NA+EU users | Sustained users in APAC/SA → switch to PriceClass_All; sustained >1 TB egress → consider CloudFront commit pricing or Cloudflare R2 + egress-free pull |
| **Tailscale free tier** | 2–3 devices | >100 devices or >3 users |
| **GHCR free tier** | ~10 deploys/day | >2000 GB/month bandwidth |
| **Sentry / Better Stack free** | ~5k errors/month / 1 GB logs | 50k+ events/month / >1 GB logs |
| **Single-region setup** | Single market / latency-tolerant users | Need <100ms latency in EU+US+APAC → multi-region with read replicas + edge proxy |
