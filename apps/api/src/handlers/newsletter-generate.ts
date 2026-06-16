import PgBoss from 'pg-boss'
import { prisma } from '@socioply/shared'
import { logger } from '../lib/logger'
import { sendFailureAlert } from '../lib/alerts'
import { ensureTopicResearch } from '../newsletter/research'
import { generateNewsletterForCustomer } from '../newsletter/generate'
import type { NewsletterGenerateJobData } from '../newsletter/enqueue'

// Terminal-ish states: a job that finds the row here has nothing to do.
const DONE_STATES = ['ready_for_review', 'approved', 'scheduled', 'sent']

export async function newsletterGenerateHandler(
  jobs: PgBoss.Job<NewsletterGenerateJobData>[],
): Promise<void> {
  for (const job of jobs) {
    const { userId, topicId } = job.data
    const nl = await prisma.newsletter.findUnique({
      where: { userId_topicId: { userId, topicId } },
      select: { id: true, status: true },
    })
    if (!nl) {
      logger.warn({ userId, topicId }, '[newsletter-generate] no Newsletter row — skipping')
      continue
    }
    if (DONE_STATES.includes(nl.status)) {
      logger.info({ userId, topicId, status: nl.status }, '[newsletter-generate] already done — skipping')
      continue
    }

    logger.info({ userId, topicId, pgBossJobId: job.id }, '[newsletter-generate] starting')
    try {
      // 1. Shared research (idempotent across customers).
      await prisma.newsletter.update({ where: { id: nl.id }, data: { status: 'researching' } })
      await ensureTopicResearch(topicId)

      // 2. Per-customer voiced content → sets status=ready_for_review.
      await prisma.newsletter.update({ where: { id: nl.id }, data: { status: 'generating' } })
      await generateNewsletterForCustomer(userId, topicId)

      logger.info({ userId, topicId }, '[newsletter-generate] completed')
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      logger.error({ userId, topicId, err }, '[newsletter-generate] failed')
      await prisma.newsletter
        .update({ where: { id: nl.id }, data: { status: 'failed' } })
        .catch(() => {})
      await sendFailureAlert({
        userId,
        errorType: 'newsletter_generate_failed',
        message,
        context: { topicId, pgBossJobId: job.id },
      }).catch(() => {})
      throw err
    }
  }
}
