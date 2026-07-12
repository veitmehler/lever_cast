'use client'

/**
 * Chat-styled onboarding UI (onboarding plan Phase 1).
 *
 * Renders the scripted flow as a conversation: assistant bubbles from the
 * step's messages, the user's committed answers as their bubbles, and one
 * input affordance matching the current step kind. Voice recording, rich
 * confirm-cards and background-job awareness arrive with Phases 2–3; this
 * shell already resumes mid-flow (server-held state) and supports text,
 * choice and basic card-confirm answers.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { embedFetch } from '@/lib/embedSession'

interface StepView {
  id: string
  kind: 'info' | 'text' | 'choice' | 'confirm_card' | 'voice' | 'action'
  messages: string[]
  options?: { value: string; label: string }[]
  card?: Record<string, unknown>
  progress: { index: number; total: number }
  pending?: boolean
}

interface HistoryEntry {
  step: string
  answer: unknown
  at: string
}

interface ChatBubble {
  role: 'assistant' | 'user'
  text: string
}

function answerToText(answer: unknown): string {
  if (typeof answer === 'string') return answer
  if (answer && typeof answer === 'object') {
    const a = answer as Record<string, unknown>
    if (typeof a.label === 'string') return a.label
    if (typeof a.text === 'string') return a.text
    if (a.confirmed === true) return 'Looks good ✓'
  }
  return '✓'
}

export function OnboardingChat({ onCompleted }: { onCompleted: () => void }) {
  const [step, setStep] = useState<StepView | null>(null)
  const [bubbles, setBubbles] = useState<ChatBubble[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    const res = await embedFetch('/api/onboarding/state')
    const data = await res.json()
    if (data.completed) return onCompleted()
    const history: HistoryEntry[] = data.history ?? []
    // Rebuild transcript: we only have answers historically; step messages are
    // re-shown for the CURRENT step. Keep it simple: prior answers as user
    // bubbles with a light assistant separator.
    const rebuilt: ChatBubble[] = history.flatMap((h) => [{ role: 'user' as const, text: answerToText(h.answer) }])
    setBubbles([...rebuilt, ...data.step.messages.map((m: string) => ({ role: 'assistant' as const, text: m }))])
    setStep(data.step)
  }, [onCompleted])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [bubbles])

  async function submit(answer: unknown, display?: string) {
    if (!step || busy) return
    setBusy(true)
    setBubbles((b) => [...b, { role: 'user', text: display ?? answerToText(answer) }])
    try {
      const res = await embedFetch('/api/onboarding/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: step.id, answer }),
      })
      const data = await res.json()
      const next: StepView = res.status === 409 ? data.step : data.step
      if (next) {
        setBubbles((b) => [...b, ...next.messages.map((m: string) => ({ role: 'assistant' as const, text: m }))])
        setStep(next)
      }
    } finally {
      setBusy(false)
      setInput('')
    }
  }

  async function complete() {
    setBusy(true)
    try {
      const res = await embedFetch('/api/onboarding/complete', { method: 'POST' })
      if (res.ok) return onCompleted()
      const data = await res.json()
      const missing = (data.readiness?.missing ?? []) as { field: string; why: string }[]
      setBubbles((b) => [
        ...b,
        {
          role: 'assistant',
          text: missing.length
            ? `Almost — a few things still need attention: ${missing.map((m) => m.field).join(', ')}`
            : (data.error ?? 'Not quite ready yet.'),
        },
      ])
    } finally {
      setBusy(false)
    }
  }

  if (!step) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="mx-auto flex h-screen max-w-2xl flex-col">
      {/* progress */}
      <div className="px-4 pt-4">
        <div className="h-1 w-full rounded bg-muted">
          <div
            className="h-1 rounded bg-primary transition-all"
            style={{ width: `${(step.progress.index / step.progress.total) * 100}%` }}
          />
        </div>
      </div>

      {/* transcript */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {bubbles.map((b, i) => (
          <div key={i} className={`flex ${b.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${
                b.role === 'user'
                  ? 'rounded-br-sm bg-primary text-primary-foreground'
                  : 'rounded-bl-sm border border-border bg-card text-foreground'
              }`}
            >
              {b.text}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm border border-border bg-card px-4 py-2.5 text-sm text-muted-foreground">
              <span className="animate-pulse">…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* input affordance per step kind */}
      <div className="border-t border-border p-4">
        {step.kind === 'info' && (
          <button
            onClick={() => submit({ acknowledged: true }, "Let's go!")}
            disabled={busy}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            Let&apos;s go
          </button>
        )}

        {(step.kind === 'text' || step.kind === 'voice') && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (input.trim()) void submit({ text: input.trim() })
            }}
            className="flex gap-2"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={step.kind === 'voice' ? 2 : 4}
              placeholder={step.kind === 'voice' ? 'Type your answer (voice recording coming in the next update)…' : 'Paste here…'}
              className="flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              disabled={busy}
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="self-end rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              Send
            </button>
          </form>
        )}

        {step.kind === 'choice' && (
          <div className="flex flex-wrap gap-2">
            {(step.options ?? []).map((o) => (
              <button
                key={o.value}
                onClick={() => submit({ value: o.value, label: o.label }, o.label)}
                disabled={busy}
                className="rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground hover:bg-muted disabled:opacity-50"
              >
                {o.label}
              </button>
            ))}
          </div>
        )}

        {step.kind === 'confirm_card' && (
          <div className="space-y-2">
            <pre className="max-h-40 overflow-auto rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
              {JSON.stringify(step.card ?? {}, null, 2)}
            </pre>
            <button
              onClick={() => submit({ confirmed: true }, 'Looks good ✓')}
              disabled={busy || step.pending}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {step.pending ? 'Still working on this — one moment…' : 'Looks good'}
            </button>
          </div>
        )}

        {step.kind === 'action' && (
          <button
            onClick={() => void complete()}
            disabled={busy}
            className="w-full rounded-lg bg-primary px-4 py-3 text-base font-semibold text-primary-foreground disabled:opacity-50"
          >
            🚀 Start generating my first month
          </button>
        )}
      </div>
    </div>
  )
}
