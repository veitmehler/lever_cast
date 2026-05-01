'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ChevronRight, Cpu, Edit3, Hash, Loader2, AlertTriangle } from 'lucide-react'

interface PromptTemplate {
  id: string
  stepNumber: number
  stepName: string
  defaultProvider: string
  defaultModel: string
  systemPrompt: string | null
  userPrompt: string
  version: number
  isActive: boolean
}

function extractVars(text: string): string[] {
  const matches = text.match(/\{\{([^}]+)\}\}/g) ?? []
  return [...new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, '').trim()))]
}

const PROVIDER_COLORS: Record<string, string> = {
  anthropic: 'bg-orange-100 text-orange-800',
  gemini:    'bg-blue-100 text-blue-800',
  openai:    'bg-green-100 text-green-800',
  openrouter:'bg-purple-100 text-purple-800',
}

function ProviderBadge({ provider }: { provider: string }) {
  const cls = PROVIDER_COLORS[provider.toLowerCase()] ?? 'bg-gray-100 text-gray-700'
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      <Cpu className="h-3 w-3" />
      {provider}
    </span>
  )
}

const STEP_LABELS: Record<string, string> = {
  generate_outline:               'Outline',
  keyword_research:               'Keyword Research',
  find_supporting_keywords:       'Supporting Keywords',
  optimize_outline_seo:           'Optimize Outline (SEO)',
  write_search_intent_intro:      'Search Intent Intro',
  research_faqs:                  'Research FAQs',
  find_faq_facts:                 'FAQ Facts',
  find_article_facts:             'Article Facts',
  write_article:                  'Write Article',
  fact_check_article:             'Fact Check',
  adjust_incorrect_facts:         'Adjust Incorrect Facts',
  find_citations:                 'Find Citations',
  generate_seo_metadata:          'SEO Metadata',
  generate_image_prompt:          'Image Prompt',
  generate_excerpt:               'Excerpt',
  generate_legal_disclaimer:      'Legal Disclaimer',
  enrichment_generate_diagram:    'Mermaid Diagram (Enrichment)',
}

const PHASE_GROUPS: { label: string; steps: number[] }[] = [
  { label: 'Phase A — Pre-approval (Steps 1–12)',   steps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  { label: 'Phase B — Approval Chain (Steps 13–18)', steps: [13, 15, 17, 18] },
  { label: 'Phase C — Enrichment',                   steps: [20] },
]

export default function AdminPromptsPage() {
  const [templates, setTemplates] = useState<PromptTemplate[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const res = await fetch('/api/admin/prompts', { cache: 'no-store' })
        if (!res.ok) {
          const body = await res.text()
          if (alive) setError(`HTTP ${res.status}: ${body || res.statusText}`)
          return
        }
        const data = await res.json()
        if (alive) setTemplates(data.templates ?? [])
      } catch (err) {
        if (alive) setError((err as Error).message ?? 'Failed to load prompt templates')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  const byStep = Object.fromEntries(templates.map((t) => [t.stepNumber, t]))

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Prompt Templates</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Click a template to edit its system prompt, user prompt, provider, and model.
          Admin edits are preserved on re-seed.
        </p>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading templates…
        </div>
      )}

      {!loading && error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-semibold">Could not load prompt templates</div>
            <div className="mt-1 font-mono text-xs">{error}</div>
            <div className="mt-2 text-xs">
              If you just deployed, the worker may still be restarting. Otherwise check that
              your account has admin role.
            </div>
          </div>
        </div>
      )}

      {!loading && !error && templates.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-500">
          No prompt templates found. Run the seed script to populate them.
        </div>
      )}

      {!loading && !error && templates.length > 0 && (
        <div className="space-y-8">
          {PHASE_GROUPS.map((group) => {
            const groupTemplates = group.steps
              .map((n) => byStep[n])
              .filter(Boolean) as PromptTemplate[]

            if (groupTemplates.length === 0) return null

            return (
              <section key={group.label}>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  {group.label}
                </h2>
                <div className="space-y-2">
                  {groupTemplates.map((t) => {
                    const vars = extractVars((t.systemPrompt ?? '') + ' ' + t.userPrompt)
                    const label = STEP_LABELS[t.stepName] ?? t.stepName
                    return (
                      <Link
                        key={t.id}
                        href={`/admin/prompts/${t.stepNumber}`}
                        className="group flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-4 hover:border-border/80 hover:shadow-sm transition-all"
                      >
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                          {t.stepNumber}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-foreground">{label}</span>
                            <ProviderBadge provider={t.defaultProvider} />
                            <span className="text-xs text-gray-400">{t.defaultModel}</span>
                          </div>
                          {vars.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {vars.slice(0, 8).map((v) => (
                                <span
                                  key={v}
                                  className="inline-flex items-center gap-0.5 rounded bg-indigo-50 px-1.5 py-0.5 text-xs font-mono text-indigo-600"
                                >
                                  <Hash className="h-2.5 w-2.5" />
                                  {v}
                                </span>
                              ))}
                              {vars.length > 8 && (
                                <span className="text-xs text-gray-400">+{vars.length - 8} more</span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                          <Edit3 className="h-3.5 w-3.5" />
                          Edit
                          <ChevronRight className="h-3.5 w-3.5" />
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
