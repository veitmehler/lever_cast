'use client'

import { useState } from 'react'
import { X, Settings, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface ApiKeyRequiredModalProps {
  isOpen: boolean
  onClose: () => void
  reason?: 'no_key' | 'api_error'
}

export function ApiKeyRequiredModal({ isOpen, onClose, reason = 'no_key' }: ApiKeyRequiredModalProps) {
  if (!isOpen) return null

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
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-orange-100 p-2 dark:bg-orange-900/30">
              <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-card-foreground">
                API Key Required
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground mb-4">
            {reason === 'no_key' 
              ? "To generate AI-powered content, you need to add an API key for at least one AI provider (OpenAI, Anthropic, Gemini, or OpenRouter)."
              : "There was an error with your API key. Please check your API key settings and try again."
            }
          </p>
          <div className="rounded-lg bg-muted/50 p-4 mb-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">What you can do:</p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>Add an API key in Settings</li>
              <li>Choose your preferred AI provider</li>
              <li>Select a model for content generation</li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
          <Link href="/settings" className="flex-1">
            <Button
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={onClose}
            >
              <Settings className="w-4 h-4 mr-2" />
              Go to Settings
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

