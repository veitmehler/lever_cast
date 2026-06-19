'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Loader2, X, Check, Save, FileText, Mail, ArrowRight, MessageSquarePlus, Send, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export interface ReviewItem {
  kind: 'article' | 'newsletter'
  id: string // jobId for article, newsletterId for newsletter
  title: string
}

interface PendingEdit {
  quotedText: string
  prefixContext: string
  suffixContext: string
  note: string
}

/** Capture the current text selection inside a container as a quote + context. */
function captureSelection(container: HTMLElement): Omit<PendingEdit, 'note'> | null {
  const sel = window.getSelection()
  if (!sel || sel.isCollapsed || sel.rangeCount === 0) return null
  const text = sel.toString().trim()
  if (!text || !container.contains(sel.anchorNode)) return null
  const full = container.textContent ?? ''
  const idx = full.indexOf(text)
  return {
    quotedText: text,
    prefixContext: idx > 0 ? full.slice(Math.max(0, idx - 40), idx) : '',
    suffixContext: idx >= 0 ? full.slice(idx + text.length, idx + text.length + 40) : '',
  }
}

export function ReviewApproveModal({
  item,
  hasNext,
  onClose,
  onApproved,
}: {
  item: ReviewItem
  hasNext: boolean
  onClose: () => void
  onApproved: () => void
}) {
  const [html, setHtml] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [approving, setApproving] = useState(false)
  const [reachedEnd, setReachedEnd] = useState(false)
  const [openRequests, setOpenRequests] = useState(0)

  // request-edits mode
  const [requestMode, setRequestMode] = useState(false)
  const [selDraft, setSelDraft] = useState<Omit<PendingEdit, 'note'> | null>(null)
  const [noteText, setNoteText] = useState('')
  const [pending, setPending] = useState<PendingEdit[]>([])
  const [assignee, setAssignee] = useState('')
  const [sending, setSending] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)

  const isArticle = item.kind === 'article'

  useEffect(() => {
    let cancelled = false
    setLoading(true); setHtml(null); setDirty(false); setReachedEnd(false)
    setRequestMode(false); setPending([]); setSelDraft(null); setOpenRequests(0)
    ;(async () => {
      try {
        if (isArticle) {
          const [aRes, erRes, acctRes] = await Promise.all([
            fetch(`/api/articles/${item.id}`, { cache: 'no-store' }),
            fetch(`/api/articles/${item.id}/edit-requests`, { cache: 'no-store' }),
            fetch('/api/account', { cache: 'no-store' }),
          ])
          if (aRes.ok && !cancelled) {
            const { job } = await aRes.json()
            setHtml(job?.sitePage?.bodyHtml ?? '<p>(No content found.)</p>')
          }
          if (erRes.ok && !cancelled) setOpenRequests((await erRes.json()).openCount ?? 0)
          if (acctRes.ok && !cancelled) setAssignee((await acctRes.json()).account?.assistantEmail ?? '')
        } else {
          const res = await fetch(`/api/newsletters/${item.id}`, { cache: 'no-store' })
          if (res.ok && !cancelled) setHtml((await res.json()).newsletter?.renderedHtml ?? '<p>(No content found.)</p>')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [item.id, isArticle])

  const onScroll = useCallback(() => {
    const el = scrollRef.current
    if (el && el.scrollTop + el.clientHeight >= el.scrollHeight - 48) setReachedEnd(true)
  }, [])

  useEffect(() => {
    if (!loading && scrollRef.current) {
      const el = scrollRef.current
      if (el.scrollHeight <= el.clientHeight + 48) setReachedEnd(true)
    }
  }, [loading, html])

  async function saveEdits(): Promise<boolean> {
    if (!isArticle || !bodyRef.current) return true
    setSaving(true)
    try {
      const res = await fetch(`/api/articles/${item.id}/content`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bodyHtml: bodyRef.current.innerHTML }),
      })
      if (!res.ok) { toast.error('Failed to save edits'); return false }
      setDirty(false)
      return true
    } finally {
      setSaving(false)
    }
  }

  async function approve() {
    setApproving(true)
    try {
      if (isArticle && dirty) {
        const ok = await saveEdits()
        if (!ok) return
      }
      const url = isArticle ? `/api/articles/${item.id}/publish` : `/api/newsletters/${item.id}/approve`
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        toast.error(body.error ?? 'Failed to approve')
        return
      }
      toast.success(isArticle ? 'Published — social posts are being generated.' : 'Approved — newsletter scheduled.')
      onApproved()
    } finally {
      setApproving(false)
    }
  }

  function addPending() {
    if (!selDraft || !noteText.trim()) return
    setPending((p) => [...p, { ...selDraft, note: noteText.trim() }])
    setSelDraft(null)
    setNoteText('')
    window.getSelection()?.removeAllRanges()
  }

  async function sendEdits() {
    if (pending.length === 0) return
    if (!assignee.trim()) { toast.error('Enter a teammate email to send to'); return }
    setSending(true)
    try {
      const res = await fetch(`/api/articles/${item.id}/edit-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigneeEmail: assignee.trim(), requests: pending }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        toast.error(body.error ?? 'Failed to send')
        return
      }
      toast.success(`Sent ${pending.length} edit request(s) to ${assignee.trim()}.`)
      onClose()
    } finally {
      setSending(false)
    }
  }

  const approveBlocked = openRequests > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="flex min-w-0 items-center gap-2">
            {isArticle ? <FileText className="h-4 w-4 text-muted-foreground" /> : <Mail className="h-4 w-4 text-muted-foreground" />}
            <span className="truncate text-sm font-semibold text-card-foreground">{item.title}</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{isArticle ? 'Article' : 'Newsletter'}</span>
          </div>
          <button onClick={onClose} className="rounded p-1 text-muted-foreground hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>

        {approveBlocked && (
          <div className="border-b border-amber-200 bg-amber-50 px-5 py-2 text-xs text-amber-800">
            {openRequests} edit request(s) are open with a teammate — publishing is paused until they&apos;re resolved.
          </div>
        )}

        <div className="flex min-h-0 flex-1">
          {/* Content */}
          <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto bg-background px-6 py-5">
            {loading ? (
              <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Loading…</div>
            ) : isArticle ? (
              <div
                ref={bodyRef}
                contentEditable={!requestMode}
                suppressContentEditableWarning
                onInput={() => setDirty(true)}
                onMouseUp={() => { if (requestMode && bodyRef.current) setSelDraft(captureSelection(bodyRef.current)) }}
                className="prose prose-sm max-w-none rounded-lg bg-card p-6 text-foreground focus:outline-none [&_a]:text-primary [&_a]:underline [&_h2]:font-semibold"
                dangerouslySetInnerHTML={{ __html: html ?? '' }}
              />
            ) : (
              <div className="mx-auto max-w-2xl rounded-lg bg-white p-2 shadow-sm" dangerouslySetInnerHTML={{ __html: html ?? '' }} />
            )}
          </div>

          {/* Request-edits rail */}
          {requestMode && (
            <div className="flex w-80 flex-shrink-0 flex-col border-l border-border bg-card">
              <div className="border-b border-border px-4 py-2 text-xs font-medium text-muted-foreground">
                Highlight text in the article, then add a note for your teammate.
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                {selDraft && (
                  <div className="mb-3 rounded-lg border border-primary/30 bg-primary/5 p-2">
                    <div className="mb-1 line-clamp-2 text-xs italic text-muted-foreground">“{selDraft.quotedText}”</div>
                    <textarea
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="What should change here?"
                      rows={2}
                      className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
                    />
                    <div className="mt-1 flex justify-end gap-1">
                      <button onClick={() => { setSelDraft(null); setNoteText('') }} className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted">Cancel</button>
                      <button onClick={addPending} disabled={!noteText.trim()} className="rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground disabled:opacity-50">Add</button>
                    </div>
                  </div>
                )}
                {pending.length === 0 && !selDraft && (
                  <p className="text-xs text-muted-foreground">No notes yet. Select some text to start.</p>
                )}
                <div className="space-y-2">
                  {pending.map((p, i) => (
                    <div key={i} className="rounded-lg border border-border p-2">
                      <div className="line-clamp-1 text-[11px] italic text-muted-foreground">“{p.quotedText}”</div>
                      <div className="mt-0.5 flex items-start justify-between gap-2 text-xs text-foreground">
                        <span>{p.note}</span>
                        <button onClick={() => setPending((prev) => prev.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-red-600">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2 border-t border-border p-3">
                <input
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  placeholder="teammate@example.com"
                  className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs"
                />
                <Button onClick={sendEdits} disabled={pending.length === 0 || sending} className="w-full">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Send {pending.length || ''} to teammate
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-3">
          <div className="text-xs text-muted-foreground">
            {reachedEnd ? <span className="text-green-600">✓ Reviewed to the end</span> : 'Scroll to the bottom to enable Approve'}
            {isArticle && dirty && <span className="ml-2 text-amber-600">• unsaved edits</span>}
          </div>
          <div className="flex items-center gap-2">
            {isArticle && (
              <Button variant="outline" onClick={() => setRequestMode((v) => !v)}>
                <MessageSquarePlus className="h-4 w-4" />
                {requestMode ? 'Done requesting' : 'Request edits'}
              </Button>
            )}
            {isArticle && (
              <Button variant="outline" onClick={saveEdits} disabled={!dirty || saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save
              </Button>
            )}
            <Button onClick={approve} disabled={!reachedEnd || approving || approveBlocked}>
              {approving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {isArticle ? 'Approve & Publish' : 'Approve & Schedule'}
              {hasNext && <ArrowRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
