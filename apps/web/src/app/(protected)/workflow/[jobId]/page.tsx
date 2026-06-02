'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft, Loader2, AlertTriangle, FileText, Play, ThumbsUp,
  Search, Tag, BookOpen, RefreshCw,
  Download, Globe, Package, Eye, ExternalLink, ChevronDown, ChevronUp,
  Share2, ClipboardCopy, ClipboardCheck, PenLine, Code2, Linkedin, BookMarked, CalendarClock,
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

type CitationEntry = {
  link_title?: string
  link_url?: string
  linkTitle?: string
  linkUrl?: string
  title?: string
  url?: string
  href?: string
  link_href?: string
  sourceTitle?: string  // legacy prompt format (pre-v3 reseed)
  sourceUrl?: string    // legacy prompt format (pre-v3 reseed)
}

type ArticleDiagram = {
  id: string
  position: number
  sectionTitle: string
  caption?: string | null
  svgCdnUrl?: string | null
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
  /** Some API payloads use `steps` — normalize in fetchJob into pipelineSteps */
  steps?: PipelineStep[]
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
  defaultAuthorLinkedIn?: string | null
  ourExperience?: string | null
}

type WpConnectionLite = {
  id: string
  label: string
  siteUrl: string
}

// ── Constants ────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending:     { label: 'Pending',          color: 'text-muted-foreground',                                                bg: 'bg-muted' },
  in_progress: { label: 'Generating…',      color: 'text-blue-700 dark:text-blue-300',     bg: 'bg-blue-50 dark:bg-blue-900/40' },
  completed:   { label: 'Needs Approval',   color: 'text-yellow-700 dark:text-yellow-300', bg: 'bg-yellow-50 dark:bg-yellow-900/40' },
  approved:    { label: 'Processing', color: 'text-purple-700 dark:text-purple-300', bg: 'bg-purple-50 dark:bg-purple-900/40' },
  enriched:    { label: 'Ready to Publish',  color: 'text-green-700 dark:text-green-300',  bg: 'bg-green-50 dark:bg-green-900/40' },
  published:   { label: 'Published',        color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-900/40' },
  failed:      { label: 'Failed',           color: 'text-red-700 dark:text-red-300',       bg: 'bg-red-50 dark:bg-red-900/40' },
}

// Statuses where the pipeline is actively running (SSE should be open)
const ACTIVE_STATUSES = new Set(['pending', 'in_progress'])
// Job is in post-approval processing (SSE open while worker runs)
const ENRICHMENT_ACTIVE = new Set(['approved'])

/** Max pipeline step for unified user-facing progress (internal step numbers). */
const TOTAL_PIPELINE_STEPS = 25

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

/**
 * Like htmlToMarkdown but converts <figure class="article-diagram"> blocks
 * into clean markdown image references: ![caption](src).
 * This keeps the review text free of raw SVG XML while still referencing
 * each diagram so evaluators (and Google tools) can follow the link.
 */
function htmlToMarkdownWithDiagrams(html: string): string {
  const tokens: string[] = []
  const withPlaceholders = html.replace(
    /<figure\s[^>]*class="[^"]*article-diagram[^"]*"[^>]*>([\s\S]*?)<\/figure>/gi,
    (_fullMatch, inner: string) => {
      const srcMatch = inner.match(/\bsrc="([^"]+)"/)
      const altMatch = inner.match(/\balt="([^"]*)"/)
      const captionMatch = inner.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i)
      const src = srcMatch?.[1] ?? ''
      // Use the img alt attribute (short visual description) for the Markdown alt text.
      // Fall back to the figcaption text only when no alt attribute is present.
      const altText = altMatch?.[1]?.trim() || captionMatch?.[1]?.replace(/<[^>]+>/g, '').trim() || 'Diagram'
      const captionText = captionMatch?.[1]?.replace(/<[^>]+>/g, '').trim() ?? ''
      // Append the figcaption as an italic line below the image so Google sees both
      // the concise visual alt and the explanatory caption in the review text.
      const captionLine = captionText ? `\n*${captionText}*` : ''
      const replacement = src
        ? `\n\n![${altText}](${src})${captionLine}\n\n`
        : `\n\n*[Diagram: ${altText}]*${captionLine}\n\n`
      const token = `@@DIAGRAM_${tokens.length}@@`
      tokens.push(replacement)
      return token
    },
  )

  // Strip any raw <svg>…</svg> blocks that weren't wrapped in article-diagram figures.
  // These can appear from LLM-generated HTML or entity-decoded markup and would otherwise
  // produce massive XML noise in the review textarea.
  const svgStripped = withPlaceholders.replace(/<svg[\s\S]*?<\/svg>/gi, '')

  let markdown = htmlToMarkdown(svgStripped)

  for (let i = 0; i < tokens.length; i++) {
    markdown = markdown.replace(`@@DIAGRAM_${i}@@`, tokens[i])
  }

  return markdown.replace(/\n{3,}/g, '\n\n').trim()
}

function stripJsonMarkdownFences(text: string): string {
  const t = text.trim()
  const fenced = t.match(/^```(?:json)?\s*([\s\S]*?)```\s*$/i)
  return fenced ? fenced[1].trim() : t
}

interface ParsedCitation {
  title: string
  url: string
  source_type: 'inline' | 'reference'
}

