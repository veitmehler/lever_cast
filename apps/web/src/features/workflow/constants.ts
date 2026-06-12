export const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending:     { label: 'Pending',          color: 'text-muted-foreground',                                                bg: 'bg-muted' },
  in_progress: { label: 'Generating…',      color: 'text-blue-700 dark:text-blue-300',     bg: 'bg-blue-50 dark:bg-blue-900/40' },
  completed:   { label: 'Needs Approval',   color: 'text-yellow-700 dark:text-yellow-300', bg: 'bg-yellow-50 dark:bg-yellow-900/40' },
  approved:    { label: 'Processing', color: 'text-purple-700 dark:text-purple-300', bg: 'bg-purple-50 dark:bg-purple-900/40' },
  enriched:    { label: 'Ready to Publish',  color: 'text-green-700 dark:text-green-300',  bg: 'bg-green-50 dark:bg-green-900/40' },
  published:   { label: 'Published',        color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-900/40' },
  failed:      { label: 'Failed',           color: 'text-red-700 dark:text-red-300',       bg: 'bg-red-50 dark:bg-red-900/40' },
}

// Statuses where the pipeline is actively running (SSE should be open)
export const ACTIVE_STATUSES = new Set(['pending', 'in_progress'])
// Job is in post-approval processing (SSE open while worker runs)
export const ENRICHMENT_ACTIVE = new Set(['approved'])

/** Max pipeline step for unified user-facing progress (internal step numbers). */
export const TOTAL_PIPELINE_STEPS = 25
