# Omniply Marketing Site — Implementation Plan

**Locked (user, 2026-07-26):** canonical domain `omniply.io` (apex + www = marketing
hosts; the earlier ".com" was a slip). Two pages: `/` generic platform pitch,
`/chiropractors` chiro-specific. Brand: placeholder tokens derived from the favicon
(deep navy gradient + white hex-molecule linework) until real assets arrive.
Pricing SHOWN: **$397/mo flat** — no content costs, 25,000 emails/mo included —
juxtaposed against DIY hours + content-employee cost. Social proof: NO clients yet;
truthful angles = "the exact system high-end chiropractic coaches teach their clients
to run manually" (NEVER name the coach/company) + founder story (16 years marketing
for chiros/health professionals, scaled online businesses to 6-figures/mo, then
learned programming to automate it). Scarcity: **capped at 74 practices this quarter**
(real capacity cap). CTA: "Set up your account right now" → `NEXT_PUBLIC_CHECKOUT_URL`
env (the join.omniply.io GHL checkout when it exists; until then anchors to pricing).

## Copy architecture (Klaff skeleton, Kern connective tissue, Bencivenga bullets)

1. Hook / frame seizure (status-neutral, prize frame)
2. Problem reframe: consistency, not creativity (graph: compounding vs sawtooth)
3. Why obvious fixes fail: agencies, DIY, and AI agents (ChatGPT/Claude/agent
   frameworks) = NON-DETERMINISTIC; 90%-right-daily is a job, not automation
   (drawing: agent variance vs deterministic pipeline)
4. The Omniply frame: a deterministic content OPERATING SYSTEM with review gates
   (drawing: one brand in → five channels out, review gate center)
5. Money math: touchpoints → prospect conversion (graph) + rebooking/reactivation
   loop (graph; chiro page: "spines don't stop needing you")
6. Bencivenga feature→benefit bullets (voice-cloned onboarding, guardrails,
   lead-magnet library, QR review card, seasonal calendars, review ladder,
   newsletters, done-in-your-voice social)
7. Pricing block: $397 vs the alternative ($4-6k/mo content hire or 15+ h/week)
8. Founder story (Kern empathy peak) + coach-system proof line
9. Risk/scarcity close: 74 practices/quarter + CTA

Dash-free copy (house style). Subheads+bold = complete secondary reading path.

## Design

Placeholder tokens: ink `#0A1826`→`#05090F` gradient grounds, white linework,
one accent (electric azure family) doing all work; hex-molecule motif from the
favicon as decorative system. 5 inline-SVG drawings (components, themeable):
sawtooth-vs-compound, agent-variance, pipeline-OS, touchpoint-conversion,
reactivation-loop. Generous whitespace, 65ch measure, sticky CTA after fold.

## Tech

- Pages in apps/web: `/home` (generic, also directly routable for review) and
  `/chiropractors`; marketing-host middleware set {omniply.io, www.omniply.io,
  www.socioply.com} rewrites `/` → `/home`. Both public (no Clerk).
- Vercel: add apex + www domains to the project (apex A 76.76.21.21,
  www CNAME cname.vercel-dns.com — grey-cloud, user adds in Cloudflare).
- Ships via normal staging → prod flow; review on staging via /home + /chiropractors
  with the protection bypass.

## Later

- Real brand assets swap (tokens in one file), real checkout URL env, testimonials
  section when first clients exist, /dentists etc. reuse the machinery.
