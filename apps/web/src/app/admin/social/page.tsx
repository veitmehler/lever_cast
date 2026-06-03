import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { KpiCard } from '@/components/admin/KpiCard'
import Link from 'next/link'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-muted text-muted-foreground',
  processing: 'bg-yellow-500/20 text-yellow-400',
  ready: 'bg-blue-500/20 text-blue-400',
  scheduling: 'bg-yellow-500/20 text-yellow-400',
  completed: 'bg-green-500/20 text-green-400',
  failed: 'bg-red-500/20 text-red-400',
  cancelled: 'bg-muted text-muted-foreground',
}

const STATUSES = ['pending', 'processing', 'ready', 'scheduling', 'completed', 'failed'] as const

function buildQuery(params: { page?: number; status?: string; email?: string }) {
  const q = new URLSearchParams()
  if (params.page && params.page > 1) q.set('page', String(params.page))
  if (params.status) q.set('status', params.status)
  if (params.email) q.set('email', params.email)
  const s = q.toString()
  return s ? `?${s}` : ''
}

function startOfUtcDay(): Date {
  const d = new Date()
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

export default async function SocialAutomationAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; email?: string }>
}) {
  const { page: pageStr, status, email } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? '1', 10))
  const pageSize = 25
  const skip = (page - 1) * pageSize
  const emailFilter = email?.trim()

  const where: Prisma.SocialAutomationRunWhereInput = {}
  if (status && STATUSES.includes(status as (typeof STATUSES)[number])) {
    where.status = status
  }
  if (emailFilter) {
    where.user = { email: { contains: emailFilter, mode: 'insensitive' } }
  }

  const startOfToday = startOfUtcDay()

  const [runs, total, processingCount, failedCount, completedTodayCount] = await Promise.all([
    prisma.socialAutomationRun.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      include: {
        user: { select: { email: true } },
        job: { include: { topic: { select: { topic: true } } } },
        sitePage: { select: { title: true } },
      },
    }),
    prisma.socialAutomationRun.count({ where }),
    prisma.socialAutomationRun.count({ where: { status: 'processing' } }),
    prisma.socialAutomationRun.count({ where: { status: 'failed' } }),
    prisma.socialAutomationRun.count({
      where: { status: 'completed', updatedAt: { gte: startOfToday } },
    }),
  ])

  const totalPages = Math.ceil(total / pageSize)
  const queryBase = { status, email: emailFilter }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Social Automation Runs</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Daily social post generation runs across all users
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <KpiCard title="Processing" value={processingCount} accent="yellow" />
        <KpiCard title="Failed" value={failedCount} accent={failedCount ? 'red' : 'default'} />
        <KpiCard title="Completed today" value={completedTodayCount} accent="green" />
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3">
        {status && <input type="hidden" name="status" value={status} />}
        <div>
          <label htmlFor="email" className="block text-xs text-muted-foreground mb-1">
            User email
          </label>
          <input
            id="email"
            name="email"
            type="search"
            defaultValue={emailFilter ?? ''}
            placeholder="Filter by email…"
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm w-64"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
        >
          Search
        </button>
        {emailFilter && (
          <Link
            href={`/admin/social${buildQuery({ status })}`}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Clear email
          </Link>
        )}
      </form>

      <div className="flex flex-wrap gap-2">
        <Link
          href={`/admin/social${buildQuery({ email: emailFilter })}`}
          className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
            !status ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}
        >
          All
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/social${buildQuery({ status: s, email: emailFilter })}`}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              status === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}
          >
            {s}
          </Link>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {runs.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-muted-foreground">No runs found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Article</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Specs</th>
                  <th className="px-4 py-3 font-medium">Error</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {runs.map((run) => {
                  const articleTitle =
                    run.job?.topic?.topic ?? run.sitePage?.title ?? '—'
                  return (
                    <tr key={run.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3 whitespace-nowrap text-foreground">
                        {run.scheduledDate}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{run.user.email}</td>
                      <td className="px-4 py-3 max-w-[200px]">
                        {run.jobId ? (
                          <Link
                            href={`/admin/articles/${run.jobId}`}
                            className="text-primary hover:underline line-clamp-1"
                            title={articleTitle}
                          >
                            {articleTitle}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-medium ${
                            STATUS_COLORS[run.status] ?? STATUS_COLORS.pending
                          }`}
                        >
                          {run.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-foreground">
                          {run.completedSpecs}/{run.totalSpecs}
                        </span>
                        {run.failedSpecs > 0 && (
                          <span className="ml-1.5 text-red-400">({run.failedSpecs} failed)</span>
                        )}
                      </td>
                      <td className="px-4 py-3 max-w-[180px]">
                        {run.error ? (
                          <span className="text-xs text-red-400 line-clamp-2" title={run.error}>
                            {run.error}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/social/${run.id}`}
                          className="text-xs text-primary hover:underline"
                        >
                          Details
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/admin/social${buildQuery({ ...queryBase, page: page - 1 })}`}
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
              href={`/admin/social${buildQuery({ ...queryBase, page: page + 1 })}`}
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
