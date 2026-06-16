'use client'

import Link from 'next/link'
import { use, useEffect, useRef, useState } from 'react'
import {
  Loader2,
  AlertTriangle,
  ArrowLeft,
  Upload,
  Users,
  CheckCircle2,
  XCircle,
  Download,
} from 'lucide-react'

interface Topic {
  id: string
  date: string
  topic: string
  bullet1: string
  bullet2: string
  bullet3: string
  secondaryTopic: string | null
  recipe: string | null
  kidsSnack: string | null
  techFreeActivity: string | null
  videoUrl: string | null
  researchStatus: string
}

interface CalendarDetail {
  id: string
  name: string
  industry: string
  specialization: string | null
  topics: Topic[]
  _count: { assignments: number }
}

interface PreviewRow {
  rowNumber: number
  date: string
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

interface RowError {
  rowNumber: number
  error: string
}

interface DryRunResult {
  validRows: number
  errorCount: number
  errors: RowError[]
  preview: PreviewRow[]
}

export default function AdminNewsletterCalendarDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [calendar, setCalendar] = useState<CalendarDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [dryRun, setDryRun] = useState<DryRunResult | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [committed, setCommitted] = useState<number | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/newsletter/calendars/${id}`, { cache: 'no-store' })
      if (!res.ok) {
        setError(`HTTP ${res.status}: ${(await res.text()) || res.statusText}`)
        return
      }
      const data = await res.json()
      setCalendar(data.calendar)
    } catch (err) {
      setError((err as Error).message ?? 'Failed to load calendar')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function postCsv(commit: boolean) {
    if (!file) return
    setUploading(true)
    setUploadError(null)
    if (commit) setCommitted(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(
        `/api/admin/newsletter/calendars/${id}/csv${commit ? '?commit=true' : ''}`,
        { method: 'POST', body: form },
      )
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setUploadError(data.error ?? `HTTP ${res.status}`)
        if (data.errors) setDryRun({ validRows: data.validRows ?? 0, errorCount: data.errorCount ?? 0, errors: data.errors, preview: [] })
        return
      }
      if (commit) {
        setCommitted(data.upserted ?? 0)
        setDryRun(null)
        setFile(null)
        if (fileRef.current) fileRef.current.value = ''
        await load()
      } else {
        setDryRun(data)
      }
    } catch (err) {
      setUploadError((err as Error).message ?? 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading calendar…
      </div>
    )
  }

  if (error || !calendar) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <div className="font-mono text-xs">{error ?? 'Calendar not found'}</div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl">
      <Link
        href="/admin/newsletter/calendars"
        className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All calendars
      </Link>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{calendar.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {calendar.industry}
            {calendar.specialization ? ` · ${calendar.specialization}` : ''} · {calendar.topics.length} topics
          </p>
        </div>
        <Link
          href={`/admin/newsletter/calendars/${id}/assign`}
          className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          <Users className="h-4 w-4" />
          Assign customers ({calendar._count.assignments})
        </Link>
      </div>

      {/* CSV upload */}
      <div className="mb-8 rounded-xl border border-border bg-card p-5">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
          <Upload className="h-4 w-4" />
          Upload topics CSV
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          Required columns: <code>date, topic, bullet1, bullet2, bullet3</code>. Optional:{' '}
          <code>secondary_topic, recipe, kids_snack, tech_free_activity, video_url</code>. Re-uploading
          a date overwrites it (idempotent).{' '}
          <a
            href="/newsletter-topics-template.csv"
            download
            className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
          >
            <Download className="h-3 w-3" />
            Download template
          </a>
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null)
              setDryRun(null)
              setCommitted(null)
              setUploadError(null)
            }}
            className="text-sm"
          />
          <button
            onClick={() => postCsv(false)}
            disabled={!file || uploading}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
            Preview (dry run)
          </button>
          {dryRun && dryRun.errorCount === 0 && dryRun.validRows > 0 && (
            <button
              onClick={() => postCsv(true)}
              disabled={uploading}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
              Commit {dryRun.validRows} rows
            </button>
          )}
        </div>

        {uploadError && (
          <div className="mt-3 flex items-start gap-2 text-xs text-red-600">
            <XCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {committed !== null && (
          <div className="mt-3 flex items-center gap-2 text-xs text-green-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Committed {committed} topics.
          </div>
        )}

        {dryRun && (
          <div className="mt-4 rounded-lg border border-border bg-background p-4">
            <div className="mb-2 flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1 text-green-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {dryRun.validRows} valid
              </span>
              {dryRun.errorCount > 0 && (
                <span className="inline-flex items-center gap-1 text-red-600">
                  <XCircle className="h-3.5 w-3.5" />
                  {dryRun.errorCount} with errors
                </span>
              )}
            </div>
            {dryRun.errors.length > 0 && (
              <ul className="mb-3 space-y-1 text-xs text-red-600">
                {dryRun.errors.map((er) => (
                  <li key={er.rowNumber}>
                    Row {er.rowNumber}: {er.error}
                  </li>
                ))}
              </ul>
            )}
            {dryRun.preview.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-muted-foreground">
                    <tr>
                      <th className="py-1 pr-3">Date</th>
                      <th className="py-1 pr-3">Topic</th>
                      <th className="py-1 pr-3">Modules</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dryRun.preview.slice(0, 20).map((r) => (
                      <tr key={r.rowNumber} className="border-t border-border">
                        <td className="py-1 pr-3 font-mono">{r.date}</td>
                        <td className="py-1 pr-3">{r.topic}</td>
                        <td className="py-1 pr-3 text-muted-foreground">
                          {[
                            r.secondaryTopic && 'secondary',
                            r.recipe && 'recipe',
                            r.kidsSnack && 'kids-snack',
                            r.techFreeActivity && 'tech-free',
                            r.videoUrl && 'video',
                          ]
                            .filter(Boolean)
                            .join(', ') || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {dryRun.preview.length > 20 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    +{dryRun.preview.length - 20} more rows…
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Existing topics */}
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Topics
      </h2>
      {calendar.topics.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
          No topics yet. Upload a CSV above.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Topic</th>
                <th className="px-4 py-2">Modules</th>
                <th className="px-4 py-2">Research</th>
              </tr>
            </thead>
            <tbody>
              {calendar.topics.map((t) => (
                <tr key={t.id} className="border-t border-border">
                  <td className="whitespace-nowrap px-4 py-2 font-mono text-xs">
                    {t.date.slice(0, 10)}
                  </td>
                  <td className="px-4 py-2">{t.topic}</td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">
                    {[
                      t.secondaryTopic && 'secondary',
                      t.recipe && 'recipe',
                      t.kidsSnack && 'kids-snack',
                      t.techFreeActivity && 'tech-free',
                      t.videoUrl && 'video',
                    ]
                      .filter(Boolean)
                      .join(', ') || '—'}
                  </td>
                  <td className="px-4 py-2 text-xs">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                      {t.researchStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
