import { prisma } from '@omniply/shared'
import { Prisma } from '@prisma/client'
import { KpiCard } from '@/components/admin/KpiCard'
import Link from 'next/link'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-muted text-muted-foreground',
  in_progress: 'bg-blue-500/20 text-blue-400',
  completed: 'bg-green-500/20 text-green-400',
  approved: 'bg-emerald-500/20 text-emerald-400',
  enriched: 'bg-purple-500/20 text-purple-400',
  exported: 'bg-indigo-500/20 text-indigo-400',
  failed: 'bg-red-500/20 text-red-400',
}

export default async function ArticlesAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>
}) {
  const { page: pageStr, status } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? '1', 10))
  const pageSize = 25
  const skip = (page - 1) * pageSize

  const where: Prisma.ArticleJobWhereInput = {}
  if (status) where.status = status

  const [jobs, total, statusCounts] = await Promise.all([
    prisma.articleJob.findMany({
      where,
      orderBy: [{ startedAt: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: pageSize,
      include: {
        topic: { select: { topic: true, mode: true } },
        user: { select: { email: true } },
        sitePage: { select: { title: true, primaryKeyword: true } },
        _count: { select: { pipelineSteps: true, errorLogs: true } },
      },
    }),
    prisma.articleJob.count({ where }),
    prisma.articleJob.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
  ])

  const totalPages = Math.ceil(total / pageSize)
  const statusMap = Object.fromEntries(statusCounts.map((s) => [s.status, s._count.id]))

  const statuses = ['pending', 'in_progress', 'completed', 'approved', 'enriched', 'exported', 'failed']

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Article Jobs</h1>
        <p className="text-sm text-muted-foreground mt-1">All article pipeline runs across all users</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <KpiCard title="Total Jobs" value={total} />
        <KpiCard
          title="Active"
          value={(statusMap.in_progress ?? 0) + (statusMap.pending ?? 0)}
          accent="green"
        />
        <KpiCard title="Failed" value={statusMap.failed ?? 0} accent={statusMap.failed ? 'red' : 'default'} />
        <KpiCard title="Enriched" value={statusMap.enriched ?? 0} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/articles"
          className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
            !status ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}
        >
          All ({total})
        </Link>
        {statuses.map((s) => (
          <Link
            key={s}
            href={`/admin/articles?status=${s}`}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              status === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {s} ({statusMap[s] ?? 0})
          </Link>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {jobs.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-muted-foreground">No jobs found</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Topic</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">User</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Steps</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Cost</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Started</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/admin/articles/${job.id}`} className="hover:text-primary transition-colors">
                      <p className="font-medium text-foreground truncate max-w-xs">
                        {job.sitePage?.title ?? job.topic.topic}
                      </p>
                      {job.sitePage?.primaryKeyword && (
                        <p className="text-xs text-muted-foreground">{job.sitePage.primaryKeyword}</p>
                      )}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[job.status] ?? 'bg-muted text-muted-foreground'}`}
                    >
                      {job.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{job.user.email}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {job._count.pipelineSteps}
                    {job._count.errorLogs > 0 && (
                      <span className="ml-1 text-red-400">({job._count.errorLogs} err)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-foreground">
                    ${job.totalCost.toFixed(4)}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground text-xs">
                    {job.startedAt
                      ? new Date(job.startedAt).toLocaleDateString()
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/admin/articles?page=${page - 1}${status ? `&status=${status}` : ''}`}
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
              href={`/admin/articles?page=${page + 1}${status ? `&status=${status}` : ''}`}
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
