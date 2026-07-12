# Lead-Gen Documents via Google Drive — Implementation Plan

**Status: PLANNED (decisions locked 2026-07-13/14). Not started.**

## Goal + locked decisions

Lead-magnet documents live in a **central Google Drive we own** (service account, folder per
account). Prospects hit a Drive link and click **Request access**; we detect the pending
request via the **Drive Access Proposals API** (`accessproposals.list` — verified real,
[guide](https://developers.google.com/workspace/drive/api/guides/pending-access)), auto-approve
it (`accessproposals.resolve`, reader role), and capture the requester's email as a **GHL
contact with the document's tags** — tags drive the clinic's GHL nurture workflows.

- **Central Drive** (user decision): no client OAuth; our service account owns everything and
  is therefore always the approver. Tracking = `driveFileId → LeadGenDocument → account`.
  Each clinic's folder optionally shared read-only to their own Google account.
- **Template library = Model B**: masters authored as professionally designed **HTML
  templates** with content slots; per clinic we apply brand tokens (logo variants, nl*
  palette, contact block, booking CTA — all from onboarding) AND run a constrained
  **voice-rewrite** of the text slots (their `writingStyle`), then compile to PDF via the
  pooled Chromium. **REVIEW-GATED** (user decision): compiled documents land as
  `pending_review`; the clinic approves before the Drive file goes live.
- **Custom clinic uploads = Model A (stamp-only)**: hosted as-is with an optional branded
  cover page stapled on front; no text rewrite (baked layout).
- Per-document GHL tags, editable by the clinic.
- Known data-quality caveat (accepted): Request-access requires a Google login and captures
  that Google identity — fine for patient-audience clinics. Gate pages remain a possible
  future *additional* capture route (out of scope here).

## Phase 1 — Google plumbing

- Service account (our Workspace) + JSON key → `GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON` env
  (both droplets). Scope `https://www.googleapis.com/auth/drive`.
- `apps/api/src/lib/gdrive/client.ts`: JWT auth (googleapis or bare REST — prefer bare REST
  fetch like the GHL client, no heavy dep), helpers: `ensureAccountFolder(accountId)`,
  `uploadPdf(folder, name, buffer)`, `listAccessProposals(fileId)`,
  `resolveAccessProposal(fileId, proposalId, role)`, `grantReader(fileId, email)`,
  `shareFolderReadOnly(folderId, email)`.
- ⚠️ Verify at build (spike first, ~1h): access proposals on **service-account-owned My
  Drive files** vs needing a **Shared Drive** (Workspace); the requester-side UI flow on
  our files; the proposal payload's requester email field. The spike = create file, request
  access from a second Google account, list + resolve via API.

## Phase 2 — Data model

```prisma
model LeadGenTemplate {  // admin-managed master (Model B)
  id/name/slug/description
  sourceHtml   @db.Text   // designed layout + {{brand.*}} tokens + <slot name="...">
  slotMeta     Json        // per-slot: maxChars, rewriteEligible
  active       Boolean
}
model LeadGenDocument {
  accountId / userId (owner)
  templateId?              // null = custom upload (Model A)
  title / slug
  kind        'template' | 'custom'
  status      'compiling' | 'pending_review' | 'live' | 'disabled' | 'failed'
  driveFileId? @unique     // set when uploaded to Drive
  driveLink?               // webViewLink handed to marketing surfaces
  pdfKey?                  // S3 copy (source of truth for re-uploads)
  ghlTagNames String[]     // applied to captured leads
  compiledAt / approvedAt
}
model LeadCapture {        // capture log + idempotency + analytics
  documentId / accountId
  requesterEmail
  proposalId  @unique      // dedupe across poll ticks
  ghlContactId?
  status      'captured' | 'ghl_failed'
  createdAt
}
```
`LeadGenDocument`/`LeadCapture` join `ACCOUNT_SCOPED_MODELS`; account-delete Phase C sweep
extends to the account's Drive folder (delete via API) — add to the deletion job.

## Phase 3 — Access-proposal poller (the capture engine)

- pg-boss cron `LEADGEN_PROPOSAL_POLL` every 2 min: fileIds of all `live` documents →
  `accessproposals.list` per file (quota-trivial at library scale; batch + per-provider
  limiter entry for 'gdrive').
- Per new proposal (dedupe by `proposalId`): (1) `resolve` ACCEPT role=reader — prospect
  gets the standard "shared with you" email; (2) GHL contact upsert via the account's
  integration key with `ghlTagNames` + source note `leadgen:<slug>`; (3) `LeadCapture` row.
- GHL failure ≠ access failure: still grant access (marketing promise kept), record
  `ghl_failed`, `sendFailureAlert`, retry contact creation on next tick.
- ⚠️ Verify at build: GHL contact-create/upsert + add-tags endpoint shapes (we currently
  only LIST tags); create missing tags or instruct per runbook.

## Phase 4 — Branding compiler (Model B)

`apps/api/src/leadgen/compile.ts` + pg-boss `LEADGEN_COMPILE`:
1. Load template + brand tokens (nl* palette, logo light/dark, org/contact/booking CTA).
2. **Voice rewrite per eligible slot** (their `writingStyle`; hard constraints: ±10% length
   verified, numbers/claims must survive verbatim (numeric-token diff guard), AHPRA
   phrasing rules in-prompt, `sanitizeDashesText` on output). Any slot failing its guard
   falls back to the neutral master text — a professional document with partial voice
   beats a broken one.
3. Render HTML → PDF via pooled Chromium (`page.pdf`, print CSS in the template).
   Overflow guard: expected page count per template; overflow → retry with neutral text →
   still overflowing → `failed` + alert (template bug, not client data).
4. Upload PDF → account Drive folder + S3 copy → status `pending_review`.
Cost: a few voice-rewrite calls per doc (flash — cents); compile whole starter library
< $0.50/clinic.

## Phase 5 — Review gate + Lead Magnets page (web)

- New "Lead Magnets" page (open web + embedded): library list with status chips; PDF
  preview (S3 URL); **Approve** (→ `live`: Drive file becomes requestable, link exposed
  with copy button) / **Regenerate** (re-enqueue compile; optional feedback note appended
  to the rewrite prompt); tag editor per document (GHL tag names); custom-PDF upload.
- Review semantics identical to the platform pattern: nothing is reachable by prospects
  until approved. Captures list (per doc: count + recent emails) for visible ROI.

## Phase 6 — Custom uploads (Model A)

Upload PDF → optional branded cover page (small cover HTML template with brand tokens →
Chromium PDF) merged in front (new light dep: `pdf-lib`, merge-only) → same review gate →
Drive. No text modification, communicated as such in the UI.

## Phase 7 — Onboarding + content-engine tie-ins

- **Starter library at onboarding completion**: `/onboarding/complete` also enqueues
  `LEADGEN_COMPILE` for each active template — the clinic exits onboarding with 3–5
  branded lead magnets already waiting in review. NOT part of the readiness validator
  (generation must not block on lead magnets); surfaced as a "your lead magnets are
  ready to review" notification.
- Social CTAs / newsletter offers MAY link to live documents' Drive links (manual for
  now — deeper automation is a future feature).
- Admin: template CRUD page (upload/edit master HTML, slot meta, activate) — admin-only.
- Runbook: GHL side needs nothing new beyond tag hygiene (poller creates/uses tags).

## Phase 8 — Verification

- Unit: poller idempotency (proposalId dedupe), guard behaviors (length/numeric/dash),
  compile fallbacks, capture→GHL mapping.
- **Spike-first E2E on staging** (Phase 1 verify doubles as it): real service account,
  one template compiled for the staging test account, manual access request from a second
  Google account (proposals can't be created via API — the one manual step), poller
  captures + resolves + GHL contact appears with tags. Then the review-gate walkthrough.

## Out of scope (tracked)

- Gate/landing pages as an additional capture route (social-CTA-friendly) — future.
- Deep analytics (conversion funnels); v1 ships the captures list only.
- Auto-inserting lead-magnet links into generated content.

## Build order

1 (spike + plumbing) → 2 → 3 (capture engine live against a hand-uploaded PDF — value
exists before the compiler does) → 4 → 5 → 7 → 6 → 8. The Phase 1 spike is genuinely
first: it validates the one assumption everything rests on (proposals on service-account
files) before any schema lands.
