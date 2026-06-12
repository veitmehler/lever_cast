'use client'

import {
  BookMarked, ClipboardCheck, ClipboardCopy, Download, Linkedin, Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { WorkflowView } from './useWorkflowJob'

// LinkedIn & Medium articles — pending/processing, failed, and completed
// panels. Rendered as a fragment so the DOM output is identical to the
// original three sibling blocks.
export function SyndicationPanels({ workflow }: { workflow: WorkflowView }) {
  const {
    jobId,
    sitePage,
    displayStatus,
    syndicationArticles,
    syndicationLoading,
    syndicationGenerated,
    syndicationPending,
    activeSyndicationTab, setActiveSyndicationTab,
    copiedSyndication,
    handleGenerateSyndication,
    handleCopySyndication,
  } = workflow

  return (
    <>
      {/* ── LinkedIn & Medium articles — pending/processing state ──────── */}
      {displayStatus === 'published' && syndicationPending && !syndicationGenerated && (
        <div className="bg-card rounded-xl border border-border p-6 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <BookMarked className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-card-foreground uppercase tracking-wider flex-1">
              Platform Articles
            </h2>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground py-2">
            <Loader2 className="h-4 w-4 animate-spin flex-shrink-0 text-primary" />
            <span>Generating LinkedIn and Medium articles in the background…</span>
          </div>
        </div>
      )}

      {/* ── LinkedIn & Medium articles — failed state ─────────────────── */}
      {displayStatus === 'published' && !syndicationPending && !syndicationGenerated &&
        syndicationArticles.some((a) => a.status === 'failed') && (
        <div className="bg-card rounded-xl border border-red-300 dark:border-red-700 p-6 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <BookMarked className="h-4 w-4 text-red-500" />
            <h2 className="text-sm font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider flex-1">
              Platform Articles — Generation Failed
            </h2>
            <Button
              size="sm"
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={() => void handleGenerateSyndication()}
              disabled={syndicationLoading}
            >
              {syndicationLoading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : null}
              Retry
            </Button>
          </div>
          {syndicationArticles.filter((a) => a.status === 'failed').map((a) => (
            <p key={a.platform} className="text-xs text-red-600 dark:text-red-400">
              {a.platform}: {a.errorMessage ?? 'Unknown error'}
            </p>
          ))}
        </div>
      )}

      {/* ── LinkedIn & Medium articles panel ─────────────────────────── */}
      {displayStatus === 'published' && syndicationGenerated && syndicationArticles.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <BookMarked className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-card-foreground uppercase tracking-wider flex-1">
              Platform Articles
            </h2>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-1 mb-4 bg-muted rounded-lg p-1 w-fit">
            {(['linkedin', 'medium'] as const).map((platform) => {
              const art = syndicationArticles.find((a) => a.platform === platform)
              if (!art || art.status !== 'completed') return null
              return (
                <button
                  key={platform}
                  type="button"
                  onClick={() => setActiveSyndicationTab(platform)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    activeSyndicationTab === platform
                      ? 'bg-background shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {platform === 'linkedin'
                    ? <Linkedin className="h-3.5 w-3.5" />
                    : <BookMarked className="h-3.5 w-3.5" />}
                  {platform === 'linkedin' ? 'LinkedIn Article' : 'Medium Article'}
                </button>
              )
            })}
          </div>

          {syndicationArticles
            .filter((a) => a.platform === activeSyndicationTab && a.status === 'completed')
            .map((art) => (
              <div key={art.platform}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="text-base font-semibold text-card-foreground leading-snug">{art.title}</h3>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => void handleCopySyndication(
                      `# ${art.title}\n\n${art.content}`,
                      art.platform,
                    )}
                  >
                    {copiedSyndication === art.platform
                      ? <><ClipboardCheck className="h-3.5 w-3.5 mr-1.5 text-green-500" />Copied!</>
                      : <><ClipboardCopy className="h-3.5 w-3.5 mr-1.5" />Copy</>}
                  </Button>
                </div>
                <div className="rounded-lg border border-border bg-muted/40 p-4 max-h-96 overflow-y-auto">
                  <pre className="text-sm text-card-foreground whitespace-pre-wrap font-sans leading-relaxed">
                    {art.content}
                  </pre>
                </div>
                {/* Diagram downloads */}
                {sitePage?.diagrams && sitePage.diagrams.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wider">
                      Download diagrams to upload as article images:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {sitePage.diagrams.map((d) => (
                        <a
                          key={d.id}
                          href={`/api/articles/${jobId}/diagram-svg/${d.id}`}
                          download={`diagram-${d.position}.svg`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-md border border-border bg-background hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                        >
                          <Download className="h-3 w-3" />
                          Diagram {d.position}
                          {d.sectionTitle ? ` — ${d.sectionTitle.slice(0, 24)}` : ''}
                        </a>
                      ))}
                      {sitePage.featuredImage && (
                        <a
                          href={sitePage.featuredImage.url}
                          download="featured-image.jpg"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-md border border-border bg-background hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                        >
                          <Download className="h-3 w-3" />
                          Featured Image
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
    </>
  )
}
