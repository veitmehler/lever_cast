'use client'

import { use, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Loader2, ArrowLeft, Save, Check, RotateCcw, Crosshair, SendHorizonal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import '@/app/article-typography.css'

interface EditRequest {
  id: string
  quotedText: string
  note: string
  status: string
}

export default function AssistantReviewPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params)
  const [title, setTitle] = useState('')
  const [html, setHtml] = useState<string | null>(null)
  const [requests, setRequests] = useState<EditRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const bodyRef = useRef<HTMLDivElement>(null)

  async function load() {
    setLoading(true)
    try {
      const [aRes, erRes] = await Promise.all([
        fetch(`/api/articles/${jobId}`, { cache: 'no-store' }),
        fetch(`/api/articles/${jobId}/edit-requests`, { cache: 'no-store' }),
      ])
      if (aRes.ok) {
        const { job } = await aRes.json()
        setTitle(job?.sitePage?.title ?? 'Article')
        setHtml(job?.sitePage?.bodyHtml ?? '<p>(No content found.)</p>')
      }
      if (erRes.ok) setRequests((await erRes.json()).requests ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId])

  // Build a Range spanning exactly `quote` within the editable body, even when
  // it crosses inline elements (e.g. a sentence with a <strong> in it).
  function findQuoteRange(container: HTMLElement, quote: string): Range | null {
    const nodes: { node: Text; start: number }[] = []
    let full = ''
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)
    let n: Node | null
    while ((n = walker.nextNode())) {
      nodes.push({ node: n as Text, start: full.length })
      full += n.textContent ?? ''
    }
    if (!nodes.length) return null

    let idx = full.indexOf(quote)
    let len = quote.length
    if (idx === -1) {
      const probe = quote.slice(0, 60) // resilience if the tail was edited
      idx = full.indexOf(probe)
      len = probe.length
    }
    if (idx === -1) return null

    const locate = (pos: number) => {
      for (let i = nodes.length - 1; i >= 0; i--) {
        if (nodes[i].start <= pos) return { node: nodes[i].node, offset: pos - nodes[i].start }
      }
      return { node: nodes[0].node, offset: 0 }
    }
    const s = locate(idx)
    const e = locate(idx + len)
    const range = document.createRange()
    range.setStart(s.node, Math.min(s.offset, s.node.length))
    range.setEnd(e.node, Math.min(e.offset, e.node.length))
    return range
  }

  function jumpTo(quote: string) {
    const container = bodyRef.current
    if (!container) return

    const range = findQuoteRange(container, quote)
    if (range) {
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(range)
      const anchor =
        range.startContainer.nodeType === Node.TEXT_NODE
          ? range.startContainer.parentElement
          : (range.startContainer as HTMLElement)
      anchor?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    // Fallback: highlight the containing paragraph if exact text isn't found.
    const needle = quote.slice(0, 60)
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)
    let node: Node | null
    while ((node = walker.nextNode())) {
      if (node.textContent && node.textContent.includes(needle)) {
        const el = node.parentElement
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          const prev = el.style.backgroundColor
          el.style.transition = 'background-color 0.4s'
          el.style.backgroundColor = 'rgba(250, 204, 21, 0.45)'
          setTimeout(() => { el.style.backgroundColor = prev }, 1800)
        }
        return
      }
    }
    toast.info('Could not locate that text — it may have been edited.')
  }

  async function saveBody() {
    if (!bodyRef.current) return
    setSaving(true)
    try {
      const res = await fetch(`/api/articles/${jobId}/content`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bodyHtml: bodyRef.current.innerHTML }),
      })
      if (!res.ok) { toast.error('Failed to save'); return }
      setDirty(false)
      toast.success('Saved')
    } finally {
      setSaving(false)
    }
  }

  async function setStatus(id: string, status: 'resolved' | 'open') {
    setBusyId(id)
    try {
      const res = await fetch(`/api/edit-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) { toast.error('Failed to update'); return }
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
    } finally {
      setBusyId(null)
    }
  }

  async function requestReview() {
    if (dirty) await saveBody()
    setRequesting(true)
    try {
      const res = await fetch(`/api/articles/${jobId}/request-review`, { method: 'POST' })
      if (!res.ok) { toast.error('Failed to request review'); return }
      toast.success('Sent back for review — the reviewer has been notified.')
    } finally {
      setRequesting(false)
    }
  }

  const openCount = requests.filter((r) => r.status === 'open').length

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading…
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/dashboard" className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
      </Link>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Work through the requested edits, then send it back for review.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={saveBody} disabled={!dirty || saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
          </Button>
          <Button onClick={requestReview} disabled={requesting || openCount > 0} title={openCount > 0 ? 'Resolve all requests first' : undefined}>
            {requesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizonal className="h-4 w-4" />}
            Request review
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        {/* Body editor */}
        <div className="min-w-0 flex-1">
          <div
            ref={bodyRef}
            contentEditable
            suppressContentEditableWarning
            onInput={() => setDirty(true)}
            className="article-body max-w-none rounded-xl border border-border bg-card p-6 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            dangerouslySetInnerHTML={{ __html: html ?? '' }}
          />
        </div>

        {/* Requests panel */}
        <div className="w-80 flex-shrink-0">
          <div className="sticky top-4 rounded-xl border border-border bg-card">
            <div className="border-b border-border px-4 py-2.5 text-sm font-medium text-card-foreground">
              Edit requests {openCount > 0 && <span className="text-muted-foreground">· {openCount} open</span>}
            </div>
            <div className="max-h-[70vh] overflow-y-auto p-3">
              {requests.length === 0 ? (
                <p className="text-sm text-muted-foreground">No edit requests.</p>
              ) : (
                <div className="space-y-2">
                  {requests.map((r) => {
                    const done = r.status !== 'open'
                    return (
                      <div key={r.id} className={`rounded-lg border p-2.5 ${done ? 'border-border bg-muted/40' : 'border-border'}`}>
                        <button onClick={() => jumpTo(r.quotedText)} className="mb-1 flex items-center gap-1 text-[11px] font-medium text-primary hover:underline">
                          <Crosshair className="h-3 w-3" /> Jump to text
                        </button>
                        <div className={`line-clamp-2 text-[11px] italic text-muted-foreground ${done ? 'line-through' : ''}`}>“{r.quotedText}”</div>
                        <div className={`mt-1 text-sm ${done ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{r.note}</div>
                        <div className="mt-2">
                          {done ? (
                            <button onClick={() => setStatus(r.id, 'open')} disabled={busyId === r.id} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                              <RotateCcw className="h-3.5 w-3.5" /> Reopen
                            </button>
                          ) : (
                            <button onClick={() => setStatus(r.id, 'resolved')} disabled={busyId === r.id} className="inline-flex items-center gap-1 text-xs font-medium text-green-700 hover:underline">
                              {busyId === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Mark done
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
