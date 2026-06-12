'use client'

import Link from 'next/link'
import { Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function WordPressSection() {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h2 className="text-xl font-semibold text-card-foreground mb-2">WordPress</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Connect a WordPress site to publish articles directly from the workflow.
      </p>
      <Button variant="outline" asChild>
        <Link href="/settings/wordpress" className="inline-flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Manage WordPress connections
        </Link>
      </Button>
    </div>
  )
}
