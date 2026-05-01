'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertTriangle,
  Save,
  Eye,
  EyeOff,
  LayoutList,
  Settings2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

// ── Types ─────────────────────────────────────────────────────────────────────

interface OutlineFramework {
  id: string
  number: number
  label: string
  description: string | null
  body: string
  isActive: boolean
  updatedAt: string
}

interface PlatformSettings {
  id: string
  googleGuidelines: string | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function WordCount({ text }: { text: string }) {
  const count = text.trim() ? text.trim().split(/\s+/).length : 0
  return (
    <span className="text-xs text-muted-foreground tabular-nums">{count.toLocaleString()} words</span>
  )
}

// ── Framework Editor Card ─────────────────────────────────────────────────────

function FrameworkCard({
  framework,
  onSaved,
}: {
  framework: OutlineFramework
  onSaved: (updated: OutlineFramework) => void
}) {
  const [isOpen, setIsOpen]       = useState(false)
  const [label, setLabel]         = useState(framework.label)
  const [description, setDesc]    = useState(framework.description ?? '')
  const [body, setBody]           = useState(framework.body)
  const [isActive, setIsActive]   = useState(framework.isActive)
  const [isSaving, setIsSaving]   = useState(false)

  const isDirty =
    label !== framework.label ||
    description !== (framework.description ?? '') ||
    body !== framework.body ||
    isActive !== framework.isActive

  const handleSave = async () => {
    if (!label.trim()) { toast.error('Label is required'); return }
    if (!body.trim())  { toast.error('Body is required'); return }

    setIsSaving(true)
    try {
      const res = await fetch(`/api/admin/outline-frameworks/${framework.number}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: label.trim(),
          description: description.trim() || null,
          body: body.trim(),
          isActive,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? `Server error ${res.status}`)
      }

      const data = await res.json()
      toast.success(`Framework ${framework.number} saved`)
      onSaved(data.framework as OutlineFramework)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className={`rounded-xl border bg-card transition-colors ${isActive ? 'border-border' : 'border-dashed border-border opacity-60'}`}>
      {/* Header row */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left"
      >
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
          {framework.number}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-foreground">{label}</span>
            {!isActive && (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                Inactive
              </span>
            )}
            {isDirty && (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                Unsaved
              </span>
            )}
          </div>
          {description && !isOpen && (
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{description}</p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <WordCount text={body} />
          {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {/* Expanded editor */}
      {isOpen && (
        <div className="border-t border-border px-5 py-4 space-y-4">
          {/* Label */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Label</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Description (for LLM auto-assignment) */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Description
              <span className="ml-1.5 font-normal text-muted-foreground">(used by LLM auto-assignment — &ldquo;when to use&rdquo;)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDesc(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground resize-y focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Body */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-foreground">Framework Body</label>
              <WordCount text={body} />
            </div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={20}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono text-foreground resize-y focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Injected as <code className="font-mono">{'{{outline_framework}}'}</code> in pipeline Step 1.
              Supports Markdown. Use <code className="font-mono">{'{{topic}}'}</code>, <code className="font-mono">{'{{who}}'}</code>, <code className="font-mono">{'{{our_experience}}'}</code>, etc.
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setIsActive((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {isActive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              {isActive ? 'Active' : 'Inactive'} — click to toggle
            </button>

            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving || !isDirty}
              className="gap-1.5"
            >
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save Changes
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Platform Settings Section ─────────────────────────────────────────────────

function PlatformSettingsSection({ initial }: { initial: PlatformSettings }) {
  const [guidelines, setGuidelines] = useState(initial.googleGuidelines ?? '')
  const [saved, setSaved]           = useState(initial.googleGuidelines ?? '')
  const [isSaving, setIsSaving]     = useState(false)

  const isDirty = guidelines !== saved

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/admin/platform-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ googleGuidelines: guidelines.trim() || null }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? `Server error ${res.status}`)
      }

      setSaved(guidelines)
      toast.success('Platform settings saved')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="mt-10">
      <div className="flex items-center gap-2 mb-4">
        <Settings2 className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-base font-semibold text-foreground">Platform Settings</h2>
      </div>

      <div className="rounded-xl border border-border bg-card px-5 py-4 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-foreground">
              Google Helpful Content Guidelines
              <span className="ml-1.5 font-normal text-muted-foreground">— injected as <code className="font-mono">{'{{google_guidelines}}'}</code></span>
            </label>
            <WordCount text={guidelines} />
          </div>
          <textarea
            value={guidelines}
            onChange={(e) => setGuidelines(e.target.value)}
            rows={18}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono text-foreground resize-y focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Paste Google's Helpful Content Guidelines here…"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            This singleton is seeded on first deploy and <strong>never overwritten</strong> by re-seeds —
            only manual edits here are preserved.
          </p>
        </div>

        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            className="gap-1.5"
          >
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save Guidelines
          </Button>
        </div>
      </div>
    </section>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OutlineFrameworksPage() {
  const [frameworks, setFrameworks]   = useState<OutlineFramework[]>([])
  const [settings, setSettings]       = useState<PlatformSettings | null>(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const [fwRes, psRes] = await Promise.all([
          fetch('/api/admin/outline-frameworks', { cache: 'no-store' }),
          fetch('/api/admin/platform-settings', { cache: 'no-store' }),
        ])

        if (!fwRes.ok) {
          const body = await fwRes.text()
          if (alive) setError(`HTTP ${fwRes.status}: ${body || fwRes.statusText}`)
          return
        }

        const fwData = await fwRes.json()
        const psData = psRes.ok ? await psRes.json() : null

        if (alive) {
          setFrameworks(fwData.frameworks ?? [])
          setSettings(psData?.settings ?? null)
        }
      } catch (err) {
        if (alive) setError((err as Error).message ?? 'Failed to load data')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  const handleFrameworkSaved = useCallback((updated: OutlineFramework) => {
    setFrameworks((prev) =>
      prev.map((f) => (f.number === updated.number ? updated : f)),
    )
  }, [])

  const activeCount   = frameworks.filter((f) => f.isActive).length
  const inactiveCount = frameworks.length - activeCount

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <LayoutList className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-2xl font-semibold text-foreground">Outline Frameworks</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Manage the 12 article outline frameworks. The framework body is injected as{' '}
          <code className="font-mono text-xs">{'{{outline_framework}}'}</code> in pipeline Step 1.
          LLM auto-assignment uses the description to pick the best match.
        </p>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading frameworks…
        </div>
      )}

      {!loading && error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-semibold">Could not load outline frameworks</div>
            <div className="mt-1 font-mono text-xs">{error}</div>
          </div>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Summary */}
          {frameworks.length > 0 && (
            <div className="mb-4 flex items-center gap-3 text-xs text-muted-foreground">
              <span>{frameworks.length} frameworks total</span>
              <span>·</span>
              <span className="text-green-700">{activeCount} active</span>
              {inactiveCount > 0 && (
                <>
                  <span>·</span>
                  <span className="text-gray-500">{inactiveCount} inactive</span>
                </>
              )}
            </div>
          )}

          {frameworks.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
              No outline frameworks found. Run the seed script (<code className="font-mono text-xs">pnpm db:seed</code>) to populate them.
            </div>
          ) : (
            <div className="space-y-2">
              {frameworks.map((fw) => (
                <FrameworkCard
                  key={fw.id}
                  framework={fw}
                  onSaved={handleFrameworkSaved}
                />
              ))}
            </div>
          )}

          {settings && <PlatformSettingsSection initial={settings} />}
        </>
      )}
    </div>
  )
}
