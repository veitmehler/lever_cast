# Non-ElevenLabs Accounts: Video Slots → Tinted Carousels — Implementation Plan

**Status: PLANNED (decisions locked 2026-07-13). Not started.**

## Decisions (user, 2026-07-13)

- Accounts WITHOUT a working ElevenLabs voice get **NO video post types at all**: hook
  videos, quote videos AND video reels all convert to **static image carousels** using the
  existing full-page `brand_tint` overlay design.
- Converted slots use the **secondary brand color = the accent** (`nlLinkColor`, the
  palette's accent role from onboarding) as the full-page overlay — distinct from the
  Wed/Sat primary-tinted carousels, preserving weekly visual variety.
- **No music slideshows** (explicitly considered and rejected — native image carousels
  cannot carry music via any publishing API, and the slideshow-video workaround is not
  wanted). Silent videos are equally not wanted; hence full conversion.
- Self-healing in both directions: the substitution is resolved PER RUN from live voice
  capability — adding ElevenLabs later flips the slots back to videos on the next run,
  no migration.

## Mechanism: matrix-level substitution (NOT the failure fallback)

The decision happens at spec-resolution time in the weekly matrix / matrix-processor,
not as a degradation:

1. **Capability check**: reuse the exact gate the video pipeline already uses
   (`getVoiceSettings` → `voiceoverEnabled && apiKey && voiceId`). One helper
   `accountHasVoice(userId)` so matrix resolution and future callers agree.
2. **Feed-slot substitution**: when resolving a day's specs for a no-voice account, every
   video post type (hook video, quote video, video reel — enumerate the exact spec type
   names from weekly-matrix.ts at build time) becomes a carousel spec with
   `designVariant: 'brand_tint_accent'` (new variant value alongside `'brand_tint'`).
   Slide content sourcing stays what the carousel generator already does for that slot's
   content source (article/newsletter).
3. **Companion-story substitution**: story slots that promote a converted feed slot (the
   pitch-hook story that requires `hookRawVideoUrl`, the reel-promo story) become
   carousel-promo stories (the existing S1 pattern that reuses feed slides). The
   "Feed hook clip required" hard-fail guard stays UNTOUCHED for voice accounts — it
   remains correct-by-design there.
4. **Compositor**: `brand_tint_accent` = the existing brand-tint renderer with
   `overlayColor` taken from the accent (`nlLinkColor`) instead of the primary tint
   color; the existing luminance logic picks title fill; light/dark logo variant chosen
   the same way. (Small refactor: tint config gains a color-role parameter rather than
   duplicating the two SVG blocks.)
5. **Failure fallback unchanged**: voice accounts whose hook-video encode fails keep the
   existing image-carousel degradation path.

## Touch points

- `social/automation/weekly-matrix.ts` + `matrix-processor.ts`: capability check +
  substitution table (feed + story), spec labels so the review UI shows the true type.
- `social/generate-assets.ts`: accept + thread `brand_tint_accent`.
- `social/compositors/carousel.ts`: tint color-role parameter.
- `lib/` or `social/`: `accountHasVoice(userId)` helper wrapping getVoiceSettings.
- No schema changes; no new prompts; no config rows.

## Tests + verification

- Unit: matrix resolution for a no-voice account (every video slot substituted, story
  companions swapped, voice account untouched); compositor renders accent overlay with
  correct title fill on light vs dark accents.
- Staging E2E: flip the test account's voice off → run an article + newsletter social day
  that includes hook-video/reel/quote-video slots → expect 6/6 with zero video assets,
  accent-tinted carousels eyeballed (contrast!), captions correct for carousel type;
  flip voice back on → same day resolves to videos again.
- Cost note: converted slots swap Seedance+encode costs for ~$0.039/slide images; no-voice
  accounts become fully immune to the ffmpeg-encode reliability concern.

## Tie-ins

- Completes the onboarding plan's noted follow-up ("non-EL accounts → hook-video slots
  become image carousels") — the ElevenLabs "maybe later" choice now yields a fully
  coherent content mix instead of silent videos.
- Onboarding template-reveal already captures the accent color with user confirmation,
  so the overlay color is always a client-approved brand color.
