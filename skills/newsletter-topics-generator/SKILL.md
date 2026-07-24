---
name: newsletter-topics-generator
description: Generate a full year of newsletter content-calendar topics for EVERY specialization by driving Google Gemini in a browser (gemini.google.com) — two calendars per specialization (Northern + Southern hemisphere). Validates each output (no duplicate topics, valid/relevant YouTube videos, clean rows), retries in-chat until clean, and compiles import-ready CSVs (one per specialization × hemisphere). Use when seeding/refreshing the Socioply/LeverCast newsletter calendars.
---

# Newsletter Topics Generator (browser + Gemini, all specializations × 2 hemispheres)

Calendars are built **per specialization** (not per client), and **two per
specialization** — one for each hemisphere — so seasonality is correct. This skill
produces the **full set**: for every specialization you give it, it generates a
**Northern** and a **Southern** CSV (so N specializations → **2 × N** files).
The topics come from **Google Gemini via its web app** (fresher than local model
knowledge), are **validated and corrected in-chat**, then compiled into
import-ready CSVs.

## Inputs (ask if not provided)
- **Industry** — e.g. `chiropractic`. Required.
- **Specializations** — the list to generate for. Default to the canonical five
  (key → label), which match the admin Specialization list and the calendars:
  | key | label |
  |---|---|
  | `family_care` | Family Care |
  | `sports` | Sports |
  | `prenatal_pediatric` | Prenatal/Pediatric |
  | `geriatric` | Geriatric |
  | `wellness_maintenance` | Wellness/Maintenance |

  If the admin list has changed, ask the user for the current keys/labels (or have
  them paste it from **Admin → Newsletter → Specializations**).
