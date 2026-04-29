import PgBoss from 'pg-boss'
import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { getTwitterAnalytics } from '../lib/twitterApi'
import { getLinkedInAnalytics } from '../lib/linkedinApi'

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
  console.log(`[analytics-sync] starting — ${jobs.length} job(s)`)

  const now = new Date()
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  const postsToSync = await prisma.post.findMany({
    where: {
      status: 'published',
      publishedAt: { not: null },
      OR: [
        { analyticsLastSyncedAt: null },
        { analyticsLastSyncedAt: { lt: oneDayAgo } },
      ],
    },
    include: { user: { select: { id: true } } },
    take: 100,
  })

  console.log(`[analytics-sync] ${postsToSync.length} post(s) to sync`)

  let synced = 0
  let skipped = 0
  let failed = 0

  for (const post of postsToSync) {
    try {
      let analytics: AnalyticsData | null = null

      if (post.platform === 'twitter' && post.tweetId) {
        analytics = await getTwitterAnalytics(post.user.id, post.tweetId)
      } else if (post.platform === 'linkedin' && post.postUrl) {
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
          analytics = await getLinkedInAnalytics(post.user.id, linkedInPostId)
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
      }

      // Throttle to respect platform rate limits
      await new Promise((r) => setTimeout(r, 300))
    } catch (err) {
      console.error(`[analytics-sync] post ${post.id} error:`, err)
      failed++
    }
  }

  console.log(`[analytics-sync] done — synced: ${synced}, skipped: ${skipped}, failed: ${failed}`)
}
