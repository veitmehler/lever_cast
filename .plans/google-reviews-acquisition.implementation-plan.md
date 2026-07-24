# Google Reviews Acquisition Ladder — Implementation Plan

**STATUS: FULLY IMPLEMENTED 2026-07-25 (a89450d, staging). Tiers 1+2 dormant behind env keys; Tier 3 live once snapshot workflow + token exist. QR card (Phase F) implemented same commit, visual-verified.**

**Locked (user, 2026-07-24): per-clinic OAuth is the PRIMARY path; clinics that decline
during onboarding fall back to the Places-API probe (6-10 reviews via dual sort) plus
GHL Review-Received webhooks for everything new.** Feeds the existing client-story
review-mining pipeline (RawReview ingest); replaces the flaky scraper as the default
source. Supersedes the parked "GBP OAuth someday" note.

## Tier 1 — Clinic OAuth (primary, best data: FULL review history + ongoing)

- Onboarding gains an optional **"Connect Google"** step (choice: connect / skip —
  NEVER a validator blocker). Standard consent flow, scope
  `https://www.googleapis.com/auth/business.manage`; encrypted refresh-token storage
  (apiKey-table pattern, provider 'google_business').
- Backfill job on connect: Business Profile API `accounts.locations.reviews.list`
  (paginated, ALL reviews) → RawReview ingest → story mining.
- Periodic refresh (weekly) + token-revocation handling (mark disconnected, fall to
  Tier 2 silently).
- **External prerequisites (LONG LEAD — start now):** OAuth consent screen +
  verification on our GCP project AND Google's Business Profile API access application
  (weeks of review time). Until approved: `GOOGLE_OAUTH_CLIENT_ID` unset → the
  onboarding step auto-hides and every clinic takes Tier 2. Ship the code before the
  approval; nothing blocks.

## Tier 2 — Places probe (fallback, zero friction, partial data)

- At onboarding (and weekly cron): LEGACY Place Details endpoint ×2
  (`reviews_sort=most_relevant` + `reviews_sort=newest`) → up to ~10 unique reviews
  per probe; rating + total-count captured too. Place ID resolved from the captured
  GBP URL (fallback: text search on name+address). Uses `GOOGLE_MAPS_API_KEY`
  (platform key — clinics set up nothing).
- Weekly poll accumulates the rotating top-5s; 'newest' sort leaks most new reviews
  over time.

## Tier 3 — New-review stream via GHL (BOTH tiers get this)

- Snapshot: **Review Received workflow → Custom Webhook** to our receiver
  (per-account URL token, same pattern as billing events; custom value
  `omniply_review_token`). Payload → RawReview ingest.
- Dependency: the clinic's Google account connected in GHL Reputation (onboarding
  runbook step — this is GHL's own Google connection, independent of our Tier-1 OAuth).

## Cross-cutting

- **Dedup is mandatory**: the same review can arrive via GBP API, Places probe, and
  GHL webhook. Normalize + hash (author, date-day, text prefix) before RawReview insert.
- Onboarding additions ride the already-planned GBP-URL capture (socials step).
- Validator: NONE of this blocks generation readiness.

## Order of work

1. GBP-URL capture in onboarding (shared prereq with the QR card)
2. Tier 2 probe + weekly cron + dedup (works the day the Maps key exists)
3. Tier 3 receiver + snapshot workflow docs
4. Tier 1 OAuth step + backfill (code ready, dormant until Google approval)
