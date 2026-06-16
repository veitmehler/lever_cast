import Link from 'next/link'
import { Construction, ArrowLeft } from 'lucide-react'

export default function AdminNewsletterGeneratePage() {
  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/newsletter"
        className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Newsletter
      </Link>

      <h1 className="text-2xl font-semibold text-foreground">Generate (manual)</h1>

      <div className="mt-6 flex items-start gap-3 rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
        <Construction className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" />
        <div>
          <p className="font-medium text-foreground">Generation lands in Phase 1c.</p>
          <p className="mt-1">
            This screen will let you pick a calendar + customer + date range and enqueue per-customer
            generation. The data model, CSV ingestion, calendars/assignment, and prompts are in place
            (Phase 1a); research (1b) and generation (1c) come next.
          </p>
        </div>
      </div>
    </div>
  )
}
