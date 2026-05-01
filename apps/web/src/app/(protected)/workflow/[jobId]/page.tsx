'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft, Loader2, CheckCircle2, XCircle, Clock, RefreshCw,
  AlertTriangle, DollarSign, Zap, FileText, Play,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

// ── Types ───────────────────────────────────────────────────────────────────

type StepStatus = 'pending' | 'running' | 'completed' | 'failed'

type PipelineStep = {
  stepNumber: number
  stepName: string
  status: StepStatus
  cost?: number | null
  duration?: number | null
  inputTokens?: number | null
  outputTokens?: number | null
  completedAt?: string | null
  errorMessage?: string | null
}

type ErrorLog = {
  id: string
  errorType: string
  errorMessage: string
  createdAt: string
}

type ArticleJob = {
  id: string
  status: string
  currentStep: number
  totalCost: number
  totalTokens: number
  createdAt: string
  startedAt?: string | null
  completedAt?: string | null
  topic: { topic: string; mode: string; slug?: string | null }
  pipelineSteps: PipelineStep[]
  sitePage?: {
    id: string
    title: string
    slug: string
    seoTitle?: string | null
    seoDescription?: string | null
    primaryKeyword?: string | null
    readingTime?: number | null
    enrichmentStatus?: string | null
  } | null
  errorLogs: ErrorLog[]
}

type SSEUpdate = {
  type: 'update' | 'done' | 'error'
  status?: string
  currentStep?: number
  totalCost?: number
  totalTokens?: number
  steps?: PipelineStep[]
  message?: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const STEP_NAMES: Record<number, string> = {
  1: 'Generate Outline',
  2: 'Keyword Research',
  3: 'Find Supporting Keywords',
  4: 'Optimise Outline for SEO',
  5: 'Write Search Intent Intro',
  6: 'Research FAQs',
  7: 'Find FAQ Facts',
  8: 'Find Article Facts',
  9: 'Write Article',
  10: 'Fact-Check Article',
  11: 'Adjust Incorrect Facts',
  12: 'Find Citations',
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'text-gray-500' },
  in_progress: { label: 'Generating…', color: 'text-blue-600' },
  completed: { label: 'Needs Approval', color: 'text-yellow-600' },
  approved: { label: 'Approved', color: 'text-purple-600' },
  enriched: { label: 'Ready to Export', color: 'text-green-600' },
  failed: { label: 'Failed', color: 'text-red-600' },
}

function StepIcon({ status }: { status: StepStatus | 'idle' }) {
  if (status === 'completed') return <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
  if (status === 'failed') return <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
  if (status === 'running') return <Loader2 className="h-5 w-5 text-blue-500 animate-spin flex-shrink-0" />
  return <Clock className="h-5 w-5 text-gray-300 flex-shrink-0" />
}

// ── Component ────────────────────────────────────────────────────────────────

