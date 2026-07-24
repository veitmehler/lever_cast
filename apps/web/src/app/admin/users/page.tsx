import { prisma } from '@omniply/shared'
import { KpiCard } from '@/components/admin/KpiCard'
import { RoleToggle } from './RoleToggle'
import { SubscriptionDateField } from './SubscriptionDateField'
import { BillingControls } from './BillingControls'

export default async function UsersPage() {
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [users, costRows, totalUsers] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        accountId: true,
        account: { select: { subscriptionStartedAt: true, status: true, paidThrough: true, billingExempt: true } },
        _count: { select: { articleJobs: true, posts: true } },
      },
    }),
    prisma.lLMUsage.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: since30d } },
      _sum: { cost: true },
    }),
    prisma.user.count(),
  ])

  const costMap = Object.fromEntries(costRows.map((r) => [r.userId, r._sum.cost ?? 0]))
  const adminCount = users.filter((u) => u.role === 'admin').length

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Users</h1>
        <p className="text-sm text-muted-foreground mt-1">All registered users and their activity</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <KpiCard title="Total Users" value={totalUsers} />
        <KpiCard title="Admins" value={adminCount} />
        <KpiCard
          title="Cost (30d)"
          value={`$${costRows.reduce((s, r) => s + (r._sum.cost ?? 0), 0).toFixed(4)}`}
        />
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">User</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Subscription start</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Billing</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Articles</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Posts</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Cost (30d)</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{user.email}</p>
                  {user.name && <p className="text-xs text-muted-foreground">{user.name}</p>}
                </td>
                <td className="px-4 py-3">
                  <RoleToggle userId={user.id} currentRole={user.role} />
                </td>
                <td className="px-4 py-3">
                  {user.accountId ? (
                    <SubscriptionDateField
                      accountId={user.accountId}
                      currentDate={user.account?.subscriptionStartedAt?.toISOString().slice(0, 10) ?? null}
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">no account</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {user.accountId && user.account ? (
                    <BillingControls
                      accountId={user.accountId}
                      status={user.account.status}
                      paidThrough={user.account.paidThrough?.toISOString().slice(0, 10) ?? null}
                      billingExempt={user.account.billingExempt}
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground">
                  {user._count.articleJobs}
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground">
                  {user._count.posts}
                </td>
                <td className="px-4 py-3 text-right font-mono text-foreground">
                  ${(costMap[user.id] ?? 0).toFixed(4)}
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
