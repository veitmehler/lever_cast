# Story-arc social posts (engagement v2)

Origin 2026-09-02: image-slide posts get no engagement; user wants
serialized first-person storytelling posts (modeled on the example
LinkedIn founder posts) — "superficial" by design so they stay
regulatory-compliant, and EVERY article should enable such an arc.

## Two-lane rollout (user-agreed)

1. **NOW (launch runway)**: 5 hand-crafted launch-arc posts in Veit's
   voice, personal LinkedIn profile, building to doors-open Sept 15.
   Drafted by Claude, REWRITTEN by Veit (authenticity is the genre's
   currency), scheduled via GHL (personal LinkedIn profile is connected).
2. **POST-LAUNCH (clinic feature)**: automated `story_arc` pipeline —
   this is how CLINICS get engagement; also a sales differentiator.

## Architecture sketch (lane 2)

- Arc planner per article: extract the article's existing belief arc into
  a 3-post outline (hook scene → shift/insight → resolution + soft CTA to
  the article).
- Post generator with continuity: each post receives the outline + prior
  posts VERBATIM (callbacks, "last week I wrote…"); ends with an open
  loop; final post links the article.
- New postType `story_text`: NO asset generation on LinkedIn/FB text
  posts — cheapest post type in the system.
- Narrator profile per account (owner name, first person) layered on
  brand writingStyle; new onboarding field. Azavea narrator = Veit.

## Compliance frame ("superficial")

Safe ingredients: article's aggregate numbers/citations; explicitly
composite generic scenes ("every practice has a Tuesday evening like
this"); the owner's own professional decisions/doubts. BANNED:
identifiable patients, invented specific patient events presented as
real, outcome promises. Existing per-industry ad restrictions + de-AI
rules + owner approval gate all apply.

## OPEN QUESTIONS (user flagged 2026-09-02 — DISCUSS BEFORE BUILDING)

1. **Posting structure**: publish an article's 3 arc posts back-to-back
   on the article's day(s), or spread them across the week? (User raised
   "3 in a row on a day" as one option — undecided.)
2. **FB/IG rendering**: the visual platforms get the story as a CAROUSEL
   with simple, CHEAP graphics (not text-only, not the expensive
   AI-image slides) — e.g. text-on-brand-color cards. Design TBD when
   building.