function parseCitationsFlat(raw: unknown): ParsedCitation[] {
  if (!raw) return []
  try {
    let data: unknown =
      typeof raw === 'string' ? JSON.parse(stripJsonMarkdownFences(raw)) : raw
    if (typeof data === 'string') {
      data = JSON.parse(stripJsonMarkdownFences(data))
    }

    const obj = data as Record<string, unknown>

    // Two-tier format: { inline_sources: [...], resource_links: [...] }
    if (obj && !Array.isArray(data) && (Array.isArray(obj.inline_sources) || Array.isArray(obj.resource_links))) {
      const result: ParsedCitation[] = []
      if (Array.isArray(obj.inline_sources)) {
        for (const s of obj.inline_sources as CitationEntry[]) {
          const url = s.link_url ?? s.url ?? ''
          if (url) result.push({ title: s.link_title ?? s.title ?? '', url, source_type: 'inline' })
        }
      }
      if (Array.isArray(obj.resource_links)) {
        for (const s of obj.resource_links as CitationEntry[]) {
          const url = s.link_url ?? s.linkUrl ?? s.url ?? ''
          if (url) result.push({ title: s.link_title ?? s.linkTitle ?? s.title ?? '', url, source_type: 'reference' })
        }
      }
      return result
    }

    // Legacy flat format
    const links: CitationEntry[] = Array.isArray(data)
      ? (data as CitationEntry[])
      : Array.isArray(obj.resource_links)
        ? (obj.resource_links as CitationEntry[])
        : Array.isArray(obj.links)
          ? (obj.links as CitationEntry[])
          : []

    const pickUrl = (c: CitationEntry) =>
      c.link_url ?? c.linkUrl ?? c.url ?? c.sourceUrl ?? c.href ?? c.link_href ?? ''

    return links
      .filter((c) => pickUrl(c).length > 0)
      .map((c) => ({
        title: c.link_title ?? c.linkTitle ?? c.title ?? c.sourceTitle ?? '',
        url: pickUrl(c),
        source_type: 'reference' as const,
      }))
  } catch {
    return []
  }
}

/**
 * Resolve citations with a three-level fallback:
 *   1. sitePage.citations (populated after approval), when SitePage exists
 *   2. step 12 pipeline output (available from the moment step 12 completes)
 *   3. Any other completed step whose output contains resource_links JSON
 */
function resolveCitations(
  sp: SitePage | null | undefined,
  pipelineSteps: PipelineStep[],
): ParsedCitation[] {
  if (sp) {
    const fromSitePage = parseCitationsFlat(sp.citations)
    if (fromSitePage.length > 0) return fromSitePage
  }

  const step12 = pipelineSteps.find(
    (s) => Number(s.stepNumber) === 12 && s.status === 'completed',
  )
  const fromStep12 = parseCitationsFlat(step12?.output)
  if (fromStep12.length > 0) return fromStep12

  // Fallback: scan all completed step outputs for resource_links
  for (const step of pipelineSteps) {
    if (step.status !== 'completed' || !step.output) continue
    const found = parseCitationsFlat(step.output)
    if (found.length > 0) return found
  }

  return []
}

/**
 * Resolve the best available article title from the current pipeline run.
 *
 * Canonical title is Step 0 (`generate_title`); SEO title may shorten it for SERPs.
 * Review panels use this string so pasted copies match the article headline intent.
 *
 * Fallback: SitePage seoTitle/title then topic-derived values.
 */
function resolveBestTitle(
  sp: SitePage,
  pipelineSteps: PipelineStep[],
  _isApproving: boolean,
): string {
  const step0Output = pipelineSteps.find((s) => s.stepNumber === 0 && s.status === 'completed')?.output?.trim()

  if (step0Output) return step0Output

  return sp.seoTitle ?? sp.title ?? ''
}

