# GHL-Embedded Chat Onboarding — Implementation Plan

**Status: PLANNED (all product decisions locked in the 2026-07-12/13 brainstorm). Not started.**

## Goal

A frictionless, chat-like onboarding inside the whitelabeled GHL sidebar that ends with an
account on which **content generation is 100% functional with nothing else needed**: every
setting populated, newsletter + email templates built and confirmed, newsletter offers
seeded, social CTAs set, WordPress connected, writing voice trained, voice audio captured.
The finale is a "start generating your first month" button.

**Locked decisions:** private marketplace app (sidebar Custom Page, iframe); NO Clerk inside
the iframe — the decrypted GHL SSO context IS the session (Clerk keeps protecting the open
web); payment clears BEFORE onboarding (subaccount provisioning) — first generation is gated
on `onboardingCompletedAt`, not on payment; scripted chat flow (state machine, chat-styled
UI), LLM only inside analysis steps; five Manifesto-derived questions answered BY VOICE
(spontaneous speech > read-aloud for ElevenLabs liveliness), transcribed (Gemini first,
Whisper fallback) and blended with a real article sample for the writing voice; voice audio
stored to S3 with consent REGARDLESS of the ElevenLabs decision; vision-LLM screenshot is
the PRIMARY palette extractor (semantic roles → newsletter/email template fields), CSS as
cross-check; every auto-derived artifact gets ONE human confirm step (the newsletter-preview
reveal doubles as palette confirmation); non-ElevenLabs accounts → hook-video slots become
image carousels (NOTED, separate follow-up, not in this plan).

## The guarantee mechanism: the Generation-Readiness Validator

`apps/api/src/lib/generation-readiness.ts` — ONE canonical function
`generationReadiness(accountId)` returning `{ ready, missing: [{field, why, step}] }`.
This is the definition of done for onboarding AND the admin account-health check:

| # | Requirement | Source step |
|---|---|---|
| 1 | User + Account rows, GHL locationId mapped | SSO first-open |
| 2 | `GhlSettings`: ghlApiKey, ghlLocationId, ghlUserId | provisioning/admin |
| 3 | `BrandSettings.organizationName`, `industry` (⚠️ plain-language key!), `geolocation` | GHL prefill |
| 4 | `primarySpecialization` + `specializations` (+ `hemisphereOverride` if edge country) | crawl + confirm |
| 5 | `businessDescription`, `who` (target audience), `ourExperience`, `articleGoal` | Brand Profile synthesis |
| 6 | `defaultAuthorName/JobTitle/Website/LinkedIn` (schema/JSON-LD) | GHL prefill + chat |
| 7 | Logo: `nlLogoUrl` (+ light/dark variants), `nlLogoWidth` | crawl + confirm |
| 8 | Palette: `nlHeaderBgColor`, `nlFooterBgColor`, `nlSectionColor1-4`, `nlLinkColor`, `nlFontFamily`, `nlFontColor`, font weights | vision + template-preview confirm |
| 9 | Social links (brand social fields) + connected Social Planner accounts | GHL + crawl + connect step |
| 10 | `socialCallToAction` + `socialPrimaryGoal` | CTA step |
| 11 | `Settings.writingStyle` (analyze-writing-style output) | voice transcripts + article sample |
| 12 | `Settings.socialTimezone` | GHL location timezone |
| 13 | `socialAutomationEnabled` + auto-start-on-payment toggle set deliberately | toggles step |
| 14 | WordPress connection verified (or explicit HTML-export opt-out) | WP step |
| 15 | ≥1 seasonal + ≥1 evergreen `NewsletterOffer` | offers step |
| 16 | `Account.articleCalendarId` + owner `newsletterCalendarId` routed | finalization (auto by spec × hemisphere) |
| 17 | ElevenLabs decision recorded; if yes: key + `elevenLabsVoiceId`; voice audio in S3 either way | voice step |
| 18 | Billing: token minted + GHL billing workflows live (admin runbook, not client-facing) | admin checklist |
| 19 | `Account.onboardingCompletedAt` set (only settable when 1–17 pass) | completion |

Onboarding cannot complete while the validator fails; the admin Users page shows readiness
per account (replaces the manual "account health" idea — this IS the enforcement).

## Phase 0 — Marketplace app shell + embedded auth

