'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Invisible client component that calls router.refresh() on an interval
 * while the job is in an active / non-terminal state. This re-runs the
 * parent server component's data fetch so the admin detail page stays
 * up to date without a manual reload.
 */
export function PollRefresh({ active }: { active: boolean }) {
  const router = useRouter()

  useEffect(() => {
    if (!active) return
    const id = setInterval(() => router.refresh(), 5000)
    return () => clearInterval(id)
  }, [active, router])

  return null
}
