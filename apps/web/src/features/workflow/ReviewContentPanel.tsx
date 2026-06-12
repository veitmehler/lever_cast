'use client'

import {
  AlertTriangle, ChevronDown, ChevronUp, ClipboardCheck, ClipboardCopy,
  Loader2, PenLine, ThumbsUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { buildReviewText } from './review-text'
import type { WorkflowView } from './useWorkflowJob'

// Review Content panel (available once article body exists)
export function ReviewContentPanel({ workflow }: { workflow: WorkflowView }) {
  const {
    job,
    sitePage,
    reviewAvailable,
    reviewPanelExpanded,
    toggleReviewPanel,
    displayStatus,
    isApproving,
    isRewriting,
    handleRewrite,
    handleApprove,
    handleCopy,
    copied,
    hasCitations,
    brandSettings,
  } = workflow

  if (!reviewAvailable || !sitePage) return null

  return (
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
  )
}
