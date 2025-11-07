'use client'

import { useState, useEffect } from 'react'
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
  draft?: {
    id: string
    title: string
  }
}

export default function CalendarPage() {
  const [postsByDate, setPostsByDate] = useState<Record<string, Post[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  useEffect(() => {
    fetchCalendarPosts()
  }, [currentMonth])

  const fetchCalendarPosts = async () => {
    try {
      setIsLoading(true)
      const start = startOfMonth(currentMonth)
      const end = endOfMonth(currentMonth)

      const response = await fetch(
        `/api/posts/calendar?startDate=${format(start, 'yyyy-MM-dd')}&endDate=${format(end, 'yyyy-MM-dd')}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch calendar posts')
      }

      const data = await response.json()
      setPostsByDate(data)
    } catch (error) {
      console.error('Error fetching calendar posts:', error)
    } finally {
      setIsLoading(false)
    }
  }

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
          View and manage your published and scheduled posts
        </p>
      </div>

      <ContentCalendar postsByDate={postsByDate} />
    </div>
  )
}

