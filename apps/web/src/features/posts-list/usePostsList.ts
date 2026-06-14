import { useState, useEffect, type MouseEvent, type ChangeEvent } from 'react'
import { toast } from 'sonner'
import type { Draft, FilterStatus } from './types'

export function usePostsList() {
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
  const handleSelectDraft = (draftId: string, index: number, event: MouseEvent) => {
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
  const handleSelectAll = (event: ChangeEvent<HTMLInputElement>) => {
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

  return {
    filter,
    setFilter,
    drafts,
    isLoading,
    selectedDrafts,
    setSelectedDrafts,
    lastSelectedIndex,
    setLastSelectedIndex,
    isDeleting,
    isPublishing,
    isScheduling,
    showBulkScheduleModal,
    setShowBulkScheduleModal,
    filteredPosts,
    scheduledDrafts,
    handleSelectAll,
    handleBulkDelete,
    handleBulkPublish,
    handleBulkSchedule,
  }
}

export type PostsListView = ReturnType<typeof usePostsList>
