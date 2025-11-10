import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTwitterAnalytics } from '@/lib/twitterApi'
import { getLinkedInAnalytics } from '@/lib/linkedinApi'

/**
 * GET /api/posts/sync-analytics - Sync analytics for published posts
 * Called automatically by Vercel Cron (daily at 2 AM UTC) or can be called manually
 * 
 * Security: Protected by CRON_SECRET environment variable
 * Set CRON_SECRET in your environment variables and Vercel will automatically
 * include it in the Authorization header when calling via cron
 */
export async function GET(request: Request) {
  try {
    console.log('[Sync Analytics] Starting analytics sync...')
    
    // Security: Check for cron secret (Vercel automatically includes this)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    // In production, require authentication
    // In development, allow unauthenticated access for testing
    if (process.env.NODE_ENV === 'production' && cronSecret) {
      if (authHeader !== `Bearer ${cronSecret}`) {
        console.log('[Sync Analytics] Unauthorized - missing or invalid cron secret')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    
    console.log('[Sync Analytics] Current time:', now.toISOString())
    console.log('[Sync Analytics] Fetching posts where analyticsLastSyncedAt is null or older than 24 hours')
    
    // Find all published posts where analytics haven't been synced in the last 24 hours
    const postsToSync = await prisma.post.findMany({
      where: {
        status: 'published',
        publishedAt: {
          not: null,
        },
        OR: [
          {
            analyticsLastSyncedAt: null,
          },
          {
            analyticsLastSyncedAt: {
              lt: oneDayAgo,
            },
          },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
          },
        },
      },
      take: 100, // Limit to 100 posts per sync to avoid rate limits
    })

    console.log(`[Sync Analytics] Found ${postsToSync.length} post(s) to sync`)

    if (postsToSync.length === 0) {
      return NextResponse.json({
        message: 'No posts need analytics sync',
        synced: 0,
        failed: 0,
        skipped: 0,
        timestamp: now.toISOString(),
      })
    }

    const results = {
      synced: 0,
      failed: 0,
      skipped: 0,
      timestamp: now.toISOString(),
    }

    // Process each post
    for (const post of postsToSync) {
      try {
        console.log(`[Sync Analytics] Syncing analytics for post ${post.id} (${post.platform})`)
        
        let analytics: any = null

        if (post.platform === 'twitter' && post.tweetId) {
          // Fetch Twitter analytics
          analytics = await getTwitterAnalytics(post.user.id, post.tweetId)
          
          if (analytics) {
            // Update post with analytics data
            await prisma.post.update({
              where: { id: post.id },
              data: {
                analyticsData: analytics,
                analyticsLastSyncedAt: now,
              },
            })
            results.synced++
            console.log(`[Sync Analytics] Successfully synced Twitter analytics for post ${post.id}`)
          } else {
            // Analytics fetch failed, but don't mark as failed - might be rate limited
            results.skipped++
            console.log(`[Sync Analytics] Skipped post ${post.id} - analytics not available`)
          }
        } else if (post.platform === 'linkedin' && post.postUrl) {
          // Extract post ID from LinkedIn URL
          // LinkedIn URLs are: https://www.linkedin.com/feed/update/{postId}
          const linkedInPostIdMatch = post.postUrl.match(/\/feed\/update\/([^\/\?]+)/)
          const linkedInPostId = linkedInPostIdMatch ? linkedInPostIdMatch[1] : null
          
          if (linkedInPostId) {
            // Fetch LinkedIn analytics
            analytics = await getLinkedInAnalytics(post.user.id, linkedInPostId)
            
            if (analytics) {
              // Update post with analytics data
              await prisma.post.update({
                where: { id: post.id },
                data: {
                  analyticsData: analytics,
                  analyticsLastSyncedAt: now,
                },
              })
              results.synced++
              console.log(`[Sync Analytics] Successfully synced LinkedIn analytics for post ${post.id}`)
            } else {
              // Analytics fetch failed, but don't mark as failed - might be rate limited or not available
              results.skipped++
              console.log(`[Sync Analytics] Skipped post ${post.id} - analytics not available`)
            }
          } else {
            results.skipped++
            console.log(`[Sync Analytics] Skipped post ${post.id} - could not extract LinkedIn post ID`)
          }
        } else {
          results.skipped++
          console.log(`[Sync Analytics] Skipped post ${post.id} - missing tweetId or postUrl`)
        }

        // Add a small delay between requests to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error) {
        console.error(`[Sync Analytics] Error syncing analytics for post ${post.id}:`, error)
        results.failed++
        
        // Don't update analyticsLastSyncedAt if sync failed
        // This allows retry on next sync cycle
      }
    }

    console.log(`[Sync Analytics] Completed: ${results.synced} synced, ${results.failed} failed, ${results.skipped} skipped`)
    
    return NextResponse.json({
      message: `Synced analytics for ${results.synced} post(s)`,
      ...results,
    })
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