export default function WorkflowJobPage() {
  const { jobId } = useParams<{ jobId: string }>()
  const router = useRouter()
  const [job, setJob] = useState<ArticleJob | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isResuming, setIsResuming] = useState(false)
  const [liveSteps, setLiveSteps] = useState<PipelineStep[]>([])
  const [liveStatus, setLiveStatus] = useState<string | null>(null)
  const [liveStep, setLiveStep] = useState<number | null>(null)
  const [liveCost, setLiveCost] = useState<number | null>(null)
  const sseRef = useRef<EventSource | null>(null)

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetchJob()
  }, [jobId])

  // ── SSE subscription ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!job) return
    const ACTIVE = new Set(['pending', 'in_progress'])
    if (!ACTIVE.has(job.status)) return

    startSSE()
    return () => { sseRef.current?.close() }
  }, [job?.id, job?.status])

  const fetchJob = async () => {
    try {
      const res = await fetch(`/api/articles/${jobId}`)
      if (!res.ok) {
        if (res.status === 404) { router.push('/workflow'); return }
        throw new Error('Failed to load job')
      }
      const data = await res.json()
      setJob(data.job)
    } catch {
      toast.error('Failed to load article job')
    } finally {
      setIsLoading(false)
    }
  }

  const startSSE = () => {
    sseRef.current?.close()
    const es = new EventSource(`/api/articles/${jobId}/events`)
    sseRef.current = es

    es.onmessage = (e) => {
      try {
        const update: SSEUpdate = JSON.parse(e.data)
        if (update.type === 'update') {
          if (update.steps) setLiveSteps(update.steps)
          if (update.status) setLiveStatus(update.status)
          if (update.currentStep !== undefined) setLiveStep(update.currentStep)
          if (update.totalCost !== undefined) setLiveCost(update.totalCost)
        } else if (update.type === 'done') {
          es.close()
          // Reload full job data when pipeline finishes
          fetchJob()
        }
      } catch { /* ignore */ }
    }

    es.onerror = () => { es.close() }
  }

  const handleResume = async () => {
    setIsResuming(true)
    try {
      const res = await fetch(`/api/articles/${jobId}/resume`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to resume')
      toast.success('Pipeline resumed')
      await fetchJob()
    } catch {
      toast.error('Failed to resume pipeline')
    } finally {
      setIsResuming(false)
    }
  }

  // ── Derived display values ────────────────────────────────────────────────
  const displayStatus = liveStatus ?? job?.status ?? 'pending'
  const displayStep = liveStep ?? job?.currentStep ?? 0
  const displayCost = liveCost ?? job?.totalCost ?? 0
  const displaySteps: PipelineStep[] =
    liveSteps.length > 0
      ? liveSteps
      : job?.pipelineSteps ?? []

  const allSteps = Array.from({ length: 12 }, (_, i) => {
    const n = i + 1
    const found = displaySteps.find((s) => s.stepNumber === n)
    return found ?? {
      stepNumber: n,
      stepName: STEP_NAMES[n] ?? `Step ${n}`,
      status: 'pending' as StepStatus,
    }
  })

  const isActive = ['pending', 'in_progress'].includes(displayStatus)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!job) return null

  const { label: statusLabel, color: statusColor } = STATUS_LABELS[displayStatus] ?? {
    label: displayStatus, color: 'text-gray-500',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Back link */}
        <Link href="/workflow" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Workflow
        </Link>

        {/* Header card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-5 w-5 text-gray-400" />
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Article Pipeline</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-1">{job.topic.topic}</h1>
              <p className={`text-sm font-medium ${statusColor}`}>
                {isActive && <Loader2 className="inline h-3.5 w-3.5 animate-spin mr-1" />}
                {statusLabel}
              </p>
            </div>

            {/* Metrics */}
            <div className="flex gap-4 flex-shrink-0">
              <div className="text-center">
                <div className="flex items-center gap-1 text-gray-500 justify-center">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-xs text-gray-500">Cost</span>
                </div>
                <p className="text-lg font-bold text-gray-900">${displayCost.toFixed(4)}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1 text-gray-500 justify-center">
                  <Zap className="h-4 w-4" />
                  <span className="text-xs text-gray-500">Tokens</span>
                </div>
                <p className="text-lg font-bold text-gray-900">
                  {((job.totalTokens ?? 0) / 1000).toFixed(1)}k
                </p>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          {isActive && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-gray-600">
                  Step {displayStep} of 12
                </span>
                <span className="text-sm text-gray-400">
                  {Math.round((displayStep / 12) * 100)}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-100">
                <div
                  className="h-2 rounded-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${Math.min(100, (displayStep / 12) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          {displayStatus === 'failed' && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex gap-3">
              <Button
                size="sm"
                onClick={handleResume}
                disabled={isResuming}
              >
                {isResuming
                  ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  : <Play className="h-4 w-4 mr-1.5" />}
                Resume Pipeline
              </Button>
            </div>
          )}
        </div>

        {/* Steps */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
            Pipeline Steps
          </h2>
          <div className="space-y-2">
            {allSteps.map((step) => (
              <div
                key={step.stepNumber}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
                  step.status === 'running' ? 'bg-blue-50 border border-blue-100' : 'hover:bg-gray-50'
                }`}
              >
                <StepIcon status={step.status as StepStatus | 'idle'} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">
                      {step.stepNumber}. {STEP_NAMES[step.stepNumber] ?? step.stepName}
                    </span>
                  </div>
                  {step.status === 'failed' && step.errorMessage && (
                    <p className="text-xs text-red-500 mt-0.5 truncate">{step.errorMessage}</p>
                  )}
                </div>
                <div className="flex items-center gap-4 flex-shrink-0 text-right">
                  {step.cost != null && step.cost > 0 && (
                    <span className="text-xs text-gray-400">${step.cost.toFixed(5)}</span>
                  )}
                  {step.duration != null && (
                    <span className="text-xs text-gray-400">{(step.duration / 1000).toFixed(1)}s</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SitePage result */}
        {job.sitePage && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
              Generated Article
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              <div>
                <dt className="text-xs text-gray-500">SEO Title</dt>
                <dd className="text-sm text-gray-900 mt-0.5">{job.sitePage.seoTitle ?? job.sitePage.title}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Slug</dt>
                <dd className="text-sm text-gray-900 mt-0.5 font-mono">{job.sitePage.slug}</dd>
              </div>
              {job.sitePage.primaryKeyword && (
                <div>
                  <dt className="text-xs text-gray-500">Primary Keyword</dt>
                  <dd className="text-sm text-gray-900 mt-0.5">{job.sitePage.primaryKeyword}</dd>
                </div>
              )}
              {job.sitePage.readingTime && (
                <div>
                  <dt className="text-xs text-gray-500">Reading Time</dt>
                  <dd className="text-sm text-gray-900 mt-0.5">{job.sitePage.readingTime} min</dd>
                </div>
              )}
              {job.sitePage.seoDescription && (
                <div className="col-span-2">
                  <dt className="text-xs text-gray-500">Meta Description</dt>
                  <dd className="text-sm text-gray-900 mt-0.5">{job.sitePage.seoDescription}</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* Errors */}
        {job.errorLogs.length > 0 && (
          <div className="bg-white rounded-xl border border-red-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <h2 className="text-sm font-semibold text-red-700 uppercase tracking-wider">
                Errors ({job.errorLogs.length})
              </h2>
            </div>
            <div className="space-y-3">
              {job.errorLogs.map((err) => (
                <div key={err.id} className="rounded-lg bg-red-50 border border-red-100 px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-red-600 uppercase">{err.errorType}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(err.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-red-700">{err.errorMessage}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
