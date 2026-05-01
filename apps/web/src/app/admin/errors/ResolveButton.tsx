'use client'

import { useState, useTransition } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function ResolveButton({ errorId }: { errorId: string }) {
  const [done, setDone] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function resolve() {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/errors/${errorId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resolved: true }),
        })
        if (!res.ok) throw new Error('Failed')
        setDone(true)
        toast.success('Marked resolved')
        router.refresh()
      } catch {
        toast.error('Failed to resolve')
      }
    })
  }

  return (
    <button
      onClick={resolve}
      disabled={isPending || done}
      className="shrink-0 flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs bg-muted text-muted-foreground hover:bg-muted/80 disabled:opacity-50 transition-colors"
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Check className="h-3.5 w-3.5" />
      )}
      Resolve
    </button>
  )
}
