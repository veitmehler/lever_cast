'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, Save, Loader2, CheckCircle2, Hash, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

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

// All known pipeline variables with descriptions
const ALL_VARIABLES: { name: string; description: string; steps?: number[] }[] = [
  { name: 'topic',              description: 'The article topic / idea',                        steps: [1, 2, 3, 5, 6, 7, 8] },
  { name: 'excludedKeywords',   description: 'Comma-joined primary keywords already in DB (prevents cannibalization)' },
  { name: 'outline',            description: 'Step 1 output — article outline',                 steps: [4, 8, 9] },
  { name: 'keywords',           description: 'Step 2 output — keyword JSON',                    steps: [4, 9] },
  { name: 'primaryKeyword',     description: 'Parsed primary keyword from Step 2',              steps: [5, 13, 15] },
  { name: 'primary_keyword',    description: 'Alias for primaryKeyword',                        steps: [3] },
  { name: 'searchIntent',       description: 'Step 5 output — search intent',                  steps: [5] },
  { name: 'intro',              description: 'Step 5 output — introduction text',               steps: [13] },
  { name: 'faqQuestions',       description: 'Step 6 output — FAQ questions list',             steps: [7] },
  { name: 'facts',              description: 'Step 8 output — research facts',                 steps: [9] },
  { name: 'article',            description: 'Step 9 / 11 output — article HTML',              steps: [10, 11, 12, 13, 17, 18] },
  { name: 'article_html',       description: 'Alias for article',                              steps: [9, 11] },
  { name: 'factCheckIssues',    description: 'Step 10 output — fact-check issues',            steps: [11] },
  { name: 'article_title',      description: 'SitePage seoTitle → title → topic',             steps: [17, 18] },
  { name: 'article_summary',    description: 'First 1000 chars of Step 11 output',            steps: [18] },
  { name: 'articleSummary',     description: 'Alias for article_summary',                     steps: [15] },
  { name: 'seo_title',          description: 'Parsed SEO title from Step 13',                 steps: [] },
  { name: 'seo_description',    description: 'Parsed SEO description from Step 13',           steps: [] },
  { name: 'article_slug',       description: 'Parsed slug from Step 13',                      steps: [] },
  { name: 'article_excerpt',    description: 'SitePage.excerpt (Step 17)',                    steps: [] },
  { name: 'current_date',       description: 'Current ISO date/time',                         steps: [] },
  { name: 'published_date',     description: 'Topic.publishingDate or current date',          steps: [] },
  // Enrichment-specific
  { name: 'article_topic',      description: '[Enrichment] Article topic string',             steps: [20] },
  { name: 'section_title',      description: '[Enrichment] H2 section heading',               steps: [20] },
  { name: 'section_html',       description: '[Enrichment] HTML content of the H2 section',  steps: [20] },
]

const STEP_LABELS: Record<number, string> = {
  1: 'Step 1 — Outline',
  2: 'Step 2 — Keyword Research',
  3: 'Step 3 — Supporting Keywords',
  4: 'Step 4 — SEO Outline',
  5: 'Step 5 — Intro',
  6: 'Step 6 — FAQs',
  7: 'Step 7 — FAQ Facts',
  8: 'Step 8 — Article Facts',
  9: 'Step 9 — Write Article',
  10: 'Step 10 — Fact Check',
  11: 'Step 11 — Adjust Facts',
  12: 'Step 12 — Citations',
  13: 'Step 13 — SEO Metadata',
  15: 'Step 15 — Image Prompt',
  17: 'Step 17 — Excerpt',
  18: 'Step 18 — Legal Disclaimer',
  20: 'Step 20 — Mermaid Diagram',
}

const PROVIDER_OPTIONS = [
  { value: 'gemini',     label: 'Gemini (Google)' },
  { value: 'anthropic',  label: 'Anthropic (Claude)' },
  { value: 'openai',     label: 'OpenAI (GPT)' },
  { value: 'openrouter', label: 'OpenRouter' },
]

// Extract {{var}} tokens that actually appear in a given text
function usedVarsIn(text: string): Set<string> {
  const matches = text.match(/\{\{([^}]+)\}\}/g) ?? []
  return new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, '').trim()))
}


