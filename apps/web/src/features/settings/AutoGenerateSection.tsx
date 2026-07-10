'use client'

import { Loader2, Sparkles } from 'lucide-react'
import type { SettingsData } from './useSettingsData'

// Standing preference: when on, the next billing cycle's entire content plan
// generates automatically once that cycle's client-story review-spidering
// completes (see .plans/client-story-review-mining.implementation-plan.md).
// When off (default), content only ever generates from a manual click.
export function AutoGenerateSection({ settings }: { settings: SettingsData }) {
  const { autoGenerateNextCycle, isSavingAutoGenerate, handleToggleAutoGenerate } = settings

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h2 className="text-xl font-semibold text-card-foreground mb-2 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" /> Content Automation
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        Let your content plan run itself, month after month.
      </p>

      <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-muted/30 p-4">
        <div>
          <p className="text-sm font-medium text-card-foreground">
            Auto-generate next month&apos;s content plan
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            When enabled, your full content plan for each new month generates automatically —
            no need to log in and click Generate yourself.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={autoGenerateNextCycle}
          disabled={isSavingAutoGenerate}
          onClick={() => handleToggleAutoGenerate(!autoGenerateNextCycle)}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
            autoGenerateNextCycle ? 'bg-primary' : 'bg-muted-foreground/30'
          }`}
        >
          {isSavingAutoGenerate ? (
            <Loader2 className="absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 animate-spin text-white" />
          ) : (
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                autoGenerateNextCycle ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          )}
        </button>
      </div>
    </div>
  )
}
