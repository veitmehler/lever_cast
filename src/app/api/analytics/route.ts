import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

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

interface PostAnalytics {
  id: string
  platform: string
  content: string
  publishedAt: string | null
  postUrl: string | null
  comments: number
  totalReactions: number
  positiveReactions: number
  negativeReactions: number
  shares: number
  analyticsLastSyncedAt: string | null
}

// GET /api/analytics - Get aggregated analytics for all published posts
export async function GET(request: NextRequest) {
  try {
    const authResult = await auth()
    const clerkId = authResult.userId

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Fetch all published posts with analytics data
    const posts = await prisma.post.findMany({
      where: {
        userId: user.id,
        status: 'published',
        publishedAt: {
          not: null,
        },
        parentPostId: null, // Only show main posts, not thread replies
      },
      select: {
        id: true,
        platform: true,
        content: true,
        publishedAt: true,
        postUrl: true,
        analyticsData: true,
        analyticsLastSyncedAt: true,
      },
      orderBy: {
        publishedAt: 'desc',
      },
    })

    // Process analytics data for each post
    const analytics: PostAnalytics[] = posts.map((post) => {
      const analyticsData = (post.analyticsData as AnalyticsData) || {}

      // Extract platform-specific metrics
      let comments = 0
      let totalReactions = 0
      let positiveReactions = 0
      let negativeReactions = 0
      let shares = 0

      // Platform-specific reaction extraction
      if (post.platform === 'twitter' || post.platform === 'x') {
        // Twitter/X metrics
        comments = analyticsData.replies || 0
        const likes = analyticsData.likes || 0
        const retweets = analyticsData.retweets || 0
        const quoteTweets = analyticsData.quoteTweets || 0
        totalReactions = likes + retweets + quoteTweets
        positiveReactions = likes + retweets + quoteTweets // All Twitter reactions are positive
        negativeReactions = 0 // Twitter doesn't have negative reactions
        shares = retweets + quoteTweets
      } else if (post.platform === 'linkedin') {
        // LinkedIn metrics
        comments = analyticsData.comments || 0
        const likes = analyticsData.likes || 0
        totalReactions = likes
        positiveReactions = likes
        negativeReactions = 0 // LinkedIn doesn't have negative reactions
        shares = analyticsData.shares || 0
      } else if (post.platform === 'facebook') {
        // Facebook metrics
        comments = analyticsData.comments || 0
        const likes = analyticsData.likes || 0
        // Facebook has reactions: like, love, wow, haha, sad, angry
        // For simplicity, we'll treat like/love/wow/haha as positive, sad/angry as negative
        const reactions = analyticsData.reactions || {}
        const positiveCount = (reactions.like || 0) + (reactions.love || 0) + (reactions.wow || 0) + (reactions.haha || 0)
        const negativeCount = (reactions.sad || 0) + (reactions.angry || 0)
        totalReactions = likes + positiveCount + negativeCount
        positiveReactions = likes + positiveCount
        negativeReactions = negativeCount
        shares = analyticsData.shares || 0
      } else if (post.platform === 'instagram') {
        // Instagram metrics
        comments = analyticsData.comments || 0
        const likes = analyticsData.likes || 0
        totalReactions = likes
        positiveReactions = likes
        negativeReactions = 0 // Instagram doesn't have negative reactions
        shares = 0 // Instagram shares are private
      } else if (post.platform === 'threads') {
        // Threads metrics (similar to Instagram)
        comments = analyticsData.comments || 0
        const likes = analyticsData.likes || 0
        totalReactions = likes
        positiveReactions = likes
        negativeReactions = 0
        shares = analyticsData.shares || 0
      } else if (post.platform === 'telegram') {
        // Telegram metrics
        comments = analyticsData.comments || 0
        const views = analyticsData.views || 0
        totalReactions = views
        positiveReactions = views
        negativeReactions = 0
        shares = analyticsData.shares || 0
      }

      return {
        id: post.id,
        platform: post.platform,
        content: post.content,
        publishedAt: post.publishedAt?.toISOString() || null,
        postUrl: post.postUrl,
        comments,
        totalReactions,
        positiveReactions,
        negativeReactions,
        shares,
        analyticsLastSyncedAt: post.analyticsLastSyncedAt?.toISOString() || null,
      }
    })

    return NextResponse.json({
      posts: analytics,
      total: analytics.length,
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch analytics',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

