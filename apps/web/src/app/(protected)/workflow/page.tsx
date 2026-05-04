'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  FileText, Plus, Loader2, RefreshCw, ChevronRight, X, Sparkles, ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

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
  enriched:    { label: 'Ready',          color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  failed:      { label: 'Failed',         color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
}

const FILTERS = [
  { value: 'all',         label: 'All' },
  { value: 'in_progress', label: 'Running' },
  { value: 'completed',   label: 'Needs Approval' },
  { value: 'approved',    label: 'Approved' },
  { value: 'enriched',    label: 'Ready' },
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

interface OutlineFrameworkOption {
  number: number
  label: string
  description: string | null
}

// ── New Article Form ───────────────────────────────────────────────────────────

function NewArticleForm({ onClose, onCreated }: { onClose: () => void; onCreated: (jobId: string) => void }) {
  const [topic, setTopic]                     = useState('')
  const [isSubmitting, setIsSubmitting]       = useState(false)
  const [frameworks, setFrameworks]           = useState<OutlineFrameworkOption[]>([])
  const [frameworksLoading, setFwLoading]     = useState(true)
  // null = Auto-select (LLM will assign)
  const [selectedFramework, setSelectedFw]    = useState<number | null>(null)
  const [showAdvanced, setShowAdvanced]       = useState(false)
  const [specialInstructions, setSpecialInst] = useState('')
  const [realCaseStudies, setRealCaseStudies] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    // Load available frameworks for the dropdown
    fetch('/api/outline-frameworks')
      .then((r) => r.ok ? r.json() : { frameworks: [] })
      .then((data) => setFrameworks(data.frameworks ?? []))
      .catch(() => setFrameworks([]))
      .finally(() => setFwLoading(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = topic.trim()
    if (!trimmed) return

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: trimmed,
          mode: 'article_only',
          outlineFrameworkNumber: selectedFramework ?? null,
          outlineSpecialInstructions: specialInstructions.trim() || null,
          realCaseStudies: realCaseStudies.trim() || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? `Server error ${res.status}`)
      }

      const data = await res.json()
      toast.success('Article pipeline started!')
      onCreated(data.jobId)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create article')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-6 mb-6 animate-in slide-in-from-top-2 duration-200">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-card-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-500" />
            New Article
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Enter a topic and the AI pipeline will generate a full article (steps 1–12, ~10 min).
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Topic */}
        <div>
          <label htmlFor="topic-input" className="block text-sm font-medium text-foreground mb-1.5">
            Topic
          </label>
          <textarea
            id="topic-input"
            ref={inputRef}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. How to reduce churn in SaaS businesses using proactive customer success"
            rows={3}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            disabled={isSubmitting}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Be specific — a detailed topic produces a better article and tighter SEO targeting.
          </p>
        </div>

        {/* Outline Framework */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Outline Framework
          </label>
          <div className="relative">
            <select
              value={selectedFramework ?? ''}
              onChange={(e) => setSelectedFw(e.target.value === '' ? null : parseInt(e.target.value, 10))}
              disabled={isSubmitting || frameworksLoading}
              className="w-full appearance-none rounded-lg border border-input bg-background px-3 py-2 pr-8 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-60"
            >
              <option value="">Auto-select (AI picks the best fit)</option>
              {frameworks.map((f) => (
                <option key={f.number} value={f.number}>
                  {f.number}. {f.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
          {selectedFramework != null && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {frameworks.find((f) => f.number === selectedFramework)?.description}
            </p>
          )}
          {selectedFramework == null && (
            <p className="text-xs text-muted-foreground mt-1">
              GPT-4o-mini will pick the most appropriate framework for your topic.
            </p>
          )}
        </div>

        {/* Advanced options toggle */}
        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ChevronDown className={`h-3 w-3 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            {showAdvanced ? 'Hide' : 'Show'} advanced options
          </button>

          {showAdvanced && (
            <div className="mt-3 space-y-3 rounded-lg border border-border bg-muted/40 p-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Special Instructions
                  <span className="ml-1 font-normal text-muted-foreground">(optional — outline focus areas or custom direction)</span>
                </label>
                <textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInst(e.target.value)}
                  rows={3}
                  placeholder="e.g. Focus on the legal risks for small businesses. Include a section on insurance."
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Real Case Studies / Anecdotes
                  <span className="ml-1 font-normal text-muted-foreground">(optional — woven into the article for credibility)</span>
                </label>
                <textarea
                  value={realCaseStudies}
                  onChange={(e) => setRealCaseStudies(e.target.value)}
                  rows={3}
                  placeholder="e.g. Client A reduced their renewal time from 2 weeks to 3 days after implementing X."
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pt-1">
          <Button
            type="submit"
            disabled={isSubmitting || !topic.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting
              ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />Starting pipeline…</>
              : <><Sparkles className="h-4 w-4 mr-1.5" />Generate Article</>}
          </Button>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
        </div>
      </form>
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
                        {job.totalCost > 0 && (
                          <span className="ml-3 text-muted-foreground/70">
                            ${job.totalCost.toFixed(4)}
                          </span>
                        )}
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
