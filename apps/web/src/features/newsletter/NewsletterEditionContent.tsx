'use client'

import { useEffect, useState } from 'react'
import {
  Loader2,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Save,
} from 'lucide-react'
import { NewsletterSocialPreview } from '@/features/social/NewsletterSocialPreview'

interface Newsletter {
  id: string
  status: string
  subjectLine: string | null
  previewText: string | null
  renderedHtml: string | null
  scheduledFor: string | null
  validation: { completionPercentage?: number; missing?: string[] } | null
  topic: { date: string; topic: string; secondaryTopic: string | null; calendar: { name: string } | null }
}

const SECTIONS: Array<{ key: string; label: string }> = [
  { key: 'feature', label: 'Feature article' },
  { key: 'secondary', label: 'Secondary article' },
  { key: 'teasers', label: 'Around the web' },
  { key: 'quickHits', label: 'Tips & facts' },
  { key: 'fun', label: 'Trivia & joke' },
  { key: 'modules', label: 'Recipes' },
  { key: 'subject', label: 'Subject line' },
  { key: 'preview', label: 'Preview text' },
  { key: 'summaryImage', label: 'Cover image' },
]

/**
 * The newsletter edition's editable content + social preview — extracted from
 * `/newsletter/[id]/page.tsx` so both the standalone route AND the dashboard's
 * NewsletterReviewModal can render it. Deliberately excludes route-navigation
 * chrome (the "All editions" back link, outer page width/padding) — those stay
 * with each caller, since a modal has no "navigate away" concept and provides
 * its own sizing.
 */
export function NewsletterEditionContent({ newsletterId }: { newsletterId: string }) {
  const [nl, setNl] = useState<Newsletter | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [subject, setSubject] = useState('')
  const [preview, setPreview] = useState('')
  const [savingMeta, setSavingMeta] = useState(false)
  const [regenerating, setRegenerating] = useState<string | null>(null)
  const [approving, setApproving] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/newsletters/${newsletterId}`, { cache: 'no-store' })
      if (!res.ok) {
        setError(`HTTP ${res.status}: ${(await res.text()) || res.statusText}`)
        return
      }
      const data = await res.json()
      const n: Newsletter = data.newsletter
      setNl(n)
      setSubject(n.subjectLine ?? '')
      setPreview(n.previewText ?? '')
    } catch (err) {
      setError((err as Error).message ?? 'Failed to load edition')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newsletterId])

  const editable = nl?.status === 'ready_for_review'

  async function saveMeta() {
    setSavingMeta(true)
    setNotice(null)
    setError(null)
    try {
      const res = await fetch(`/api/newsletters/${newsletterId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectLine: subject, previewText: preview }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? `HTTP ${res.status}`)
        return
      }
      setNl(data.newsletter)
      setNotice('Saved.')
    } catch (err) {
      setError((err as Error).message ?? 'Save failed')
    } finally {
      setSavingMeta(false)
    }
  }

  async function regenerate(section: string) {
    setRegenerating(section)
    setNotice(null)
    setError(null)
    try {
      const res = await fetch(`/api/newsletters/${newsletterId}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? `HTTP ${res.status}`)
        return
      }
      const n: Newsletter = data.newsletter
      setNl(n)
      setSubject(n.subjectLine ?? '')
      setPreview(n.previewText ?? '')
      setNotice(`Regenerated: ${section}.`)
    } catch (err) {
      setError((err as Error).message ?? 'Regenerate failed')
    } finally {
      setRegenerating(null)
    }
  }

  async function approve() {
    setApproving(true)
    setNotice(null)
    setError(null)
    try {
      const res = await fetch(`/api/newsletters/${newsletterId}/approve`, { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? `HTTP ${res.status}`)
        return
      }
      setNotice('Approved — the email is scheduled.')
      await load()
    } catch (err) {
      setError((err as Error).message ?? 'Approve failed')
    } finally {
      setApproving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading edition…
      </div>
    )
  }

  if (error && !nl) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <div className="font-mono text-xs">{error}</div>
      </div>
    )
  }

  if (!nl) return null

  const completion = nl.validation?.completionPercentage
  const missing = nl.validation?.missing ?? []

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold text-foreground">
            {nl.subjectLine || nl.topic.topic}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {new Date(nl.topic.date).toLocaleDateString(undefined, { timeZone: 'UTC' })}
            {nl.topic.calendar ? ` · ${nl.topic.calendar.name}` : ''} ·{' '}
            <span className="capitalize">{nl.status.replace(/_/g, ' ')}</span>
            {typeof completion === 'number' ? ` · ${completion}% complete` : ''}
          </p>
        </div>
        {editable && (
          <button
            onClick={approve}
            disabled={approving}
            className="inline-flex flex-shrink-0 items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {approving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Approve &amp; schedule
          </button>
        )}
      </div>

      {notice && <div className="mb-3 text-sm text-green-700">{notice}</div>}
      {error && (
        <div className="mb-3 flex items-start gap-2 text-sm text-red-600">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {missing.length > 0 && (
        <div className="mb-3 text-xs text-amber-700">Incomplete sections: {missing.join(', ')}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Controls */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Email metadata
            </h3>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Subject line</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={!editable}
              className="mb-3 w-full rounded-md border border-border bg-background px-3 py-2 text-sm disabled:opacity-60"
            />
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Preview text</label>
            <input
              value={preview}
              onChange={(e) => setPreview(e.target.value)}
              disabled={!editable}
              className="mb-3 w-full rounded-md border border-border bg-background px-3 py-2 text-sm disabled:opacity-60"
            />
            {editable && (
              <button
                onClick={saveMeta}
                disabled={savingMeta}
                className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium disabled:opacity-50"
              >
                {savingMeta ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save
              </button>
            )}
          </div>

          {editable && (
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Regenerate a section
              </h3>
              <div className="space-y-1.5">
                {SECTIONS.filter((s) => s.key !== 'secondary' || nl.topic.secondaryTopic).map((s) => (
                  <button
                    key={s.key}
                    onClick={() => regenerate(s.key)}
                    disabled={regenerating !== null}
                    className="flex w-full items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-left text-sm hover:bg-muted disabled:opacity-50"
                  >
                    {s.label}
                    {regenerating === s.key ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </button>
                ))}
                <button
                  onClick={() => regenerate('all')}
                  disabled={regenerating !== null}
                  className="flex w-full items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-left text-sm font-medium hover:bg-muted disabled:opacity-50"
                >
                  Regenerate everything
                  {regenerating === 'all' ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="rounded-xl border border-border bg-card p-2">
          {nl.renderedHtml ? (
            <iframe
              title="Newsletter preview"
              srcDoc={nl.renderedHtml}
              className="h-[800px] w-full rounded-lg border-0 bg-white"
            />
          ) : (
            <div className="flex h-[400px] items-center justify-center text-sm text-muted-foreground">
              No preview yet.
            </div>
          )}
        </div>
      </div>

      {/* Full-width: social posts generated from this newsletter */}
      <NewsletterSocialPreview newsletterId={newsletterId} />
    </div>
  )
}
