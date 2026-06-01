'use client'

import { useState } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, isSameDay, isToday } from 'date-fns'
import { CalendarDayView } from './CalendarDayView'

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

type SpecResult = {
  id: string
  slotKey: string
  status: string
  error: string | null
  postsCreated: number
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
  specResults: SpecResult[]
  _count?: { posts: number }
  job?: { id: string; topic: { topic: string } }
}

interface ContentCalendarProps {
  postsByDate: Record<string, Post[]>
  runsByDate: Record<string, AutomationRun[]>
  onRefresh?: () => void
}

export function ContentCalendar({ postsByDate, runsByDate, onRefresh }: ContentCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())

  const selectedDateKey = format(selectedDate, 'yyyy-MM-dd')
  const selectedPosts = postsByDate[selectedDateKey] || []
  const selectedRuns = runsByDate[selectedDateKey] || []

  const getPostsForDate = (date: Date): Post[] => {
    return postsByDate[format(date, 'yyyy-MM-dd')] || []
  }

  const getRunsForDate = (date: Date): AutomationRun[] => {
    return runsByDate[format(date, 'yyyy-MM-dd')] || []
  }

  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return null

    const postCount = getPostsForDate(date).length
    const runs = getRunsForDate(date)
    const hasFailedRun = runs.some((r) => r.status === 'failed' || r.failedSpecs > 0)
    const hasActiveRun = runs.some((r) => r.status === 'pending' || r.status === 'processing')

    if (postCount === 0 && runs.length === 0) return null

    return (
      <div className="flex items-center justify-center gap-1 mt-1 flex-wrap">
        {hasFailedRun && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
        {hasActiveRun && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
        {postCount > 0 && (
          <span className="text-[10px] text-muted-foreground font-medium">{postCount}</span>
        )}
      </div>
    )
  }

  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return ''

    const classes: string[] = []
    if (isToday(date)) classes.push('!bg-primary/10 !border-primary !border-2')
    if (isSameDay(date, selectedDate)) classes.push('!bg-primary/20')

    const posts = getPostsForDate(date)
    const runs = getRunsForDate(date)
    if (runs.some((r) => r.status === 'failed' || r.failedSpecs > 0)) {
      classes.push('hover:bg-red-50 dark:hover:bg-red-900/20')
    } else if (posts.some((p) => p.status === 'scheduled')) {
      classes.push('hover:bg-orange-50 dark:hover:bg-orange-900/20')
    } else if (posts.some((p) => p.status === 'published')) {
      classes.push('hover:bg-green-50 dark:hover:bg-green-900/20')
    }

    return classes.join(' ')
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-card-foreground">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
              }
              className="p-1 rounded hover:bg-muted"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() =>
                setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
              }
              className="p-1 rounded hover:bg-muted"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <Calendar
          onChange={(value) => value instanceof Date && setSelectedDate(value)}
          value={selectedDate}
          activeStartDate={currentMonth}
          onActiveStartDateChange={({ activeStartDate }) =>
            activeStartDate && setCurrentMonth(activeStartDate)
          }
          tileContent={tileContent}
          tileClassName={tileClassName}
          className="w-full border-0 bg-transparent"
        />

        <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500" /> Published
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-orange-500" /> Scheduled
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" /> Automation failed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" /> Automation running
          </span>
        </div>
      </div>

      <CalendarDayView
        date={selectedDate}
        posts={selectedPosts}
        runs={selectedRuns}
        onRetryComplete={onRefresh}
      />
    </div>
  )
}
