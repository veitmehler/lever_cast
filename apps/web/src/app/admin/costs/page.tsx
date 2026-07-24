import { prisma } from '@omniply/shared'
import { KpiCard } from '@/components/admin/KpiCard'
import Link from 'next/link'

export default async function CostsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const { period } = await searchParams
  const days = parseInt(period ?? '7', 10)
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const [totals, byProvider, bySource, byUser, dailyRows] = await Promise.all([
    prisma.lLMUsage.aggregate({
      where: { createdAt: { gte: since } },
      _sum: { cost: true, inputTokens: true, outputTokens: true },
      _count: { id: true },
    }),

    prisma.lLMUsage.groupBy({
      by: ['provider', 'model'],
      where: { createdAt: { gte: since } },
      _sum: { cost: true },
      orderBy: { _sum: { cost: 'desc' } },
    }),

    prisma.lLMUsage.groupBy({
      by: ['source'],
      where: { createdAt: { gte: since } },
      _sum: { cost: true },
      orderBy: { _sum: { cost: 'desc' } },
    }),

    prisma.lLMUsage.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: since } },
      _sum: { cost: true },
      orderBy: { _sum: { cost: 'desc' } },
      take: 10,
    }),

    prisma.$queryRaw<Array<{ day: string; cost: number }>>`
      SELECT DATE("createdAt")::text AS day, SUM(cost)::float AS cost
      FROM llm_usage
      WHERE "createdAt" >= ${since}
      GROUP BY DATE("createdAt")
      ORDER BY day ASC
    `,
  ])

  // userId is nullable since Phase C: deleted accounts leave anonymous rows.
  const userIds = byUser.map((u) => u.userId).filter((id): id is string => id !== null)
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, email: true },
  })
  const userMap = Object.fromEntries(users.map((u) => [u.id, u.email]))

  const totalCost = totals._sum.cost ?? 0
  const totalCalls = totals._count.id
  const totalInputTokens = totals._sum.inputTokens ?? 0
  const totalOutputTokens = totals._sum.outputTokens ?? 0

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">LLM Costs</h1>
          <p className="text-sm text-muted-foreground mt-1">API spend across all providers</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          {[7, 30, 90].map((d) => (
            <Link
              key={d}
              href={`/admin/costs?period=${d}`}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                days === d
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {d}d
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          title="Total Cost"
          value={`$${totalCost.toFixed(4)}`}
          sub={`Last ${days} days`}
          accent={totalCost > 10 ? 'yellow' : 'default'}
        />
        <KpiCard title="API Calls" value={totalCalls.toLocaleString()} />
        <KpiCard
          title="Input Tokens"
          value={(totalInputTokens / 1000).toFixed(1) + 'K'}
        />
        <KpiCard
          title="Output Tokens"
          value={(totalOutputTokens / 1000).toFixed(1) + 'K'}
        />
      </div>

      {dailyRows.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground mb-4">Daily Spend</h2>
          <div className="space-y-2">
            {dailyRows.map((row) => {
              const pct = totalCost > 0 ? (row.cost / totalCost) * 100 : 0
              return (
                <div key={row.day} className="flex items-center gap-3 text-sm">
                  <span className="w-24 shrink-0 text-muted-foreground">{row.day}</span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.max(pct, 0.5)}%` }}
                    />
                  </div>
                  <span className="w-20 text-right text-foreground font-medium">
                    ${row.cost.toFixed(4)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card">
          <h2 className="border-b border-border px-4 py-3 text-sm font-semibold">By Provider / Model</h2>
          <div className="divide-y divide-border">
            {byProvider.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">No data</p>
            )}
            {byProvider.map((row) => (
              <div
                key={`${row.provider}-${row.model}`}
                className="flex items-center justify-between px-4 py-2.5 text-sm"
              >
                <div>
                  <span className="font-medium text-foreground">{row.provider}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{row.model}</span>
                </div>
                <span className="font-mono text-foreground">${(row._sum.cost ?? 0).toFixed(4)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card">
          <h2 className="border-b border-border px-4 py-3 text-sm font-semibold">By Source</h2>
          <div className="divide-y divide-border">
            {bySource.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">No data</p>
            )}
            {bySource.map((row) => (
              <div
                key={row.source}
                className="flex items-center justify-between px-4 py-2.5 text-sm"
              >
                <span className="text-foreground">{row.source}</span>
                <span className="font-mono text-foreground">${(row._sum.cost ?? 0).toFixed(4)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <h2 className="border-b border-border px-4 py-3 text-sm font-semibold">Top Users by Cost</h2>
        <div className="divide-y divide-border">
          {byUser.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">No data</p>
          )}
          {byUser.map((row) => (
            <div key={row.userId ?? 'deleted'} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="text-muted-foreground">{row.userId ? (userMap[row.userId] ?? row.userId) : 'deleted account'}</span>
              <span className="font-mono text-foreground">${(row._sum.cost ?? 0).toFixed(4)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
