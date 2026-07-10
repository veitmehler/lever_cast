
# Implementation Plan — Fix article-day social: date alignment + section selection

Status: **implemented** (audited 2026-07-09) — shipped in commit 5aada14 (UTC day alignment + non-content-section exclusion). · Author: investigation 2026-07-03

## Problem (both confirmed on staging)
1. **P3 on article days is built from "Key Takeaways."** The last two P3 posts both have
   `assets.title = "Key Takeaways"` and slides generated from that section.
2. **Dates disagree by one day** between the dashboard content plan (Thursday) and the
   social posts/calendar (Wednesday), which *also* makes Thursday articles run the
   **Tuesday** matrix (P1/P3 swapped from the intended Thursday layout).

## Root causes
### Cause A — non-content H2s are eligible for section slots
Enrichment injects a **`Key Takeaways` H2** (and FAQ/Conclusion) into the article body, so
`buildArticleContentContext` includes it in `ctx.h2Sections`. `resolveArticleSlot('art_hook_other', …)`
picks *"the first H2 section whose heading ≠ the diagram-carousel section"* → that lands on
**"Key Takeaways."** The image-carousel fallback (`sectionAtIndex`) can hit it too. Non-content
sections are never filtered out.

### Cause B — date-only topic date is timezone-shifted for social
`topic.scheduledDate` is a **date-only** value stored at **UTC midnight** (e.g. Thursday =
`2026-07-23T00:00:00Z`). Surfaces read it inconsistently:
- **Dashboard content plan** — `dateKey = toISOString().slice(0,10)` → **UTC** → `2026-07-23` (Thu). ✅ intended/authoritative.
- **Social enqueue** — `formatScheduledDate(publishingDate ?? scheduledDate, 'America/New_York')` converts the UTC-midnight instant to ET → **`2026-07-22` (Wed)**. ❌ one day early.
- **Posts + Calendar** follow the shifted Wednesday.
- **Article/workflow page** shows `createdAt` (not the content day), so it isn't a third source of truth.

The shifted run day (Wed = a newsletter day) makes `matrixForDay('article', Wed)` fall back to the
**Tuesday** matrix — so the Thursday matrix is never selected, and both Tue and Thu currently run the
Tue matrix (P3 = `art_hook_other` = Key Takeaways). Cause B thus explains the date mismatch **and** the
wrong-matrix/"swap P1↔P3 on Thursday" report.

---

## Fix 1 — Canonical UTC calendar date for article social (Cause B)
Make the social run day for **article** runs match the dashboard: derive it from the topic date's
**UTC Y‑M‑D**, not a timezone-converted instant. Keep the timezone only for the post **times**.

**Changes:**
- Add a helper `utcDateKey(d: Date): string` = `d.toISOString().slice(0,10)` (identical to content-plan's `dateKey`), in `schedule.ts`.
- `enqueue.ts` → `maybeEnqueueSocialAutomationAfterEnrichment`: compute the run day as
  `utcDateKey(topic.publishingDate ?? topic.scheduledDate ?? new Date())` and pass it through.
- Change `enqueueSocialAutomation` to accept a precomputed **`scheduledDate: string`** (YYYY-MM-DD)
  instead of `publishingDate: Date` + `timeZone` (the tz is only needed later for post times, which
  already happens in `slotToUtc(run.scheduledDate, hour, min, tz)`).
- **Do not change the newsletter path**: `nl.scheduledFor` is a real timestamp (set at approval), so
  `formatScheduledDate(scheduledFor, tz)` is correct there. (Flag: if we later want newsletter social
  on the newsletter's *topic* day, revisit — out of scope.)

**Result:** run day = `2026-07-23` (Thu) → matches dashboard; `matrixForDay('article', Thu)` selects the
**Thursday matrix**; `slotToUtc('2026-07-23', 9/12/15, tz)` schedules 9am/12/3pm ET **on Thursday**;
the calendar buckets those posts on Thursday. All four surfaces align, and the Thursday matrix
(P1 hook · P2 key-takeaways reel · P3 diagram carousel) is finally used.

## Fix 2 — Exclude non-content sections from section slots (Cause A)
Only ever pick real content sections for the hook/image-carousel slots.

**Changes (in `article-social-selectors.ts`):**
- Add `NON_CONTENT_HEADING = /^(faq|frequently asked questions|conclusion|key takeaways|introduction|references|sources)\b/i` (superset of enrichment's `GEO_EXCLUDE`).
- Compute `contentSections = ctx.h2Sections.filter(s => !NON_CONTENT_HEADING.test(s.heading.trim()))` and use it for:
  - `art_hook_other` — pick a `contentSection` whose heading ≠ the diagram-carousel section (diagram[0]).
  - `art_diagram_0/1` **fallback** (`sectionAtIndex`) — index into `contentSections`.
  - `art_hook_diagram0` fallback (when no diagram) — index into `contentSections`.
- Diagram-carousel sections themselves come from `ArticleDiagram` (real content H2s) — unaffected.
- Guard: if `contentSections` is empty, fall back to `ctx.h2SectionText` (first content) rather than a non-content section.

**Result:** P3 (Tue hook / and any section slot) uses a genuine content section, never "Key Takeaways."

---

## Existing (already-generated) runs
The fixes are forward-only. Runs already generated on the wrong day / with Key-Takeaways P3 stay as-is
until regenerated. Options (pick at implementation): leave them (they're staging test data), or
re-run `runSocialAutomation` for affected `ready` runs. No migration needed.

## Tests
- `weekly-matrix` unaffected. Add unit tests for:
  - `resolveArticleSlot('art_hook_other', …)` skips a "Key Takeaways" H2 and returns a content section (needs a light prisma/`readS3Object` mock or a pure helper extracted for the section-filtering logic).
  - `utcDateKey` returns the UTC calendar day for a UTC-midnight date (no TZ shift).
- Manual staging check: enrich a **Thursday** article → run day = Thursday, Thursday matrix
  (P1 hook, P3 diagram carousel), P3 not Key Takeaways; dashboard/calendar/social all show Thursday.

## Touch list
- `apps/api/src/social/automation/schedule.ts` — `utcDateKey` helper.
- `apps/api/src/social/automation/enqueue.ts` — article run day from UTC topic date; `enqueueSocialAutomation` takes `scheduledDate` string.
- `apps/api/src/social/automation/article-social-selectors.ts` — non-content section exclusion.
- Tests for the above.

## Risks
- **Date semantics:** using UTC Y‑M‑D assumes topic dates are authored as calendar days at UTC midnight (confirmed — that's how the content plan treats them). If a topic ever stored a real local time in `scheduledDate`, this would ignore the time — acceptable for date-only content scheduling.
- **Newsletter path untouched** — intentional (real `scheduledFor` timestamp). Note if newsletter social day ever looks off, revisit.
- **Section filtering** relies on heading text; the regex must match the enrichment-generated headings ("Key Takeaways" confirmed). Keep it in sync with enrichment's `GEO_EXCLUDE`.
