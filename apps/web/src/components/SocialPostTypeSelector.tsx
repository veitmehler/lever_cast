'use client'

import { cn } from '@/lib/utils'
import type { SocialPostType } from '@/lib/social/types'

const POST_TYPES: { id: SocialPostType; label: string; description: string }[] = [
  { id: 'standard', label: 'Text + Image', description: 'Classic post with optional single image' },
  { id: 'quote', label: 'Quote Card', description: 'Branded quote image (1:1 or story)' },
  { id: 'carousel', label: 'Image Carousel', description: 'Multi-slide branded carousel' },
  { id: 'video_reel', label: 'Video Reel', description: 'Seedance clip + bullet overlays' },
  { id: 'hook_video', label: 'Hook Video', description: 'Short hook + carousel slideshow' },
  { id: 'quote_video', label: 'Quote Video', description: 'Story quote slideshow + optional VO' },
]

interface SocialPostTypeSelectorProps {
  value: SocialPostType
  onChange: (value: SocialPostType) => void
  disabled?: boolean
}

export function SocialPostTypeSelector({ value, onChange, disabled }: SocialPostTypeSelectorProps) {
  return (
    <div className="mt-4">
      <label className="text-sm font-medium text-card-foreground mb-2 block">
        Post Type
      </label>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {POST_TYPES.map((type) => (
          <button
            key={type.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(type.id)}
            className={cn(
              'rounded-lg border p-3 text-left transition-all',
              value === type.id
                ? 'border-primary bg-primary/10 ring-1 ring-primary'
                : 'border-border bg-background hover:bg-secondary/50',
              disabled && 'opacity-50 cursor-not-allowed',
            )}
          >
            <div className="text-sm font-semibold text-foreground">{type.label}</div>
            <div className="text-xs text-muted-foreground mt-1">{type.description}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
