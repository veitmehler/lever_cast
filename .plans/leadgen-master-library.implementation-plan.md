# Lead-Gen Master Library — Implementation Plan

**Goal: the five drafted lead-magnet documents (+ the QR review card) become the active
master library, so every clinic that completes onboarding automatically receives its own
branded, review-gated document set.** Source material: `.documentation/Lead Gen Docs/`
(5 × DOCX/PDF + 30 SVG/PNG assets). Decision 2026-07-23: **assets stay as-is — NO
recoloring** (comparison artifact reviewed; the page furniture carries the brand).

## What already works (no build needed)

- **Per-clinic provisioning is live**: `POST /onboarding/complete` upserts one
  LeadGenDocument per ACTIVE template for the new account (tag `leadgen-<slug>`), enqueues
  LEADGEN_COMPILE, lands `pending_review` (apps/api/src/routes/onboarding.ts:130).
- Model B compiler with brand tokens, voice-rewrite guards + neutral fallback, Chromium
  PDF → S3 → (Drive when key arrives) → review surfaces on both open web and embed.
- The five DOCX drafts convert cleanly: styled Heading1/Heading2, ListParagraph bullets,
  explicit placeholders (`[PRACTICE NAME]`, `[Phone Number]`, `[Website / Online Booking
  Link]`, `[Street Address, City]`, `[Opening Hours]`, `[Special Offer — …]`) that map
  1:1 onto `{{brand.*}}` tokens. Asset prefixes d1–d5 match docs 01–05.

## Phase A — Master layout v2 (figure + rich-block support)

`master-layout.ts` grows from the text-only demo skeleton to the drafts' real structure.
New block types in `MasterDocSpec` (backward-compatible — demo/QR specs keep working):

- **Cover v2**: eyebrow "A FREE GUIDE FROM {{brand.organizationName}}", title, subtitle,
  "INSIDE THIS GUIDE" ✓-checklist (frozen text), optional cover illustration
  (`d*_cover.svg`), brand color band as today.
- **Part headers** (the drafts' Heading1 groups: "Why this matters", "The 6-stretch desk
  reset", "When stretching isn't enough").
- **Figure block**: inline SVG + optional caption; `page-break-inside: avoid`; full-width
  or half-width (stretch cards pair 2-up in a grid).
- **How/Why card** (stretch sections): figure + "How:" steps + "Why it works" prose.
- **Reader-offer box** (back page): headline + offer text + "Mention this guide when you
  book." + booking CTA button.
- **Contact block**: name, address, phone, email, `{{brand.bookingUrl}}`, optional
  opening-hours line that DROPS when unknown (no empty labels).
- Print-CSS pass: page-break tuning around figures/cards, footer strip unchanged.

## Phase B — Asset module

- Move the 30 SVGs into the repo: `apps/api/src/leadgen/assets/*.svg` (canonical,
  version-controlled). PNGs are not used (SVG stays vector-crisp in print).
- Loader helper inlines them into `sourceHtml` at SEED time → templates are fully
  self-contained in the DB; the print step never fetches anything over the network.
- `.documentation/Lead Gen Docs/` stays as the source-of-record for drafts (commit it).

## Phase C — Convert the five documents (content work, one spec module each)

`packages/db/scripts/leadgen-masters/01-desk-workers.ts` … `05-first-visit.ts`, each
exporting a `MasterDocSpec`. Conversion rules:

1. **Placeholders → tokens**: `[PRACTICE NAME]` → `{{brand.organizationName}}`, phone/
   website/address/booking accordingly; `[Special Offer …]` → the reader-offer slot (see
   Phase D); `[Opening Hours]` → optional hours line.
2. **Em-dash elimination**: the drafts use em-dashes throughout ("— undo 'tech neck'") —
   masters are the guard fallback, so they must comply with the de-AI rule. Rewrite
   during conversion; the seed script REJECTS any spec containing —/–.
3. **Slot policy (safety-critical)**:
   - rewriteEligible TRUE: intro/why-it-matters, section explanatory prose, "Why it
     works" paragraphs, next-step/CTA copy.
   - rewriteEligible FALSE (frozen verbatim): **"How:" exercise instructions** (clinical
     accuracy > brand voice), **red-flag/warning lists**, cover checklist, offer
     mechanics, disclaimer. The LLM never touches what could hurt someone if paraphrased.
4. **Figure placement**: per-doc map (d1: cover, workstation, posture, rhythm + 6 s_*
   stretch cards; d2: cover, trafficlight, bodymap, redflag, scale; d3: cover, textneck,
   plumb, bag, logroll; d4: cover, positions, pillow, mattress, winddown; d5: cover,
   spine, timeline, pop, mythfact_header).

## Phase D — Compiler additions (small)

- `brandTokensFor`: add `{{brand.bookingUrl}}` (field exists since 24de615).
- **Reader offer**: map the offer slot to the account's first enabled `NewsletterOffer`
  (title + short line) — cross-feature reuse of the onboarding-seeded offers; neutral
  fallback ("Ask about our new-patient assessment when you book") when none.
- Optional-line handling: drop the hours row (and any token-empty contact row) instead of
  rendering empty labels.

## Phase E — Seed, verify, activate

- Seed all five masters ACTIVE; **deactivate `demo-desk-back-routine`** (replaces the
  pre-prod-deactivation chore — done here instead).
- Compile all five against the staging test account; render/review each PDF page-by-page
  (pagination, figure breaks, footer overlap); fix and re-run until clean.
- Deliverable to user: five branded PDFs on the staging Lead Magnets page + rendered
  previews in chat for sign-off.

## Phase F — QR review counter card (master #6, separate small build)

- `qrcode` dep (SVG QR output, inlined — stays vector), compact A6/DL card layout (own
  small template, not the A4 guide skeleton), fixed copy (skips the rewrite pass
  entirely), QR → Google review deep link derived from the GBP URL in brand settings;
  card SKIPPED (not failed) for accounts without a GBP URL.

## Explicitly out of scope here

- Drive uploads + capture E2E (blocked on the Google service-account key — unchanged).
- Asset recoloring (decided against 2026-07-23).
- Prod rollout (rides the existing one-batch staging→main plan).

## Open decisions for the user

1. Reader-offer mapping: first enabled NewsletterOffer OK, or a dedicated per-account
   "lead-magnet offer" text instead?
2. Opening hours: fine to omit when unknown, or add capture (onboarding step / GHL
   location business-hours prefill) later?
3. Slot policy above freezes all exercise instructions from brand-voice rewriting —
   confirm.
