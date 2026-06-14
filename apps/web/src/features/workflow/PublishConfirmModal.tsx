'use client'

import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { WorkflowView } from './useWorkflowJob'

export function PublishConfirmModal({ workflow }: { workflow: WorkflowView }) {
  const {
    job,
    showPublishConfirm, setShowPublishConfirm,
    isPublishing,
    hasWpConnection,
    primaryWpConnectionId,
    handlePublish,
  } = workflow

  if (!showPublishConfirm) return null

  const articleOnly = job.topic.mode === 'article_only'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-background border border-border rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Publish this article?</h2>
        <p className="text-sm text-muted-foreground">
          Publishing is <span className="font-medium text-foreground">irreversible</span>. Once published, we&apos;ll automatically generate in the background:
        </p>
        <ul className="text-sm space-y-1.5 pl-4 list-disc text-foreground">
          <li>LinkedIn Article</li>
          <li>Medium Article</li>
          {!articleOnly && (
            <li>12-post social preview set (Facebook, Instagram, LinkedIn, Threads, Twitter, Telegram)</li>
          )}
        </ul>
        {!articleOnly && (
          <p className="text-xs text-muted-foreground">
            Social posts are generated for preview on this page first. After you review, click Approve &amp; schedule to send them to Omniply.
          </p>
        )}
        <div className="flex gap-3 pt-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPublishConfirm(false)}
            disabled={isPublishing}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={isPublishing}
            className="!bg-emerald-600 hover:!bg-emerald-700 !text-white"
            onClick={() => {
              setShowPublishConfirm(false)
              void (hasWpConnection && primaryWpConnectionId
                ? handlePublish('wordpress', { connectionId: primaryWpConnectionId })
                : handlePublish())
            }}
          >
            {isPublishing ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : null}
            {articleOnly ? 'Publish article' : 'Publish & Generate Previews'}
          </Button>
        </div>
      </div>
    </div>
  )
}
