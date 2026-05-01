import type { FastifyInstance } from 'fastify'
import { requireAdmin } from '../../middleware/admin'
import { listSystemApiKeys, setSystemApiKey } from '../../lib/system-keys'

interface SetKeyBody {
  key: string
}

export async function llmKeysAdminRoutes(app: FastifyInstance) {
  app.get('/llm-keys', async (request, reply) => {
    const admin = await requireAdmin(request, reply)
    if (!admin) return
    const keys = await listSystemApiKeys()
    return reply.send(keys)
  })

  app.put<{ Params: { provider: string }; Body: SetKeyBody }>(
    '/llm-keys/:provider',
    async (request, reply) => {
      const admin = await requireAdmin(request, reply)
      if (!admin) return

      const { provider } = request.params
      const { key } = request.body

      if (!key?.trim()) {
        return reply.status(400).send({ error: 'key is required' })
      }

      await setSystemApiKey(provider, key.trim())
      return reply.send({ ok: true, provider })
    },
  )
}
