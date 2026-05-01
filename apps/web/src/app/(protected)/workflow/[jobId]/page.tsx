'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ChevronLeft, Loader2, CheckCircle2, XCircle, Clock,
  AlertTriangle, DollarSign, Zap, FileText, Play, ThumbsUp,
  Image as ImageIcon, Search, Tag, BookOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

// ── Types ────────────────────────────────────────────────────────────────────

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

type FeaturedImage = {
  id: string
  url: string
  altText?: string | null
}

type SitePage = {
  id: string
  title: string
  slug: string
  seoTitle?: string | null
  seoDescription?: string | null
  primaryKeyword?: string | null
  readingTime?: number | null
  enrichmentStatus?: string | null
  excerpt?: string | null
  disclaimer?: string | null
  featuredImage?: FeaturedImage | null
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
  approvedAt?: string | null
  topic: { topic: string; mode: string; slug?: string | null }
  pipelineSteps: PipelineStep[]
  sitePage?: SitePage | null
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

// ── Constants ────────────────────────────────────────────────────────────────

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
  // Approval chain
  13: 'Generate SEO Metadata',
  15: 'Generate Image Prompt',
  17: 'Generate Excerpt',
  18: 'Generate Legal Disclaimer',
}

const APPROVAL_STEPS = [13, 15, 17, 18]

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending:     { label: 'Pending',          color: 'text-gray-500',   bg: 'bg-gray-100' },
  in_progress: { label: 'Generating…',      color: 'text-blue-700',   bg: 'bg-blue-50' },
  completed:   { label: 'Needs Approval',   color: 'text-yellow-700', bg: 'bg-yellow-50' },
  approved:    { label: 'Approved',         color: 'text-purple-700', bg: 'bg-purple-50' },
  enriched:    { label: 'Ready to Export',  color: 'text-green-700',  bg: 'bg-green-50' },
  failed:      { label: 'Failed',           color: 'text-red-700',    bg: 'bg-red-50' },
}

// Statuses where the pipeline is actively running (either generation or approval)
const ACTIVE_STATUSES = new Set(['pending', 'in_progress'])

// ── Sub-components ────────────────────────────────────────────────────────────

function StepIcon({ status }: { status: StepStatus | 'idle' }) {
  if (status === 'completed') return <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
  if (status === 'failed')    return <XCircle      className="h-5 w-5 text-red-500   flex-shrink-0" />
  if (status === 'running')   return <Loader2      className="h-5 w-5 text-blue-500  animate-spin flex-shrink-0" />
  return <Clock className="h-5 w-5 text-gray-300 flex-shrink-0" />
}

