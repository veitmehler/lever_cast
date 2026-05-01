'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'

interface RoleToggleProps {
  userId: string
  currentRole: string
}

export function RoleToggle({ userId, currentRole }: RoleToggleProps) {
  const [role, setRole] = useState(currentRole)
  const [isPending, startTransition] = useTransition()

  async function toggleRole() {
    const newRole = role === 'admin' ? 'user' : 'admin'
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/users/${userId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: newRole }),
        })
        if (!res.ok) throw new Error('Failed')
        setRole(newRole)
        toast.success(`Role updated to ${newRole}`)
      } catch {
        toast.error('Failed to update role')
      }
    })
  }

  return (
    <button
      onClick={toggleRole}
      disabled={isPending}
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors disabled:opacity-50 ${
        role === 'admin'
          ? 'bg-primary/20 text-primary hover:bg-primary/30'
          : 'bg-muted text-muted-foreground hover:bg-muted/80'
      }`}
    >
      {role}
    </button>
  )
}
