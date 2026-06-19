'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowLeft, Loader2, Play, CheckCircle2, AlertTriangle } from 'lucide-react'

interface CalendarRow {
  id: string
  name: string
  industry: string
  specializationKey: string | null
  hemisphere: string | null
}

interface AssignedUser {
  id: string
  name: string | null
  email: string
}

export default function AdminNewsletterGeneratePage() {
  const [calendars, setCalendars] = useState<CalendarRow[]>([])
  const [calendarId, setCalendarId] = useState('')
  const [assigned, setAssigned] = useState<AssignedUser[]>([])
  const [userId, setUserId] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const [loadingAssigned, setLoadingAssigned] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ enqueued: number; skipped: number; totalTopics: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Load calendars once.
  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/admin/newsletter/calendars', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setCalendars(data.calendars ?? [])
        }
      } catch {
        /* ignore */
      }
    })()
  }, [])

  // Load assigned customers when the calendar changes.
  useEffect(() => {
    setUserId('')
    setAssigned([])
    if (!calendarId) return
    setLoadingAssigned(true)
    ;(async () => {
      try {
        const res = await fetch(`/api/admin/newsletter/calendars/${calendarId}/assignments`, {
          cache: 'no-store',
        })
        if (res.ok) {
          const data = await res.json()
          setAssigned(data.assigned ?? [])
        }
      } catch {
        /* ignore */
      } finally {
        setLoadingAssigned(false)
      }
    })()
  }, [calendarId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/admin/newsletter/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calendarId,
          userId,
          from: from || undefined,
          to: to || undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? `HTTP ${res.status}`)
        return
      }
      setResult(data)
    } catch (err) {
      setError((err as Error).message ?? 'Failed to enqueue')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/newsletter"
        className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Newsletter
      </Link>

      <h1 className="text-2xl font-semibold text-foreground">Generate (manual)</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Enqueue per-customer generation for an assigned customer and date range. Each topic runs
        shared research (once) then voiced generation; review the results under the customer&apos;s
        Newsletter section.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-xl border border-border bg-card p-5">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Calendar</label>
          <select
            value={calendarId}
            onChange={(e) => setCalendarId(e.target.value)}
            required
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">Select a calendar…</option>
            {calendars.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.industry}
                {c.specializationKey ? ` / ${c.specializationKey}` : ''}
                {c.hemisphere ? ` · ${c.hemisphere}` : ''})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Customer</label>
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
            disabled={!calendarId || loadingAssigned}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm disabled:opacity-50"
          >
            <option value="">
              {loadingAssigned ? 'Loading…' : assigned.length === 0 ? 'No assigned customers' : 'Select a customer…'}
            </option>
            {assigned.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name ?? u.email} ({u.email})
              </option>
            ))}
          </select>
          {calendarId && !loadingAssigned && assigned.length === 0 && (
            <p className="mt-1 text-xs text-amber-600">
              Assign a customer to this calendar first.
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              From <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              To <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting || !calendarId || !userId}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Enqueue generation
        </button>

        {error && (
          <div className="flex items-start gap-2 text-xs text-red-600">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="flex items-center gap-2 text-xs text-green-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Enqueued {result.enqueued} edition(s); skipped {result.skipped} of {result.totalTopics} topic(s).
          </div>
        )}
      </form>
    </div>
  )
}