- **Private GHL marketplace app** with a Custom Page pointing at `app.socioply.com/embed`.
  Distribution: agency-level install to subaccounts (verify at build whether snapshot can
  carry the install or it's a bulk/per-subaccount agency click — runbook either way).
- **SSO session**: frontend `postMessage REQUEST_USER_DATA` → encrypted payload → new
  `POST /api/embed/session` decrypts (AES, shared secret from app Advanced Settings →
  env `GHL_SSO_SECRET` both envs) → returns OUR short-lived JWT (15 min, held in memory,
  re-requested on expiry). All embedded API calls use `Authorization: Bearer` — no cookies.
- **Dual identity**: `User.ghlUserId` (new, unique, nullable) + `clerkId` becomes nullable.
  Resolution order: ghlUserId match → email match (attach ghlUserId) → create user + attach
  to the account whose `GhlSettings.ghlLocationId` = SSO `activeLocation` (member join).
  `getOrCreateUser` grows an embedded-mode variant; auth middleware accepts either session
  kind (Clerk on open web unchanged).
- **CSP**: web app sends `frame-ancestors 'self' https://app.gohighlevel.com <whitelabel
  domain>` (next.config headers); verify no `X-Frame-Options` from Vercel defaults.
- Embedded shell renders the normal app; if `onboardingCompletedAt` is null it hard-routes
  to `/onboarding`.

## Phase 1 — Onboarding engine (resumable state machine)

- `OnboardingSession` model: accountId (unique), currentStep, `stepData Json` (answers,
  candidates, confirmations), status, timestamps. Every answer persists immediately —
  closing the tab and returning resumes mid-sentence.
- Scripted step machine on the server (`apps/api/src/onboarding/flow.ts`): ordered steps,
  each with `prepare()` (data it shows) and `commit(answer)` (fields it writes). The LLM
  never chooses the next step.
- Chat UI (`apps/web/src/app/onboarding/`): message-bubble rendering of steps, typing
  indicator while background jobs run, cards for confirm-steps (logo picker, palette
  preview, profile editor), MediaRecorder for voice, progress dots. Feels like chat; runs
  like a wizard.
- Background jobs (pg-boss): `ONBOARDING_CRAWL` (website analysis) and
  `ONBOARDING_SYNTHESIS` — kicked early, awaited late, so the user never watches a spinner
  longer than a beat (crawl starts the moment the GHL prefill yields a website URL, BEFORE
  question 1).

## Phase 2 — Automatic data acquisition

**2a. GHL prefill (verified live 2026-07-12):** `GET /locations/{id}` → name, address,
city/state/postcode/country, website, timezone, email, phone, logoUrl, `business{}`,
`social{facebookUrl, linkedIn, instagram, youtube, …}`. Maps to organizationName,
geolocation, socialTimezone, author fields, social links, and the crawl seed URL.
Hemisphere auto-derived from country (AU→south), `hemisphereOverride` confirm only for
edge countries. Existing private-integration key suffices — no new scopes.

**2b. Website crawl** (`apps/api/src/onboarding/site-analysis.ts`): fetch home + nav-linked
about/services/team pages (cap ~6 pages, existing fetch/og infra). Extract: logo candidates
(header img, og:image, apple-touch-icon, hi-res favicon), text corpus, social links in
footer/header (fallback where GHL profile is empty), CSS font-family + custom-property
colors (cross-check signal).

**2c. Vision palette (PRIMARY)**: pooled-Chromium screenshot of the homepage (existing
raster browser) → Gemini vision → STRUCTURED semantic roles: headerBackground, headerText,
accent/link, button, bodyBackground, sectionTint candidates → mapped onto
`nlHeaderBgColor/nlFooterBgColor/nlSectionColor1-4/nlLinkColor/nlFontColor` (+ font family
from CSS). Confidence per role; low confidence → the confirm step highlights that swatch.

**2d. Logo variants**: chosen logo → light/dark derivation (reuse the newsletter
logo-variant pipeline) → S3 → `nlLogoUrl` + width.

**2e. Specialization detection**: one LLM call over the crawl corpus → proposed
`primarySpecialization` (from the Specialization registry keys) + secondary
specializations + target-market observations + services list. Presented as a confirm chip
list ("You focus on families and prenatal care — right?").

## Phase 3 — The five questions (voice-first chat)

Manifesto-derived, each doing double duty (principle + settings field):
1. **Declaration** ("what should a patient say you did for them in 3 years?") → mission /
   `articleGoal` seed.
2. **Enemy** ("what in your industry drives you crazy — what do patients fall for before
   they find you?") → editorial stance (AHPRA-softened: critique practices, never
   competitors/claims).
3. **Tribe** ("describe your favorite patient — the one you want 100 more of") → `who`.
4. **Line** ("what do you refuse to compromise on?") → values/standards.
5. **Proof** ("what actually happens in the first visit and first month?") → `ourExperience`
   + CTA grounding.

Mechanics: MediaRecorder per answer (typed answers allowed as fallback, voice encouraged);
client-side quality gate (min duration, level check, "move somewhere quieter?" re-prompt);
segments uploaded to S3 (`onboarding/{accountId}/voice/q{n}.webm`) with a recorded consent
line; transcription per segment (Gemini audio-in first — existing instrumented provider;
Whisper as drop-in fallback if accent/noise quality disappoints); transcripts editable
inline ("fix anything I misheard").

## Phase 4 — Synthesis + the reveal

- **Brand Profile synthesis** (one LLM call): crawl facts × five answers → draft
  `businessDescription`, `who`, `ourExperience`, `articleGoal`, `specialInstructions`
  (stance/compliance notes), refined specialization. Rendered as an editable profile card —
  the user proofreads and commits (the locked human-checkpoint).
- **Writing voice**: transcripts (labeled spoken-register: "borrow the personality, not the
  grammar") + one pasted/uploaded real article (or a transcribed voice answer to two extra
  prompts if they have no sample) → existing `analyze-writing-style` (500-word min — met
  comfortably) → `Settings.writingStyle`, shown as a short "how we'll write as you" summary.
- **The reveal**: their actual newsletter template rendered live with their logo, palette,
  fonts (existing renderer + template editor plumbing) + a promo-email preview. "This is
  your newsletter." Tap-to-adjust any swatch → re-render. Confirm commits all `nl*` fields —
  palette confirmation and template build are the SAME moment.

## Phase 5 — Content assets

- **Offer calendar**: one LLM call (specialization + hemisphere + Brand Profile) → 12
  seasonal `NewsletterOffer` drafts + 2 evergreen; editable list, delete/edit/accept-all.
- **Social CTAs**: 3 pre-drafted CTA options from the Brand Profile → pick/edit →
  `socialCallToAction` + `socialPrimaryGoal` (booking / newsletter / custom).
- **Promo email defaults**: send time + timezone (prefilled from location), GHL tag
  selection for `promoEmailTagId` (existing tag-listing API).

## Phase 6 — Connections

- **WordPress** (85% of clients): chat step collects site URL (prefilled from website),
  username, Application Password (with a 30-second illustrated how-to); live
  connection test via existing wpConnection verify; pick default category/status.
  Explicit opt-out path → HTML-export mode recorded (validator satisfied either way,
  but the choice is deliberate, never silent).
- **Social accounts**: "connect your socials" step deep-links to the subaccount's Social
  Planner connect screen, then polls our existing `/social-media-posting/{locationId}/accounts`
  until accounts appear → user ticks which platforms to publish to.
- **ElevenLabs branch**: decision step. YES → guided account creation ($22/mo Creator),
  API-key paste, voice clone created via API from the ALREADY-CAPTURED five-answer audio
  (patched, best segments first) → `elevenLabsVoiceId`. NO → recorded decision; audio stays
  in S3 so later opt-in is one click; (follow-up, out of scope here: flip hook-video slots
  to image carousels for non-EL accounts).

## Phase 7 — Finalization

- Toggles step: `socialAutomationEnabled` + auto-generate-on-payment, stated in plain
  words ("each month, the moment your payment clears, we produce the month's content").
- Calendar routing: `articleCalendarId` + owner `newsletterCalendarId` auto-assigned from
  confirmed specialization × hemisphere (existing routing); first Content Plan window shown.
- Validator runs → all green → `onboardingCompletedAt` set → **finale: "Your first month is
  planned — start generating now?"** → button fires the existing burst path (payment already
  cleared; the gate opens with completion). Renewals auto-burst from cycle 2 (Phase B).
