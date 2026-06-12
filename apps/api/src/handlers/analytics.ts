import PgBoss from 'pg-boss'
import { Prisma } from '@prisma/client'
import { prisma } from '@socioply/shared'
import { logger } from '../lib/logger'
import { getTwitterAnalytics } from '@socioply/shared'
import { getLinkedInAnalytics } from '@socioply/shared'
import { syncGhlPostFromApi } from '../social/ghl-analytics'

export interface AnalyticsSyncJobData {
  _cron?: true
}

interface AnalyticsData {
  impressions?: number
  views?: number
  likes?: number
  retweets?: number
  replies?: number
  quoteTweets?: number
  clicks?: number
  comments?: number
  shares?: number
  [key: string]: unknown
}

export async function analyticsSyncHandler(jobs: PgBoss.Job<AnalyticsSyncJobData>[]) {
  logger.info({ jobCount: jobs.length }, '[analytics-sync] starting')

  const now = new Date()
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  const postsToSync = await prisma.post.findMany({
    where: {
      OR: [
        {
          status: 'published',
          publishedAt: { not: null },
          OR: [
            { analyticsLastSyncedAt: null },
            { analyticsLastSyncedAt: { lt: oneDayAgo } },
          ],
        },
        {
          provider: 'ghl',
          ghlPostId: { not: null },
          status: { in: ['scheduled', 'published'] },
          OR: [
            { analyticsLastSyncedAt: null },
            { analyticsLastSyncedAt: { lt: oneDayAgo } },
          ],
        },
      ],
    },
    take: 100,
  })

  logger.info({ count: postsToSync.length }, '[analytics-sync] posts to sync')

  let synced = 0
  let skipped = 0
  let failed = 0

  for (const post of postsToSync) {
    try {
      if (post.provider === 'ghl' && post.ghlPostId) {
        const ok = await syncGhlPostFromApi(post)
        if (ok) {
          synced++
        } else {
          skipped++
          logger.debug(
            { postId: post.id, ghlPostId: post.ghlPostId, platform: post.platform, reason: 'ghl_sync_skipped' },
            '[analytics-sync] GHL post skipped',
          )
        }
        await new Promise((r) => setTimeout(r, 500))
        continue
      }

      let analytics: AnalyticsData | null = null

      if (post.platform === 'twitter' && post.tweetId) {
        analytics = await getTwitterAnalytics(post.userId, post.tweetId)
      } else if (post.platform === 'linkedin' && post.postUrl && post.provider !== 'ghl') {
        let linkedInPostId: string | null = null

        if (post.postUrl.startsWith('urn:li:share:')) {
          linkedInPostId = post.postUrl
        } else {
          const match = post.postUrl.match(/\/feed\/update\/(urn:li:share:[^/?]+|[^/?]+)/)
          if (match) {
            linkedInPostId = match[1].startsWith('urn:li:share:')
              ? match[1]
              : `urn:li:share:${match[1]}`
          }
        }

        if (linkedInPostId) {
          analytics = await getLinkedInAnalytics(post.userId, linkedInPostId)
        }
      }

      if (analytics) {
        await prisma.post.update({
          where: { id: post.id },
          data: {
            analyticsData: analytics as Prisma.InputJsonValue,
            analyticsLastSyncedAt: now,
          },
        })
        synced++
      } else {
        skipped++
        logger.debug(
          { postId: post.id, platform: post.platform, reason: 'no_analytics_source' },
          '[analytics-sync] post skipped',
        )
      }

      await new Promise((r) => setTimeout(r, 300))
    } catch (err) {
      logger.error({ postId: post.id, platform: post.platform, err }, '[analytics-sync] post error')
      failed++
    }
  }

  logger.info({ synced, skipped, failed }, '[analytics-sync] done')
}
