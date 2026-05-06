'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ChevronLeft, Loader2, AlertTriangle, FileText, Play, ThumbsUp,
  Image as ImageIcon, Search, Tag, BookOpen, RefreshCw, BarChart3,
  Download, Globe, Package, Eye, ExternalLink, ChevronDown, ChevronUp,
  Share2, ClipboardCopy, ClipboardCheck, PenLine, Code2,
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
  output?: string | null
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
  svgCdnUrl?: string | null
  darkCdnUrl?: string | null
}

type CitationEntry = {
  link_title?: string
  link_url?: string
  title?: string
  url?: string
  sourceTitle?: string  // legacy prompt format (pre-v3 reseed)
  sourceUrl?: string    // legacy prompt format (pre-v3 reseed)
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
  bodyHtml?: string | null
  citations?: unknown
  /** JSON-LD from Step 16 / approval — may be null if generation failed */
  schemaJson?: string | null
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

type BrandSettings = {
  defaultAuthorName?: string | null
  defaultAuthorWebsite?: string | null
  ourExperience?: string | null
}

// ── Constants ────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending:     { label: 'Pending',          color: 'text-muted-foreground',                                                bg: 'bg-muted' },
  in_progress: { label: 'Generating…',      color: 'text-blue-700 dark:text-blue-300',     bg: 'bg-blue-50 dark:bg-blue-900/40' },
  completed:   { label: 'Needs Approval',   color: 'text-yellow-700 dark:text-yellow-300', bg: 'bg-yellow-50 dark:bg-yellow-900/40' },
  approved:    { label: 'Adding Diagrams…', color: 'text-purple-700 dark:text-purple-300', bg: 'bg-purple-50 dark:bg-purple-900/40' },
  enriched:    { label: 'Ready to Publish',  color: 'text-green-700 dark:text-green-300',  bg: 'bg-green-50 dark:bg-green-900/40' },
  published:   { label: 'Published',        color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-900/40' },
  failed:      { label: 'Failed',           color: 'text-red-700 dark:text-red-300',       bg: 'bg-red-50 dark:bg-red-900/40' },
}

// Statuses where the pipeline is actively running (SSE should be open)
const ACTIVE_STATUSES = new Set(['pending', 'in_progress'])
// Enrichment is running when approved (diagrams being generated in background)
const ENRICHMENT_ACTIVE = new Set(['approved'])

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Convert HTML article body to Markdown for LLM-readable review text. */
function htmlToMarkdown(html: string): string {
  return html
    // Headings — strip inner tags to get plain heading text
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_, c) => `\n# ${c.replace(/<[^>]+>/g, '').trim()}\n\n`)
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_, c) => `\n## ${c.replace(/<[^>]+>/g, '').trim()}\n\n`)
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_, c) => `\n### ${c.replace(/<[^>]+>/g, '').trim()}\n\n`)
    .replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, (_, c) => `\n#### ${c.replace(/<[^>]+>/g, '').trim()}\n\n`)
    .replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi, (_, c) => `\n##### ${c.replace(/<[^>]+>/g, '').trim()}\n\n`)
    .replace(/<h6[^>]*>([\s\S]*?)<\/h6>/gi, (_, c) => `\n###### ${c.replace(/<[^>]+>/g, '').trim()}\n\n`)
    // Inline formatting (before tag stripping)
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*')
    // Links
    .replace(/<a[^>]+href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')
    // List items (strip inner tags for clean bullet text)
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, c) => `- ${c.replace(/<[^>]+>/g, '').trim()}\n`)
    // Paragraphs
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<p[^>]*>/gi, '')
    // Block-level containers — just ensure newlines around them
    .replace(/<\/?(?:ul|ol|blockquote|div|section|article|figure)[^>]*>/gi, '\n')
    // Line breaks
    .replace(/<br\s*\/?>/gi, '\n')
    // Strip all remaining tags
    .replace(/<[^>]+>/g, '')
    // HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // Collapse 3+ consecutive newlines to 2
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function parseCitations(raw: unknown): Array<{ title: string; url: string }> {
  if (!raw) return []
  try {
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw
    const links: CitationEntry[] = Array.isArray(data)
      ? data
      : Array.isArray((data as Record<string, unknown>).resource_links)
        ? (data as { resource_links: CitationEntry[] }).resource_links
        : []
    return links
      .filter((c) => c.link_url ?? c.url ?? c.sourceUrl)
      .map((c) => ({
        title: c.link_title ?? c.title ?? c.sourceTitle ?? '',
        url:   c.link_url   ?? c.url   ?? c.sourceUrl   ?? '',
      }))
  } catch {
    return []
  }
}

