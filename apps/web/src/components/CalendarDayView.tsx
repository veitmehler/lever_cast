'use client'

import { useState } from 'react'
import { FileText, RefreshCw, Loader2, Layers } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

type Post = {
  id: string
  platform: string
  status: string
  content: string
  publishedAt: string | null
  scheduledAt: string | null
  draftId: string | null
  postType?: string | null
  slotKey?: string | null
  automationRunId?: string | null
  draft?: { id: string; title: string }
  automationRun?: { id: string; jobId: string | null } | null
}

type SpecResult = {
  id: string
  slotKey: string
  status: string
  error: string | null
  postsCreated: number
}

type AutomationRun = {
  id: string
  status: string
  completedSpecs: number
  failedSpecs: number
  totalSpecs: number
  currentSpec: string | null
  error: string | null
  jobId: string | null
  specResults: SpecResult[]
  _count?: { posts: number }
  job?: { id: string; topic: { topic: string } }
}

interface CalendarDayViewProps {
  date: Date
  posts: Post[]
  runs: AutomationRun[]
  onRetryComplete?: () => void
}

export function CalendarDayView({ posts, runs, onRetryComplete }: CalendarDayViewProps) {
  const [retrying, setRetrying] = useState<string | null>(null)

  const publishedPosts = posts.filter((p) => p.status === 'published')
  const scheduledPosts = posts.filter((p) => p.status === 'scheduled')

  const handleRetrySpec = async (runId: string, slotKey: string) => {
    setRetrying(`${runId}-${slotKey}`)
    try {
      const res = await fetch(`/api/social-automation/${runId}/retry/${slotKey}`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Retry failed')
      toast.success(`Retried ${slotKey}`)
      onRetryComplete?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Retry failed')
    } finally {
      setRetrying(null)
    }
  }

  if (posts.length === 0 && runs.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">No posts or automation runs for this date</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {runs.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            Automation runs ({runs.length})
          </h3>
          <div className="space-y-3">
            {runs.map((run) => (
              <div key={run.id} className="rounded-lg border border-border bg-card p-3">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div>
                    <span className="text-sm font-medium capitalize">{run.status}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {run.completedSpecs}/{run.totalSpecs} specs · {run._count?.posts ?? 0} posts
                    </span>
                  </div>
                  {run.jobId && (
                    <Link
                      href={`/workflow/${run.jobId}`}
                      className="text-xs text-primary hover:underline"
                    >
                      {run.job?.topic.topic ?? 'View article'}
                    </Link>
                  )}
                </div>
                {run.error && <p className="text-xs text-red-500 mb-2">{run.error}</p>}
                <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
                  {run.specResults.map((spec) => (
                    <div
                      key={spec.id}
                      className="flex items-center justify-between gap-2 rounded border border-border px-2 py-1.5 text-xs"
                    >
                      <div>
                        <span className="font-mono font-medium">{spec.slotKey}</span>
                        <span
                          className={`ml-2 capitalize ${
                            spec.status === 'completed'
                              ? 'text-green-600'
                              : spec.status === 'failed'
                                ? 'text-red-500'
                                : 'text-muted-foreground'
                          }`}
                        >
                          {spec.status}
                        </span>
                        {spec.postsCreated > 0 && (
                          <span className="text-muted-foreground ml-1">({spec.postsCreated})</span>
                        )}
                      </div>
                      {spec.status === 'failed' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2"
                          disabled={retrying === `${run.id}-${spec.slotKey}`}
                          onClick={() => void handleRetrySpec(run.id, spec.slotKey)}
                        >
                          {retrying === `${run.id}-${spec.slotKey}` ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {publishedPosts.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Published ({publishedPosts.length})
          </h3>
          <div className="space-y-2">
            {publishedPosts.map((post) => (
              <PostRow key={post.id} post={post} />
            ))}
          </div>
        </div>
      )}

      {scheduledPosts.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            Scheduled ({scheduledPosts.length})
          </h3>
          <div className="space-y-2">
            {scheduledPosts.map((post) => (
              <PostRow key={post.id} post={post} scheduled />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function PostRow({ post, scheduled }: { post: Post; scheduled?: boolean }) {
  const href = post.draftId
    ? `/posts/${post.draftId}`
    : post.automationRun?.jobId
      ? `/workflow/${post.automationRun.jobId}`
      : '#'

  return (
    <Link
      href={href}
      className="block rounded-lg border border-border bg-card p-3 hover:border-primary/50 transition-colors"
    >
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-2 flex-wrap">
          <FileText className={`w-4 h-4 ${scheduled ? 'text-orange-500' : 'text-primary'}`} />
          <span className="text-xs font-medium text-muted-foreground uppercase">{post.platform}</span>
          {post.slotKey && (
            <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded">{post.slotKey}</span>
          )}
          {post.postType && (
            <span className="text-[10px] text-muted-foreground">{post.postType}</span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {(scheduled ? post.scheduledAt : post.publishedAt)
            ? new Date((scheduled ? post.scheduledAt : post.publishedAt)!).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              })
            : ''}
        </span>
      </div>
      <p className="text-sm text-card-foreground line-clamp-2">{post.content}</p>
    </Link>
  )
}
