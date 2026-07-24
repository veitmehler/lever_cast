# PMS Connector Framework — Implementation Plan (PARKED: cohort-driven)

**Status: PARKED by design (2026-07-15). Build trigger = onboarding PMS-dropdown data
showing which system ≥⅓ of active clients use.**

## Why parked

International PMS fragmentation (US: ChiroTouch/Jane/ChiroFusion/…, CA: Jane, UK:
Cliniko/TM3/PPS, AU/NZ: Cliniko/Nookal/PracSuite) with wildly uneven API quality (Cliniko/
Nookal clean; Jane closed; ChiroTouch partner-gated). Building per-PMS bridges before
knowing client distribution is an integration treadmill. Launch strategy instead:
`bookingUrl` (universal), review velocity via newsletter ask-blocks + the QR counter card.

## The framework shape (when triggered)

- ONE-WAY PMS → GHL only. GHL never owns booking (double-booking risk).
- Connector interface: `fetchChangedAppointments(since)`, `fetchChangedPatients(since)` —
  per-PMS adapters behind it. Cliniko first regardless of cohort (cleanest API, per-user
  API key = same paste-one-key onboarding UX as WordPress/ElevenLabs).
- Sync minimum: name/email/phone + appointment TIMESTAMPS. Never clinical data, never
  appointment types implying conditions (Privacy Act / HIPAA-adjacent / GDPR posture in
  every jurisdiction).
- Output = GHL contact upsert + event tags: `appointment-completed`, `first-visit-completed`
  → the snapshot's (pre-built, dormant) review-request workflow + New Patient pipeline
  moves. Tags: service-communication tags kept STRICTLY separate from marketing tags —
  synced patients are never auto-subscribed to newsletters.
- Infra reuse: encrypted per-client key (apiKey table pattern), poller cron (leadgen-poll
  pattern), GHL upsert (upsertGhlContact).
