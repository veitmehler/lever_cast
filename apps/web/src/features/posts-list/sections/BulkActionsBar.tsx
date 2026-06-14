import { Loader2, Trash2, Send, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PostsListView } from '../usePostsList'

export function BulkActionsBar({ posts }: { posts: PostsListView }) {
  const {
    filter,
    selectedDrafts,
    setSelectedDrafts,
    setLastSelectedIndex,
    isScheduling,
    setShowBulkScheduleModal,
    handleBulkPublish,
    isPublishing,
    handleBulkDelete,
    isDeleting,
  } = posts

  // Bulk Actions Bar - Only show in Drafts tab when items are selected
  if (!(filter === 'draft' && selectedDrafts.size > 0)) return null

  return (
    <div className="mb-4 p-4 rounded-lg border border-border bg-card flex items-center justify-between">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-foreground">
          {selectedDrafts.size} draft{selectedDrafts.size !== 1 ? 's' : ''} selected
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectedDrafts(new Set())
            setLastSelectedIndex(null)
          }}
        >
          Clear Selection
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowBulkScheduleModal(true)}
          disabled={isScheduling}
        >
          {isScheduling ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Scheduling...
            </>
          ) : (
            <>
              <Calendar className="w-4 h-4 mr-2" />
              Schedule Selected
            </>
          )}
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={handleBulkPublish}
          disabled={isPublishing}
        >
          {isPublishing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Publishing...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Publish Selected
            </>
          )}
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleBulkDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Deleting...
            </>
          ) : (
            <>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Selected
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
