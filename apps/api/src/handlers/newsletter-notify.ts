import PgBoss from 'pg-boss'
import { prisma } from '@omniply/shared'
import { logger } from '../lib/logger'
import { sendNewsletterReadyEmail } from '../lib/alerts'

export interface NewsletterNotifyJobData {
  userId: string
}

// States that mean "still working" — if any exist, the batch isn't done yet.
const IN_PROGRESS = ['pending', 'researching', 'generating']

/**
 * Debounced batch notification: enqueued (with a singletonKey) each time one of a
 * user's newsletter editions finishes. It only emails once the whole batch has
 * settled — if any edition is still in progress it does nothing (the last one to
 * finish re-triggers this). Editions are marked notifiedAt so a later batch
 * doesn't re-notify the same ones.
 */
export async function newsletterNotifyHandler(
  jobs: PgBoss.Job<NewsletterNotifyJobData>[],
): Promise<void> {
  for (const job of jobs) {
    const { userId } = job.data

    const stillWorking = await prisma.newsletter.count({
      where: { userId, status: { in: IN_PROGRESS } },
    })
    if (stillWorking > 0) {
      logger.info({ userId, stillWorking }, '[newsletter-notify] batch not finished — waiting')
      continue
    }

    // Editions ready and not yet announced.
    const pending = await prisma.newsletter.findMany({
      where: { userId, status: 'ready_for_review', notifiedAt: null },
      select: { id: true },
    })
    if (pending.length === 0) {
      logger.info({ userId }, '[newsletter-notify] nothing new to announce')
      continue
    }

    const sent = await sendNewsletterReadyEmail(userId, pending.length)

    // Mark notified regardless of email success — we don't want to spam on retry,
    // and the editions are visible in-app anyway. Log when the email didn't send.
    await prisma.newsletter.updateMany({
      where: { id: { in: pending.map((p) => p.id) } },
      data: { notifiedAt: new Date() },
    })
    logger.info(
      { userId, count: pending.length, emailed: sent },
      '[newsletter-notify] batch ready-for-review processed',
    )
  }
}
