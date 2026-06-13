// Sentry must be initialised before any other imports that might throw
import { initSentry, Sentry } from './lib/sentry'
initSentry('worker')

import PgBoss from 'pg-boss'
import { logger } from './lib/logger'
import { getBoss, stopBoss, QUEUES } from './queues/index'
import { assertEncryptionConfigured } from '@socioply/shared'
import {
  publishHandler,
  publishScheduledHandler,
  PublishJobData,
  PublishScheduledJobData,
} from './handlers/publish'
import { analyticsSyncHandler, AnalyticsSyncJobData } from './handlers/analytics'
import { oauthStateCleanupHandler, OAuthCleanupJobData } from './handlers/oauth'
import { dbBackupHandler, DbBackupJobData } from './handlers/backup'
import { pgMonitorHandler } from './handlers/pg-monitor'
import { articlePipelineHandler, ArticlePipelineJobData } from './handlers/article-pipeline'
import { articleEnrichmentHandler, ArticleEnrichmentJobData } from './handlers/article-enrichment'
import { articleOutputHandler, ArticleOutputJobData } from './handlers/article-output'
import { generateSocialFromArticleHandler, GenerateSocialFromArticleJobData } from './handlers/generate-social-from-article'
import { socialGenerateHandler, SocialGenerateJobData } from './handlers/social-generate'
import { socialDispatchHandler, SocialDispatchJobData } from './handlers/social-dispatch'
import { socialVideoGenerateHandler, SocialVideoGenerateJobData } from './handlers/social-video-generate'
import { socialAutomationSafetyHandler } from './handlers/social-automation-safety'
import { syndicationGenerateHandler, SyndicationGenerateJobData } from './handlers/syndication-generate'
import { syndicationSafetyHandler } from './handlers/syndication-safety'

/** Wrap a pg-boss handler so uncaught errors are captured by Sentry. */
function withSentry<T>(
  name: string,
  fn: (jobs: PgBoss.Job<T>[]) => Promise<void>,
): (jobs: PgBoss.Job<T>[]) => Promise<void> {
  return async (jobs) => {
    try {
      await fn(jobs)
    } catch (err) {
      logger.error({ err, queue: name }, 'worker handler error')
      Sentry.captureException(err, { tags: { queue: name } })
      throw err
    }
  }
}

async function main() {
  logger.info('[worker] starting…')

  // Fail fast if encryption isn't configured (never boot prod on the dev key).
  assertEncryptionConfigured()

  const boss = await getBoss()

  // ── Graceful shutdown ───────────────────────────────────────────────────────
  const shutdown = async (signal: string) => {
    logger.info(`[worker] received ${signal}, shutting down…`)
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
  await boss.schedule(QUEUES.PG_CONN_MONITOR, '*/15 * * * *', {})     // every 15 min
  await boss.schedule(QUEUES.SOCIAL_AUTOMATION_SAFETY, '*/5 * * * *', {}) // every 5 min
  await boss.schedule(QUEUES.SYNDICATION_SAFETY, '*/10 * * * *', {})      // every 10 min

  // ── Social publishing ───────────────────────────────────────────────────────
  await boss.work<PublishJobData>(
    QUEUES.PUBLISH,
    { batchSize: 5 },
    withSentry('publish', publishHandler),
  )

  await boss.work<PublishScheduledJobData>(
    QUEUES.PUBLISH_SCHEDULED,
    { batchSize: 1 },
    withSentry('publish-scheduled', publishScheduledHandler),
  )

  // ── Analytics ───────────────────────────────────────────────────────────────
  await boss.work<AnalyticsSyncJobData>(
    QUEUES.ANALYTICS_SYNC,
    { batchSize: 1 },
    withSentry('analytics-sync', analyticsSyncHandler),
  )

  // ── Maintenance ─────────────────────────────────────────────────────────────
  await boss.work<OAuthCleanupJobData>(
    QUEUES.OAUTH_STATE_CLEANUP,
    { batchSize: 1 },
    withSentry('oauth-state-cleanup', oauthStateCleanupHandler),
  )

  await boss.work<DbBackupJobData>(
    QUEUES.DB_BACKUP,
    { batchSize: 1 },
    withSentry('db-backup', dbBackupHandler),
  )

  // ── PG connection monitor ────────────────────────────────────────────────────
  await boss.work(
    QUEUES.PG_CONN_MONITOR,
    { batchSize: 1 },
    withSentry('pg-conn-monitor', async () => { await pgMonitorHandler() }),
  )

  // ── Image generation ────────────────────────────────────────────────────────
  await boss.work(
    QUEUES.IMAGE_GENERATE,
    { batchSize: 3 },
    withSentry('image-generate', async (jobs) => {
      for (const job of jobs) {
        logger.info({ jobId: job.id }, '[image-generate] TODO Phase 9')
      }
    }),
  )

  // ── Article pipeline ────────────────────────────────────────────────────────
  await boss.work<ArticlePipelineJobData>(
    QUEUES.ARTICLE_PIPELINE,
    { batchSize: 2 },
    withSentry('article-pipeline', articlePipelineHandler),
  )

  await boss.work<ArticleEnrichmentJobData>(
    QUEUES.ARTICLE_ENRICHMENT,
    { batchSize: 1 },
    withSentry('article-enrichment', articleEnrichmentHandler),
  )

  await boss.work<ArticleOutputJobData>(
    QUEUES.ARTICLE_OUTPUT,
    { batchSize: 3 },
    withSentry('article-output', articleOutputHandler),
  )

  await boss.work<GenerateSocialFromArticleJobData>(
    QUEUES.GENERATE_SOCIAL_FROM_ARTICLE,
    { batchSize: 3 },
    withSentry('generate-social-from-article', generateSocialFromArticleHandler),
  )

  await boss.work<SocialGenerateJobData>(
    QUEUES.SOCIAL_GENERATE,
    { batchSize: 1 },
    withSentry('social-generate', socialGenerateHandler),
  )

  await boss.work<SocialDispatchJobData>(
    QUEUES.SOCIAL_DISPATCH,
    { batchSize: 1 },
    withSentry('social-dispatch', socialDispatchHandler),
  )

  // One-off dashboard video generation (video reel / hook / quote video). Heavy
  // and slow, so one at a time.
  await boss.work<SocialVideoGenerateJobData>(
    QUEUES.SOCIAL_VIDEO_GENERATE,
    { batchSize: 1 },
    withSentry('social-video-generate', socialVideoGenerateHandler),
  )

  await boss.work(
    QUEUES.SOCIAL_AUTOMATION_SAFETY,
    { batchSize: 1 },
    withSentry('social-automation-safety', async () => {
      await socialAutomationSafetyHandler()
    }),
  )

  // ── Syndication ─────────────────────────────────────────────────────────────
  await boss.work<SyndicationGenerateJobData>(
    QUEUES.SYNDICATION_GENERATE,
    { batchSize: 2 },
    withSentry('syndication-generate', syndicationGenerateHandler),
  )

  await boss.work(
    QUEUES.SYNDICATION_SAFETY,
    { batchSize: 1 },
    withSentry('syndication-safety', async () => {
      await syndicationSafetyHandler()
    }),
  )

  logger.info('[worker] all queues registered, crons scheduled — ready')
}

main().catch((err) => {
  logger.error({ err }, '[worker] fatal error')
  Sentry.captureException(err)
  process.exit(1)
})
