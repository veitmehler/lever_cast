'use client'

import { useEffect, useState } from 'react'
import { Loader2, Mail } from 'lucide-react'
import type { WorkflowView } from './useWorkflowJob'

interface PromoEmailCampaign {
  subject: string
  bodyHtml: string
  status: string // pending | processing | generated | scheduled | sent | failed
  ghlCampaignId: string | null
  tagName: string | null
  scheduledFor: string | null
  sentAt: string | null
  errorMessage: string | null
  createdAt: string
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Queued',
  processing: 'Generating…',
  generated: 'Generated — scheduling…',
  scheduled: 'Scheduled',
  sent: 'Sent',
  failed: 'Failed',
}

/**
 * Read-only status of the promotional email auto-generated for a published
 * article and scheduled as a GHL Email Campaign. Self-fetches; renders nothing
 * until the article is published and a campaign row exists.
 */
export function PromoEmailPanel({ workflow }: { workflow: WorkflowView }) {
  const { jobId, displayStatus } = workflow
  const [campaign, setCampaign] = useState<PromoEmailCampaign | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (displayStatus !== 'published' || !jobId) return
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/articles/${jobId}/promo-email`)
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled) setCampaign(data.campaign ?? null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    // Poll while still in flight so the status updates without a refresh.
    const interval = setInterval(() => void load(), 15_000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [jobId, displayStatus])

  if (displayStatus !== 'published') return null
  if (!campaign && !loading) return null

  const fmt = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : null

  const failed = campaign?.status === 'failed'

  return (
    <div className={`bg-card rounded-xl border p-6 mb-6 ${failed ? 'border-red-300 dark:border-red-700' : 'border-border'}`}>
      <div className="flex items-center gap-3 mb-3">
        <Mail className={`h-4 w-4 ${failed ? 'text-red-500' : 'text-muted-foreground'}`} />
        <h2 className="text-sm font-semibold uppercase tracking-wider flex-1 text-card-foreground">
          Promotional Email
        </h2>
        {campaign && (
          <span className="text-xs font-medium text-muted-foreground">
            {STATUS_LABEL[campaign.status] ?? campaign.status}
          </span>
        )}
      </div>

      {!campaign && loading && (
        <div className="flex items-center gap-3 text-sm text-muted-foreground py-2">
          <Loader2 className="h-4 w-4 animate-spin flex-shrink-0 text-primary" />
          <span>Loading…</span>
        </div>
      )}

      {campaign && (
        <div className="space-y-2 text-sm">
          {campaign.subject && (
            <p className="text-card-foreground"><span className="text-muted-foreground">Subject:</span> {campaign.subject}</p>
          )}
          {campaign.tagName && (
            <p className="text-muted-foreground">Audience tag: <span className="text-card-foreground">{campaign.tagName}</span></p>
          )}
          {campaign.sentAt ? (
            <p className="text-muted-foreground">Sent: <span className="text-card-foreground">{fmt(campaign.sentAt)}</span></p>
          ) : campaign.scheduledFor ? (
            <p className="text-muted-foreground">Scheduled for: <span className="text-card-foreground">{fmt(campaign.scheduledFor)}</span></p>
          ) : null}
          {campaign.ghlCampaignId && (
            <p className="text-xs text-muted-foreground">Omniply campaign ID: {campaign.ghlCampaignId}</p>
          )}
          {failed && campaign.errorMessage && (
            <p className="text-sm text-red-600 dark:text-red-400">Error: {campaign.errorMessage}</p>
          )}
        </div>
      )}
    </div>
  )
}