function StatusBadge({ status }: { status: string }) {
  const { label, color, bg } = STATUS_LABELS[status] ?? {
    label: status, color: 'text-gray-500', bg: 'bg-gray-100',
  }
  const isActive = ACTIVE_STATUSES.has(status)
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${color} ${bg}`}>
      {isActive && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {label}
    </span>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function WorkflowJobPage() {
  const { jobId } = useParams<{ jobId: string }>()
  const router = useRouter()

  const [job, setJob] = useState<ArticleJob | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isResuming, setIsResuming] = useState(false)
  const [isApproving, setIsApproving] = useState(false)

  // Live SSE state (overlays DB state while pipeline is running)
  const [liveSteps, setLiveSteps]   = useState<PipelineStep[]>([])
  const [liveStatus, setLiveStatus] = useState<string | null>(null)
  const [liveStep,   setLiveStep]   = useState<number | null>(null)
  const [liveCost,   setLiveCost]   = useState<number | null>(null)

  const sseRef = useRef<EventSource | null>(null)

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchJob = useCallback(async () => {
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
  }, [jobId, router])

  useEffect(() => { fetchJob() }, [fetchJob])

  // ── SSE ────────────────────────────────────────────────────────────────────

  const startSSE = useCallback(() => {
    sseRef.current?.close()
    const es = new EventSource(`/api/articles/${jobId}/events`)
    sseRef.current = es

    es.onmessage = (e) => {
      try {
        const update: SSEUpdate = JSON.parse(e.data)
        if (update.type === 'update') {
          if (update.steps)                         setLiveSteps(update.steps)
          if (update.status)                        setLiveStatus(update.status)
          if (update.currentStep !== undefined)     setLiveStep(update.currentStep)
          if (update.totalCost !== undefined)       setLiveCost(update.totalCost)
        } else if (update.type === 'done') {
          es.close()
          setIsApproving(false)
          fetchJob()
        }
      } catch { /* ignore */ }
    }
    es.onerror = () => { es.close() }
  }, [jobId, fetchJob])

  // Start SSE when job is actively running
  useEffect(() => {
    if (!job) return
    if (ACTIVE_STATUSES.has(job.status)) {
      startSSE()
    }
    return () => { sseRef.current?.close() }
  }, [job?.id, job?.status]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleResume = async () => {
    setIsResuming(true)
    try {
      const res = await fetch(`/api/articles/${jobId}/resume`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to resume')
      toast.success('Pipeline resumed')
      // Clear live state so SSE refreshes cleanly
      setLiveSteps([]); setLiveStatus(null); setLiveStep(null); setLiveCost(null)
      await fetchJob()
    } catch {
      toast.error('Failed to resume pipeline')
    } finally {
      setIsResuming(false)
    }
  }

  const handleApprove = async () => {
    setIsApproving(true)
    // Clear live state so approval steps stream in fresh
    setLiveSteps([]); setLiveStatus(null); setLiveStep(null)
    try {
      const res = await fetch(`/api/articles/${jobId}/approve`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to start approval')
      }
      toast.success('Approval started — generating SEO metadata, image and excerpt…')
      startSSE()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start approval')
      setIsApproving(false)
    }
  }

  // ── Derived values ─────────────────────────────────────────────────────────

  const displayStatus = liveStatus ?? job?.status ?? 'pending'
  const displayStep   = liveStep   ?? job?.currentStep ?? 0
  const displayCost   = liveCost   ?? job?.totalCost   ?? 0

  const displaySteps: PipelineStep[] =
    liveSteps.length > 0 ? liveSteps : (job?.pipelineSteps ?? [])

  // Always show Phase A (1-12)
  const phaseASteps = Array.from({ length: 12 }, (_, i) => {
    const n = i + 1
    return (
      displaySteps.find((s) => s.stepNumber === n) ?? {
        stepNumber: n,
        stepName: STEP_NAMES[n] ?? `Step ${n}`,
        status: 'pending' as StepStatus,
      }
    )
  })

  // Show approval steps when job is completed/approved/enriched, or approval is in progress
  const showApprovalSteps =
    ['completed', 'approved', 'enriched'].includes(displayStatus) || isApproving

  const approvalStepRows = showApprovalSteps
    ? APPROVAL_STEPS.map((n) => {
        return (
          displaySteps.find((s) => s.stepNumber === n) ?? {
            stepNumber: n,
            stepName: STEP_NAMES[n] ?? `Step ${n}`,
            status: 'pending' as StepStatus,
          }
        )
      })
    : []

  const isGenerating = ACTIVE_STATUSES.has(displayStatus)
  const totalSteps   = 12 + (showApprovalSteps ? APPROVAL_STEPS.length : 0)
  const progressPct  = Math.min(100, Math.round((displayStep / totalSteps) * 100))

  // ── Loading ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }
  if (!job) return null

  const sitePage = job.sitePage

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Back link */}
        <Link
          href="/workflow"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Workflow
        </Link>

        {/* ── Header card ───────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-gray-400" />
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Article Pipeline
                </span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">{job.topic.topic}</h1>
              <StatusBadge status={displayStatus} />
            </div>

            {/* Metrics */}
            <div className="flex gap-6 flex-shrink-0">
              <div className="text-center">
                <div className="flex items-center gap-1 text-gray-400 justify-center mb-0.5">
                  <DollarSign className="h-3.5 w-3.5" />
                  <span className="text-xs">Cost</span>
                </div>
                <p className="text-lg font-bold text-gray-900">${displayCost.toFixed(4)}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1 text-gray-400 justify-center mb-0.5">
                  <Zap className="h-3.5 w-3.5" />
                  <span className="text-xs">Tokens</span>
                </div>
                <p className="text-lg font-bold text-gray-900">
                  {((job.totalTokens ?? 0) / 1000).toFixed(1)}k
                </p>
              </div>
            </div>
          </div>

          {/* Progress bar (generation or approval in progress) */}
          {(isGenerating || isApproving) && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-gray-600">
                  {isApproving
                    ? `Approval step ${displayStep}`
                    : `Step ${displayStep} of 12`}
                </span>
                <span className="text-sm text-gray-400">{progressPct}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-100">
                <div
                  className="h-2 rounded-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-3">
            {/* Approve button */}
            {displayStatus === 'completed' && !isApproving && (
              <Button onClick={handleApprove} className="bg-purple-600 hover:bg-purple-700">
                <ThumbsUp className="h-4 w-4 mr-1.5" />
                Approve Article
              </Button>
            )}

            {/* Approving indicator */}
            {isApproving && (
              <Button disabled className="bg-purple-600 opacity-75">
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                Approving…
              </Button>
            )}

            {/* Resume button */}
            {displayStatus === 'failed' && (
              <Button size="sm" variant="outline" onClick={handleResume} disabled={isResuming}>
                {isResuming
                  ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  : <Play    className="h-4 w-4 mr-1.5" />}
                Resume Pipeline
              </Button>
            )}
          </div>
        </div>

        {/* ── Featured image (visible after approval) ────────────────── */}
        {sitePage?.featuredImage?.url && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon className="h-4 w-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                Featured Image
              </h2>
            </div>
            <div className="relative w-full aspect-square max-w-sm rounded-lg overflow-hidden border border-gray-100">
              <Image
                src={sitePage.featuredImage.url}
                alt={sitePage.featuredImage.altText ?? sitePage.title}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 384px"
              />
            </div>
          </div>
        )}

        {/* ── SEO & article metadata (visible once SitePage exists) ─────── */}
        {sitePage && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Search className="h-4 w-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                Article Metadata
              </h2>
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <dt className="text-xs text-gray-400 uppercase tracking-wide">SEO Title</dt>
                <dd className="text-sm text-gray-900 mt-0.5 font-medium">
                  {sitePage.seoTitle ?? sitePage.title}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400 uppercase tracking-wide">URL Slug</dt>
                <dd className="text-sm text-gray-700 mt-0.5 font-mono bg-gray-50 rounded px-2 py-0.5 inline-block">
                  /{sitePage.slug}
                </dd>
              </div>
              {sitePage.primaryKeyword && (
                <div>
                  <dt className="text-xs text-gray-400 uppercase tracking-wide">Primary Keyword</dt>
                  <dd className="text-sm text-gray-900 mt-0.5 inline-flex items-center gap-1">
                    <Tag className="h-3 w-3 text-gray-400" />
                    {sitePage.primaryKeyword}
                  </dd>
                </div>
              )}
              {sitePage.readingTime && (
                <div>
                  <dt className="text-xs text-gray-400 uppercase tracking-wide">Reading Time</dt>
                  <dd className="text-sm text-gray-900 mt-0.5 inline-flex items-center gap-1">
                    <BookOpen className="h-3 w-3 text-gray-400" />
                    {sitePage.readingTime} min
                  </dd>
                </div>
              )}
              {sitePage.seoDescription && (
                <div className="col-span-2">
                  <dt className="text-xs text-gray-400 uppercase tracking-wide">Meta Description</dt>
                  <dd className="text-sm text-gray-700 mt-0.5">{sitePage.seoDescription}</dd>
                </div>
              )}
              {sitePage.excerpt && (
                <div className="col-span-2">
                  <dt className="text-xs text-gray-400 uppercase tracking-wide">Excerpt</dt>
                  <dd className="text-sm text-gray-700 mt-0.5 italic">&ldquo;{sitePage.excerpt}&rdquo;</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* ── Pipeline steps ────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
            Pipeline Steps
          </h2>
          <div className="space-y-1">
            {phaseASteps.map((step) => (
              <StepRow key={step.stepNumber} step={step} />
            ))}

            {showApprovalSteps && (
              <>
                <div className="flex items-center gap-3 py-2 px-1">
                  <div className="h-px flex-1 bg-gray-100" />
                  <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                    Approval Chain
                  </span>
                  <div className="h-px flex-1 bg-gray-100" />
                </div>
                {approvalStepRows.map((step) => (
                  <StepRow key={step.stepNumber} step={step} approval />
                ))}
              </>
            )}
          </div>
        </div>

        {/* ── Error logs ───────────────────────────────────────────────── */}
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

// ── StepRow sub-component ─────────────────────────────────────────────────────

function StepRow({
  step,
  approval = false,
}: {
  step: { stepNumber: number; stepName: string; status: StepStatus; cost?: number | null; duration?: number | null; errorMessage?: string | null }
  approval?: boolean
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
        step.status === 'running'
          ? 'bg-blue-50 border border-blue-100'
          : approval
          ? 'hover:bg-purple-50/50'
          : 'hover:bg-gray-50'
      }`}
    >
      <StepIcon status={step.status as StepStatus | 'idle'} />
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-gray-700">
          {step.stepNumber}. {STEP_NAMES[step.stepNumber] ?? step.stepName}
        </span>
        {step.status === 'failed' && step.errorMessage && (
          <p className="text-xs text-red-500 mt-0.5 truncate">{step.errorMessage}</p>
        )}
      </div>
      <div className="flex items-center gap-4 flex-shrink-0">
        {step.cost != null && step.cost > 0 && (
          <span className="text-xs text-gray-400">${step.cost.toFixed(5)}</span>
        )}
        {step.duration != null && (
          <span className="text-xs text-gray-400">{(step.duration / 1000).toFixed(1)}s</span>
        )}
      </div>
    </div>
  )
}
