'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FileText, Mail, AlertTriangle, ChevronRight, Inbox } from 'lucide-react'

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

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/review-inbox', { cache: 'no-store' })
        if (res.ok) setData(await res.json())
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  // Hide entirely while loading or when there's nothing to review.
  if (loading) return null
  if (!data || (data.articles.length === 0 && data.newsletters.length === 0 && data.flagged.length === 0)) {
    return null
  }

  const total = data.articles.length + data.newsletters.length

  return (
    <div className="mb-8 rounded-2xl border border-border bg-card p-6">
      <div className="mb-1 flex items-center gap-2">
        <Inbox className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-card-foreground">Ready to review</h2>
        {total > 0 && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{total}</span>
        )}
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        Generated content waiting for your final review and approval.
      </p>

      <div className="space-y-2">
        {data.articles.map((a) => (
          <Row
            key={a.jobId}
            icon={<FileText className="h-4 w-4 text-muted-foreground" />}
            title={a.title}
            href={`/workflow/${a.jobId}/preview`}
            cta="Review & Approve"
          />
        ))}
        {data.newsletters.map((n) => (
          <Row
            key={n.newsletterId}
            icon={<Mail className="h-4 w-4 text-muted-foreground" />}
            title={n.title}
            href={`/newsletter/${n.newsletterId}`}
            cta="Review & Approve"
          />
        ))}
        {data.flagged.map((f) => (
          <div
            key={f.jobId}
            className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-amber-900">{f.title}</div>
              <div className="text-xs text-amber-700">
                Flagged by the quality check{f.reasons.length ? `: ${f.reasons.slice(0, 2).join('; ')}` : ''}.
              </div>
            </div>
            <Link
              href={`/workflow/${f.jobId}/preview`}
              className="flex-shrink-0 text-xs font-medium text-amber-800 hover:underline"
            >
              Review →
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}

function Row({ icon, title, href, cta }: { icon: React.ReactNode; title: string; href: string; cta: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-2.5">
      {icon}
      <div className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{title}</div>
      <Link
        href={href}
        className="inline-flex flex-shrink-0 items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
      >
        {cta}
        <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  )
}
