'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import { ContentCalendar } from '@/components/ContentCalendar'
import { format, startOfMonth, endOfMonth } from 'date-fns'

type Post = {
  id: string
  platform: string
  status: string
  content: string
  publishedAt: string | null
  scheduledAt: string | null
  draftId: string | null
  postType?: string | null
  slotKey?: string | null
  automationRunId?: string | null
  draft?: { id: string; title: string }
  automationRun?: {
    id: string
    scheduledDate: string
    status: string
    jobId: string | null
  } | null
}

type AutomationRun = {
  id: string
  scheduledDate: string
  status: string
  completedSpecs: number
  failedSpecs: number
  totalSpecs: number
  currentSpec: string | null
  error: string | null
  jobId: string | null
  specResults: Array<{
    id: string
    slotKey: string
    status: string
    error: string | null
    postsCreated: number
  }>
  _count?: { posts: number }
  job?: { id: string; topic: { topic: string } }
}

export default function CalendarPage() {
  const [postsByDate, setPostsByDate] = useState<Record<string, Post[]>>({})
  const [runsByDate, setRunsByDate] = useState<Record<string, AutomationRun[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [currentMonth] = useState(new Date())

  const fetchCalendarPosts = useCallback(async () => {
    try {
      setIsLoading(true)
      const start = startOfMonth(currentMonth)
      const end = endOfMonth(currentMonth)

      const response = await fetch(
        `/api/posts/calendar?startDate=${format(start, 'yyyy-MM-dd')}&endDate=${format(end, 'yyyy-MM-dd')}`,
      )

      if (!response.ok) throw new Error('Failed to fetch calendar posts')

      const data = await response.json()
      setPostsByDate(data.postsByDate ?? data)
      setRunsByDate(data.runsByDate ?? {})
    } catch (error) {
      console.error('Error fetching calendar posts:', error)
    } finally {
      setIsLoading(false)
    }
  }, [currentMonth])

  useEffect(() => {
    void fetchCalendarPosts()
  }, [fetchCalendarPosts])

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto text-center py-12">
        <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Loading calendar...</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Content Calendar</h1>
        <p className="text-muted-foreground">
          View scheduled posts, automation runs, and retry failed specs
        </p>
      </div>

      <ContentCalendar
        postsByDate={postsByDate}
        runsByDate={runsByDate}
        onRefresh={fetchCalendarPosts}
      />
    </div>
  )
}
