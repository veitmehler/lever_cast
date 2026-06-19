'use client'

import { useEffect, useState } from 'react'
import { Loader2, AlertTriangle, Plus, Trash2, Tags } from 'lucide-react'

interface SpecializationRow {
  id: string
  key: string
  label: string
  sortOrder: number
  enabled: boolean
}

export default function AdminSpecializationsPage() {
  const [rows, setRows] = useState<SpecializationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [label, setLabel] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/specializations', { cache: 'no-store' })
      if (!res.ok) {
        setError(`HTTP ${res.status}: ${(await res.text()) || res.statusText}`)
        return
      }
      const data = await res.json()
      setRows(data.specializations ?? [])
    } catch (err) {
      setError((err as Error).message ?? 'Failed to load specializations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setCreateError(null)
    try {
      const res = await fetch('/api/admin/specializations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label, sortOrder: rows.length }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setCreateError(body.error ?? `HTTP ${res.status}`)
        return
      }
      setLabel('')
      await load()
    } catch (err) {
      setCreateError((err as Error).message ?? 'Failed to create')
    } finally {
      setCreating(false)
    }
  }

  async function toggleEnabled(row: SpecializationRow) {
    setBusyId(row.id)
    try {
      await fetch(`/api/admin/specializations/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !row.enabled }),
      })
      await load()
    } finally {
      setBusyId(null)
    }
  }

  async function remove(row: SpecializationRow) {
    if (!confirm(`Delete "${row.label}"? This only works if no calendar uses it.`)) return
    setBusyId(row.id)
    try {
      const res = await fetch(`/api/admin/specializations/${row.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        alert(body.error ?? `HTTP ${res.status}`)
        return
      }
      await load()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center gap-2">
        <Tags className="h-5 w-5 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Specializations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Clients pick from this list (one primary). Each enabled specialization should have a
            Northern and Southern content calendar.
          </p>
        </div>
      </div>

      <form onSubmit={handleCreate} className="mb-8 rounded-xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
          <Plus className="h-4 w-4" />
          New specialization
        </div>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Label</label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
              placeholder="e.g. Prenatal / Pediatric"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {creating && <Loader2 className="h-4 w-4 animate-spin" />}
            Add
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          The key is derived automatically (lowercase, underscores) and is immutable once created.
        </p>
        {createError && <div className="mt-3 text-xs text-red-600">{createError}</div>}
      </form>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading…
        </div>
      )}

      {!loading && error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <div className="font-mono text-xs">{error}</div>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-2">
          {rows.map((row) => (
            <div
              key={row.id}
              className="flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-3"
            >
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-foreground">{row.label}</div>
                <div className="mt-0.5 font-mono text-xs text-muted-foreground">{row.key}</div>
              </div>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={row.enabled}
                  disabled={busyId === row.id}
                  onChange={() => toggleEnabled(row)}
                  className="h-4 w-4 rounded border-input"
                />
                Enabled
              </label>
              <button
                onClick={() => remove(row)}
                disabled={busyId === row.id}
                className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-red-600 disabled:opacity-50"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {rows.length === 0 && (
            <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
              No specializations yet. Add one above.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
