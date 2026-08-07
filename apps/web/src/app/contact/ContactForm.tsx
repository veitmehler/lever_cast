'use client'

/**
 * Marketing contact form (line-only style: underline fields, no boxes).
 * Posts through /api/marketing-contact (same-origin proxy) so the inquiry
 * lands in Azavea's GHL Conversations inbox.
 */
import { useState } from 'react'
import { TOKENS } from '@/components/marketing/Marketing'

const FIELD =
  'w-full bg-transparent border-0 border-b py-3 text-[18px] outline-none transition-colors placeholder:opacity-50'

export function ContactForm() {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = Object.fromEntries(new FormData(form).entries())
    setState('sending')
    setError(null)
    try {
      const res = await fetch('/api/marketing-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(body?.error ?? 'Something went wrong.')
      }
      setState('sent')
      form.reset()
    } catch (err) {
      setState('error')
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  if (state === 'sent') {
    return (
      <div className="rounded-xl px-6 py-10 text-center" style={{ background: 'rgba(132,180,32,0.08)' }}>
        <p className="text-xl font-bold" style={{ color: TOKENS.accentDeep }}>Message sent.</p>
        <p className="mt-2 text-[18px]" style={{ color: TOKENS.muted }}>
          We read every message and reply within one business day.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div className="grid gap-8 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-bold uppercase tracking-[0.14em]" style={{ color: TOKENS.accentDeep }}>Name</span>
          <input name="name" required maxLength={100} placeholder="Dr. Jane Miller" className={FIELD} style={{ borderColor: TOKENS.line }} />
        </label>
        <label className="block">
          <span className="text-sm font-bold uppercase tracking-[0.14em]" style={{ color: TOKENS.accentDeep }}>Email</span>
          <input name="email" type="email" required maxLength={254} placeholder="you@yourpractice.com" className={FIELD} style={{ borderColor: TOKENS.line }} />
        </label>
      </div>
      <label className="block">
        <span className="text-sm font-bold uppercase tracking-[0.14em]" style={{ color: TOKENS.accentDeep }}>Practice (optional)</span>
        <input name="practice" maxLength={150} placeholder="Your practice name and city" className={FIELD} style={{ borderColor: TOKENS.line }} />
      </label>
      <label className="block">
        <span className="text-sm font-bold uppercase tracking-[0.14em]" style={{ color: TOKENS.accentDeep }}>Message</span>
        <textarea name="message" required maxLength={4000} rows={5} placeholder="What would you like to know?" className={`${FIELD} resize-none`} style={{ borderColor: TOKENS.line }} />
      </label>
      {/* Honeypot: hidden from humans, filled by naive bots */}
      <input name="website" tabIndex={-1} autoComplete="off" className="absolute -left-[9999px] h-0 w-0 opacity-0" aria-hidden="true" />
      {state === 'error' && <p className="text-[16px]" style={{ color: '#B4231F' }}>{error}</p>}
      <button
        type="submit"
        disabled={state === 'sending'}
        className="rounded-xl px-10 py-4 text-lg font-bold shadow-lg transition-transform hover:scale-[1.02] disabled:opacity-60"
        style={{ background: TOKENS.lime, color: '#0B0B0C' }}
      >
        {state === 'sending' ? 'Sending…' : 'Send message'}
      </button>
    </form>
  )
}
