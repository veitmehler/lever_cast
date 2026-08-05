# The 2-Minute Spine Check — Per-Clinic Interactive Lead App

**Status: PLAN for review — 2026-08-06 · LAUNCH SCOPE (user decision)**

One combined patient-facing self-check per clinic, auto-generated and
auto-branded like the PDF guides, published to the clinic's WordPress site,
capturing into their GHL sub-account, feeding the existing guide drip.
The interactive front door of each clinic's funnel; the PDFs become the
personalized prescription it writes.

## Naming & framing (locked)

- **"The 2-Minute Spine Check"** ("Spine", never "Spinal" — avoids collision
  with clinical procedure/screening terminology).
- Patient-safe register throughout: habits and setup, never symptoms or
  severity. Educational disclaimer on results. Verdicts are awareness
  ("worth a professional look"), booking CTA is an invitation.

## Regulatory guardrails (non-negotiable, baked into copy + code)

1. Questions assess HABITS: desk setup, sleep position, morning routine,
   how they respond to niggles. No symptom scoring, no pain scales.
2. Results disclaimer (fixed line, not clinic-editable): "This is an
   educational self-check of your daily habits... not a medical assessment
   or diagnosis."
3. No dollar figures, no fear language, no urgency. Awareness verdicts only.
4. No health data stored beyond the habit answers; no PHI; capture is
   name/email/phone-optional only.

## The quiz (12 steps, 4 domains — draft question set for copy review)

Scoring mirrors the X-Ray pattern: choice points normalized per domain to
0–100; overall **Spine Habits Score** = mean; weakest domain drives the
guide match. All copy below is DRAFT for the user's edit pass (clinic-facing
master copy; rendered inside each clinic's brand).

**Domain A · Your desk (3 q)** → guide: `desk-workers-survival-guide`
- A1 "How many hours a day do you sit for work?" [<2 / 2–5 / 5–8 / 8+]
- A2 "Your screen sits..." [at eye level / a bit low / it's a laptop on a desk / I work from the couch]
- A3 "How often do you stand up and move during work?" [every 30 min / hourly / when I remember / rarely]

**Domain B · Your sleep (3 q)** → guide: `better-sleep-without-pills`
- B1 "You mostly sleep..." [on your back / on your side / on your stomach / it changes all night]
- B2 "Your pillow is..." [chosen for how you sleep / fine, I guess / years old / whatever was on sale]
- B3 "How do you feel when you wake up?" [rested and loose / a little stiff, passes fast / stiff for a while / mornings are the worst part]

**Domain C · Your mornings (3 q)** → guide: `morning-habits-spine`
- C1 "First thing after waking, you usually..." [stretch or move gently / straight to the phone / straight to sitting (coffee, car, desk) / rush out the door]
- C2 "Do you do anything regularly for your back?" [daily habit / a few times a week / when it complains / no]
- C3 "How do you pick things up off the floor?" [bend the knees, it's automatic / depends on the day / bend at the waist / avoid picking things up]

**Domain D · When it niggles (3 q)** → guide: `pain-normal-or-warning-sign`
*(habit-of-response framing — deliberately NOT symptom severity)*
- D1 "When your back grumbles, your usual move is..." [get it looked at early / stretch and wait / painkillers and push through / ignore it until it stops]
- D2 "How long do you typically wait before doing something about it?" [days / weeks / months / until I can't]
- D3 "Do you know what your niggles usually mean?" [yes, I've had it explained / roughly / not really / never thought about it]

**Flow:** intro → 12 taps (one per screen, progress bar) → capture gate
("Where should we send your Spine Check results and your guide?") → results.

**Results:** overall score dial + four domain bars (clinic's palette),
gentle verdict for the weakest domain, the matched guide offer ("we'll email
you Dr. {name}'s {guide title}"), booking CTA (their bookingUrl), the fixed
disclaimer, clinic logo + colors throughout. `first-chiropractic-visit`
guide is NOT quiz-matched — it appears as a secondary line for high-interest
results ("never seen a chiropractor? this one's for you").

## Architecture (all existing primitives)

1. **Template**: self-contained HTML app (X-Ray pattern: inline CSS/JS, zero
   deps) with a `CLINIC` config block injected at generation: practice name,
   logo (data URI, like standalone linktree), palette (nlButtonColor /
   nlButtonTextColor / darkInk etc. from BrandSettings), bookingUrl,
   accountId, capture endpoint URL. Lives in `apps/api/src/spine-check/`
   (template + generator), tests beside it.
2. **Publish**: WP page upsert at `/spine-check` via the linktree publish
   pattern (`publishClinicPage` machinery) at onboarding completion +
   re-publish hook for admin. Non-WP clinics: standalone HTML download on
   the Settings page (exact linktree parity).
3. **Capture**: `POST /api/spine-check/capture` (public, rate-limited):
   `{accountId, name, email, phone?, scores{4}, total, weakestDomain}` →
   validate + clamp → `upsertGhlContact` into the clinic's location with
   tags `spine-check-lead` + `leadgen-<matched-guide-slug>`.
   RESOLVED (user): the snapshot drip workflow already has 5 branches keyed
   on which guide tag lands FIRST — so applying the matched guide's tag at
   capture makes that guide lead the sequence. No snapshot changes needed.
   **Drive access at capture (required)**: quiz leads never go through the
   Drive request-access flow, so the capture endpoint must grant access
   directly — reuse the poller's grant-all: `grantReader(fileId, email,
   notify=false)` across ALL of the account's live guide files at submission,
   so every trigger-link click in the drip opens instantly. Record the
   capture the same way the poller does so the rotation estimator
   (~500-shares threshold) keeps counting accurately. Failure mode: if a
   Drive grant fails, still create the contact + tags — the drip link then
   falls back to Drive's request-access flow, which the existing poller
   already handles.
4. **Linktree**: Spine Check entry at the TOP (above booking) in
   `buildLinktreeHtml` + standalone variant — "Take the 2-Minute Spine
   Check". Links to their WP `/spine-check` (or hosted fallback).
5. **Snapshot**: document the `spine-check-lead` tag + (if b) the email-1
   variants in the snapshot guide; Reputation/booking untouched.

## Build steps

1. Template app + scoring module (marker-block pattern → unit tests, incl.
   per-domain normalization, weakest-domain tiebreak Desk>Sleep>Morning>Niggle
   — most-actionable-first, mirrors X-Ray discipline).
2. Generator (clinic config injection, HTML-escape everything) + fixture
   render test with a real BrandSettings row.
3. Capture endpoint + tests (validation, clamps, tag mapping, rate limit).
4. WP publish integration at onboarding completion + Settings download route.
5. Linktree top-slot addition (both variants).
6. Staging E2E on the dev clinic: publish → quiz → capture → contact + tags
   + drip entry verified.
7. Snapshot guide note only: document the `spine-check-lead` tag (drip
   branches already exist).

Estimate: ~4–6 focused days incl. tests and E2E. No schema changes expected
(reuses BrandSettings + existing tags); one new route + one lib module.

## Copy tasks for the user

- Edit pass on the 12 questions + answer options above (this doc IS the copy
  master for them).
- Results verdict lines (4 × ~2 sentences, awareness register) — I draft in
  the build, you review.
- Linktree button label (default: "Take the 2-Minute Spine Check").

## Out of scope (explicit)

- Symptom triage or severity scoring of any kind
- PMS/appointment data
- Per-guide standalone quizzes (superseded by the combined app)
- Omniply-brand version (this is clinic-branded only; our own funnel already
  has the X-Ray)
