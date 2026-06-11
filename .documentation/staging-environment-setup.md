# Staging Environment Setup

One-time setup for the staging deploy path that validates connectivity-sensitive
changes (Phase 2: Postgres-scoped TLS, WordPress SSRF guard) against real
infrastructure **before** they reach production.

## Isolation guarantees

The staging path shares nothing mutable with production:

| | Production | Staging |
|---|---|---|
| Workflow | `.github/workflows/deploy-api.yml` (push to `main`) | `.github/workflows/deploy-api-staging.yml` (push to `staging` / manual) |
| Image tag | `:latest` | `:staging` (+ `:staging-<sha>`) |
| Droplet path | `/opt/socioply` | `/opt/socioply-staging` |
| Env file | `.env.production` | `.env.staging` |
| Secrets | `DROPLET_PUBLIC_IP`, `DEPLOY_SSH_KEY` | `STAGING_DROPLET_PUBLIC_IP`, `STAGING_DEPLOY_SSH_KEY`, `STAGING_HEALTH_URL` |
| Database | prod DO Postgres | **separate** staging DO Postgres |

The staging workflow never builds or pushes `:latest`, so production (which pulls
`:latest`) cannot be affected by a staging deploy.

## One-time provisioning

### 1. Staging database

Create a separate DO managed Postgres (or a fork/snapshot of the prod cluster —
**never point staging at the production database**). Note the pooled and direct
connection strings.

### 2. Staging droplet

Either a dedicated droplet or a separate compose project on an existing host. If
co-hosting with production on one droplet, change the api port (`3001` → e.g.
`3002`) and the Caddy domain in the staging templates to avoid clashes; a
dedicated droplet is cleaner.

Install Docker + the compose plugin, then:

```bash
sudo mkdir -p /opt/socioply-staging
# Copy the repo templates onto the droplet:
#   docker-compose.staging.yml  -> /opt/socioply-staging/docker-compose.yml
#   Caddyfile.staging           -> /opt/socioply-staging/Caddyfile
```

Create the `socioply` deploy user (matching the prod workflow's SSH user) and
authorize the staging deploy SSH key for it.

### 3. `.env.staging` on the droplet

Create `/opt/socioply-staging/.env.staging` (owned `root:docker`, mode `0640`).
The simplest correct approach is to **copy the production `.env.production` and
change only the values that must differ for staging**:

- `DATABASE_URL` → staging pooled connection
- `DIRECT_URL` (and `PGBOSS_DATABASE_URL` if set) → staging direct connection
- `NEXT_PUBLIC_*` / domain / callback URLs → staging hostnames (if used)
- Optionally a separate `ENCRYPTION_KEY` for staging (keep prod's if you want to
  decrypt copied rows)
- `ADMIN_BASIC_USER` / `ADMIN_BASIC_PASS` (Phase 1 L2) if you enable the admin UI

Everything else (Clerk secret, S3, Sentry/Logtail, AI provider keys, `NODE_ENV`,
`PORT`) can mirror production. Keep all secrets in this file — never in the image
or git.

### 4. DNS + TLS

Point a staging hostname (e.g. `staging-api.socioply.com`) at the staging droplet
IP. Caddy will auto-provision a TLS cert on first start. Update the domain in
`/opt/socioply-staging/Caddyfile` to match.

### 5. GitHub repository secrets

Add under **Settings → Secrets and variables → Actions**:

- `STAGING_DROPLET_PUBLIC_IP` — staging droplet IP
- `STAGING_DEPLOY_SSH_KEY` — private key for the staging `socioply` deploy user
- `STAGING_HEALTH_URL` — e.g. `https://staging-api.socioply.com/health`

## Deploying to staging

**Option A — push the `staging` branch:**

```bash
git push origin <your-branch>:staging --force-with-lease
```

**Option B — manual dispatch (any branch/SHA):**

GitHub → Actions → "Deploy API (Staging)" → Run workflow → enter the branch or SHA.

Either path builds the `:staging` image, runs migrations against the **staging**
DB, restarts the staging containers, and health-checks `STAGING_HEALTH_URL`. On
health failure it auto-rolls-back to `:staging-previous`.

## How this supports Phase 2

- **H1 (Postgres-scoped TLS):** the staging deploy's migrate step currently mirrors
  prod's inline `NODE_TLS_REJECT_UNAUTHORIZED=0`. The H1 change will replace that
  with a pinned Postgres CA so TLS verification stays on process-wide. Deploy H1 to
  staging first and confirm: (a) the API + worker connect to Postgres, (b) pg-boss
  starts, (c) `/health` passes — before merging to `main`.
- **H2 (SSRF guard):** point a staging WordPress connection at an internal/loopback
  address and confirm it is rejected, while a real external WordPress host still
  verifies.

## Rollback

The staging stack rolls back automatically on a failed health check. To roll back
manually on the droplet:

```bash
cd /opt/socioply-staging
DEPLOY_TAG=staging-previous docker compose up -d --remove-orphans
```
