import { prisma } from '@omniply/shared'
import { KpiCard } from '@/components/admin/KpiCard'
import { ResolveButton } from './ResolveButton'
import Link from 'next/link'
import type { Prisma } from '@prisma/client'

const SOCIAL_ERROR_TYPES = [
  'social_automation_spec',
  'social_automation_run',
  'social_automation_run_failed',
  'social_ghl_schedule',
  'social_schedule',
  'social_caption_fallback',
  'syndication_generate_failed',
] as const

function buildQuery(params: { page?: number; resolved?: boolean; type?: string }) {
  const q = new URLSearchParams()
  if (params.page && params.page > 1) q.set('page', String(params.page))
  if (params.resolved) q.set('resolved', 'true')
  if (params.type) q.set('type', params.type)
  const s = q.toString()
  return s ? `?${s}` : ''
}

export default async function ErrorsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; resolved?: string; type?: string }>
}) {
  const { page: pageStr, resolved: resolvedStr, type: typeStr } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? '1', 10))
  const pageSize = 50
  const skip = (page - 1) * pageSize

  const showResolved = resolvedStr === 'true'
  const errorTypeFilter =
    typeStr && SOCIAL_ERROR_TYPES.includes(typeStr as (typeof SOCIAL_ERROR_TYPES)[number])
      ? typeStr
      : undefined

  const where: Prisma.ErrorLogWhereInput = {
    resolved: showResolved,
    ...(errorTypeFilter ? { errorType: errorTypeFilter } : {}),
  }

  const [errors, total, unresolvedCount] = await Promise.all([
    prisma.errorLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      include: { user: { select: { email: true } } },
    }),
    prisma.errorLog.count({ where }),
    prisma.errorLog.count({ where: { resolved: false } }),
  ])

  const totalPages = Math.ceil(total / pageSize)
  const queryBase = { resolved: showResolved, type: errorTypeFilter }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Error Logs</h1>
          <p className="text-sm text-muted-foreground mt-1">Pipeline and system errors</p>
        </div>
        <KpiCard
          title="Unresolved"
          value={unresolvedCount}
          accent={unresolvedCount > 0 ? 'red' : 'default'}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={`/admin/errors${buildQuery({ resolved: showResolved, type: errorTypeFilter })}`}
          className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
            !showResolved ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}
        >
          Unresolved ({unresolvedCount})
        </Link>
        <Link
          href={`/admin/errors${buildQuery({ resolved: true, type: errorTypeFilter })}`}
          className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
            showResolved ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}
        >
          Resolved
        </Link>
        <span className="mx-1 self-center text-xs text-muted-foreground">|</span>
        <Link
          href={`/admin/errors${buildQuery({ resolved: showResolved })}`}
          className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
            !errorTypeFilter ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}
        >
          All types
        </Link>
        {SOCIAL_ERROR_TYPES.map((type) => (
          <Link
            key={type}
            href={`/admin/errors${buildQuery({ resolved: showResolved, type })}`}
            className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
              errorTypeFilter === type
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {type.replace(/^social_/, '')}
          </Link>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {errors.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-muted-foreground">
            {showResolved ? 'No resolved errors' : 'No unresolved errors — all clear'}
          </p>
        ) : (
          <div className="divide-y divide-border">
            {errors.map((err) => (
              <div key={err.id} className="px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="rounded bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400">
                        {err.errorType}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {err.user?.email ?? 'system'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(err.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-foreground line-clamp-2">
                      {err.errorMessage}
                    </p>
                    {err.jobId && (
                      <Link
                        href={`/admin/articles/${err.jobId}`}
                        className="mt-1 inline-block text-xs text-primary hover:underline"
                      >
                        View article job →
                      </Link>
                    )}
                    {err.context != null && (
                      <details className="mt-2">
                        <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                          Context
                        </summary>
                        <pre className="mt-1 text-xs bg-muted/40 rounded p-2 overflow-x-auto whitespace-pre-wrap break-all">
                          {JSON.stringify(err.context, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                  {!showResolved && (
                    <ResolveButton errorId={err.id} />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/admin/errors${buildQuery({ ...queryBase, page: page - 1 })}`}
              className="rounded px-3 py-1.5 text-xs bg-muted text-muted-foreground hover:text-foreground"
            >
              Previous
            </Link>
          )}
          <span className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/admin/errors${buildQuery({ ...queryBase, page: page + 1 })}`}
              className="rounded px-3 py-1.5 text-xs bg-muted text-muted-foreground hover:text-foreground"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
