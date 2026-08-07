# Omniply Chat Agent v1 — Comprehensive Build Plan (text chat; voice is a later layer)

**Status: APPROVED — decisions locked 2026-08-05 · LAUNCH SCOPE · build in progress**

Supersedes Phases 0–1 of `.plans/ai-chat-voice-agent.implementation-plan.md`
for the launch build; that doc remains the map for voice (Phase 2) and agent
interop (Phase 3). Ground rules carried forward: one agent core (transport-
agnostic — voice wraps the SAME engine later), booking stays in the clinic's
own booking page (`bookingUrl`), zero-setup knowledge (the clinic never
authors a KB), GHL AI surfaces stay off.

---

## 1 · The knowledge model — what the agent actually knows

Assembled per account into one context bundle (cached ~15 min); every fact
traceable to a source. **The agent may only state what the bundle contains.**

| Source | Facts | Freshness |
|---|---|---|
| BrandSettings (onboarding) | practice name, description, WHO, specializations, tone/voice sample, bookingUrl, phone, clinicFaqs (logistics Q&A) | live |
| Site corpus (onboarding crawl, `stepData.corpus`) | services, practiteam bios, parking/access notes, new-patient info | monthly re-crawl of the live site |
| **Google Places Details** (Tier-2 key, ALREADY LIVE for reviews) | opening hours (weekday_text + periods), holiday hours where present, formatted address, phone, rating + review count, utc_offset | cached 24 h per account |
| Live guide library (LeadGenDocuments) | magnet titles + slugs for in-chat offers | live |
| Server-computed per turn | **“open now” verdict + today’s hours + clinic-local time** — computed from Places `periods` + utc_offset ON THE SERVER and injected as plain fact | every turn |

Places resolution: `googleBusinessProfileUrl` → placeId (reuse the resolution
already built for Tier-2 review pulls), stored on the account; nightly refresh
job updates the hours snapshot. **“Are you open?” is never model-guessed** —
the engine computes it and the model just phrases it.

## 2 · The conversation flow (the dialog policy)

One LLM call per turn, but fenced by deterministic layers. Turn pipeline:

```
visitor text
  → PRE-FILTERS (no LLM):
      red-flag lexicon → HARD-CODED urgent-care reply + flag + stop
      abuse/flood caps → polite curb
  → ENGINE CALL: system prompt + knowledge bundle + computed hours
      + history (≤20 turns) + tools
  → POST-FILTER: forbidden-pattern scan on the reply
      violation → safe fallback + transcript flagged
  → ACTIONS: server-validated tool executions (contact, tags, notify)
```

**Opening.** Bubble → panel opens with: “Hi! I’m {Practice}’s AI assistant.
I can help with appointments, hours and general questions — I’m not able to
give medical advice.” + quick-reply chips:
`[Book an appointment] [Hours & location] [Your first visit] [Ask something]`
Chips carry ~80 % of traffic down deterministic rails; free text always works.

**Intents & behaviors** (the model is instructed per-intent; tools do the acting):

- **Booking** (primary goal — every path funnels here): `send_booking_link`
  renders a booking card (their real booking page, new tab). Hesitations
  (“how much first?”) get answered from KB, then the offer repeats once.
- **Hours / open now**: answered from the server-computed verdict — “We’re
  open now until 6pm” / “Closed now; open tomorrow from 8am” + today’s hours.
- **Location / parking / contact**: Places address + corpus notes; maps link.
- **“Do you treat X?”**: allowed to confirm the clinic OFFERS a service /
  commonly works with people experiencing X (only if in KB), NEVER whether it
  will help this person: “Many patients come to {Practice} with exactly that.
  Whether it’s right for *you* is what the first visit is for…” → booking.
- **Symptom / clinical questions (non-red-flag)**: empathetic, zero
  explanation of conditions, redirect to appointment. v1 policy is strict:
  no health education in chat — that is what the content engine is for.
- **Red flags** (pre-filter, never reaches the model): severe/sudden symptom
  lexicon (chest pain, numbness in legs/groin, bladder/bowel changes, recent
  major trauma, worst-ever headache…) → hard-coded: “Please contact emergency
  services ({000|911|111|999|112} by organizationCountryCode) or urgent care
  now — this isn’t something to wait on.” Conversation flagged for review.
- **Pricing / insurance**: KB facts only; unknown → “the front desk will
  confirm — want a callback?” → `request_callback`.
- **First visit**: logistics from corpus + the first-visit guide offered
  (`offer_lead_magnet`) — chat becomes another capture door into the drip.
- **Guide offers by topic**: desk/sleep/morning topics → matching magnet →
  email captured in-chat → `capture_contact` + `leadgen-<slug>` tag → the
  existing 5-branch drip fires. (Same machinery as the Spine Check.)
