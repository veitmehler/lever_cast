import type { FastifyInstance } from 'fastify'
import { prisma } from '@omniply/shared'
import { requireAdmin } from '../../middleware/admin'
import { DEFAULT_VERTICAL } from '../../lib/prompt-resolver'

interface UpdatePromptBody {
  systemPrompt?: string | null
  userPrompt?: string
  defaultProvider?: string
  defaultModel?: string
  maxTokens?: number | null
}

const VERTICAL_RE = /^[a-z0-9-]{1,32}$/

function verticalOf(query: unknown): string | null {
  const v = (query as { vertical?: string } | undefined)?.vertical ?? DEFAULT_VERTICAL
  return VERTICAL_RE.test(v) ? v : null
}

/**
 * Vertical-aware prompt admin (vertical-platform plan V0/V2).
 *
 * Every route takes `?vertical=` (default: 'default'). Non-default verticals
 * see the INHERITED default set with override rows layered on top; PUT on a
 * non-default vertical creates the override (clone-on-write); DELETE reverts
 * it to inherited. The default set behaves exactly as before.
 */
export async function promptsAdminRoutes(app: FastifyInstance) {
  // GET /api/admin/prompts?vertical= — list (merged view for the vertical)
  app.get('/prompts', async (request, reply) => {
    const clerkId = await requireAdmin(request, reply)
    if (!clerkId) return
    const vertical = verticalOf(request.query)
    if (!vertical) return reply.status(400).send({ error: 'Invalid vertical' })

    const rows = await prisma.promptTemplate.findMany({
      where: { vertical: { in: vertical === DEFAULT_VERTICAL ? [DEFAULT_VERTICAL] : [DEFAULT_VERTICAL, vertical] } },
      orderBy: { stepNumber: 'asc' },
    })
    if (vertical === DEFAULT_VERTICAL) return reply.send({ templates: rows, vertical })

    const overrides = new Map(rows.filter((r) => r.vertical === vertical).map((r) => [r.stepNumber, r]))
    const templates = rows
      .filter((r) => r.vertical === DEFAULT_VERTICAL)
      .map((base) => {
        const o = overrides.get(base.stepNumber)
        return o ? { ...o, inherited: false } : { ...base, inherited: true }
      })
    return reply.send({ templates, vertical })
  })

  // GET /api/admin/prompts/verticals — distinct verticals present (default first)
  app.get('/prompts/verticals', async (request, reply) => {
    const clerkId = await requireAdmin(request, reply)
    if (!clerkId) return
    const [promptVerticals, accountVerticals] = await Promise.all([
      prisma.promptTemplate.findMany({ distinct: ['vertical'], select: { vertical: true } }),
      prisma.account.findMany({ distinct: ['vertical'], select: { vertical: true } }),
    ])
    const set = new Set<string>([DEFAULT_VERTICAL])
    for (const r of promptVerticals) set.add(r.vertical)
    for (const r of accountVerticals) if (r.vertical !== 'chiro') set.add(r.vertical)
    return reply.send({ verticals: [...set] })
  })

  // GET /api/admin/prompts/:stepNumber?vertical= — single (override else inherited default)
  app.get<{ Params: { stepNumber: string } }>('/prompts/:stepNumber', async (request, reply) => {
    const clerkId = await requireAdmin(request, reply)
    if (!clerkId) return
    const vertical = verticalOf(request.query)
    if (!vertical) return reply.status(400).send({ error: 'Invalid vertical' })
    const stepNumber = parseInt(request.params.stepNumber, 10)
    if (isNaN(stepNumber)) return reply.status(400).send({ error: 'Invalid stepNumber' })

    if (vertical !== DEFAULT_VERTICAL) {
      const override = await prisma.promptTemplate.findUnique({
        where: { stepNumber_vertical: { stepNumber, vertical } },
      })
      if (override) return reply.send({ template: { ...override, inherited: false }, vertical })
    }
    const base = await prisma.promptTemplate.findUnique({
      where: { stepNumber_vertical: { stepNumber, vertical: DEFAULT_VERTICAL } },
    })
    if (!base) return reply.status(404).send({ error: 'Template not found' })
    return reply.send({ template: { ...base, inherited: vertical !== DEFAULT_VERTICAL }, vertical })
  })

  // PUT /api/admin/prompts/:stepNumber?vertical= — update (clone-on-write for overrides)
  app.put<{ Params: { stepNumber: string }; Body: UpdatePromptBody }>(
    '/prompts/:stepNumber',
    async (request, reply) => {
      const clerkId = await requireAdmin(request, reply)
      if (!clerkId) return
      const vertical = verticalOf(request.query)
      if (!vertical) return reply.status(400).send({ error: 'Invalid vertical' })
      const stepNumber = parseInt(request.params.stepNumber, 10)
      if (isNaN(stepNumber)) return reply.status(400).send({ error: 'Invalid stepNumber' })

      const base = await prisma.promptTemplate.findUnique({
        where: { stepNumber_vertical: { stepNumber, vertical: DEFAULT_VERTICAL } },
      })
      if (!base) return reply.status(404).send({ error: 'Template not found' })

      const { systemPrompt, userPrompt, defaultProvider, defaultModel, maxTokens } = request.body ?? {}
      const patch = {
        ...(systemPrompt !== undefined ? { systemPrompt } : {}),
        ...(userPrompt !== undefined ? { userPrompt } : {}),
        ...(defaultProvider !== undefined ? { defaultProvider } : {}),
        ...(defaultModel !== undefined ? { defaultModel } : {}),
        ...(maxTokens !== undefined ? { maxTokens } : {}),
      }

      if (vertical === DEFAULT_VERTICAL) {
        const updated = await prisma.promptTemplate.update({
          where: { stepNumber_vertical: { stepNumber, vertical: DEFAULT_VERTICAL } },
          data: patch,
        })
        return reply.send({ template: updated })
      }

      // Clone-on-write: create the override from the default row, then patch.
      const { id: _id, createdAt: _c, updatedAt: _u, ...cloneable } = base as Record<string, unknown> & {
        id: string
        createdAt?: Date
        updatedAt?: Date
      }
      const updated = await prisma.promptTemplate.upsert({
        where: { stepNumber_vertical: { stepNumber, vertical } },
        create: {
          ...(cloneable as object),
          // key must stay unique per (key, vertical): reuse the base key.
          vertical,
          ...patch,
        } as never,
        update: patch,
      })
      return reply.send({ template: { ...updated, inherited: false } })
    },
  )

  // DELETE /api/admin/prompts/:stepNumber?vertical= — revert override to inherited
  app.delete<{ Params: { stepNumber: string } }>('/prompts/:stepNumber', async (request, reply) => {
    const clerkId = await requireAdmin(request, reply)
    if (!clerkId) return
    const vertical = verticalOf(request.query)
    if (!vertical || vertical === DEFAULT_VERTICAL) {
      return reply.status(400).send({ error: 'Only vertical overrides can be deleted' })
    }
    const stepNumber = parseInt(request.params.stepNumber, 10)
    if (isNaN(stepNumber)) return reply.status(400).send({ error: 'Invalid stepNumber' })
    await prisma.promptTemplate
      .delete({ where: { stepNumber_vertical: { stepNumber, vertical } } })
      .catch(() => null)
    return reply.send({ ok: true })
  })
}
