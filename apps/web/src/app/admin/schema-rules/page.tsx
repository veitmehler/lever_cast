'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, Save, Loader2, Code2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface SchemaTypeRule {
  keyword: string
  articleType: string
  publisherType: string
}

const EMPTY_RULE: SchemaTypeRule = { keyword: '', articleType: 'Article', publisherType: 'Organization' }

const COMMON_ARTICLE_TYPES = ['Article', 'MedicalArticle', 'NewsArticle', 'TechArticle', 'BlogPosting', 'ScholarlyArticle']
const COMMON_PUBLISHER_TYPES = ['Organization', 'MedicalOrganization', 'NewsMediaOrganization', 'LocalBusiness']

export default function SchemaRulesPage() {
  const [rules, setRules]       = useState<SchemaTypeRule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetch('/api/admin/schema-type-rules')
      .then((r) => r.json())
      .then((data) => {
        setRules(Array.isArray(data.rules) ? data.rules : [])
      })
      .catch(() => toast.error('Failed to load schema type rules'))
      .finally(() => setIsLoading(false))
  }, [])

  function updateRule(index: number, field: keyof SchemaTypeRule, value: string) {
    setRules((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)))
  }

  function addRule() {
    setRules((prev) => [...prev, { ...EMPTY_RULE }])
  }

  function removeRule(index: number) {
    setRules((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSave() {
    for (const r of rules) {
      if (!r.keyword.trim() || !r.articleType.trim() || !r.publisherType.trim()) {
        toast.error('All fields are required for each rule')
        return
      }
    }

    setIsSaving(true)
    try {
      const res = await fetch('/api/admin/schema-type-rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error ?? 'Save failed')
      }
      toast.success('Schema type rules saved')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Code2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Schema Type Rules</h1>
            <p className="text-sm text-muted-foreground">
              Map industry keywords to Schema.org <code>@type</code> values for article structured data.
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={isSaving || isLoading} size="sm">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save rules
        </Button>
      </div>

      {/* Explainer */}
      <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground space-y-1">
        <p>
          When an article is approved, LeverCast checks the brand&apos;s <strong>Industry</strong> field against each keyword (case-insensitive substring match, top-to-bottom priority).
          The first matching rule sets the <code>@type</code> and publisher type in the JSON-LD schema markup.
        </p>
        <p>
          If no rule matches and no override is set in Brand Settings, the schema defaults to <code>Article</code> / <code>Organization</code>.
          A brand-level override in <strong>Settings → Schema article type override</strong> always takes priority over these rules.
        </p>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : (
        <div className="space-y-3">
          {/* Column headers */}
          <div className="grid grid-cols-[1fr_1fr_1fr_2.5rem] gap-3 px-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Keyword (substring)</span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Article @type</span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Publisher @type</span>
            <span />
          </div>

          {rules.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6 border border-dashed border-border rounded-lg">
              No rules yet. Click &quot;Add rule&quot; to create your first mapping.
            </p>
          )}

          {rules.map((rule, index) => (
            <div
              key={index}
              className="grid grid-cols-[1fr_1fr_1fr_2.5rem] gap-3 items-center rounded-lg border border-border bg-card px-3 py-2"
            >
              {/* Keyword */}
              <input
                type="text"
                value={rule.keyword}
                onChange={(e) => updateRule(index, 'keyword', e.target.value)}
                placeholder="e.g. chiropractic"
                className="rounded-md border border-input bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />

              {/* Article type */}
              <div className="relative">
                <input
                  type="text"
                  list={`article-types-${index}`}
                  value={rule.articleType}
                  onChange={(e) => updateRule(index, 'articleType', e.target.value)}
                  placeholder="Article"
                  className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <datalist id={`article-types-${index}`}>
                  {COMMON_ARTICLE_TYPES.map((t) => <option key={t} value={t} />)}
                </datalist>
              </div>

              {/* Publisher type */}
              <div className="relative">
                <input
                  type="text"
                  list={`publisher-types-${index}`}
                  value={rule.publisherType}
                  onChange={(e) => updateRule(index, 'publisherType', e.target.value)}
                  placeholder="Organization"
                  className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <datalist id={`publisher-types-${index}`}>
                  {COMMON_PUBLISHER_TYPES.map((t) => <option key={t} value={t} />)}
                </datalist>
              </div>

              {/* Delete */}
              <button
                type="button"
                onClick={() => removeRule(index)}
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Remove rule"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          <Button variant="outline" size="sm" onClick={addRule} className="mt-1">
            <Plus className="h-4 w-4 mr-1.5" />
            Add rule
          </Button>
        </div>
      )}
    </div>
  )
}
