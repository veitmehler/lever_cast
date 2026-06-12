'use client'

import { AlertTriangle } from 'lucide-react'
import type { WorkflowView } from './useWorkflowJob'

export function ErrorLogsPanel({ workflow }: { workflow: WorkflowView }) {
  const { job } = workflow

  if (job.errorLogs.length === 0) return null

  return (
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
  )
}
