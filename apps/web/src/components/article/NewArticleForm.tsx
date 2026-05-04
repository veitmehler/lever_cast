'use client'

import { useState, useEffect, useRef } from 'react'
import { Loader2, Sparkles, X, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

// ── Types ─────────────────────────────────────────────────────────────────────

type ArticleMode = 'article_first' | 'article_only'

interface OutlineFrameworkOption {
  number: number
  label: string
  description: string | null
}

export interface NewArticleFormProps {
  /** The article pipeline mode passed to POST /api/topics */
  mode: ArticleMode
  /** Called with the new jobId after the pipeline starts successfully */
  onCreated: (jobId: string) => void
  /**
   * Called when the user wants to close/cancel the form.
   * If omitted the close (X) button is hidden — useful for inline/dashboard use.
   */
  onClose?: () => void
  /**
   * 'panel'  — card with shadow + slide-in animation; shows X close button (workflow page).
   * 'inline' — no outer card wrapper; used inside an existing card (dashboard).
   */
  variant?: 'panel' | 'inline'
}

// ── Component ─────────────────────────────────────────────────────────────────

export function NewArticleForm({ mode, onCreated, onClose, variant = 'panel' }: NewArticleFormProps) {
  const [topic, setTopic]                     = useState('')
  const [isSubmitting, setIsSubmitting]       = useState(false)
  const [frameworks, setFrameworks]           = useState<OutlineFrameworkOption[]>([])
  const [frameworksLoading, setFwLoading]     = useState(true)
  const [selectedFramework, setSelectedFw]    = useState<number | null>(null)
  const [showAdvanced, setShowAdvanced]       = useState(false)
  const [specialInstructions, setSpecialInst] = useState('')
  const [realCaseStudies, setRealCaseStudies] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const heading =
    mode === 'article_first'
      ? 'Create an Article (+ social posts when ready)'
      : 'New Article'

  const subheading =
    mode === 'article_first'
      ? 'A full article will be generated first. Once approved, you can generate social posts from it.'
      : 'Enter a topic and the AI pipeline will generate a full article (steps 1–12, ~10 min).'

  useEffect(() => {
    if (variant === 'panel') inputRef.current?.focus()
    fetch('/api/outline-frameworks')
      .then((r) => r.ok ? r.json() : { frameworks: [] })
      .then((data) => setFrameworks(data.frameworks ?? []))
      .catch(() => setFrameworks([]))
      .finally(() => setFwLoading(false))
  }, [variant])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = topic.trim()
    if (!trimmed) return

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: trimmed,
          mode,
          outlineFrameworkNumber:     selectedFramework ?? null,
          outlineSpecialInstructions: specialInstructions.trim() || null,
          realCaseStudies:            realCaseStudies.trim() || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error ?? `Server error ${res.status}`)
      }

      const data = await res.json() as { jobId: string }
      toast.success('Article pipeline started!')
      onCreated(data.jobId)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create article')
      setIsSubmitting(false)
    }
  }

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Topic */}
      <div>
        <label htmlFor="new-article-topic" className="block text-sm font-medium text-foreground mb-1.5">
          Topic
        </label>
        <textarea
          id="new-article-topic"
          ref={inputRef}
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. How to reduce churn in SaaS businesses using proactive customer success"
          rows={3}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
          disabled={isSubmitting}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Be specific — a detailed topic produces a better article and tighter SEO targeting.
        </p>
      </div>

      {/* Outline Framework */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Outline Framework
        </label>
        <div className="relative">
          <select
            value={selectedFramework ?? ''}
            onChange={(e) => setSelectedFw(e.target.value === '' ? null : parseInt(e.target.value, 10))}
            disabled={isSubmitting || frameworksLoading}
            className="w-full appearance-none rounded-lg border border-input bg-background px-3 py-2 pr-8 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-60"
          >
            <option value="">Auto-select (AI picks the best fit)</option>
            {frameworks.map((f) => (
              <option key={f.number} value={f.number}>
                {f.number}. {f.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
        {selectedFramework != null && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {frameworks.find((f) => f.number === selectedFramework)?.description}
          </p>
        )}
        {selectedFramework == null && (
          <p className="text-xs text-muted-foreground mt-1">
            GPT-4o-mini will pick the most appropriate framework for your topic.
          </p>
        )}
      </div>

      {/* Advanced options toggle */}
      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
        >
          <ChevronDown className={`h-3 w-3 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          {showAdvanced ? 'Hide' : 'Show'} advanced options
        </button>

        {showAdvanced && (
          <div className="mt-3 space-y-3 rounded-lg border border-border bg-muted/40 p-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Special Instructions
                <span className="ml-1 font-normal text-muted-foreground">(optional — outline focus areas or custom direction)</span>
              </label>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInst(e.target.value)}
                rows={3}
                placeholder="e.g. Focus on the legal risks for small businesses. Include a section on insurance."
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Real Case Studies / Anecdotes
                <span className="ml-1 font-normal text-muted-foreground">(optional — woven into the article for credibility)</span>
              </label>
              <textarea
                value={realCaseStudies}
                onChange={(e) => setRealCaseStudies(e.target.value)}
                rows={3}
                placeholder="e.g. Client A reduced their renewal time from 2 weeks to 3 days after implementing X."
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                disabled={isSubmitting}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 pt-1">
        <Button
          type="submit"
          disabled={isSubmitting || !topic.trim()}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isSubmitting
            ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />Starting pipeline…</>
            : <><Sparkles className="h-4 w-4 mr-1.5" />Generate Article</>}
        </Button>
        {onClose && (
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )

  if (variant === 'inline') {
    return (
      <div>
        <div className="mb-4">
          <h2 className="text-base font-semibold text-card-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-500" />
            {heading}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">{subheading}</p>
        </div>
        {formContent}
      </div>
    )
  }

  // variant === 'panel'
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-6 mb-6 animate-in slide-in-from-top-2 duration-200">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-card-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-500" />
            {heading}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">{subheading}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {formContent}
    </div>
  )
}
