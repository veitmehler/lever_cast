'use client'

import { useEffect, useState } from 'react'
import { Lightbulb, Loader2, Trash2, Pencil, Check } from 'lucide-react'
import { toast } from 'sonner'

interface Idea {
  id: string
  topic: string
  notes: string | null
  createdAt: string
}

export default function IdeasBankPage() {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTopic, setEditTopic] = useState('')
  const [editNotes, setEditNotes] = useState('')

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

  function startEdit(idea: Idea) {
    setEditingId(idea.id)
    setEditTopic(idea.topic)
    setEditNotes(idea.notes ?? '')
  }

  async function saveEdit(id: string) {
    if (!editTopic.trim()) return
    setBusyId(id)
    try {
      const res = await fetch(`/api/topics/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: editTopic.trim(), notes: editNotes.trim() || null }),
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
    if (!confirm('Delete this idea?')) return
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

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center gap-2">
        <Lightbulb className="h-6 w-6 text-amber-500" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ideas Bank</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Your captured article ideas that haven&apos;t been scheduled yet. Schedule them from the
            Content Plan on your dashboard.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : ideas.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          No unused ideas. Capture some on the dashboard under “Capture an Article Idea.”
        </div>
      ) : (
        <div className="space-y-2">
          {ideas.map((idea) => (
            <div key={idea.id} className="rounded-xl border border-border bg-card px-4 py-3">
              {editingId === idea.id ? (
                <div className="space-y-2">
                  <input
                    value={editTopic}
                    onChange={(e) => setEditTopic(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                    autoFocus
                  />
                  <input
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Optional note"
                    className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
                  />
                  <div className="flex justify-end gap-1">
                    <button onClick={() => setEditingId(null)} className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted">Cancel</button>
                    <button onClick={() => saveEdit(idea.id)} disabled={busyId === idea.id || !editTopic.trim()} className="inline-flex items-center gap-1 rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground disabled:opacity-50">
                      <Check className="h-3.5 w-3.5" /> Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-foreground">{idea.topic}</div>
                    {idea.notes && <div className="mt-0.5 text-xs text-muted-foreground">{idea.notes}</div>}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => startEdit(idea)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" title="Edit">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => remove(idea.id)} disabled={busyId === idea.id} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-red-600 disabled:opacity-50" title="Delete">
                      {busyId === idea.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
