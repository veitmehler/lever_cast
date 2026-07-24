import type { FastifyInstance } from 'fastify'
import { prisma } from '@omniply/shared'
import { requireAdmin } from '../../middleware/admin'

interface UpdatePromptBody {
  systemPrompt?: string | null
  userPrompt?: string
  defaultProvider?: string
  defaultModel?: string
  maxTokens?: number | null
}

export async function promptsAdminRoutes(app: FastifyInstance) {
  // GET /api/admin/prompts — list all templates
  app.get('/prompts', async (request, reply) => {
    const clerkId = await requireAdmin(request, reply)
    if (!clerkId) return

    const templates = await prisma.promptTemplate.findMany({
      orderBy: { stepNumber: 'asc' },
    })

    return reply.send({ templates })
  })

  // GET /api/admin/prompts/:stepNumber — single template
  app.get<{ Params: { stepNumber: string } }>('/prompts/:stepNumber', async (request, reply) => {
    const clerkId = await requireAdmin(request, reply)
    if (!clerkId) return

    const stepNumber = parseInt(request.params.stepNumber, 10)
    if (isNaN(stepNumber)) return reply.status(400).send({ error: 'Invalid stepNumber' })

    const template = await prisma.promptTemplate.findUnique({ where: { stepNumber } })
    if (!template) return reply.status(404).send({ error: 'Template not found' })

    return reply.send({ template })
  })

  // PUT /api/admin/prompts/:stepNumber — update a template
  app.put<{ Params: { stepNumber: string }; Body: UpdatePromptBody }>(
    '/prompts/:stepNumber',
    async (request, reply) => {
      const clerkId = await requireAdmin(request, reply)
      if (!clerkId) return

      const stepNumber = parseInt(request.params.stepNumber, 10)
      if (isNaN(stepNumber)) return reply.status(400).send({ error: 'Invalid stepNumber' })

      const existing = await prisma.promptTemplate.findUnique({ where: { stepNumber } })
      if (!existing) return reply.status(404).send({ error: 'Template not found' })

      const { systemPrompt, userPrompt, defaultProvider, defaultModel, maxTokens } = request.body ?? {}

      const updated = await prisma.promptTemplate.update({
        where: { stepNumber },
        data: {
          ...(systemPrompt !== undefined ? { systemPrompt } : {}),
          ...(userPrompt !== undefined ? { userPrompt } : {}),
          ...(defaultProvider !== undefined ? { defaultProvider } : {}),
          ...(defaultModel !== undefined ? { defaultModel } : {}),
          ...(maxTokens !== undefined ? { maxTokens } : {}),
        },
      })

      return reply.send({ template: updated })
    },
  )
}
