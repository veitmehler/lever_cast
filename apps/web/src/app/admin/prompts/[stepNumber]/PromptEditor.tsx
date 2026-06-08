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
  maxTokens: number | null
  systemPrompt: string | null
  userPrompt: string
  version: number
  isActive: boolean
}

// Known maximum output token limits per model slug.
// Used to display a hint and warn when the entered value exceeds the model ceiling.
const MODEL_MAX_OUTPUT_TOKENS: Record<string, number> = {
  // Gemini
  'gemini-2.5-flash':              65536,
  'gemini-2.5-flash-lite':         32768,
  'gemini-2.5-pro':                65536,
  'gemini-3-flash-preview':        65536,
  'gemini-3.1-flash-lite':         65536,
  'gemini-3.1-flash-lite-preview': 65536,
  'gemini-3.1-pro-preview':        65536,
  'gemini-2.0-flash':              8192,
  'gemini-2.0-flash-lite':         8192,
  // Anthropic
  'claude-sonnet-4-5-20250929':    16384,
  'claude-sonnet-4-5':             16384,
  'claude-sonnet-4-6':             16384,
  'claude-opus-4-5':               16384,
  'claude-opus-4-6':               16384,
  'claude-opus-4-7':               16384,
  'claude-haiku-3-5-20241022':     8192,
  'claude-haiku-4-5':              16384,
  // OpenAI
  'gpt-4o':                        16384,
  'gpt-4o-mini':                   16384,
  'gpt-5.4':                       32768,
  'gpt-5.4-mini':                  16384,
  'gpt-5.4-nano':                  16384,
  'gpt-5.5':                       32768,
  'gpt-5-mini':                    16384,
  'gpt-5-nano':                    16384,
  'o3':                            100000,
  'o4-mini':                       100000,
}

// All known pipeline variables with descriptions
const ALL_VARIABLES: { name: string; description: string; steps?: number[] }[] = [
  { name: 'topic',              description: 'The article topic / idea',                        steps: [0, 1, 2, 3, 5, 6, 7, 8] },
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
  { name: 'published_date',     description: 'Topic.publishingDate or current date (ISO 8601)', steps: [] },
  { name: 'modified_date',    description: 'Same as published_date for schema dateModified',      steps: [] },
  { name: 'featured_image_url', description: 'SitePage featured image CDN URL (after approval)',    steps: [] },
  { name: 'industry', description: 'BrandSettings.industry (vertical / profession)',                 steps: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 17, 18] },
  { name: 'business_description', description: 'BrandSettings.businessDescription (what the business does)', steps: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 17, 18] },
  { name: 'title', description: 'Step 0 output — generated H1 title (falls back to topic if absent)', steps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 17, 18] },
  { name: 'author_linkedin',    description: 'BrandSettings.defaultAuthorLinkedIn',                 steps: [] },
  { name: 'organization_country_code', description: 'BrandSettings ISO 3166-1 alpha-2 (e.g. US)',    steps: [] },
  { name: 'google_business_profile_url', description: 'BrandSettings GBP / g.page URL',          steps: [] },
  // Phase B citation insertion
  { name: 'validated_citations', description: 'JSON array of validated {title, url, status} citation objects (step 110 only)', steps: [110] },
  // Enrichment-specific
  { name: 'article_topic',      description: '[Enrichment] Article topic string',             steps: [20] },
  { name: 'section_title',      description: '[Enrichment] H2 section heading',               steps: [20] },
  { name: 'section_html',       description: '[Enrichment] HTML content of the H2 section',  steps: [20] },
  // Carousel plan (step 202)
  { name: 'slide_count',        description: '[Carousel] Number of slides to generate',                    steps: [202] },
  { name: 'topic',              description: '[Carousel] Article title / topic',                           steps: [202] },
  { name: 'details',            description: '[Carousel] Article section text (content)',                  steps: [202] },
  { name: 'article_url',        description: '[Carousel] URL to promote (optional)',                       steps: [202] },
  { name: 'special_instructions', description: '[Carousel] Brand image style instructions',               steps: [202] },
  { name: 'organizationName',   description: '[Carousel] Brand / organization name',                      steps: [202] },
  { name: 'industry',           description: '[Carousel] Industry from brand settings',                   steps: [202] },
  // Platform caption (step 203)
  { name: 'platform',           description: '[Caption] Target platform (linkedin, instagram, etc.)',     steps: [203] },
  { name: 'slotKey',            description: '[Caption] Post slot key (F1, F4, etc.)',                    steps: [203] },
  { name: 'postType',           description: '[Caption] Post type (carousel, video_reel, etc.)',          steps: [203] },
  { name: 'title',              description: '[Caption] Article title',                                   steps: [203] },
  { name: 'sectionText',        description: '[Caption] Article section text for this slot',              steps: [203] },
  { name: 'sectionTitle',       description: '[Caption] Section heading for this slot',                   steps: [203] },
  { name: 'platformTone',       description: '[Caption] Hardcoded platform tone description',             steps: [203] },
  { name: 'charLimit',          description: '[Caption] Platform character limit',                        steps: [203] },
  { name: 'organizationName',   description: '[Caption] Brand / organization name',                       steps: [203] },
  { name: 'businessDescription', description: '[Caption] What the business does (from Settings)',         steps: [203] },
  { name: 'who',                description: '[Caption] Target audience description (from Settings)',     steps: [203] },
  { name: 'writingStyle',       description: '[Caption] Brand writing style / voice (from Settings)',     steps: [203] },
  { name: 'industry',           description: '[Caption] Industry from brand settings',                   steps: [203] },
  // Video reel prompt (step 206)
  { name: 'topic',              description: '[Video Reel] Article title / topic',            steps: [206] },
  { name: 'details',            description: '[Video Reel] First H2 section text from the article', steps: [206] },
  { name: 'special_instructions', description: '[Video Reel] Client video instructions from Social Settings', steps: [206] },
  { name: 'video_model',        description: '[Video Reel] Fal.ai video model slug from Step 207', steps: [206] },
]

