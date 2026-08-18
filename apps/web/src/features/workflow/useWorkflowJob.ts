'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { type SocialAutomationRunRow } from '@/features/social/SocialPreviewPanel'
import { useAuthedFetch } from '@/lib/use-authed-fetch'
import { ACTIVE_STATUSES, ENRICHMENT_ACTIVE } from './constants'
import { markdownToHtml } from './markdown-to-html'
import {
  buildFinalReviewText,
  buildReviewText,
  formatSchemaJsonDisplay,
  htmlToMarkdownWithDiagrams,
} from './review-text'
import type {
  ArticleJob,
  BrandSettings,
  OutputAttempt,
  SSEUpdate,
  SitePage,
  SyndicationArticle,
  WpConnectionLite,
} from './types'

// Owns the entire workflow-job state machine: job fetch + SSE + fallback polls
// (Phase A generation, Phase B approval, Phase C enrichment), syndication and
// social-automation runs, and every pipeline action handler. Kept as ONE hook
// so the original single-component effect order is preserved exactly.
export function useWorkflowJob() {
  const { jobId } = useParams<{ jobId: string }>()
  const router = useRouter()
  // Authenticated fetch that mints a fresh Clerk token per request and retries
  // once on auth failure. Replaces bare fetch() for all /api calls so a stale
  // session-token cookie (background-tab throttling) can't 401 the page.
  const { authedFetch, getFreshToken } = useAuthedFetch()

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

  const [syndicationArticles, setSyndicationArticles] = useState<SyndicationArticle[]>([])
  const [syndicationLoading, setSyndicationLoading] = useState(false)
  const [syndicationGenerated, setSyndicationGenerated] = useState(false)
  const [syndicationPending, setSyndicationPending] = useState(false)
  const [activeSyndicationTab, setActiveSyndicationTab] = useState<'linkedin' | 'medium'>('linkedin')
  const [copiedSyndication, setCopiedSyndication] = useState<string | null>(null)

  const [socialRuns, setSocialRuns] = useState<SocialAutomationRunRow[]>([])
  const [isGeneratingSocial, setIsGeneratingSocial] = useState(false)
  const [retryingSpec, setRetryingSpec] = useState<string | null>(null)

  useEffect(() => {
    void authedFetch('/api/wp/connections')
      .then((r) => r.json())
      .then((d) => setWpConnections((d.connections ?? []) as WpConnectionLite[]))
      .catch(() => setWpConnections([]))
  }, [authedFetch])

  const fetchSyndicationStatus = useCallback(async () => {
    if (!jobId) return
    try {
      const r = await authedFetch(`/api/articles/${jobId}/syndication`)
      if (!r.ok) return
      const d = await r.json()
      const arts: SyndicationArticle[] = d.articles ?? []
      setSyndicationArticles(arts)
      const hasCompleted = arts.some((a) => a.status === 'completed')
      const hasPending = arts.some((a) => a.status === 'pending' || a.status === 'processing')
      setSyndicationGenerated(hasCompleted)
      setSyndicationPending(hasPending && !arts.every((a) => a.status === 'completed'))
    } catch { /* silent */ }
  }, [jobId, authedFetch])

  // Pre-load any previously generated syndication articles
  useEffect(() => {
    void fetchSyndicationStatus()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId])

  // Poll every 2 s while syndication is pending/processing so the articles
  // appear promptly after generation completes (was 5 s — too slow).
  useEffect(() => {
    if (!syndicationPending) return
    const id = setInterval(() => void fetchSyndicationStatus(), 2000)
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
  // Kept so the export poll interval can be cleared on unmount.
  const exportPollRef      = useRef<ReturnType<typeof setInterval> | null>(null)
  // Stable ref mirrors job state so onerror callbacks can read status without
  // causing stale-closure or side-effect-in-state-updater issues.
  const jobRef             = useRef<ArticleJob | null>(null)
  useEffect(() => { jobRef.current = job ?? null }, [job])
  // Counts consecutive *authoritative* 404s (JSON body, not HTML). We only
  // redirect after 3 in a row so a single transient middleware blip can't
  // evict the user from a live generation.
  const notFoundCountRef   = useRef(0)

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchJob = useCallback(async (): Promise<boolean> => {
    try {
      const res = await authedFetch(`/api/articles/${jobId}`)
      if (!res.ok) {
        if (res.status === 404) {
          // Distinguish an authoritative API 404 ({"error":"Article job not found"})
          // from a transient middleware/HTML 404 (Clerk auth blip returns <!DOCTYPE>).
          // Only redirect after 3 consecutive confirmed JSON 404s so a single
          // token-rotation glitch can't evict the user from a live generation.
          let isAuthoritativeNotFound = false
          try {
            const body = await res.clone().json() as { error?: string }
            if (typeof body?.error === 'string') isAuthoritativeNotFound = true
          } catch { /* HTML body — transient, ignore */ }

          if (isAuthoritativeNotFound) {
            notFoundCountRef.current += 1
            if (notFoundCountRef.current >= 3) { router.push('/workflow'); return false }
          } else {
            notFoundCountRef.current = 0
          }
          return false
        }
        notFoundCountRef.current = 0
        // authedFetch already retried once with a force-refreshed token, so a
        // 401/403 here is a genuine (if usually transient) auth failure. Swallow
        // it silently when we already have job data — the next poll recovers —
        // and only surface a toast on a cold load with nothing to show.
        if (res.status === 401 || res.status === 403) {
          if (jobRef.current) return false
          toast.error('Session expired — please refresh the page')
          return false
        }
        throw new Error('Failed to load job')
      }
      notFoundCountRef.current = 0
      const data = await res.json()
      const j = data.job as ArticleJob
      setJob({
        ...j,
        pipelineSteps: j.pipelineSteps ?? j.steps ?? [],
      })
      return true
    } catch {
      // Only show the error toast on the initial load (no job data yet).
      if (!jobRef.current) toast.error('Failed to load article job')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [jobId, router, authedFetch])

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
    if (prev === 'in_progress' && (job?.status === 'completed' || job?.status === 'reviewing')) {
      fetchJob()
    }
  }, [job?.status, fetchJob])

  // Fetch brand settings once for the review block
  useEffect(() => {
    authedFetch('/api/brand-settings')
      .then((r) => r.ok ? r.json() : ({} as BrandSettings))
      .then((d: BrandSettings) => setBrandSettings({
        defaultAuthorName:    d.defaultAuthorName    ?? '',
        defaultAuthorWebsite: d.defaultAuthorWebsite ?? '',
        defaultAuthorLinkedIn: d.defaultAuthorLinkedIn ?? '',
        ourExperience:        d.ourExperience        ?? '',
      }))
      .catch(() => {/* silent */})
  }, [authedFetch])

  // When the job reaches a terminal post-enrichment state, the enriched bodyHtml
  // (Key Takeaways + Table of Contents merged in) is only loaded into state via
  // fetchJob. The single SSE 'done' → fetchJob() call can blip on a transient
  // auth failure, leaving the "Final article review" textarea showing stale
  // pre-enrichment content until a manual reload. Retry a few times on the
  // transition to guarantee the final content lands.
  const prevStatusForEnrichedRef = useRef<string | undefined>(undefined)
  useEffect(() => {
    const prev = prevStatusForEnrichedRef.current
    const status = job?.status
    prevStatusForEnrichedRef.current = status
    if (prev === status) return
    if (status !== 'enriched' && status !== 'published') return

    let cancelled = false
    ;(async () => {
      for (const delay of [0, 1500, 4000]) {
        if (cancelled) return
        if (delay) await new Promise((r) => setTimeout(r, delay))
        if (cancelled) return
        await fetchJob()
      }
    })()
    return () => { cancelled = true }
  }, [job?.status, fetchJob])

  // ── SSE ────────────────────────────────────────────────────────────────────

  const startSSE = useCallback(async () => {
    sseRef.current?.close()
    // EventSource can't set headers, so pass a freshly-minted Clerk token as a
    // query param. This keeps the SSE auth valid even when the cookie session
    // token has gone stale on a backgrounded tab.
    const token = await getFreshToken()
    const url = token
      ? `/api/articles/${jobId}/events?token=${encodeURIComponent(token)}`
      : `/api/articles/${jobId}/events`
    const es = new EventSource(url)
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
          void startSSE()
        }
      }, 3000)
    }
  }, [jobId, fetchJob, getFreshToken])

  // Start SSE when job is actively running OR in enrichment
  useEffect(() => {
    if (!job) return
    if (ACTIVE_STATUSES.has(job.status) || ENRICHMENT_ACTIVE.has(job.status)) {
      void startSSE()
    }
    return () => {
      if (reconnectTimerRef.current !== null) {
        clearTimeout(reconnectTimerRef.current)
        reconnectTimerRef.current = null
      }
      sseRef.current?.close()
    }
  }, [job?.id, job?.status]) // eslint-disable-line react-hooks/exhaustive-deps

  // Clean up the export poll interval on page unmount.
  useEffect(() => {
    return () => {
      if (exportPollRef.current !== null) {
        clearInterval(exportPollRef.current)
        exportPollRef.current = null
      }
    }
  }, [])

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
      const res = await authedFetch(`/api/articles/${jobId}/resume`, { method: 'POST' })
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
      const res = await authedFetch(`/api/articles/${jobId}/output/attempts`)
      if (res.ok) {
        const data = await res.json()
        setAttempts(data.attempts ?? [])
      }
    } catch { /* silent */ }
  }, [jobId, authedFetch])

  useEffect(() => {
    if (job?.status === 'enriched' || job?.status === 'published') fetchAttempts()
  }, [job?.status, fetchAttempts])

  const fetchSocialRuns = useCallback(async () => {
    try {
      const res = await authedFetch(`/api/articles/${jobId}/social-automation`)
      if (res.ok) {
        const data = await res.json()
        setSocialRuns(data.runs ?? [])
      }
    } catch { /* silent */ }
  }, [jobId, authedFetch])

  useEffect(() => {
    if (job?.status === 'enriched' || job?.status === 'published') fetchSocialRuns()
  }, [job?.status, fetchSocialRuns])

  // Poll every 2 s while social automation is running so run status updates
  // appear quickly (was 5 s — too slow).
  useEffect(() => {
    const active = socialRuns.some(
      (r) =>
        r.status === 'pending' ||
        r.status === 'processing' ||
        r.status === 'scheduling',
    )
    if (!active) return
    const id = setInterval(fetchSocialRuns, 2000)
    return () => clearInterval(id)
  }, [socialRuns, fetchSocialRuns])

  const handleGenerateSocialSet = async () => {
    setIsGeneratingSocial(true)
    try {
      const res = await authedFetch(`/api/articles/${jobId}/generate-social-set`, { method: 'POST' })
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
      const res = await authedFetch(`/api/social-automation/${runId}/retry/${slotKey}`, { method: 'POST' })
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
      const res = await authedFetch(`/api/articles/${jobId}/output/${target}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Export failed')
      toast.success(`${target.charAt(0).toUpperCase() + target.slice(1)} export queued`)
      // Clear any previously running export poll before starting a new one.
      if (exportPollRef.current !== null) {
        clearInterval(exportPollRef.current)
        exportPollRef.current = null
      }
      let polls = 0
      exportPollRef.current = setInterval(async () => {
        await fetchAttempts()
        polls++
        if (polls > 20) {
          clearInterval(exportPollRef.current!)
          exportPollRef.current = null
        }
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
      const res = await authedFetch(`/api/articles/${jobId}/re-enrich`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to re-enrich')
      }
      toast.success('Processing started…')
      await fetchJob()
      void startSSE()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to re-enrich')
    } finally {
      setIsReEnriching(false)
    }
  }

  const handleRewrite = async () => {
    setIsRewriting(true)
    try {
      const res = await authedFetch(`/api/articles/${jobId}/rewrite`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to start rewrite')
      }
      toast.success('Rewrite started…')
      await fetchJob()
      void startSSE()
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
      const res = await authedFetch(`/api/articles/${jobId}/publish`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to publish')
      }
      toast.success('Article published! Generating LinkedIn, Medium & social previews in the background…')
      await fetchJob()
      void fetchSyndicationStatus()
      void fetchSocialRuns()
      // Burst-poll for the first 20 s after publish so syndication and social
      // run states appear as soon as the pg-boss workers pick them up.
      let burstCount = 0
      const burstId = setInterval(async () => {
        burstCount++
        await Promise.all([fetchSyndicationStatus(), fetchSocialRuns()])
        if (burstCount >= 10) clearInterval(burstId)
      }, 2000)
      if (autoExportTarget) {
        // Re-fetch WP connections at publish time so we always use the current
        // connectionId, not the one cached at page load (which may be stale if
        // the user changed their WordPress connection while the page was open).
        let freshConfig = exportConfig ?? {}
        if (autoExportTarget === 'wordpress') {
          const connsRes = await authedFetch('/api/wp/connections').catch(() => null)
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
      const res = await authedFetch(`/api/articles/${jobId}/syndication`, { method: 'POST' })
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

  // Rich copy: text/html flavor so LinkedIn's / Medium's WYSIWYG editors keep
  // headings, bold, lists and links on paste (both render raw markdown as
  // literal characters). Plain-text flavor carries the markdown as fallback.
  const handleCopySyndicationRich = async (title: string, content: string, platform: string) => {
    const html = `<h1>${title.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</h1>\n${markdownToHtml(content)}`
    const plain = `# ${title}\n\n${content}`
    try {
      if (typeof ClipboardItem !== 'undefined') {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([html], { type: 'text/html' }),
            'text/plain': new Blob([plain], { type: 'text/plain' }),
          }),
        ])
      } else {
        await navigator.clipboard.writeText(plain)
      }
      setCopiedSyndication(platform)
      setTimeout(() => setCopiedSyndication(null), 2500)
    } catch {
      toast.error('Copy failed — please select and copy manually')
    }
  }

  const handleApprove = async () => {
    setIsApproving(true)
    try {
      const res = await authedFetch(`/api/articles/${jobId}/approve`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to start approval')
      }
      toast.success('Processing started…')
      void startSSE()
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

  return {
    jobId,
    job,
    isLoading,
    isResuming,
    isApproving,
    isReEnriching,
    isPublishing,
    showPublishConfirm, setShowPublishConfirm,
    isRewriting,
    exportingTarget,
    attempts,
    showAttempts, setShowAttempts,
    reviewPanelExpandedOverride, setReviewPanelExpandedOverride,
    showSchemaBlock, setShowSchemaBlock,
    copiedSchema,
    copied,
    copiedFinal,
    showFinalArticleReview, setShowFinalArticleReview,
    brandSettings,
    wpConnections,
    syndicationArticles,
    syndicationLoading,
    syndicationGenerated,
    syndicationPending,
    activeSyndicationTab, setActiveSyndicationTab,
    copiedSyndication,
    socialRuns,
    isGeneratingSocial,
    retryingSpec,
    fetchSocialRuns,
    handleResume,
    handleGenerateSocialSet,
    handleRetrySpec,
    handleExport,
    handleReEnrich,
    handleRewrite,
    handlePublish,
    handleCopySubstack,
    handleGenerateSyndication,
    handleCopySyndication,
    handleCopySyndicationRich,
    handleApprove,
    handleCopySchema,
    handleCopy,
    handleCopyFinal,
  }
}

export type WorkflowJobData = ReturnType<typeof useWorkflowJob>

// The hook result plus the page-level derived values (computed after the
// loading/null guards, so `job` is narrowed to non-null). Section components
// take this whole object as their single prop.
export type WorkflowView = Omit<WorkflowJobData, 'job'> & {
  job: ArticleJob
  displayStatus: string
  displayStep: number
  isGenerating: boolean
  isEnriching: boolean
  progressPct: number
  reviewAvailable: boolean
  reviewPanelExpanded: boolean
  toggleReviewPanel: () => void
  sitePage: SitePage | null | undefined
  enrichmentPhaseRunning: boolean
  showProgressBar: boolean
  phaseBApprovalRunning: boolean
  statusForBadge: string
  hasCitations: boolean
  hasWpConnection: boolean
  primaryWpConnectionId: string | undefined
}
