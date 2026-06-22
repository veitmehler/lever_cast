'use client'

import { useEffect, useState } from 'react'
import { Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface OutlineFrameworkOption {
  number: number
  label: string
  description: string | null
}

export interface EditableTopic {
  id: string
  topic: string
  mode?: string | null
  outlineFrameworkNumber?: number | null
  outlineSpecialInstructions?: string | null
  realCaseStudies?: string | null
}

/**
 * Edit a topic/idea's article framework + advanced options. Used by the Ideas
 * Bank and the Content Plan. Saves via PATCH /api/topics/:id.
 */
export function TopicEditModal({
  topic,
  onClose,
  onSaved,
}: {
  topic: EditableTopic
  onClose: () => void
  onSaved: () => void
}) {
  const [text, setText] = useState(topic.topic)
  const [framework, setFramework] = useState<number | null>(topic.outlineFrameworkNumber ?? null)
  const [articleOnly, setArticleOnly] = useState(topic.mode === 'article_only')
  const [instructions, setInstructions] = useState(topic.outlineSpecialInstructions ?? '')
  const [caseStudies, setCaseStudies] = useState(topic.realCaseStudies ?? '')
  const [frameworks, setFrameworks] = useState<OutlineFrameworkOption[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/outline-frameworks')
      .then((r) => (r.ok ? r.json() : { frameworks: [] }))
      .then((d) => setFrameworks(d.frameworks ?? []))
      .catch(() => setFrameworks([]))
  }, [])

  // Load the topic's current config so the editor preloads accurately on every surface.
  useEffect(() => {
    fetch(`/api/topics/${topic.id}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const t = d?.topic
        if (!t) return
        setText(t.topic ?? '')
        setFramework(t.outlineFrameworkNumber ?? null)
        setArticleOnly(t.mode === 'article_only')
        setInstructions(t.outlineSpecialInstructions ?? '')
        setCaseStudies(t.realCaseStudies ?? '')
      })
      .catch(() => {})
  }, [topic.id])

  async function save() {
    if (!text.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/topics/${topic.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: text.trim(),
          mode: articleOnly ? 'article_only' : 'article_first',
          outlineFrameworkNumber: framework,
          outlineSpecialInstructions: instructions.trim() || null,
          realCaseStudies: caseStudies.trim() || null,
        }),
      })
      if (!res.ok) {
        toast.error('Failed to save')
        return
      }
      toast.success('Saved')
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-card-foreground">Edit article topic</h3>
          <button onClick={onClose} className="rounded p-1 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Topic</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={2}
              className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Outline framework</label>
            <select
              value={framework ?? ''}
              onChange={(e) => setFramework(e.target.value ? Number(e.target.value) : null)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Auto (let the AI choose)</option>
              {frameworks.map((f) => (
                <option key={f.number} value={f.number}>{f.label}</option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={articleOnly} onChange={(e) => setArticleOnly(e.target.checked)} className="h-4 w-4 rounded border-input" />
            Article only — skip the social-post set
          </label>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Special instructions <span className="text-muted-foreground">(optional)</span></label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={2}
              placeholder="Focus areas, angle, things to emphasise or avoid…"
              className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Real case studies / anecdotes <span className="text-muted-foreground">(optional)</span></label>
            <textarea
              value={caseStudies}
              onChange={(e) => setCaseStudies(e.target.value)}
              rows={2}
              placeholder="Real client stories or examples to weave in…"
              className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={save} disabled={saving || !text.trim()}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
