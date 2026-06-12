'use client'

import Link from 'next/link'
import {
  AlertTriangle, ChevronDown, ChevronUp, ClipboardCheck, ClipboardCopy,
  FileText, Loader2, PenLine,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { buildFinalReviewText } from './review-text'
import type { WorkflowView } from './useWorkflowJob'

// Final article review (enriched / published): copy, preview editor, publish
export function FinalReviewPanel({ workflow }: { workflow: WorkflowView }) {
  const {
    job,
    jobId,
    sitePage,
    displayStatus,
    showFinalArticleReview, setShowFinalArticleReview,
    handleCopyFinal,
    copiedFinal,
    hasCitations,
    brandSettings,
    isApproving,
    setShowPublishConfirm,
    isPublishing,
    hasWpConnection,
  } = workflow

  if (!sitePage || !['enriched', 'published'].includes(displayStatus)) return null

  return (
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
  )
}
