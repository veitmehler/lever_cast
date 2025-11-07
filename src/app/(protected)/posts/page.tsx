'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FileText, Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

type FilterStatus = 'all' | 'published' | 'draft' | 'scheduled'

// Draft type matching database schema
type Draft = {
  id: string
  userId: string
  title: string
  contentRaw: string
  linkedinContent: string | null
  twitterContent: string | null
  platforms: string
  templateId: string | null
  attachedImage: string | null
  status: string
  publishedAt: Date | null
  createdAt: Date
  updatedAt: Date
  posts?: Array<{
    id: string
    platform: string
    publishedAt: Date | null
    scheduledAt: Date | null
    status: string
    parentPostId?: string | null // For filtering out reply posts
  }>
}

export default function PostsPage() {
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch drafts from API
  const fetchDrafts = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/drafts')
      
      if (!response.ok) {
        throw new Error('Failed to fetch drafts')
      }
      
      const data = await response.json()
      setDrafts(data)
    } catch (error) {
      console.error('Error fetching drafts:', error)
      toast.error('Failed to load drafts')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDrafts()
  }, [])

  const filteredPosts = drafts.filter(draft => {
    // Only count summary posts (not replies) for filtering
    const summaryPosts = draft.posts?.filter(post => !post.parentPostId) || []
    const hasScheduledSummaryPosts = summaryPosts.some(post => post.status === 'scheduled')
    const hasPublishedSummaryPosts = summaryPosts.some(post => post.status === 'published')
    
    if (filter === 'all') return true
    if (filter === 'draft') {
      // Exclude drafts that have scheduled or published summary posts from the Drafts tab
      return draft.status === 'draft' && !hasScheduledSummaryPosts && !hasPublishedSummaryPosts
    }
    if (filter === 'published') return draft.status === 'published' || hasPublishedSummaryPosts
    if (filter === 'scheduled') {
      // Show drafts that have scheduled summary posts
      return hasScheduledSummaryPosts
    }
    return false
  })

  const scheduledDrafts = drafts.filter(draft => {
    // Only count summary posts (not replies)
    const summaryPosts = draft.posts?.filter(post => !post.parentPostId) || []
    return summaryPosts.some(post => post.status === 'scheduled')
  })

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Posts</h1>
          <p className="text-muted-foreground">
            Manage your drafts and published content
          </p>
        </div>
        <Link href="/dashboard">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            New Post
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
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
          Drafts ({drafts.filter(d => d.status === 'draft').length})
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

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Posts Grid */}
      {!isLoading && (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredPosts.map((draft) => {
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

            return (
              <Link
                key={draft.id}
                href={`/posts/${draft.id}`}
                className="block rounded-lg border border-border bg-card p-6 hover:border-primary/50 transition-colors group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="text-xs font-medium text-muted-foreground uppercase">
                      {draft.platforms}
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
                <h3 className="text-lg font-semibold text-card-foreground mb-2 group-hover:text-primary transition-colors">
                  {draft.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {draft.contentRaw}
                </p>
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
    </div>
  )
}

