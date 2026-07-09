'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'

interface SubscriptionDateFieldProps {
  accountId: string
  currentDate: string | null // yyyy-mm-dd, or null if unset
}

// Sets Account.subscriptionStartedAt — the billing-cycle anchor the Content
// Plan's 30/60-day windowing derives from (see billing-window.ts). No real
// billing exists yet; this is how a test/comped account gets "activated"
// until a Stripe integration sets this field automatically on first payment.
export function SubscriptionDateField({ accountId, currentDate }: SubscriptionDateFieldProps) {
  const [date, setDate] = useState(currentDate ?? '')
  const [saved, setSaved] = useState(currentDate ?? '')
  const [isPending, startTransition] = useTransition()

  // Save only on blur/commit, never per-keystroke: a native date input's
  // `.value` reports "" while a segment (e.g. the year) is only partially
  // typed, not just when actually cleared. Saving on every onChange fired
  // a PATCH — and flipped `disabled` via isPending — on every keystroke,
  // which kicked focus out of the field mid-type.
  function commit() {
    if (date === saved) return
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/accounts/${accountId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscriptionStartedAt: date || null }),
        })
        if (!res.ok) throw new Error('Failed')
        setSaved(date)
        toast.success(date ? `Subscription start set to ${date}` : 'Subscription start cleared')
      } catch {
        setDate(saved)
        toast.error('Failed to update subscription start')
      }
    })
  }

  return (
    <input
      type="date"
      value={date}
      disabled={isPending}
      onChange={(e) => setDate(e.target.value)}
      onBlur={commit}
      className="rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground disabled:opacity-50"
    />
  )
}
