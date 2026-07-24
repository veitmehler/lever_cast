---
name: article-topics-generator
description: Generate a full year of ARTICLE content-calendar topics for EVERY specialization by driving Google Gemini in a browser (gemini.google.com) — two calendars per specialization (Northern + Southern hemisphere). Validates each output (no duplicate topics, valid rows, ISO dates), retries in-chat until clean, and compiles import-ready CSVs (one per specialization × hemisphere) for the admin Article Calendars. Use when seeding/refreshing the Socioply/LeverCast article calendars.
---

# Article Topics Generator (browser + Gemini, all specializations × 2 hemispheres)

Article calendars are built **per specialization** (not per client), and **two per
specialization** — one for each hemisphere — so seasonality is correct. This skill
produces the **full set**: for the specializations listed below it generates a
**Northern** and a **Southern** CSV (so N specializations → **2 × N** files).
The topics come from **Google Gemini via its web app** (fresher than local model
knowledge), are **validated and corrected in-chat**, then compiled into
import-ready CSVs for **Admin → Article Calendars**.

> This is the ARTICLE calendar (long-form article topics), which is **separate**
> from the newsletter calendar. Don't reuse newsletter rows — articles have a
> different cadence and columns.

## ⚠️ The specializations are DEFINED IN THIS SKILL — do not ask, do not skip

Generate for **all five** of these specializations. They are listed here on
purpose so you never have to guess or fetch them — use exactly these `key` +
`label` values, and produce **two calendars (Northern + Southern) for each one**:

| # | key | label |
|---|---|---|
| 1 | `family_care` | Family Care |
| 2 | `sports` | Sports |
| 3 | `prenatal_pediatric` | Prenatal/Pediatric |
| 4 | `geriatric` | Geriatric |
| 5 | `wellness_maintenance` | Wellness/Maintenance |

That is **5 specializations × 2 hemispheres = 10 calendars / 10 CSVs**. Do not
omit any specialization and do not invent new ones. (If the admin later changes
the list in **Admin → Newsletter → Specializations**, this skill should be
updated to match — but until then, treat the table above as the source of truth.)

