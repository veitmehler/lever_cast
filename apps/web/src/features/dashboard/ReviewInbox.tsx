'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { FileText, Mail, AlertTriangle, ChevronRight, Inbox } from 'lucide-react'
import { ReviewApproveModal, type ReviewItem } from './ReviewApproveModal'

interface ReadyArticle { jobId: string; title: string }
interface ReadyNewsletter { newsletterId: string; title: string }
interface Flagged { jobId: string; title: string; reasons: string[] }
interface InboxData {
  articles: ReadyArticle[]
  newsletters: ReadyNewsletter[]
  flagged: Flagged[]
}

export function ReviewInbox() {
  const [data, setData] = useState<InboxData | null>(null)
  const [loading, setLoading] = useState(true)
  const [queue, setQueue] = useState<ReviewItem[]>([])
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const fetchInbox = useCallback(async () => {
    const res = await fetch('/api/review-inbox', { cache: 'no-store' })
    if (res.ok) {
      const d: InboxData = await res.json()
      setData(d)
      setQueue([
        ...d.articles.map((a) => ({ kind: 'article' as const, id: a.jobId, title: a.title })),
        ...d.newsletters.map((n) => ({ kind: 'newsletter' as const, id: n.newsletterId, title: n.title })),
      ])
    }
  }, [])

  useEffect(() => {
    ;(async () => {
      await fetchInbox()
      setLoading(false)
    })()
  }, [fetchInbox])

  function onApproved() {
    setQueue((prev) => {
      if (openIndex == null) return prev
      const next = prev.filter((_, i) => i !== openIndex)
      setOpenIndex(openIndex < next.length ? openIndex : null) // advance, or close if none left
      return next
    })
    void fetchInbox() // reconcile in the background
  }

  if (loading) return null
  if (!data || (queue.length === 0 && data.flagged.length === 0)) return null

  return (
    <div className="mb-8 rounded-2xl border border-border bg-card p-6">
      <div className="mb-1 flex items-center gap-2">
        <Inbox className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-card-foreground">Ready to review</h2>
        {queue.length > 0 && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{queue.length}</span>
        )}
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        Generated content waiting for your final review and approval.
      </p>

      <div className="space-y-2">
        {queue.map((it, i) => (
          <div key={`${it.kind}-${it.id}`} className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-2.5">
            {it.kind === 'article' ? (
              <FileText className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Mail className="h-4 w-4 text-muted-foreground" />
            )}
            <div className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{it.title}</div>
            <button
              onClick={() => setOpenIndex(i)}
              className="inline-flex flex-shrink-0 items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
            >
              Review &amp; Approve
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        {data.flagged.map((f) => (
          <div key={f.jobId} className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-amber-900">{f.title}</div>
              <div className="text-xs text-amber-700">
                Flagged by the quality check{f.reasons.length ? `: ${f.reasons.slice(0, 2).join('; ')}` : ''}.
              </div>
            </div>
            <Link href={`/workflow/${f.jobId}/preview`} className="flex-shrink-0 text-xs font-medium text-amber-800 hover:underline">
              Review →
            </Link>
          </div>
        ))}
      </div>

      {openIndex != null && queue[openIndex] && (
        <ReviewApproveModal
          item={queue[openIndex]}
          hasNext={openIndex < queue.length - 1}
          onClose={() => setOpenIndex(null)}
          onApproved={onApproved}
        />
      )}
    </div>
  )
}
