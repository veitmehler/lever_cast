# Omniply Chat + Voice Agent — Implementation Plan

Post-launch flagship add-on (user decision 2026-07-27). One **agent core**, two skins:
an embeddable website chat widget first (cheap, low-stakes proving ground), then a
phone voice agent (VAPI) wrapping the identical core. The voice agent's v1 job is
deliberately modest: answer, help, and **promote the booking URL** — real PMS booking
(Tier 2) waits for the Cliniko connector.

Strategic ground rules (from the 2026-07-27 discussion):
- **"One AI, ours."** GHL Content AI / Conversation AI / Web Chat stay disabled — this
  product replaces them with a guarded, brand-true agent.
- **Booking stays in the PMS.** The agent never books into GHL calendars; it promotes
  `bookingUrl` (Tier 1) and later books via PMS APIs (Tier 2). Google Calendar is
  explicitly NOT an integration layer (iCal feeds are one-way and hours-stale).
- **Zero-setup knowledge.** The onboarding crawl corpus + brand profile ARE the
  knowledge base — no clinic ever authors a KB.

---

## Phase 0 — Agent Core (shared by chat + voice)

`apps/api/src/agent/` — a transport-agnostic conversation engine.

**0.1 Context assembly** (`agent/context.ts`)
- Per-account bundle, cached ~15 min: brand profile (businessDescription, who,
  specializations, tone), crawl corpus (stepData.corpus — refresh path: reuse
  ONBOARDING_CRAWL against the live site monthly), opening hours + address + phone
  (GHL prefill/business info), `bookingUrl`, GBP/review link, published lead magnets
  (title + public capture URL), organizationName.
- Corpus ≤ ~30k chars → stuffed directly into context. **No vector DB in v1.**
  (If corpora grow: fallback = simple chunk-and-rank later; do not build it now.)

**0.2 System prompt + hard compliance rails** (`agent/guardrails.ts`)
- Identity: "assistant for <clinic>", never claims to be a clinician.
- **Clinical safety (the non-negotiables, enforced in prompt AND output filter):**
  - NEVER diagnosis, treatment advice, outcome claims, or condition-specific
    reassurance. Symptom/condition questions → empathetic acknowledgment + "that's
    exactly what an appointment is for" + booking link.
  - Emergency phrase detection (chest pain, numbness, loss of bladder control,
    severe trauma wordlist) → immediate hard-coded urgent-care deflection (local
    emergency number by organizationCountryCode), conversation flagged.
  - AHPRA-safe marketing: no guarantees, no testimonials generated, no discounting.
  - Persistent widget notice: "AI assistant — not medical advice."
- Output filter pass (cheap model or regex tier) on every reply before send;
  violations → replaced with safe fallback + flagged transcript.

**0.3 Tools** (`agent/tools.ts`)
- `send_booking_link` — returns bookingUrl as a rich card/read-aloud line.
- `capture_contact` {name, email?, phone?, reason} — creates GHL contact (existing
  client) + tag `chat-lead` (+ tag `leadgen-<slug>` when a magnet was offered) →
  the prebuilt nurture workflows fire automatically.
- `offer_lead_magnet` {slug} — matches the visitor's topic to a published magnet.
- `request_callback` {name, phone, preferred_time, reason} — GHL contact + tag
  `callback-requested` + notification email to the clinic.
- `handoff_human` — collects the question + contact, emails the front desk, tells
  the visitor when to expect a reply.