- **Target audience** per specialization (optional; otherwise infer from the label).
- **Year** (e.g. 2026).
- **Editions per week** — **4, on Mondays, Wednesdays, Fridays and Saturdays only** (≈208 rows/year). Newsletters are sent ONLY on Mon/Wed/Fri/Sat (the app's content plan enforces this). Unique ISO date per row.

## Prerequisite
A browser with a **logged-in Google account** (gemini.google.com must be usable).

## Plan the run
You are filling a matrix of **specialization × hemisphere**. With the default five
specializations that is **10 calendars / 10 CSVs**. Use a **fresh Gemini chat for
each calendar** (each specialization × hemisphere) so topics don't bleed between
specializations or duplicate across hemispheres. Track progress so you can resume
if interrupted, e.g.:

```
family_care        — northern [ ] southern [ ]
sports             — northern [ ] southern [ ]
prenatal_pediatric — northern [ ] southern [ ]
geriatric          — northern [ ] southern [ ]
wellness_maintenance — northern [ ] southern [ ]
```

## Procedure — repeat for each (specialization × hemisphere)

### 1. Generate in Gemini (browser)
1. Open **gemini.google.com** and start a **new chat** (one per calendar).
2. Paste the **Gemini prompt** below with the inputs + this specialization + this hemisphere filled in.
3. Wait for the full response, then click the response's **Copy** button and read the copied text (fallback: read the rendered response). The whole calendar fits in one output.

### 2. Validate the output
Parse the copied CSV and check:
- **Header & rows** — exact header present; every row has `date, topic, bullet1-3`; dates are valid ISO `YYYY-MM-DD`; **no duplicate dates**; cadence roughly matches N/week across the whole year.
- **No duplicate / near-duplicate topics** anywhere in this calendar's year.
- **Videos** — for each non-empty `video_url`, verify it's a **valid, public, usable** YouTube video via oEmbed:
  `https://www.youtube.com/oembed?url=<video_url>&format=json` → HTTP 200 + JSON with a `title` means valid; 401/403/404 means private/removed/invalid.
  Then judge whether that oEmbed **title aligns with the row's topic** (clearly on-topic). Flag dead, private, or off-topic videos.

### 3. Fix in-chat (max 5 retries)
If anything failed, go **back into the same Gemini chat** and ask for a corrected, complete re-output, naming exactly what's wrong, e.g.:
> "Rows 12 and 47 are duplicate topics about posture — make them distinct. The video URLs in rows 5, 30, and 88 are removed/private or don't match the topic — replace each with a real, currently-public YouTube watch URL that genuinely matches that row's topic. Re-output the FULL corrected CSV in the same format."

Re-copy, re-validate. Repeat up to **5 rounds**. After 5 rounds, accept the best version, **blank out any still-bad `video_url`** (so the pipeline auto-searches a video for those rows), and list the remaining issues in your summary.

### 4. Save the CSV
Write `topics-<specialization_key>-<hemisphere>.csv` (e.g. `topics-prenatal_pediatric-southern.csv`) with the exact header. Quote any field containing a comma. Leave `video_url` blank only where no valid video was obtained.

Mark the cell done in your progress tracker and move to the next calendar.

## The Gemini prompt (paste into the web chat, fill the placeholders)

```
Produce a full {{year}} newsletter content calendar for a {{industry}} business specializing in {{specialization_label}} (audience: {{audience}}).

Cadence: 4 editions per week, every week of {{year}}, on Mondays, Wednesdays, Fridays and Saturdays ONLY (no other days). One row per edition, one unique date per row.

Seasonality: {{HEMISPHERE}} Hemisphere — align every seasonal/holiday topic to {{HEMISPHERE}}-hemisphere seasons and that region's common holidays. (Northern: Jan = winter, Jul = summer. Southern: Jan = summer, Jul = winter.)

For each edition output these CSV columns:
date (YYYY-MM-DD), topic (a specific feature-article angle, max ~12 words), bullet1, bullet2, bullet3 (three concrete sub-angles the article should cover), secondary_article (a second article aimed at a different reader/segment via the specialization), recipe (a seasonal, healthy recipe idea), recipe_2 (optional second recipe, else blank), video_url (a REAL, currently public YouTube watch URL — youtube.com/watch?v=… — whose video genuinely matches the topic; do NOT invent IDs).

Rules:
- Every topic distinct across the whole year — no duplicates or near-duplicates.
- Unique valid ISO date per row; no duplicate dates; spread {{N}} per week across all of {{year}}.
- Each video_url must be a real, public, on-topic YouTube link. If unsure a video exists, leave video_url blank rather than guessing.
- Keep topics specific to the {{specialization_label}} specialization (not generic to the whole industry).
- Responsible, educational health framing — no medical claims or "cures".
- Output ONLY the CSV: first line exactly
  date,topic,bullet1,bullet2,bullet3,secondary_article,recipe,recipe_2,video_url
  then the data rows. Quote any field containing a comma.
```

## CSV contract (must match the importer)
- Header exactly: `date,topic,bullet1,bullet2,bullet3,secondary_article,recipe,recipe_2,video_url`
- Required: `date` (ISO), `topic`, `bullet1-3`. Optional: the rest.
- `video_url` populated with a validated link, or blank (→ pipeline auto-searches).
- Re-import is idempotent (upsert by calendar+date), so a corrected CSV is safe to re-upload.

## Uploading (mapping CSVs → calendars)
Each CSV maps to the calendar with the matching **specialization + hemisphere** in
**Admin → Newsletter → Content Calendars** (one Northern + one Southern per
specialization). Upload `topics-<key>-northern.csv` to that specialization's
Northern calendar, and `…-southern.csv` to its Southern calendar.

## Output of a run
For each specialization, two validated files — `topics-<key>-northern.csv` and
`topics-<key>-southern.csv` — i.e. **2 × N CSVs total**. Finish with a summary
matrix: for each specialization × hemisphere, the row count, how many retry rounds
it took, and any rows where `video_url` was left blank for the pipeline to fill.

| specialization        | hemisphere | rows | retries | blank videos |
|-----------------------|------------|------|---------|--------------|
| family_care           | northern   |  …   |   …     |     …        |
| family_care           | southern   |  …   |   …     |     …        |
| …                     | …          |  …   |   …     |     …        |
