import { prisma } from '@socioply/shared'
import { KpiCard } from '@/components/admin/KpiCard'
import Link from 'next/link'
import { AlertTriangle, FileText, Clock } from 'lucide-react'

export default async function AdminDashboardPage() {
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [
    totalUsers,
    totalArticleJobs,
    activeJobs,
    failedJobs,
    unresolvedErrors,
    cost7d,
    recentErrors,
    recentJobs,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.articleJob.count(),
    prisma.articleJob.count({ where: { status: { in: ['pending', 'in_progress'] } } }),
    prisma.articleJob.count({ where: { status: 'failed' } }),
    prisma.errorLog.count({ where: { resolved: false } }),
    prisma.lLMUsage.aggregate({
      where: { createdAt: { gte: since7d } },
      _sum: { cost: true },
    }),
    prisma.errorLog.findMany({
      where: { resolved: false },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { user: { select: { email: true } } },
    }),
    prisma.articleJob.findMany({
      orderBy: { startedAt: 'desc' },
      take: 5,
      include: {
        topic: { select: { topic: true } },
        user: { select: { email: true } },
      },
    }),
  ])

  const cost7dValue = cost7d._sum.cost ?? 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">System overview and key metrics</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard title="Total Users" value={totalUsers} />
        <KpiCard
          title="Cost (7d)"
          value={`$${cost7dValue.toFixed(4)}`}
          sub="LLM API spend"
          accent={cost7dValue > 5 ? 'yellow' : 'default'}
        />
        <KpiCard
          title="Active Jobs"
          value={activeJobs}
          sub={`${totalArticleJobs} total`}
          accent={activeJobs > 0 ? 'green' : 'default'}
        />
        <KpiCard
          title="Unresolved Errors"
          value={unresolvedErrors}
          accent={unresolvedErrors > 0 ? 'red' : 'default'}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Recent Article Jobs</h2>
            </div>
            <Link href="/admin/articles" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-border">
            {recentJobs.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">No article jobs yet</p>
            )}
            {recentJobs.map((job) => (
              <Link
                key={job.id}
                href={`/admin/articles/${job.id}`}
                className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {job.topic.topic}
                  </p>
                  <p className="text-xs text-muted-foreground">{job.user.email}</p>
                </div>
                <StatusBadge status={job.status} />
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Recent Errors</h2>
            </div>
            <Link href="/admin/errors" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-border">
            {recentErrors.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">No unresolved errors</p>
            )}
            {recentErrors.map((err) => (
              <div key={err.id} className="px-4 py-3">
                <p className="truncate text-sm font-medium text-red-400">{err.errorType}</p>
                <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                  {err.errorMessage}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {err.user?.email ?? 'system'} ·{' '}
                  {new Date(err.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>
            {failedJobs} failed job{failedJobs !== 1 ? 's' : ''} total ·{' '}
            <Link href="/admin/articles?status=failed" className="text-primary hover:underline">
              view failed
            </Link>
          </span>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-muted text-muted-foreground',
    in_progress: 'bg-blue-500/20 text-blue-400',
    completed: 'bg-green-500/20 text-green-400',
    approved: 'bg-emerald-500/20 text-emerald-400',
    enriched: 'bg-purple-500/20 text-purple-400',
    exported: 'bg-indigo-500/20 text-indigo-400',
    failed: 'bg-red-500/20 text-red-400',
  }
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] ?? 'bg-muted text-muted-foreground'}`}
    >
      {status}
    </span>
  )
}
