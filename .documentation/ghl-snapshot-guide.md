# GHL Snapshot Specification — Chiropractic Practice CRM

The definitive enable/disable + prebuild spec for the client subaccount snapshot
(finalized 2026-07-15). Design principle: **the owner only sees surfaces where they act**
— everything infrastructural exists but stays out of their face. International launch:
no PMS integration, GHL never owns booking (see the PMS strategy in
`.plans/pms-connector-framework.implementation-plan.md`).

## A. Feature toggles

### KEEP — our platform depends on these
| Feature | Why |
|---|---|
| Marketing → Social Planner | The entire social publishing path + onboarding social-connect step |
| Marketing → Email campaigns | Newsletter sends + promo emails (API-created campaigns) |
| Contacts + Tags | Lead-gen captures, promo audiences, every automation trigger |
| Automation (Workflows) | Billing webhooks + nurture sequences (pre-built below; owner rarely opens) |
| Conversations (email + social DMs) | Patient replies to newsletters/promos; future review responses |
| Media Storage | Social Planner attachment dependency (invisible in practice) |
| Our marketplace app (Custom Page) | Onboarding chat + Lead Magnets review + embedded surface |

### KEEP — core clinic value
| Feature | Configuration |
|---|---|
| Calendars/Booking | Template built but **hidden by default** — clinics book through their PMS (`bookingUrl` CTA field). Enable per-client only for PMS-less practices (rare) |
| Reputation | ON — review requests are the #1 local-SEO lever; pairs with the QR review card + future GBP review mining |
| Opportunities | ONE pre-built pipeline only: "New Patient: Lead → Booked → Showed → Active". Nothing else |

### OFF / HIDDEN — with reasons
| Feature | Reason |
|---|---|
| **Content AI / AI Employee / all GHL AI writing** | Competes with the platform; bypasses every guard (AHPRA, brand voice, de-AI). The most important disable on this list |
| Sites / Funnels / GHL Blogs | 85% WordPress; we publish there. Second website builder = fragmented presence + confusion |
| Payments (client-facing menus) | Clinics bill via PMS (health-fund claiming GHL can't do). SaaS billing keeps working underneath — hide the client-facing surface only |
| Memberships / Courses / Communities / Certificates | Not a chiro business model |
| Affiliate Manager / Ad Manager | Not used |
| App Marketplace (client access) | No random installs into a supported environment |
| Launchpad | Hide post-setup (nags about deliberately disabled features) |
| Reporting (beyond basic dashboard) | Analyst-grade UI answering questions owners aren't asking |

### DEFERRED — per-client opt-in (runbook, not snapshot)
- **SMS / LC Phone**: powerful (reminders, review requests) but duplicates PMS reminders,
  adds per-message cost, and needs per-client sender registration (A2P in US, alpha-tag AU).
  Conversations launches with email + social DMs; SMS activates per client on request.
  Revisit as default once the review-request workflow proves demand.

## B. Prebuild checklist (the snapshot's content)

1. **Three billing workflows** (Subscription trigger × Active / Overdue / Canceled →
   Custom Webhook, per the payment checklist) — with the webhook URL referencing a
   **Custom Value**: `{{custom_values.omniply_billing_token}}` (the custom value holds the FULL webhook URL — auto-set at provisioning)
   → snapshot deploys untouched; per-client setup = paste ONE custom value (the token from
   `POST /api/admin/accounts/:id/billing-token`) instead of editing three workflows.
2. **Custom Values**: `omniply_billing_token` + `omniply_review_token` — AUTO-CREATED
   with their full webhook URLs by zero-touch provisioning at app install; the snapshot
   does not need placeholders. Workflow webhook URL fields reference the custom value
   directly (it IS the URL).
3. **Tag taxonomy** (pre-created so workflows reference them from day one):
   - `leadgen-<template-slug>` per starter lead magnet
   - `appointment-completed`, `first-visit-completed` (dormant until the PMS connector or
     manual front-desk tagging supplies them)
   - `newsletter-subscriber` (marketing consent — NEVER auto-applied by any sync)
   - Service-communication vs marketing tags kept strictly separate (privacy posture in
     every jurisdiction)
4. **Nurture workflow skeletons** — one per starter lead magnet: trigger on its
   `leadgen-*` tag → short email sequence (2 placeholder emails) → create Opportunity in
   the New Patient pipeline. This is what makes a captured lead GO somewhere.
5. **Review-request workflow** — trigger: `appointment-completed` tag → delay → review ask
   (email; SMS variant added when SMS activates). Pre-built and DORMANT until a tag source
   exists; the QR counter card covers review velocity meanwhile.
6. **New Patient pipeline** (the one in section A).
7. **Booking calendar template** (one service type, placeholder hours) + email reminder
   workflow — hidden with the calendar feature; ready for PMS-less clinics.
7b. **Trigger link `omniply-review`** (placeholder destination) — the QR review card
   encodes its URL; provisioning points it at the clinic's Google review deep link via
   API (leadgen master-library plan Phase F, option C).
7c. **Review Received workflow → Custom Webhook** with URL
   `{{custom_values.omniply_review_token}}` (full URL auto-set at provisioning) — feeds review mining
   (google-reviews-acquisition plan Tier 3). Requires the clinic's Google connection in
   GHL Reputation (runbook step).
7d. **Native Reviews QR: do NOT create / disable where possible** (user decision —
   our branded QR card + trigger link replaces it; avoids two competing QR codes).
8. NOT in the snapshot but part of client provisioning around it (onboarding runbook):
   Private Integration key (scopes per the onboarding testing guide), SaaS Configurator
   settings (auto-suspend ON, auto-cancel OFF, 30-day cycle), billing token custom value.
   The marketplace app AUTO-INSTALLS via the SaaS plan (bundled 2026-07-25 — private
   white-label app, distribution Agency & Sub-Account, free; auto-install fires for NEW
   subaccounts created under the plan; existing subaccounts need the install link once).

## C. Decisions this spec encodes (from the 2026-07-15 brainstorm)

- Booking stays in the clinic's PMS forever; `bookingUrl` (new onboarding field) is the
  universal CTA destination. GHL calendar = fallback for PMS-less clinics only.
- PMS dropdown in onboarding = data capture only; connector framework parked until cohort
  data picks the first integration (Cliniko presumptive).
- Review velocity at launch = newsletter/promo ask-blocks (our templates) + the branded
  QR counter card (lead-gen starter library) — automation joins when a connector lands.
- Content AI disabled everywhere — one AI writes for the clinic, and it's ours.
