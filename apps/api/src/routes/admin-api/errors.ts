import type { FastifyInstance } from 'fastify'
import { requireAdmin } from '../../middleware/admin'
import { prisma } from '@socioply/shared'

export async function errorsAdminRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { page?: string; userId?: string; resolved?: string } }>(
    '/errors',
    async (request, reply) => {
      const admin = await requireAdmin(request, reply)
      if (!admin) return

      const page = Math.max(1, parseInt(request.query.page ?? '1', 10))
      const pageSize = 50
      const skip = (page - 1) * pageSize

      const where: Record<string, unknown> = {}
      if (request.query.userId) where.userId = request.query.userId
      if (request.query.resolved !== undefined) {
        where.resolved = request.query.resolved === 'true'
      }

      const [errors, total] = await Promise.all([
        prisma.errorLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: pageSize,
          include: {
            user: { select: { email: true, name: true } },
          },
        }),
        prisma.errorLog.count({ where }),
      ])

      return reply.send({ errors, total, page, pageSize })
    },
  )

  app.patch<{ Params: { id: string }; Body: { resolved: boolean } }>(
    '/errors/:id',
    async (request, reply) => {
      const admin = await requireAdmin(request, reply)
      if (!admin) return

      const updated = await prisma.errorLog.update({
        where: { id: request.params.id },
        data: { resolved: request.body.resolved },
        select: { id: true, resolved: true },
      })
      return reply.send(updated)
    },
  )
}