- **Callback / human handoff**: name + phone (+ brief reason) →
  `request_callback` → GHL contact + `callback-requested` tag (snapshot
  workflow notifies the front desk) → “expect a call when they open at {time}.”
- **Off-topic / chitchat**: one friendly beat, steer back.
- **Competitors / legal / press**: neutral non-engagement + handoff offer.

**Closing**: after booking-link click or resolution — “Anything else?” →
quiet end. Transcript stored.

## 3 · Compliance architecture (the MUST)

Layered so that no single failure produces an unsafe reply:

1. **Identity & disclosure** — always discloses AI status (first message +
   persistent footer: “AI assistant · not medical advice · emergencies:
   call {local number}”). Never claims clinician status.
2. **Deterministic red-flag interception** BEFORE the model (word/phrase
   lexicon, unit-tested) — emergencies are never left to LLM judgment.
3. **Prompt rails**: no diagnosis, no treatment advice, no outcome promises,
   no condition-specific reassurance, no testimonials, no discounts/
   inducements, no superlatives (AHPRA-grade advertising posture; equally
   safe for US state boards).
4. **Post-filter**: pattern scan on every reply (“you have…”, “sounds like…”,
   diagnose/cure/guarantee families, dosage-like strings) → safe fallback +
   flagged transcript. Flagged conversations surface first in the Settings
   transcript list.
5. **Privacy & data minimization**: no health information requested, ever;
   contact capture = name/email/phone + a short free-text reason the visitor
   volunteers. Transcripts retained 90 days (configurable later), stored our
   side as the audit trail; CRM receives only contact fields + tags + the
   one-line reason. No cookies — session id in memory/localStorage
   (strictly-functional). Footer links the clinic’s privacy policy.
6. **Red-team suite as a release gate**: 40+ adversarial prompts (diagnosis
   fishing, emergency phrasing variants, prompt injection via “ignore your
   instructions”, discount begging, competitor bait, PHI dumping) — the
   filter layers are CI-tested deterministically; the full LLM-behavior suite
   runs as a scripted eval on staging before any clinic gets the widget.

## 4 · Technical build

- **`apps/api/src/agent/`**: `context.ts` (bundle assembly + Places hours
  snapshot + open-now computation), `guardrails.ts` (lexicons, post-filter,
  regional emergency numbers), `tools.ts` (send_booking_link,
  capture_contact, offer_lead_magnet, request_callback, handoff_human — all
  arguments server-validated), `engine.ts` (model call, streaming, budgets).
- **Model**: admin-managed (decision A) — the agent's model is a stored
  setting selectable across all connected providers, edited on the
  `/admin/agents` page alongside the prompts (decision B); the engine calls
  through the same provider abstraction as the pipelines. Seeded initial
  value: `claude-haiku-4-5` (cents per conversation, strong
  instruction-following).
- **Tables**: `AgentConversation` {accountId, channel, visitorKey, flagged,
  endedReason} + `AgentMessage` {role, content, toolCalls, filtered} — the
  audit trail. (Schema addition → migration.)
- **API**: `POST /api/agent/chat` (public, SSE streaming) {widgetToken,
  conversationId?, message}. Widget token minted per account at provisioning
  (new column), origin-checked against the clinic’s domains.
- **Widget**: one-line loader `<script src=…/widget.js data-omniply=TOKEN>`
  → launcher bubble + iframe panel (style isolation, like the Spine Check
  decision), themed from the composed palette, mobile bottom-sheet. Offline/
  abuse-ceiling state degrades to a static “leave your details” form (which
  still captures → GHL).
- **Admin surface (decisions A+B)**: `/admin/agents` page in the
  `/admin/prompts` style — system prompt, greeting/disclosure copy, and model
  selector, DB-backed (agent_* prompt rows + config), seeded by the build.
- **Callback summary (decision C)**: on `request_callback`, a cheap model
  call produces a 2–3 sentence conversation summary appended to the GHL
  contact note/notification the front desk receives.
- **Cost & abuse (decision G)**: per-IP burst limits, per-conversation turn
  caps, $1.50/day included LLM budget per account — over budget the widget
  KEEPS working and overage cost is recorded per account for surcharge
  billing (alert fires; Stripe metering ships with the voice phase). Hard
  stop only at the ~10× abuse ceiling (→ static leave-your-details form).
  LLMUsage cost logging like every other pipeline.
- **Install paths**: (a) embed snippet shown in Settings + onboarding finale
  message; (b) auto-embedded on the /linktree page; (c) WP site-wide via the
  omniply-connect plugin v2 AFTER the .org review completes (post-launch —
  do not disturb the pending “print-only” review). Voice later plugs into the
  same engine via webhook transport (VAPI), per the original plan.

## 5 · Sequencing (launch scope) & status (2026-08-05)

