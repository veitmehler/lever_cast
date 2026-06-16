/**
 * Newsletter content-calendar CSV ingestion.
 *
 * One row = one dated edition (a NewsletterTopic). Required columns: date, topic,
 * bullet1, bullet2, bullet3. Optional columns: secondary_topic, recipe,
 * kids_snack, tech_free_activity, video_url. Module / secondary-article generation
 * is driven purely by which optional columns are populated — there is no dayType.
 *
 * The flow is two-phase so the admin gets a dry-run preview + per-row error report
 * BEFORE anything is written:
 *   parseNewsletterCsv(text)  → { rows, errors, headerError }   (pure, no DB)
 *   commitNewsletterTopics(calendarId, rows)  → upserts by @@unique(calendarId,date)
 *
 * Re-upload is idempotent (upsert), so fixing a CSV and re-uploading is safe.
 */
import { parse as parseCsv } from 'csv-parse/sync'
import { prisma } from '@socioply/shared'

// Accepted CSV header variations → normalised field name.
const CSV_ALIASES: Record<string, string> = {
  date: 'date',
  topic: 'topic',
  bullet1: 'bullet1',
  'bullet 1': 'bullet1',
  bullet_1: 'bullet1',
  bullet2: 'bullet2',
  'bullet 2': 'bullet2',
  bullet_2: 'bullet2',
  bullet3: 'bullet3',
  'bullet 3': 'bullet3',
  bullet_3: 'bullet3',
  secondary_topic: 'secondaryTopic',
  'secondary topic': 'secondaryTopic',
  secondarytopic: 'secondaryTopic',
  recipe: 'recipe',
  kids_snack: 'kidsSnack',
  'kids snack': 'kidsSnack',
  kidssnack: 'kidsSnack',
  tech_free_activity: 'techFreeActivity',
  'tech free activity': 'techFreeActivity',
  techfreeactivity: 'techFreeActivity',
  video_url: 'videoUrl',
  'video url': 'videoUrl',
  videourl: 'videoUrl',
}

const REQUIRED_FIELDS = ['date', 'topic', 'bullet1', 'bullet2', 'bullet3'] as const

export interface ParsedTopicRow {
  rowNumber: number // 1-based data row number (excludes the header)
  date: Date
  dateRaw: string
  topic: string
  bullet1: string
  bullet2: string
  bullet3: string
  secondaryTopic: string | null
  recipe: string | null
  kidsSnack: string | null
  techFreeActivity: string | null
  videoUrl: string | null
}

export interface RowError {
  rowNumber: number
  error: string
}

export interface ParseResult {
  rows: ParsedTopicRow[] // valid, de-duplicated rows ready to commit
  errors: RowError[] // per-row validation errors (and intra-file duplicates)
  headerError?: string // fatal: missing required header(s) or unparseable CSV
}

function normaliseRow(raw: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(raw)) {
    const norm = CSV_ALIASES[k.toLowerCase().trim()]
    if (norm) out[norm] = typeof v === 'string' ? v.trim() : ''
  }
  return out
}

/** Parse + validate CSV text. Pure (no DB) so it powers the dry-run preview. */
export function parseNewsletterCsv(csvText: string): ParseResult {
  let rawRows: Record<string, string>[]
  try {
    rawRows = parseCsv(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      bom: true,
    }) as Record<string, string>[]
  } catch (err) {
    return { rows: [], errors: [], headerError: `CSV parse error: ${err instanceof Error ? err.message : String(err)}` }
  }

  if (rawRows.length === 0) {
    return { rows: [], errors: [], headerError: 'CSV has no data rows.' }
  }

  // Header validation — the first row's keys (normalised) must cover the required set.
  const presentHeaders = new Set(Object.keys(normaliseRow(rawRows[0])))
  const missingHeaders = REQUIRED_FIELDS.filter((f) => !presentHeaders.has(f))
  if (missingHeaders.length > 0) {
    return {
      rows: [],
      errors: [],
      headerError: `Missing required column(s): ${missingHeaders.join(', ')}. Required headers: ${REQUIRED_FIELDS.join(', ')}.`,
    }
  }

  const rows: ParsedTopicRow[] = []
  const errors: RowError[] = []
  const seenDates = new Map<string, number>() // YYYY-MM-DD → first rowNumber that used it

  for (let i = 0; i < rawRows.length; i++) {
    const rowNumber = i + 1
    const r = normaliseRow(rawRows[i])

    const missing = REQUIRED_FIELDS.filter((f) => !r[f])
    if (missing.length > 0) {
      errors.push({ rowNumber, error: `Missing required field(s): ${missing.join(', ')}` })
      continue
    }

    const date = new Date(r.date)
    if (isNaN(date.getTime())) {
      errors.push({ rowNumber, error: `Invalid date: "${r.date}" (use an ISO date, e.g. 2026-07-01)` })
      continue
    }

    const dateKey = date.toISOString().slice(0, 10)
    const firstSeen = seenDates.get(dateKey)
    if (firstSeen !== undefined) {
      errors.push({ rowNumber, error: `Duplicate date ${dateKey} (already used in row ${firstSeen})` })
      continue
    }
    seenDates.set(dateKey, rowNumber)

    rows.push({
      rowNumber,
      date,
      dateRaw: r.date,
      topic: r.topic,
      bullet1: r.bullet1,
      bullet2: r.bullet2,
      bullet3: r.bullet3,
      secondaryTopic: r.secondaryTopic || null,
      recipe: r.recipe || null,
      kidsSnack: r.kidsSnack || null,
      techFreeActivity: r.techFreeActivity || null,
      videoUrl: r.videoUrl || null,
    })
  }

  return { rows, errors }
}

export interface CommitResult {
  upserted: number
}

/**
 * Upsert parsed rows into NewsletterTopic, keyed by @@unique(calendarId,date).
 * Idempotent: re-uploading overwrites the source fields for an existing date but
 * resets researchStatus to 'pending' (the source content changed → re-research).
 */
export async function commitNewsletterTopics(
  calendarId: string,
  rows: ParsedTopicRow[],
): Promise<CommitResult> {
  let upserted = 0
  for (const row of rows) {
    const data = {
      topic: row.topic,
      bullet1: row.bullet1,
      bullet2: row.bullet2,
      bullet3: row.bullet3,
      secondaryTopic: row.secondaryTopic,
      recipe: row.recipe,
      kidsSnack: row.kidsSnack,
      techFreeActivity: row.techFreeActivity,
      videoUrl: row.videoUrl,
    }
    await prisma.newsletterTopic.upsert({
      where: { calendarId_date: { calendarId, date: row.date } },
      create: { calendarId, date: row.date, ...data },
      // Re-upload overwrites source content and re-arms shared research.
      update: { ...data, researchStatus: 'pending' },
    })
    upserted++
  }
  return { upserted }
}
