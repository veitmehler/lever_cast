import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getTwitterAnalytics } from '@/lib/twitterApi'
import { getLinkedInAnalytics } from '@/lib/linkedinApi'

/**
 * POST /api/posts/[id]/sync-analytics - Sync analytics for a single post
 * This endpoint refreshes analytics for one specific post
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await auth()
    const userId = authResult.userId

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Find the post
    const post = await prisma.post.findFirst({
      where: {
        id,
        userId: user.id,
        status: 'published',
        publishedAt: {
          not: null,
        },
      },
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    console.log(`[Sync Analytics] Syncing analytics for post ${post.id} (${post.platform})`)

    let analytics: any = null

    if (post.platform === 'twitter' && post.tweetId) {
      // Fetch Twitter analytics
      analytics = await getTwitterAnalytics(user.id, post.tweetId)
    } else if (post.platform === 'linkedin' && post.postUrl) {
      // Extract post ID from LinkedIn URL
      const linkedInPostIdMatch = post.postUrl.match(/\/feed\/update\/([^\/\?]+)/)
      const linkedInPostId = linkedInPostIdMatch ? linkedInPostIdMatch[1] : null

      if (linkedInPostId) {
        // Fetch LinkedIn analytics
        analytics = await getLinkedInAnalytics(user.id, linkedInPostId)
      }
    }

    const now = new Date()

    if (analytics) {
      // Update post with analytics data
      await prisma.post.update({
        where: { id: post.id },
        data: {
          analyticsData: analytics,
          analyticsLastSyncedAt: now,
        },
      })

      console.log(`[Sync Analytics] Successfully synced analytics for post ${post.id}`)

      return NextResponse.json({
        success: true,
        message: 'Analytics synced successfully',
        analytics,
        lastSyncedAt: now.toISOString(),
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'Analytics not available for this post',
        error: 'Analytics data could not be fetched',
      }, { status: 404 })
    }
  } catch (error) {
    console.error('[Sync Analytics] Error syncing analytics:', error)
    return NextResponse.json(
      {
        error: 'Failed to sync analytics',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

