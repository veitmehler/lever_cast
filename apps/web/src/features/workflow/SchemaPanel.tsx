'use client'

import {
  AlertTriangle, ChevronDown, ChevronUp, ClipboardCheck, ClipboardCopy,
  Code2, ExternalLink, Loader2, RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatSchemaJsonDisplay } from './review-text'
import type { WorkflowView } from './useWorkflowJob'

// Schema & publish (after approval)
export function SchemaPanel({ workflow }: { workflow: WorkflowView }) {
  const {
    sitePage,
    displayStatus,
    showSchemaBlock, setShowSchemaBlock,
    copiedSchema,
    handleCopySchema,
    handleReEnrich,
    isReEnriching,
  } = workflow

  if (!sitePage || !['approved', 'enriched', 'published'].includes(displayStatus)) return null

  return (
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
  )
}
