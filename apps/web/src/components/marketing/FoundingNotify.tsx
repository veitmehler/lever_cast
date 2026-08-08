'use client'

/**
 * Pre-launch notify pitch (prelaunch-waitlist plan; format user-locked
 * 2026-08-08): centered accent heading, 30px-padded pitch, centered button
 * "Please notify me when it goes live", small centered under-text.
 * One-click join when the visitor's X-Ray lead is in localStorage (same
 * origin as /x-ray); otherwise routes to the quiz first.
 */
import { useEffect, useState } from 'react'
import { TOKENS } from './Marketing'

const LAUNCH_TS = Date.parse('2026-09-08T14:00:00Z')
const JOINED_KEY = 'omniply-founding-joined'
const LEAD_KEY = 'omniply-xray-v1'

const PITCH =
  'Your X-Ray just showed you where patients quietly slip away. When Omniply goes live, the first twelve practices receive concierge onboarding: we build your entire system together in a live working session... your voice, your calendar, your first month of content... so you learn it while it takes shape. Those twelve also keep their monthly rate locked from day one, for as long as they stay. Once the twelve places are filled, the doors close while we get them up and running.'

function storedLead(): { name?: string; email?: string } | null {
  try {
    const saved = JSON.parse(localStorage.getItem(LEAD_KEY) ?? 'null') as { lead?: { name?: string; email?: string } } | null
    return saved?.lead ?? null
  } catch {
    return null
  }
}

export function FoundingNotify() {
  const [state, setState] = useState<'idle' | 'busy' | 'joined'>('idle')
  useEffect(() => {
    try {
      if (localStorage.getItem(JOINED_KEY)) setState('joined')
    } catch {
      /* noop */
    }
  }, [])

  if (Date.now() >= LAUNCH_TS) return null

  async function join() {
    const lead = storedLead()
    if (!lead?.email) {
      window.location.href = '/x-ray'
      return
    }
    setState('busy')
    try {
      const api = /^staging\./.test(window.location.hostname) ? 'https://staging-svc.omniply.io' : 'https://svc.omniply.io'
      const res = await fetch(`${api}/api/marketing/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: lead.name ?? '', email: lead.email }),
      })
      if (!res.ok) throw new Error(`http ${res.status}`)
      try {
        localStorage.setItem(JOINED_KEY, '1')
      } catch {
        /* noop */
      }
      setState('joined')
    } catch {
      setState('idle')
    }
  }

  return (
    <div className="my-10">
      <div className="text-center text-3xl font-bold md:text-4xl" style={{ color: TOKENS.lime }}>
        Omniply opens September&nbsp;8
      </div>
      <p className="text-[18px] leading-relaxed md:text-[20px]" style={{ padding: '30px 0' }}>
        {PITCH}
      </p>
      <div className="flex flex-col items-center gap-3">
        {state === 'joined' ? (
          <div className="rounded-xl px-10 py-5 text-lg font-bold" style={{ background: 'rgba(195,244,59,0.12)', color: TOKENS.lime }}>
            You&apos;re on the list ✓
          </div>
        ) : (
          <button
            onClick={join}
            disabled={state === 'busy'}
            className="rounded-xl px-10 py-5 text-lg font-bold shadow-lg transition-transform hover:scale-[1.02] disabled:opacity-60"
            style={{ background: TOKENS.lime, color: '#0B0B0C' }}
          >
            {state === 'busy' ? 'One moment…' : 'Please notify me when it goes live'}
          </button>
        )}
        <p className="text-center text-sm opacity-70">
          {state === 'joined'
            ? 'We will email you the moment the doors open.'
            : 'One click if you have taken the X-Ray. Otherwise it takes you there first.'}
        </p>
      </div>
    </div>
  )
}
