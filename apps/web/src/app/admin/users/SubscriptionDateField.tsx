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
  const [isPending, startTransition] = useTransition()

  function save(next: string) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/accounts/${accountId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscriptionStartedAt: next || null }),
        })
        if (!res.ok) throw new Error('Failed')
        setDate(next)
        toast.success(next ? `Subscription start set to ${next}` : 'Subscription start cleared')
      } catch {
        toast.error('Failed to update subscription start')
      }
    })
  }

  return (
    <input
      type="date"
      value={date}
      disabled={isPending}
      onChange={(e) => save(e.target.value)}
      className="rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground disabled:opacity-50"
    />
  )
}
