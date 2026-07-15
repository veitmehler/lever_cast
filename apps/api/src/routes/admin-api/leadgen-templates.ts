import type { FastifyInstance } from 'fastify'
import { prisma } from '@socioply/shared'
import { requireAdmin } from '../../middleware/admin'

interface TemplateBody {
  name?: string
  slug?: string
  description?: string | null
  sourceHtml?: string
  slotMeta?: Record<string, unknown> | null
  active?: boolean
}

/** Admin CRUD for lead-gen master templates (leadgen plan Phase 7). */
export async function leadgenTemplatesAdminRoutes(app: FastifyInstance) {
  app.get('/leadgen-templates', async (request, reply) => {
    const admin = await requireAdmin(request, reply)
    if (!admin) return
    const templates = await prisma.leadGenTemplate.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { documents: true } } },
    })
    return reply.send({ templates })
  })

  app.post<{ Body: TemplateBody }>('/leadgen-templates', async (request, reply) => {
    const admin = await requireAdmin(request, reply)
    if (!admin) return
    const { name, slug, description, sourceHtml, slotMeta, active } = request.body ?? {}
    if (!name?.trim() || !slug?.trim() || !sourceHtml?.trim()) {
      return reply.status(400).send({ error: 'name, slug and sourceHtml are required' })
    }
    const created = await prisma.leadGenTemplate.create({
      data: {
        name: name.trim(),
        slug: slug.trim(),
        description: description ?? null,
        sourceHtml,
        slotMeta: (slotMeta as object) ?? undefined,
        active: active ?? true,
      },
    })
    return reply.status(201).send(created)
  })

  app.put<{ Params: { id: string }; Body: TemplateBody }>('/leadgen-templates/:id', async (request, reply) => {
    const admin = await requireAdmin(request, reply)
    if (!admin) return
    const existing = await prisma.leadGenTemplate.findUnique({ where: { id: request.params.id } })
    if (!existing) return reply.status(404).send({ error: 'Not found' })
    const b = request.body ?? {}
    const updated = await prisma.leadGenTemplate.update({
      where: { id: existing.id },
      data: {
        ...(b.name !== undefined ? { name: b.name } : {}),
        ...(b.description !== undefined ? { description: b.description } : {}),
        ...(b.sourceHtml !== undefined ? { sourceHtml: b.sourceHtml } : {}),
        ...(b.slotMeta !== undefined ? { slotMeta: (b.slotMeta as object) ?? undefined } : {}),
        ...(b.active !== undefined ? { active: b.active } : {}),
      },
    })
    return reply.send(updated)
  })
}
