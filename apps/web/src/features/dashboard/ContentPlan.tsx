'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  Loader2, CalendarRange, Table as TableIcon, LayoutGrid, Pencil, X,
  Lightbulb, Plus, CalendarX, Mail, FileText, CheckCircle2, AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { ReviewApproveModal, type ReviewItem } from './ReviewApproveModal'
import { TopicEditModal, type EditableTopic } from './TopicEditModal'

interface ArticleEntry {
  source: 'scheduled' | 'article_calendar'
  topic: string
  topicId?: string
  calendarTopicId?: string
  status?: string
  jobId?: string
  jobStatus?: string
}
interface Day {
  date: string
  article: { primary: ArticleEntry | null; alternatives: ArticleEntry[] }
  newsletter: { topic: string; newsletterTopicId: string; newsletterId?: string; status?: string } | null
}
interface PlanData { from: string; to: string; days: Day[]; ideaCount: number }
interface Idea {
  id: string; topic: string; mode?: string | null
  outlineFrameworkNumber?: number | null; outlineSpecialInstructions?: string | null; realCaseStudies?: string | null
}
interface Inbox {
  articles: { jobId: string; title: string }[]
  newsletters: { newsletterId: string; title: string }[]
  flagged: { jobId: string; title: string; reasons: string[] }[]
}