## Inputs (ask only if not provided)
- **Industry** — default **chiropractic**. Required.
- **Year** (e.g. 2026).
- **Articles per week** — **2, on Tuesdays and Thursdays only** (≈104 rows/year). Articles are published ONLY on Tue/Thu (the app's content plan enforces this). One unique ISO date per row.
- **Audience** per specialization is inferred from the label (e.g. Family Care →
  families/all ages; Sports → athletes/active adults; Prenatal/Pediatric →
  expecting parents + kids; Geriatric → older adults; Wellness/Maintenance →
  ongoing-care/preventive patients).

## Prerequisite
A browser with a **logged-in Google account** (gemini.google.com must be usable).

## Plan the run
You are filling a matrix of **specialization × hemisphere = 10 calendars**. Use a
**fresh Gemini chat for each calendar** so topics don't bleed between
specializations or duplicate across hemispheres. Track progress so you can resume
if interrupted:

```
family_care          — northern [ ] southern [ ]
sports               — northern [ ] southern [ ]
prenatal_pediatric   — northern [ ] southern [ ]
geriatric            — northern [ ] southern [ ]
wellness_maintenance — northern [ ] southern [ ]
```

## Procedure — repeat for each (specialization × hemisphere)

### 1. Generate in Gemini (browser)
1. Open **gemini.google.com** and start a **new chat** (one per calendar).
2. Paste the **Gemini prompt** below with the inputs + this specialization + this hemisphere filled in.
3. Wait for the full response, then click the response's **Copy** button and read the copied text (fallback: read the rendered response). The whole calendar fits in one output.

### 2. Validate the output
Parse the copied CSV and check:
- **Header & rows** — exact header present; every row has `date` and `topic`; dates are valid ISO `YYYY-MM-DD`; **no duplicate dates**; cadence roughly matches N/week across the whole year.
- **No duplicate / near-duplicate topics** anywhere in this calendar's year.
- **Specialization fit** — every topic is clearly relevant to this specialization (not generic to the whole industry).
- **Seasonality** — seasonal/holiday topics match the **{{HEMISPHERE}}** hemisphere.
- **Keywords** — `keywords` is a short comma-separated list (≈3–5) of realistic SEO phrases per row (nice-to-have, not required).

(There are **no videos** in article topics — unlike the newsletter calendar, so there's no oEmbed/video check here.)

### 3. Fix in-chat (max 5 retries)
If anything failed, go **back into the same Gemini chat** and ask for a corrected, complete re-output, naming exactly what's wrong, e.g.:
> "Rows 12 and 47 are duplicate topics about posture — make them distinct. Rows 5 and 30 drift into generic wellness; keep every topic specific to the {{specialization_label}} specialization. Re-output the FULL corrected CSV in the same format."

Re-copy, re-validate. Repeat up to **5 rounds**. After 5 rounds, accept the best version and list any remaining issues in your summary.

### 4. Save the CSV
Write `article-topics-<specialization_key>-<hemisphere>.csv` (e.g. `article-topics-prenatal_pediatric-southern.csv`) with the exact header. Quote any field containing a comma.

Mark the cell done in your progress tracker and move to the next calendar.

## The Gemini prompt (paste into the web chat, fill the placeholders)

```
Produce a full {{year}} ARTICLE content calendar (long-form blog/article topics) for a {{industry}} business specializing in {{specialization_label}} (audience: {{audience}}).

Cadence: 2 articles per week, every week of {{year}}, on Tuesdays and Thursdays ONLY (no other days). One row per article, one unique date per row.

Seasonality: {{HEMISPHERE}} Hemisphere — align every seasonal/holiday topic to {{HEMISPHERE}}-hemisphere seasons and that region's common holidays. (Northern: Jan = winter, Jul = summer. Southern: Jan = summer, Jul = winter.)

For each article output these CSV columns:
date (YYYY-MM-DD), topic (a specific article angle / working title, max ~12 words), angle (1–2 sentences describing the brief: what the article should cover and for whom), keywords (3–5 realistic SEO keyword phrases, comma-separated), outline_framework (LEAVE BLANK), category (an optional one-word topical category, else blank).

Rules:
- Every topic distinct across the whole year — no duplicates or near-duplicates.
- Keep every topic specific to the {{specialization_label}} specialization, not generic to {{industry}} as a whole.
- Unique valid ISO date per row; no duplicate dates; spread {{N}} per week across all of {{year}}.
- Responsible, educational health framing — no medical claims or "cures".
- Output ONLY the CSV: first line exactly
  date,topic,angle,keywords,outline_framework,category
  then the data rows. Quote any field containing a comma. Leave outline_framework empty.
```

## CSV contract (must match the importer)
- Header exactly: `date,topic,angle,keywords,outline_framework,category`
- **Required**: `date` (ISO), `topic`. Optional: `angle`, `keywords`, `outline_framework`, `category`.
- `keywords`: comma- or semicolon-separated; the importer splits them into a list.
- `outline_framework`: leave blank — the article pipeline assigns the framework. (Only set it to an integer if an admin tells you a specific framework number.)
- Re-import is idempotent (upsert by calendar+date), so a corrected CSV is safe to re-upload.

## Uploading (mapping CSVs → calendars)
Each CSV maps to the **Article Calendar** with the matching specialization +
hemisphere in **Admin → Article Calendars** (create one Northern + one Southern
per specialization first, if they don't exist). Upload
`article-topics-<key>-northern.csv` to that specialization's Northern calendar,
and `…-southern.csv` to its Southern calendar. Use the "Preview (dry run)" button,
confirm 0 errors, then Commit.

## Output of a run
For each specialization, two validated files — `article-topics-<key>-northern.csv`
and `article-topics-<key>-southern.csv` — i.e. **2 × N CSVs total (10 for the five
specializations)**. Finish with a summary matrix: for each specialization ×
hemisphere, the row count, how many retry rounds it took, and any remaining issues.

| specialization        | hemisphere | rows | retries | notes |
|-----------------------|------------|------|---------|-------|
| family_care           | northern   |  …   |   …     |   …   |
| family_care           | southern   |  …   |   …     |   …   |
| …                     | …          |  …   |   …     |   …   |
