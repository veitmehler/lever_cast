// DigitalOcean managed Postgres uses a self-signed CA certificate.
// Connection is still encrypted (TLS); this only skips CA chain verification.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

/**
 * pg-boss worker process.
 * Run with: node dist/worker.js
 *
 * Phase 7 implements the four core handlers:
 *   - publish-scheduled  (replaces Vercel cron at /api/posts/publish-scheduled)
 *   - analytics-sync     (replaces Vercel cron at /api/posts/sync-analytics)
 *   - oauth-state-cleanup
 *   - db-backup
 *
 * Article-pipeline handlers are stubs until Phase 8.
 */

import PgBoss from 'pg-boss'
import { getBoss, stopBoss, QUEUES } from './queues/index'
import {
  publishHandler,
  publishScheduledHandler,
  PublishJobData,
  PublishScheduledJobData,
} from './handlers/publish'
import { analyticsSyncHandler, AnalyticsSyncJobData } from './handlers/analytics'
import { oauthStateCleanupHandler, OAuthCleanupJobData } from './handlers/oauth'
import { dbBackupHandler, DbBackupJobData } from './handlers/backup'

async function main() {
  console.log('[worker] starting…')

  const boss = await getBoss()

  // ── Graceful shutdown ───────────────────────────────────────────────────────
  const shutdown = async (signal: string) => {
    console.log(`[worker] received ${signal}, shutting down…`)
    await stopBoss()
    process.exit(0)
  }
  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))

  // ── Create queues (pg-boss v10 requires explicit createQueue before use) ────
  for (const queueName of Object.values(QUEUES)) {
    await boss.createQueue(queueName)
  }

  // ── Cron schedules ──────────────────────────────────────────────────────────
  await boss.schedule(QUEUES.PUBLISH_SCHEDULED, '* * * * *', {})      // every minute
  await boss.schedule(QUEUES.ANALYTICS_SYNC, '0 2 * * *', {})         // daily 02:00 UTC
  await boss.schedule(QUEUES.OAUTH_STATE_CLEANUP, '0 * * * *', {})    // hourly
  await boss.schedule(QUEUES.DB_BACKUP, '0 3 * * 0', {})              // Sunday 03:00 UTC

  // ── Social publishing ───────────────────────────────────────────────────────
  await boss.work<PublishJobData>(
    QUEUES.PUBLISH,
    { batchSize: 5 },
    publishHandler,
  )

  await boss.work<PublishScheduledJobData>(
    QUEUES.PUBLISH_SCHEDULED,
    { batchSize: 1 },
    publishScheduledHandler,
  )

  // ── Analytics ───────────────────────────────────────────────────────────────
  await boss.work<AnalyticsSyncJobData>(
    QUEUES.ANALYTICS_SYNC,
    { batchSize: 1 },
    analyticsSyncHandler,
  )

  // ── Maintenance ─────────────────────────────────────────────────────────────
  await boss.work<OAuthCleanupJobData>(
    QUEUES.OAUTH_STATE_CLEANUP,
    { batchSize: 1 },
    oauthStateCleanupHandler,
  )

  await boss.work<DbBackupJobData>(
    QUEUES.DB_BACKUP,
    { batchSize: 1 },
    dbBackupHandler,
  )

  // ── Image generation ────────────────────────────────────────────────────────
  await boss.work(
    QUEUES.IMAGE_GENERATE,
    { batchSize: 3 },
    async (jobs: PgBoss.Job[]) => {
      for (const job of jobs) {
        console.log(`[image-generate] job ${job.id} — TODO Phase 8`)
      }
    },
  )

  // ── Article pipeline (Phase 8 — DO droplet required) ───────────────────────
  await boss.work(
    QUEUES.ARTICLE_PIPELINE,
    { batchSize: 2 },
    async (jobs: PgBoss.Job[]) => {
      for (const job of jobs) {
        console.log(`[article-pipeline] job ${job.id} — TODO Phase 8`)
      }
    },
  )

  await boss.work(
    QUEUES.ARTICLE_ENRICHMENT,
    { batchSize: 1 },
    async (jobs: PgBoss.Job[]) => {
      for (const job of jobs) {
        console.log(`[article-enrichment] job ${job.id} — TODO Phase 8`)
      }
    },
  )

  await boss.work(
    QUEUES.ARTICLE_OUTPUT,
    { batchSize: 3 },
    async (jobs: PgBoss.Job[]) => {
      for (const job of jobs) {
        console.log(`[article-output] job ${job.id} — TODO Phase 8`)
      }
    },
  )

  await boss.work(
    QUEUES.GENERATE_SOCIAL_FROM_ARTICLE,
    { batchSize: 3 },
    async (jobs: PgBoss.Job[]) => {
      for (const job of jobs) {
        console.log(`[generate-social-from-article] job ${job.id} — TODO Phase 8`)
      }
    },
  )

  console.log('[worker] all queues registered, crons scheduled — ready')
}

main().catch((err) => {
  console.error('[worker] fatal error:', err)
  process.exit(1)
})
