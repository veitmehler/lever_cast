# Production Runbook — Socioply / Levercast

> Last updated: Phase 9 (Hardening & Observability)

---

## Where Things Live

| Component | Location | URL / Access |
|---|---|---|
| Frontend | Vercel | `app.socioply.com`, `www.socioply.com` |
| API + Worker | DO Droplet `socioply-api-01` | `api.socioply.com` |
| Database | DO Managed Postgres `azavea-omniply-db` | Port 25061 (pool), 25060 (direct) |
| Object storage | AWS S3 `socioply-images-prod` | `cdn.socioply.com` |
| DB Backups | AWS S3 `socioply-backups` | `db/socioply-YYYY-MM-DD.sql.gz` |
| Logs | Better Stack | https://betterstack.com/logs |
| Errors | Sentry `socioply-api` project | https://sentry.io |
| Uptime | Better Stack Uptime | https://betterstack.com/uptime |
| Code | GitHub | https://github.com/veitmehler/lever_cast |
| Container registry | GHCR | `ghcr.io/veitmehler/lever_cast-api:latest` |

---

## Access

### SSH to droplet (admin)
```bash
tailscale ssh socioply@socioply-api-01
```

### Admin UI (queue depths / failures / pg stats)
```bash
tailscale ssh socioply@socioply-api-01 -L 3001:localhost:3001
# Then open: http://localhost:3001/admin
```

### Database (direct admin connection)
```bash
psql "$DIRECT_URL"   # from .env.do or 1Password
```

---

## Daily Checks (5 min)

- [ ] **Sentry** → Issues sorted by Last Seen. Any new high-frequency errors?
- [ ] **Better Stack Uptime** → Any outages / slowdowns in last 24h?
- [ ] **Admin UI** → Queue depths all <10? Any failed jobs?
- [ ] **Docker status on droplet**: `tailscale ssh socioply@socioply-api-01 'docker compose -f /opt/socioply/docker-compose.yml ps'`

---

## Common Incidents

### "API is returning 500s"

1. Check Sentry → Projects → `socioply-api` → Issues sorted by `Last Seen`
2. SSH to droplet:
   ```bash
   tailscale ssh socioply@socioply-api-01
   docker logs socioply-api --tail 100
   ```
3. If the error is a deploy regression:
   ```bash
   cd /opt/socioply
   DEPLOY_TAG=previous docker compose up -d --remove-orphans
   ```
4. Fix in code, push to `main` — auto-deploy handles the rest.

---

### "Worker is crashing / jobs not running"

1. Open Admin UI → check queue depths (rising = worker stuck)
2. SSH:
   ```bash
   docker logs socioply-worker --tail 100
   ```
3. Restart worker only (safe — pg-boss jobs are durable in Postgres):
   ```bash
   cd /opt/socioply && docker compose restart worker
   ```
4. If crash loop (exit code 1), check Sentry for `service:worker` errors.

---

### "Database connection errors"

1. Check `/health/deep`: `curl https://api.socioply.com/health/deep`
   - Look at `db.ok` and `db.error` fields
2. If pool exhausted, open Admin UI → PG Connections table
3. Emergency relief (restart frees idle connections):
   ```bash
   cd /opt/socioply && docker compose restart api worker
   ```
4. If sustained `active > 18` alerts from Sentry:
   - **Stage 1:** lower `teamSize` for `article-pipeline` in `worker.ts` (5→3), deploy
   - **Stage 2:** resize DB to `db-s-1vcpu-2gb` in DO console (~5 min downtime, single click)

---

### "DigitalOcean is down"

1. Check https://status.digitalocean.com
2. Vercel frontend keeps serving (static assets, sign-in page load)
3. Any features requiring the API (AI generation, publishing) will fail gracefully with network errors
4. pg-boss jobs are durable — queued jobs survive and will execute on recovery
5. Wait for DO recovery; no action required unless outage > 4h

---

### "S3 / CDN images not loading"

1. Check `curl https://api.socioply.com/health/deep` → `s3.ok`
2. Check AWS Console → CloudFront distribution status
3. If CloudFront is down, images still directly in S3 (private, but can generate signed URLs for emergency access)
4. If S3 bucket ACL / OAC changed accidentally, re-apply Origin Access Control in CloudFront console

---

### "Need to restore the database from backup"

1. List available backups:
   ```bash
   aws s3 ls s3://socioply-backups/db/
   ```
2. Download the target backup:
   ```bash
   aws s3 cp s3://socioply-backups/db/socioply-YYYY-MM-DD.sql.gz ./
   gunzip socioply-YYYY-MM-DD.sql.gz
   ```
3. Restore to a fresh DB (DO Console → Create Cluster, or restore in-place):
   ```bash
   psql -h <new-host> -U doadmin -d socioply -f socioply-YYYY-MM-DD.sql
   ```
4. Update `DATABASE_URL` / `DIRECT_URL` in `/opt/socioply/.env.production`
5. Restart containers: `docker compose up -d --remove-orphans`

> **Note:** DO Managed Postgres also has daily automated snapshots (point-in-time recovery available through the DO console). Use S3 backups only if the DO cluster itself is unrecoverable.

---

### "OAuth flow broken for a platform"

1. Check the platform's developer console — credentials still active?
2. Verify redirect URI: must be `https://api.socioply.com/social/<platform>/callback`
3. Check Sentry for errors tagged with the platform name
4. Clear stale OAuth state rows if needed:
   ```sql
   DELETE FROM oauth_states WHERE expires_at < NOW();
   ```

---

### "Rate-limited users complaining about 429s"

The per-user rate limits (set in Phase 9) are:
- `/api/ai/generate`: 30 req/min
- `/api/ai/analyze-writing-style`: 10 req/min
- `/api/images/generate`: 10 req/min
- Global per-IP: 1000 req/min

