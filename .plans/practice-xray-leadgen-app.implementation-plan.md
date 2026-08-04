# The Practice X-Ray — Lead-Gen App Implementation Plan

**Status: PLANNED (awaiting green light) — 2026-08-04**

Buyer-activation quiz funnel marketing Omniply itself. Strategy source:
`Lead-Gen-App-Brief-for-Claude-Code.md` (GAP framework: Give the win → Aim the
spotlight → Pave the path), adapted per discussion:

- Name: **The Practice X-Ray** — tagline *"See the revenue your practice can't."*
  Hook: "You X-ray patients before treating them. Nobody's ever X-rayed your practice."
- CTA: **walkthrough sales video** (never a call) → GHL checkout → existing
  zero-touch provisioning. Fully self-serve funnel end to end.
- Leak model has **two engines**, and Patient Drift (retention) is the reveal:
  Omniply's constant-contact machinery brings existing patients back — the
  biggest leak for established practices is patients they already have.
- Currency: selectable symbol (USD default, locale-suggested: AUD/CAD/GBP/NZD/EUR),
  **no FX conversion** — all money inputs are the user's own.

## 1. Funnel & screen flow

`omniply.io/x-ray` → single self-contained page, five states:

1. **Hook** — headline + tagline, "12 questions · 2 minutes · your score and your
   monthly leak figure," currency selector (small, corner), CTA "Start my X-Ray".
   No site nav — a funnel page, no escape hatches.
2. **Question flow** — one question at a time, progress bar, tap-to-answer cards,
   sliders for numerics, back button, animated transitions. Section micro-labels
   ("Scanning: Patient Retention…").
3. **Scan interstitial** (~2s X-ray scan animation) → **capture gate**: "Your
   X-Ray is ready. Where should we send your report?" — name + email required,
   phone + practice name optional. One consent microline.
4. **Results — "Your X-Ray Results"**
   - Total **Practice Autopilot Score** 0–100 (animated dial)
   - Four axis bars with sub-scores
   - **Verdict**: pre-written splinter paragraph for the weakest axis, with
     their numbers spliced in
   - **The Leak**: total $/month in huge type, split into **Patient Drift Leak**
     + **New-Patient Response Leak**; "Check our math" expander shows formulas
     AND lets them adjust every assumption (honesty = credibility = engagement)
   - Economic punchline: "That's ≈ **N×** the monthly cost of fixing it —
     recovering one patient a month pays for the whole system."
   - **One CTA**: "Watch the 12-Minute Practice Autopilot Walkthrough →" with
     `?axis=<weakest>` deep-link to the matching video chapter.
5. **/walkthrough page** (separate, minimal shell): video embed + buy button →
   GHL checkout URL. Ships as placeholder until the video is recorded; the app
   build does not block on it.

Results are NEVER blocked on the webhook (fire-and-forget + one retry).
localStorage snapshot so a returning visitor lands back on their results.

## 2. Axes & question set (12 steps, 14 data points)

Axis A — **Content & Visibility** (weight 25)
- A1 posting frequency: daily+ / few×week / few×month / rarely (10/7/3/0)
- A2 who creates content: system-agency / staff when time allows / owner late at night / nobody
- A3 patient newsletter: weekly / monthly / occasionally / never (also feeds drift modifier)

Axis B — **Speed-to-Lead & After-Hours** (weight 25)
- B1 call during treatment/after hours: AI-or-service books them / voicemail returned same day / returned when we can / they just miss us
- B2 website & social inquiry response time: minutes / same day / days / often never
- B3 (slider) new-patient inquiries per week, 0–50, default 10

Axis C — **Google Review Engine** (weight 25)
- C1 review count: 300+ / 100–299 / 30–99 / under 30
- C2 how reviews happen: automatic after visits / we ask when we remember / patients on their own / we avoid asking

Axis D — **Patient Retention & Recall** (weight 25) — the drift engine
- D1 end of care plan: automated recall + ongoing contact / front desk tries to rebook / "come back if it hurts" / nothing
- D2 between-visit contact: regular valuable content / occasional promos / holiday messages / none
- D3 (slider) % of patients on a regular maintenance schedule, 0–80%, default 20%
- D4 (one screen, two sliders) "Quick numbers": active patients in database
  (100–5,000, default 800, log steps) + average visit fee ($40–$150, default $65)

Scoring: answers carry points, each axis normalized to 0–100; total = equal-weight
mean (weights tunable constants). Verdict = lowest axis; tie-break order
Retention > Speed > Reviews > Content (product-strength order). Four pre-written
verdict paragraphs, one per axis.

