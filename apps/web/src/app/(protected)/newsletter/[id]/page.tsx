'use client'

import Link from 'next/link'
import { use } from 'react'
import { ArrowLeft } from 'lucide-react'
import { NewsletterEditionContent } from '@/features/newsletter/NewsletterEditionContent'

export default function NewsletterEditionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link
        href="/newsletter"
        className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All editions
      </Link>

      <NewsletterEditionContent newsletterId={id} />
    </div>
  )
}
