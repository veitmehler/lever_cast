'use client'

import { CalendarClock, Loader2, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SocialPreviewPanel } from '@/features/social/SocialPreviewPanel'
import type { WorkflowView } from './useWorkflowJob'

// Social automation (12-post daily set)
export function SocialMediaSetSection({ workflow }: { workflow: WorkflowView }) {
  const {
    job,
    jobId,
    sitePage,
    displayStatus,
    handleGenerateSocialSet,
    isGeneratingSocial,
    socialRuns,
    fetchSocialRuns,
    handleRetrySpec,
    retryingSpec,
  } = workflow

  // "Article only" jobs skip social entirely.
  if (!sitePage || displayStatus !== 'published' || job.topic.mode === 'article_only') return null

  return (
    <div className="bg-card rounded-xl border border-border mb-6 overflow-hidden">
      <div className="flex items-center px-6 py-4 gap-3 flex-wrap border-b border-border">
        <CalendarClock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-card-foreground">Social media set</h2>
          <p className="text-xs text-muted-foreground">
            Generate 12 branded posts (6 feed + 6 story), preview captions and media here, then approve to schedule via Omniply.
          </p>
        </div>
        <Button
          size="sm"
          variant="default"
          onClick={() => void handleGenerateSocialSet()}
          disabled={
            isGeneratingSocial ||
            socialRuns.some(
              (r) =>
                r.status === 'pending' ||
                r.status === 'processing' ||
                r.status === 'scheduling' ||
                r.status === 'ready',
            )
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
        <SocialPreviewPanel
          jobId={jobId}
          runs={socialRuns}
          onRefresh={fetchSocialRuns}
          onRetryFailed={handleRetrySpec}
          retryingSpec={retryingSpec}
        />
      )}
    </div>
  )
}