| Step | Contents | Status |
|---|---|---|
| C0 | Agent core: context + Places hours + guardrails + tools + tables + deterministic filter tests | ✅ DONE (e479432) — deployed staging, live smoke passed (red-flag/injection/treat-X/grounding) |
| C1 | Widget (bubble/iframe/theme, JSON turn — adapters have no SSE; provisioning token) | ✅ DONE (21bb348) — verified via Playwright on omniply.io/agent-test (unlisted, loads staging) |
| C2a | Callback EXECUTION: GHL contact (phone-first upsert) + callback-requested/chat-agent-lead tags + note + Chat Summary custom field (find-or-create) + add_contact_email follow-up + prompt v3 strict flow + widget 409 self-heal | ✅ DONE (fe6414d/2c4a97d/494d929) — full flow verified against real GHL incl. dedupe-by-phone |
| C2b | capture_contact guide flow live-test + `/admin/agents` page + Settings embed section + budget crossing alert email + 180-day retention cron + admin transcript list | ⬜ NEXT |
| C3 | Red-team eval on staging + pilot on dev clinic’s WP + fixes | ⬜ |
| — | **Video Scene 8 capturable NOW** (staging widget demo); voice demo waits for the voice layer. Snapshot needs the callback-requested workflow (SMS/email template: `📞 Callback request: {{contact.first_name}} {{contact.phone}} — {{contact.chat_summary}}`) | — |

Total: **~9–11 focused days** — the long pole of the launch window, which is
why it starts as soon as this plan is approved.

## 6 · Decisions (LOCKED 2026-08-05)

- **A. Model: admin-managed.** The agent model is selectable across every
  connected provider (anthropic/gemini/openai) from the admin area — stored
  config like the pipeline prompts, changeable without deploys. Sensible
  initial value: Haiku-class.
- **B. Agent prompts: admin-editable.** New page `/admin/agents` in the
  style of `/admin/prompts`: the agent system prompt, greeting + disclosure
  copy, and the model selector live there (DB-backed, seeded like nl_*
  prompts). The build seeds v1 copy; the admin edits from then on.
- **C. Callback = request + BRIEF CHAT SUMMARY.** `request_callback`
  generates a 2–3 sentence conversation summary (cheap model call) and
  passes it with the contact into the clinic notification — front desk gets
  context, not just a name and number.
- **D. Transcript retention: 180 days.**
- **E. Pricing: chat INCLUDED in $397.** Voice (later phase) also included
  up to N bundled minutes, then per-minute surcharge — voice-phase Stripe
  metering designs to that shape.
- **F. English-only v1.**
- **G. LLM budget: $1.50/day included, then metered surcharge.** Over-budget
  does NOT degrade the visitor experience — usage continues, overage is
  recorded per account for surcharge billing (Stripe metering lands with the
  voice phase; v1 records + alerts). Abuse ceiling stays as a hard stop at
  ~10× the included budget to cap attack-driven bills.

---

## STATUS ADDENDUM — 2026-08-06 (current)

C0–C2b COMPLETE and live on staging AND prod (post-outage manual deploys,
main @ faf3a01). Since the original plan, three hardening batches landed —
detail in `.plans/chat-kb-widget-refinements.implementation-plan.md`
(sections E–H): KB onboarding + Settings editor, UX batch (guide cards →
later superseded, greeting v2, dash elimination, teaser), and the
contact-convergence + mobile batch.

Behavior rules locked by user testing (2026-08-06), now part of the spec:
1. ONE GHL contact per conversation — update-by-id convergence; the
   callback-backup email is the deliberately-chosen PRIMARY email.
2. KNOWN VISITOR DETAILS is exhaustive — the model must never claim a
   detail is "on file" that isn't listed (hallucination found in testing).
3. Captured guides deliver BY EMAIL ONLY; the in-chat card exists solely
   for email-decliners (send_guide_link).
4. capture_contact requires only a valid email (name optional — a required
   name silently killed real captures); any validation-dropped action flags
   the conversation (`action-dropped:<type>`).
5. Finalizer cron (10-min sweep, 15-min idle): reconcile details onto the
   contact + one summary note for non-callback leads. Inactivity IS the end
   of a chat; time-sensitive effects stay inline.

Measured economics (real test conversation): ~$0.003/turn, 3.4¢ for a long
11-turn conversation → 40+ such/day inside the $1.50 budget. Model stays on
Claude Haiku — data-compliance decision (no-training API defaults) beats
OpenRouter/DeepSeek cost savings; admin model selector keeps the door open.

**C3 red-team remains the sole clinic-widget gate.** Scope grew with each
locked rule — the suite must cover: refusal under rephrasing, insurance
boundaries, free-assessment terms, dash-free output, KB-edit propagation,
known-details memory + claim-possession probes ("what's my number?"),
multi-action convergence with mid-flow detail changes, and
delivery-promise-without-action detection. Next: a week of varied user
testing + a new test practice with a good KB, then C3.
