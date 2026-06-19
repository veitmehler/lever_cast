'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Loader2, AlertTriangle, Mail, Settings, CheckCircle2, ChevronRight, Tag } from 'lucide-react'

interface NewsletterRow {
  id: string
  status: string
  subjectLine: string | null
  validation: { completionPercentage?: number } | null
  scheduledFor: string | null
  topic: { date: string; topic: string; calendar: { name: string } | null }
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700',
  researching: 'bg-blue-100 text-blue-700',
  generating: 'bg-blue-100 text-blue-700',
  ready_for_review: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-700',
  scheduled: 'bg-green-100 text-green-700',
  sent: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
}

function monthLabel(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })
}

export default function NewsletterQueuePage() {
  const [rows, setRows] = useState<NewsletterRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [approving, setApproving] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/newsletters', { cache: 'no-store' })
      if (!res.ok) {
        setError(`HTTP ${res.status}: ${(await res.text()) || res.statusText}`)
        return
      }
      const data = await res.json()
      setRows(data.newsletters ?? [])
    } catch (err) {
      setError((err as Error).message ?? 'Failed to load newsletters')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function approveAll() {
    setApproving(true)
    setNotice(null)
    setError(null)
    try {
      const res = await fetch('/api/newsletters/approve-all', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? `HTTP ${res.status}`)
        return
      }
      setNotice(`Approved ${data.approved} of ${data.total}; ${data.failed} failed.`)
      await load()
    } catch (err) {
      setError((err as Error).message ?? 'Approve-all failed')
    } finally {
      setApproving(false)
    }
  }

  const readyCount = rows.filter((r) => r.status === 'ready_for_review').length

  // Group by month of the topic date.
  const groups = rows.reduce<Record<string, NewsletterRow[]>>((acc, r) => {
    const k = monthLabel(r.topic.date)
    ;(acc[k] ??= []).push(r)
    return acc
  }, {})

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Newsletter</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review, tweak, and approve your editions. Approving schedules the email.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/newsletter/offers"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            <Tag className="h-4 w-4" />
            Offers
          </Link>
          <Link
            href="/newsletter/template"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            <Settings className="h-4 w-4" />
            Template
          </Link>
        </div>
      </div>

      {readyCount > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <span className="text-sm text-amber-800">
            {readyCount} edition{readyCount === 1 ? '' : 's'} ready for review.
          </span>
          <button
            onClick={approveAll}
            disabled={approving}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {approving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Approve all ready
          </button>
        </div>
      )}

      {notice && <div className="mb-4 text-sm text-green-700">{notice}</div>}

      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading…
        </div>
      )}

      {!loading && error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <div className="font-mono text-xs">{error}</div>
        </div>
      )}

      {!loading && !error && rows.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card p-10 text-center">
          <Mail className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No newsletters yet. Once an admin assigns you a calendar and generates a month, your
            editions will appear here.
          </p>
        </div>
      )}

      {!loading && !error && rows.length > 0 && (
        <div className="space-y-6">
          {Object.entries(groups).map(([month, editions]) => (
            <section key={month}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {month}
              </h2>
              <div className="space-y-2">
                {editions.map((r) => {
                  const completion = r.validation?.completionPercentage
                  return (
                    <Link
                      key={r.id}
                      href={`/newsletter/${r.id}`}
                      className="group flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-4 hover:border-border/80 hover:shadow-sm transition-all"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-foreground">
                          {r.subjectLine || r.topic.topic}
                        </div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {new Date(r.topic.date).toLocaleDateString()}
                          {r.topic.calendar ? ` · ${r.topic.calendar.name}` : ''}
                        </div>
                      </div>
                      {typeof completion === 'number' && (
                        <span className="text-xs text-muted-foreground">{completion}%</span>
                      )}
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[r.status] ?? 'bg-gray-100 text-gray-700'}`}
                      >
                        {r.status.replace(/_/g, ' ')}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
