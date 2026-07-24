import { prisma } from '@omniply/shared'
import { getBoss, QUEUES } from '../../queues/index'
import { logger } from '../../lib/logger'

const SYNDICATION_PLATFORMS = ['linkedin', 'medium'] as const

/**
 * Enqueue async syndication generation for a published article.
 * Idempotent: skips if all platforms are already completed or in-flight.
 */
export async function enqueueSyndication(jobId: string, userId: string): Promise<{ enqueued: boolean; message?: string }> {
  const existing = await prisma.syndicationArticle.findMany({
    where: { jobId },
    select: { platform: true, status: true },
  })

  // All completed — nothing to do
  const completed = existing.filter((a) => a.status === 'completed')
  if (completed.length >= SYNDICATION_PLATFORMS.length) {
    return { enqueued: false, message: 'Syndication already completed for all platforms' }
  }

  // Any in-flight — skip to avoid duplicates
  const inFlight = existing.some((a) => a.status === 'pending' || a.status === 'processing')
  if (inFlight) {
    return { enqueued: false, message: 'Syndication already in progress' }
  }

  // Upsert pending placeholder rows for each platform
  for (const platform of SYNDICATION_PLATFORMS) {
    const alreadyDone = existing.find((a) => a.platform === platform && a.status === 'completed')
    if (alreadyDone) continue

    await prisma.syndicationArticle.upsert({
      where: { jobId_platform: { jobId, platform } },
      create: { jobId, userId, platform, title: '', content: '', status: 'pending' },
      update: { status: 'pending', errorMessage: null },
    })
  }

  const boss = await getBoss()
  await boss.send(
    QUEUES.SYNDICATION_GENERATE,
    { jobId, userId },
    {
      singletonKey: `syndication-generate-${jobId}`,
      expireInSeconds: 60 * 30,
      retryLimit: 2,
      retryDelay: 60,
    },
  )

  logger.info({ jobId }, '[syndication] enqueued')
  return { enqueued: true }
}
