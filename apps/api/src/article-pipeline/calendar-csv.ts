/**
 * Article content-calendar CSV ingestion (admin-curated, pre-planned topics).
 *
 * One row = one dated article topic (an ArticleCalendarTopic). Required columns:
 * date, topic. Optional: angle, keywords, outline_framework, category.
 *
 * Two-phase like the newsletter importer so the admin gets a dry-run preview +
 * per-row error report before anything is written:
 *   parseArticleCalendarCsv(text) → { rows, errors, headerError }  (pure, no DB)
 *   commitArticleCalendarTopics(calendarId, rows) → upsert by @@unique(calendarId,date)
 *
 * Re-upload is idempotent (upsert).
 */
import { parse as parseCsv } from 'csv-parse/sync'
import { prisma } from '@socioply/shared'

const CSV_ALIASES: Record<string, string> = {
  date: 'date',
  topic: 'topic',
  idea: 'topic',
  title: 'topic',
  angle: 'angle',
  brief: 'angle',
  keywords: 'keywords',
  keyword: 'keywords',
  outline_framework: 'outlineFramework',
  'outline framework': 'outlineFramework',
  outlineframework: 'outlineFramework',
  framework: 'outlineFramework',
  category: 'category',
}

const REQUIRED_FIELDS = ['date', 'topic'] as const

export interface ParsedArticleRow {
  rowNumber: number
  date: Date
  dateRaw: string
  topic: string
  angle: string | null
  keywords: string[]
  outlineFrameworkNumber: number | null
  category: string | null
}

export interface RowError {
  rowNumber: number
  error: string
}

export interface ParseResult {
  rows: ParsedArticleRow[]
  errors: RowError[]
  headerError?: string
}

function normaliseRow(raw: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(raw)) {
    const norm = CSV_ALIASES[k.toLowerCase().trim()]
    if (norm) out[norm] = typeof v === 'string' ? v.trim() : ''
  }
  return out
}

export function parseArticleCalendarCsv(csvText: string): ParseResult {
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

  const presentHeaders = new Set(Object.keys(normaliseRow(rawRows[0])))
  const missingHeaders = REQUIRED_FIELDS.filter((f) => !presentHeaders.has(f))
  if (missingHeaders.length > 0) {
    return {
      rows: [],
      errors: [],
      headerError: `Missing required column(s): ${missingHeaders.join(', ')}. Required headers: ${REQUIRED_FIELDS.join(', ')}.`,
    }
  }

  const rows: ParsedArticleRow[] = []
  const errors: RowError[] = []
  const seenDates = new Map<string, number>()

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

    let outlineFrameworkNumber: number | null = null
    if (r.outlineFramework) {
      const n = parseInt(r.outlineFramework, 10)
      outlineFrameworkNumber = Number.isFinite(n) ? n : null
    }

    rows.push({
      rowNumber,
      date,
      dateRaw: r.date,
      topic: r.topic,
      angle: r.angle || null,
      keywords: r.keywords ? r.keywords.split(/[,;]/).map((k) => k.trim()).filter(Boolean) : [],
      outlineFrameworkNumber,
      category: r.category || null,
    })
  }

  return { rows, errors }
}

export interface CommitResult {
  upserted: number
}

export async function commitArticleCalendarTopics(
  calendarId: string,
  rows: ParsedArticleRow[],
): Promise<CommitResult> {
  let upserted = 0
  for (const row of rows) {
    const data = {
      topic: row.topic,
      angle: row.angle,
      keywords: row.keywords,
      outlineFrameworkNumber: row.outlineFrameworkNumber,
      category: row.category,
    }
    await prisma.articleCalendarTopic.upsert({
      where: { calendarId_date: { calendarId, date: row.date } },
      create: { calendarId, date: row.date, ...data },
      update: data,
    })
    upserted++
  }
  return { upserted }
}
