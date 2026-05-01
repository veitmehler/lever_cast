import type { FastifyInstance } from 'fastify'
import { prisma } from '../../lib/prisma'
import { requireAdmin } from '../../middleware/admin'

interface UpdateFrameworkBody {
  label?: string
  description?: string | null
  body?: string
  isActive?: boolean
}

interface UpdatePlatformSettingsBody {
  googleGuidelines?: string | null
}

export async function outlineFrameworksAdminRoutes(app: FastifyInstance) {
  // GET /api/admin/outline-frameworks
  app.get('/outline-frameworks', async (request, reply) => {
    const clerkId = await requireAdmin(request, reply)
    if (!clerkId) return

    const frameworks = await prisma.outlineFramework.findMany({
      orderBy: { number: 'asc' },
    })

    return reply.send({ frameworks })
  })

  // PUT /api/admin/outline-frameworks/:number
  app.put<{ Params: { number: string }; Body: UpdateFrameworkBody }>(
    '/outline-frameworks/:number',
    async (request, reply) => {
      const clerkId = await requireAdmin(request, reply)
      if (!clerkId) return

      const num = parseInt(request.params.number, 10)
      if (isNaN(num)) return reply.status(400).send({ error: 'Invalid framework number' })

      const existing = await prisma.outlineFramework.findUnique({ where: { number: num } })
      if (!existing) return reply.status(404).send({ error: 'Outline framework not found' })

      const { label, description, body, isActive } = request.body ?? {}

      const updated = await prisma.outlineFramework.update({
        where: { number: num },
        data: {
          ...(label !== undefined ? { label } : {}),
          ...(description !== undefined ? { description } : {}),
          ...(body !== undefined ? { body } : {}),
          ...(isActive !== undefined ? { isActive } : {}),
        },
      })

      return reply.send({ framework: updated })
    },
  )

  // GET /api/admin/platform-settings
  app.get('/platform-settings', async (request, reply) => {
    const clerkId = await requireAdmin(request, reply)
    if (!clerkId) return

    const settings = await prisma.platformSettings.findUnique({ where: { id: 'singleton' } })

    return reply.send({ settings: settings ?? { id: 'singleton', googleGuidelines: null } })
  })

  // PUT /api/admin/platform-settings
  app.put<{ Body: UpdatePlatformSettingsBody }>(
    '/platform-settings',
    async (request, reply) => {
      const clerkId = await requireAdmin(request, reply)
      if (!clerkId) return

      const { googleGuidelines } = request.body ?? {}

      const updated = await prisma.platformSettings.upsert({
        where: { id: 'singleton' },
        create: { id: 'singleton', googleGuidelines: googleGuidelines ?? null },
        update: { ...(googleGuidelines !== undefined ? { googleGuidelines } : {}) },
      })

      return reply.send({ settings: updated })
    },
  )
}
