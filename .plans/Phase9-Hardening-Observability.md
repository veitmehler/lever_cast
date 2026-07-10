# Phase 9 — Hardening & Observability: Full Implementation Plan

> **Status: IMPLEMENTED** (audited 2026-07-09) — hardening & observability shipped (Sentry, structured logging, health endpoints); extended further by the July 2026 resilience layer (`social-generation-resilience.implementation-plan.md`).
> **Estimated effort:** 6–8 hours of focused work
> **Estimated cost increment:** $0 (everything fits free tiers at our scale)
> **Prerequisite:** Phases 0–8, 10 complete (✅ done)
> **Blocking:** Article Production Pipeline implementation (recommended, not strict)

## 0. Goals & Success Criteria

**Goal:** Move the production stack from "it works" to "we'll know within 60 seconds when it doesn't."

We are explicitly NOT building:
- Per-customer dashboards (premature)
- Distributed tracing (single-droplet scale doesn't need it)
- Custom Grafana stack (free SaaS tools cover this)
- Auto-scaling (Stage 2 in DB scaling guide handles growth)

**Success criteria** (verified end-to-end after Phase 9):

| Outcome | Verification |
|---|---|
| Any uncaught exception in API or worker hits Sentry within 30s | Manually throw test error → see in Sentry |
| Logs from any container searchable for 7+ days | Search `req.url:"/health"` in Better Stack UI |
| Outage of `api.socioply.com` triggers email within 60s | Stop API container → receive alert |
| Connection budget warnings hit Sentry before pool is exhausted | Inject test alert → see in Sentry |
| Postgres has 4 weeks of off-DO backups | Run manual backup → list in `s3://socioply-backups/` |
| One user cannot DoS LLM endpoints with 1000 requests/min | Test with `siege` → see 429s after 100 req/min |
| pg-boss queue depth observable without SSHing into containers | Open admin UI, see queue stats |
| All secrets in `.env.production` mode 0640 root:docker | `stat /opt/socioply/.env.production` |
| Runbook documents top-5 incident response procedures | Ship `.documentation/runbook.md` |

---

## 1. Pre-flight: What Exists Today

| Capability | State |
|---|---|
| Sentry on `apps/web` | ✅ Already integrated |
| Sentry on `apps/api` / worker | ❌ Missing |
| Container logs | ✅ to docker stdout (lost on restart, no search) |
| Centralized log aggregation | ❌ Missing |
| `/health` endpoint | ✅ Returns `{status, ts}` (process liveness only — no DB/S3 check) |
| External uptime monitor | ❌ Missing |
| `pg_stat_activity` monitoring | ❌ Manual queries only |
| Off-DO backups | ❌ DO daily snapshot only (single point of failure if DO has outage) |
| Rate limiting | ❌ Missing — single user could exhaust LLM budget |
| pg-boss inspection | ❌ Must SSH into container and query `pgboss.job` |
| `.env.production` perms | 🟡 Need to verify |

---

## 2. Order of Operations

Strict order — each step builds on the previous:

```
9.1  Sentry on apps/api          ← FIRST (so you see errors during 9.2-9.10)
9.2  Structured logs → Better Stack
9.3  Healthcheck depth + Better Uptime monitor
9.4  Connection-budget monitor (cron job)
9.5  Weekly DB backup → S3 Glacier
9.6  Rate-limit middleware
9.7  pg-boss admin UI (Tailscale-only)
9.8  Secrets hygiene audit
9.9  Runbook documentation
```

---

## 3. Sub-phase Details

### 9.1 Sentry on `apps/api` and worker (30 min)

**Why:** The whole API + worker is currently a black box. Errors only visible via `docker logs`.

**Files to change:**
- `apps/api/package.json` — add `@sentry/node`
- `apps/api/src/lib/sentry.ts` (NEW) — initialization + helpers
- `apps/api/src/index.ts` — init Sentry first, register Fastify error handler
- `apps/api/src/worker.ts` — init Sentry first, wrap pg-boss handlers
- `apps/api/src/middleware/auth.ts` — set `Sentry.setUser({ id: clerkId })` after JWT verify

**Steps:**
1. Create new Sentry project: https://sentry.io/organizations/.../projects/new — pick **Node.js**, name it `socioply-api`
2. Copy DSN
3. Add `SENTRY_DSN` to:
   - `/opt/socioply/.env.production` on droplet (via `sudo nano`)
   - GitHub Actions secrets (for any future build-time use)
   - 1Password
4. `cd apps/api && pnpm add @sentry/node @sentry/profiling-node`
5. Implement `apps/api/src/lib/sentry.ts`:
   ```ts
   import * as Sentry from '@sentry/node'
   import { nodeProfilingIntegration } from '@sentry/profiling-node'

   export function initSentry(serviceName: 'api' | 'worker') {
     if (!process.env.SENTRY_DSN) return
     Sentry.init({
       dsn: process.env.SENTRY_DSN,
       environment: process.env.NODE_ENV ?? 'production',
       release: process.env.GIT_SHA ?? undefined,
       tracesSampleRate: 0.1,
       profilesSampleRate: 0.1,
       integrations: [nodeProfilingIntegration()],
       initialScope: { tags: { service: serviceName } },
     })
   }
   ```
6. Modify `apps/api/src/index.ts` — `initSentry('api')` BEFORE any other imports' side effects
7. Register Fastify error handler that calls `Sentry.captureException(err)` then forwards to default handler
8. Modify `apps/api/src/worker.ts` — `initSentry('worker')`; wrap each pg-boss handler in try/catch that captures
9. Modify `apps/api/src/middleware/auth.ts` — after JWT verify, `Sentry.setUser({ id: clerkId })`
10. Pass `GIT_SHA` from CI: extend `.github/workflows/deploy-api.yml` to inject `--build-arg GIT_SHA=${{ github.sha }}`; consume in Dockerfile as `ENV GIT_SHA=...`

**Verification:**
- Add a temporary `throw new Error('sentry-test-' + Date.now())` to `/health` route, deploy, hit it once, verify it appears in Sentry within 30s with `service:api` tag, then revert.
- Same drill for worker: throw in `oauth-state-cleanup` handler stub.

**Rollback:** Remove `SENTRY_DSN` env var; `initSentry()` becomes a no-op.

---

### 9.2 Structured logs → Better Stack (1 h)

**Why:** docker stdout works for live debugging but is lost on container restart and impossible to search retrospectively.

**Choice:** **Better Stack** (formerly Logtail) — 1 GB/mo free, generous retention, native pino transport, simple query DSL.

**Files to change:**
- `apps/api/package.json` — add `@logtail/pino`
- `apps/api/src/lib/logger.ts` (NEW) — shared logger
- `apps/api/src/index.ts` — use shared logger in Fastify
- `apps/api/src/worker.ts` — use shared logger
- All `apps/api/src/routes/*.ts` and `apps/api/src/handlers/*.ts` — replace `console.log` and `request.log` with shared logger references where missing

**Steps:**
1. Sign up at https://betterstack.com/logs (free tier)
2. Create source: type **Node.js / pino**, name `socioply-api-prod`. Copy source token.
3. Add `LOGTAIL_TOKEN` to droplet `.env.production`, GitHub secrets, 1Password
4. `cd apps/api && pnpm add @logtail/pino`
5. Implement `apps/api/src/lib/logger.ts`:
   ```ts
   import pino from 'pino'

   const REDACT_PATHS = [
     'req.headers.authorization',
     'req.headers.cookie',
     '*.password',
     '*.encryptedKey',
     '*.accessToken',
     '*.refreshToken',
     '*.appPassword',
     '*.SENTRY_DSN',
     '*.LOGTAIL_TOKEN',
     '*.ENCRYPTION_KEY',
     '*.AWS_SECRET_ACCESS_KEY',
   ]

   const transports: pino.TransportTargetOptions[] = [
     { target: 'pino/file', options: { destination: 1 } },  // stdout (docker)
   ]

   if (process.env.LOGTAIL_TOKEN) {
     transports.push({
       target: '@logtail/pino',
       options: { sourceToken: process.env.LOGTAIL_TOKEN },
     })
   }

   export const logger = pino({
     level: process.env.LOG_LEVEL ?? 'info',
     redact: { paths: REDACT_PATHS, censor: '[REDACTED]' },
     transport: { targets: transports },
   })
   ```
6. In `apps/api/src/index.ts`, pass `logger` to Fastify: `Fastify({ logger })`
7. In `apps/api/src/worker.ts`, replace `console.log/error` with `logger.info/error`
8. Audit all routes/handlers — replace stray `console.log` with `request.log` or `logger`
9. Set up Better Stack alerts (in their UI):
   - **Alert: Critical errors** — query: `level >= 50` (pino error+) — frequency: any in 5 min — destination: email
   - **Alert: 5xx error rate** — query: `res.statusCode >= 500` — threshold: >5 in 1 min

**Verification:**
- Hit `/health` from your laptop
- Open Better Stack → Live tail → verify the request log shows up
- Search for `service:api AND res.statusCode:200`
- Verify redaction: trigger a 401 and confirm `authorization` field shows `[REDACTED]`

**Rollback:** Remove `LOGTAIL_TOKEN` env var; logger falls back to stdout-only.

**Cost:** Free at our volume (~50 MB/day = ~1.5 GB/mo, well under 1 GB cap if we keep `tracesSampleRate: 0.1` and don't log every health-check). If we exceed free tier, set `LOG_LEVEL=warn` in production to drop info logs.

---

### 9.3 Healthcheck depth + Better Uptime monitor (30 min)

**Why:** Current `/health` returns 200 even if Postgres is down or S3 is unreachable. We need an external pager that fires when the API is genuinely degraded.

**Files to change:**
- `apps/api/src/routes/health.ts` (currently inline in `index.ts`?) — split into `/health` (shallow) and `/health/deep` (full)
- DO NOT change `/health` (Caddy and Docker healthcheck still use it)

**Steps:**
1. Refactor `apps/api/src/index.ts` — extract health route into `apps/api/src/routes/health.ts`:
   ```ts
   import type { FastifyInstance } from 'fastify'
   import { prisma } from '@socioply/db'
   import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3'
   import { boss } from '../queues'

   const s3 = new S3Client({ region: process.env.S3_REGION })

   export async function healthRoutes(app: FastifyInstance) {
     app.get('/health', async () => ({ status: 'ok', ts: new Date().toISOString() }))

     app.get('/health/deep', async (req, reply) => {
       const checks = await Promise.allSettled([
         (async () => { const t0 = Date.now(); await prisma.$queryRaw`SELECT 1`; return Date.now() - t0 })(),
         (async () => { const t0 = Date.now(); await s3.send(new HeadBucketCommand({ Bucket: process.env.S3_BUCKET! })); return Date.now() - t0 })(),
         (async () => { return await boss.getQueueSize('publish') })(),
       ])

       const [db, s3check, queue] = checks
       const ok = checks.every(c => c.status === 'fulfilled')
       return reply.code(ok ? 200 : 503).send({
         status: ok ? 'ok' : 'degraded',
         db: db.status === 'fulfilled' ? { ok: true, latency_ms: db.value } : { ok: false, error: String((db as any).reason?.message) },
         s3: s3check.status === 'fulfilled' ? { ok: true, latency_ms: s3check.value } : { ok: false, error: String((s3check as any).reason?.message) },
         publish_queue_depth: queue.status === 'fulfilled' ? queue.value : null,
       })
     })
   }
   ```
2. Sign up for **Better Stack Uptime** (same account as Better Stack Logs — free tier: 10 monitors, 3-min interval)
3. Create monitor:
   - URL: `https://api.socioply.com/health`
   - Method: GET
   - Expected status: 200
   - Check interval: 3 min
   - Notification: email + (optional) SMS
4. Create second monitor for `https://api.socioply.com/health/deep` — alert if it returns 503 (degraded ≠ down, but alert anyway)
5. Add public status page (optional, free) at `status.socioply.com`

**Verification:**
- `curl https://api.socioply.com/health/deep` — verify shape + 200
- Stop the worker container temporarily — verify `publish_queue_depth: null` and `status: degraded`
- Block DB (e.g., temporarily change DB password): verify `db: {ok: false}` and 503

**Rollback:** Delete `/health/deep` route; uptime monitor still works against shallow `/health`.

---

### 9.4 Connection-budget monitor (30 min)

**Why:** §4 of the migration plan says we have a 22-connection budget. We need to know **before** we exhaust it, not after.

**Files to change:**
- `apps/api/src/handlers/pg-monitor.ts` (NEW)
- `apps/api/src/queues/index.ts` — register new queue `pg-conn-monitor`
- `apps/api/src/worker.ts` — schedule cron + register handler

**Steps:**
1. Create handler:
   ```ts
   // apps/api/src/handlers/pg-monitor.ts
   import * as Sentry from '@sentry/node'
   import { prisma } from '@socioply/db'
   import { logger } from '../lib/logger'

   const WARN = 16
   const CRIT = 20

   export async function pgMonitorHandler() {
     const rows = await prisma.$queryRaw<Array<{ state: string; count: bigint }>>`
       SELECT state, count(*) AS count
       FROM pg_stat_activity
       WHERE datname = 'socioply'
       GROUP BY state
     `
     const summary = Object.fromEntries(rows.map(r => [r.state ?? 'null', Number(r.count)]))
     const active = Number(rows.find(r => r.state === 'active')?.count ?? 0)
     const total = rows.reduce((acc, r) => acc + Number(r.count), 0)

     logger.info({ pg: summary, active, total }, 'pg connection snapshot')

     if (active >= CRIT) {
       Sentry.captureMessage(`pg active connections critical: ${active} (>= ${CRIT})`, 'error')
     } else if (active >= WARN) {
       Sentry.captureMessage(`pg active connections high: ${active} (>= ${WARN})`, 'warning')
     }
   }
   ```
2. Add queue constant + register:
   ```ts
   // apps/api/src/queues/index.ts
   export const QUEUES = { ..., PG_CONN_MONITOR: 'pg-conn-monitor' }
   ```
3. Wire in worker:
   ```ts
   // apps/api/src/worker.ts
   await boss.createQueue(QUEUES.PG_CONN_MONITOR)
   await boss.schedule(QUEUES.PG_CONN_MONITOR, '*/15 * * * *', {})  // every 15 min
   boss.work(QUEUES.PG_CONN_MONITOR, { teamSize: 1 }, pgMonitorHandler)
   ```

**Verification:**
- Watch droplet logs (`docker logs socioply-worker -f`) — see `pg connection snapshot` line every 15 min
- Manually trigger threshold: `tailscale ssh socioply@socioply-api-01 'docker exec socioply-worker node -e "require(\"./dist/handlers/pg-monitor\").pgMonitorHandler()"'`
- Verify Sentry breadcrumb appears

**Rollback:** Comment out the `boss.schedule` line — handler stops being invoked.

---

### 9.5 Weekly DB backup → S3 Glacier (45 min)

**Why:** DO Managed Postgres has daily snapshots, but they live on DO. If DO has a catastrophic failure or your DO account is compromised, your data is gone. Off-platform backups are the canonical answer.

**Files to change:**
- `apps/api/Dockerfile` — install `postgresql-client` in runtime stage
- `apps/api/src/handlers/db-backup.ts` (currently a stub) — implement real `pg_dump | gzip | upload`
- AWS Console — create new S3 bucket `socioply-backups` with lifecycle rules
- IAM — extend `socioply-app` policy to write to backups bucket

**Steps:**
1. **AWS Console:**
   - Create bucket `socioply-backups` in `us-east-1` (same region as `socioply-prod`)
   - Block all public access ✅
   - Default encryption: SSE-S3
   - Lifecycle rule:
     - **Rule 1 — "to-glacier-after-30d":** prefix `db/`, transition to `GLACIER_IR` after 30 days
     - **Rule 2 — "expire-after-7y":** prefix `db/`, expire after 2557 days
   - Versioning: enabled
2. **IAM update** — extend `socioply-app` user's inline policy:
   ```json
   {
     "Effect": "Allow",
     "Action": ["s3:PutObject", "s3:ListBucket"],
     "Resource": ["arn:aws:s3:::socioply-backups", "arn:aws:s3:::socioply-backups/*"]
   }
   ```
3. **Add `postgresql-client` to runtime stage of `apps/api/Dockerfile`:**
   ```dockerfile
   RUN apt-get update && apt-get install -y --no-install-recommends \
       postgresql-client-16 \
       && rm -rf /var/lib/apt/lists/*
   ```
4. **Implement handler:**
   ```ts
   // apps/api/src/handlers/db-backup.ts
   import { spawn } from 'node:child_process'
   import { Readable } from 'node:stream'
   import { Upload } from '@aws-sdk/lib-storage'
   import { S3Client } from '@aws-sdk/client-s3'
   import { logger } from '../lib/logger'

   const s3 = new S3Client({ region: process.env.S3_REGION })

   export async function dbBackupHandler() {
     const directUrl = process.env.DIRECT_URL
     if (!directUrl) throw new Error('DIRECT_URL required for backup')

     const date = new Date().toISOString().slice(0, 10)
     const key = `db/socioply-${date}.sql.gz`
     logger.info({ key }, 'starting db backup')

     // pg_dump | gzip
     const dump = spawn('pg_dump', ['--no-owner', '--no-acl', '--format=plain', directUrl])
     const gzip = spawn('gzip', ['-9'])
     dump.stdout.pipe(gzip.stdin)
     dump.stderr.on('data', d => logger.warn({ stderr: d.toString() }, 'pg_dump stderr'))

     const upload = new Upload({
       client: s3,
       params: {
         Bucket: 'socioply-backups',
         Key: key,
         Body: gzip.stdout as unknown as Readable,
         StorageClass: 'STANDARD',  // Lifecycle moves to Glacier
       },
     })

     await upload.done()
     logger.info({ key }, 'db backup complete')
   }
   ```
5. **Schedule:** already in worker (`db-backup` cron `0 3 * * 0` — Sunday 03:00 UTC). Verify it runs with the new handler, not the stub.
6. **Test manually:** `tailscale ssh socioply@socioply-api-01 'docker exec socioply-worker node -e "require(\"./dist/handlers/db-backup\").dbBackupHandler()"'`
7. **Verify:** `aws s3 ls s3://socioply-backups/db/` — see today's file
8. **Test restore (do this once for confidence):**
   - Download a recent backup
   - `gunzip -c socioply-2026-04-30.sql.gz | head -100` — verify it's a valid SQL dump
   - `psql -h localhost test_restore_db -f restored.sql` (against a local Postgres) — verify it parses

**Verification:**
- Backup runs Sunday 03:00 UTC
- File appears in S3 within 5 min
- After 30 days, Storage class shows `GLACIER_IR`

**Rollback:** Revert the handler back to the stub. The S3 bucket and IAM policy can stay (free if empty).

**Cost:** ~$0.02/mo for ~50 MB weekly dumps in Standard, dropping to Glacier IR pricing after 30 days.

---

### 9.6 Rate-limit middleware (1 h)

**Why:** A single user (or compromised Clerk session) could fire 10,000 LLM requests in a minute, costing hundreds of dollars in OpenAI/Anthropic spend before you notice.

**Choice:** `@fastify/rate-limit` — battle-tested, works in-memory (fine for single-droplet — revisit at scale-out).

**Files to change:**
- `apps/api/package.json` — add `@fastify/rate-limit`
- `apps/api/src/index.ts` — register plugin
- Optionally: `apps/api/src/lib/rate-limit-keys.ts` (NEW) — key derivation helpers

**Steps:**
1. `cd apps/api && pnpm add @fastify/rate-limit`
2. Register in `apps/api/src/index.ts` (after `@clerk/backend` middleware setup):
   ```ts
   import rateLimit from '@fastify/rate-limit'

   await app.register(rateLimit, {
     global: false,  // opt-in per route
     keyGenerator: (req) => (req as any).clerkId ?? req.ip,
     errorResponseBuilder: (req, ctx) => ({
       statusCode: 429,
       error: 'Too Many Requests',
       message: `Rate limit exceeded. Try again in ${ctx.after}.`,
     }),
   })
   ```
3. Apply to AI routes per-route:
   ```ts
   app.post('/ai/generate', {
     config: {
       rateLimit: { max: 30, timeWindow: '1 minute' },  // per Clerk userId
     },
   }, generateHandler)

   app.post('/ai/analyze-writing-style', {
     config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
   }, analyzeHandler)

   app.post('/images/generate', {
     config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
   }, imageGenerateHandler)
   ```
4. **Per-IP global cap** as defense against unauthenticated attackers:
   ```ts
   await app.register(rateLimit, {
     max: 1000,            // 1000 reqs/min per IP, all routes
     timeWindow: '1 minute',
     keyGenerator: (req) => req.ip,
   })
   ```

**Verification:**
- Use a script to fire 50 `POST /ai/generate` in 10 seconds with valid auth → expect first 30 to succeed, rest return 429
- Verify 429 responses still hit Sentry breadcrumb (not error)

**Rollback:** Remove `config.rateLimit` from each route, or unregister plugin.

**Future:** When we add a second droplet (Stage 4 in DB scaling), swap to Redis-backed limiter (`rate-limit-redis`).

---

### 9.7 pg-boss admin UI (Tailscale-only) (45 min)

**Why:** Right now, inspecting queue state requires SSHing in and running raw SQL. We want a dashboard.

**Choice:** Bundled HTML page served by Fastify, bound to `127.0.0.1` only, accessed via Tailscale SSH port-forward.

**Files to change:**
- `apps/api/src/routes/admin.ts` (NEW)
- `apps/api/src/index.ts` — register admin routes ONLY when `process.env.ADMIN_ENABLED === 'true'`
- `/opt/socioply/docker-compose.yml` — expose port 3002 to localhost only

**Steps:**
1. Create handler that serves a single HTML page polling JSON endpoints:
   ```ts
   // apps/api/src/routes/admin.ts
   import type { FastifyInstance } from 'fastify'
   import { boss } from '../queues'
   import { prisma } from '@socioply/db'

   const QUEUES = ['publish', 'publish-scheduled', 'analytics-sync', 'image-generate',
                   'oauth-state-cleanup', 'db-backup', 'pg-conn-monitor']

   export async function adminRoutes(app: FastifyInstance) {
     app.get('/admin', async (_, reply) => {
       reply.type('text/html').send(/* inline HTML here — see below */)
     })

     app.get('/admin/queues.json', async () => {
       const data = await Promise.all(QUEUES.map(async (name) => ({
         name,
         size: await boss.getQueueSize(name).catch(() => -1),
       })))
       return { queues: data, ts: new Date().toISOString() }
     })

     app.get('/admin/recent-failures.json', async () => {
       const rows = await prisma.$queryRaw`
         SELECT name, state, output, "completedOn", "createdOn"
         FROM pgboss.job
         WHERE state = 'failed'
         ORDER BY "completedOn" DESC NULLS LAST
         LIMIT 25
       `
       return { failures: rows }
     })

     app.get('/admin/pg-stats.json', async () => {
       const rows = await prisma.$queryRaw`
         SELECT state, count(*) AS count
         FROM pg_stat_activity WHERE datname = 'socioply'
         GROUP BY state
       `
       return { pg: rows }
     })
   }
   ```
2. Inline HTML is a single file with vanilla JS that polls the three JSON endpoints every 5s and renders tables. ~50 lines.
3. In `apps/api/src/index.ts`:
   ```ts
   if (process.env.ADMIN_ENABLED === 'true') {
     await app.register(adminRoutes)
     // bind to 127.0.0.1 only (set in Fastify listen options)
   }
   ```
4. Modify `apps/api/src/index.ts` listen call: `await app.listen({ port: 3001, host: '0.0.0.0' })`. The admin routes are exposed on the same Fastify instance but Caddy only proxies `/api/*` — so `/admin` is not externally reachable.
5. Add `ADMIN_ENABLED=true` to droplet's `.env.production`
6. Confirm via Caddyfile that `/admin*` is **not** in the proxy whitelist (or explicitly deny it). Update Caddyfile:
   ```caddy
   api.socioply.com {
     handle /admin* { respond 403 }
     handle { reverse_proxy api:3001 }
   }
   ```

**Access flow:**
1. From your Mac: `tailscale ssh socioply@socioply-api-01 -L 3001:localhost:3001`
2. Open `http://localhost:3001/admin` in browser
3. See live queue depths, recent failures, PG stats

**Verification:**
- Verify `curl https://api.socioply.com/admin` → 403
- Verify Tailscale SSH port-forward → admin loads correctly

**Rollback:** Set `ADMIN_ENABLED=false` and restart container.

---

### 9.8 Secrets hygiene audit (20 min)

**Why:** Now is the time to verify nothing leaked.

**Steps:**
1. Verify droplet `.env.production` permissions:
   ```bash
   tailscale ssh socioply@socioply-api-01 'stat /opt/socioply/.env.production'
   # Expect: Access (0640) Uid: root Gid: docker
   ```
   If wrong: `sudo chown root:docker /opt/socioply/.env.production && sudo chmod 0640 /opt/socioply/.env.production`
2. Verify `.gitignore` excludes all env files:
   ```
   .env
   .env.*
   !.env.example
   ```
3. Search git history for accidentally committed secrets:
   ```bash
   git log -p --all | grep -E "(sk-|sk_live|sk_test|whsec|AKIA|ENCRYPTION_KEY|LOGTAIL_TOKEN|SENTRY_DSN)" | head
   ```
   If any hits with real values, rotate those secrets immediately.
4. Verify pino redact list (in 9.2's `logger.ts`) covers every secret-like field name in your codebase:
   ```bash
   rg -i "password|token|secret|key|dsn|encryptedKey" apps/api/src --type ts | head -50
   ```
   Add anything missing to `REDACT_PATHS`.
5. Add a CI check: `npm i -D @secretlint/secretlint-rule-preset-recommend secretlint` and run on every PR.

**Rollback:** N/A — this is verification, not a change.

---

### 9.9 Runbook documentation (30 min)

**Why:** When something breaks at 2 AM in three months, you (or future you) need a checklist, not detective work.

**File to create:** `.documentation/runbook.md`

**Sections to write:**

```markdown
# Production Runbook — Socioply

## Where things live
- Frontend: Vercel (app.socioply.com, www.socioply.com)
- API + Worker: DO Droplet socioply-api-01 (api.socioply.com)
- Database: DO Managed Postgres azavea-omniply-db
- Object storage: AWS S3 socioply-prod + CloudFront cdn.socioply.com
- Backups: AWS S3 socioply-backups
- Logs: Better Stack (link)
- Errors: Sentry (link to project)
- Uptime: Better Stack Uptime (link)
- Code: github.com/veitmehler/lever_cast

## Daily checks (5 min)
- [ ] Sentry: any new high-frequency errors?
- [ ] Better Stack Uptime: any outages in last 24h?
- [ ] Admin UI: queue depths sustained <10?

## Common incidents

### "API is returning 500s"
1. Check Sentry → Issues sorted by `Last Seen`
2. SSH to droplet: `tailscale ssh socioply@socioply-api-01`
3. `docker logs socioply-api --tail 100`
4. If recently deployed: roll back: `cd /opt/socioply && DEPLOY_TAG=previous docker compose up -d`

### "Worker is stuck"
1. Open admin UI → check queue depths
2. `docker logs socioply-worker --tail 100`
3. If single queue stuck, investigate the handler. If broad, restart worker: `docker compose restart worker`

### "Database connection errors"
1. Check `/health/deep` → `db.ok`?
2. SSH to droplet, run pg-stat-activity check from admin UI
3. If pool exhausted: `tailscale ssh socioply@socioply-api-01 'docker compose restart api worker'`
4. If sustained, follow Stage 1 in DB scaling guide (bump teamSize) or upgrade DB tier

### "DigitalOcean is down"
1. Check https://status.digitalocean.com
2. Vercel frontend keeps serving (no DB-write features)
3. Wait. Worker jobs durable in pg-boss; will resume on recovery.

### "Need to restore from backup"
1. List available backups: `aws s3 ls s3://socioply-backups/db/`
2. Download: `aws s3 cp s3://socioply-backups/db/socioply-2026-04-30.sql.gz ./`
3. `gunzip socioply-2026-04-30.sql.gz`
4. Connect to a fresh DB: `psql -h ... -U doadmin -d new_db -f socioply-2026-04-30.sql`
5. Update DATABASE_URL/DIRECT_URL on droplet, restart containers

### "OAuth flow broken for platform X"
1. Check that platform's developer console — credentials still active?
2. Check Sentry filtered by `platform:linkedin` (etc.)
3. Verify redirect URIs match `https://api.socioply.com/social/X/callback`
4. Manually delete stale `oauth_states` rows older than 1 hour

## How to deploy
- Push to `main` → auto-deploys (see `.github/workflows/deploy-api.yml`)
- Manual: `tailscale ssh socioply@socioply-api-01 'cd /opt/socioply && docker compose pull && docker compose up -d'`

## How to rollback
- Auto: deploy includes auto-rollback on failed health check
- Manual: `tailscale ssh ... 'cd /opt/socioply && DEPLOY_TAG=previous docker compose up -d'`

## How to scale up the database
- Stage 1: in `apps/api/src/worker.ts`, bump `article-pipeline.teamSize` 5→8
- Stage 2: DO Console → Database → Resize → `db-s-1vcpu-2gb` (5 min downtime)
- Stage 3: add read replica, route analytics reads to `DATABASE_URL_RO`
```

**Rollback:** N/A — documentation only.

---

## 4. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Sentry rate limit hit during loud incident | Low | Low | Free tier = 5k events/mo; upgrade if needed |
| Better Stack ingest exceeds 1 GB/mo | Medium | Low | Set `LOG_LEVEL=warn` in production |
| `pg_dump` fails inside container | Medium | Medium | Test manually first; capture stderr to Sentry |
| Rate limiter rejects legitimate users | Medium | Medium | Start generous (100/min); tighten based on usage data |
| Admin UI accidentally exposed publicly | Low | Critical | Caddy `respond 403` rule + bind to localhost only |
| Backup restore actually broken | Low | Critical | **Test the restore once before relying on backups** |
| Sentry release tag missing → can't tell which deploy broke things | Low | Medium | Inject `GIT_SHA` via Docker build arg |

---

## 5. Time & Cost Summary

| Sub-phase | Time |
|---|---|
| 9.1 Sentry on apps/api | 30 min |
| 9.2 Structured logs → Better Stack | 1 h |
| 9.3 Healthcheck depth + Better Uptime | 30 min |
| 9.4 Connection-budget monitor | 30 min |
| 9.5 Weekly DB backup → S3 | 45 min |
| 9.6 Rate-limit middleware | 1 h |
| 9.7 pg-boss admin UI | 45 min |
| 9.8 Secrets hygiene audit | 20 min |
| 9.9 Runbook documentation | 30 min |
| **Total** | **~6.0 h** (add 1–2 h buffer for unexpected) |

**Cost increment:**
| Tool | Cost |
|---|---|
| Sentry | $0 (free tier: 5k errors/mo) |
| Better Stack Logs | $0 (free tier: 1 GB/mo) |
| Better Stack Uptime | $0 (free tier: 10 monitors) |
| AWS S3 backups | ~$0.02/mo |
| `@fastify/rate-limit` | $0 (in-memory) |
| `@sentry/node`, `@sentry/profiling-node`, `@logtail/pino` | $0 (npm) |
| Postgres-client in Docker image | +~30 MB image size; $0 in registry storage |
| **Total** | **~$0.02/mo** |

---

## 6. Implementation Order Cheat Sheet

```
Day 1 (3–4 hours):
  9.1 Sentry on apps/api               [30 min]
  9.2 Better Stack logs                [60 min]
  9.3 Healthcheck depth + uptime       [30 min]
  Verify: errors visible, logs searchable, alerts fire

Day 2 (3–4 hours):
  9.4 Connection-budget monitor        [30 min]
  9.5 Weekly DB backup                 [45 min]
  9.6 Rate-limit middleware            [60 min]
  9.7 pg-boss admin UI                 [45 min]
  9.8 Secrets hygiene audit            [20 min]
  9.9 Runbook documentation            [30 min]
  Verify: all success criteria met
```

---

## 7. Definition of Done

Phase 9 is complete when, in a single session:

1. ☐ All success criteria in §0 verified
2. ☐ A test error in `apps/api` appears in Sentry within 60s
3. ☐ A test log line searchable in Better Stack within 60s
4. ☐ Stopping `socioply-api` triggers email alert within 5 min
5. ☐ Backup file exists in `s3://socioply-backups/db/`
6. ☐ 31st request in 60s to `/ai/generate` returns 429
7. ☐ Admin UI accessible via Tailscale SSH port-forward, blocked publicly
8. ☐ `.env.production` is mode 0640
9. ☐ `.documentation/runbook.md` committed to repo
10. ☐ All sub-phase rollback procedures documented and known
