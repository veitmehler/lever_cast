import PgBoss from 'pg-boss'

let boss: PgBoss | null = null

export async function getBoss(): Promise<PgBoss> {
  if (boss) return boss

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set')
  }

  boss = new PgBoss({
    connectionString,
    schema: 'pgboss',
    archiveCompletedAfterSeconds: 60 * 60 * 24 * 7,
    deleteAfterSeconds: 60 * 60 * 24 * 30,
    monitorStateIntervalSeconds: 2,
  })

  boss.on('error', (err) => {
    console.error('[pg-boss] error:', err)
  })

  await boss.start()
  return boss
}

export async function stopBoss(): Promise<void> {
  if (boss) {
    await boss.stop()
    boss = null
  }
}

export const QUEUES = {
  PUBLISH: 'publish',
  PUBLISH_SCHEDULED: 'publish-scheduled',
  ANALYTICS_SYNC: 'analytics-sync',
  IMAGE_GENERATE: 'image-generate',
  OAUTH_STATE_CLEANUP: 'oauth-state-cleanup',
  DB_BACKUP: 'db-backup',
  ARTICLE_PIPELINE: 'article-pipeline',
  ARTICLE_ENRICHMENT: 'article-enrichment',
  ARTICLE_OUTPUT: 'article-output',
  GENERATE_SOCIAL_FROM_ARTICLE: 'generate-social-from-article',
} as const

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES]
