import PgBoss from 'pg-boss'
import { prisma } from '@omniply/shared'

export interface OAuthCleanupJobData {
  _cron?: true
}

export async function oauthStateCleanupHandler(jobs: PgBoss.Job<OAuthCleanupJobData>[]) {
  console.log(`[oauth-cleanup] running — ${jobs.length} job(s)`)

  const result = await prisma.oAuthState.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  })

  console.log(`[oauth-cleanup] deleted ${result.count} expired oauth state(s)`)
}
