'use client'

import { useState, useEffect } from 'react'
import { Globe, Plus, Trash2, CheckCircle2, XCircle, Loader2, ChevronDown, ChevronUp, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

// ── Types ─────────────────────────────────────────────────────────────────────

type WpConnection = {
  id: string
  label: string
  siteUrl: string
  username: string
  defaultStatus: string
  defaultCategoryId?: number | null
  defaultAuthorId?: number | null
  lastVerifiedAt?: string | null
  lastError?: string | null
  createdAt: string
}

type WpOption = { id: number; name: string }

// ── Page ──────────────────────────────────────────────────────────────────────

export default function WordPressSettingsPage() {
  const [connections, setConnections] = useState<WpConnection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetch('/api/wp/connections')
      .then((r) => r.json())
      .then((d) => { setConnections(d.connections ?? []); setIsLoading(false) })
      .catch(() => setIsLoading(false))
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this WordPress connection?')) return
    const res = await fetch(`/api/wp/connections/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setConnections((prev) => prev.filter((c) => c.id !== id))
      toast.success('Connection removed')
    } else {
      toast.error('Failed to remove connection')
    }
  }

  const handleVerify = async (id: string) => {
    toast.info('Verifying…')
    const res = await fetch(`/api/wp/connections/${id}/verify`, { method: 'POST' })
    const data = await res.json()
    if (data.ok) toast.success('Connection verified successfully')
    else toast.error(`Verification failed: ${data.error}`)
    setConnections((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, lastVerifiedAt: data.ok ? new Date().toISOString() : c.lastVerifiedAt, lastError: data.error ?? null }
          : c,
      ),
    )
  }

  const handleAdded = (conn: WpConnection) => {
    setConnections((prev) => [conn, ...prev])
    setShowForm(false)
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">WordPress Connections</h1>
          <p className="text-sm text-gray-500 mt-1">
            Connect WordPress sites to publish enriched articles directly.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Add site
        </Button>
      </div>

      {/* Add-connection form */}
      {showForm && (
        <div className="mb-8">
          <AddConnectionForm onAdded={handleAdded} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {/* Existing connections */}
      {isLoading ? (
        <div className="flex items-center gap-2 text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading…</span>
        </div>
      ) : connections.length === 0 && !showForm ? (
        <div className="text-center py-16 text-gray-400">
          <Globe className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No WordPress sites connected yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {connections.map((conn) => (
            <ConnectionCard
              key={conn.id}
              conn={conn}
              onDelete={handleDelete}
              onVerify={handleVerify}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── ConnectionCard ────────────────────────────────────────────────────────────

function ConnectionCard({
  conn,
  onDelete,
  onVerify,
}: {
  conn: WpConnection
  onDelete: (id: string) => void
  onVerify: (id: string) => void
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Globe className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="font-semibold text-gray-900 truncate">{conn.label}</span>
            {conn.lastVerifiedAt && !conn.lastError ? (
              <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 rounded-full px-2 py-0.5">
                <CheckCircle2 className="h-3 w-3" /> Verified
              </span>
            ) : conn.lastError ? (
              <span className="inline-flex items-center gap-1 text-xs text-red-600 bg-red-50 rounded-full px-2 py-0.5">
                <XCircle className="h-3 w-3" /> Error
              </span>
            ) : null}
          </div>
          <a href={conn.siteUrl} target="_blank" rel="noopener noreferrer"
            className="text-xs text-indigo-600 hover:underline truncate block">
            {conn.siteUrl}
          </a>
          <p className="text-xs text-gray-400 mt-1">
            User: <span className="font-mono">{conn.username}</span> &bull; Default status:{' '}
            <span className="capitalize">{conn.defaultStatus}</span>
          </p>
          {conn.lastError && (
            <p className="text-xs text-red-500 mt-1 truncate">{conn.lastError}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button size="sm" variant="outline" onClick={() => onVerify(conn.id)}>
            Verify
          </Button>
          <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-600"
            onClick={() => onDelete(conn.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── AddConnectionForm ─────────────────────────────────────────────────────────

function AddConnectionForm({
  onAdded,
  onCancel,
}: {
  onAdded: (conn: WpConnection) => void
  onCancel: () => void
}) {
  const [label, setLabel] = useState('')
  const [siteUrl, setSiteUrl] = useState('https://')
  const [username, setUsername] = useState('')
  const [appPassword, setAppPassword] = useState('')
  const [defaultStatus, setDefaultStatus] = useState('draft')
  const [defaultCategoryId, setDefaultCategoryId] = useState<number | ''>('')
  const [defaultAuthorId, setDefaultAuthorId] = useState<number | ''>('')
  const [categories, setCategories] = useState<WpOption[]>([])
  const [authors, setAuthors] = useState<WpOption[]>([])
  const [showHowTo, setShowHowTo] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/wp/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label, siteUrl, username, appPassword,
          defaultStatus,
          defaultCategoryId: defaultCategoryId !== '' ? Number(defaultCategoryId) : undefined,
          defaultAuthorId: defaultAuthorId !== '' ? Number(defaultAuthorId) : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Connection failed'); return }
      // Populate dropdowns from verification response
      if (data.categories) setCategories(data.categories)
      if (data.authors) setAuthors(data.authors)
      toast.success('WordPress site connected!')
      onAdded(data.connection)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-5">
      <h2 className="text-base font-semibold text-gray-800">Connect a WordPress site</h2>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Label */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Label</label>
          <input
            type="text" value={label} onChange={(e) => setLabel(e.target.value)}
            placeholder="My Blog" required
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
        {/* Site URL */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Site URL</label>
          <input
            type="url" value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)}
            placeholder="https://example.com" required
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
        {/* Username */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">WordPress Username</label>
          <input
            type="text" value={username} onChange={(e) => setUsername(e.target.value)}
            placeholder="your-username" required
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
        {/* App Password */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Application Password
            <button
              type="button"
              onClick={() => setShowHowTo((v) => !v)}
              className="ml-1 text-indigo-500 hover:text-indigo-700 align-middle"
              title="How to generate"
            >
              <Info className="h-3.5 w-3.5 inline" />
            </button>
          </label>
          <input
            type="password" value={appPassword} onChange={(e) => setAppPassword(e.target.value)}
            placeholder="xxxx xxxx xxxx xxxx xxxx xxxx" required
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
      </div>

      {/* How-to instructions (collapsible) */}
      {showHowTo && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-800 space-y-1">
          <p className="font-semibold">How to generate an Application Password:</p>
          <ol className="list-decimal pl-5 space-y-1 text-xs">
            <li>Sign in to your WordPress admin dashboard.</li>
            <li>Go to <strong>Users → Profile</strong> (or edit the user you want to use).</li>
            <li>Scroll down to the <strong>Application Passwords</strong> section.</li>
            <li>Type <code>Levercast</code> in the "New Application Password Name" field.</li>
            <li>Click <strong>Add New Application Password</strong> and copy the generated value.</li>
          </ol>
          <p className="text-xs text-blue-600 mt-1">
            Note: Application Passwords require WordPress 5.6+ and HTTPS on your site.
          </p>
        </div>
      )}

      {/* Default settings */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-gray-200 pt-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Default Status</label>
          <select
            value={defaultStatus} onChange={(e) => setDefaultStatus(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="draft">Draft</option>
            <option value="publish">Publish</option>
            <option value="private">Private</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Default Category</label>
          <select
            value={defaultCategoryId}
            onChange={(e) => setDefaultCategoryId(e.target.value !== '' ? Number(e.target.value) : '')}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="">— none —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Default Author</label>
          <select
            value={defaultAuthorId}
            onChange={(e) => setDefaultAuthorId(e.target.value !== '' ? Number(e.target.value) : '')}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="">— none —</option>
            {authors.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />Verifying &amp; saving…</>
          ) : (
            'Verify &amp; Save'
          )}
        </Button>
      </div>
    </form>
  )
}
