'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FileText, Plus, Loader2, Trash2, Send, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { ScheduleModal } from '@/components/ScheduleModal'

type FilterStatus = 'all' | 'published' | 'draft' | 'scheduled'

// Draft type matching database schema
type Draft = {
  id: string
  userId: string
  title: string
  contentRaw: string
  linkedinContent: string | null
  twitterContent: string | null
  facebookContent: string | null
  instagramContent: string | null
  telegramContent: string | null
  threadsContent: string | null
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
  const [selectedDrafts, setSelectedDrafts] = useState<Set<string>>(new Set())
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isScheduling, setIsScheduling] = useState(false)
  const [showBulkScheduleModal, setShowBulkScheduleModal] = useState(false)

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

  // Handle checkbox selection (currently unused but kept for future bulk actions)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSelectDraft = (draftId: string, index: number, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()

    const newSelected = new Set(selectedDrafts)

    // Handle Shift+Click for range selection
    if (event.shiftKey && lastSelectedIndex !== null) {
      const start = Math.min(lastSelectedIndex, index)
      const end = Math.max(lastSelectedIndex, index)
      const draftsToSelect = filteredPosts.slice(start, end + 1)
      draftsToSelect.forEach(d => newSelected.add(d.id))
    } else {
      // Toggle single selection
      if (newSelected.has(draftId)) {
        newSelected.delete(draftId)
      } else {
        newSelected.add(draftId)
      }
    }

    setSelectedDrafts(newSelected)
    setLastSelectedIndex(index)
  }

  // Handle select all
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedDrafts(new Set(filteredPosts.map(d => d.id)))
    } else {
      setSelectedDrafts(new Set())
    }
    setLastSelectedIndex(null)
  }

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedDrafts.size === 0) {
      toast.error('Please select at least one draft to delete')
      return
    }

    if (!confirm(`Are you sure you want to delete ${selectedDrafts.size} draft(s)?`)) {
      return
    }

    setIsDeleting(true)
    try {
      const deletePromises = Array.from(selectedDrafts).map(draftId =>
        fetch(`/api/drafts/${draftId}`, {
          method: 'DELETE',
        })
      )

      const results = await Promise.all(deletePromises)
      const failed = results.filter(r => !r.ok)

      if (failed.length > 0) {
        toast.error(`Failed to delete ${failed.length} draft(s)`)
      } else {
        toast.success(`Successfully deleted ${selectedDrafts.size} draft(s)`)
        setSelectedDrafts(new Set())
        await fetchDrafts()
      }
    } catch (error) {
      console.error('Error deleting drafts:', error)
      toast.error('Failed to delete drafts')
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle bulk publish
  const handleBulkPublish = async () => {
    if (selectedDrafts.size === 0) {
      toast.error('Please select at least one draft to publish')
      return
    }

    setIsPublishing(true)
    try {
      const publishPromises = Array.from(selectedDrafts).map(async (draftId) => {
        // Fetch draft details
        const draftResponse = await fetch(`/api/drafts/${draftId}`)
        if (!draftResponse.ok) {
          throw new Error(`Failed to fetch draft ${draftId}`)
        }
        const draft = await draftResponse.json()

        // Determine platforms to publish
        const platforms: ('linkedin' | 'twitter' | 'facebook' | 'instagram' | 'telegram' | 'threads')[] = []
        
        // Try to parse as JSON array first (for multi-select)
        let parsedPlatforms: string | string[] | null = null
        try {
          parsedPlatforms = JSON.parse(draft.platforms)
        } catch {
          // Not JSON, treat as string
          parsedPlatforms = draft.platforms
        }
        
        if (parsedPlatforms === 'all' || parsedPlatforms === 'both') {
          // 'all' means all available platforms, 'both' is backward compatibility
          platforms.push('linkedin', 'twitter', 'facebook', 'instagram', 'telegram', 'threads')
        } else if (Array.isArray(parsedPlatforms)) {
          // Multi-select: array of platforms
          platforms.push(...(parsedPlatforms.filter(p => 
            ['linkedin', 'twitter', 'facebook', 'instagram', 'telegram', 'threads'].includes(p)
          ) as ('linkedin' | 'twitter' | 'facebook' | 'instagram' | 'telegram' | 'threads')[]))
        } else if (parsedPlatforms === 'linkedin') {
          platforms.push('linkedin')
        } else if (parsedPlatforms === 'twitter') {
          platforms.push('twitter')
        } else if (parsedPlatforms === 'facebook') {
          platforms.push('facebook')
        } else if (parsedPlatforms === 'instagram') {
          platforms.push('instagram')
        } else if (parsedPlatforms === 'telegram') {
          platforms.push('telegram')
        } else if (parsedPlatforms === 'threads') {
          platforms.push('threads')
        }

        // Publish to each platform
        const platformPromises = platforms.map(async (platform) => {
          const content = platform === 'linkedin' 
            ? draft.linkedinContent 
            : platform === 'facebook'
            ? draft.facebookContent
            : platform === 'instagram'
            ? draft.instagramContent
            : platform === 'telegram'
            ? draft.telegramContent
            : platform === 'threads'
            ? draft.threadsContent
            : draft.twitterContent

          if (!content) {
            return { platform, success: false, error: 'No content for platform' }
          }

          // Parse Twitter content if it's a JSON string (thread)
          let twitterContent: string | string[] = content
          if (platform === 'twitter' && typeof content === 'string') {
            try {
              const parsed = JSON.parse(content)
              if (Array.isArray(parsed)) {
                twitterContent = parsed
              }
            } catch {
              // Keep as string if not valid JSON
            }
          }

          // For Telegram, get chatId from settings
          let telegramChatId: string | undefined = undefined
          if (platform === 'telegram') {
            try {
              const settingsResponse = await fetch('/api/settings')
              if (settingsResponse.ok) {
                const settings = await settingsResponse.json()
                telegramChatId = settings.telegramChatId || undefined
              }
            } catch (error) {
              console.error('Error fetching settings for Telegram chatId:', error)
            }
            
            // Skip if no chatId configured (can't prompt in bulk publish)
            if (!telegramChatId) {
              return { platform, success: false, error: 'Telegram channel ID not configured. Please set it in Settings.' }
            }
          }

          const publishResponse = await fetch('/api/posts/publish', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              platform,
              content: twitterContent,
              draftId: draft.id,
              imageUrl: draft.attachedImage || undefined,
              chatId: telegramChatId, // For Telegram
            }),
          })

          if (!publishResponse.ok) {
            const errorData = await publishResponse.json().catch(() => ({ error: 'Unknown error' }))
            return { platform, success: false, error: errorData.error || 'Failed to publish' }
          }

          return { platform, success: true }
        })

        const results = await Promise.all(platformPromises)
        return { draftId, results }
      })

      const allResults = await Promise.all(publishPromises)
      const successCount = allResults.filter(r => 
        r.results.every(p => p.success)
      ).length
      const partialCount = allResults.filter(r => 
        r.results.some(p => p.success) && r.results.some(p => !p.success)
      ).length
      const failedCount = allResults.filter(r => 
        r.results.every(p => !p.success)
      ).length

      if (successCount > 0) {
        toast.success(`Successfully published ${successCount} draft(s)`)
      }
      if (partialCount > 0) {
        toast.warning(`${partialCount} draft(s) partially published`)
      }
      if (failedCount > 0) {
        toast.error(`Failed to publish ${failedCount} draft(s)`)
      }

      setSelectedDrafts(new Set())
      await fetchDrafts()
    } catch (error) {
      console.error('Error publishing drafts:', error)
      toast.error('Failed to publish drafts')
    } finally {
      setIsPublishing(false)
    }
  }

  // Handle bulk schedule
  const handleBulkSchedule = async (scheduledAt: Date) => {
    if (selectedDrafts.size === 0) {
      toast.error('Please select at least one draft to schedule')
      return
    }

    setIsScheduling(true)
    try {
      const schedulePromises = Array.from(selectedDrafts).map(async (draftId) => {
        // Fetch draft details
        const draftResponse = await fetch(`/api/drafts/${draftId}`)
        if (!draftResponse.ok) {
          throw new Error(`Failed to fetch draft ${draftId}`)
        }
        const draft = await draftResponse.json()

        // Determine platforms to schedule
        const platforms: ('linkedin' | 'twitter' | 'facebook' | 'instagram' | 'telegram' | 'threads')[] = []
        
        // Try to parse as JSON array first (for multi-select)
        let parsedPlatforms: string | string[] | null = null
        try {
          parsedPlatforms = JSON.parse(draft.platforms)
        } catch {
          // Not JSON, treat as string
          parsedPlatforms = draft.platforms
        }
        
        if (parsedPlatforms === 'all' || parsedPlatforms === 'both') {
          // 'all' means all available platforms, 'both' is backward compatibility
          platforms.push('linkedin', 'twitter', 'facebook', 'instagram', 'telegram', 'threads')
        } else if (Array.isArray(parsedPlatforms)) {
          // Multi-select: array of platforms
          platforms.push(...(parsedPlatforms.filter(p => 
            ['linkedin', 'twitter', 'facebook', 'instagram', 'telegram', 'threads'].includes(p)
          ) as ('linkedin' | 'twitter' | 'facebook' | 'instagram' | 'telegram' | 'threads')[]))
        } else if (parsedPlatforms === 'linkedin') {
          platforms.push('linkedin')
        } else if (parsedPlatforms === 'twitter') {
          platforms.push('twitter')
        } else if (parsedPlatforms === 'facebook') {
          platforms.push('facebook')
        } else if (parsedPlatforms === 'instagram') {
          platforms.push('instagram')
        } else if (parsedPlatforms === 'telegram') {
          platforms.push('telegram')
        } else if (parsedPlatforms === 'threads') {
          platforms.push('threads')
        }

        // Schedule to each platform
        const platformPromises = platforms.map(async (platform) => {
          const content = platform === 'linkedin' 
            ? draft.linkedinContent 
            : platform === 'facebook'
            ? draft.facebookContent
            : platform === 'instagram'
            ? draft.instagramContent
            : platform === 'telegram'
            ? draft.telegramContent
            : platform === 'threads'
            ? draft.threadsContent
            : draft.twitterContent

          if (!content) {
            return { platform, success: false, error: 'No content for platform' }
          }

          // Parse Twitter content if it's a JSON string (thread)
          let twitterContent: string | string[] = content
          if (platform === 'twitter' && typeof content === 'string') {
            try {
              const parsed = JSON.parse(content)
              if (Array.isArray(parsed)) {
                twitterContent = parsed
              }
            } catch {
              // Keep as string if not valid JSON
            }
          }

          // Handle Twitter threads
          if (platform === 'twitter' && Array.isArray(twitterContent)) {
            // Schedule summary post first
            const summaryResponse = await fetch('/api/posts', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                platform: 'twitter',
                content: twitterContent[0],
                draftId: draft.id,
                scheduledAt: scheduledAt.toISOString(),
                status: 'scheduled',
                threadOrder: 0,
              }),
            })

            if (!summaryResponse.ok) {
              const errorData = await summaryResponse.json().catch(() => ({ error: 'Unknown error' }))
              return { platform, success: false, error: errorData.error || 'Failed to schedule summary post' }
            }

            const summaryPost = await summaryResponse.json()

            // Schedule reply posts
            const replyPromises = twitterContent.slice(1).map(async (replyContent, index) => {
              const replyResponse = await fetch('/api/posts', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  platform: 'twitter',
                  content: replyContent,
                  draftId: draft.id,
                  parentPostId: summaryPost.id,
                  scheduledAt: scheduledAt.toISOString(),
                  status: 'scheduled',
                  threadOrder: index + 1,
                }),
              })

              if (!replyResponse.ok) {
                const errorData = await replyResponse.json().catch(() => ({ error: 'Unknown error' }))
                return { success: false, error: errorData.error || 'Failed to schedule reply' }
              }

              return { success: true }
            })

            const replyResults = await Promise.all(replyPromises)
            const failedReplies = replyResults.filter(r => !r.success)
            
            if (failedReplies.length > 0) {
              return { platform, success: false, error: `Failed to schedule ${failedReplies.length} reply post(s)` }
            }

            return { platform, success: true }
          } else {
            // Single post (LinkedIn, Facebook, Instagram, Telegram, Threads, or single Twitter post)
            const postContent = typeof twitterContent === 'string' ? twitterContent : twitterContent[0]
            console.log(`[Bulk Schedule] Scheduling ${platform} post for draft ${draft.id}`, {
              platform,
              contentLength: postContent?.length || 0,
              scheduledAt: scheduledAt.toISOString(),
            })
            
            const scheduleResponse = await fetch('/api/posts', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                platform,
                content: postContent,
                draftId: draft.id,
                scheduledAt: scheduledAt.toISOString(),
                status: 'scheduled',
                imageUrl: draft.attachedImage || undefined,
              }),
            })

            if (!scheduleResponse.ok) {
              const errorData = await scheduleResponse.json().catch(() => ({ error: 'Unknown error' }))
              console.error(`[Bulk Schedule] Failed to schedule ${platform} post:`, errorData)
              return { platform, success: false, error: errorData.error || 'Failed to schedule' }
            }

            const scheduledPost = await scheduleResponse.json()
            console.log(`[Bulk Schedule] Successfully scheduled ${platform} post:`, scheduledPost.id)
            return { platform, success: true }
          }
        })

        const results = await Promise.all(platformPromises)
        return { draftId, results }
      })

      const allResults = await Promise.all(schedulePromises)
      const successCount = allResults.filter(r => 
        r.results.every(p => p.success)
      ).length
      const partialCount = allResults.filter(r => 
        r.results.some(p => p.success) && r.results.some(p => !p.success)
      ).length
      const failedCount = allResults.filter(r => 
        r.results.every(p => !p.success)
      ).length

      if (successCount > 0) {
        toast.success(`Successfully scheduled ${successCount} draft(s)`, {
          description: `Scheduled for ${scheduledAt.toLocaleDateString()}`,
        })
      }
      if (partialCount > 0) {
        toast.warning(`${partialCount} draft(s) partially scheduled`)
      }
      if (failedCount > 0) {
        toast.error(`Failed to schedule ${failedCount} draft(s)`)
      }

      setSelectedDrafts(new Set())
      setShowBulkScheduleModal(false)
      await fetchDrafts()
    } catch (error) {
      console.error('Error scheduling drafts:', error)
      toast.error('Failed to schedule drafts')
    } finally {
      setIsScheduling(false)
    }
  }

  // Clear selection when filter changes
  useEffect(() => {
    setSelectedDrafts(new Set())
    setLastSelectedIndex(null)
  }, [filter])

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

      {/* Bulk Actions Bar - Only show in Drafts tab when items are selected */}
      {filter === 'draft' && selectedDrafts.size > 0 && (
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
      )}

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

      {/* Bulk Schedule Modal */}
      {showBulkScheduleModal && (
        <ScheduleModal
          isOpen={showBulkScheduleModal}
          onClose={() => setShowBulkScheduleModal(false)}
          onSchedule={handleBulkSchedule}
          platform="linkedin" // Default platform, but handleBulkSchedule handles all platforms
          content={`Scheduling ${selectedDrafts.size} draft(s)`}
        />
      )}
    </div>
  )
}