const STEP_LABELS: Record<number, string> = {
  // Phase A — Pre-approval Pipeline
  0:   'Phase A · Step 0 — Generate Title',
  1:   'Phase A · Step 1 — Generate Outline',
  2:   'Phase A · Step 2 — Keyword Research',
  3:   'Phase A · Step 3 — Supporting Keywords',
  4:   'Phase A · Step 4 — Optimise Outline for SEO',
  5:   'Phase A · Step 5 — Search Intent Introduction',
  6:   'Phase A · Step 6 — Research FAQs',
  7:   'Phase A · Step 7 — FAQ Facts',
  8:   'Phase A · Step 8 — Article Facts',
  9:   'Phase A · Step 9 — Write Article',
  10:  'Phase A · Step 10 — Fact Check',
  11:  'Phase A · Step 11 — Adjust Incorrect Facts',
  12:  'Phase A · Step 12 — Find Citations',
  // Phase B — Approval Chain (runs in order: 13 → 110 → 15 → 150/Fal → 16 → 17 → 18)
  13:  'Phase B · Step 13 — SEO Metadata',
  110: 'Phase B · Step 14 — Insert Inline Citations',
  15:  'Phase B · Step 15 — Image Prompt (LLM)',
  150: 'Phase B · Step 15b — Featured Image Model (Fal.ai)',
  16:  'Phase B · Step 16 — Schema Markup',
  17:  'Phase B · Step 17 — Excerpt',
  18:  'Phase B · Step 18 — Legal Disclaimer',
  // Phase C — Enrichment (visual numbering continues from Phase B step 18)
  101: 'Phase C · Step 19 — GEO Question Matching',
  102: 'Phase C · Step 20 — GEO Keyword → Question',
  103: 'Phase C · Step 21 — GEO Rephrase for Uniqueness',
  104: 'Phase C · Step 22 — GEO AI Section Summary',
  107: 'Phase C · Step 23 — Key Takeaways & TOC',
  20:  'Phase C · Step 24 — Mermaid Diagram (prompt slot)',
  108: 'Phase C · Step 25 — WP Category (conditional, runs last)',
  // Social media posts
  201: 'Social · Step 1 — Quote selection',
  202: 'Social · Step 2 — Carousel plan',
  203: 'Social · Step 3 — Platform caption',
  204: 'Social · Step 4 — Reel bullets',
  205: 'Social · Step 5 — Quote video narration',
  206: 'Social · Step 6 — Video Reel Prompt (LLM)',
  207: 'Social · Step 7 — Video Reel — Fal.ai Model',
}

/** Steps that only configure a model, not a prompt. */
const MODEL_ONLY_STEPS = new Set([150, 207])

const PROVIDER_OPTIONS = [
  { value: 'gemini',     label: 'Gemini (Google)' },
  { value: 'anthropic',  label: 'Anthropic (Claude)' },
  { value: 'openai',     label: 'OpenAI (GPT)' },
  { value: 'openrouter', label: 'OpenRouter' },
  { value: 'fal-ai',     label: 'Fal.ai (Image Generation)' },
]