export function PromptEditor({ template }: { template: PromptTemplate }) {
  const [systemPrompt, setSystemPrompt] = useState(template.systemPrompt ?? '')
  const [userPrompt,   setUserPrompt]   = useState(template.userPrompt)
  const [provider,     setProvider]     = useState(template.defaultProvider)
  const [model,        setModel]        = useState(template.defaultModel)
  const [saving,       setSaving]       = useState(false)
  const [saved,        setSaved]        = useState(false)

  const isDirty =
    systemPrompt !== (template.systemPrompt ?? '') ||
    userPrompt   !== template.userPrompt ||
    provider     !== template.defaultProvider ||
    model        !== template.defaultModel

  // Variables referenced in the current text
  const usedVars = new Set([
    ...usedVarsIn(systemPrompt),
    ...usedVarsIn(userPrompt),
  ])

  // Variables relevant to this step (includes used ones + step-specific ones)
  const relevantVars = ALL_VARIABLES.filter(
    (v) => usedVars.has(v.name) || (v.steps ?? []).includes(template.stepNumber),
  )

  const allOtherVars = ALL_VARIABLES.filter(
    (v) =>
      !usedVars.has(v.name) &&
      !(v.steps ?? []).includes(template.stepNumber),
  )

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch(`/api/admin/prompts/${template.stepNumber}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: systemPrompt || null,
          userPrompt,
          defaultProvider: provider,
          defaultModel: model,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Save failed')
      }
      setSaved(true)
      toast.success('Prompt saved')
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/prompts"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2 transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            All prompts
          </Link>
          <h1 className="text-xl font-semibold text-foreground">
            {STEP_LABELS[template.stepNumber] ?? `Step ${template.stepNumber}`}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5 font-mono">{template.stepName}</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving || !isDirty}
          className={saved ? 'bg-green-600 hover:bg-green-600' : ''}
        >
          {saving ? (
            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
          ) : saved ? (
            <CheckCircle2 className="h-4 w-4 mr-1.5" />
          ) : (
            <Save className="h-4 w-4 mr-1.5" />
          )}
          {saved ? 'Saved' : 'Save changes'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        {/* ── Left: prompts + model settings ─────────────────────────── */}
        <div className="space-y-5">
          {/* Provider + model row */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Model settings</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Provider</label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
                >
                  {PROVIDER_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Model</label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g. claude-sonnet-4-5-20250929"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
                />
              </div>
            </div>
          </div>

          {/* System prompt */}
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-foreground">System prompt</h2>
              <span className="text-xs text-muted-foreground">{systemPrompt.length} chars</span>
            </div>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={5}
              placeholder="Optional system prompt…"
              className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20 resize-y leading-relaxed"
            />
          </div>

          {/* User prompt */}
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-foreground">User prompt</h2>
              <span className="text-xs text-muted-foreground">{userPrompt.length} chars</span>
            </div>
            <textarea
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              rows={20}
              className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20 resize-y leading-relaxed"
            />
          </div>
        </div>

        {/* ── Right: variable reference panel ─────────────────────────── */}
        <div className="space-y-4">
          {/* Info */}
          <div className="rounded-xl bg-indigo-500/10 border border-indigo-500/20 p-4 text-xs text-indigo-400 flex gap-2">
            <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-indigo-300">Variables</strong> are written as{' '}
              <code className="bg-indigo-500/20 px-1 rounded">{'{{variable_name}}'}</code>.
              Click any variable below to copy it to your clipboard.
            </div>
          </div>

          {/* Used / step-relevant variables */}
          {relevantVars.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Variables for this step
              </h3>
              <div className="space-y-1.5">
                {relevantVars.map((v) => (
                  <VarRow key={v.name} v={v} used={usedVars.has(v.name)} />
                ))}
              </div>
            </div>
          )}

          {/* All other variables (collapsed) */}
          <details className="bg-card rounded-xl border border-border">
            <summary className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors">
              All other variables ({allOtherVars.length})
            </summary>
            <div className="px-4 pb-4 space-y-1.5 border-t border-border pt-3">
              {allOtherVars.map((v) => (
                <VarRow key={v.name} v={v} used={false} />
              ))}
            </div>
          </details>
        </div>
      </div>
    </div>
  )
}

function VarRow({
  v,
  used,
}: {
  v: { name: string; description: string }
  used: boolean
}) {
  const handleCopy = () => {
    navigator.clipboard.writeText(`{{${v.name}}}`)
    toast.success(`Copied {{${v.name}}}`)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="w-full text-left group flex items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/50 transition-colors"
    >
      <Hash
        className={`h-3.5 w-3.5 mt-0.5 flex-shrink-0 ${used ? 'text-indigo-400' : 'text-muted-foreground/40'}`}
      />
      <div className="min-w-0">
        <span
          className={`block text-xs font-mono ${used ? 'text-indigo-400 font-semibold' : 'text-muted-foreground'}`}
        >
          {`{{${v.name}}}`}
        </span>
        <span className="block text-xs text-muted-foreground/60 truncate">{v.description}</span>
      </div>
    </button>
  )
}
