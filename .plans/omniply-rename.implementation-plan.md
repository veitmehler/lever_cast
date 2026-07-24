# Socioply → Omniply Migration Plan

**Locked decisions (user, 2026-07-25):** brand = Omniply (aligns with the GHL whitelabel);
vertical slug = `chiro`; prod web `chiro.omniply.io`, staging web `staging.chiro.omniply.io`;
platform services on the root: `api.omniply.io`, `staging-api.omniply.io`, `cdn.omniply.io`;
whitelabel portal `crm.omniply.io` (exists); repo: old `omniply` → `omniply-2025-backup`,
then this repo → `omniply`; internal package scope `@socioply/*` → `@omniply/*` (full rename);
all email sender identities move to omniply.io. DNS = Cloudflare, user-controlled.
Multi-vertical future: one repo → one Vercel project PER vertical (same repo, per-project
env + domains); `NEXT_PUBLIC_VERTICAL=chiro` from day one; vertical-as-data-dimension
(Option 2) deferred until a second vertical is real.

**Why now:** zero real clients, and the marketplace app / Google OAuth / snapshot webhook
URLs are about to be registered externally — they must be born on omniply.io.

## Inventory (measured 2026-07-25)

- `@socioply/*` imports: 229 files (+ package.json names, tsconfig paths, Dockerfiles)
- `socioply.com` in source: ~25 real sites (defaults for API/CDN/APP urls, CORS list,
  middleware hosts, alert from-addresses, SocioplyBot UA, social icon base, landing links)
- UI "Socioply" strings: 13 · workflows: cosmetic only (tailscale hostnames stay)
- Current hosts: app/www.socioply.com (Vercel prod, main), staging web (Vercel, staging
  branch — record exact current domain in Phase 0), api.socioply.com (prod droplet),
  staging-api.socioply.com (staging droplet Caddy), cdn.socioply.com (DO Spaces)

## Phase 0 — DNS + dual-serve (nothing switches)

Cloudflare records on omniply.io, **DNS-only (grey cloud)** so Vercel/Caddy/Spaces issue
their own certs — `staging.chiro.omniply.io` is a second-level subdomain and sits outside
Cloudflare's Universal SSL wildcard; grey-cloud sidesteps the Advanced Certificate need:

| Record | Target |
|---|---|
| `chiro` CNAME | Vercel (prod web project) |
| `staging.chiro` CNAME | Vercel (staging web project) |
| `api` A | prod droplet IP |
| `staging-api` A | staging droplet IP |
| `cdn` CNAME | DO Spaces custom-domain endpoint (DO-managed cert) |

- Vercel: add the new domains to both projects (old ones REMAIN).
- Both droplets' Caddyfiles: add the omniply hostnames alongside the socioply ones
  (Caddy auto-issues). Verify every new host serves before anything else moves.

## Phase 1 — Repo shuffle (independent of everything else)

1. GitHub: rename `omniply` → `omniply-2025-backup` **and archive it**.
2. Rename this repo `lever_cast` → `omniply` (claims the name; the transient redirect
   from step 1 dies — intended; confirm nothing external referenced the OLD omniply
   repo by name).
3. Verify: Vercel projects still linked (they track repo ID), Actions green on next push.
4. Local: `git remote set-url`, `gh repo set-default`. Memory + docs note.

## Phase 2 — Code rename (one PR-sized commit series, one staging deploy)

- **2a scope rename**: `@socioply/*` → `@omniply/*` everywhere (imports, package.json
  names, tsconfig paths, Dockerfile references, workflow inline scripts). Purely
  mechanical; its own commit.
- **2b domains/config**:
  - CORS origins → env-driven (`WEB_ORIGINS`, comma list) with defaults covering BOTH
    new and old web origins during transition.
  - `middleware.ts` hosts → chiro.omniply.io canonical (+ redirect from old).
  - Default swaps: `api.socioply.com`→`api.omniply.io`, `cdn.socioply.com`→
    `cdn.omniply.io`, APP_BASE_URL/APP_URL defaults, SOCIAL_ICON_BASE, `SocioplyBot`→
    `OmniplyBot`, alert froms → `alerts@omniply.io` / `hello@omniply.io`.
  - Embed CSP `frame-ancestors`: add `https://crm.omniply.io`.
  - UI strings Socioply→Omniply; landing links; **introduce `NEXT_PUBLIC_VERTICAL=chiro`**
    (brand-config module; no new hardcoded vertical strings in web).
- **2c docs sweep**: payment checklist + snapshot guide (webhook URLs → api.omniply.io),
  onboarding testing guide (embed URL → chiro.omniply.io/embed), PM doc, README.

## Phase 3 — Env flips + verification (staging first)

- Vercel staging env: `NEXT_PUBLIC_API_URL=https://staging-api.omniply.io`, DO_API_BASE,
  APP_BASE_URL → staging.chiro.omniply.io. Staging droplet .env: `CDN_BASE=
  https://cdn.omniply.io`, APP_URL, ALERT_EMAIL_FROM.
- Verify on staging: web loads on the new domain, embed CORS, a lead-gen compile emits
  cdn.omniply.io URLs, admin pages, one content-generation smoke.
- Prod: same flips ride the next prod rollout batch (no early prod churn).

## Phase 4 — Email/senders (parallel track)

- Resend: add omniply.io (SPF/DKIM in Cloudflare), verify, switch from-addresses;
  socioply.com stays verified during transition.
- GHL SMTP / sender identities → @omniply.io (user, during the snapshot session).

## Phase 5 — External registrations (ONLY after Phase 3 verified green)

- Marketplace app: Custom Page → `https://chiro.omniply.io/embed` (staging app variant →
  staging.chiro), SSO secret handover.
- Google OAuth redirect URIs: `https://api.omniply.io/api/google/oauth/callback`
  (+ staging-api variant).
- Snapshot custom values: billing + review webhook URLs on api.omniply.io.

## Phase 6 — Cutover + cleanup (after a comfortable window)

- Cloudflare redirect rules: www/app.socioply.com → chiro.omniply.io.
- `cdn.socioply.com` stays alive INDEFINITELY as an alias (old newsletters/PDFs embed
  it) — cheapest correct choice; optionally recompile the lead-gen library to refresh
  its stored URLs.
- Drop old CORS origins/Vercel domains/Caddy hosts only after the window.
- Memory + docs final sweep.

## Rollback posture

Every phase is additive until Phase 6: old domains keep serving throughout, so rollback
at any point = "stop flipping envs, keep using socioply hosts." The repo rename is the
only non-dual step and GitHub redirects cover it.
