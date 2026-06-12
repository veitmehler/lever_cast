'use client'

import { FileText, Loader2, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusBadge } from './StatusBadge'
import { TOTAL_PIPELINE_STEPS } from './constants'
import type { WorkflowView } from './useWorkflowJob'

export function HeaderCard({ workflow }: { workflow: WorkflowView }) {
  const {
    job,
    statusForBadge,
    phaseBApprovalRunning,
    showProgressBar,
    displayStep,
    progressPct,
    isEnriching,
    displayStatus,
    handleResume,
    isResuming,
  } = workflow

  return (
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
  )
}
