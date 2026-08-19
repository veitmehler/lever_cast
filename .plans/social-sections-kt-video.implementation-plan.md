# Social: hard section assignment, batched captions, KT music-video

Origin: 2026-08-18 cadence test — the Aug 17 article's two runs produced
near-identical carousels. Diagnosis: (a) no-voice substitution collapsed all
video slots to carousels (format variety lost), (b) captions generated blind
to their siblings converged on the article's recurring anecdote even though
sections differed, (c) Monday matrix double-dips diagram-0's section by
design. User decisions 2026-08-19: hard section binding, arc-distance
interleave, batched captions in ONE call, KT music-video post type is
REQUIRED (no voiceover for azavea; music from the admin library), and the KT
video style also goes to the MAIN APP article days.

## Phase 1 — Deterministic section assignment (shared code)

- New article source: `art_section` with explicit index (replaces
  `art_hook_unused` / `art_hook_other` selector logic for slot content;
  `art_keytakeaways` stays for the KT slot).
- Content H2 sections only (existing exclusion list: no Key Takeaways, no
  FAQ, no Conclusion). Section N's carousel uses section N's stylized
  diagram (one exists per section); caption comes from section N's text.
- **Azavea (2-day cadence), arc-distance interleave:**
  - Day 1: P1 = section 1, P2 = section 3, P3 = section 5
  - Day 2: P1 = **KT music-video**, P2 = section 2, P3 = section 4
  - Needs exactly 5 content sections — matches current azavea output.
    If an article has 6+, day-2 P3 upgrades to section 6? NO — stay
    deterministic (2,4); extra sections simply go unused.
  - If fewer than 5: wrap deterministically (index % sectionCount), log a
    warning (no silent sameness).
- **Main app (single article day, 3 posts):**
  - P1 = section 1 (hook_video for voice accounts / carousel otherwise)
  - P2 = **KT music-video** (replaces the voiceover KT reel — works for
    EVERY account, voice or not)
  - P3 = section 3 carousel
  - Newsletter days unchanged.
- Voice substitution (`applyVoiceCapability`) unchanged for remaining video
  slots; it already preserves `source`.

## Phase 2 — Batched captions, one call per platform (shared code)

- Replace per-slot caption calls (3 slots x 3 platforms = 9) with ONE call
  per platform per run (= 3 calls): input lists the day's slots, each with
  its section heading + section text; output = strict JSON array of
  captions.
- Prompt keeps all existing rules (platform tone, hook-first-line, no
  invented facts, no health-outcome promises, brand voice) and adds:
  - "Each caption draws ONLY on its own section's content."
  - "The three captions must be mutually distinct: no shared scenes,
    anecdotes, openings, or phrasings. If two sections reference the same
    story, only the FIRST may use it."
- Cheaper than today (shared rules sent once per platform; 3 calls not 9).
- Robustness: JSON schema validation with retry; on repeated failure fall
  back to the existing single-slot caption path for the failing platform.
- De-AI dash sanitizer still runs per caption (unchanged).

## Phase 3 — `kt_music_video` post type (new, shared)

The format: 5–7s Seedance background clip, brand-color overlay, Key
Takeaways as bullet text, background music from the admin library, NO
voiceover. Short video loops on FB/IG; readers need 2–3 loops to finish the
bullets = watch-time retention. All ingredients exist:

- Background: `generateSeedanceClip` (already used by hook videos). Prompt:
  calm abstract motion in brand palette (per-account diagram style guide
  colors); admin Step 217 fal-model override respected.
- Overlay: brand tint + bullets rendered as a transparent PNG (reuse the
  tips_bullets story text renderer, new 4:5 feed aspect variant) composited
  over the clip with the existing ffmpeg overlay pass (same machinery as
  the hook video's title overlay). Logo per diagramLogoVariant.
- Music: `pickMusicTrack` from admin music_tracks library, mixed at full
  level (no narration -> no ducking), 2s fade-out. Mix pass is remux-only,
  cheap.
- Duration: keep the raw 5–7s clip length (platforms auto-loop; do NOT
  concat/extend).
- Fallback chain (ffmpeg reliability is a known watch item): any failure ->
  existing KT quote-card/carousel fallback, error logged on the spec.
- Stories: the paired story slot pitches it via the existing
  `pitch_carousel`-style reuse (thumbnail frame + swipe-up-free pitch).

## Phase 4 — Ops sequence (azavea)

1. Implement Phases 1+2, deploy both envs (staging E2E run first: one
   forced run on a staging article, eyeball 3 distinct captions).
2. Discard the two stale ready runs from the Aug 17 article (30 posts) —
   do NOT dispatch.
3. Social toggle window: flip `socialAutomationEnabled` off -> user
   approves Aug 10/12/14 cadence + 5 remaining backfill articles (site +
   LinkedIn/Medium variants only) -> flip back on. Bundle the promo-email
   "essay -> article" prompt override fix + reseed in the same window.
4. Next cadence article approved ON THE DAY (morning ET) -> first public
   set under the fixed system (sections 1/3/5, distinct captions).
5. Phase 3 lands next; first KT music-video goes out with the following
   article's day-2 run. Visual QA on staging before prod seed.

## Decisions locked (user, 2026-08-19)

- Section interleave day1 = 1,3,5 / day2 = 2,4(,6-unused); KT video anchors
  day 2 for azavea and replaces the KT reel slot on main-app article days.
- No voiceover for azavea (ElevenLabs voice stays unset).
- Captions batched in one call per platform.

## Open items

- Verify music_tracks library has at least one active track in BOTH envs
  before Phase 3 ships (admin backend upload if empty).
- Main-app KT reel retirement: confirm no clinic-facing copy references
  "voiceover recap" (docs sweep).
