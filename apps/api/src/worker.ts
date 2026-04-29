/**
 * pg-boss worker process.
 * Run with: node dist/worker.js
 *
 * Each queue is registered with a batchSize that controls how many jobs are
 * fetched per polling cycle. Handler implementations are stubs here — they
 * will be filled in Phase 7.
 */

import PgBoss from 'pg-boss'
import { getBoss, stopBoss, QUEUES } from './queues/index.js'

async function main() {
  console.log('[worker] starting…')

  const boss = await getBoss()

  // ── Graceful shutdown ─────────────────────────────────────────────────────
  const shutdown = async (signal: string) => {
    console.log(`[worker] received ${signal}, shutting down…`)
    await stopBoss()
    process.exit(0)
  }
  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))

  // ── Social publishing ─────────────────────────────────────────────────────

  await boss.work(
    QUEUES.PUBLISH,
    { batchSize: 5 },
    async (jobs: PgBoss.Job[]) => {
      for (const job of jobs) {
        console.log(`[worker] publish job ${job.id}`)
        // TODO Phase 7: await publishHandler(job.data)
      }
    },
  )

  await boss.work(
    QUEUES.PUBLISH_SCHEDULED,
    { batchSize: 5 },
    async (jobs: PgBoss.Job[]) => {
      for (const job of jobs) {
        console.log(`[worker] publish-scheduled job ${job.id}`)
        // TODO Phase 7: await publishScheduledHandler(job.data)
      }
    },
  )

  await boss.work(
    QUEUES.ANALYTICS_SYNC,
    { batchSize: 5 },
    async (jobs: PgBoss.Job[]) => {
      for (const job of jobs) {
        console.log(`[worker] analytics-sync job ${job.id}`)
        // TODO Phase 7: await analyticsSyncHandler(job.data)
      }
    },
  )

  // ── Image generation ──────────────────────────────────────────────────────

  await boss.work(
    QUEUES.IMAGE_GENERATE,
    { batchSize: 3 },
    async (jobs: PgBoss.Job[]) => {
      for (const job of jobs) {
        console.log(`[worker] image-generate job ${job.id}`)
        // TODO Phase 7: await imageGenerateHandler(job.data)
      }
    },
  )

  // ── Maintenance ───────────────────────────────────────────────────────────

  await boss.work(
    QUEUES.OAUTH_STATE_CLEANUP,
    { batchSize: 1 },
    async (jobs: PgBoss.Job[]) => {
      for (const job of jobs) {
        console.log(`[worker] oauth-state-cleanup job ${job.id}`)
        // TODO Phase 7: delete oauth_states where expiresAt < now()
      }
    },
  )

  await boss.work(
    QUEUES.DB_BACKUP,
    { batchSize: 1 },
    async (jobs: PgBoss.Job[]) => {
      for (const job of jobs) {
        console.log(`[worker] db-backup job ${job.id}`)
        // TODO Phase 7: await dbBackupHandler(job.data)
      }
    },
  )

  // ── Article pipeline (Phase 8 — DO droplet required) ─────────────────────

  await boss.work(
    QUEUES.ARTICLE_PIPELINE,
    { batchSize: 2 },
    async (jobs: PgBoss.Job[]) => {
      for (const job of jobs) {
        console.log(`[worker] article-pipeline job ${job.id}`)
        // TODO Phase 8: await articlePipelineHandler(job.data)
      }
    },
  )

  await boss.work(
    QUEUES.ARTICLE_ENRICHMENT,
    { batchSize: 1 },
    async (jobs: PgBoss.Job[]) => {
      for (const job of jobs) {
        console.log(`[worker] article-enrichment job ${job.id}`)
        // TODO Phase 8: await articleEnrichmentHandler(job.data)
      }
    },
  )

  await boss.work(
    QUEUES.ARTICLE_OUTPUT,
    { batchSize: 3 },
    async (jobs: PgBoss.Job[]) => {
      for (const job of jobs) {
        console.log(`[worker] article-output job ${job.id}`)
        // TODO Phase 8: await articleOutputHandler(job.data)
      }
    },
  )

  await boss.work(
    QUEUES.GENERATE_SOCIAL_FROM_ARTICLE,
    { batchSize: 3 },
    async (jobs: PgBoss.Job[]) => {
      for (const job of jobs) {
        console.log(`[worker] generate-social-from-article job ${job.id}`)
        // TODO Phase 8: await generateSocialFromArticleHandler(job.data)
      }
    },
  )

  // ── Cron schedules (replace Vercel crons post-Phase 8 cutover) ────────────

  await boss.schedule(QUEUES.PUBLISH_SCHEDULED, '* * * * *', {})
  await boss.schedule(QUEUES.ANALYTICS_SYNC, '0 2 * * *', {})
  await boss.schedule(QUEUES.OAUTH_STATE_CLEANUP, '*/10 * * * *', {})
  await boss.schedule(QUEUES.DB_BACKUP, '0 3 * * *', {})

  console.log('[worker] all queues registered, crons scheduled — ready')
}

main().catch((err) => {
  console.error('[worker] fatal error:', err)
  process.exit(1)
})
