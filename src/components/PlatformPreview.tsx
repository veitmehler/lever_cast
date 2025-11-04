'use client'

import { useState } from 'react'
import { Copy, RotateCw, Send, Check, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PlatformPreviewProps {
  platform: 'linkedin' | 'twitter'
  content: string
  image?: string
  onRegenerate: () => void
  onPublish: () => void
}

// Platform character limits
const CHAR_LIMITS = {
  linkedin: 3000,
  twitter: 280,
}

export function PlatformPreview({
  platform,
  content,
  image,
  onRegenerate,
  onPublish,
}: PlatformPreviewProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(content)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(editedContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSave = () => {
    setIsEditing(false)
    // In real implementation, would save the edited content
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
  }

  const config = platformColors[platform]

  // Character count logic
  const charLimit = CHAR_LIMITS[platform]
  const charCount = editedContent.length
  const charPercentage = (charCount / charLimit) * 100

  // Determine color based on percentage
  const getCharCountColor = () => {
    if (charCount > charLimit) {
      return 'text-red-500 dark:text-red-400 font-bold'
    } else if (charPercentage >= 95) {
      return 'text-red-600 dark:text-red-500 font-semibold'
    } else if (charPercentage >= 80) {
      return 'text-yellow-600 dark:text-yellow-400 font-medium'
    }
    return 'text-muted-foreground'
  }

  const isOverLimit = charCount > charLimit

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Platform Header */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ backgroundColor: config.bg }}
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
        {/* Mock User Info */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
            JD
          </div>
          <div>
            <div className="font-semibold text-card-foreground text-sm">John Doe</div>
            <div className="text-xs text-muted-foreground">Just now</div>
          </div>
        </div>

        {/* Editable Content */}
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full min-h-[150px] p-3 rounded-lg border border-input bg-background text-foreground text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
            
            {/* Show attached image in edit mode too */}
            {image && (
              <div className="mt-2">
                <img 
                  src={image} 
                  alt="Attached to post" 
                  className="rounded-lg max-h-48 w-full object-cover border border-border"
                />
              </div>
            )}
            
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
                  setEditedContent(content)
                }}
                size="sm"
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div
              onClick={() => setIsEditing(true)}
              className="text-card-foreground text-sm whitespace-pre-wrap leading-relaxed cursor-pointer hover:bg-secondary/50 p-2 rounded transition-colors"
            >
              {editedContent}
            </div>
            
            {/* Attached Image */}
            {image && (
              <div className="mt-3">
                <img 
                  src={image} 
                  alt="Attached to post" 
                  className="rounded-lg max-h-64 w-full object-cover border border-border"
                />
              </div>
            )}
          </>
        )}

        {/* Character Count & Mock Engagement Stats */}
        {!isEditing && (
          <>
            {/* Character Counter */}
            <div className="mt-3 flex items-center justify-between">
              <div className={cn('text-xs flex items-center gap-1.5', getCharCountColor())}>
                {isOverLimit && <AlertCircle className="w-3.5 h-3.5" />}
                <span>
                  {charCount.toLocaleString()} / {charLimit.toLocaleString()} characters
                </span>
                {isOverLimit && (
                  <span className="ml-1 px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 rounded text-[10px] uppercase">
                    Over Limit
                  </span>
                )}
              </div>
            </div>

            {/* Mock Engagement Stats */}
            <div className="mt-3 pt-3 border-t border-border flex items-center gap-4 text-xs text-muted-foreground">
              <span>👍 12</span>
              <span>💬 3</span>
              <span>🔄 2</span>
              <span>📤 1</span>
            </div>
          </>
        )}

        {/* Character Counter in Edit Mode */}
        {isEditing && (
          <div className={cn('mt-2 text-xs flex items-center gap-1.5', getCharCountColor())}>
            {isOverLimit && <AlertCircle className="w-3.5 h-3.5" />}
            <span>
              {charCount.toLocaleString()} / {charLimit.toLocaleString()} characters
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
      <div className="p-4 border-t border-border flex items-center gap-2">
        <Button
          onClick={handleCopy}
          size="sm"
          variant="outline"
          className="flex-1"
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
          className="flex-1"
        >
          <RotateCw className="w-4 h-4 mr-2" />
          Regenerate
        </Button>
        <Button
          onClick={onPublish}
          size="sm"
          className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={isOverLimit}
          title={isOverLimit ? 'Cannot publish - content exceeds character limit' : 'Publish to platform'}
        >
          <Send className="w-4 h-4 mr-2" />
          Publish
        </Button>
      </div>
    </div>
  )
}

