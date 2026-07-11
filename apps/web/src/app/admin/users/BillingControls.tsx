'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'

interface BillingControlsProps {
  accountId: string
  status: string
  paidThrough: string | null // yyyy-mm-dd or null
  billingExempt: boolean
}

// Manual drivers for the Phase A lifecycle state machine (invariant:
// paidThrough governs publishing; status governs generation). GHL billing
// events take over these fields in Phase B; billingExempt stays the
// permanent comp-account switch.
// See .plans/multi-tenancy-hardening.implementation-plan.md.
export function BillingControls({ accountId, status, paidThrough, billingExempt }: BillingControlsProps) {
  const [curStatus, setCurStatus] = useState(status)
  const [curPaidThrough, setCurPaidThrough] = useState(paidThrough ?? '')
  const [savedPaidThrough, setSavedPaidThrough] = useState(paidThrough ?? '')
  const [curExempt, setCurExempt] = useState(billingExempt)
  const [isPending, startTransition] = useTransition()

  function patch(body: Record<string, unknown>, onOk: () => void, onFail: () => void) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/accounts/${accountId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error('Failed')
        onOk()
      } catch {
        onFail()
        toast.error('Failed to update account billing')
      }
    })
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={curStatus}
        disabled={isPending}
        onChange={(e) => {
          const next = e.target.value
          const prev = curStatus
          setCurStatus(next)
          patch({ status: next }, () => toast.success(`Status → ${next}`), () => setCurStatus(prev))
        }}
        className={`rounded border border-border bg-background px-1.5 py-0.5 text-xs ${
          curStatus === 'active' ? 'text-green-600' : curStatus === 'paused' ? 'text-amber-600' : 'text-red-600'
        }`}
      >
        <option value="active">active</option>
        <option value="paused">paused</option>
        <option value="cancelled">cancelled</option>
      </select>
      {/* Save on commit only, never per-keystroke (see SubscriptionDateField). */}
      <input
        type="date"
        title="Paid through — publishing gate"
        value={curPaidThrough}
        disabled={isPending}
        onChange={(e) => setCurPaidThrough(e.target.value)}
        onBlur={() => {
          if (curPaidThrough === savedPaidThrough) return
          patch(
            { paidThrough: curPaidThrough || null },
            () => {
              setSavedPaidThrough(curPaidThrough)
              toast.success(curPaidThrough ? `Paid through ${curPaidThrough}` : 'Paid-through cleared')
            },
            () => setCurPaidThrough(savedPaidThrough),
          )
        }}
        className="rounded border border-border bg-background px-1.5 py-0.5 text-xs text-foreground w-32"
      />
      <label className="flex items-center gap-1 text-xs text-muted-foreground" title="Comp account — bypasses both billing gates">
        <input
          type="checkbox"
          checked={curExempt}
          disabled={isPending}
          onChange={(e) => {
            const next = e.target.checked
            setCurExempt(next)
            patch(
              { billingExempt: next },
              () => toast.success(next ? 'Billing exempt (comp)' : 'Billing exemption removed'),
              () => setCurExempt(!next),
            )
          }}
        />
        comp
      </label>
    </div>
  )
}