- Tier 2 (later, connector-gated): `check_availability`, `book_appointment` (Cliniko
  first — the PMS connector plan's endpoints).

**0.4 Engine** (`agent/engine.ts`)
- Model: Haiku-class default (cents/conversation), Sonnet-class escalation flag per
  account if quality demands. Streaming. Max ~20 turns; token+turn budgets.
- Conversation state in a new `AgentConversation` + `AgentMessage` table pair:
  {accountId, channel: 'chat'|'voice', visitorKey, flagged, endedReason, createdAt}
  / {role, content, toolCalls, filtered}. Transcripts are the audit trail — retention
  per privacy posture (no clinical data solicited; PII limited to what the visitor
  volunteers for contact capture).

**0.5 Cost + abuse controls** (public endpoint — treat as hostile)
- Per-clinic widget token (public, origin-checked against organizationWebsite domain
  + linktree host). CORS pinned per account.
- Rate limits: per-IP (burst), per-conversation (turns), per-account daily LLM budget
  (config default ~$2/day ≈ hundreds of conversations; hard stop → widget shows
  "leave your details" static form; account flag + alert).
- Prompt-injection posture: corpus is clinic-authored (trusted-ish); visitor text is
  untrusted — tools validate arguments server-side; no tool writes anything except
  the defined contact/tag/email actions.

## Phase 1 — Chat Widget (web)

**1.1 Embed script** `chiro.omniply.io/widget.js` (+ `/widget/[token]` iframe)
- One line: `<script src=".../widget.js" data-omniply="<widgetToken>" async></script>`
- Launcher bubble + panel rendered in an **iframe** (style isolation beats shadow
  DOM for email-grade certainty), themed from the composed palette (header = brand
  band, buttons = nlButtonColor/nlButtonTextColor, logo variant per header luminance
  — same rules as everything else). Mobile-safe (bottom sheet).
- Booking-link card, lead-magnet card (title + cover thumb), contact form fallback
  when offline/over-budget.

**1.2 Chat API** `POST /api/agent/chat` (public, streaming SSE)
- {widgetToken, conversationId?, message} → streamed reply + tool events.
- Session continuity via conversationId (server-issued, unguessable).

**1.3 Provisioning + settings**
- `widgetToken` minted at auto-provisioning (new Account column) — every clinic is
  chat-ready the moment they embed.
- Settings page section "Chat Widget": on/off, embed snippet copy button, transcript
  list (flagged first), daily-budget indicator. WP-connected clinics: "add to site"
  instructions; the /linktree page can embed the widget too (same script).
- Onboarding: NOT a step (launch flow stays lean); mentioned in the finale message.

**1.4 Testing gates**
- Red-team suite as unit tests: 30+ adversarial prompts (diagnosis fishing, emergency
  phrases, discount requests, prompt injection, competitor bait) — every one must
  produce the safe behavior; suite runs in CI like the palette fixtures.
- Live pilot on the test account embedded on a scratch WP site before any client.

## Phase 2 — Voice Agent v1 ("promotes the booking URL")

VAPI (or Retell — decide at build time on latency/AU-number support; abstraction
lives in our webhook design either way). The voice agent is the SAME core via
server-tool webhooks; VAPI handles telephony/STT/TTS/turn-taking.

**2.1 Scope of v1** — an answering service, deliberately:
- Answers after-hours/overflow (or always, clinic's choice), in the clinic's brand.
- FAQs from the corpus (hours, location, parking, services, "do you treat X" →
  guarded non-clinical answer + booking push).
- **Booking promotion**: offers to TEXT the booking link (SMS via VAPI/Twilio number
  — one-way, no A2P campaign burden for transactional single texts in most regions;
  verify AU alpha-tag rules at build) OR takes a callback request.
- Emergency wordlist → urgent-care deflection (spoken), call flagged.
- Every call: transcript + summary + captured contact into GHL (`voice-lead` tag),
  optional email digest to the clinic each morning.

**2.2 Voice identity**
- Default: quality stock voice. Premium: the practitioner's ElevenLabs clone from
  onboarding (consent flow: explicit opt-in toggle — "your voice answers your
  phone"), EL streaming via the provider's integration. This is the demo that sells.

**2.3 Numbers + routing**
- Per-clinic number provisioned via the platform (AU/US/… per organizationCountryCode);
  clinic forwards their line after-hours (simplest, zero-port) or uses it as the
  published number later. Document the forwarding runbook per region.

**2.4 Billing**
- Metered add-on through the EXISTING Stripe-central pipeline: subscription item
  with included minutes (e.g. $99/mo incl. 300 min, overage per-minute), usage
  reported from VAPI webhooks. Chat included in base plan (cents) or soft-capped.

**2.5 Tier 2 (separate, connector-gated — NOT in this build)**
- `check_availability`/`book_appointment` tools against the Cliniko connector when
  it lands; voice+chat both inherit booking for connected clinics automatically.

## Phase 3 — Agent interop & discoverability (the "Google agents" hedge)

Context (user concern 2026-07-27): search platforms are moving toward agentic
surfaces, and Google historically favors Google. Assessment: the favoritism operates
in RANKING surfaces, not build tooling — Google's own agent-future bet (A2A) is a
vendor-neutral protocol donated to the Linux Foundation, and agentic search will
consume the open web through protocols + structured data. Strategy: do NOT move onto
Dialogflow/Vertex Conversational Agents (cost, weaker guardrail grip, model lock);
instead make OUR agent legible to every ecosystem's agents. If evidence of
platform-hosted preference ever materializes, the transport-agnostic core migrates
in weeks — that option stays open for free.

**3.1 schema.org clinic-entity markup — PULLABLE FORWARD (valuable pre-agent, cheap):**

What: `MedicalClinic`/`LocalBusiness` (name, address, phone, hours, geo, GBP
`sameAs`), `FAQPage` from the crawl corpus (logistics only — hours/parking/
insurance/first visit; NEVER clinical), `ReserveAction` → `bookingUrl`. This is
the ENTITY layer (who the business is / how to book) complementing the existing
per-article Article JSON-LD (content layer). Feeds AI Overviews/agentic search
today — candidate for the LAUNCH-ERA backlog, before the agent build.

**v1 — body-embedded ladder (proven pattern, ~2 days):**
- Same technique the article pipeline already uses in production
  (`wordpress-target.ts` appends `<script type="application/ld+json">` to post
  content — Google accepts JSON-LD anywhere in the DOM; body placement is
  SEO-equivalent to head). Note: REST content editing can't reach the theme's
  `<body>`-open — content renders inside theme wrappers; end-of-content chosen
  over start for editor UX (owner sees their content first) + damage isolation.
- Coverage ladder, best-available per site:
  1. Editable pages (homepage via settings `page_on_front`, contact/about):
     fenced block `<!-- omniply-schema -->…<!-- /omniply-schema -->` appended —
     replace-not-accumulate on update; WP native revisions = built-in undo;
     pre-edit content hash stored our side; every touched page logged.
  2. Page-builder sites (Elementor/Divi signatures detected in content):
     SKIP page edits (builders render from their own data, ignore content) →
     linktree page + article-publisher coverage only.
  3. Everyone: `/linktree` page carries the full entity+FAQ+ReserveAction block;
     article schema `publisher` enriched to the full clinic entity (every
     published article reinforces the graph).
- Connect-time capability probe: write+read-back a test block (multisite admins
  lack `unfiltered_html` → scripts stripped → degrade to linktree-only tier).
- Rollout: per-account flag; test account's WP first, then pilot clinics.

**3.1b — Omniply micro-plugin (v2 head injection; decided 2026-07-28):**
- OWN ~40-line plugin, deliberately dumb: reads ONE sanitized option, echoes it
  in `wp_head`; one capability-gated (`manage_options`) REST route so provisioning
  writes that option remotely. NO settings UI, NO PHP execution, no tracking.
- Install path: wordpress.org directory + WP core plugins REST endpoint
  (install+activate with the admin app password we already hold) — fully
  zero-touch per clinic.
- Unlocks: head-level entity schema on EVERY page regardless of page builder
  (collapses ladder tiers 1-2), future chat-widget self-embedding site-wide,
  theme-proof foothold for verification tags etc.
- REJECTED alternative (2026-07-28): installing a reputable third-party
  head-scripts plugin (WPCode/HFCM) — REST can install but NOT configure them
  (snippets live behind their admin UIs; no REST write path), which reinstates a
  per-clinic manual paste step; and snippet managers execute arbitrary PHP =
  far larger attack/blame surface than a print-only micro-plugin.
- Sequencing: SUBMIT to the .org directory EARLY (review queue = external clock,
  days-to-weeks; fits the pre-launch window with review landing during vacation);
  adoption post-launch. Maintenance ≈ zero by construction.

**3.2 A2A endpoint** — expose the agent core via the Agent2Agent protocol
(agent card + task endpoints); per-clinic identity; same guardrails and tools
(a search agent asking "book me at 3pm" gets the booking link / Tier-2 booking
exactly like a human chat visitor).

**3.3 MCP server** — same core exposed as per-clinic MCP tools (availability,
booking link, FAQs) for the Anthropic/OpenAI-side assistant ecosystem.

**3.4 Engine flexibility** — the core stays model-agnostic (Haiku-class default);
Gemini as a config-level engine option, so any future platform-side preference is
a setting, not a migration.

## Sequencing & estimates

| Stage | Contents | Est. |
|---|---|---|
| 0 | Agent core + guardrails + tools + tables + red-team suite | 4–5 days |
| 1 | Widget + chat API + settings + provisioning | 4–5 days |
| pilot | Test account + 2–3 friendly clinics, transcript review loop | 1–2 weeks calendar |
| 2 | Voice v1 on VAPI + numbers + Stripe metering | 5–7 days |
| 2.5 | EL voice-clone option | 1–2 days |
| 3.1 | schema.org body-ladder on clinic WP sites (pullable forward to launch era) | ~2 days |
| 3.1b | Omniply micro-plugin: build + .org submission (early — external review clock) | ~1 day build |
| 3.2–3.4 | A2A + MCP adapters + engine option (when ecosystems mature) | 3–4 days |

Prerequisites: launch complete; first cohort onboarded (their real corpora + PMS
dropdown data). Tier-2 booking waits for the PMS connector plan.

## Open decisions (flag at build time)
- Chat pricing: included vs $49 add-on (lean: included at launch = retention weapon,
  voice is the paid add-on).
- VAPI vs Retell final pick (AU numbers, latency, EL streaming support).
- Transcript retention window + privacy-policy language per jurisdiction.
- Whether the widget auto-injects on the WP /linktree page by default.

Related: `.plans/pms-connector-framework.implementation-plan.md` (Tier-2 booking),
`.documentation/ghl-snapshot-guide.md` (GHL AI surfaces stay OFF — this replaces them).
