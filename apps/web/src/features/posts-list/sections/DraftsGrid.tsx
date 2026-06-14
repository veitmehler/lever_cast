import Link from 'next/link'
import { FileText, Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PostsListView } from '../usePostsList'

export function DraftsGrid({ posts }: { posts: PostsListView }) {
  const {
    filter,
    isLoading,
    selectedDrafts,
    setSelectedDrafts,
    lastSelectedIndex,
    setLastSelectedIndex,
    filteredPosts,
    handleSelectAll,
  } = posts

  return (
    <>
      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Select All Checkbox - Only show in Drafts tab */}
      {!isLoading && filter === 'draft' && filteredPosts.length > 0 && (
        <div className="mb-4 flex items-center gap-2">
          <input
            type="checkbox"
            id="select-all"
            checked={selectedDrafts.size === filteredPosts.length && filteredPosts.length > 0}
            onChange={handleSelectAll}
            className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
          />
          <label htmlFor="select-all" className="text-sm text-muted-foreground cursor-pointer">
            Select all ({filteredPosts.length})
          </label>
        </div>
      )}

      {/* Posts Grid */}
      {!isLoading && (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredPosts.map((draft, index) => {
            // Only show summary posts (not replies) in badges
            const summaryPosts = draft.posts?.filter(p => !p.parentPostId) || []
            const scheduledPosts = summaryPosts.filter(p => p.status === 'scheduled')
            const publishedPosts = summaryPosts.filter(p => p.status === 'published')
            const earliestScheduledDate = scheduledPosts.length > 0
              ? scheduledPosts.reduce((earliest, post) => {
                  if (!earliest) return post.scheduledAt ? new Date(post.scheduledAt) : null
                  if (!post.scheduledAt) return earliest
                  const postDate = new Date(post.scheduledAt)
                  return postDate < earliest ? postDate : earliest
                }, null as Date | null)
              : null

            const isSelected = selectedDrafts.has(draft.id)

            return (
              <div
                key={draft.id}
                className={`relative rounded-lg border ${
                  isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card'
                } p-6 hover:border-primary/50 transition-colors group`}
              >
                <Link
                  href={`/posts/${draft.id}`}
                  className="block"
                  onClick={(e) => {
                    // Prevent navigation if clicking on checkbox area
                    if ((e.target as HTMLElement).closest('.checkbox-container')) {
                      e.preventDefault()
                    }
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="text-xs font-medium text-muted-foreground uppercase">
                      {(() => {
                        // Try to parse as JSON array first (for multi-select)
                        try {
                          const parsed = JSON.parse(draft.platforms)
                          if (Array.isArray(parsed)) {
                            return parsed.join(', ')
                          }
                        } catch {
                          // Not JSON, treat as string
                        }
                        return draft.platforms
                      })()}
                    </span>
                    {publishedPosts.length > 0 && (
                      <div className="flex gap-1">
                        {/* Group by platform to show only one badge per platform */}
                        {Array.from(new Set(publishedPosts.map(p => p.platform))).map((platform) => {
                          const platformPost = publishedPosts.find(p => p.platform === platform)
                          return (
                            <span
                              key={platform}
                              className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-600 dark:text-green-400"
                              title={`Published to ${platform} on ${platformPost?.publishedAt ? new Date(platformPost.publishedAt).toLocaleDateString() : 'N/A'}`}
                            >
                              ✓ {platform}
                            </span>
                          )
                        })}
                      </div>
                    )}
                    {scheduledPosts.length > 0 && (
                      <div className="flex gap-1">
                        {/* Group by platform to show only one badge per platform */}
                        {Array.from(new Set(scheduledPosts.map(p => p.platform))).map((platform) => {
                          const platformPost = scheduledPosts.find(p => p.platform === platform)
                          return (
                            <span
                              key={platform}
                              className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-500/20 text-orange-600 dark:text-orange-400"
                              title={`Scheduled for ${platform} on ${platformPost?.scheduledAt ? new Date(platformPost.scheduledAt).toLocaleDateString() : 'N/A'}`}
                            >
                              📅 {platform}
                            </span>
                          )
                        })}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Checkbox - Only show in Drafts tab */}
                    {filter === 'draft' && (
                      <div
                        className="checkbox-container"
                        onClick={(e) => {
                          e.stopPropagation()
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            // Empty handler - state is controlled by onClick
                          }}
                          onClick={(e) => {
                            e.stopPropagation()

                            // Handle Shift+Click for range selection first
                            if (e.shiftKey && lastSelectedIndex !== null) {
                              const start = Math.min(lastSelectedIndex, index)
                              const end = Math.max(lastSelectedIndex, index)
                              const draftsToSelect = filteredPosts.slice(start, end + 1)
                              const rangeSelected = new Set(selectedDrafts)
                              draftsToSelect.forEach(d => rangeSelected.add(d.id))
                              setSelectedDrafts(rangeSelected)
                              setLastSelectedIndex(index)
                            } else {
                              // Toggle single selection
                              const newSelected = new Set(selectedDrafts)
                              if (newSelected.has(draft.id)) {
                                newSelected.delete(draft.id)
                              } else {
                                newSelected.add(draft.id)
                              }
                              setSelectedDrafts(newSelected)
                              setLastSelectedIndex(index)
                            }
                          }}
                          className="w-5 h-5 rounded border-border text-primary focus:ring-primary cursor-pointer"
                        />
                      </div>
                    )}
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        draft.status === 'published' || publishedPosts.length > 0
                          ? 'bg-primary/20 text-primary'
                          : scheduledPosts.length > 0
                            ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400'
                            : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {draft.status === 'published' || publishedPosts.length > 0
                        ? 'Published'
                        : scheduledPosts.length > 0
                          ? 'Scheduled'
                          : draft.status}
                    </span>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-card-foreground mb-2 group-hover:text-primary transition-colors">
                  {draft.title}
                </h3>
                {/* Only show original idea for drafts and scheduled posts, not published */}
                {!(filter === 'published' || publishedPosts.length > 0) && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {draft.contentRaw}
                  </p>
                )}
                {/* For published posts, show published content preview instead */}
                {(filter === 'published' || publishedPosts.length > 0) && (
                  <div className="mb-3">
                    {draft.linkedinContent && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {draft.linkedinContent}
                      </p>
                    )}
                    {draft.twitterContent && !draft.linkedinContent && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {Array.isArray(draft.twitterContent)
                          ? draft.twitterContent[0]
                          : draft.twitterContent}
                      </p>
                    )}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {new Date(draft.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                  {filter === 'scheduled' && earliestScheduledDate && (
                    <p className="text-xs font-medium text-orange-600 dark:text-orange-400">
                      {earliestScheduledDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                  )}
                </div>
                </Link>
              </div>
            )
          })}
        </div>
      )}

      {!isLoading && filteredPosts.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No posts found</h3>
          <p className="text-muted-foreground mb-4">
            {filter === 'all'
              ? 'Start creating your first post on the Dashboard!'
              : `No ${filter} posts yet.`
            }
          </p>
          {filter === 'all' && (
            <Link href="/dashboard">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Create Post
              </Button>
            </Link>
          )}
        </div>
      )}
    </>
  )
}
