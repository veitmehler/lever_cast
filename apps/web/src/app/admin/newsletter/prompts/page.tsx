'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ChevronRight, Cpu, Edit3, Hash, Loader2, AlertTriangle } from 'lucide-react'

interface PromptTemplate {
  id: string
  stepNumber: number
  stepName: string
  key: string | null
  defaultProvider: string
  defaultModel: string
  maxTokens: number | null
  systemPrompt: string | null
  userPrompt: string
}

function extractVars(text: string): string[] {
  const matches = text.match(/\{\{([^}]+)\}\}/g) ?? []
  return [...new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, '').trim()))]
}

const PROVIDER_COLORS: Record<string, string> = {
  anthropic: 'bg-orange-100 text-orange-800',
  gemini: 'bg-blue-100 text-blue-800',
  openai: 'bg-green-100 text-green-800',
  openrouter: 'bg-purple-100 text-purple-800',
  'fal-ai': 'bg-pink-100 text-pink-800',
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

// Groups for the nl_* prompts, mirroring the generation pipeline order.
const GROUPS: { label: string; keys: string[] }[] = [
  {
    label: 'Feature & Secondary Article (shared chain)',
    keys: [
      'nl_article_outline',
      'nl_article_intro',
      'nl_article_faq',
      'nl_article_faq_facts',
      'nl_article_facts',
      'nl_article_writer_system',
      'nl_article_writer_user',
      'nl_article_image_prompt',
    ],
  },
  {
    label: 'Teasers (Around the web)',
    keys: ['nl_teaser_url_selector', 'nl_teaser_summarizer_system', 'nl_teaser_summarizer_user'],
  },
  {
    label: 'Quick hits & Fun',
    keys: [
      'nl_tips_system',
      'nl_tips_user',
      'nl_facts_system',
      'nl_facts_user',
      'nl_trivia_system',
      'nl_trivia_user',
      'nl_joke_system',
      'nl_joke_user',
    ],
  },
  {
    label: 'Video & Email metadata',
    keys: ['nl_youtube_query', 'nl_subject_line', 'nl_preview_text'],
  },
  {
    label: 'Modules — Recipe',
    keys: ['nl_recipe_researcher', 'nl_recipe_writer_system', 'nl_recipe_writer_user', 'nl_recipe_image_prompt'],
  },
  {
    label: 'Modules — Kids Snack',
    keys: [
      'nl_kids_snack_researcher',
      'nl_kids_snack_writer_system',
      'nl_kids_snack_writer_user',
      'nl_kids_snack_image_prompt',
    ],
  },
  {
    label: 'Modules — Tech-Free Activity',
    keys: ['nl_tech_free_researcher', 'nl_tech_free_writer_system', 'nl_tech_free_writer_user'],
  },
]

export default function AdminNewsletterPromptsPage() {
  const [templates, setTemplates] = useState<PromptTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const res = await fetch('/api/admin/prompts', { cache: 'no-store' })
        if (!res.ok) {
          if (alive) setError(`HTTP ${res.status}: ${(await res.text()) || res.statusText}`)
          return
        }
        const data = await res.json()
        if (alive) setTemplates((data.templates ?? []).filter((t: PromptTemplate) => t.key?.startsWith('nl_')))
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

  const byKey = Object.fromEntries(templates.map((t) => [t.key, t]))

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Newsletter Prompts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The <code>nl_*</code> templates that drive newsletter generation. Click to edit.
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
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <div className="font-mono text-xs">{error}</div>
        </div>
      )}

      {!loading && !error && templates.length === 0 && (
        <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
          No newsletter prompts found. Seed them (seed.ts on prod, scripts/seed-newsletter-prompts.ts on staging).
        </div>
      )}

      {!loading && !error && templates.length > 0 && (
        <div className="space-y-8">
          {GROUPS.map((group) => {
            const groupTemplates = group.keys.map((k) => byKey[k]).filter(Boolean) as PromptTemplate[]
            if (groupTemplates.length === 0) return null
            return (
              <section key={group.label}>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </h2>
                <div className="space-y-2">
                  {groupTemplates.map((t) => {
                    const vars = extractVars((t.systemPrompt ?? '') + ' ' + t.userPrompt)
                    return (
                      <Link
                        key={t.id}
                        href={`/admin/prompts/${t.stepNumber}`}
                        className="group flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-4 hover:border-border/80 hover:shadow-sm transition-all"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <span className="font-mono text-sm font-medium text-foreground">{t.key}</span>
                            <ProviderBadge provider={t.defaultProvider} />
                            <span className="text-xs text-gray-400">{t.defaultModel}</span>
                            {t.maxTokens != null && (
                              <span className="font-mono text-xs text-gray-400">
                                {t.maxTokens.toLocaleString()} tok
                              </span>
                            )}
                          </div>
                          {vars.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {vars.slice(0, 8).map((v) => (
                                <span
                                  key={v}
                                  className="inline-flex items-center gap-0.5 rounded bg-indigo-50 px-1.5 py-0.5 font-mono text-xs text-indigo-600"
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
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground group-hover:text-foreground">
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
