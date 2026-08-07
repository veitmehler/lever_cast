# Manual Deploy Runbook — GitHub Actions bypass over Tailscale

**Proven in production 2026-08-06** (GitHub Actions major outage; used twice
same-day for staging + prod). Replays the deploy workflows' own scripts
verbatim from a local shell — the droplets and GHCR end in exactly the state
an Actions deploy would produce, so recovery requires no reconciliation.

## When to use

- GitHub Actions is down/degraded (check https://www.githubstatus.com) but
  Git, the API, and Packages (GHCR) are operational.
- A deploy is urgent and the queued run isn't starting.

**Not for**: routine deploys (the pipeline exists for a reason), or times
when you can simply wait — a queued run that later fires will redeploy the
same SHA and recreate containers behind your back, so cancel superseded runs
(`gh run cancel <id>`) if you go manual.

## Access

SSH goes over **Tailscale**, never the public IPs (firewalled):

| Droplet | Tailscale IP | MagicDNS | Compose dir | Image tag |
|---|---|---|---|---|
| prod `socioply-api-01` | 100.73.132.17 | socioply-api-01 | /opt/socioply | `lever_cast-api:latest` |
| staging `socioply-api-staging-01` | 100.72.17.10 | socioply-api-staging-01 | /opt/socioply-staging | `lever_cast-api:staging` |

User `socioply`. The **prod droplet does the building** (2 vCPU/3.8GB;
staging's 1 vCPU/2GB is too tight beside its containers) and its docker
login can PUSH to GHCR.

## Procedure

1. **Ship the exact committed tree** (never the working dir):
   ```bash
   SHA=$(git rev-parse <branch>)
   ssh socioply@100.73.132.17 "rm -rf /tmp/opbuild && mkdir -p /tmp/opbuild"
   git archive "$SHA" | ssh socioply@100.73.132.17 "tar -x -C /tmp/opbuild"
   ```
2. **Build on the prod droplet** (cache-warm rebuilds ≈ 1 min; cold ≈ 15 min):
   ```bash
   ssh socioply@100.73.132.17 'cd /tmp/opbuild && DOCKER_BUILDKIT=1 \
     docker build -f apps/api/Dockerfile --build-arg GIT_SHA=<SHA> -t opfix:build .'
   ```
3. **Tag + push** — set rollback tags FIRST, mirror the workflow's tag set:
   ```bash
   docker tag ghcr.io/veitmehler/lever_cast-api:latest  ghcr.io/veitmehler/lever_cast-api:previous
   docker tag ghcr.io/veitmehler/lever_cast-api:staging ghcr.io/veitmehler/lever_cast-api:staging-previous
   docker tag opfix:build ghcr.io/veitmehler/lever_cast-api:latest      # prod (only if deploying prod)
   docker tag opfix:build ghcr.io/veitmehler/lever_cast-api:staging     # staging
   docker push <each pushed tag>
   ```
4. **In-flight gate on the TARGET droplet** (same query the workflow runs —
   container recreation kills running generation work):
   ```bash
   docker compose exec -T api node -e "const{prisma}=require('@omniply/shared');(async()=>{
     const r=await prisma.socialAutomationRun.count({where:{status:{in:['pending','processing','scheduling']}}});
     const j=await prisma.articleJob.count({where:{status:'in_progress'}});
     console.log(r+j)})()"
   # must print 0 — otherwise WAIT
   ```
5. **Deploy** (in the target's compose dir):
   ```bash
   docker compose pull
   docker compose run --rm -T --no-deps api npx prisma migrate deploy \
     --schema=/app/packages/db/prisma/schema.prisma < /dev/null
   # PROD ONLY — the seed step (create-only, admin-edit-safe):
   docker compose run --rm -T --no-deps api /app/node_modules/.bin/tsx \
     /app/packages/db/prisma/seed.ts < /dev/null
   docker compose up -d --remove-orphans
   docker image prune -f
   sleep 10 && curl -sf <health>   # prod: https://api.socioply.com/health
                                   # staging: http://127.0.0.1:3001/health (on-droplet)
   ```
   Health fails → roll back: `DEPLOY_TAG=previous docker compose up -d --remove-orphans`
   (staging: `DEPLOY_TAG=staging-previous`).
6. **Prompt pushes** (when the deploy carries prompt-copy changes): the image
   ships `packages/db/scripts/push-agent-prompts.ts` — run in-container:
   ```bash
   docker compose run --rm -T --no-deps api /app/node_modules/.bin/tsx \
     /app/packages/db/scripts/push-agent-prompts.ts <key> [key...] < /dev/null
   ```
   For a prompt-only change without a rebuilt image, `docker compose cp` the
   updated `agent-prompts.ts` into the running container first.

## Gotchas learned the hard way

- The public droplet IPs time out on SSH — that's the firewall, not an
  outage. Tailscale or nothing.
- `gh run list` immediately after a push can grab the PREVIOUS run — always
  verify `headSha`.
- Runs cancelled with zero executed steps = the outage, not your workflow.
- Docs-only pushes don't trigger deploys (paths filters) and therefore also
  can't cancel an in-flight run's concurrency group — safe during a deploy.
- After recovery, check `gh run list` for queued/zombie runs before assuming
  the pipeline state; nothing should redeploy behind your back.