/**
 * Resolve citations with a two-level fallback:
 *   1. sitePage.citations (populated after approval)
 *   2. step 12 pipeline output (available from the moment step 12 completes)
 * This ensures citations are shown even before the user clicks Approve.
 */
function resolveCitations(
  sp: SitePage,
  pipelineSteps: PipelineStep[],
): Array<{ title: string; url: string }> {
  const fromSitePage = parseCitations(sp.citations)
  if (fromSitePage.length > 0) return fromSitePage
  return parseCitations(
    pipelineSteps.find((s) => s.stepNumber === 12 && s.status === 'completed')?.output,
  )
}

function buildReviewText(
  sp: SitePage,
  pipelineSteps: PipelineStep[],
  brand: BrandSettings,
): string {
  // Resolve article body: sitePage.bodyHtml → step 11 → step 9
  const bodySource =
    sp.bodyHtml?.trim() ||
    pipelineSteps.find((s) => s.stepNumber === 11 && s.status === 'completed')?.output?.trim() ||
    pipelineSteps.find((s) => s.stepNumber === 9  && s.status === 'completed')?.output?.trim() ||
    ''
  const bodyMarkdown = bodySource ? htmlToMarkdown(bodySource) : '[Article body not yet available]'

  const title = sp.seoTitle ?? sp.title ?? ''
  const citations = resolveCitations(sp, pipelineSteps)

  const citationLines = citations.length > 0
    ? citations.map((c) => `- [${c.title}](${c.url})`).join('\n')
    : '[No citations available for this article]'

  return `# Evaluation Request

Does this article comply with and satisfy:

1. Google's "People First" principles
2. Google's E-E-A-T framework
3. Google's Helpful Content guidelines and rules?

---

# ${title}

${bodyMarkdown}

---

## Author

**Name:** ${brand.defaultAuthorName ?? ''}
**Bio:** ${brand.ourExperience ?? ''}
**Website:** ${brand.defaultAuthorWebsite ?? ''}

---

## Citations

${citationLines}`
}

