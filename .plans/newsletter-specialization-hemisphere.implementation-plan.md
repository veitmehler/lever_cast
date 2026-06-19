# Newsletter Calendars: Deterministic Specializations + Hemisphere Routing

**Status:** proposed (awaiting approval)
**Date:** 2026-06-19

## Goal

Two seasonal calendar variants (Northern / Southern) per **specialization**, with
each client auto-assigned the correct one. Replace free-text specialization with
a **fixed, checkbox-selected** list, and route clients automatically by their
**primary specialization × country-derived hemisphere** — no manual assignment.

Lines up with the Cowork skill's two outputs (`…-northern.csv` / `…-southern.csv`).

## 1. Specializations — DB-backed, admin-editable

A **`Specialization` table** (`id`, `key` stable slug, `label`, `sortOrder`,
`enabled`) is the single source of truth — used by Settings checkboxes, calendar
creation, and `{{specialization}}` in prompts. **Admin CRUD UI** to add/rename/
reorder/disable. Renaming changes the label only; the `key` is immutable (calendars
reference it). Disabling hides it from new selections without breaking existing data.

Seed list: **Family Care, Sports, Prenatal/Pediatric, Geriatric, Wellness/Maintenance**.

## 2. Client selection (Settings → Brand Profile)

- `specializations: string[]` — keys, multi-select **checkboxes** from the canonical list.
- `primarySpecialization: string` — exactly one (must be in `specializations`); drives the newsletter calendar.
- Migrate off the free-text `BrandSettings.specialization`; `{{specialization}}` in prompts resolves from the primary key's label.

## 3. Calendar model

`NewsletterCalendar`:
- replace free-text `specialization` → **`specializationKey`** (from the list)
- add **`hemisphere`** (`'north' | 'south'`)
- unique on **(specializationKey, hemisphere)** — exactly two calendars per specialization.

Pairing is therefore deterministic by `specializationKey` (no fragile string matching).

## 4. Hemisphere derivation (country → hemisphere)

A curated map keyed by ISO alpha-2 (`organizationCountryCode`). Each entry is
`{ hemisphere, edge }`:
- **Clear countries** (`edge: false`, e.g. AU/US/GB/NZ) → hemisphere is locked, no override shown.
- **Edge / straddling countries** (`edge: true`, e.g. Brazil, Indonesia, Ecuador, Colombia, Kenya) → default to the **majority** hemisphere (Brazil → south), but expose a **manual override** so it can be corrected. The override is only available for these edge countries — clear countries can't be changed, so end-users can't accidentally mis-set it.
- **Country is required** (enforced at onboarding). No default-hemisphere fallback: if country is somehow missing, the client stays **unassigned + flagged** until it's set.

Client field: `hemisphereOverride` (`'north' | 'south' | null`), honored only when the client's country is an edge country.

## 5. Auto-routing (no manual assignment)

Resolution: `hemisphere = hemisphereOverride (if country is edge) else map[country]`, then
`calendar = NewsletterCalendar where specializationKey = client.primarySpecialization AND hemisphere = …` → set `user.newsletterCalendarId`.
- Runs automatically when the client sets/changes **primary specialization**, **country**, or **edge override**, and when an admin (re)creates/uploads the matching calendar.
- No matching calendar yet, or country missing → leave **unassigned + flagged** in the admin.
- **No admin per-client calendar override** for now (the controlled list + edge override make auto-routing reliable; add later only if a real exception appears).

## 6. Upload UX

Two separate per-calendar uploads (current flow), one per hemisphere variant.
Admin creates a specialization's two calendars (`specializationKey` + `hemisphere`)
and uploads each hemisphere's CSV. (Paired create/upload UI is optional polish.)

## 7. Migration (clear existing)

Per your call, **wipe the current newsletter calendars + topics** and start fresh:
- delete `NewsletterTopic` + `NewsletterCalendar` rows; set every `user.newsletterCalendarId = null`.
- add `specializationKey` + `hemisphere` to `NewsletterCalendar`; add
  `specializations` + `primarySpecialization` to `BrandSettings`.
- (No data to preserve, so no backfill.)

## Components to build
- **schema + migration**: new `Specialization` table (seeded); `NewsletterCalendar` (`specializationKey`, `hemisphere`, unique `(specializationKey, hemisphere)`); `BrandSettings` (`specializations[]`, `primarySpecialization`, `hemisphereOverride`); wipe existing calendars/topics + null out `user.newsletterCalendarId`.
- **shared**: `hemisphereForCountry(code) → { hemisphere, edge }` country map.
- **resolution service**: `resolveNewsletterCalendar(userId)` → derive hemisphere (override if edge), find calendar by `(primarySpecialization, hemisphere)`, set/clear `newsletterCalendarId`; called on profile/country/override change + calendar create/upload.
- **Settings UI**: specialization checkboxes (from `Specialization` table) + primary selector; edge-country hemisphere override (shown only when country is edge). Replaces the free-text field.
- **Admin: Specialization CRUD** (add/rename/reorder/disable) + calendar create/select by `specializationKey` + `hemisphere`; CSV upload unchanged (targets a variant). Surface unassigned/flagged clients.
- **Generation**: `{{specialization}}` resolves from the primary key's label.
- **tests**: hemisphere mapping (clear + edge + override), resolution (primary × hemisphere, missing calendar, missing country → unassigned), specialization CRUD, CSV upload to a variant.

## Decisions (resolved)
1. Specializations: **DB table, admin-editable** ✓
2. Hemisphere override: **edge countries only** ✓
3. Admin per-client calendar override: **not now** (auto-routing is reliable; add later if needed) — *confirm*
4. Country **required** (no default); missing → unassigned + flagged ✓
5. Seed: Family Care, Sports, Prenatal/Pediatric, Geriatric, Wellness/Maintenance ✓

## Out of scope / later
- Per-industry scoping of specializations.
- Paired create/upload UI.
- Admin per-client calendar override (if a real exception arises).
