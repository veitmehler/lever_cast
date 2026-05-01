import type { FastifyInstance } from 'fastify'
import { llmKeysAdminRoutes } from './llm-keys'
import { costsAdminRoutes } from './costs'
import { usersAdminRoutes } from './users'
import { errorsAdminRoutes } from './errors'
import { articlesAdminRoutes } from './articles'

export async function adminApiRoutes(app: FastifyInstance) {
  await app.register(llmKeysAdminRoutes)
  await app.register(costsAdminRoutes)
  await app.register(usersAdminRoutes)
  await app.register(errorsAdminRoutes)
  await app.register(articlesAdminRoutes)
}
