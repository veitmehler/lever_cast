import type { FastifyInstance } from 'fastify'
import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3'
import { prisma } from '../lib/prisma'
import { getBoss } from '../queues/index'

// Use the same non-standard env var names as the rest of the app (ACCESS_KEY_ID
// instead of AWS_ACCESS_KEY_ID) so this works without changing droplet config.
const s3 = new S3Client({
  region: process.env.S3_REGION ?? 'us-east-1',
  credentials:
    process.env.ACCESS_KEY_ID && process.env.SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.ACCESS_KEY_ID,
          secretAccessKey: process.env.SECRET_ACCESS_KEY,
        }
      : undefined,
})

export async function healthRoutes(app: FastifyInstance) {
  // Shallow health — used by Docker HEALTHCHECK and Caddy
  app.get('/health', async () => ({
    status: 'ok',
    ts: new Date().toISOString(),
  }))

  // Deep health — checks DB + S3 + pg-boss; used by Better Uptime monitor
  app.get('/health/deep', async (_req, reply) => {
    const [db, s3check, queue] = await Promise.allSettled([
      (async () => {
        const t0 = Date.now()
        await prisma.$queryRaw`SELECT 1`
        return Date.now() - t0
      })(),
      (async () => {
        const t0 = Date.now()
        await s3.send(new HeadBucketCommand({ Bucket: process.env.S3_BUCKET! }))
        return Date.now() - t0
      })(),
      (async () => {
        const boss = await getBoss()
        return await boss.getQueueSize('publish')
      })(),
    ])

    const ok = [db, s3check].every((c) => c.status === 'fulfilled')

    return reply.code(ok ? 200 : 503).send({
      status: ok ? 'ok' : 'degraded',
      db:
        db.status === 'fulfilled'
          ? { ok: true, latency_ms: db.value }
          : { ok: false, error: String((db as PromiseRejectedResult).reason?.message) },
      s3:
        s3check.status === 'fulfilled'
          ? { ok: true, latency_ms: s3check.value }
          : { ok: false, error: String((s3check as PromiseRejectedResult).reason?.message) },
      publish_queue_depth:
        queue.status === 'fulfilled' ? queue.value : null,
    })
  })
}
