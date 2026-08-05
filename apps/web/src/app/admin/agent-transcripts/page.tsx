'use client'

/**
 * Chat-agent transcripts (chat-agent plan C2b): flagged conversations sort
 * first — red-flag interceptions, post-filter replacements, failed action
 * executions. Click a row to read the full transcript inline.
 */
import { useEffect, useState } from 'react'
import { Loader2, AlertTriangle, Flag, MessageCircle } from 'lucide-react'

interface Conversation {
  id: string
  accountId: string
  account?: { name: string | null } | null
  flagged: boolean
  flagReason: string | null
  endedReason: string | null
  turnCount: number
  costUsd: number
  ghlContactId: string | null
  createdAt: string
}

interface Message {
  role: string
  content: string
  action: unknown
  filtered: boolean
  createdAt: string
}

export default function AgentTranscriptsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Record<string, Message[]>>({})
  const [flaggedOnly, setFlaggedOnly] = useState(false)

  useEffect(() => {
    let alive = true
    setLoading(true)
    ;(async () => {
      try {
        const res = await fetch(`/api/admin/agent-conversations${flaggedOnly ? '?flagged=1' : ''}`, { cache: 'no-store' })
        if (!res.ok) {
          if (alive) setError(`HTTP ${res.status}`)
          return
        }
        const data = await res.json()
        if (alive) {
          setConversations(data.conversations ?? [])
          setError(null)
        }
      } catch (err) {
        if (alive) setError((err as Error).message)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [flaggedOnly])

  async function toggle(id: string) {
    if (openId === id) {
      setOpenId(null)
      return
    }
    setOpenId(id)
    if (!messages[id]) {
      const res = await fetch(`/api/admin/agent-conversations/${id}`, { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setMessages((m) => ({ ...m, [id]: data.conversation?.messages ?? [] }))
      }
    }
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Chat Agent Transcripts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Flagged conversations first (red-flag interceptions, post-filter replacements, failed actions).
            Retention: 180 days.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" checked={flaggedOnly} onChange={(e) => setFlaggedOnly(e.target.checked)} />
          Flagged only
        </label>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      )}

      {!loading && error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertTriangle className="h-4 w-4 mt-0.5" /> {error}
        </div>
      )}

      {!loading && !error && conversations.length === 0 && (
        <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
          No conversations yet.
        </div>
      )}

      <div className="space-y-2">
        {conversations.map((c) => (
          <div key={c.id} className={`rounded-xl border ${c.flagged ? 'border-red-300' : 'border-border'} bg-card`}>
            <button onClick={() => toggle(c.id)} className="flex w-full items-center gap-3 px-5 py-3 text-left">
              {c.flagged ? (
                <Flag className="h-4 w-4 flex-shrink-0 text-red-500" />
              ) : (
                <MessageCircle className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-medium text-foreground">{c.account?.name ?? c.accountId.slice(0, 8)}</span>
                  <span className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleString()}</span>
                  {c.flagReason && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">{c.flagReason}</span>
                  )}
                  {c.endedReason && !c.flagReason && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{c.endedReason}</span>
                  )}
                  {c.ghlContactId && (
                    <span className="rounded-full bg-lime-100 px-2 py-0.5 text-xs font-medium text-lime-800">contact created</span>
                  )}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {c.turnCount} turns · ${c.costUsd.toFixed(4)}
                </div>
              </div>
            </button>
            {openId === c.id && (
              <div className="border-t border-border px-5 py-4 space-y-2">
                {(messages[c.id] ?? []).map((m, i) => (
                  <div key={i} className={`text-sm ${m.role === 'visitor' ? 'text-foreground' : 'text-muted-foreground'}`}>
                    <span className="font-semibold">{m.role === 'visitor' ? 'Visitor' : 'Assistant'}:</span> {m.content}
                    {m.filtered && <span className="ml-2 rounded bg-amber-100 px-1.5 text-xs text-amber-800">post-filtered</span>}
                    {m.action != null && (
                      <code className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs">{JSON.stringify(m.action)}</code>
                    )}
                  </div>
                ))}
                {!(messages[c.id]?.length) && (
                  <div className="text-xs text-muted-foreground">Loading transcript…</div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
