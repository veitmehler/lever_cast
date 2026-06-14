import type { PostsListView } from '../usePostsList'

export function FilterTabs({ posts }: { posts: PostsListView }) {
  const { filter, setFilter, drafts, scheduledDrafts } = posts

  return (
    <div className="flex gap-2 mb-6 border-b border-border">
      <button
        onClick={() => setFilter('all')}
        className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
          filter === 'all'
            ? 'border-primary text-foreground'
            : 'border-transparent text-muted-foreground hover:text-foreground'
        }`}
      >
        All ({drafts.length})
      </button>
      <button
        onClick={() => setFilter('draft')}
        className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
          filter === 'draft'
            ? 'border-primary text-foreground'
            : 'border-transparent text-muted-foreground hover:text-foreground'
        }`}
      >
        Drafts ({drafts.filter(d => {
          // Only count summary posts (not replies) for filtering
          const summaryPosts = d.posts?.filter(post => !post.parentPostId) || []
          const hasScheduledSummaryPosts = summaryPosts.some(post => post.status === 'scheduled')
          const hasPublishedSummaryPosts = summaryPosts.some(post => post.status === 'published')
          // Match the same logic as filteredPosts for draft filter
          return d.status === 'draft' && !hasScheduledSummaryPosts && !hasPublishedSummaryPosts
        }).length})
      </button>
      <button
        onClick={() => setFilter('scheduled')}
        className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
          filter === 'scheduled'
            ? 'border-primary text-foreground'
            : 'border-transparent text-muted-foreground hover:text-foreground'
        }`}
      >
        Scheduled ({scheduledDrafts.length})
      </button>
      <button
        onClick={() => setFilter('published')}
        className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
          filter === 'published'
            ? 'border-primary text-foreground'
            : 'border-transparent text-muted-foreground hover:text-foreground'
        }`}
      >
        Published ({drafts.filter(d => {
          const summaryPosts = d.posts?.filter(post => !post.parentPostId) || []
          return d.status === 'published' || summaryPosts.some(post => post.status === 'published')
        }).length})
      </button>
    </div>
  )
}
