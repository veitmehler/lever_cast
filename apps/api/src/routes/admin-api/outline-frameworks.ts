import type { FastifyInstance } from 'fastify'
import type { Prisma } from '@prisma/client'
import { prisma } from '@socioply/shared'
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

interface SchemaTypeRule {
  keyword: string
  articleType: string
  publisherType: string
}

interface UpdateSchemaTypeRulesBody {
  rules: SchemaTypeRule[]
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

  // GET /api/admin/schema-type-rules
  app.get('/schema-type-rules', async (request, reply) => {
    const clerkId = await requireAdmin(request, reply)
    if (!clerkId) return

    const ps = await prisma.platformSettings.findUnique({ where: { id: 'singleton' } })
    const rules = (ps?.schemaTypeRules ?? []) as unknown as SchemaTypeRule[]

    return reply.send({ rules })
  })

  // PUT /api/admin/schema-type-rules
  app.put<{ Body: UpdateSchemaTypeRulesBody }>(
    '/schema-type-rules',
    async (request, reply) => {
      const clerkId = await requireAdmin(request, reply)
      if (!clerkId) return

      const { rules } = request.body ?? {}
      if (!Array.isArray(rules)) {
        return reply.status(400).send({ error: '`rules` must be an array' })
      }

      // Validate each rule
      for (const r of rules) {
        if (!r.keyword?.trim() || !r.articleType?.trim() || !r.publisherType?.trim()) {
          return reply.status(400).send({ error: 'Each rule must have keyword, articleType, and publisherType' })
        }
      }

      const sanitized: SchemaTypeRule[] = rules.map((r) => ({
        keyword:       r.keyword.trim(),
        articleType:   r.articleType.trim(),
        publisherType: r.publisherType.trim(),
      }))

      await prisma.platformSettings.upsert({
        where: { id: 'singleton' },
        create: { id: 'singleton', schemaTypeRules: sanitized as unknown as Prisma.InputJsonValue },
        update: { schemaTypeRules: sanitized as unknown as Prisma.InputJsonValue },
      })

      return reply.send({ rules: sanitized })
    },
  )
}
