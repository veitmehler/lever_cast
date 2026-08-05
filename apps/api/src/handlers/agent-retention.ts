import type PgBoss from 'pg-boss'
import { prisma } from '@omniply/shared'
import { logger } from '../lib/logger'

/**
 * Chat-agent transcript retention (chat-agent plan, decision D): delete
 * conversations older than 180 days. Messages cascade via FK. Daily cron.
 */
const RETENTION_DAYS = 180

export async function agentRetentionCleanupHandler(_jobs: PgBoss.Job<object>[]): Promise<void> {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000)
  const result = await prisma.agentConversation.deleteMany({
    where: { createdAt: { lt: cutoff } },
  })
  if (result.count > 0) {
    logger.info({ deleted: result.count, cutoff }, '[agent-retention] expired conversations deleted')
  }
}
