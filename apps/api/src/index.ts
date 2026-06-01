// DigitalOcean managed Postgres uses a self-signed CA certificate.
// Connection is still TLS-encrypted; this only skips CA chain verification.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

// Sentry must be initialised before any other imports that might throw
import { initSentry, Sentry } from './lib/sentry'
initSentry('api')

import Fastify from 'fastify'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import { logger } from './lib/logger'
import { aiRoutes } from './routes/ai'
import { imageRoutes } from './routes/images'
import { mediaRoutes } from './routes/media'
import { ghlRoutes } from './routes/ghl'
import { healthRoutes } from './routes/health'
import { adminRoutes } from './routes/admin'
import { topicRoutes } from './routes/topics'
import multipart from '@fastify/multipart'
import { articleRoutes } from './routes/articles'
import { wpConnectionRoutes } from './routes/wp-connections'
import { adminApiRoutes } from './routes/admin-api/index'

async function main() {
  // Fastify 5 requires a plain config object for `logger`, not a pino instance.
  // We pass our shared logger as the child logger used by request handlers.
  const app = Fastify({
    loggerInstance: logger,
  })

  // ── CORS ───────────────────────────────────────────────────────────────────
  await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 /* 10 MB */ } })
  await app.register(cors, {
    origin: [
      'https://app.socioply.com',
      'https://www.socioply.com',
      ...(process.env.NODE_ENV !== 'production' ? ['http://localhost:3000'] : []),
    ],
    credentials: true,
  })

  // ── Global IP-level rate limit (unauthenticated flood protection) ──────────
  await app.register(rateLimit, {
    max: 1000,
    timeWindow: '1 minute',
    keyGenerator: (req) => req.ip,
    errorResponseBuilder: (_req, ctx) => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Try again in ${ctx.after}.`,
    }),
  })

  // ── Global Sentry error handler ────────────────────────────────────────────
  app.setErrorHandler((err: Error & { statusCode?: number }, req, reply) => {
    req.log.error({ err }, 'unhandled error')
    Sentry.captureException(err)
    reply.status(err.statusCode ?? 500).send({
      error: err.message ?? 'Internal Server Error',
    })
  })

  // ── Routes ─────────────────────────────────────────────────────────────────
  await app.register(healthRoutes)
  await app.register(aiRoutes, { prefix: '/api/ai' })
  await app.register(imageRoutes, { prefix: '/api/images' })
  await app.register(mediaRoutes, { prefix: '/api' })
  await app.register(ghlRoutes, { prefix: '/api' })
  await app.register(topicRoutes, { prefix: '/api' })
  await app.register(articleRoutes, { prefix: '/api' })
  await app.register(wpConnectionRoutes, { prefix: '/api' })
  await app.register(adminApiRoutes, { prefix: '/api/admin' })

  // Admin UI — only registered when explicitly enabled; blocked externally by Caddy
  if (process.env.ADMIN_ENABLED === 'true') {
    await app.register(adminRoutes, { prefix: '/admin' })
  }

  // ── Listen ─────────────────────────────────────────────────────────────────
  const port = Number(process.env.PORT ?? 3001)
  try {
    await app.listen({ port, host: '0.0.0.0' })
    app.log.info(`API listening on 0.0.0.0:${port}`)
  } catch (err) {
    app.log.error(err)
    Sentry.captureException(err)
    process.exit(1)
  }
}

main().catch((err) => {
  logger.error({ err }, '[api] fatal error')
  Sentry.captureException(err)
  process.exit(1)
})