export function ContentPlan() {
  const [data, setData] = useState<PlanData | null>(null)
  const [inbox, setInbox] = useState<Inbox | null>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'table' | 'grid'>('table')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busyDate, setBusyDate] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  const [pickerDate, setPickerDate] = useState<string | null>(null)
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [addDate, setAddDate] = useState<string | null>(null)
  const [addText, setAddText] = useState('')
  const [editTopic, setEditTopic] = useState<EditableTopic | null>(null)
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [planRes, inboxRes] = await Promise.all([
        fetch('/api/content-plan', { cache: 'no-store' }),
        fetch('/api/review-inbox', { cache: 'no-store' }),
      ])
      if (planRes.ok) setData(await planRes.json())
      if (inboxRes.ok) setInbox(await inboxRes.json())
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => { load() }, [load])

  async function loadIdeas() {
    const res = await fetch('/api/topics/ideas', { cache: 'no-store' })
    if (res.ok) setIdeas((await res.json()).ideas ?? [])
  }

  const readyArticleIds = new Set((inbox?.articles ?? []).map((a) => a.jobId))
  const readyNewsletterIds = new Set((inbox?.newsletters ?? []).map((n) => n.newsletterId))
  const readyQueue: ReviewItem[] = [
    ...(inbox?.articles ?? []).map((a) => ({ kind: 'article' as const, id: a.jobId, title: a.title })),
    ...(inbox?.newsletters ?? []).map((n) => ({ kind: 'newsletter' as const, id: n.newsletterId, title: n.title })),
  ]
  const queueIndexFor = (kind: 'article' | 'newsletter', id: string) => readyQueue.findIndex((q) => q.kind === kind && q.id === id)

  const visibleArticleIds = new Set((data?.days ?? []).map((d) => d.article.primary?.jobId).filter(Boolean) as string[])
  const visibleNewsletterIds = new Set((data?.days ?? []).map((d) => d.newsletter?.newsletterId).filter(Boolean) as string[])
  const outOfWindow: ReviewItem[] = readyQueue.filter((q) =>
    q.kind === 'article' ? !visibleArticleIds.has(q.id) : !visibleNewsletterIds.has(q.id))

  function onApproved() {
    setOpenIndex((idx) => (idx == null ? null : idx + 1 < readyQueue.length ? idx + 1 : null))
    void load()
  }

  async function planTopic(date: string, topic: string, source: 'manual' | 'article_calendar') {
    setBusyDate(date)
    try {
      const res = await fetch('/api/topics/plan', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, scheduledDate: `${date}T00:00:00.000Z`, source }),
      })
      if (!res.ok) return toast.error('Failed to schedule')
      await load()
    } finally { setBusyDate(null) }
  }
  async function assignIdea(date: string, idea: Idea) {
    setBusyDate(date)
    try {
      const res = await fetch(`/api/topics/${idea.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledDate: `${date}T00:00:00.000Z` }),
      })
      if (!res.ok) return toast.error('Failed to assign idea')
      setPickerDate(null); await load()
    } finally { setBusyDate(null) }
  }
  async function unschedule(topicId: string, date: string) {
    setBusyDate(date)
    try {
      const res = await fetch(`/api/topics/${topicId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledDate: null }),
      })
      if (!res.ok) return toast.error('Failed to unschedule')
      await load()
    } finally { setBusyDate(null) }
  }
  async function generateSelected() {
    if (selected.size === 0) return
    setGenerating(true)
    try {
      const res = await fetch('/api/content-plan/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dates: Array.from(selected) }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) return toast.error(body.error ?? 'Failed to start generation')
      toast.success(`Generating ${body.itemCount} item(s) — you'll get an email when they're ready to review.`)
      setSelected(new Set()); await load()
    } finally { setGenerating(false) }
  }

  const selectableDates = (data?.days ?? []).filter((d) => d.article.primary || d.newsletter).map((d) => d.date)
  const toggleSelect = (date: string) =>
    setSelected((prev) => { const n = new Set(prev); if (n.has(date)) n.delete(date); else n.add(date); return n })
  const fmt = (date: string) => format(new Date(date + 'T00:00:00'), 'EEE, MMM d')

  function ReviewBtn({ kind, id }: { kind: 'article' | 'newsletter'; id: string }) {
    const idx = queueIndexFor(kind, id)
    return (
      <button onClick={() => idx >= 0 && setOpenIndex(idx)}
        className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90">
        <CheckCircle2 className="h-3.5 w-3.5" /> Review &amp; Approve
      </button>
    )
  }

  // The whole right-hand "Review" column for a day (article and/or newsletter actions).
  function ReviewActions({ d }: { d: Day }) {
    const a = d.article.primary
    const nl = d.newsletter
    const articleReady = a?.jobId && readyArticleIds.has(a.jobId)
    const articleFlagged = a?.jobStatus === 'needs_review' && a.jobId
    const nlReady = nl?.newsletterId && readyNewsletterIds.has(nl.newsletterId)
    if (!articleReady && !articleFlagged && !nlReady) return <span className="text-xs text-muted-foreground">—</span>
    return (
      <div className="flex flex-col items-end gap-1">
        {articleReady && <ReviewBtn kind="article" id={a!.jobId!} />}
        {articleFlagged && (
          <Link href={`/workflow/${a!.jobId}/preview`} className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 hover:underline">
            <AlertTriangle className="h-3.5 w-3.5" /> Needs review
          </Link>
        )}
        {nlReady && <ReviewBtn kind="newsletter" id={nl!.newsletterId!} />}
      </div>
    )
  }

  function ArticleCell({ d }: { d: Day }) {
    const p = d.article.primary
    if (!p) {
      return (
        <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
          <button onClick={() => { setPickerDate(d.date); loadIdeas() }} className="inline-flex items-center gap-1 rounded-md border border-dashed border-border px-2 py-1 text-xs hover:bg-muted">
            <Lightbulb className="h-3.5 w-3.5" /> Use idea
          </button>
          <button onClick={() => { setAddDate(d.date); setAddText('') }} className="inline-flex items-center gap-1 rounded-md border border-dashed border-border px-2 py-1 text-xs hover:bg-muted">
            <Plus className="h-3.5 w-3.5" /> Add topic
          </button>
        </div>
      )
    }
    // A planned topic with no job yet → editable (framework/advanced via modal).
    const editable = !!p.topicId && !p.jobId
    return (
      <div className="group flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-sm text-foreground">{p.topic}</div>
          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
            {p.source === 'article_calendar'
              ? <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-blue-700">suggested</span>
              : <span className="rounded-full bg-muted px-1.5 py-0.5">scheduled</span>}
            {p.jobStatus && <span className="rounded-full bg-muted px-1.5 py-0.5">{p.jobStatus}</span>}
          </div>
        </div>
        <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          {p.source === 'article_calendar' && p.calendarTopicId ? (
            <button onClick={() => planTopic(d.date, p.topic, 'article_calendar')} disabled={busyDate === d.date} className="rounded p-1 text-xs text-primary hover:bg-muted" title="Add this suggestion to your plan">Use</button>
          ) : editable ? (
            <>
              <button onClick={() => setEditTopic({ id: p.topicId!, topic: p.topic })} className="rounded p-1 text-muted-foreground hover:bg-muted" title="Edit topic & options"><Pencil className="h-3.5 w-3.5" /></button>
              <button onClick={() => unschedule(p.topicId!, d.date)} disabled={busyDate === d.date} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-red-600" title="Unschedule (back to idea bank)"><CalendarX className="h-3.5 w-3.5" /></button>
            </>
          ) : null}
        </div>
      </div>
    )
  }

  function NewsletterCell({ d }: { d: Day }) {
    const nl = d.newsletter
    if (!nl) return <span className="text-xs text-muted-foreground">—</span>
    return (
      <div>
        <div className="text-sm text-foreground">{nl.topic}</div>
        {nl.status && <span className="mt-0.5 inline-block rounded-full bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">{nl.status}</span>}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarRange className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Content Plan</h2>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Your articles and newsletters for the next 30 days.{data ? ` ${data.ideaCount} ideas in your bank.` : ''}
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
          <button onClick={() => setView('table')} className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm ${view === 'table' ? 'bg-muted font-medium text-foreground' : 'text-muted-foreground'}`}><TableIcon className="h-4 w-4" /> Table</button>
          <button onClick={() => setView('grid')} className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm ${view === 'grid' ? 'bg-muted font-medium text-foreground' : 'text-muted-foreground'}`}><LayoutGrid className="h-4 w-4" /> Grid</button>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm">
          <span>{selected.size} day(s) selected</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setSelected(new Set())} className="text-muted-foreground hover:text-foreground">Clear</button>
            <Button size="sm" onClick={generateSelected} disabled={generating}>
              {generating && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}Generate selected
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Loading plan…</div>
      ) : !data ? (
        <p className="text-sm text-muted-foreground">Could not load your plan.</p>
      ) : view === 'table' ? (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs text-muted-foreground">
              <tr>
                <th className="w-10 px-3 py-2">
                  <input type="checkbox" checked={selected.size > 0 && selected.size === selectableDates.length}
                    onChange={(e) => setSelected(e.target.checked ? new Set(selectableDates) : new Set())} className="h-4 w-4 rounded border-input" />
                </th>
                <th className="w-32 px-3 py-2">Date</th>
                <th className="px-3 py-2"><span className="inline-flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> Article</span></th>
                <th className="px-3 py-2"><span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> Newsletter</span></th>
                <th className="w-44 px-3 py-2 text-right">Review</th>
              </tr>
            </thead>
            <tbody>
              {data.days.map((d) => {
                const selectable = !!(d.article.primary || d.newsletter)
                return (
                  <tr key={d.date} className="border-t border-border align-middle">
                    <td className="px-3 py-2.5">{selectable && <input type="checkbox" checked={selected.has(d.date)} onChange={() => toggleSelect(d.date)} className="h-4 w-4 rounded border-input" />}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 font-medium text-foreground">{fmt(d.date)}</td>
                    <td className="px-3 py-2.5"><ArticleCell d={d} /></td>
                    <td className="px-3 py-2.5"><NewsletterCell d={d} /></td>
                    <td className="px-3 py-2.5"><ReviewActions d={d} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {data.days.map((d) => (
            <div key={d.date} className="rounded-xl border border-border bg-card p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{fmt(d.date)}</span>
                {(d.article.primary || d.newsletter) && <input type="checkbox" checked={selected.has(d.date)} onChange={() => toggleSelect(d.date)} className="h-4 w-4 rounded border-input" />}
              </div>
              <div className="space-y-2">
                <div className="rounded-lg bg-muted/40 p-2">
                  <div className="mb-1 flex items-center gap-1 text-[11px] uppercase tracking-wide text-muted-foreground"><FileText className="h-3 w-3" /> Article</div>
                  <ArticleCell d={d} />
                </div>
                <div className="rounded-lg bg-muted/40 p-2">
                  <div className="mb-1 flex items-center gap-1 text-[11px] uppercase tracking-wide text-muted-foreground"><Mail className="h-3 w-3" /> Newsletter</div>
                  <NewsletterCell d={d} />
                </div>
                <div className="flex justify-end"><ReviewActions d={d} /></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {outOfWindow.length > 0 && (
        <div className="mt-4 rounded-xl border border-border bg-muted/30 p-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Also ready to review</div>
          <div className="space-y-2">
            {outOfWindow.map((it) => (
              <div key={`${it.kind}-${it.id}`} className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2">
                {it.kind === 'article' ? <FileText className="h-4 w-4 text-muted-foreground" /> : <Mail className="h-4 w-4 text-muted-foreground" />}
                <span className="min-w-0 flex-1 truncate text-sm text-foreground">{it.title}</span>
                <ReviewBtn kind={it.kind} id={it.id} />
              </div>
            ))}
          </div>
        </div>
      )}

      {(inbox?.flagged?.length ?? 0) > 0 && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-800">Flagged by quality check</div>
          <div className="space-y-2">
            {inbox!.flagged.map((f) => (
              <div key={f.jobId} className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span className="min-w-0 flex-1 truncate text-sm text-foreground">{f.title}</span>
                <Link href={`/workflow/${f.jobId}/preview`} className="text-xs font-medium text-amber-800 hover:underline">Review →</Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {openIndex != null && readyQueue[openIndex] && (
        <ReviewApproveModal item={readyQueue[openIndex]} hasNext={openIndex < readyQueue.length - 1} onClose={() => setOpenIndex(null)} onApproved={onApproved} />
      )}

      {editTopic && (
        <TopicEditModal topic={editTopic} onClose={() => setEditTopic(null)} onSaved={() => { setEditTopic(null); void load() }} />
      )}

      {pickerDate && (
        <Modal title={`Use an idea for ${fmt(pickerDate)}`} onClose={() => setPickerDate(null)}>
          {ideas.length === 0 ? (
            <p className="text-sm text-muted-foreground">No ideas in your bank yet. Capture some above.</p>
          ) : (
            <div className="max-h-80 space-y-1 overflow-y-auto">
              {ideas.map((idea) => (
                <button key={idea.id} onClick={() => assignIdea(pickerDate, idea)} disabled={busyDate === pickerDate}
                  className="flex w-full items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-left text-sm hover:bg-muted disabled:opacity-50">
                  <span className="min-w-0 flex-1 truncate">{idea.topic}</span>
                  <span className="text-xs text-primary">Schedule →</span>
                </button>
              ))}
            </div>
          )}
        </Modal>
      )}

      {addDate && (
        <Modal title={`Add an article topic for ${fmt(addDate)}`} onClose={() => setAddDate(null)}>
          <div className="flex flex-col gap-3">
            <input value={addText} onChange={(e) => setAddText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && addText.trim()) { planTopic(addDate, addText.trim(), 'manual'); setAddDate(null) } }}
              autoFocus placeholder="Article topic / working title" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddDate(null)}>Cancel</Button>
              <Button onClick={() => { planTopic(addDate, addText.trim(), 'manual'); setAddDate(null) }} disabled={!addText.trim()}>Add to plan</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-card-foreground">{title}</h3>
          <button onClick={onClose} className="rounded p-1 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}
