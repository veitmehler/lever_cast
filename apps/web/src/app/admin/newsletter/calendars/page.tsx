'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Loader2, AlertTriangle, Plus, CalendarDays, Users, FileText, ChevronRight, Download } from 'lucide-react'

interface CalendarRow {
  id: string
  name: string
  industry: string
  specializationKey: string | null
  hemisphere: string | null
  createdAt: string
  _count: { topics: number; assignments: number }
}

interface SpecializationRow {
  id: string
  key: string
  label: string
  enabled: boolean
}

const HEMISPHERE_LABEL: Record<string, string> = { north: 'Northern', south: 'Southern' }

export default function AdminNewsletterCalendarsPage() {
  const [calendars, setCalendars] = useState<CalendarRow[]>([])
  const [specs, setSpecs] = useState<SpecializationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [industry, setIndustry] = useState('')
  const [specializationKey, setSpecializationKey] = useState('')
  const [hemisphere, setHemisphere] = useState('north')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const specLabel = (key: string | null) =>
    key ? specs.find((s) => s.key === key)?.label ?? key : null

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [calRes, specRes] = await Promise.all([
        fetch('/api/admin/newsletter/calendars', { cache: 'no-store' }),
        fetch('/api/admin/specializations', { cache: 'no-store' }),
      ])
      if (!calRes.ok) {
        setError(`HTTP ${calRes.status}: ${(await calRes.text()) || calRes.statusText}`)
        return
      }
      const data = await calRes.json()
      setCalendars(data.calendars ?? [])
      if (specRes.ok) {
        const sd = await specRes.json()
        setSpecs(sd.specializations ?? [])
      }
    } catch (err) {
      setError((err as Error).message ?? 'Failed to load calendars')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setCreateError(null)
    try {
      const res = await fetch('/api/admin/newsletter/calendars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          industry,
          specializationKey: specializationKey || null,
          hemisphere,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setCreateError(body.error ?? `HTTP ${res.status}`)
        return
      }
      setName('')
      setIndustry('')
      setSpecializationKey('')
      setHemisphere('north')
      await load()
    } catch (err) {
      setCreateError((err as Error).message ?? 'Failed to create calendar')
    } finally {
      setCreating(false)
    }
  }

  const enabledSpecs = specs.filter((s) => s.enabled)

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Content Calendars</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Each calendar is scoped to a specialization + hemisphere and holds dated topics uploaded via CSV.
            Clients are auto-routed to the calendar matching their primary specialization and country.
          </p>
        </div>
        <a
          href="/newsletter-topics-template.csv"
          download
          className="inline-flex flex-shrink-0 items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          <Download className="h-4 w-4" />
          CSV template
        </a>
      </div>

      {/* Create form */}
      <form
        onSubmit={handleCreate}
        className="mb-8 rounded-xl border border-border bg-card p-5"
      >
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
          <Plus className="h-4 w-4" />
          New calendar
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Family Care · Southern 2026"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Industry</label>
            <input
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              required
              placeholder="Chiropractic"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Specialization</label>
            <select
              value={specializationKey}
              onChange={(e) => setSpecializationKey(e.target.value)}
              required
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">Select a specialization…</option>
              {enabledSpecs.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Hemisphere</label>
            <select
              value={hemisphere}
              onChange={(e) => setHemisphere(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="north">Northern</option>
              <option value="south">Southern</option>
            </select>
          </div>
        </div>
        {createError && (
          <div className="mt-3 text-xs text-red-600">{createError}</div>
        )}
        <div className="mt-4">
          <button
            type="submit"
            disabled={creating}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {creating && <Loader2 className="h-4 w-4 animate-spin" />}
            Create calendar
          </button>
        </div>
      </form>

      {/* List */}
      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading calendars…
        </div>
      )}

      {!loading && error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <div className="font-mono text-xs">{error}</div>
        </div>
      )}

      {!loading && !error && calendars.length === 0 && (
        <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
          No calendars yet. Create one above.
        </div>
      )}

      {!loading && !error && calendars.length > 0 && (
        <div className="space-y-2">
          {calendars.map((c) => (
            <Link
              key={c.id}
              href={`/admin/newsletter/calendars/${c.id}`}
              className="group flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-4 hover:border-border/80 hover:shadow-sm transition-all"
            >
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <CalendarDays className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-foreground">{c.name}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {c.industry}
                  {specLabel(c.specializationKey) ? ` · ${specLabel(c.specializationKey)}` : ''}
                  {c.hemisphere ? ` · ${HEMISPHERE_LABEL[c.hemisphere] ?? c.hemisphere}` : ''}
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  {c._count.topics} topics
                </span>
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {c._count.assignments}
                </span>
                <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