If a legitimate user is hitting limits, adjust the limits in `apps/api/src/routes/ai.ts` and `images.ts`, deploy.

---

## How to Deploy

**Automatic (standard):** Push to `main` → GitHub Actions builds image → SSHs to droplet → pulls image → runs migrations → restarts containers → health check.

**Manual (emergency):**
```bash
tailscale ssh socioply@socioply-api-01
cd /opt/socioply
docker compose pull
docker compose up -d --remove-orphans
```

---

## How to Rollback

**Automatic:** The deploy workflow auto-rolls back to `:previous` tag on health check failure.

**Manual:**
```bash
tailscale ssh socioply@socioply-api-01
cd /opt/socioply
DEPLOY_TAG=previous docker compose up -d --remove-orphans
```

The `:previous` tag is the image running before the last deploy. It's re-tagged on every successful deploy, so it's always one version behind.

---

## How to Scale Up the Database

| Signal | Action |
|---|---|
| `pg_stat_activity.active` sustains > 16 | Lower `article-pipeline` teamSize in worker.ts (5→3), deploy |
| Still hitting > 16 after teamSize reduction | Resize to `db-s-1vcpu-2gb` in DO console ($30/mo, ~5 min downtime) |
| Read-heavy analytics slowing writes | Add read-only replica, route analytics reads to `DATABASE_URL_RO` |

---

## Secrets Inventory

All secrets live in **1Password** and in **two** places in production:

| Secret | GitHub Actions | DO `.env.production` | Vercel |
|---|---|---|---|
| `DEPLOY_SSH_KEY` | ✅ | — | — |
| `DROPLET_PUBLIC_IP` | ✅ | — | — |
| `GHCR_TOKEN` / `GITHUB_TOKEN` | auto | — | — |
| `SENTRY_DSN` | — | ✅ | ✅ |
| `LOGTAIL_TOKEN` | — | ✅ | — |
| `DATABASE_URL` | — | ✅ | ✅ |
| `DIRECT_URL` | — | ✅ | ✅ |
| `CLERK_SECRET_KEY` | — | ✅ | ✅ |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | — | ✅ | ✅ |
| `ENCRYPTION_KEY` | — | ✅ | ✅ |
| `ACCESS_KEY_ID` / `SECRET_ACCESS_KEY` | — | ✅ | ✅ |
| `S3_BUCKET` / `S3_REGION` / `CDN_BASE` | — | ✅ | ✅ |
| `S3_BACKUP_BUCKET` | — | ✅ | — |

**Verify permissions on droplet:**
```bash
tailscale ssh socioply@socioply-api-01 'stat /opt/socioply/.env.production'
# Expect: Access: (0640/-rw-r-----) Uid: (0/root) Gid: (docker or socioply)
```

If wrong: `sudo chown root:docker /opt/socioply/.env.production && sudo chmod 0640 /opt/socioply/.env.production`

---

## Phase 9 — Manual Steps Still Required After Deploy

The code is deployed via CI. The following **5 manual steps** must be completed to activate all Phase 9 features:

### Step 1 — Create Sentry project and set `SENTRY_DSN`
1. Create project at https://sentry.io → **Node.js** → name `socioply-api`
2. Copy DSN
3. SSH to droplet: `tailscale ssh socioply@socioply-api-01`
4. `sudo nano /opt/socioply/.env.production` → add line: `SENTRY_DSN=https://...@sentry.io/...`
5. `docker compose restart api worker`

### Step 2 — Create Better Stack source and set `LOGTAIL_TOKEN`
1. Sign up at https://betterstack.com/logs
2. Create source: type **Node.js / pino**, name `socioply-api-prod`
3. Copy source token
4. SSH to droplet → `sudo nano /opt/socioply/.env.production` → add: `LOGTAIL_TOKEN=<token>`
5. `docker compose restart api worker`

### Step 3 — Set up Better Stack uptime monitors
1. Go to https://betterstack.com/uptime → New Monitor
2. Monitor 1: `https://api.socioply.com/health` — interval 3 min — alert: email
3. Monitor 2: `https://api.socioply.com/health/deep` — interval 5 min — alert: email on 503

### Step 4 — Create AWS S3 backup bucket and set `S3_BACKUP_BUCKET`
1. AWS Console → S3 → Create bucket `socioply-backups` (same region as prod bucket)
   - Block all public access ✅
   - Default encryption: SSE-S3 ✅
   - Versioning: enabled ✅
2. Add lifecycle rule: prefix `db/` → transition to `GLACIER_IR` after 30 days, expire after 7 years
3. Extend `socioply-app` IAM policy to allow `s3:PutObject` + `s3:ListBucket` on `arn:aws:s3:::socioply-backups/*`
4. SSH to droplet → `sudo nano /opt/socioply/.env.production` → add: `S3_BACKUP_BUCKET=socioply-backups`
5. `docker compose restart worker`
6. Verify backup works: `docker exec socioply-worker node -e "require('./dist/handlers/backup').dbBackupHandler([{}])"`
7. Check: `aws s3 ls s3://socioply-backups/db/`

### Step 5 — Enable admin UI
1. SSH to droplet → `sudo nano /opt/socioply/.env.production` → add: `ADMIN_ENABLED=true`
2. Update Caddyfile to block `/admin*` externally:
   ```
   api.socioply.com {
     handle /admin* { respond 403 }
     handle { reverse_proxy api:3001 }
   }
   ```
3. `docker compose restart caddy api`
4. Test external block: `curl https://api.socioply.com/admin` → should return 403
5. Test Tailscale access: `tailscale ssh socioply@socioply-api-01 -L 3001:localhost:3001` → open `http://localhost:3001/admin`