/** Pretty-print JSON-LD for the schema review panel; falls back to raw string if not valid JSON. */
function formatSchemaJsonDisplay(raw: string | null | undefined): string {
  if (!raw?.trim()) return ''
  try {
    return JSON.stringify(JSON.parse(raw), null, 2)
  } catch {
    return raw.trim()
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const { label, color, bg } = STATUS_LABELS[status] ?? {
    label: status, color: 'text-muted-foreground', bg: 'bg-muted',
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
  /** LLM backend for diagram Mermaid generation — re-enrich only */
  const [diagramModel, setDiagramModel] = useState<'claude' | 'gpt-codex'>('claude')
  const [isPublishing, setIsPublishing] = useState(false)
  const [isRewriting, setIsRewriting] = useState(false)
  const [exportingTarget, setExportingTarget] = useState<string | null>(null)
  const [attempts, setAttempts] = useState<OutputAttempt[]>([])
  const [showAttempts, setShowAttempts] = useState(false)

  // Review panel state
  const [showReview, setShowReview] = useState(false)
  const [showSchemaBlock, setShowSchemaBlock] = useState(true)
  const [copied, setCopied] = useState(false)
  const [brandSettings, setBrandSettings] = useState<BrandSettings>({})

  // Live SSE state (overlays DB state while pipeline is running)
  const [liveStatus, setLiveStatus] = useState<string | null>(null)
  const [liveStep,   setLiveStep]   = useState<number | null>(null)

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

  // Fetch brand settings once for the review block
  useEffect(() => {
    fetch('/api/brand-settings')
      .then((r) => r.ok ? r.json() : ({} as BrandSettings))
      .then((d: BrandSettings) => setBrandSettings({
        defaultAuthorName:    d.defaultAuthorName    ?? '',
        defaultAuthorWebsite: d.defaultAuthorWebsite ?? '',
        ourExperience:        d.ourExperience        ?? '',
      }))
      .catch(() => {/* silent */})
  }, [])

  // ── SSE ────────────────────────────────────────────────────────────────────

  const startSSE = useCallback(() => {
    sseRef.current?.close()
    const es = new EventSource(`/api/articles/${jobId}/events`)
    sseRef.current = es

    es.onmessage = (e) => {
      try {
        const update: SSEUpdate = JSON.parse(e.data)
        if (update.type === 'update') {
          if (update.status)                        setLiveStatus(update.status)
          if (update.currentStep !== undefined)     setLiveStep(update.currentStep)
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
      setLiveStatus(null); setLiveStep(null)
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
    if (job?.status === 'enriched' || job?.status === 'published') fetchAttempts()
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
      const res = await fetch(`/api/articles/${jobId}/re-enrich`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diagramModel }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to re-enrich')
      }
      toast.success('Re-enrichment started — generating diagrams…')
      setLiveStatus(null); setLiveStep(null)
      await fetchJob()
      startSSE()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to re-enrich')
    } finally {
      setIsReEnriching(false)
    }
  }

  const handleRewrite = async () => {
    setIsRewriting(true)
    try {
      const res = await fetch(`/api/articles/${jobId}/rewrite`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to start rewrite')
      }
      toast.success('Rewrite started — re-running fact research and writing…')
      setLiveStatus(null); setLiveStep(null)
      await fetchJob()
      startSSE()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to rewrite')
    } finally {
      setIsRewriting(false)
    }
  }

  const handlePublish = async () => {
    setIsPublishing(true)
    try {
      const res = await fetch(`/api/articles/${jobId}/publish`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to publish')
      }
      toast.success('Article published — export options are now available.')
      await fetchJob()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to publish')
    } finally {
      setIsPublishing(false)
    }
  }

  const handleApprove = async () => {
    setIsApproving(true)
    setLiveStatus(null); setLiveStep(null)
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

  const handleCopy = async () => {
    if (!job?.sitePage) return
    const text = buildReviewText(job.sitePage, job.pipelineSteps, brandSettings)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      toast.error('Copy failed — please select and copy manually')
    }
  }

  // ── Derived values ─────────────────────────────────────────────────────────

  const displayStatus = liveStatus ?? job?.status ?? 'pending'
  const displayStep   = liveStep   ?? job?.currentStep ?? 0

  const isGenerating = ACTIVE_STATUSES.has(displayStatus)
  const isEnriching  = displayStatus === 'approved' && !isApproving
  const progressPct  = Math.min(100, Math.round((displayStep / 12) * 100))

  // Review is available once the article body exists (completed or beyond)
  const reviewAvailable = ['completed', 'approved', 'enriched', 'published'].includes(displayStatus)

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
  const hasCitations = sitePage ? resolveCitations(sitePage, job.pipelineSteps).length > 0 : false

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
          <div className="flex items-start gap-4 flex-wrap">
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
          </div>

          {/* Progress bar (generation or approval in progress) */}
          {(isGenerating || isApproving) && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-muted-foreground">
                  {isApproving ? 'Running approval chain…' : `Step ${displayStep} of 12`}
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

          {/* Actions — status-specific pipeline controls (approve moved to Review Content panel) */}
          <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-3">
            {/* Enrichment running indicator */}
            {isEnriching && (
              <Button disabled className="bg-indigo-600 text-white opacity-75">
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                Adding Diagrams…
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

        {/* ── Review Content panel (available once article body exists) ─── */}
        {reviewAvailable && sitePage && (
          <div className="bg-card rounded-xl border border-border mb-6 overflow-hidden">
            {/* Panel header — collapse toggle on left, approve CTA in centre-right, chevron on far right */}
            <div className="flex items-center px-6 py-4 gap-3">
              {/* Collapse toggle (takes up remaining space) */}
              <button
                type="button"
                onClick={() => setShowReview((v) => !v)}
                className="flex-1 flex items-center gap-2 text-left hover:opacity-80 transition-opacity min-w-0"
              >
                <ClipboardCopy className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm font-semibold text-card-foreground">
                  Review Content
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  — copy article + citations for AI quality review
                </span>
              </button>

              {/* Approve / Rewrite — only before approval chain */}
              <div className="flex-shrink-0 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                {displayStatus === 'completed' && !isApproving && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleRewrite}
                      disabled={isRewriting}
                      className="border-orange-400 text-orange-700 hover:bg-orange-50 dark:border-orange-600 dark:text-orange-300 dark:hover:bg-orange-950/50 gap-1.5"
                    >
                      {isRewriting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <PenLine className="h-3.5 w-3.5" />
                      )}
                      Rewrite Article
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleApprove}
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/30 ring-2 ring-purple-400/40 gap-1.5"
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                      Approve Article
                    </Button>
                  </>
                )}
                {isApproving && (
                  <Button
                    size="sm"
                    disabled
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white opacity-80 gap-1.5"
                  >
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Approving…
                  </Button>
                )}
                {(displayStatus === 'approved' || displayStatus === 'enriched' || displayStatus === 'published') && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 dark:bg-green-900/40 px-3 py-1 text-xs font-medium text-green-700 dark:text-green-300">
                    <ThumbsUp className="h-3 w-3" />
                    Approved
                  </span>
                )}
              </div>

              {/* Chevron */}
              <button
                type="button"
                onClick={() => setShowReview((v) => !v)}
                className="flex-shrink-0 hover:opacity-80 transition-opacity"
                aria-label={showReview ? 'Collapse' : 'Expand'}
              >
                {showReview
                  ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>
            </div>

            {showReview && (
              <div className="px-6 pb-6 border-t border-border">
                {/* Instructional banner — shown only when awaiting approval */}
                {displayStatus === 'completed' && (
                  <div className="flex items-start gap-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 px-3 py-2.5 mt-4 mb-3">
                    <ThumbsUp className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-purple-700 dark:text-purple-300">
                      Review the article below, then click <strong>Approve Article</strong> when you&apos;re satisfied — this starts enrichment (SEO metadata, featured image, diagrams).
                    </p>
                  </div>
                )}
                <div className="flex items-center justify-between mt-4 mb-3">
                  <p className="text-xs text-muted-foreground">
                    Paste this into ChatGPT, Claude, or Gemini to evaluate Google compliance.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopy}
                    className="flex-shrink-0 gap-1.5"
                  >
                    {copied
                      ? <><ClipboardCheck className="h-3.5 w-3.5 text-green-500" /> Copied!</>
                      : <><ClipboardCopy className="h-3.5 w-3.5" /> Copy all</>}
                  </Button>
                </div>
                {!hasCitations && (
                  <div className="flex items-start gap-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 px-3 py-2.5 mb-3">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-yellow-700 dark:text-yellow-300">
                      No citations found for this article. Citations are searched in Step 12 — check that the step completed successfully.
                    </p>
                  </div>
                )}
                <textarea
                  readOnly
                  value={buildReviewText(sitePage, job.pipelineSteps, brandSettings)}
                  rows={20}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-xs font-mono text-foreground resize-y focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            )}
          </div>
        )}

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
            <div className="flex items-center gap-2 mb-4 flex-wrap justify-between">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-card-foreground uppercase tracking-wider">
                  Article Metadata
                </h2>
              </div>
              <Link
                href={`/workflow/${jobId}/preview`}
                target="_blank"
                className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80"
              >
                <Eye className="h-3.5 w-3.5" /> Preview article
              </Link>
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
                  {(diagram.svgCdnUrl ?? diagram.cdnUrl) && (
                    <div className="relative w-full aspect-video bg-muted">
                      <Image
                        src={(diagram.svgCdnUrl ?? diagram.cdnUrl) as string}
                        alt={diagram.sectionTitle}
                        fill
                        className="object-contain p-2"
                        sizes="(max-width: 640px) 100vw, 50vw"
                        unoptimized={!!diagram.svgCdnUrl}
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

        {/* ── Schema & publish (after approval — schema from Step 16) ───────── */}
        {sitePage && ['approved', 'enriched', 'published'].includes(displayStatus) && (
          <div className="bg-card rounded-xl border border-border mb-6 overflow-hidden">
            <div className="flex items-center px-6 py-4 gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => setShowSchemaBlock((v) => !v)}
                className="flex-1 flex items-center gap-2 text-left hover:opacity-80 transition-opacity min-w-0"
              >
                <Code2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm font-semibold text-card-foreground">
                  Schema markup
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  — JSON-LD for search engines
                </span>
              </button>
              {displayStatus === 'enriched' && (
                <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
                    <span>Diagram AI</span>
                    <select
                      value={diagramModel}
                      onChange={(e) => setDiagramModel(e.target.value as 'claude' | 'gpt-codex')}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded-md border border-border bg-background px-2 py-1.5 text-xs text-card-foreground min-w-[10rem]"
                    >
                      <option value="claude">Claude Sonnet 4.5</option>
                      <option value="gpt-codex">GPT-5.2 Codex (medium)</option>
                    </select>
                  </label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      void handleReEnrich()
                    }}
                    disabled={isReEnriching}
                    className="gap-1.5"
                  >
                    {isReEnriching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    Rerun Enrichment
                  </Button>
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      void handlePublish()
                    }}
                    disabled={isPublishing}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                  >
                    {isPublishing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : null}
                    Publish
                  </Button>
                </div>
              )}
              <button
                type="button"
                onClick={() => setShowSchemaBlock((v) => !v)}
                className="flex-shrink-0 hover:opacity-80 transition-opacity"
                aria-label={showSchemaBlock ? 'Collapse' : 'Expand'}
              >
                {showSchemaBlock ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>

            {showSchemaBlock && (
              <div className="px-6 pb-6 border-t border-border space-y-4 mt-0 pt-4">
                {sitePage.schemaJson?.trim() ? (
                  <>
                    <pre className="w-full max-h-60 overflow-auto rounded-lg border border-border bg-muted/50 px-3 py-2.5 text-[11px] font-mono text-foreground">
                      {formatSchemaJsonDisplay(sitePage.schemaJson)}
                    </pre>
                    <a
                      href="https://search.google.com/test/rich-results"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80"
                    >
                      Validate with Google Rich Results Test
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </>
                ) : (
                  <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-2.5">
                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 dark:text-amber-200">
                      Schema markup was not saved for this article (Step 16 may have failed). You can still publish
                      and export — fix schema in your CMS if needed.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Export panel (only after Publish) ─────────────────────────── */}
        {displayStatus === 'published' && (
          <div className="bg-card rounded-xl border border-border p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Download className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-card-foreground uppercase tracking-wider flex-1">
                Export
              </h2>
            </div>

            <div className="flex flex-wrap gap-3">
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

              <Link href="/settings/wordpress">
                <Button size="sm" variant="outline">
                  <FileText className="h-4 w-4 mr-1.5" />
                  Publish to WordPress
                </Button>
              </Link>

              {sitePage?.excerpt && (
                <Link href={`/dashboard?idea=${encodeURIComponent(sitePage.excerpt)}&articleJobId=${jobId}`}>
                  <Button size="sm" variant="outline" className="border-purple-300 text-purple-600 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-400 dark:hover:bg-purple-900/30">
                    <Share2 className="h-4 w-4 mr-1.5" />
                    Generate Social Posts
                  </Button>
                </Link>
              )}
            </div>

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
        )}

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
