# Omniply Chat Agent v1 — Comprehensive Build Plan (text chat; voice is a later layer)

**Status: PLAN for review — 2026-08-05 · LAUNCH SCOPE (decision A)**

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
- **Model**: Haiku-class default (`claude-haiku-4-5`) — cents per
  conversation, strong instruction-following; per-account escalation flag to
  Sonnet-class if a pilot demands it. Model-agnostic config (Gemini as
  fallback option).
- **Tables**: `AgentConversation` {accountId, channel, visitorKey, flagged,
  endedReason} + `AgentMessage` {role, content, toolCalls, filtered} — the
  audit trail. (Schema addition → migration.)
- **API**: `POST /api/agent/chat` (public, SSE streaming) {widgetToken,
  conversationId?, message}. Widget token minted per account at provisioning
  (new column), origin-checked against the clinic’s domains.
- **Widget**: one-line loader `<script src=…/widget.js data-omniply=TOKEN>`
  → launcher bubble + iframe panel (style isolation, like the Spine Check
  decision), themed from the composed palette, mobile bottom-sheet. Offline/
  over-budget state degrades to a static “leave your details” form (which
  still captures → GHL).
- **Cost & abuse**: per-IP burst limits, per-conversation turn caps,
  per-account daily LLM budget (~$2/day default ≈ hundreds of conversations;
  hard stop → static form + alert), LLMUsage cost logging like every other
  pipeline.
- **Install paths**: (a) embed snippet shown in Settings + onboarding finale
  message; (b) auto-embedded on the /linktree page; (c) WP site-wide via the
  omniply-connect plugin v2 AFTER the .org review completes (post-launch —
  do not disturb the pending “print-only” review). Voice later plugs into the
  same engine via webhook transport (VAPI), per the original plan.

## 5 · Sequencing (launch scope) & estimates

| Step | Contents | Est. |
|---|---|---|
| C0 | Agent core: context + Places hours + guardrails + tools + tables + deterministic filter tests | 3–4 d |
| C1 | Widget (bubble/iframe/theme) + chat API (SSE) + provisioning token + Settings section | 3 d |
| C2 | Magnet offers + callback→GHL + snapshot note (callback-requested workflow) + cost caps + transcript list | 2 d |
| C3 | Red-team eval on staging + pilot on dev clinic’s WP + fixes | 1–2 d |
| — | **Video Scene 8 capturable after C1** (chat demo); voice demo waits for the voice layer | — |

Total: **~9–11 focused days** — the long pole of the launch window, which is
why it starts as soon as this plan is approved.

## 6 · Decisions needed (user)

- **A. Model default**: Haiku-class (recommended) — confirm.
- **B. Greeting + disclosure wording**: draft above — edit like all copy.
- **C. Callback “reason” handling**: pass the visitor’s one-line reason to
  the clinic notification (recommended — clinics need context; they are the
  health provider) vs. keep reasons only in our transcript.
- **D. Transcript retention**: 90 days default — confirm.
- **E. Chat pricing**: included in $397 at launch (recommended: retention
  weapon; voice becomes the paid add-on later) — confirm.
- **F. English-only v1** — confirm.
- **G. Daily LLM budget default per clinic**: ~$2/day — confirm.