## 3. Leak formulas (all constants named, labeled, user-adjustable in the expander)

**Patient Drift Leak /mo** =
`activePatients × max(0, TARGET_MAINT_RATE − theirMaintRate) × REALIZATION × visitFee × MAINT_VISITS_PER_YEAR / 12`
- TARGET_MAINT_RATE = 0.35 ("what a systematic-recall practice retains" — labeled assumption)
- REALIZATION = 0.5 (we only credit half the gap — conservatism multiplier, stated)
- MAINT_VISITS_PER_YEAR = 8
- Example: 800 × (0.35−0.20) × 0.5 = 60 patients × $65 × 8/12 ≈ **$2,600/mo**

**New-Patient Response Leak /mo** =
`weeklyInquiries × 4.33 × missedShare(B1,B2) × NO_CALLBACK_LOSS × WOULD_CONVERT × firstYearValue`
- missedShare derived from their B1/B2 answers (0.05 best → 0.35 worst)
- NO_CALLBACK_LOSS = 0.6, WOULD_CONVERT = 0.6 (labeled assumptions)
- firstYearValue = visitFee × FIRST_YEAR_VISITS (12) — derived from THEIR fee, no LTV question needed
- Example: 10/wk × 4.33 × 0.25 × 0.6 × 0.6 × $780 ≈ **$3,000/mo**

Review gap: **qualitative splinter only** (no invented dollars) — one sentence
comparing their count to local-leader benchmark.

Punchline: `N = round(totalLeak / 397)` → "≈ N× the monthly cost of fixing it."
(397 is a `PRICE_MONTHLY` constant.)

## 4. Capture & CRM wiring

On gate submit, POST JSON to `CONFIG.WEBHOOK_URL` (GHL inbound-webhook workflow
on the Omniply marketing location):
`{name, email, phone?, practiceName?, currency, axisScores{4}, totalScore,
weakestAxis, driftLeak, responseLeak, totalLeak, answers{q1..}, utm_*, referrer, ts}`

GHL side (user, ~30 min, guide provided at build time): inbound-webhook workflow →
upsert contact, tag `xray-lead`, write custom fields (4 axis scores, total,
weakest axis, leak $, currency), enter nurture sequence. Nurture email copy =
separate later task (re-agitates THEIR weakest axis, always links the video
chapter). UTM passthrough from day one for future ads attribution.

## 5. Design direction

X-ray visual language, Omniply-brand-adjacent: deep radiograph navy/near-black
ground, luminous cyan-blue accent (X-ray glow), bone-white type, strong grotesk
for the big numbers, film-frame results card, scan-line pass animation, dial
count-up, bar fills. Mobile-first (link lives in DMs/posts/ads). Screenshot-worthy
results card is an explicit requirement. `prefers-reduced-motion` respected.
OG tags + share image so the link unfurls well.

## 6. Technical shape

- `apps/web/public/x-ray/index.html` — fully self-contained (inline CSS/JS, zero
  external deps), served at `/x-ray` via a next.config rewrite. Survives any
  future site migration; no React coupling.
- `/walkthrough` — minimal page (same treatment) with `VIDEO_URL` + `CHECKOUT_URL`
  constants; placeholder copy until the video exists.
- All tunables in one `CONFIG` block at the top: webhook URL, checkout URL, video
  URL, price, every formula constant, brand colors.
- Math written as pure functions on a `window.XRAY` object → vitest + jsdom test
  file loads the page and exercises scoring + both leak formulas against fixed
  fixtures (incl. boundary cases: 0 inquiries, maintRate ≥ target, worst/best
  paths, currency formatting).

## 7. Rollout

1. Build page + math + tests → deploy to staging web → user eyeballs at staging URL
2. User creates GHL webhook workflow + custom fields (guide provided) → E2E test lead
3. Deploy prod → link live at omniply.io/x-ray (usable in outreach immediately,
   even while the video is still "coming soon" — gate + nurture already capture)
4. Later, separate tasks: walkthrough video script; nurture email copy; OG image
   polish; optional ads + A/B on gate placement.

## Dependencies on the user

- GHL: marketing-location inbound webhook + custom fields (30 min with my guide)
- Checkout URL (existing SaaS-configurator purchase link)
- Walkthrough video (script = my next task after the app ships)

## Explicitly out of scope (per discussion)

- Per-clinic patient-facing quiz apps (post-launch roadmap, sibling of chat widget)
- Sales-call CTA of any kind; multi-CTA results pages; FX conversion
