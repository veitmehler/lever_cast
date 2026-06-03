'use client'

import { useState } from 'react'
import {
  Loader2,
  CheckCircle2,
  Clock,
  RefreshCw,
  Send,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const SLOT_DISPLAY_ORDER = [
  'F1', 'F2', 'F3', 'F4', 'F5', 'F6',
  'S1', 'S2', 'S3', 'S4', 'S5', 'S6',
] as const

const POST_TYPE_LABELS: Record<string, string> = {
  quote: 'Quote card',
  video_reel: 'Video reel',
  carousel: 'Carousel',
  hook_video: 'Hook video',
  quote_video: 'Quote video',
  pitch_carousel: 'Pitch carousel',
  pitch_hook: 'Pitch hook',
}

export type SpecPreviewPlatform = {
  platform: string
  caption: string
  imageUrl?: string
  mediaUrls?: string[]
  videoUrl?: string
  status: string
  postId?: string
}

export type SpecPreviewPayload = {
  slotKey: string
  postType: string
  isStory: boolean
  scheduledAt: string
  platforms: SpecPreviewPlatform[]
  assets: {
    imageUrl?: string
    mediaUrls?: string[]
    videoUrl?: string
    title?: string
  }
}

export type SocialSpecResultRow = {
  slotKey: string
  status: string
  error: string | null
  postsCreated: number
  previewJson?: SpecPreviewPayload | null
  approvedAt?: string | null
}

export type SocialAutomationRunRow = {
  id: string
  status: string
  scheduledDate: string
  totalSpecs: number
  completedSpecs: number
  failedSpecs: number
  currentSpec: string | null
  error: string | null
  slideCount?: number | null
  _count?: { posts: number }
  specResults?: SocialSpecResultRow[]
}

function parsePreview(json: unknown): SpecPreviewPayload | null {
  if (!json || typeof json !== 'object') return null
  const o = json as Record<string, unknown>
  if (typeof o.slotKey !== 'string' || typeof o.postType !== 'string') return null
  return json as SpecPreviewPayload
}

function formatScheduledAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function SlotMedia({ preview }: { preview: SpecPreviewPayload }) {
  const videoUrl =
    preview.assets.videoUrl ??
    preview.platforms.find((p) => p.videoUrl)?.videoUrl
  const mediaUrls =
    preview.assets.mediaUrls?.length
      ? preview.assets.mediaUrls
      : preview.platforms.find((p) => p.mediaUrls?.length)?.mediaUrls
  const imageUrl =
    preview.assets.imageUrl ??
    preview.platforms.find((p) => p.imageUrl)?.imageUrl ??
    mediaUrls?.[0]

  if (videoUrl) {
    return (
      <video
        src={videoUrl}
        controls
        playsInline
        className="w-full max-h-80 rounded-lg bg-black object-contain"
      />
    )
  }

  if (mediaUrls && mediaUrls.length > 1) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-1">
        {mediaUrls.map((url, i) => (
          <img
            key={`${url}-${i}`}
            src={url}
            alt={`Slide ${i + 1}`}
            className="h-32 w-32 flex-shrink-0 rounded-md object-cover border border-border"
          />
        ))}
      </div>
    )
  }

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt=""
        className="w-full max-h-80 rounded-lg object-contain border border-border bg-muted"
      />
    )
  }

  return (
    <p className="text-xs text-muted-foreground italic">No preview media</p>
  )
}

function slotBadge(
  spec: SocialSpecResultRow,
  runStatus: string,
): { label: string; className: string } {
  if (spec.status === 'failed') {
    return { label: 'Failed', className: 'text-red-500' }
  }
  if (spec.approvedAt) {
    return { label: 'Approved', className: 'text-green-600' }
  }
  if (runStatus === 'scheduling') {
    return { label: 'Scheduling…', className: 'text-yellow-600' }
  }
  if (runStatus === 'ready' && spec.status === 'completed') {
    return { label: 'Ready', className: 'text-blue-600' }
  }
  if (spec.status === 'completed') {
    return { label: 'Generated', className: 'text-green-600' }
  }
  return { label: spec.status, className: 'text-muted-foreground' }
}

