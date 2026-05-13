'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  FileText, Plus, Loader2, RefreshCw, ChevronRight, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { NewArticleForm } from '@/components/article/NewArticleForm'

// ── Types ─────────────────────────────────────────────────────────────────────

type ArticleJob = {
  id: string
  status: string
  currentStep: number
  totalCost: number
  totalTokens: number
  createdAt: string
  startedAt: string | null
  topic: { topic: string; mode: string }
  _count: { pipelineSteps: number; errorLogs: number }
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:     { label: 'Pending',        color: 'bg-muted text-muted-foreground' },
  in_progress: { label: 'Running',        color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  completed:   { label: 'Needs Approval', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' },
  approved:    { label: 'Approved',       color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  enriched:    { label: 'Ready to Publish', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  published:   { label: 'Published',        color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200' },
  failed:      { label: 'Failed',         color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
}

const FILTERS = [
  { value: 'all',         label: 'All' },
  { value: 'in_progress', label: 'Running' },
  { value: 'completed',   label: 'Needs Approval' },
  { value: 'approved',    label: 'Approved' },
  { value: 'enriched',    label: 'Ready to Publish' },
  { value: 'published', label: 'Published' },
  { value: 'failed',      label: 'Failed' },
]

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const { label, color } = STATUS_LABELS[status] ?? { label: status, color: 'bg-gray-100 text-gray-700' }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
      {label}
    </span>
  )
}

function ProgressBar({ currentStep }: { currentStep: number }) {
  const pct = Math.min(100, Math.round((currentStep / 12) * 100))
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">Step {currentStep}/12</span>
        <span className="text-xs text-muted-foreground">{pct}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted">
        <div
          className="h-1.5 rounded-full bg-blue-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function WorkflowPage() {
  const router = useRouter()
  const [jobs, setJobs]             = useState<ArticleJob[]>([])
  const [isLoading, setIsLoading]   = useState(true)
  const [filter, setFilter]         = useState<string>('all')
  const [showForm, setShowForm]     = useState(false)

  const fetchJobs = async (activeFilter = filter) => {
    setIsLoading(true)
    try {
      const url =
        activeFilter === 'all'
          ? '/api/articles'
          : `/api/articles?status=${activeFilter}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch articles')
      const data = await res.json()
      setJobs(data.jobs ?? [])
    } catch {
      toast.error('Failed to load article jobs')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs(filter)
  }, [filter]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreated = (jobId: string) => {
    router.push(`/workflow/${jobId}`)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Article Workflow</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Monitor and manage your AI-generated articles
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchJobs()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => setShowForm((v) => !v)}
              variant={showForm ? 'secondary' : 'default'}
            >
              {showForm
                ? <><X className="h-4 w-4 mr-1.5" />Cancel</>
                : <><Plus className="h-4 w-4 mr-1.5" />New Article</>}
            </Button>
          </div>
        </div>

        {/* Inline new-article form */}
        {showForm && (
          <NewArticleForm
            mode="article_only"
            variant="panel"
            onClose={() => setShowForm(false)}
            onCreated={handleCreated}
          />
        )}

        {/* Filter tabs */}
        <div className="flex gap-1 mb-6 border-b border-border overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                filter === f.value
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No article jobs yet</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Click &ldquo;New Article&rdquo; above to generate your first AI article.
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              Create Article
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <Link key={job.id} href={`/workflow/${job.id}`} className="block">
                <div className="bg-card rounded-lg border border-border p-5 hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <StatusBadge status={job.status} />
                        {job._count.errorLogs > 0 && (
                          <span className="inline-flex items-center rounded-full bg-red-100 dark:bg-red-900/40 px-2 py-0.5 text-xs font-medium text-red-600 dark:text-red-300">
                            {job._count.errorLogs} error{job._count.errorLogs !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-card-foreground truncate mt-1">
                        {job.topic.topic}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(job.createdAt).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      {['in_progress', 'pending'].includes(job.status) && (
                        <div className="w-32">
                          <ProgressBar currentStep={job.currentStep} />
                        </div>
                      )}
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
