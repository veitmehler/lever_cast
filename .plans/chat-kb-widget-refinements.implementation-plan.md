# Chat Agent: KB Onboarding + Widget Refinements — Implementation Plan

**Status: PLAN — 2026-08-06 · all decisions user-locked in the 2026-08-06
discussion; builds on the shipped pre-C3 UX batch (576acad).**

---

## A · Widget: "Need Help?" pill — no bug; testing affordance + cache-busting

**Diagnosis (verified):** both staging and prod serve the pill code. The pill
is session-once by design: clicking the bubble (or the pill) sets
`sessionStorage['op-agent-pill']`, suppressing it for the rest of that TAB's
session — hard refreshes don't clear sessionStorage. The user tested the
chat before looking for the pill. **Verification: open the page in a new
tab/incognito → pill appears after ~3 s.**

Work items:
1. `?reset=pill` (or `#op-pill-reset`) debug affordance on the panel/loader —
   clears the session flag so testers can re-trigger without a new tab.
2. **Version-stamped loader** in the embed snippet:
   `widget.js?v=<n>` — the Settings snippet and docs carry the current
   version so clinic sites pick up widget updates on OUR schedule instead of
   the 1-hour browser cache. Bump `v` on every widget change.

## B · Greeting v2 (user-approved copy, dash-free)

Replace `agent_greeting` (both envs + seed):

> Hi! I'm {{practiceName}}'s automated assistant. I can help with
> appointments, opening hours, location, and anything else you'd like to
> know about us. One thing to know: I'm not legally allowed to give medical
> advice. What can I help you with?

## C · Dash elimination in chat output

1. **Prompt rule** in `agent_system` (same wording family as the caption
   prompts): never use em-dashes or dashes as punctuation; use commas,
   colons, or separate sentences. Hyphenated words (well-being, X-ray)
   remain correct usage.
2. **Deterministic backstop** in `engine.ts` on every outgoing reply:
   replace ` — `, ` – `, `—`, `–` and spaced ` - ` (punctuation contexts
   only) with comma/period equivalents. Word-internal hyphens untouched.
   Applies to greeting + all canned fallback strings too (audit those once).

## D · Lazy Google Place-ID resolution (self-healing hours)

Machinery exists (`resolvePlaceId` = official Find-Place-from-Text on
name+address; `probePlace` fetches hours + utc_offset). Gap: it only runs at
onboarding commit.

1. In the agent **context builder**: no stored `googlePlaceId` but
   organizationName + address present → resolve once, store on
   BrandSettings, probe hours, continue. Log with a distinct marker
   (`[places] lazily resolved`).
2. **Review surface for lazy resolutions** (mismatch risk: similar names in
   one suburb): surfaced in the admin transcripts/errors view or a simple
   log-based check during pilot. A wrong match would feed wrong hours —
   catch in pilot, not production.
3. Side benefit: weekly review-harvest cron begins covering these accounts.
4. Dev clinic backfill happens implicitly on first agent use post-deploy.

## E · Onboarding "Front Desk Questions" step (chat KB)

New step in the GHL onboarding chat (pattern: the bookingUrl/PMS steps).
Answers synthesize into `clinicFaqs` (existing storage; logistics-only guard;
agent reads it already — no pipeline change).

The 10 questions + UI shapes (all user-approved):
1. **Insurance & funds** (first): funds/insurers accepted; HICAPS/terminal;
   Medicare care plans (EPC/CDM); workers' comp; motor accident.
2. **First visit**: duration, what happens, what to bring/wear.
   - **Free initial assessment toggle**: yes/no + REQUIRED terms text when
     yes (AHPRA s.133: free offers legal only with clearly stated terms; US
     note re federally insured patients in the helper text). Chat pushes it
     ONLY when enabled, always stating the terms, never as pressure.
