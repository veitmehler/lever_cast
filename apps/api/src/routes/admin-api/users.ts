import type { FastifyInstance } from 'fastify'
import { requireAdmin } from '../../middleware/admin'
import { prisma } from '@omniply/shared'

interface PatchUserBody {
  role: 'user' | 'admin'
}

export async function usersAdminRoutes(app: FastifyInstance) {
  app.get('/users', async (request, reply) => {
    const admin = await requireAdmin(request, reply)
    if (!admin) return

    const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        _count: { select: { articleJobs: true, posts: true } },
      },
    })

    const costRows = await prisma.lLMUsage.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: since30d } },
      _sum: { cost: true },
    })
    const costMap = Object.fromEntries(costRows.map((r) => [r.userId, r._sum.cost ?? 0]))

    return reply.send(
      users.map((u) => ({
        ...u,
        cost30d: costMap[u.id] ?? 0,
      })),
    )
  })

  app.patch<{ Params: { id: string }; Body: PatchUserBody }>(
    '/users/:id',
    async (request, reply) => {
      const admin = await requireAdmin(request, reply)
      if (!admin) return

      const { id } = request.params
      const { role } = request.body

      if (!['user', 'admin'].includes(role)) {
        return reply.status(400).send({ error: 'role must be user or admin' })
      }

      const updated = await prisma.user.update({
        where: { id },
        data: { role },
        select: { id: true, email: true, role: true },
      })

      return reply.send(updated)
    },
  )
}
