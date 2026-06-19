'use client'

import { useEffect, useState } from 'react'
import { Lightbulb, Loader2, Plus, Trash2, Pencil, CalendarPlus, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface Idea {
  id: string
  topic: string
  notes: string | null
  source: string | null
  createdAt: string
}

export function IdeaBank() {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/topics/ideas', { cache: 'no-store' })
      if (res.ok) setIdeas((await res.json()).ideas ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function capture() {
    if (!draft.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/topics/idea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: draft.trim(), notes: notes.trim() || undefined }),
      })
      if (!res.ok) {
        toast.error('Failed to save idea')
        return
      }
      setDraft('')
      setNotes('')
      await load()
    } finally {
      setSaving(false)
    }
  }

  async function saveEdit(id: string) {
    if (!editText.trim()) return
    setBusyId(id)
    try {
      const res = await fetch(`/api/topics/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: editText.trim() }),
      })
      if (!res.ok) {
        toast.error('Failed to save')
        return
      }
      setEditingId(null)
      await load()
    } finally {
      setBusyId(null)
    }
  }

  async function remove(id: string) {
    setBusyId(id)
    try {
      const res = await fetch(`/api/topics/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        toast.error('Failed to delete')
        return
      }
      setIdeas((prev) => prev.filter((i) => i.id !== id))
    } finally {
      setBusyId(null)
    }
  }

  async function schedule(id: string, date: string) {
    if (!date) return
    setBusyId(id)
    try {
      const res = await fetch(`/api/topics/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledDate: new Date(date + 'T00:00:00').toISOString() }),
      })
      if (!res.ok) {
        toast.error('Failed to schedule')
        return
      }
      toast.success('Scheduled — moved out of your idea bank')
      setIdeas((prev) => prev.filter((i) => i.id !== id))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="mb-8 rounded-2xl border border-border bg-card p-6">
      <div className="mb-1 flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-amber-500" />
        <h2 className="text-lg font-semibold text-card-foreground">Idea bank</h2>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        Capture article ideas as they come to you. Schedule one to a date when you&apos;re ready to turn it into an article.
      </p>

      {/* Capture */}
      <div className="mb-5 space-y-2">
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && capture()}
            placeholder="e.g. How posture affects sleep quality"
            className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <Button onClick={capture} disabled={saving || !draft.trim()}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Save idea
          </Button>
        </div>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional note (angle, audience, source…)"
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : ideas.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">No saved ideas yet.</p>
      ) : (
        <div className="space-y-2">
          {ideas.map((idea) => (
            <div
              key={idea.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-2.5"
            >
              <div className="min-w-0 flex-1">
                {editingId === idea.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveEdit(idea.id)}
                      autoFocus
                      className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm"
                    />
                    <button onClick={() => saveEdit(idea.id)} disabled={busyId === idea.id} className="rounded p-1 text-green-600 hover:bg-muted" title="Save">
                      <Check className="h-4 w-4" />
                    </button>
                    <button onClick={() => setEditingId(null)} className="rounded p-1 text-muted-foreground hover:bg-muted" title="Cancel">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="text-sm font-medium text-foreground">{idea.topic}</div>
                    {idea.notes && <div className="text-xs text-muted-foreground">{idea.notes}</div>}
                  </>
                )}
              </div>

              {editingId !== idea.id && (
                <div className="flex items-center gap-1">
                  {/* Schedule: native date picker; on pick, schedule it */}
                  <label className="relative inline-flex cursor-pointer items-center rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" title="Schedule to a date">
                    <CalendarPlus className="h-4 w-4" />
                    <input
                      type="date"
                      onChange={(e) => schedule(idea.id, e.target.value)}
                      disabled={busyId === idea.id}
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                  </label>
                  <button
                    onClick={() => {
                      setEditingId(idea.id)
                      setEditText(idea.topic)
                    }}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => remove(idea.id)}
                    disabled={busyId === idea.id}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-red-600 disabled:opacity-50"
                    title="Delete"
                  >
                    {busyId === idea.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
