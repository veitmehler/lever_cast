'use client'

import Link from 'next/link'
import { Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LinktreeDownloadButton } from './LinktreeDownloadButton'

export function WordPressSection() {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h2 className="text-xl font-semibold text-card-foreground mb-2">WordPress</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Connect a WordPress site to publish articles directly from the workflow. Connected sites also get a
        link-in-bio page published automatically at <code className="text-xs">/linktree</code>.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" asChild>
          <Link href="/settings/wordpress" className="inline-flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Manage WordPress connections
          </Link>
        </Button>
        <LinktreeDownloadButton />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Not on WordPress? Download the page as a single HTML file and upload it to your own hosting.
      </p>
    </div>
  )
}
