import type { FastifyInstance } from 'fastify'
import { requireAdmin } from '../../middleware/admin'
import { prisma } from '@socioply/shared'

export async function costsAdminRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { period?: string } }>('/costs', async (request, reply) => {
    const admin = await requireAdmin(request, reply)
    if (!admin) return

    const days = parseInt(request.query.period ?? '7', 10)
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const [totalRows, byProvider, bySource, byUser, dailyTrend] = await Promise.all([
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
      select: { id: true, email: true, name: true },
    })
    const userMap = Object.fromEntries(users.map((u) => [u.id, u]))

    return reply.send({
      period: { days, since: since.toISOString() },
      total: {
        cost: totalRows._sum.cost ?? 0,
        inputTokens: totalRows._sum.inputTokens ?? 0,
        outputTokens: totalRows._sum.outputTokens ?? 0,
        calls: totalRows._count.id,
      },
      byProvider,
      bySource,
      byUser: byUser.map((u) => ({
        userId: u.userId,
        email: u.userId ? (userMap[u.userId]?.email ?? 'unknown') : 'deleted account',
        name: u.userId ? (userMap[u.userId]?.name ?? null) : null,
        cost: u._sum.cost ?? 0,
      })),
      dailyTrend,
    })
  })
}
