'use client'

import { useEffect, useState } from 'react'
import { Loader2, UserPlus, X, Users, Crown, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface Member {
  id: string
  name: string | null
  email: string
  isOwner: boolean
  isSelf: boolean
}

interface AccountData {
  account: { id: string; name: string | null; assistantEmail: string | null }
  members: Member[]
  pendingInvites: string[]
  seatsUsed: number
  seatLimit: number
}

export function TeamSection() {
  const [data, setData] = useState<AccountData | null>(null)
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [assistantEmail, setAssistantEmail] = useState('')
  const [savingAssistant, setSavingAssistant] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/account', { cache: 'no-store' })
      if (res.ok) {
        const d: AccountData = await res.json()
        setData(d)
        setAssistantEmail(d.account.assistantEmail ?? '')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const seatsFull = data ? data.seatsUsed >= data.seatLimit : false

  async function invite() {
    if (!inviteEmail.trim()) return
    setBusy(true)
    try {
      const res = await fetch('/api/account/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(body.error ?? 'Failed to send invite')
        return
      }
      toast.success(`Invitation sent to ${body.email}`)
      setInviteEmail('')
      await load()
    } finally {
      setBusy(false)
    }
  }

  async function removeMember(m: Member) {
    if (!confirm(`Remove ${m.name ?? m.email} from your team? They'll keep the content they created.`)) return
    setBusy(true)
    try {
      const res = await fetch(`/api/account/members/${m.id}`, { method: 'DELETE' })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(body.error ?? 'Failed to remove member')
        return
      }
      await load()
    } finally {
      setBusy(false)
    }
  }

  async function revokeInvite(email: string) {
    setBusy(true)
    try {
      const res = await fetch(`/api/account/invite?email=${encodeURIComponent(email)}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        toast.error(body.error ?? 'Failed to revoke invite')
        return
      }
      await load()
    } finally {
      setBusy(false)
    }
  }

  async function saveAssistant() {
    setSavingAssistant(true)
    try {
      const res = await fetch('/api/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assistantEmail: assistantEmail.trim() || null }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        toast.error(body.error ?? 'Failed to save')
        return
      }
      toast.success('Saved')
    } finally {
      setSavingAssistant(false)
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-2 flex items-center gap-2">
        <Users className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-xl font-semibold text-card-foreground">Team</h2>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        Up to {data?.seatLimit ?? 3} people can share this account with equal access to all content
        and settings.
      </p>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : !data ? (
        <p className="text-sm text-muted-foreground">Could not load your team.</p>
      ) : (
        <div className="space-y-5">
          {/* Members */}
          <div className="space-y-2">
            {data.members.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                    {m.name ?? m.email}
                    {m.isOwner && <Crown className="h-3.5 w-3.5 text-amber-500" aria-label="Owner" />}
                    {m.isSelf && <span className="text-xs text-muted-foreground">(you)</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">{m.email}</div>
                </div>
                {!m.isOwner && (
                  <button
                    onClick={() => removeMember(m)}
                    disabled={busy}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-red-600 disabled:opacity-50"
                    title="Remove"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}

            {/* Pending invites */}
            {data.pendingInvites.map((email) => (
              <div
                key={email}
                className="flex items-center gap-3 rounded-lg border border-dashed border-border px-4 py-3"
              >
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div className="min-w-0 flex-1 text-sm text-muted-foreground">
                  {email} <span className="text-xs">· invited</span>
                </div>
                <button
                  onClick={() => revokeInvite(email)}
                  disabled={busy}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-red-600 disabled:opacity-50"
                  title="Revoke invite"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Invite form */}
          {seatsFull ? (
            <p className="text-xs text-amber-600">
              All {data.seatLimit} seats are in use. Remove a member or revoke an invite to add someone new.
            </p>
          ) : (
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Invite a teammate by email
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && invite()}
                  placeholder="teammate@example.com"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <Button onClick={invite} disabled={busy || !inviteEmail.trim()}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                Invite
              </Button>
            </div>
          )}

          {/* Default assistant email (used by collaborative edit requests) */}
          <div className="border-t border-border pt-4">
            <label className="mb-1 block text-sm font-medium text-card-foreground">
              Default assistant for edit requests <span className="text-muted-foreground">(optional)</span>
            </label>
            <p className="mb-2 text-xs text-muted-foreground">
              When you send edit requests on an article, they default to this person. Usually one of your team members.
            </p>
            <div className="flex items-end gap-2">
              <input
                type="email"
                value={assistantEmail}
                onChange={(e) => setAssistantEmail(e.target.value)}
                placeholder="assistant@example.com"
                className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <Button variant="outline" onClick={saveAssistant} disabled={savingAssistant}>
                {savingAssistant && <Loader2 className="h-4 w-4 animate-spin" />}
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
