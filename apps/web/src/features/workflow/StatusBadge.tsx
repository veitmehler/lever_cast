'use client'

import { Loader2 } from 'lucide-react'
import { ACTIVE_STATUSES, STATUS_LABELS } from './constants'

export function StatusBadge({ status, busy }: { status: string; busy?: boolean }) {
  const { label, color, bg } = STATUS_LABELS[status] ?? {
    label: status, color: 'text-muted-foreground', bg: 'bg-muted',
  }
  const isActive = busy === true ? true : ACTIVE_STATUSES.has(status)
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${color} ${bg}`}>
      {isActive && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {label}
    </span>
  )
}
