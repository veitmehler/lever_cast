'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { cn } from '@/lib/utils'

interface ScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  onSchedule: (scheduledAt: Date) => Promise<void>
  platform: 'linkedin' | 'twitter'
  content: string
  initialDate?: Date | null
  isReschedule?: boolean
}

export function ScheduleModal({
  isOpen,
  onClose,
  onSchedule,
  platform,
  content,
  initialDate,
  isReschedule = false,
}: ScheduleModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
    // Use initial date if provided (for rescheduling), otherwise default to tomorrow at 9 AM
    if (initialDate) {
      return new Date(initialDate)
    }
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(9, 0, 0, 0)
    return tomorrow
  })
  const [isScheduling, setIsScheduling] = useState(false)

  // Update selectedDate when initialDate changes (for rescheduling)
  useEffect(() => {
    if (initialDate && isOpen) {
      setSelectedDate(new Date(initialDate))
    }
  }, [initialDate, isOpen])

  if (!isOpen) return null

  const handleSchedule = async () => {
    if (!selectedDate) return

    if (selectedDate <= new Date()) {
      alert('Please select a future date and time')
      return
    }

    setIsScheduling(true)
    try {
      await onSchedule(selectedDate)
      onClose()
    } catch (error) {
      console.error('Error scheduling:', error)
    } finally {
      setIsScheduling(false)
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-50 w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-card-foreground">
              {isReschedule ? 'Reschedule Post' : 'Schedule Post'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isReschedule 
                ? `Choose a new date and time to publish to ${platform}`
                : `Choose when to publish to ${platform}`
              }
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Date Picker */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-card-foreground">
            <Calendar className="w-4 h-4 inline mr-2" />
            Date & Time
          </label>
          <div className="mt-2">
            <DatePicker
              selected={selectedDate}
              onChange={(date: Date | null) => setSelectedDate(date)}
              showTimeSelect
              timeIntervals={15}
              dateFormat="MMMM d, yyyy h:mm aa"
              minDate={new Date()}
              className={cn(
                'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm',
                'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'
              )}
              wrapperClassName="w-full"
            />
          </div>
          {selectedDate && (
            <div className="mt-2 rounded-lg bg-muted p-3">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Scheduled for:{' '}
                  <span className="font-medium text-foreground">
                    {formatDate(selectedDate)} at {formatTime(selectedDate)}
                  </span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Content Preview */}
        <div className="mb-4 rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Post Preview
          </p>
          <p className="text-sm text-card-foreground line-clamp-3">
            {content}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
            disabled={isScheduling}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSchedule}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={!selectedDate || isScheduling}
          >
            {isScheduling 
              ? (isReschedule ? 'Rescheduling...' : 'Scheduling...')
              : (isReschedule ? 'Reschedule Post' : 'Schedule Post')
            }
          </Button>
        </div>
      </div>
    </div>
  )
}

