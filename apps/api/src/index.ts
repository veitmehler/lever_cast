import Fastify from 'fastify'
import cors from '@fastify/cors'

const app = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport:
      process.env.NODE_ENV !== 'production'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
  },
})

await app.register(cors, {
  origin: [
    'https://app.socioply.com',
    ...(process.env.NODE_ENV !== 'production' ? ['http://localhost:3000'] : []),
  ],
  credentials: true,
})

// Health check — used by Docker HEALTHCHECK and load balancer
app.get('/health', async () => {
  return { status: 'ok', ts: new Date().toISOString() }
})

// Route registrations will be added in Phase 7 (endpoint cutover)
// import { aiRoutes }       from './routes/ai.js'
// import { socialRoutes }   from './routes/social.js'
// import { postRoutes }     from './routes/posts.js'
// import { imagesRoutes }   from './routes/images.js'
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