3. **Pricing** (optional): standard prices + structured discounts WITH terms
   (concession/seniors/family) + share-in-chat toggle. Chat phrasing:
   states standard rates plainly, routes personalization to the front desk
   ("depending on your situation, the front desk can walk you through what
   applies to you"). NO "better deals if you come in" bait phrasing —
   inducement-clean by construction.
4. **Booking & cancellation**: how to book/reschedule/cancel; policy
   (notice, fees).
5. **Practitioners**: repeatable rows — name input, female/male dropdown,
   free-text weekly schedule per practitioner ("Mon–Wed all day, Fri
   mornings"). Grid UI later only if asked for.
6. **Who you treat**: yes/no selects (children / pregnancy / seniors);
   age-limit input appears only when selected.
7. **Referrals**: GP referral needed? generally / care-plan / insurance.
8. **Payment**: checkboxes (card, cash, HICAPS, payment plans) +
   "Additional options:" free text.
9. **Getting there**: parking, transport, wheelchair access.
10. **Languages & after-hours**: team languages; after-hours guidance
    (emergency interception stays hard-coded regardless).

## F · KB proof-check + lifecycle (the user's approval-screen requirement)

1. **Onboarding final review screen**: before anything commits to the KB,
   the clinic sees the complete assembled business info — the 10 answers,
   detected hours (Places), address/phone, booking URL — every field
   editable in place. Only on explicit approval does it write to
   BrandSettings/clinicFaqs.
2. **Settings editor ("Business Info & Chat Knowledge")**: the same view,
   permanently editable post-onboarding. Saving:
   - updates BrandSettings/clinicFaqs,
   - **rebuilds the KB**: re-runs the clinicFaqs synthesis where raw answers
     changed, busts the agent context cache for the account (new
     `clearAgentContext(accountId)` hook on the 15-min cache) so the chat
     reflects edits within seconds, not minutes.
3. Editing hours here overrides Places values (explicit owner input wins;
   flagged as override so lazy resolution doesn't clobber it).

## G · Sequencing

| Order | Item | Size |
|---|---|---|
| 1 | B + C (greeting, dash rules) — prompt/data + small engine backstop | small |
| 2 | A (pill debug affordance + versioned loader) | small |
| 3 | D (lazy place-ID + logging) | small |
| 4 | E (onboarding step) | the substantial piece |
| 5 | F (review screen + Settings editor + rebuild hooks) | substantial, depends on E's field model |
| 6 | C3 red-team then covers: new refusal under rephrasing, insurance answers vs KB, free-assessment push compliance, dash-free output | gate |

Clinic widgets remain gated on C3. The Azavea/prod cadence is unaffected by
any of this (article side is independent).

---

## H · Contact convergence + mobile batch (2026-08-06, from iPhone 15 Max testing — IMPLEMENTED, 8169c04)

Four user-locked directions:

1. **16px input/base text** — readability, and Safari auto-zooms any focused
   field under 16px (that zoom was the "widget resizes" bug). Plus 100dvh,
   visualViewport keyboard-fit, parent scroll-lock while open on mobile.
2. **One GHL contact per conversation** (instead of end-of-chat batch
   creation, which would delay the callback notification and has no reliable
   trigger): first contact-needing action creates the contact with all known
   details; later actions update by id + tag-add. Email semantics: the
   add_contact_email address (deliberate choice for real communication)
   becomes PRIMARY; the capture email is the lead-gen throwaway (Drive/drip
   already served) and only holds the slot while no preferred one exists.
   `agent/known.ts` derives known details from persisted actions; the frame
   gets a KNOWN VISITOR DETAILS block; the system prompt confirms the email
   on file and offers a swap instead of re-asking. Inactivity finalizer cron
   (agent-finalize, */10 min, idle 15 min): reconciles details onto the
   contact, writes one summary note for non-callback leads, stamps
   finalizedAt.
3. **Closed-state launcher bigger on phones** — 68px bubble + 15px pill
   (desktop stays 58px/13px); the full-screen panel was fine as-is.
4. **Dwell teaser on ALL devices** — it must draw attention on phones; only
   auto-opening the panel remains forbidden on mobile.

Deliberate prompt pushes now go through
`packages/db/scripts/push-agent-prompts.ts <keys>` (overwrites from
prisma/agent-prompts.ts; the seeder stays create-only). Widget snippet is at
`widget.js?v=4`. C3 red-team must stress multi-action conversations with
details changed mid-flow.

### H-addendum — three same-day fixes from live phone testing (2026-08-06, all deployed both envs)

1. **Silent capture drop** (cbe0e0b): fresh-conversation guide flow asked
   email-only; the model attached capture_contact without a name and
   validation dropped it while the reply claimed "guide sent" — no card, no
   Drive grant, no contact. Fixed in three layers: name now OPTIONAL on
   capture (email alone delivers; known-details reconciliation backfills),
   explicit GUIDE FLOW in the system prompt (ask first name + email
   together; never claim delivery without attaching the action), and any
   validation-dropped action flags the conversation
   (`action-dropped:<type>`) + logs.
2. **Delivery rule locked** (c248096; user: guides must NEVER appear in
   chat): captured guides deliver BY EMAIL ONLY (drip); the in-chat card
   renders solely on send_guide_link (email-decliner fallback).
   `guideFor()` linkable = send_guide_link only. (Original C2b design
   showed the card after capture too — masked in testing by callback paths
   and then by bug #1; rejected on first sight.)
3. **Claim-possession hallucination** (5ce7f44, prompt-only): with name +
   email known, the model told a visitor "I have your number on file" (it
   had no phone). Anti-re-ask pressure over-generalized into assumed
   possession. Prompts now state the exhaustive-list rule (not listed = NOT
   on file, never claim it), callback flow gained step 0 (no phone anywhere
   → ask, never claim), and the frame header marks the list COMPLETE.

E2E confirmed by the user after the fixes: GHL contact created, drip email
delivered, single converged contact across guide→callback in one
conversation.