function buildReviewText(
  sp: SitePage,
  pipelineSteps: PipelineStep[],
  brand: BrandSettings,
  isApproving: boolean,
): string {
  // Resolve article body: sitePage.bodyHtml → step 11 → step 9
  const bodySource =
    sp.bodyHtml?.trim() ||
    pipelineSteps.find((s) => s.stepNumber === 11 && s.status === 'completed')?.output?.trim() ||
    pipelineSteps.find((s) => s.stepNumber === 9  && s.status === 'completed')?.output?.trim() ||
    ''
  const bodyMarkdown = bodySource ? htmlToMarkdown(bodySource) : '[Article body not yet available]'

  const title = resolveBestTitle(sp, pipelineSteps, isApproving)
  const citations = resolveCitations(sp, pipelineSteps)

  // Only show Tier 2 (Step 12 curated references) in the review text.
  // Tier 1 inline sources are already visible as <a> links in the body — listing them
  // separately as a bibliography block risks a spam penalty for unfiltered link stuffing.
  const tier2 = citations.filter((c) => c.source_type === 'reference')
  const displayCitations = tier2.length > 0 ? tier2 : citations
  const citationLines = displayCitations.length > 0
    ? displayCitations.map((c) => `- [${c.title}](${c.url})`).join('\n')
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
**LinkedIn:** ${brand.defaultAuthorLinkedIn?.trim() ?? ''}

---

## Citations

${citationLines}`
}

/**
 * Like buildReviewText but converts diagram <figure> blocks into clean
 * markdown image references: ![caption](cdn-url). Keeps the review text free
 * of raw SVG XML for Google evaluation tools.
 */
function buildFinalReviewText(
  sp: SitePage,
  pipelineSteps: PipelineStep[],
  brand: BrandSettings,
  isApproving: boolean,
): string {
  const bodySource =
    sp.bodyHtml?.trim() ||
    pipelineSteps.find((s) => s.stepNumber === 11 && s.status === 'completed')?.output?.trim() ||
    pipelineSteps.find((s) => s.stepNumber === 9  && s.status === 'completed')?.output?.trim() ||
    ''

  const bodyMarkdown = bodySource
    ? htmlToMarkdownWithDiagrams(bodySource)
    : '[Article body not yet available]'

  const title = resolveBestTitle(sp, pipelineSteps, isApproving)
  const citations = resolveCitations(sp, pipelineSteps)

  // Only show Tier 2 (Step 12 curated references) in the review text.
  // Tier 1 inline sources are already visible as <a> links in the body.
  const tier2 = citations.filter((c) => c.source_type === 'reference')
  const displayCitations = tier2.length > 0 ? tier2 : citations
  const citationLines = displayCitations.length > 0
    ? displayCitations.map((c) => `- [${c.title}](${c.url})`).join('\n')
    : '[No citations available for this article]'

  const citationsBlock = `## Citations\n\n${citationLines}`

  const disclaimerSection = sp.disclaimer?.trim()
    ? `\n---\n\n## Article Disclaimer\n\n${sp.disclaimer.trim()}`
    : ''

  const schemaSection = sp.schemaJson?.trim()
    ? `\n---\n\n## Schema Markup\n\n\`\`\`json\n${sp.schemaJson.trim()}\n\`\`\``
    : ''

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
**LinkedIn:** ${brand.defaultAuthorLinkedIn?.trim() ?? ''}

---

${citationsBlock}${disclaimerSection}${schemaSection}`
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

function StatusBadge({ status, busy }: { status: string; busy?: boolean }) {
  const { label, color, bg } = STATUS_LABELS[status] ?? {
    label: status, color: 'text-muted-foreground', bg: 'bg-muted',
  }
  const isActive = busy === true ? true : ACTIVE_STATUSES.has(status)
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
  const [isPublishing, setIsPublishing] = useState(false)
  const [showPublishConfirm, setShowPublishConfirm] = useState(false)
  const [isRewriting, setIsRewriting] = useState(false)
  const [exportingTarget, setExportingTarget] = useState<string | null>(null)
  const [attempts, setAttempts] = useState<OutputAttempt[]>([])
  const [showAttempts, setShowAttempts] = useState(false)

  // Review panel: default expanded while awaiting approval (completed), collapsed after approve.
  const [reviewPanelExpandedOverride, setReviewPanelExpandedOverride] = useState<boolean | undefined>(undefined)

  const prevDisplayStatusForReviewRef = useRef<string | null>(null)
  const [showSchemaBlock, setShowSchemaBlock] = useState(true)
  const [copiedSchema, setCopiedSchema] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copiedFinal, setCopiedFinal] = useState(false)
  const [showFinalArticleReview, setShowFinalArticleReview] = useState(true)
  const [brandSettings, setBrandSettings] = useState<BrandSettings>({})
  const [wpConnections, setWpConnections] = useState<WpConnectionLite[]>([])

  type SyndicationArticle = { platform: string; title: string; content: string; status: string; errorMessage?: string | null }
  const [syndicationArticles, setSyndicationArticles] = useState<SyndicationArticle[]>([])
  const [syndicationLoading, setSyndicationLoading] = useState(false)
  const [syndicationGenerated, setSyndicationGenerated] = useState(false)
  const [syndicationPending, setSyndicationPending] = useState(false)
  const [activeSyndicationTab, setActiveSyndicationTab] = useState<'linkedin' | 'medium'>('linkedin')
  const [copiedSyndication, setCopiedSyndication] = useState<string | null>(null)

  type SocialAutomationRunRow = {
    id: string
    status: string
    scheduledDate: string
    totalSpecs: number
    completedSpecs: number
    failedSpecs: number
    currentSpec: string | null
    error: string | null
    createdAt: string
    _count?: { posts: number }
    specResults?: Array<{
      slotKey: string
      status: string
      error: string | null
      postsCreated: number
    }>
  }
  const [socialRuns, setSocialRuns] = useState<SocialAutomationRunRow[]>([])
  const [isGeneratingSocial, setIsGeneratingSocial] = useState(false)
  const [retryingSpec, setRetryingSpec] = useState<string | null>(null)

  useEffect(() => {
    void fetch('/api/wp/connections')
      .then((r) => r.json())
      .then((d) => setWpConnections((d.connections ?? []) as WpConnectionLite[]))
      .catch(() => setWpConnections([]))
  }, [])

  const fetchSyndicationStatus = useCallback(async () => {
    if (!jobId) return
    try {
      const r = await fetch(`/api/articles/${jobId}/syndication`)
      if (!r.ok) return
      const d = await r.json()
      const arts: SyndicationArticle[] = d.articles ?? []
      setSyndicationArticles(arts)
      const hasCompleted = arts.some((a) => a.status === 'completed')
      const hasPending = arts.some((a) => a.status === 'pending' || a.status === 'processing')
      setSyndicationGenerated(hasCompleted)
      setSyndicationPending(hasPending && !arts.every((a) => a.status === 'completed'))
    } catch { /* silent */ }
  }, [jobId])

  // Pre-load any previously generated syndication articles
  useEffect(() => {
    void fetchSyndicationStatus()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId])

  // Poll every 5s while syndication is pending/processing
  useEffect(() => {
    if (!syndicationPending) return
    const id = setInterval(() => void fetchSyndicationStatus(), 5000)
    return () => clearInterval(id)
  }, [syndicationPending, fetchSyndicationStatus])

  useEffect(() => {
    setReviewPanelExpandedOverride(undefined)
    prevDisplayStatusForReviewRef.current = null
  }, [jobId])

  // Collapse the review panel when job transitions from completed → approved/enriched/published
  useEffect(() => {
    const status = job?.status ?? 'pending'
    const prev = prevDisplayStatusForReviewRef.current
    prevDisplayStatusForReviewRef.current = status
    if (prev === 'completed' && ['approved', 'enriched', 'published'].includes(status)) {
      setReviewPanelExpandedOverride(undefined)
    }
  }, [job?.status])

  // Safety net: clear isApproving when job reaches a definitively post-approval
  // state without the SSE 'done' event firing. This handles the race where
  // fetchJob returns 'enriched'/'published' and triggers the useEffect cleanup
  // that closes the SSE connection before it can send its 'done' event.
  useEffect(() => {
    if (!isApproving) return
    if (job?.status && new Set(['enriched', 'published', 'exported', 'failed']).has(job.status)) {
      setIsApproving(false)
    }
  }, [job?.status, isApproving])

  const sseRef             = useRef<EventSource | null>(null)
  const reconnectTimerRef  = useRef<number | null>(null)
  // Stable ref mirrors job state so onerror callbacks can read status without
  // causing stale-closure or side-effect-in-state-updater issues.
  const jobRef             = useRef<ArticleJob | null>(null)
  useEffect(() => { jobRef.current = job ?? null }, [job])

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchJob = useCallback(async () => {
    try {
      const res = await fetch(`/api/articles/${jobId}`)
      if (!res.ok) {
        if (res.status === 404) { router.push('/workflow'); return }
        // Silently swallow transient auth failures when we already have job data.
        // The Clerk token renews automatically; toasting on every 3-second poll
        // cycle would spam the user and can cause a visible page disruption.
        if (res.status === 401 || res.status === 403) {
          if (jobRef.current) return
          toast.error('Session expired — please refresh the page')
          return
        }
        throw new Error('Failed to load job')
      }
      const data = await res.json()
      const j = data.job as ArticleJob
      setJob({
        ...j,
        pipelineSteps: j.pipelineSteps ?? j.steps ?? [],
      })
    } catch {
      // Only show the error toast on the initial load (no job data yet).
      if (!jobRef.current) toast.error('Failed to load article job')
    } finally {
      setIsLoading(false)
    }
  }, [jobId, router])

  useEffect(() => { fetchJob() }, [fetchJob])

  // When Phase A finishes (status → 'completed'), the SSE appends the final
  // steps (including step 12) without their `output` field, then both SSE and
  // the 3-second fetchJob poll stop immediately. This leaves step 12 output-
  // less in React state, so citations never render until the user reloads.
  // Fix: do a fresh fetchJob() the moment status becomes 'completed' so the
  // Review Content panel always has full step data, including citations.
  const prevStatusForCitationsRef = useRef<string | undefined>(undefined)
  useEffect(() => {
    const prev = prevStatusForCitationsRef.current
    prevStatusForCitationsRef.current = job?.status
    if (prev === 'in_progress' && job?.status === 'completed') {
      fetchJob()
    }
  }, [job?.status, fetchJob])

  // Fetch brand settings once for the review block
  useEffect(() => {
    fetch('/api/brand-settings')
      .then((r) => r.ok ? r.json() : ({} as BrandSettings))
      .then((d: BrandSettings) => setBrandSettings({
        defaultAuthorName:    d.defaultAuthorName    ?? '',
        defaultAuthorWebsite: d.defaultAuthorWebsite ?? '',
        defaultAuthorLinkedIn: d.defaultAuthorLinkedIn ?? '',
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
          setJob((prev) => {
            if (!prev) return prev

            // Merge incoming steps: SSE omits `output` to keep payloads small,
            // so we preserve the existing output field from fetchJob() data.
            // This prevents the "No citations" bug caused by replacing the whole
            // pipelineSteps array with output-less objects.
            let mergedSteps = prev.pipelineSteps
            if (update.steps && update.steps.length > 0) {
              const freshMap = new Map(update.steps.map((s) => [s.stepNumber, s]))
              mergedSteps = prev.pipelineSteps.map((existing) => {
                const fresh = freshMap.get(existing.stepNumber)
                // Spread fresh fields (status, completedAt, etc.) but restore output
                return fresh ? { ...existing, ...fresh, output: existing.output } : existing
              })
              // Append any steps that don't yet exist in local state
              for (const s of update.steps) {
                if (!mergedSteps.find((e) => e.stepNumber === s.stepNumber)) {
                  mergedSteps = [...mergedSteps, s]
                }
              }
            }

            return {
              ...prev,
              ...(update.status     !== undefined ? { status:      update.status }      : {}),
              ...(update.currentStep !== undefined ? { currentStep: update.currentStep } : {}),
              pipelineSteps: mergedSteps,
            }
          })
        } else if (update.type === 'done') {
          es.close()
          setIsApproving(false)
          fetchJob()
        }
      } catch { /* ignore */ }
    }

    // On connection error, close this instance and schedule a reconnect.
    // We use jobRef (a plain ref) rather than a state-updater to read the
    // current job status — avoids the React anti-pattern of side effects
    // inside state updater functions.
    es.onerror = () => {
      es.close()
      reconnectTimerRef.current = window.setTimeout(() => {
        const j = jobRef.current
        if (j && (ACTIVE_STATUSES.has(j.status) || ENRICHMENT_ACTIVE.has(j.status))) {
          startSSE()
        }
      }, 3000)
    }
  }, [jobId, fetchJob])

  // Start SSE when job is actively running OR in enrichment
  useEffect(() => {
    if (!job) return
    if (ACTIVE_STATUSES.has(job.status) || ENRICHMENT_ACTIVE.has(job.status)) {
      startSSE()
    }
    return () => {
      if (reconnectTimerRef.current !== null) {
        clearTimeout(reconnectTimerRef.current)
        reconnectTimerRef.current = null
      }
      sseRef.current?.close()
    }
  }, [job?.id, job?.status]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fallback poll every 3 s while Phase A is running. SSE is the primary real-time
  // channel; this poll ensures the UI recovers quickly if SSE is temporarily down.
  useEffect(() => {
    const status = job?.status
    if (!status || !ACTIVE_STATUSES.has(status)) return
    const id = setInterval(fetchJob, 3000)
    return () => clearInterval(id)
  }, [job?.status, fetchJob])

  // Fallback poll during Phase B (approval chain). The job status stays 'completed'
  // throughout Phase B so the Phase A poll above won't run, but we still need
  // currentStep updates to drive the approval stepper.
  useEffect(() => {
    if (!isApproving) return
    const id = setInterval(fetchJob, 3000)
    return () => clearInterval(id)
  }, [isApproving, fetchJob])

  // Fallback poll during Phase C (enrichment queued or running). Job status
  // stays 'approved' while the worker updates currentStep 19–23.
  useEffect(() => {
    const enr = job?.sitePage?.enrichmentStatus
    if (job?.status !== 'approved' || !enr || (enr !== 'pending' && enr !== 'in_progress')) return
    const id = setInterval(fetchJob, 3000)
    return () => clearInterval(id)
  }, [job?.status, job?.sitePage?.enrichmentStatus, fetchJob])

  // ── Actions ────────────────────────────────────────────────────────────────

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

  const fetchSocialRuns = useCallback(async () => {
    try {
      const res = await fetch(`/api/articles/${jobId}/social-automation`)
      if (res.ok) {
        const data = await res.json()
        setSocialRuns(data.runs ?? [])
      }
    } catch { /* silent */ }
  }, [jobId])

  useEffect(() => {
    if (job?.status === 'enriched' || job?.status === 'published') fetchSocialRuns()
  }, [job?.status, fetchSocialRuns])

  useEffect(() => {
    const active = socialRuns.some((r) => r.status === 'pending' || r.status === 'processing')
    if (!active) return
    const id = setInterval(fetchSocialRuns, 5000)
    return () => clearInterval(id)
  }, [socialRuns, fetchSocialRuns])

  const handleGenerateSocialSet = async () => {
    setIsGeneratingSocial(true)
    try {
      const res = await fetch(`/api/articles/${jobId}/generate-social-set`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to start social automation')
      toast.success(data.message ?? (data.enqueued ? 'Generating 12-post social set…' : 'Social set already queued'))
      await fetchSocialRuns()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate social set')
    } finally {
      setIsGeneratingSocial(false)
    }
  }

  const handleRetrySpec = async (runId: string, slotKey: string) => {
    setRetryingSpec(`${runId}-${slotKey}`)
    try {
      const res = await fetch(`/api/social-automation/${runId}/retry/${slotKey}`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Retry failed')
      toast.success(`Retried ${slotKey}`)
      await fetchSocialRuns()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Retry failed')
    } finally {
      setRetryingSpec(null)
    }
  }

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
      const res = await fetch(`/api/articles/${jobId}/re-enrich`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to re-enrich')
      }
      toast.success('Processing started…')
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
      toast.success('Rewrite started…')
      await fetchJob()
      startSSE()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to rewrite')
    } finally {
      setIsRewriting(false)
    }
  }

  const handlePublish = async (
    autoExportTarget?: string,
    exportConfig?: Record<string, unknown>,
  ) => {
    setIsPublishing(true)
    try {
      const res = await fetch(`/api/articles/${jobId}/publish`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to publish')
      }
      toast.success('Article published! Generating LinkedIn, Medium & social posts in the background…')
      await fetchJob()
      void fetchSyndicationStatus()
      if (autoExportTarget) {
        // Re-fetch WP connections at publish time so we always use the current
        // connectionId, not the one cached at page load (which may be stale if
        // the user changed their WordPress connection while the page was open).
        let freshConfig = exportConfig ?? {}
        if (autoExportTarget === 'wordpress') {
          const connsRes = await fetch('/api/wp/connections').catch(() => null)
          const connsData = connsRes?.ok ? await connsRes.json().catch(() => ({})) : {}
          const freshConnections: WpConnectionLite[] = connsData.connections ?? []
          setWpConnections(freshConnections)
          const freshConnectionId = freshConnections[0]?.id
          if (!freshConnectionId) {
            throw new Error('No WordPress connection found. Please add one in Settings.')
          }
          freshConfig = { ...freshConfig, connectionId: freshConnectionId }
        }
        await handleExport(autoExportTarget, freshConfig)
      }
      await fetchAttempts()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to publish')
    } finally {
      setIsPublishing(false)
    }
  }

  const handleCopySubstack = async () => {
    if (!job?.sitePage) return
    const sp = job.sitePage
    const bodySource = sp.bodyHtml ?? ''
    const md = htmlToMarkdownWithDiagrams(bodySource)
    const title = sp.seoTitle ?? sp.title ?? ''

    // Featured image as a markdown image at the top
    const featuredImageMd = sp.featuredImage?.url
      ? `![${sp.featuredImage.altText ?? title}](${sp.featuredImage.url})\n\n`
      : ''

    // Tier 2 citations appended as a References section
    const rawCitations = sp.citations as Record<string, unknown> | Array<Record<string, string>> | null
    const referenceCitations: Array<{ title: string; url: string }> = []
    if (rawCitations && !Array.isArray(rawCitations)) {
      const obj = rawCitations as Record<string, unknown>
      if (Array.isArray(obj.resource_links)) {
        for (const s of obj.resource_links as Array<Record<string, string>>) {
          if (s.link_url) referenceCitations.push({ title: s.link_title || s.link_url, url: s.link_url })
        }
      }
    } else if (Array.isArray(rawCitations)) {
      for (const s of rawCitations) {
        if (s.link_url) referenceCitations.push({ title: s.link_title || s.link_url, url: s.link_url })
      }
    }
    const citationsMd =
      referenceCitations.length > 0
        ? `\n\n## References\n\n${referenceCitations.map((c, i) => `${i + 1}. [${c.title}](${c.url})`).join('\n')}`
        : ''

    const text = `# ${title}\n\n${featuredImageMd}${md}${citationsMd}`
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Article copied as Markdown — paste into Substack editor')
    } catch {
      toast.error('Copy failed — please select and copy manually')
    }
  }

  const handleGenerateSyndication = async () => {
    setSyndicationLoading(true)
    try {
      const res = await fetch(`/api/articles/${jobId}/syndication`, { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Generation failed')
      toast.success('Platform articles queued — generating in background…')
      await fetchSyndicationStatus()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to queue platform articles')
    } finally {
      setSyndicationLoading(false)
    }
  }

  const handleCopySyndication = async (content: string, platform: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedSyndication(platform)
      setTimeout(() => setCopiedSyndication(null), 2500)
    } catch {
      toast.error('Copy failed — please select and copy manually')
    }
  }

  const handleApprove = async () => {
    setIsApproving(true)
    try {
      const res = await fetch(`/api/articles/${jobId}/approve`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to start approval')
      }
      toast.success('Processing started…')
      startSSE()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start approval')
      setIsApproving(false)
    }
  }

  const handleCopySchema = async () => {
    const schema = formatSchemaJsonDisplay(job?.sitePage?.schemaJson)
    if (!schema) return
    try {
      await navigator.clipboard.writeText(schema)
      setCopiedSchema(true)
      setTimeout(() => setCopiedSchema(false), 2500)
    } catch {
      toast.error('Copy failed — please select and copy manually')
    }
  }

  const handleCopy = async () => {
    if (!job?.sitePage) return
    const text = buildReviewText(job.sitePage, job.pipelineSteps, brandSettings, isApproving)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      toast.error('Copy failed — please select and copy manually')
    }
  }

  const handleCopyFinal = async () => {
    if (!job?.sitePage) return
    const text = buildFinalReviewText(job.sitePage, job.pipelineSteps, brandSettings, isApproving)
    try {
      await navigator.clipboard.writeText(text)
      setCopiedFinal(true)
      setTimeout(() => setCopiedFinal(false), 2500)
    } catch {
      toast.error('Copy failed — please select and copy manually')
    }
  }

  // ── Derived values ─────────────────────────────────────────────────────────

  const displayStatus = job?.status ?? 'pending'
  const displayStep   = job?.currentStep ?? 0

  const isGenerating = ACTIVE_STATUSES.has(displayStatus)
  const isEnriching  = displayStatus === 'approved' && !isApproving
  const progressPct = Math.min(
    100,
    Math.round((Math.min(displayStep, TOTAL_PIPELINE_STEPS) / TOTAL_PIPELINE_STEPS) * 100),
  )

  // Review is available once the article body exists (completed or beyond)
  const reviewAvailable = ['completed', 'approved', 'enriched', 'published'].includes(displayStatus)

  const defaultReviewPanelExpanded = displayStatus === 'completed'
  const reviewPanelExpanded = reviewPanelExpandedOverride ?? defaultReviewPanelExpanded
  const toggleReviewPanel = () =>
    setReviewPanelExpandedOverride((prev) => !(prev ?? defaultReviewPanelExpanded))

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }
  if (!job) return null

  const sitePage = job.sitePage
  const enrichmentPhaseRunning =
    displayStatus === 'approved'
    && !!sitePage
    && ['pending', 'in_progress'].includes(sitePage.enrichmentStatus ?? '')
  const showProgressBar =
    isGenerating
    || isApproving
    || enrichmentPhaseRunning
    || (displayStep >= 13 && displayStep < TOTAL_PIPELINE_STEPS)
  /** Phase B persists DB status `completed` — badge should match Processing like post-approve. */
  const phaseBApprovalRunning =
    displayStatus === 'completed' && (isApproving || displayStep >= 13)
  const statusForBadge      = phaseBApprovalRunning ? 'approved' : displayStatus
  const hasCitations = resolveCitations(sitePage, job.pipelineSteps).length > 0
  const hasWpConnection = wpConnections.length > 0
  const primaryWpConnectionId = wpConnections[0]?.id

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
              <StatusBadge status={statusForBadge} busy={phaseBApprovalRunning} />
            </div>
          </div>

          {/* Progress bar — unified (internal steps mapped to generic 1–25) */}
          {showProgressBar && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-muted-foreground">{`Step ${Math.min(displayStep, TOTAL_PIPELINE_STEPS)} of ${TOTAL_PIPELINE_STEPS}`}</span>
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
                Processing
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
            <div className="flex flex-wrap items-center px-6 py-4 gap-3 gap-y-3">
              {/* Collapse toggle (takes up remaining space) */}
              <button
                type="button"
                onClick={toggleReviewPanel}
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
                      onClick={handleApprove}
                      className="shrink-0 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                    >
                      <ThumbsUp className="h-4 w-4 shrink-0" />
                      Approve Article
                    </Button>
                  </>
                )}
                {isApproving && (
                  <Button
                    disabled
                    className="shrink-0 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Loader2 className="h-4 w-4 animate-spin shrink-0" />
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
                onClick={toggleReviewPanel}
                className="flex-shrink-0 hover:opacity-80 transition-opacity"
                aria-label={reviewPanelExpanded ? 'Collapse' : 'Expand'}
              >
                {reviewPanelExpanded
                  ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>
            </div>

            {reviewPanelExpanded && (
              <div className="px-6 pb-6 border-t border-border">
                {/* Instructional banner — shown only when awaiting approval */}
                {displayStatus === 'completed' && (
                  <div className="flex items-start gap-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 px-3 py-2.5 mt-4 mb-3">
                    <ThumbsUp className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-purple-700 dark:text-purple-300">
                      Review the article below, then click <strong>Approve Article</strong> when you&apos;re satisfied — this starts final processing.
                    </p>
                  </div>
                )}
                <div className="flex items-center justify-between mt-4 mb-3 flex-wrap gap-2">
                  <p className="text-xs text-muted-foreground">
                    Paste article into{' '}
                    <a
                      href="https://gemini.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-medium"
                    >
                      Gemini
                    </a>{' '}
                    to evaluate content quality.
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
                      No citations found for this article yet. Citations may not be available until processing finishes. If this persists, try re-running the article.
                    </p>
                  </div>
                )}
                <textarea
                  readOnly
                  value={buildReviewText(sitePage, job.pipelineSteps, brandSettings, isApproving)}
                  rows={20}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-xs font-mono text-foreground resize-y focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            )}
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
                  {resolveBestTitle(sitePage, job.pipelineSteps, isApproving)}
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

        {/* ── Schema & publish (after approval) ───────── */}
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
              <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                {sitePage?.schemaJson?.trim() && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => { e.stopPropagation(); void handleCopySchema() }}
                    className="gap-1.5"
                  >
                    {copiedSchema
                      ? <><ClipboardCheck className="h-3.5 w-3.5 text-green-500" /> Copied!</>
                      : <><ClipboardCopy className="h-3.5 w-3.5" /> Copy JSON-LD</>}
                  </Button>
                )}
                {displayStatus === 'enriched' && (
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
                    Rerun processing
                  </Button>
                )}
              </div>
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
              <div className="px-6 border-t border-border space-y-4 mt-0 pt-4 pb-0">
                {sitePage.schemaJson?.trim() ? (
                  <>
                    <pre className="w-full max-h-60 overflow-auto rounded-lg border border-border bg-muted/50 px-3 py-2.5 text-[11px] font-mono text-foreground">
                      {formatSchemaJsonDisplay(sitePage.schemaJson)}
                    </pre>
                    <div className="pb-6">
                      <Button variant="default" size="default" className="w-full sm:w-auto shadow-sm" asChild>
                        <a
                          href="https://search.google.com/test/rich-results"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Validate with Google Rich Results Test
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="pb-6">
                    <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-2.5">
                      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800 dark:text-amber-200">
                        Schema markup was not saved for this article. You can still publish
                        and export — add or fix schema in your CMS if needed.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Final article review (enriched / published): copy, preview editor, publish ───────── */}
        {sitePage && ['enriched', 'published'].includes(displayStatus) && (
          <div className="bg-card rounded-xl border border-border mb-6 overflow-hidden">
            <div className="flex items-center px-6 py-4 gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => setShowFinalArticleReview((v) => !v)}
                className="flex-1 flex items-center gap-2 text-left hover:opacity-80 transition-opacity min-w-0"
              >
                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm font-semibold text-card-foreground">Final article review</span>
                <span className="text-xs text-muted-foreground truncate">
                  — enriched copy, preview editor, publish
                </span>
              </button>
              <button
                type="button"
                onClick={() => setShowFinalArticleReview((v) => !v)}
                className="flex-shrink-0 hover:opacity-80 transition-opacity"
                aria-label={showFinalArticleReview ? 'Collapse' : 'Expand'}
              >
                {showFinalArticleReview ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>

            {showFinalArticleReview && (
              <div className="px-6 pb-6 border-t border-border">
                <div className="flex items-center justify-between mt-4 mb-3 flex-wrap gap-2">
                  <p className="text-xs text-muted-foreground">
                    Paste article into{' '}
                    <a
                      href="https://gemini.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-medium"
                    >
                      Gemini
                    </a>{' '}
                    to evaluate content quality.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void handleCopyFinal()}
                    className="flex-shrink-0 gap-1.5"
                  >
                    {copiedFinal ? (
                      <>
                        <ClipboardCheck className="h-3.5 w-3.5 text-green-500" /> Copied!
                      </>
                    ) : (
                      <>
                        <ClipboardCopy className="h-3.5 w-3.5" /> Copy all
                      </>
                    )}
                  </Button>
                </div>
                {!hasCitations && (
                  <div className="flex items-start gap-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 px-3 py-2.5 mb-3">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-yellow-700 dark:text-yellow-300">
                      No citations found for this article yet. Citations may not be available until processing finishes. If this persists, try re-running the article.
                    </p>
                  </div>
                )}
                <textarea
                  readOnly
                  value={buildFinalReviewText(sitePage, job.pipelineSteps, brandSettings, isApproving)}
                  rows={20}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-xs font-mono text-foreground resize-y focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <div className="mt-4 mb-6 flex flex-wrap gap-3">
                  <Button variant="default" size="default" className="gap-1.5 shadow-sm" asChild>
                    <Link href={`/workflow/${jobId}/preview`} target="_blank" rel="noopener noreferrer">
                      <PenLine className="h-4 w-4" />
                      Open article preview & editor
                    </Link>
                  </Button>
                  {displayStatus === 'enriched' && (
                    <Button
                      size="default"
                      variant="ghost"
                      onClick={() => setShowPublishConfirm(true)}
                      disabled={isPublishing}
                      className="!bg-emerald-600 hover:!bg-emerald-700 !text-white gap-1.5 shadow-md disabled:!opacity-50"
                    >
                      {isPublishing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      {hasWpConnection ? 'Publish to WordPress' : 'Publish'}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Social automation (12-post daily set) ───────────────────────── */}
        {sitePage && displayStatus === 'published' && (
          <div className="bg-card rounded-xl border border-border mb-6 overflow-hidden">
            <div className="flex items-center px-6 py-4 gap-3 flex-wrap border-b border-border">
              <CalendarClock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold text-card-foreground">Social media set</h2>
                <p className="text-xs text-muted-foreground">
                  Generate 12 branded posts (6 feed + 6 story) and schedule across your connected platforms.
                </p>
              </div>
              <Button
                size="sm"
                variant="default"
                onClick={() => void handleGenerateSocialSet()}
                disabled={
                  isGeneratingSocial ||
                  socialRuns.some((r) => r.status === 'pending' || r.status === 'processing')
                }
                className="gap-1.5"
              >
                {isGeneratingSocial ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Share2 className="h-4 w-4" />
                )}
                Generate social set
              </Button>
            </div>
            {socialRuns.length > 0 && (
              <div className="divide-y divide-border">
                {socialRuns.map((run) => (
                  <div key={run.id} className="px-6 py-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                    <div>
                      <span className="font-medium capitalize">{run.status}</span>
                      <span className="text-muted-foreground ml-2">
                        {run.scheduledDate} · {run.completedSpecs}/{run.totalSpecs} specs
                        {run.currentSpec ? ` · ${run.currentSpec}` : ''}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {run._count?.posts ?? 0} scheduled posts
                      {run.failedSpecs > 0 ? ` · ${run.failedSpecs} failed` : ''}
                    </div>
                    {run.error && (
                      <p className="w-full text-xs text-red-500">{run.error}</p>
                    )}
                    {(run.specResults?.length ?? 0) > 0 && (
                      <div className="w-full flex flex-wrap gap-1.5 mt-2">
                        {run.specResults!.map((spec) => (
                          <span
                            key={spec.slotKey}
                            className="inline-flex items-center gap-1 text-xs rounded border border-border px-2 py-0.5"
                          >
                            <span className="font-mono">{spec.slotKey}</span>
                            <span
                              className={
                                spec.status === 'completed'
                                  ? 'text-green-600'
                                  : spec.status === 'failed'
                                    ? 'text-red-500'
                                    : 'text-muted-foreground'
                              }
                            >
                              {spec.status}
                            </span>
                            {spec.status === 'failed' && (
                              <button
                                type="button"
                                className="text-primary hover:underline ml-1"
                                disabled={retryingSpec === `${run.id}-${spec.slotKey}`}
                                onClick={() => void handleRetrySpec(run.id, spec.slotKey)}
                              >
                                {retryingSpec === `${run.id}-${spec.slotKey}` ? '…' : 'retry'}
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
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
              {!hasWpConnection && (
                <>
                  <Button
                    size="sm" variant="outline"
                    onClick={() => void handleExport('html')}
                    disabled={exportingTarget === 'html'}
                  >
                    {exportingTarget === 'html'
                      ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                      : <Globe className="h-4 w-4 mr-1.5" />}
                    Download HTML
                  </Button>

                  <Button
                    size="sm" variant="outline"
                    onClick={() => void handleExport('bundle')}
                    disabled={exportingTarget === 'bundle'}
                  >
                    {exportingTarget === 'bundle'
                      ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                      : <Package className="h-4 w-4 mr-1.5" />}
                    Download Bundle (.zip)
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void handleCopySubstack()}
                  >
                    <ClipboardCopy className="h-4 w-4 mr-1.5" />
                    Copy for Substack
                  </Button>
                </>
              )}

              {sitePage?.excerpt && (
                <Link href={`/dashboard?idea=${encodeURIComponent(sitePage.excerpt)}&articleJobId=${jobId}`}>
                  <Button size="sm" variant="outline" className="border-purple-300 text-purple-600 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-400 dark:hover:bg-purple-900/30">
                    <Share2 className="h-4 w-4 mr-1.5" />
                    Generate Social Posts
                  </Button>
                </Link>
              )}
              {!syndicationGenerated && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/30"
                  onClick={() => void handleGenerateSyndication()}
                  disabled={syndicationLoading}
                >
                  {syndicationLoading
                    ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    : <BookMarked className="h-4 w-4 mr-1.5" />}
                  {syndicationLoading ? 'Generating articles…' : 'Generate LinkedIn & Medium Articles'}
                </Button>
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

        {/* ── LinkedIn & Medium articles — pending/processing state ──────── */}
        {displayStatus === 'published' && syndicationPending && !syndicationGenerated && (
          <div className="bg-card rounded-xl border border-border p-6 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <BookMarked className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-card-foreground uppercase tracking-wider flex-1">
                Platform Articles
              </h2>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground py-2">
              <Loader2 className="h-4 w-4 animate-spin flex-shrink-0 text-primary" />
              <span>Generating LinkedIn and Medium articles in the background…</span>
            </div>
          </div>
        )}

        {/* ── LinkedIn & Medium articles — failed state ─────────────────── */}
        {displayStatus === 'published' && !syndicationPending && !syndicationGenerated &&
          syndicationArticles.some((a) => a.status === 'failed') && (
          <div className="bg-card rounded-xl border border-red-300 dark:border-red-700 p-6 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <BookMarked className="h-4 w-4 text-red-500" />
              <h2 className="text-sm font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider flex-1">
                Platform Articles — Generation Failed
              </h2>
              <Button
                size="sm"
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={() => void handleGenerateSyndication()}
                disabled={syndicationLoading}
              >
                {syndicationLoading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : null}
                Retry
              </Button>
            </div>
            {syndicationArticles.filter((a) => a.status === 'failed').map((a) => (
              <p key={a.platform} className="text-xs text-red-600 dark:text-red-400">
                {a.platform}: {a.errorMessage ?? 'Unknown error'}
              </p>
            ))}
          </div>
        )}

        {/* ── LinkedIn & Medium articles panel ─────────────────────────── */}
        {displayStatus === 'published' && syndicationGenerated && syndicationArticles.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <BookMarked className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-card-foreground uppercase tracking-wider flex-1">
                Platform Articles
              </h2>
            </div>

            {/* Tab switcher */}
            <div className="flex gap-1 mb-4 bg-muted rounded-lg p-1 w-fit">
              {(['linkedin', 'medium'] as const).map((platform) => {
                const art = syndicationArticles.find((a) => a.platform === platform)
                if (!art || art.status !== 'completed') return null
                return (
                  <button
                    key={platform}
                    type="button"
                    onClick={() => setActiveSyndicationTab(platform)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      activeSyndicationTab === platform
                        ? 'bg-background shadow-sm text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {platform === 'linkedin'
                      ? <Linkedin className="h-3.5 w-3.5" />
                      : <BookMarked className="h-3.5 w-3.5" />}
                    {platform === 'linkedin' ? 'LinkedIn Article' : 'Medium Article'}
                  </button>
                )
              })}
            </div>

            {syndicationArticles
              .filter((a) => a.platform === activeSyndicationTab && a.status === 'completed')
              .map((art) => (
                <div key={art.platform}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="text-base font-semibold text-card-foreground leading-snug">{art.title}</h3>
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0"
                      onClick={() => void handleCopySyndication(
                        `# ${art.title}\n\n${art.content}`,
                        art.platform,
                      )}
                    >
                      {copiedSyndication === art.platform
                        ? <><ClipboardCheck className="h-3.5 w-3.5 mr-1.5 text-green-500" />Copied!</>
                        : <><ClipboardCopy className="h-3.5 w-3.5 mr-1.5" />Copy</>}
                    </Button>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/40 p-4 max-h-96 overflow-y-auto">
                    <pre className="text-sm text-card-foreground whitespace-pre-wrap font-sans leading-relaxed">
                      {art.content}
                    </pre>
                  </div>
                  {/* Diagram downloads */}
                  {sitePage?.diagrams && sitePage.diagrams.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wider">
                        Download diagrams to upload as article images:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {sitePage.diagrams.map((d) => (
                          <a
                            key={d.id}
                            href={`/api/articles/${jobId}/diagram-svg/${d.id}`}
                            download={`diagram-${d.position}.svg`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-md border border-border bg-background hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                          >
                            <Download className="h-3 w-3" />
                            Diagram {d.position}
                            {d.sectionTitle ? ` — ${d.sectionTitle.slice(0, 24)}` : ''}
                          </a>
                        ))}
                        {sitePage.featuredImage && (
                          <a
                            href={sitePage.featuredImage.url}
                            download="featured-image.jpg"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-md border border-border bg-background hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                          >
                            <Download className="h-3 w-3" />
                            Featured Image
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
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

      {/* ── Publish confirmation modal ────────────────────────────────────── */}
      {showPublishConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-background border border-border rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Publish this article?</h2>
            <p className="text-sm text-muted-foreground">
              Publishing is <span className="font-medium text-foreground">irreversible</span>. Once published, we&apos;ll automatically generate in the background:
            </p>
            <ul className="text-sm space-y-1.5 pl-4 list-disc text-foreground">
              <li>LinkedIn Article</li>
              <li>Medium Article</li>
              <li>12-post social set (Facebook, Instagram, LinkedIn, Threads, Twitter, Telegram)</li>
            </ul>
            <p className="text-xs text-muted-foreground">
              Social posts will be scheduled via Omniply — you can review and edit them there before they go live.
            </p>
            <div className="flex gap-3 pt-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPublishConfirm(false)}
                disabled={isPublishing}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={isPublishing}
                className="!bg-emerald-600 hover:!bg-emerald-700 !text-white"
                onClick={() => {
                  setShowPublishConfirm(false)
                  void (hasWpConnection && primaryWpConnectionId
                    ? handlePublish('wordpress', { connectionId: primaryWpConnectionId })
                    : handlePublish())
                }}
              >
                {isPublishing ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : null}
                Publish &amp; Generate All Content
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
