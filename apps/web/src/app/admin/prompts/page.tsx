import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { ChevronRight, Cpu, Edit3, Hash } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

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

async function getPrompts(token: string): Promise<PromptTemplate[]> {
  try {
    const res = await fetch(`${API_URL}/api/admin/prompts`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.templates ?? []
  } catch {
    return []
  }
}

// Extract {{variable}} tokens from a string
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

// Friendly label for known step names
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

export default async function AdminPromptsPage() {
  const { getToken } = await auth()
  const token = await getToken()
  const templates = token ? await getPrompts(token) : []

  const byStep = Object.fromEntries(templates.map((t) => [t.stepNumber, t]))

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Prompt Templates</h1>
        <p className="mt-1 text-sm text-gray-500">
          Click a template to edit its system prompt, user prompt, provider, and model.
          Admin edits are preserved on re-seed.
        </p>
      </div>

      <div className="space-y-8">
        {PHASE_GROUPS.map((group) => {
          const groupTemplates = group.steps
            .map((n) => byStep[n])
            .filter(Boolean) as PromptTemplate[]

          if (groupTemplates.length === 0) return null

          return (
            <section key={group.label}>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
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
                      className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white px-5 py-4 hover:border-gray-300 hover:shadow-sm transition-all"
                    >
                      {/* Step number */}
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                        {t.stepNumber}
                      </div>

                      {/* Name + vars */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">{label}</span>
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

                      {/* Edit caret */}
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 group-hover:text-gray-600 transition-colors">
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
    </div>
  )
}
