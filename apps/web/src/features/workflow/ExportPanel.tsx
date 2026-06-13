'use client'

import {
  BookMarked, ChevronDown, ChevronUp, ClipboardCopy, Download, ExternalLink,
  Globe, Loader2, Package,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { WorkflowView } from './useWorkflowJob'

// Export panel (only after Publish)
export function ExportPanel({ workflow }: { workflow: WorkflowView }) {
  const {
    displayStatus,
    hasWpConnection,
    handleExport,
    exportingTarget,
    handleCopySubstack,
    syndicationGenerated,
    handleGenerateSyndication,
    syndicationLoading,
    attempts,
    showAttempts, setShowAttempts,
  } = workflow

  if (displayStatus !== 'published') return null

  return (
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
  )
}
