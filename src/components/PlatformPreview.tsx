'use client'

import { useState, useEffect } from 'react'
import { Copy, RotateCw, Send, Check, AlertCircle, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ScheduleModal } from './ScheduleModal'
import Image from 'next/image'

interface PlatformPreviewProps {
  platform: 'linkedin' | 'twitter' | 'facebook' | 'instagram' | 'telegram' | 'threads'
  content: string | string[] // Support both single post and thread
  image?: string
  onRegenerate: () => void | Promise<void>
  onPublish: (content: string | string[]) => void
  onSchedule?: (content: string | string[], scheduledAt: Date) => Promise<void>
  onReschedule?: (postId: string, scheduledAt: Date) => Promise<void>
  onContentChange?: (platform: 'linkedin' | 'twitter' | 'facebook' | 'instagram' | 'telegram' | 'threads', newContent: string | string[]) => void
  userName?: string
  userInitials?: string
  isPublished?: boolean
  publishedDate?: Date | null
  isScheduled?: boolean
  scheduledDate?: Date | null
  scheduledPostId?: string | null
  isRegenerating?: boolean
}

// Platform character limits (with safety buffer) - used for generation
const CHAR_LIMITS = {
  linkedin: 2500,
  twitter: 280,
  facebook: 1800,
  instagram: 1800,
  telegram: 900,
  threads: 450,
}

// Actual platform limits (where truncation happens) - used for display
const PLATFORM_DISPLAY_LIMITS = {
  linkedin: 3000,
  twitter: 280,
  facebook: 2000,
  instagram: 2000,
  telegram: 1000,
  threads: 500,
}