const MODEL_OPTIONS: Record<string, { value: string; label: string; group?: string }[]> = {
  gemini: [
    // ── Gemini 3 (latest) ──────────────────────────────────────────────────
    { value: 'gemini-3.1-pro-preview',          label: 'Gemini 3.1 Pro Preview',           group: 'Gemini 3' },
    { value: 'gemini-3-flash-preview',          label: 'Gemini 3 Flash Preview',            group: 'Gemini 3' },
    { value: 'gemini-3.1-flash-lite',           label: 'Gemini 3.1 Flash-Lite (Stable)',    group: 'Gemini 3' },
    { value: 'gemini-3.1-flash-lite-preview',   label: 'Gemini 3.1 Flash-Lite Preview',     group: 'Gemini 3' },
    // ── Gemini 2.5 ────────────────────────────────────────────────────────
    { value: 'gemini-2.5-pro',                  label: 'Gemini 2.5 Pro',                    group: 'Gemini 2.5' },
    { value: 'gemini-2.5-flash',                label: 'Gemini 2.5 Flash',                  group: 'Gemini 2.5' },
    { value: 'gemini-2.5-flash-lite',           label: 'Gemini 2.5 Flash-Lite',             group: 'Gemini 2.5' },
    // ── Gemini 2.0 (deprecated — avoid new use) ───────────────────────────
    { value: 'gemini-2.0-flash',                label: 'Gemini 2.0 Flash (deprecated)',     group: 'Gemini 2.0' },
    { value: 'gemini-2.0-flash-lite',           label: 'Gemini 2.0 Flash-Lite (deprecated)', group: 'Gemini 2.0' },
  ],
  anthropic: [
    // ── Latest ────────────────────────────────────────────────────────────
    { value: 'claude-opus-4-7',                 label: 'Claude Opus 4.7 (latest)',          group: 'Latest' },
    { value: 'claude-sonnet-4-6',               label: 'Claude Sonnet 4.6 (latest)',        group: 'Latest' },
    { value: 'claude-haiku-4-5',                label: 'Claude Haiku 4.5 (latest)',         group: 'Latest' },
    // ── Claude 4 (previous) ───────────────────────────────────────────────
    { value: 'claude-opus-4-6',                 label: 'Claude Opus 4.6',                   group: 'Claude 4' },
    { value: 'claude-opus-4-5',                 label: 'Claude Opus 4.5',                   group: 'Claude 4' },
    { value: 'claude-opus-4-1',                 label: 'Claude Opus 4.1',                   group: 'Claude 4' },
    { value: 'claude-sonnet-4-5-20250929',      label: 'Claude Sonnet 4.5 (2025-09-29)',    group: 'Claude 4' },
    { value: 'claude-sonnet-4-5',               label: 'Claude Sonnet 4.5 (alias)',         group: 'Claude 4' },
    // ── Claude 3 ──────────────────────────────────────────────────────────
    { value: 'claude-haiku-3-5-20241022',       label: 'Claude Haiku 3.5 (2024-10-22)',     group: 'Claude 3' },
  ],
  openai: [
    // ── GPT-5 family ──────────────────────────────────────────────────────
    { value: 'gpt-5.5',                         label: 'GPT-5.5 (flagship)',                group: 'GPT-5' },
    { value: 'gpt-5.4',                         label: 'GPT-5.4',                           group: 'GPT-5' },
    { value: 'gpt-5.4-mini',                    label: 'GPT-5.4 Mini',                      group: 'GPT-5' },
    { value: 'gpt-5.4-nano',                    label: 'GPT-5.4 Nano',                      group: 'GPT-5' },
    { value: 'gpt-5-mini',                      label: 'GPT-5 Mini',                        group: 'GPT-5' },
    { value: 'gpt-5-nano',                      label: 'GPT-5 Nano',                        group: 'GPT-5' },
    // ── Reasoning ─────────────────────────────────────────────────────────
    { value: 'o3',                              label: 'o3 (reasoning)',                    group: 'Reasoning' },
    { value: 'o4-mini',                         label: 'o4-mini (reasoning, deprecating)',  group: 'Reasoning' },
    // ── GPT-4o (legacy) ───────────────────────────────────────────────────
    { value: 'gpt-4o',                          label: 'GPT-4o',                            group: 'GPT-4o' },
    { value: 'gpt-4o-mini',                     label: 'GPT-4o Mini',                       group: 'GPT-4o' },
  ],
  openrouter: [],
  'fal-ai': [
    // ── FLUX 2 (latest flagship — Black Forest Labs) ──────────────────────
    { value: 'fal-ai/flux-2-pro',                              label: 'FLUX 2 Pro (latest flagship)',        group: 'FLUX 2' },
    // ── FLUX 1.x Pro ─────────────────────────────────────────────────────
    { value: 'fal-ai/flux-pro/v1.1-ultra',                     label: 'FLUX 1.1 Pro Ultra (2K)',            group: 'FLUX 1.x Pro' },
    { value: 'fal-ai/flux-pro/v1.1',                           label: 'FLUX 1.1 Pro',                       group: 'FLUX 1.x Pro' },
    { value: 'fal-ai/flux-pro',                                label: 'FLUX Pro (stable)',                  group: 'FLUX 1.x Pro' },
    // ── FLUX Dev / Schnell ────────────────────────────────────────────────
    { value: 'fal-ai/flux/dev',                                label: 'FLUX Dev',                           group: 'FLUX Dev / Schnell' },
    { value: 'fal-ai/flux/schnell',                            label: 'FLUX Schnell (fast, 1-4 steps)',      group: 'FLUX Dev / Schnell' },
    // ── Google (Nano Banana / Imagen) ─────────────────────────────────────
    { value: 'fal-ai/nano-banana-2',                           label: 'Nano Banana 2 (Google, fast)',       group: 'Google' },
    { value: 'fal-ai/nano-banana-pro',                         label: 'Nano Banana Pro (Gemini 3)',         group: 'Google' },
    { value: 'fal-ai/nano-banana',                             label: 'Nano Banana (Imagen 3)',             group: 'Google' },
    // ── OpenAI GPT-Image ──────────────────────────────────────────────────
    { value: 'fal-ai/gpt-image-1.5',                           label: 'GPT-Image 1.5 (OpenAI)',             group: 'OpenAI' },
    { value: 'fal-ai/gpt-image-1/text-to-image',               label: 'GPT-Image 1 (OpenAI)',               group: 'OpenAI' },
    // ── Ideogram ──────────────────────────────────────────────────────────
    { value: 'fal-ai/ideogram/v3',                             label: 'Ideogram V3 (typography / posters)', group: 'Ideogram' },
    // ── ByteDance ─────────────────────────────────────────────────────────
    { value: 'fal-ai/bytedance/seedream/v4.5/text-to-image',   label: 'Seedream 4.5 (ByteDance)',           group: 'ByteDance' },
    // ── xAI Grok ─────────────────────────────────────────────────────────
    { value: 'xai/grok-imagine-image',                         label: 'Grok Imagine (xAI)',                 group: 'xAI' },
    // ── Specialised / Legacy ──────────────────────────────────────────────
    { value: 'fal-ai/flux-realism',                            label: 'FLUX Realism',                       group: 'Specialised' },
    { value: 'fal-ai/recraft-v3',                              label: 'Recraft v3',                         group: 'Specialised' },
    { value: 'fal-ai/stable-diffusion-xl',                     label: 'Stable Diffusion XL',                group: 'Specialised' },
    // ── ByteDance Seedance (Video Generation — Step 207) ─────────────────
    { value: 'fal-ai/bytedance/seedance/v1/lite/text-to-video',  label: 'Seedance v1 Lite — Text-to-Video',   group: 'Seedance Video' },
    { value: 'fal-ai/bytedance/seedance/v1/lite/image-to-video', label: 'Seedance v1 Lite — Image-to-Video',  group: 'Seedance Video' },
    { value: 'fal-ai/bytedance/seedance/v1/pro/text-to-video',   label: 'Seedance v1 Pro — Text-to-Video',    group: 'Seedance Video' },
    { value: 'fal-ai/bytedance/seedance/v1/pro/image-to-video',  label: 'Seedance v1 Pro — Image-to-Video',   group: 'Seedance Video' },
  ],
}

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
  const [maxTokens,    setMaxTokens]    = useState<number | null>(template.maxTokens)
  const [saving,       setSaving]       = useState(false)
  const [saved,        setSaved]        = useState(false)

  const isModelOnlyStep = MODEL_ONLY_STEPS.has(template.stepNumber)

  const modelOptions = MODEL_OPTIONS[provider] ?? []
  // If the current model isn't in the dropdown list it's a custom/legacy value — allow it
  const isCustomModel = model !== '' && !modelOptions.some((o) => o.value === model)

  function handleProviderChange(newProvider: string) {
    setProvider(newProvider)
    const options = MODEL_OPTIONS[newProvider] ?? []
    if (options.length > 0 && !options.some((o) => o.value === model)) {
      setModel(options[0].value)
    }
  }

  const isDirty =
    systemPrompt !== (template.systemPrompt ?? '') ||
    userPrompt   !== template.userPrompt ||
    provider     !== template.defaultProvider ||
    model        !== template.defaultModel ||
    maxTokens    !== template.maxTokens

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
          maxTokens,
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

      <div className={`grid grid-cols-1 gap-6 ${isModelOnlyStep ? '' : 'lg:grid-cols-[1fr_280px]'}`}>
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
                  onChange={(e) => handleProviderChange(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
                >
                  {PROVIDER_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Model</label>
                {modelOptions.length > 0 ? (
                  <div className="space-y-1.5">
                    <select
                      value={isCustomModel ? '__custom__' : model}
                      onChange={(e) => {
                        if (e.target.value !== '__custom__') setModel(e.target.value)
                      }}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
                    >
                      {/* Render grouped options using optgroup */}
                      {(() => {
                        const groups: Record<string, typeof modelOptions> = {}
                        const ungrouped: typeof modelOptions = []
                        for (const o of modelOptions) {
                          if (o.group) {
                            if (!groups[o.group]) groups[o.group] = []
                            groups[o.group].push(o)
                          } else {
                            ungrouped.push(o)
                          }
                        }
                        return (
                          <>
                            {ungrouped.map((o) => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                            {Object.entries(groups).map(([groupName, opts]) => (
                              <optgroup key={groupName} label={groupName}>
                                {opts.map((o) => (
                                  <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                              </optgroup>
                            ))}
                            {isCustomModel && (
                              <option value="__custom__">{model} (custom/legacy)</option>
                            )}
                          </>
                        )
                      })()}
                    </select>
                    {isCustomModel && (
                      <input
                        type="text"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        placeholder="Custom model identifier"
                        className="w-full rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
                      />
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="e.g. openrouter/anthropic/claude-3.5-sonnet"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
                  />
                )}
              </div>
            </div>

            {/* Max output tokens row */}
            {(() => {
              const modelLimit = MODEL_MAX_OUTPUT_TOKENS[model]
              const exceedsLimit = maxTokens !== null && modelLimit !== undefined && maxTokens > modelLimit
              return (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-end gap-4">
                    <div className="flex-1 max-w-xs">
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                        Max Output Tokens
                      </label>
                      <input
                        type="number"
                        min={1}
                        step={512}
                        value={maxTokens ?? ''}
                        onChange={(e) => {
                          const v = e.target.value
                          setMaxTokens(v === '' ? null : parseInt(v, 10))
                        }}
                        placeholder="Adapter default"
                        className={`w-full rounded-lg border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${
                          exceedsLimit
                            ? 'border-red-400 bg-red-50 focus:border-red-400 focus:ring-red-400/20'
                            : 'border-border bg-background focus:border-indigo-400 focus:ring-indigo-400/20'
                        }`}
                      />
                    </div>
                    <div className="pb-2 text-xs text-muted-foreground">
                      {modelLimit !== undefined ? (
                        <span>
                          Model limit:{' '}
                          <span className={`font-semibold ${exceedsLimit ? 'text-red-500' : 'text-foreground'}`}>
                            {modelLimit.toLocaleString()}
                          </span>
                        </span>
                      ) : (
                        <span>Model limit: unknown</span>
                      )}
                    </div>
                  </div>
                  {exceedsLimit && (
                    <p className="mt-1.5 text-xs text-red-500">
                      Value exceeds the known limit for this model — the API may reject or silently cap the request.
                    </p>
                  )}
                  {maxTokens === null && (
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      When empty, each provider adapter uses its own safe default (8 192 for Anthropic/Gemini; model default for OpenAI).
                    </p>
                  )}
                </div>
              )
            })()}
          </div>

          {/* Prompts — hidden for model-only steps */}
          {isModelOnlyStep ? (
            <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/50 p-5 flex gap-3">
              <Info className="h-5 w-5 flex-shrink-0 text-amber-500 mt-0.5" />
              <div className="text-sm text-amber-800 dark:text-amber-300">
                <p className="font-semibold mb-1">Prompt-free step — model selection only</p>
                {template.stepNumber === 207 ? (
                  <p className="text-xs leading-relaxed">
                    The video description is generated automatically by <strong>Step 206</strong> using the article
                    topic and H2 section content. Only the <strong>Fal.ai video model</strong> selected above controls
                    which text-to-video model renders that prompt.
                  </p>
                ) : (
                  <p className="text-xs leading-relaxed">
                    The image prompt is generated automatically by <strong>Step 15</strong> using the article
                    topic and summary. Only the <strong>Fal.ai model</strong> selected above controls which
                    image generation model renders that prompt.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>

        {/* ── Right: variable reference panel (hidden for model-only steps) ─────────────────────────── */}
        <div className={`space-y-4 ${isModelOnlyStep ? 'hidden lg:hidden' : ''}`}>
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
