'use client'

import Link from 'next/link'
import { BookOpen, Eye, Search, Tag } from 'lucide-react'
import { resolveBestTitle } from './review-text'
import type { WorkflowView } from './useWorkflowJob'

// SEO & article metadata (visible once SitePage exists)
export function ArticleMetadataPanel({ workflow }: { workflow: WorkflowView }) {
  const { job, jobId, sitePage, isApproving } = workflow

  if (!sitePage) return null

  return (
    <div className="bg-card rounded-xl border border-border p-6 mb-6">
      <div className="flex items-center gap-2 mb-4 flex-wrap justify-between">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-card-foreground uppercase tracking-wider">
            Article Metadata
          </h2>
        </div>
        <Link
          href={`/workflow/${jobId}/preview`}
          target="_blank"
          className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80"
        >
          <Eye className="h-3.5 w-3.5" /> Preview article
        </Link>
      </div>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
        <div>
          <dt className="text-xs text-muted-foreground uppercase tracking-wide">SEO Title</dt>
          <dd className="text-sm text-card-foreground mt-0.5 font-medium">
            {resolveBestTitle(sitePage, job.pipelineSteps, isApproving)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground uppercase tracking-wide">URL Slug</dt>
          <dd className="text-sm text-card-foreground mt-0.5 font-mono bg-muted rounded px-2 py-0.5 inline-block">
            /{sitePage.slug}
          </dd>
        </div>
        {sitePage.primaryKeyword && (
          <div>
            <dt className="text-xs text-muted-foreground uppercase tracking-wide">Primary Keyword</dt>
            <dd className="text-sm text-card-foreground mt-0.5 inline-flex items-center gap-1">
              <Tag className="h-3 w-3 text-muted-foreground" />
              {sitePage.primaryKeyword}
            </dd>
          </div>
        )}
        {sitePage.readingTime && (
          <div>
            <dt className="text-xs text-muted-foreground uppercase tracking-wide">Reading Time</dt>
            <dd className="text-sm text-card-foreground mt-0.5 inline-flex items-center gap-1">
              <BookOpen className="h-3 w-3 text-muted-foreground" />
              {sitePage.readingTime} min
            </dd>
          </div>
        )}
        {sitePage.seoDescription && (
          <div className="col-span-2">
            <dt className="text-xs text-muted-foreground uppercase tracking-wide">Meta Description</dt>
            <dd className="text-sm text-muted-foreground mt-0.5">{sitePage.seoDescription}</dd>
          </div>
        )}
        {sitePage.excerpt && (
          <div className="col-span-2">
            <dt className="text-xs text-muted-foreground uppercase tracking-wide">Excerpt</dt>
            <dd className="text-sm text-muted-foreground mt-0.5 italic">&ldquo;{sitePage.excerpt}&rdquo;</dd>
          </div>
        )}
      </dl>
    </div>
  )
}
