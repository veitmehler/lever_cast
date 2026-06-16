import { prisma } from '@socioply/shared'
import { getBoss, QUEUES } from '../../queues/index'
import { logger } from '../../lib/logger'

export interface EnqueuePromoEmailInput {
  jobId: string
  userId: string
  /** Article publishing date — the campaign is scheduled for the configured time on this day. */
  publishingDate: Date
}

/**
 * Enqueue async promotional-email generation + scheduling for a published article.
 * Idempotent: skips if already scheduled/sent or in-flight.
 */
export async function enqueuePromoEmail(
  input: EnqueuePromoEmailInput,
): Promise<{ enqueued: boolean; message?: string }> {
  const { jobId, userId, publishingDate } = input

  const existing = await prisma.articleEmailCampaign.findUnique({
    where: { jobId },
    select: { status: true },
  })

  if (existing && (existing.status === 'scheduled' || existing.status === 'sent')) {
    return { enqueued: false, message: `Promo email already ${existing.status}` }
  }
  if (existing && existing.status === 'generated') {
    // Generated but not yet scheduled — let the safety sweep retry rather than double-send.
    return { enqueued: false, message: 'Promo email generation already in progress' }
  }

  await prisma.articleEmailCampaign.upsert({
    where: { jobId },
    create: { jobId, userId, subject: '', bodyHtml: '', status: 'pending' },
    update: { status: 'pending', errorMessage: null },
  })

  const boss = await getBoss()
  await boss.send(
    QUEUES.PROMO_EMAIL_GENERATE,
    { jobId, userId, publishingDate: publishingDate.toISOString() },
    {
      singletonKey: `promo-email-${jobId}`,
      expireInSeconds: 60 * 30,
      retryLimit: 2,
      retryDelay: 60,
    },
  )

  logger.info({ jobId }, '[promo-email] enqueued')
  return { enqueued: true }
}
