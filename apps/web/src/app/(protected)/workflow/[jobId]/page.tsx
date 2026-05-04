'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ChevronLeft, Loader2, CheckCircle2, XCircle, Clock,
  AlertTriangle, DollarSign, Zap, FileText, Play, ThumbsUp,
  Image as ImageIcon, Search, Tag, BookOpen, RefreshCw, BarChart3,
  Download, Globe, Package, Eye, ExternalLink, ChevronDown, ChevronUp,
  Share2,
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

type OutputAttempt = {
  id: string
  target: string
  status: 'pending' | 'success' | 'failed'
  resultUrl?: string | null
  errorMessage?: string | null
  startedAt: string
  completedAt?: string | null
  durationMs?: number | null
}

type FeaturedImage = {
  id: string
  url: string
  altText?: string | null
}

type ArticleDiagram = {
  id: string
  position: number
  sectionTitle: string
  caption?: string | null
  pngS3Key?: string | null
  cdnUrl?: string | null
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
  enrichmentError?: string | null
  excerpt?: string | null
  disclaimer?: string | null
  featuredImage?: FeaturedImage | null
  diagrams?: ArticleDiagram[]
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
  pending:     { label: 'Pending',          color: 'text-muted-foreground',                                              bg: 'bg-muted' },
  in_progress: { label: 'Generating…',      color: 'text-blue-700 dark:text-blue-300',   bg: 'bg-blue-50 dark:bg-blue-900/40' },
  completed:   { label: 'Needs Approval',   color: 'text-yellow-700 dark:text-yellow-300', bg: 'bg-yellow-50 dark:bg-yellow-900/40' },
  approved:    { label: 'Adding Diagrams…', color: 'text-purple-700 dark:text-purple-300', bg: 'bg-purple-50 dark:bg-purple-900/40' },
  enriched:    { label: 'Ready to Export',  color: 'text-green-700 dark:text-green-300',  bg: 'bg-green-50 dark:bg-green-900/40' },
  failed:      { label: 'Failed',           color: 'text-red-700 dark:text-red-300',      bg: 'bg-red-50 dark:bg-red-900/40' },
}

// Statuses where the pipeline is actively running (SSE should be open)
const ACTIVE_STATUSES = new Set(['pending', 'in_progress'])
// Enrichment is running when approved (diagrams being generated in background)
const ENRICHMENT_ACTIVE = new Set(['approved'])

// ── Sub-components ────────────────────────────────────────────────────────────