export function PlatformPreview({
  platform,
  content,
  image,
  onRegenerate,
  onPublish,
  onSchedule,
  onReschedule,
  onContentChange,
  userName = 'John Doe',
  userInitials = 'JD',
  isPublished = false,
  publishedDate = null,
  isScheduled = false,
  scheduledDate = null,
  scheduledPostId = null,
  isRegenerating = false,
}: PlatformPreviewProps) {
  // Parse content to determine if it's a thread
  const [tweets, setTweets] = useState<string[]>([])
  const [isThread, setIsThread] = useState(false)
  
  useEffect(() => {
    if (Array.isArray(content)) {
      setTweets(content)
      setIsThread(true)
    } else if (typeof content === 'string') {
      // Try to parse as JSON array
      try {
        const parsed = JSON.parse(content)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTweets(parsed)
          setIsThread(true)
        } else {
          setTweets([content])
          setIsThread(false)
        }
      } catch {
        // Not JSON, treat as single tweet
        setTweets([content])
        setIsThread(false)
      }
    } else {
      setTweets([])
      setIsThread(false)
    }
  }, [content])

  const [isEditing, setIsEditing] = useState(false)
  const [editedTweets, setEditedTweets] = useState<string[]>(tweets)
  const [copied, setCopied] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [isRescheduling, setIsRescheduling] = useState(false)

  // Update editedTweets when tweets change
  useEffect(() => {
    setEditedTweets(tweets)
  }, [tweets])

  const handleCopy = async () => {
    const textToCopy = isThread 
      ? editedTweets.join('\n\n') 
      : editedTweets[0] || ''
    await navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSave = () => {
    setIsEditing(false)
    // Notify parent component of content change
    if (onContentChange) {
      const newContent = isThread ? editedTweets : editedTweets[0]
      const currentContent = isThread ? tweets : tweets[0]
      if (JSON.stringify(newContent) !== JSON.stringify(currentContent)) {
        onContentChange(platform, newContent)
      }
    }
  }

  const platformColors = {
    linkedin: {
      bg: '#0A66C2',
      name: 'LinkedIn',
      icon: 'in',
    },
    twitter: {
      bg: '#1DA1F2',
      name: 'Twitter',
      icon: '𝕏',
    },
    facebook: {
      bg: '#1877F2',
      name: 'Facebook',
      icon: 'f',
    },
    instagram: {
      bg: '#E4405F', // Instagram pink
      name: 'Instagram',
      icon: '📷',
    },
    telegram: {
      bg: '#0088cc',
      name: 'Telegram',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" fill="currentColor"/>
        </svg>
      ),
    },
    threads: {
      bg: '#000000',
      name: 'Threads',
      icon: '@',
    },
  }

  const config = platformColors[platform]

  // Character count logic - handle threads
  const charLimit = CHAR_LIMITS[platform] // Safety buffer limit for generation
  const displayLimit = PLATFORM_DISPLAY_LIMITS[platform] // Actual platform limit for display
  const totalChars = editedTweets.reduce((sum, tweet) => sum + tweet.length, 0)
  const maxChars = isThread ? editedTweets.length * charLimit : charLimit
  const isOverLimit = editedTweets.some(tweet => tweet.length > displayLimit) // Check against actual platform limit
  const charPercentage = (totalChars / maxChars) * 100

  // Determine color based on percentage
  const getCharCountColor = () => {
    if (isOverLimit) {
      return 'text-red-500 dark:text-red-400 font-bold'
    } else if (charPercentage >= 95) {
      return 'text-red-600 dark:text-red-500 font-semibold'
    } else if (charPercentage >= 80) {
      return 'text-yellow-600 dark:text-yellow-400 font-medium'
    }
    return 'text-muted-foreground'
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Platform Header */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={platform === 'instagram' 
          ? { background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' }
          : platform === 'threads'
          ? { backgroundColor: '#000000', color: '#ffffff' }
          : { backgroundColor: config.bg }
        }
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-white flex items-center justify-center text-sm font-bold text-gray-900">
            {config.icon}
          </div>
          <span className="text-white font-semibold">{config.name}</span>
        </div>
        <span className="text-white/80 text-xs">Preview</span>
      </div>


      {/* Action Buttons */}
      <div className="p-4 border-t border-border flex items-center gap-2 flex-wrap">
        <Button
          onClick={handleCopy}
          size="sm"
          variant="outline"
          className="flex-1 min-h-[44px]"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </>
          )}
        </Button>
        <Button
          onClick={onRegenerate}
          size="sm"
          variant="outline"
          className="flex-1 min-h-[44px]"
          disabled={isRegenerating}
        >
          {isRegenerating ? (
            <>
              <RotateCw className="w-4 h-4 mr-2 animate-spin" />
              Regenerating...
            </>
          ) : (
            <>
              <RotateCw className="w-4 h-4 mr-2" />
              Regenerate
            </>
          )}
        </Button>
        {isScheduled ? (
          <Button
            onClick={() => {
              if (onReschedule && scheduledPostId) {
                setIsRescheduling(true)
                setShowScheduleModal(true)
              }
            }}
            size="sm"
            className="flex-1 min-h-[44px] bg-orange-500 text-white hover:bg-orange-600"
            disabled={!onReschedule || !scheduledPostId}
            title={scheduledDate ? `Scheduled for ${scheduledDate.toLocaleDateString()}` : 'Scheduled'}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Change Publish Date
          </Button>
        ) : isPublished ? (
          <Button
            size="sm"
            className="flex-1 min-h-[44px] bg-green-600 text-white hover:bg-green-700"
            disabled
            title={`Published to ${platform}`}
          >
            <Check className="w-4 h-4 mr-2" />
            Published
          </Button>
        ) : (
          <div className="flex-1 flex gap-1">
            <Button
              onClick={() => onPublish(isThread ? editedTweets : editedTweets[0])}
              size="sm"
              className="flex-1 min-h-[44px] bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={isOverLimit}
              title={isOverLimit ? 'Cannot publish - content exceeds character limit' : 'Publish now'}
            >
              <Send className="w-4 h-4 mr-2" />
              Publish Now
            </Button>
            {onSchedule && (
              <Button
                onClick={() => setShowScheduleModal(true)}
                size="sm"
                variant="outline"
                className="min-h-[44px] px-3"
                disabled={isOverLimit}
                title="Schedule for later"
              >
                <Calendar className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
        {(onSchedule || onReschedule) && (
          <ScheduleModal
            isOpen={showScheduleModal}
            onClose={() => {
              setShowScheduleModal(false)
              setIsRescheduling(false)
            }}
            onSchedule={async (scheduledAt) => {
              if (isRescheduling && onReschedule && scheduledPostId) {
                try {
                  await onReschedule(scheduledPostId, scheduledAt)
                  setShowScheduleModal(false)
                  setIsRescheduling(false)
                } catch {
                  // Error handled by parent
                  setIsRescheduling(false)
                }
              } else if (onSchedule) {
                await onSchedule(isThread ? editedTweets : editedTweets[0], scheduledAt)
              }
            }}
            platform={platform}
            content={isThread ? editedTweets.join('\n\n') : editedTweets[0] || ''}
            initialDate={isScheduled ? scheduledDate : null}
            isReschedule={isRescheduling || isScheduled}
          />
        )}
      </div>
    </div>
  )
}

