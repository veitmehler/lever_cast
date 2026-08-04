# Marketing Site Refresh — /home overview + /chiropractors letter rewrite

**Status: PLAN for review — 2026-08-05**

Source of truth for voice/claims: `.documentation/marketing/practice-treatment-plan-master-pitch.md`.
Funnel integration: primary CTA everywhere = Practice X-Ray (`/x-ray`); secondary = `/walkthrough`.

## Audit findings (current pages)

Both pages are competent Klaff-skeleton sales letters (presence/consistency
angle, Princeton tenth-of-a-second opener) with a solid reusable component kit:
`ConsistencyGraph, VarianceDiagram, PipelineDiagram, TouchpointGraph,
ReactivationLoop, PricingBlock, MapPackDiagram, Faq/FaqJsonLd`. Strong chiro
FAQ (compliance, booking-system, review ethics, WordPress). Good founder block.

Conflicts with the new direction:
1. **"74 practices this quarter" cap** — 6+ occurrences incl. two FAQ answers
   defending it. Manufactured scarcity; the master pitch (and user) ban it.
   REMOVE everywhere.
2. **CTA "Set up your account right now"** → replace with X-Ray primary CTA.
3. **No X-Ray, no leak/drift, no Omniply Loop** — pages predate the funnel.
4. Home is a full generic letter → becomes the graphical platform overview.
5. NOTE the letters do NOT promise AI chat/voice (Response) — the X-Ray funnel
   DOES. Decision needed (see below).

## / (home) — graphical platform overview (replaces generic letter)

1. **Hero**: one-sentence platform definition ("Omniply is the marketing
   autopilot for local practices") + immediate above-the-fold pathway card
   **"For Chiropractic Practices →"** (/chiropractors) + X-Ray chip.
2. **The Omniply Loop** — centerpiece animated flywheel (web adaptation of the
   PDF SVG: Presence → Proof → Recall → Response), one line per node.
3. **How it runs**: PipelineDiagram + the review-gate line ("you approve, it
   ships — nothing carries your name unseen").
4. **Stat band**: 78% / 100× / 2 days with source footnote (same as funnel).
5. **Verticals**: Chiropractic (LIVE → letter + X-Ray links); quiet
   "more practice types coming" slots — credible platform story, no fake
   availability.
6. **Founder block** (condensed 16-years).
7. **Close**: X-Ray CTA card + walkthrough link.
- FAQ moves off home (lives on the letter); FaqJsonLd goes with it.

## /chiropractors — the master pitch in page form

1. **Hook**: "Patients don't leave. They fade." hero; sub = the leak frame;
   CTA "Get your Practice X-Ray — 2 minutes".
2. **The Big Change**: three forces (condensed §2) + stat band.
3. **Belief shift**: keep the current "never survives a busy week" +
   coaches material (it IS §3's argument) + "physics problem" line +
   ConsistencyGraph.
4. **Drift** (new section): patient drift + electrician beat +
   ReactivationLoop.
5. **The Omniply Loop**: mechanism section (four parts; PipelineDiagram;
   Response pillar per decision below).
6. **Proof / Map Pack**: keep current reviews section (aligns) + MapPackDiagram.
7. **The Prognosis**: six bullets from §5 + a compact "what you actually get"
   deliverables list (articles, newsletter + 25k sends, social, lead-magnet
   library, QR review card, one approval inbox).
8. **Economics**: one-patient math (your fee × 12 vs $397) + PricingBlock.
9. **Founder** (keep as-is).
10. **FAQ**: current chiro set MINUS the 74-cap item, PLUS data/PMS items from
    the nurture doc where not duplicated.
11. **Close**: honest §8-style close, no cap, X-Ray CTA.

## Global

- All CTAs: primary → /x-ray, secondary → /walkthrough.
- Metadata/titles updated; keep FaqJsonLd on the letter.
- Voice: master-pitch register (ellipses), keep the existing dash-free house
  style for site copy.
- All stats carry the verified sources (footnote link or title-attr).

## DECISIONS NEEDED (user)

- **A. Response pillar claims.** The X-Ray funnel + walkthrough promise AI
  chat/voice; the current site deliberately doesn't (chat/voice agent is a
  post-launch build). Options: (1) full Loop on the site now, worded as the
  system's design ("answers in seconds" — must be true at purchase time);
  (2) stage it: site shows the Loop with Response marked "rolling out";
  (3) keep site to the three live pillars until the agent ships.
  This decision also affects the walkthrough video script.
- **B. Princeton opener**: keep the tenth-of-a-second beat as a support inside
  the forces section (recommended), or drop entirely for drift-first purity.
- **C. Home FAQ removal** OK? (SEO JSON-LD moves to the letter.)