type SocialPreviewPanelProps = {
  jobId: string
  runs: SocialAutomationRunRow[]
  onRefresh: () => Promise<void>
  onRetryFailed: (runId: string, slotKey: string) => Promise<void>
  retryingSpec: string | null
}

export function SocialPreviewPanel({
  jobId,
  runs,
  onRefresh,
  onRetryFailed,
  retryingSpec,
}: SocialPreviewPanelProps) {
  const [approvingAllRunId, setApprovingAllRunId] = useState<string | null>(null)
  const [approvingSlot, setApprovingSlot] = useState<string | null>(null)
  const [regeneratingSlot, setRegeneratingSlot] = useState<string | null>(null)

  const handleApproveRun = async (runId: string) => {
    setApprovingAllRunId(runId)
    try {
      const res = await fetch(
        `/api/articles/${jobId}/social-automation/${runId}/approve`,
        { method: 'POST' },
      )
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Failed to schedule posts')
      toast.success('Scheduling all posts to Omniply…')
      await onRefresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Approve failed')
    } finally {
      setApprovingAllRunId(null)
    }
  }

  const handleApproveSlot = async (runId: string, slotKey: string) => {
    const key = `${runId}-${slotKey}`
    setApprovingSlot(key)
    try {
      const res = await fetch(
        `/api/social-automation/${runId}/approve/${slotKey}`,
        { method: 'POST' },
      )
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Failed to approve slot')
      toast.success(`${slotKey} approved — scheduling to Omniply…`)
      await onRefresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Approve failed')
    } finally {
      setApprovingSlot(null)
    }
  }

  const handleRegenerateSlot = async (runId: string, slotKey: string) => {
    const key = `${runId}-${slotKey}`
    setRegeneratingSlot(key)
    try {
      const res = await fetch(
        `/api/social-automation/${runId}/regenerate/${slotKey}`,
        { method: 'POST' },
      )
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Failed to regenerate')
      toast.success(`Regenerating ${slotKey}…`)
      await onRefresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Regenerate failed')
    } finally {
      setRegeneratingSlot(null)
    }
  }

  return (
    <div className="divide-y divide-border">
      {runs.map((run) => {
        const specBySlot = new Map(
          (run.specResults ?? []).map((s) => [s.slotKey, s]),
        )
        const readySlots =
          run.specResults?.filter(
            (s) => s.status === 'completed' && !s.approvedAt,
          ).length ?? 0
        const approvedSlots =
          run.specResults?.filter((s) => s.approvedAt).length ?? 0
        const showPreview =
          ['ready', 'scheduling', 'completed'].includes(run.status) &&
          (run.specResults?.some((s) => s.previewJson) ?? false)

        return (
          <div key={run.id} className="px-6 py-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <div>
                <span className="font-medium capitalize">{run.status}</span>
                <span className="text-muted-foreground ml-2">
                  {run.scheduledDate} · {run.completedSpecs}/{run.totalSpecs} specs
                  {run.slideCount ? ` · ${run.slideCount} slides (F4/F6)` : ''}
                  {run.currentSpec ? ` · ${run.currentSpec}` : ''}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                {run._count?.posts ?? 0}{' '}
                {run.status === 'ready' ? 'preview posts' : 'posts'}
                {run.status === 'ready' && readySlots > 0
                  ? ` · ${readySlots} awaiting approval`
                  : ''}
                {approvedSlots > 0 ? ` · ${approvedSlots} approved` : ''}
                {run.failedSpecs > 0 ? ` · ${run.failedSpecs} failed` : ''}
              </div>
              {run.error && (
                <p className="w-full text-xs text-red-500">{run.error}</p>
              )}
            </div>

            {run.status === 'ready' && (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  className="gap-1.5"
                  disabled={approvingAllRunId === run.id || readySlots === 0}
                  onClick={() => void handleApproveRun(run.id)}
                >
                  {approvingAllRunId === run.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Approve &amp; schedule all to Omniply
                </Button>
                <span className="text-xs text-muted-foreground">
                  Review each slot below before scheduling, or approve everything at once.
                </span>
              </div>
            )}

            {(run.status === 'pending' || run.status === 'processing') && (
              <div className="flex flex-wrap gap-1.5">
                {SLOT_DISPLAY_ORDER.map((slotKey) => {
                  const spec = specBySlot.get(slotKey)
                  return (
                    <span
                      key={slotKey}
                      className="inline-flex items-center gap-1 text-xs rounded border border-border px-2 py-0.5 font-mono"
                    >
                      {slotKey}
                      <span className="text-muted-foreground">
                        {spec?.status ?? '…'}
                      </span>
                      {run.currentSpec === slotKey && (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      )}
                    </span>
                  )
                })}
              </div>
            )}

            {showPreview && (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {SLOT_DISPLAY_ORDER.map((slotKey) => {
                  const spec = specBySlot.get(slotKey)
                  if (!spec) return null
                  const preview = parsePreview(spec.previewJson)
                  const badge = slotBadge(spec, run.status)
                  const canApprove =
                    run.status === 'ready' &&
                    spec.status === 'completed' &&
                    !spec.approvedAt
                  const canRegenerate =
                    ['ready', 'completed', 'failed'].includes(run.status) &&
                    spec.status !== 'pending'
                  const actionKey = `${run.id}-${slotKey}`

                  return (
                    <div
                      key={slotKey}
                      className="rounded-lg border border-border bg-muted/20 p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-mono text-sm font-semibold">{slotKey}</span>
                          {preview && (
                            <p className="text-xs text-muted-foreground">
                              {POST_TYPE_LABELS[preview.postType] ?? preview.postType}
                              {preview.isStory ? ' · Story' : ' · Feed'}
                            </p>
                          )}
                          {preview?.scheduledAt && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Clock className="h-3 w-3" />
                              {formatScheduledAt(preview.scheduledAt)}
                            </p>
                          )}
                        </div>
                        <span className={`text-xs font-medium ${badge.className}`}>
                          {badge.label}
                        </span>
                      </div>

                      {spec.status === 'failed' && (
                        <p className="text-xs text-red-500">{spec.error ?? 'Generation failed'}</p>
                      )}

                      {preview && spec.status === 'completed' && (
                        <>
                          <SlotMedia preview={preview} />
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {preview.platforms.map((p) => (
                              <div key={p.platform} className="text-xs">
                                <span className="font-medium capitalize">{p.platform}</span>
                                <p className="text-muted-foreground whitespace-pre-wrap mt-0.5 line-clamp-4">
                                  {p.caption}
                                </p>
                              </div>
                            ))}
                          </div>
                        </>
                      )}

                      <div className="flex flex-wrap gap-2 pt-1">
                        {canApprove && (
                          <Button
                            size="sm"
                            variant="default"
                            className="h-7 text-xs gap-1"
                            disabled={approvingSlot === actionKey}
                            onClick={() => void handleApproveSlot(run.id, slotKey)}
                          >
                            {approvingSlot === actionKey ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-3 w-3" />
                            )}
                            Approve
                          </Button>
                        )}
                        {canRegenerate && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1"
                            disabled={regeneratingSlot === actionKey}
                            onClick={() => void handleRegenerateSlot(run.id, slotKey)}
                          >
                            {regeneratingSlot === actionKey ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3 w-3" />
                            )}
                            Regenerate
                          </Button>
                        )}
                        {spec.status === 'failed' && (
                          <button
                            type="button"
                            className="text-xs text-primary hover:underline"
                            disabled={retryingSpec === actionKey}
                            onClick={() => void onRetryFailed(run.id, slotKey)}
                          >
                            {retryingSpec === actionKey ? 'Retrying…' : 'Retry'}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {run.status === 'completed' && !showPreview && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-600" />
                All posts scheduled.
              </p>
            )}

            {run.status === 'scheduling' && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Scheduling approved posts to Omniply…
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