- Burst helper + cadence + content-plan generate gain the `onboardingCompletedAt` gate
  (belt-and-braces on top of the natural no-calendars no-op).

## Phase 8 — Admin runbook + verification

- **Admin checklist per client** (PM doc): create subaccount from snapshot → install
  private app (or verify snapshot carried it) → SaaS subscription → mint billing token +
  three billing workflows (payment checklist) → provision GhlSettings (integration key,
  locationId, ghlUserId) → client runs chat onboarding → admin sees validator green.
- **Testing**: unit (validator, step commits, SSO decrypt); staging E2E against a real
  chiro website (crawl/vision/logo quality — the "afternoon against 10 real sites" bench
  for extraction reliability); full dry-run onboarding on staging including voice recording
  + first-burst finale; iframe smoke inside a real GHL subaccount (CSP, SSO, token expiry).
- **Cost per onboarding**: crawl+vision+synthesis+transcription+offers ≈ **<$0.50**.

## Verify at build (non-blocking unknowns)

1. SSO payload shape in anger (decrypt endpoint against the real app — template exists).
2. Snapshot-borne app install vs agency bulk-install (runbook branch only).
3. Gemini transcription quality on Australian-accented clinic audio (Whisper fallback ready).
4. GHL Business Profile field completeness on real client subaccounts (crawl covers gaps).

## Out of scope (tracked, deliberate)

- Hook-video → image-carousel flip for non-ElevenLabs accounts (user: "note it, address
  afterwards").
- Public marketplace listing, multi-vertical question sets (first batch = chiros).
- Automated GHL-side provisioning (subaccount/snapshot creation stays concierge).

## Suggested build order

Phase 0 (shell + SSO — unlocks everything, contains the only new auth surface) → 1 (engine)
→ 2 (acquisition, testable standalone against real sites before any UI exists) → 4-reveal
plumbing (template preview) → 3 (questions + voice) → 4 (synthesis) → 5 → 6 → 7 → 8.
Phases 2/3 are independent once 1 exists; the extraction bench (Phase 8's site test) should
actually run FIRST as a de-risking spike.
