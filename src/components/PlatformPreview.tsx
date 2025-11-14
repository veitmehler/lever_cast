'use client'

import { useState, useEffect } from 'react'
import { Copy, RotateCw, Send, Check, AlertCircle, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ScheduleModal } from './ScheduleModal'

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

// Platform character limits
const CHAR_LIMITS = {
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
      icon: '✈',
    },
    threads: {
      bg: '#000000',
      name: 'Threads',
      icon: '@',
    },
  }

  const config = platformColors[platform]

  // Character count logic - handle threads
  const charLimit = CHAR_LIMITS[platform]
  const totalChars = editedTweets.reduce((sum, tweet) => sum + tweet.length, 0)
  const maxChars = isThread ? editedTweets.length * charLimit : charLimit
  const isOverLimit = editedTweets.some(tweet => tweet.length > charLimit)
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
          <div className="w-8 h-8 rounded bg-white flex items-center justify-center text-sm font-bold">
            {config.icon}
          </div>
          <span className="text-white font-semibold">{config.name}</span>
        </div>
        <span className="text-white/80 text-xs">Preview</span>
      </div>

      {/* Mock Platform UI */}
      <div className="p-4 bg-secondary/30">
        {/* User Info */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
            {userInitials}
          </div>
          <div>
            <div className="font-semibold text-card-foreground text-sm">{userName}</div>
            <div className="text-xs text-muted-foreground">
              {isScheduled && scheduledDate
                ? `Scheduled for ${scheduledDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}`
                : isPublished && publishedDate
                  ? `Published ${publishedDate.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}`
                  : 'Just now'}
            </div>
          </div>
        </div>

        {/* Attached Image */}
        {image && (
          <div className="mb-3">
            <img 
              src={image} 
              alt="Attached to post" 
              className="rounded-lg max-h-64 w-full object-cover border border-border"
            />
          </div>
        )}

        {/* Editable Content */}
        {isEditing ? (
          <div className="space-y-4">
            {editedTweets.map((tweet, index) => {
              const isSummary = index === 0
              const isReply = index > 0
              
              return (
                <div key={index} className="space-y-2">
                  {isThread && (
                    <div className="flex items-center gap-2 mb-1">
                      {isSummary ? (
                        <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded">
                          📌 Summary Post
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                          💬 Reply {index}/{editedTweets.length - 1}
                        </span>
                      )}
                    </div>
                  )}
                  <textarea
                    value={tweet}
                    onChange={(e) => {
                      const updated = [...editedTweets]
                      updated[index] = e.target.value
                      setEditedTweets(updated)
                    }}
                    className={cn(
                      "w-full min-h-[150px] p-3 rounded-lg border border-input bg-background text-foreground text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none",
                      isSummary && "border-l-4 border-primary",
                      isReply && "border-l-4 border-muted"
                    )}
                  />
                  <div className={cn('text-xs flex items-center gap-1.5', 
                    tweet.length > charLimit ? 'text-red-500 dark:text-red-400 font-bold' : 'text-muted-foreground'
                  )}>
                    {tweet.length > charLimit && <AlertCircle className="w-3.5 h-3.5" />}
                    <span>
                      {tweet.length.toLocaleString()} / {charLimit.toLocaleString()} characters
                    </span>
                    {tweet.length > charLimit && (
                      <span className="ml-1 px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 rounded text-[10px] uppercase">
                        Over Limit
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
            
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Save Changes
              </Button>
              <Button
                onClick={() => {
                  setIsEditing(false)
                  setEditedTweets(tweets)
                }}
                size="sm"
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {editedTweets.map((tweet, index) => {
              const isSummary = index === 0
              const isReply = index > 0
              
              return (
                <div 
                  key={index}
                  onClick={() => setIsEditing(true)}
                  className={cn(
                    "text-card-foreground text-sm whitespace-pre-wrap leading-relaxed cursor-pointer hover:bg-secondary/50 p-3 rounded transition-colors",
                    isSummary && "border-l-4 border-primary bg-primary/5",
                    isReply && "border-l-4 border-muted ml-4"
                  )}
                >
                  {isThread && (
                    <div className="flex items-center gap-2 mb-2">
                      {isSummary ? (
                        <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded">
                          📌 Summary Post
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                          💬 Reply {index}/{editedTweets.length - 1}
                        </span>
                      )}
                    </div>
                  )}
                  <div className={isReply ? "text-muted-foreground" : ""}>
                    {tweet}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Character Count */}
        {!isEditing && (
          <div className="mt-3 flex items-center justify-between">
            <div className={cn('text-xs flex items-center gap-1.5', getCharCountColor())}>
              {isOverLimit && <AlertCircle className="w-3.5 h-3.5" />}
              <span>
                {isThread 
                  ? `${editedTweets.length} tweets • ${totalChars.toLocaleString()} total chars`
                  : `${editedTweets[0]?.length.toLocaleString() || 0} / ${charLimit.toLocaleString()} characters`
                }
              </span>
              {isOverLimit && (
                <span className="ml-1 px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 rounded text-[10px] uppercase">
                  Over Limit
                </span>
              )}
            </div>
          </div>
        )}

        {/* Character Counter in Edit Mode */}
        {isEditing && (
          <div className={cn('mt-2 text-xs flex items-center gap-1.5', getCharCountColor())}>
            {isOverLimit && <AlertCircle className="w-3.5 h-3.5" />}
            <span>
              {isThread 
                ? `${editedTweets.length} tweets • ${totalChars.toLocaleString()} total chars`
                : `${editedTweets[0]?.length.toLocaleString() || 0} / ${charLimit.toLocaleString()} characters`
              }
            </span>
            {isOverLimit && (
              <span className="ml-1 px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 rounded text-[10px] uppercase">
                Over Limit
              </span>
            )}
          </div>
        )}
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
                } catch (error) {
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

