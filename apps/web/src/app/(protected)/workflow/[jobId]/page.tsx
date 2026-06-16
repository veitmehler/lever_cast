'use client'

import Link from 'next/link'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { ArticleMetadataPanel } from '@/features/workflow/ArticleMetadataPanel'
import { ErrorLogsPanel } from '@/features/workflow/ErrorLogsPanel'
import { ExportPanel } from '@/features/workflow/ExportPanel'
import { FinalReviewPanel } from '@/features/workflow/FinalReviewPanel'
import { HeaderCard } from '@/features/workflow/HeaderCard'
import { PublishConfirmModal } from '@/features/workflow/PublishConfirmModal'
import { ReviewContentPanel } from '@/features/workflow/ReviewContentPanel'
import { SchemaPanel } from '@/features/workflow/SchemaPanel'
import { SocialMediaSetSection } from '@/features/workflow/SocialMediaSetSection'
import { SyndicationPanels } from '@/features/workflow/SyndicationPanels'
import { PromoEmailPanel } from '@/features/workflow/PromoEmailPanel'
import { ACTIVE_STATUSES, TOTAL_PIPELINE_STEPS } from '@/features/workflow/constants'
import { resolveCitations } from '@/features/workflow/review-text'
import { useWorkflowJob, type WorkflowView } from '@/features/workflow/useWorkflowJob'

export default function WorkflowJobPage() {
  const workflow = useWorkflowJob()
  const {
    job,
    isLoading,
    isApproving,
    reviewPanelExpandedOverride, setReviewPanelExpandedOverride,
    wpConnections,
  } = workflow

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

  const view: WorkflowView = {
    ...workflow,
    job,
    displayStatus,
    displayStep,
    isGenerating,
    isEnriching,
    progressPct,
    reviewAvailable,
    reviewPanelExpanded,
    toggleReviewPanel,
    sitePage,
    enrichmentPhaseRunning,
    showProgressBar,
    phaseBApprovalRunning,
    statusForBadge,
    hasCitations,
    hasWpConnection,
    primaryWpConnectionId,
  }

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

        <HeaderCard workflow={view} />

        <ReviewContentPanel workflow={view} />

        <ArticleMetadataPanel workflow={view} />

        <SchemaPanel workflow={view} />

        <FinalReviewPanel workflow={view} />

        <ExportPanel workflow={view} />

        {/* Platform Articles (LinkedIn/Medium) above the Social media set —
            matches the actual production order. */}
        <SyndicationPanels workflow={view} />

        <PromoEmailPanel workflow={view} />

        <SocialMediaSetSection workflow={view} />

        <ErrorLogsPanel workflow={view} />

      </div>

      <PublishConfirmModal workflow={view} />
    </div>
  )
}
