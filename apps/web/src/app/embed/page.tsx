'use client'

/**
 * Embedded GHL entry point (onboarding plan Phase 0).
 *
 * Runs the SSO handshake, then routes: unfinished onboarding → the chat flow
 * (Phase 1 mounts here); completed → the embedded app surface. Rendered only
 * inside the GHL iframe (frame-ancestors CSP scoped to /embed).
 */
import { useEffect, useState } from 'react'
import { establishEmbedSession, type EmbedSession } from '@/lib/embedSession'

type State =
  | { phase: 'connecting' }
  | { phase: 'error'; message: string }
  | { phase: 'provisioning' }
  | { phase: 'ready'; session: EmbedSession }

export default function EmbedEntry() {
  const [state, setState] = useState<State>({ phase: 'connecting' })

  useEffect(() => {
    let cancelled = false
    establishEmbedSession()
      .then((session) => {
        if (cancelled) return
        if (session.provisioningPending) setState({ phase: 'provisioning' })
        else setState({ phase: 'ready', session })
      })
      .catch((err: unknown) => {
        if (!cancelled) setState({ phase: 'error', message: err instanceof Error ? err.message : String(err) })
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (state.phase === 'connecting') {
    return (
      <Centered>
        <Spinner />
        <p className="text-sm text-muted-foreground mt-3">Connecting to your workspace…</p>
      </Centered>
    )
  }
  if (state.phase === 'provisioning') {
    return (
      <Centered>
        <p className="text-base font-medium text-foreground">Almost there!</p>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm text-center">
          Your content workspace is being set up. You&apos;ll get an email as soon as it&apos;s ready —
          usually within one business day.
        </p>
      </Centered>
    )
  }
  if (state.phase === 'error') {
    return (
      <Centered>
        <p className="text-base font-medium text-foreground">Couldn&apos;t connect</p>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm text-center">{state.message}</p>
      </Centered>
    )
  }

  const { session } = state
  if (!session.onboardingCompleted) {
    // Phase 1 replaces this stub with the chat onboarding flow.
    return (
      <Centered>
        <p className="text-base font-medium text-foreground">
          Welcome{session.user.name ? `, ${session.user.name.split(' ')[0]}` : ''}!
        </p>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm text-center">
          Let&apos;s set up your content engine. (Onboarding chat lands here — Phase 1.)
        </p>
      </Centered>
    )
  }

  return (
    <Centered>
      <p className="text-base font-medium text-foreground">You&apos;re all set.</p>
      <p className="text-sm text-muted-foreground mt-2">Embedded dashboard surface lands here.</p>
    </Centered>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen flex-col items-center justify-center p-6">{children}</div>
}

function Spinner() {
  return (
    <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
  )
}
