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
  draft?: {
    id: string
    title: string
  }
}

interface ContentCalendarProps {
  postsByDate: Record<string, Post[]>
  onDateSelect?: (date: Date) => void
}

export function ContentCalendar({ postsByDate, onDateSelect }: ContentCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())

  const selectedDateKey = format(selectedDate, 'yyyy-MM-dd')
  const selectedPosts = postsByDate[selectedDateKey] || []

  const handleDateChange = (date: Date) => {
    setSelectedDate(date)
    onDateSelect?.(date)
  }

  const getPostsForDate = (date: Date): Post[] => {
    const dateKey = format(date, 'yyyy-MM-dd')
    return postsByDate[dateKey] || []
  }

  const getPostCount = (date: Date): number => {
    return getPostsForDate(date).length
  }

  const hasPublishedPosts = (date: Date): boolean => {
    return getPostsForDate(date).some(p => p.status === 'published')
  }

  const hasScheduledPosts = (date: Date): boolean => {
    return getPostsForDate(date).some(p => p.status === 'scheduled')
  }

  // Custom tile content for calendar
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return null

    const postCount = getPostCount(date)
    const hasPublished = hasPublishedPosts(date)
    const hasScheduled = hasScheduledPosts(date)

    if (postCount === 0) return null

    return (
      <div className="flex items-center justify-center gap-1 mt-1">
        {hasPublished && (
          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
        )}
        {hasScheduled && (
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
        )}
        {postCount > 0 && (
          <span className="text-[10px] text-muted-foreground font-medium">
            {postCount}
          </span>
        )}
      </div>
    )
  }

  // Custom tile className
  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return ''

    const classes = []
    
    if (isToday(date)) {
      classes.push('!bg-primary/10 !border-primary !border-2')
    }
    
    if (isSameDay(date, selectedDate)) {
      classes.push('!bg-primary/20')
    }

    const hasPublished = hasPublishedPosts(date)
    const hasScheduled = hasScheduledPosts(date)

    if (hasPublished && !hasScheduled) {
      classes.push('hover:bg-green-50 dark:hover:bg-green-900/20')
    } else if (hasScheduled && !hasPublished) {
      classes.push('hover:bg-orange-50 dark:hover:bg-orange-900/20')
    } else if (hasPublished && hasScheduled) {
      classes.push('hover:bg-blue-50 dark:hover:bg-blue-900/20')
    }

    return classes.join(' ')
  }

  return (
    <div className="space-y-6">
      {/* Calendar */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-card-foreground">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const prevMonth = new Date(currentMonth)
                prevMonth.setMonth(prevMonth.getMonth() - 1)
                setCurrentMonth(prevMonth)
              }}
              className="rounded-lg p-1 hover:bg-muted transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentMonth(new Date())}
              className="rounded-lg px-3 py-1 text-sm hover:bg-muted transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => {
                const nextMonth = new Date(currentMonth)
                nextMonth.setMonth(nextMonth.getMonth() + 1)
                setCurrentMonth(nextMonth)
              }}
              className="rounded-lg p-1 hover:bg-muted transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <Calendar
          value={selectedDate}
          onChange={(value) => handleDateChange(value as Date)}
          activeStartDate={currentMonth}
          onActiveStartDateChange={({ activeStartDate }) => {
            if (activeStartDate) {
              setCurrentMonth(activeStartDate)
            }
          }}
          tileContent={tileContent}
          tileClassName={tileClassName}
          className="w-full !border-0"
        />

        {/* Legend */}
        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <span>Published</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
            <span>Scheduled</span>
          </div>
        </div>
      </div>

      {/* Day View */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">
          {format(selectedDate, 'EEEE, MMMM d, yyyy')}
        </h3>
        <CalendarDayView date={selectedDate} posts={selectedPosts} />
      </div>
    </div>
  )
}

