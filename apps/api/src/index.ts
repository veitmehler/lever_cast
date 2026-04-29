// DigitalOcean managed Postgres uses a self-signed CA certificate.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

import Fastify from 'fastify'
import cors from '@fastify/cors'

async function main() {
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      transport: undefined,
    },
  })

  await app.register(cors, {
    origin: [
      'https://app.socioply.com',
      'https://www.socioply.com',
      ...(process.env.NODE_ENV !== 'production' ? ['http://localhost:3000'] : []),
    ],
    credentials: true,
  })

  // Health check — used by Docker HEALTHCHECK and load balancer
  app.get('/health', async () => {
    return { status: 'ok', ts: new Date().toISOString() }
  })

  // Route registrations will be added in Phase 8 (endpoint cutover)
  // import { aiRoutes }       from './routes/ai'
  // import { socialRoutes }   from './routes/social'
  // import { postRoutes }     from './routes/posts'
  // import { imagesRoutes }   from './routes/images'
  // await app.register(aiRoutes,     { prefix: '/api/ai' })
  // await app.register(socialRoutes, { prefix: '/api/social' })
  // await app.register(postRoutes,   { prefix: '/api/posts' })
  // await app.register(imagesRoutes, { prefix: '/api/images' })

  const port = Number(process.env.PORT ?? 3001)
  const host = '0.0.0.0'

  try {
    await app.listen({ port, host })
    app.log.info(`API listening on ${host}:${port}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('[api] fatal error:', err)
  process.exit(1)
})
