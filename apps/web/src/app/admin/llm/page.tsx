'use client'

import { useState, useEffect } from 'react'
import { Eye, EyeOff, Save, Loader2, Check, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface KeyStatus {
  provider: string
  hasEnvKey: boolean
  hasDbKey: boolean
}

const PROVIDER_LABELS: Record<string, string> = {
  gemini: 'Google Gemini',
  openai: 'OpenAI',
  anthropic: 'Anthropic / Claude',
  openrouter: 'OpenRouter',
  'fal-ai': 'Fal.ai',
}

export default function LLMKeysPage() {
  const [statuses, setStatuses] = useState<KeyStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [visible, setVisible] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})

  async function fetchStatuses() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/llm-keys')
      if (!res.ok) throw new Error('Failed to load')
      setStatuses(await res.json())
    } catch {
      toast.error('Failed to load key statuses')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatuses()
  }, [])

  async function saveKey(provider: string) {
    const key = inputs[provider]?.trim()
    if (!key) {
      toast.error('Enter a key first')
      return
    }
    setSaving((s) => ({ ...s, [provider]: true }))
    try {
      const res = await fetch(`/api/admin/llm-keys/${provider}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      })
      if (!res.ok) throw new Error('Failed to save')
      toast.success(`${PROVIDER_LABELS[provider] ?? provider} key saved`)
      setInputs((i) => ({ ...i, [provider]: '' }))
      await fetchStatuses()
    } catch {
      toast.error('Failed to save key')
    } finally {
      setSaving((s) => ({ ...s, [provider]: false }))
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">System LLM Keys</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Keys set here are used by the article pipeline. Env-var keys take precedence over DB keys.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchStatuses} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading...
        </div>
      )}

      {!loading && (
        <div className="space-y-3">
          {statuses.map((s) => (
            <div key={s.provider} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium text-sm text-foreground">
                    {PROVIDER_LABELS[s.provider] ?? s.provider}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <SourceBadge label="ENV" active={s.hasEnvKey} />
                    <SourceBadge label="DB" active={s.hasDbKey} />
                  </div>
                </div>
                {(s.hasEnvKey || s.hasDbKey) && (
                  <Check className="h-4 w-4 text-green-400" />
                )}
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={visible[s.provider] ? 'text' : 'password'}
                    placeholder={`Update ${PROVIDER_LABELS[s.provider] ?? s.provider} key…`}
                    value={inputs[s.provider] ?? ''}
                    onChange={(e) =>
                      setInputs((prev) => ({ ...prev, [s.provider]: e.target.value }))
                    }
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm pr-9 focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setVisible((v) => ({ ...v, [s.provider]: !v[s.provider] }))
                    }
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {visible[s.provider] ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
                <Button
                  size="sm"
                  onClick={() => saveKey(s.provider)}
                  disabled={saving[s.provider] || !inputs[s.provider]?.trim()}
                >
                  {saving[s.provider] ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Env-var keys (GEMINI_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY, OPENROUTER_API_KEY,
        FAL_KEY) are always read first. DB keys are a fallback for changing keys without redeploy.
      </p>
    </div>
  )
}

function SourceBadge({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${
        active
          ? 'bg-green-500/20 text-green-400'
          : 'bg-muted text-muted-foreground'
      }`}
    >
      {label}
    </span>
  )
}
