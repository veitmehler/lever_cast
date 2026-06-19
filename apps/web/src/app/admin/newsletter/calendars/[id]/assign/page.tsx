'use client'

import Link from 'next/link'
import { use, useEffect, useState } from 'react'
import { Loader2, AlertTriangle, ArrowLeft, UserPlus, UserMinus, Star } from 'lucide-react'

interface AssignedUser {
  id: string
  name: string | null
  email: string
}

interface Candidate {
  id: string
  name: string | null
  email: string
  primarySpecialization: string | null
  hemisphere: string | null
  alreadyAssignedElsewhere: boolean
  matchScore: number
}

export default function AdminNewsletterAssignPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [assigned, setAssigned] = useState<AssignedUser[]>([])
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyUserId, setBusyUserId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/newsletter/calendars/${id}/assignments`, { cache: 'no-store' })
      if (!res.ok) {
        setError(`HTTP ${res.status}: ${(await res.text()) || res.statusText}`)
        return
      }
      const data = await res.json()
      setAssigned(data.assigned ?? [])
      setCandidates(data.candidates ?? [])
    } catch (err) {
      setError((err as Error).message ?? 'Failed to load assignments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function act(path: 'assign' | 'unassign', userId: string) {
    setBusyUserId(userId)
    try {
      const res = await fetch(`/api/admin/newsletter/calendars/${id}/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error ?? `HTTP ${res.status}`)
        return
      }
      await load()
    } catch (err) {
      setError((err as Error).message ?? 'Action failed')
    } finally {
      setBusyUserId(null)
    }
  }

  return (
    <div className="max-w-3xl">
      <Link
        href={`/admin/newsletter/calendars/${id}`}
        className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to calendar
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Assign customers</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A customer can be assigned to one calendar. Suggested matches are ranked by industry +
          specialization.
        </p>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading…
        </div>
      )}

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <div className="font-mono text-xs">{error}</div>
        </div>
      )}

      {!loading && (
        <>
          <section className="mb-8">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Assigned ({assigned.length})
            </h2>
            {assigned.length === 0 ? (
              <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
                No customers assigned yet.
              </div>
            ) : (
              <div className="space-y-2">
                {assigned.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-foreground">{u.name ?? u.email}</div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                    </div>
                    <button
                      onClick={() => act('unassign', u.id)}
                      disabled={busyUserId === u.id}
                      className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
                    >
                      {busyUserId === u.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <UserMinus className="h-3.5 w-3.5" />
                      )}
                      Unassign
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Suggested matches
            </h2>
            {candidates.length === 0 ? (
              <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
                No other customers available.
              </div>
            ) : (
              <div className="space-y-2">
                {candidates.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        {c.name ?? c.email}
                        {c.matchScore > 0 && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                            <Star className="h-2.5 w-2.5" />
                            match
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {c.email}
                        {(c.primarySpecialization || c.hemisphere) &&
                          ` · ${[c.primarySpecialization, c.hemisphere].filter(Boolean).join(' / ')}`}
                        {c.alreadyAssignedElsewhere && ' · already on another calendar'}
                      </div>
                    </div>
                    <button
                      onClick={() => act('assign', c.id)}
                      disabled={busyUserId === c.id}
                      className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
                    >
                      {busyUserId === c.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <UserPlus className="h-3.5 w-3.5" />
                      )}
                      Assign
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