function StepIcon({ status }: { status: StepStatus | 'idle' }) {
  if (status === 'completed') return <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
  if (status === 'failed')    return <XCircle      className="h-5 w-5 text-red-500   flex-shrink-0" />
  if (status === 'running')   return <Loader2      className="h-5 w-5 text-blue-500  animate-spin flex-shrink-0" />
  return <Clock className="h-5 w-5 text-muted-foreground/40 flex-shrink-0" />
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
  const [isReEnriching, setIsReEnriching] = useState(false)
  const [exportingTarget, setExportingTarget] = useState<string | null>(null)
  const [attempts, setAttempts] = useState<OutputAttempt[]>([])
  const [showAttempts, setShowAttempts] = useState(false)

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

  // Start SSE when job is actively running OR in enrichment
  useEffect(() => {
    if (!job) return
    if (ACTIVE_STATUSES.has(job.status) || ENRICHMENT_ACTIVE.has(job.status)) {
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

  const fetchAttempts = useCallback(async () => {
    try {
      const res = await fetch(`/api/articles/${jobId}/output/attempts`)
      if (res.ok) {
        const data = await res.json()
        setAttempts(data.attempts ?? [])
      }
    } catch { /* silent */ }
  }, [jobId])

  useEffect(() => {
    if (job?.status === 'enriched') fetchAttempts()
  }, [job?.status, fetchAttempts])

  const handleExport = async (target: string, config: Record<string, unknown> = {}) => {
    setExportingTarget(target)
    try {
      const res = await fetch(`/api/articles/${jobId}/output/${target}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Export failed')
      toast.success(`${target.charAt(0).toUpperCase() + target.slice(1)} export queued`)
      // Poll attempts every 3s until the attempt completes
      let polls = 0
      const poll = setInterval(async () => {
        await fetchAttempts()
        polls++
        if (polls > 20) clearInterval(poll)
      }, 3000)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setExportingTarget(null)
    }
  }

  const handleReEnrich = async () => {
    setIsReEnriching(true)
    try {
      const res = await fetch(`/api/articles/${jobId}/re-enrich`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to re-enrich')
      }
      toast.success('Re-enrichment started — generating diagrams…')
      setLiveSteps([]); setLiveStatus(null); setLiveStep(null)
      await fetchJob()
      startSSE()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to re-enrich')
    } finally {
      setIsReEnriching(false)
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
  const isEnriching  = displayStatus === 'approved' && !isApproving
  const totalSteps   = 12 + (showApprovalSteps ? APPROVAL_STEPS.length : 0)
  const progressPct  = Math.min(100, Math.round((displayStep / totalSteps) * 100))

  // ── Loading ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }
  if (!job) return null

  const sitePage = job.sitePage

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Back link */}
        <Link
          href="/workflow"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Workflow
        </Link>

        {/* ── Header card ───────────────────────────────────────────────── */}
        <div className="bg-card rounded-xl border border-border p-6 mb-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Article Pipeline
                </span>
              </div>
              <h1 className="text-xl font-bold text-card-foreground mb-2">{job.topic.topic}</h1>
              <StatusBadge status={displayStatus} />
            </div>

            {/* Metrics */}
            <div className="flex gap-6 flex-shrink-0">
              <div className="text-center">
                <div className="flex items-center gap-1 text-muted-foreground justify-center mb-0.5">
                  <DollarSign className="h-3.5 w-3.5" />
                  <span className="text-xs">Cost</span>
                </div>
                <p className="text-lg font-bold text-card-foreground">${displayCost.toFixed(4)}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1 text-muted-foreground justify-center mb-0.5">
                  <Zap className="h-3.5 w-3.5" />
                  <span className="text-xs">Tokens</span>
                </div>
                <p className="text-lg font-bold text-card-foreground">
                  {((job.totalTokens ?? 0) / 1000).toFixed(1)}k
                </p>
              </div>
            </div>
          </div>

          {/* Progress bar (generation or approval in progress) */}
          {(isGenerating || isApproving) && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-muted-foreground">
                  {isApproving
                    ? `Approval step ${displayStep}`
                    : `Step ${displayStep} of 12`}
                </span>
                <span className="text-sm text-muted-foreground">{progressPct}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-3">
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

            {/* Enrichment running indicator */}
            {isEnriching && (
              <Button disabled className="bg-indigo-600 opacity-75">
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                Adding Diagrams…
              </Button>
            )}

            {/* Re-enrich button (enrichment failed or enriched but user wants fresh diagrams) */}
            {(displayStatus === 'enriched' || (displayStatus === 'approved' && !isEnriching)) &&
              job.sitePage?.enrichmentStatus === 'failed' && (
              <Button size="sm" variant="outline" onClick={handleReEnrich} disabled={isReEnriching}>
                {isReEnriching
                  ? <Loader2   className="h-4 w-4 mr-1.5 animate-spin" />
                  : <RefreshCw className="h-4 w-4 mr-1.5" />}
                Retry Diagrams
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
          <div className="bg-card rounded-xl border border-border p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-card-foreground uppercase tracking-wider">
                Featured Image
              </h2>
            </div>
            <div className="relative w-full aspect-square max-w-sm rounded-lg overflow-hidden border border-border">
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
          <div className="bg-card rounded-xl border border-border p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Search className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-card-foreground uppercase tracking-wider">
                Article Metadata
              </h2>
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <dt className="text-xs text-muted-foreground uppercase tracking-wide">SEO Title</dt>
                <dd className="text-sm text-card-foreground mt-0.5 font-medium">
                  {sitePage.seoTitle ?? sitePage.title}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground uppercase tracking-wide">URL Slug</dt>
                <dd className="text-sm text-card-foreground mt-0.5 font-mono bg-muted rounded px-2 py-0.5 inline-block">
                  /{sitePage.slug}
                </dd>
              </div>
              {sitePage.primaryKeyword && (
                <div>
                  <dt className="text-xs text-muted-foreground uppercase tracking-wide">Primary Keyword</dt>
                  <dd className="text-sm text-card-foreground mt-0.5 inline-flex items-center gap-1">
                    <Tag className="h-3 w-3 text-muted-foreground" />
                    {sitePage.primaryKeyword}
                  </dd>
                </div>
              )}
              {sitePage.readingTime && (
                <div>
                  <dt className="text-xs text-muted-foreground uppercase tracking-wide">Reading Time</dt>
                  <dd className="text-sm text-card-foreground mt-0.5 inline-flex items-center gap-1">
                    <BookOpen className="h-3 w-3 text-muted-foreground" />
                    {sitePage.readingTime} min
                  </dd>
                </div>
              )}
              {sitePage.seoDescription && (
                <div className="col-span-2">
                  <dt className="text-xs text-muted-foreground uppercase tracking-wide">Meta Description</dt>
                  <dd className="text-sm text-muted-foreground mt-0.5">{sitePage.seoDescription}</dd>
                </div>
              )}
              {sitePage.excerpt && (
                <div className="col-span-2">
                  <dt className="text-xs text-muted-foreground uppercase tracking-wide">Excerpt</dt>
                  <dd className="text-sm text-muted-foreground mt-0.5 italic">&ldquo;{sitePage.excerpt}&rdquo;</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* ── Enrichment status banner ─────────────────────────────────── */}
        {isEnriching && (
          <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 rounded-xl p-4 mb-6 flex items-center gap-3">
            <Loader2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400 animate-spin flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-indigo-800 dark:text-indigo-200">Generating diagrams…</p>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">
                Claude is creating Mermaid diagrams for each section. This takes 30 s – 2 min.
              </p>
            </div>
          </div>
        )}

        {/* ── Diagrams (visible after enrichment) ──────────────────────── */}
        {sitePage?.diagrams && sitePage.diagrams.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-card-foreground uppercase tracking-wider">
                Diagrams ({sitePage.diagrams.length})
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sitePage.diagrams.map((diagram) => (
                <div key={diagram.id} className="border border-border rounded-lg overflow-hidden">
                  {diagram.cdnUrl && (
                    <div className="relative w-full aspect-video bg-muted">
                      <Image
                        src={diagram.cdnUrl}
                        alt={diagram.sectionTitle}
                        fill
                        className="object-contain p-2"
                        sizes="(max-width: 640px) 100vw, 50vw"
                      />
                    </div>
                  )}
                  <div className="px-3 py-2 bg-muted border-t border-border">
                    <p className="text-xs font-medium text-card-foreground truncate">
                      {diagram.position}. {diagram.sectionTitle}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Export panel (gated to enriched) ─────────────────────────── */}
        <div className="bg-card rounded-xl border border-border p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Download className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-card-foreground uppercase tracking-wider flex-1">
              Export
            </h2>
            <Link href={`/workflow/${jobId}/preview`} target="_blank"
              className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80">
              <Eye className="h-3.5 w-3.5" /> Preview
            </Link>
          </div>

          {displayStatus !== 'enriched' ? (
            <p className="text-sm text-muted-foreground italic">
              🔒 Export buttons unlock once enrichment completes (status: {displayStatus}).
            </p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {/* HTML */}
              <Button
                size="sm" variant="outline"
                onClick={() => handleExport('html')}
                disabled={exportingTarget === 'html'}
              >
                {exportingTarget === 'html'
                  ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  : <Globe className="h-4 w-4 mr-1.5" />}
                Download HTML
              </Button>

              {/* Bundle */}
              <Button
                size="sm" variant="outline"
                onClick={() => handleExport('bundle')}
                disabled={exportingTarget === 'bundle'}
              >
                {exportingTarget === 'bundle'
                  ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  : <Package className="h-4 w-4 mr-1.5" />}
                Download Bundle (.zip)
              </Button>

              {/* WordPress — requires connection */}
              <Link href="/settings/wordpress">
                <Button size="sm" variant="outline">
                  <FileText className="h-4 w-4 mr-1.5" />
                  Publish to WordPress
                </Button>
              </Link>

              {/* Generate Social Posts from article */}
              {sitePage?.excerpt && (
                <Link href={`/dashboard?idea=${encodeURIComponent(sitePage.excerpt)}&articleJobId=${jobId}`}>
                  <Button size="sm" variant="outline" className="border-purple-300 text-purple-600 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-400 dark:hover:bg-purple-900/30">
                    <Share2 className="h-4 w-4 mr-1.5" />
                    Generate Social Posts
                  </Button>
                </Link>
              )}
            </div>
          )}

          {/* Attempt history */}
          {attempts.length > 0 && (
            <div className="mt-4 border-t border-border pt-4">
              <button
                type="button"
                onClick={() => setShowAttempts((v) => !v)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {showAttempts
                  ? <ChevronUp className="h-3.5 w-3.5" />
                  : <ChevronDown className="h-3.5 w-3.5" />}
                Export history ({attempts.length})
              </button>
              {showAttempts && (
                <div className="mt-3 space-y-2">
                  {attempts.map((a) => (
                    <div key={a.id} className="flex items-center gap-3 text-xs rounded-lg bg-muted px-3 py-2">
                      <span className={`font-medium capitalize w-16 ${
                        a.status === 'success' ? 'text-green-600 dark:text-green-400'
                        : a.status === 'failed' ? 'text-red-500 dark:text-red-400'
                        : 'text-yellow-600 dark:text-yellow-400'}`}>
                        {a.status}
                      </span>
                      <span className="text-muted-foreground font-medium w-20 capitalize">{a.target}</span>
                      <span className="text-muted-foreground/70">
                        {new Date(a.startedAt).toLocaleString()}
                      </span>
                      {a.durationMs && (
                        <span className="text-muted-foreground/70">{(a.durationMs / 1000).toFixed(1)}s</span>
                      )}
                      {a.resultUrl && (
                        <a href={a.resultUrl} target="_blank" rel="noopener noreferrer"
                          className="ml-auto text-primary hover:text-primary/80 flex items-center gap-1">
                          Open <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {a.status === 'failed' && a.errorMessage && (
                        <span className="ml-auto text-red-500 dark:text-red-400 truncate max-w-xs">{a.errorMessage}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Pipeline steps ────────────────────────────────────────────── */}
        <div className="bg-card rounded-xl border border-border p-6 mb-6">
          <h2 className="text-sm font-semibold text-card-foreground uppercase tracking-wider mb-4">
            Pipeline Steps
          </h2>
          <div className="space-y-1">
            {phaseASteps.map((step) => (
              <StepRow key={step.stepNumber} step={step} />
            ))}

            {showApprovalSteps && (
              <>
                <div className="flex items-center gap-3 py-2 px-1">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    Approval Chain
                  </span>
                  <div className="h-px flex-1 bg-border" />
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
          <div className="bg-card rounded-xl border border-red-300 dark:border-red-800 p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <h2 className="text-sm font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">
                Errors ({job.errorLogs.length})
              </h2>
            </div>
            <div className="space-y-3">
              {job.errorLogs.map((err) => (
                <div key={err.id} className="rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-red-600 dark:text-red-400 uppercase">{err.errorType}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(err.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-red-700 dark:text-red-300">{err.errorMessage}</p>
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
          ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800'
          : approval
          ? 'hover:bg-purple-50/50 dark:hover:bg-purple-900/20'
          : 'hover:bg-muted/60'
      }`}
    >
      <StepIcon status={step.status as StepStatus | 'idle'} />
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-card-foreground">
          {step.stepNumber}. {STEP_NAMES[step.stepNumber] ?? step.stepName}
        </span>
        {step.status === 'failed' && step.errorMessage && (
          <p className="text-xs text-red-500 dark:text-red-400 mt-0.5 truncate">{step.errorMessage}</p>
        )}
      </div>
      <div className="flex items-center gap-4 flex-shrink-0">
        {step.cost != null && step.cost > 0 && (
          <span className="text-xs text-muted-foreground">${step.cost.toFixed(5)}</span>
        )}
        {step.duration != null && (
          <span className="text-xs text-muted-foreground">{(step.duration / 1000).toFixed(1)}s</span>
        )}
      </div>
    </div>
  )
}
