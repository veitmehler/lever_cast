import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// This endpoint checks for scheduled posts that are due and publishes them
// Called automatically by Vercel Cron (every minute) or can be called manually
// 
// Security: Protected by CRON_SECRET environment variable
// Set CRON_SECRET in your environment variables and Vercel will automatically
// include it in the Authorization header when calling via cron
export async function GET(request: Request) {
  try {
    console.log('[Publish Scheduled] Starting scheduled post check...')
    
    // Security: Check for cron secret (Vercel automatically includes this)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    // In production, require authentication
    // In development, allow unauthenticated access for testing
    if (process.env.NODE_ENV === 'production' && cronSecret) {
      if (authHeader !== `Bearer ${cronSecret}`) {
        console.log('[Publish Scheduled] Unauthorized - missing or invalid cron secret')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const now = new Date()
    console.log('[Publish Scheduled] Current time:', now.toISOString())
    
    // Debug: Check all posts with scheduledAt in the past, regardless of status
    const allPastScheduled = await prisma.post.findMany({
      where: {
        scheduledAt: {
          lte: now,
          not: null,
        },
      },
      select: {
        id: true,
        status: true,
        scheduledAt: true,
        parentPostId: true,
        platform: true,
      },
      take: 10, // Limit to first 10 for debugging
    })
    console.log(`[Publish Scheduled] Debug: Found ${allPastScheduled.length} posts with scheduledAt <= now (any status):`, 
      allPastScheduled.map(p => ({
        id: p.id,
        status: p.status,
        scheduledAt: p.scheduledAt?.toISOString(),
        parentPostId: p.parentPostId,
        platform: p.platform,
      }))
    )
    
    // Find all scheduled posts where scheduledAt <= now
    const scheduledPosts = await prisma.post.findMany({
      where: {
        status: 'scheduled',
        scheduledAt: {
          lte: now,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            clerkId: true,
          },
        },
        draft: {
          select: {
            id: true,
            platforms: true,
          },
        },
      },
      orderBy: {
        scheduledAt: 'asc',
      },
    })

    console.log(`[Publish Scheduled] Found ${scheduledPosts.length} scheduled post(s) due for publishing`)
    
    if (scheduledPosts.length === 0) {
      return NextResponse.json({ 
        message: 'No scheduled posts due for publishing',
        processed: 0,
        timestamp: now.toISOString(),
      })
    }

    const results = {
      processed: 0,
      published: [] as string[],
      failed: [] as Array<{ id: string; error: string }>,
      timestamp: now.toISOString(),
    }

    // Process each scheduled post
    for (const post of scheduledPosts) {
      try {
        console.log(`[Publish Scheduled] Processing post ${post.id} (${post.platform}, scheduled: ${post.scheduledAt?.toISOString()})`)
        console.log(`[Publish Scheduled] Post details:`, {
          id: post.id,
          platform: post.platform,
          hasParentPostId: !!post.parentPostId,
          parentPostId: post.parentPostId,
          status: post.status,
        })
        
        // For Twitter threads, check if this is a reply (has parentPostId)
        // Replies should be published after the parent post is published
        if (post.parentPostId) {
          console.log(`[Publish Scheduled] Post ${post.id} is a reply to ${post.parentPostId}`)
          // Check if parent post is published
          const parentPost = await prisma.post.findUnique({
            where: { id: post.parentPostId },
            select: { tweetId: true, status: true, id: true },
          })
          
          console.log(`[Publish Scheduled] Parent post check result:`, {
            found: !!parentPost,
            parentId: parentPost?.id,
            parentStatus: parentPost?.status,
            parentTweetId: parentPost?.tweetId,
          })
          
          if (!parentPost || parentPost.status !== 'published') {
            // Skip this reply - parent not published yet
            // This ensures thread replies are published in order
            console.log(`[Publish Scheduled] Skipping reply ${post.id} - parent ${post.parentPostId} not published yet (status: ${parentPost?.status || 'not found'})`)
            continue
          }
          console.log(`[Publish Scheduled] Parent post ${post.parentPostId} is published, proceeding with reply`)
        }

        // Publish to platform using real APIs
        let publishResult: { success: boolean; message: string; postUrl?: string; tweetId?: string; error?: string }
        
        if (post.platform === 'linkedin') {
          const { postToLinkedIn } = await import('@/lib/linkedinApi')
          const result = await postToLinkedIn(post.user.id, post.content)
          publishResult = result.success
            ? { success: true, message: 'Published to LinkedIn', postUrl: result.postUrl }
            : { success: false, message: result.error, error: result.error }
        } else if (post.platform === 'twitter') {
          const { postToTwitter } = await import('@/lib/twitterApi')
          
          console.log(`[Publish Scheduled] Publishing Twitter post ${post.id} for user ${post.user.id}`)
          
          // For Twitter threads, if this is a reply, get the parent post's tweet ID directly from database
          let replyToTweetId: string | undefined = undefined
          if (post.parentPostId) {
            const parentPost = await prisma.post.findUnique({
              where: { id: post.parentPostId },
              select: { tweetId: true, status: true },
            })

            if (!parentPost || parentPost.status !== 'published') {
              console.log(`[Publish Scheduled] Skipping reply ${post.id} - parent ${post.parentPostId} not published yet`)
              continue
            }

            // Use tweetId directly from database (no URL parsing needed!)
            if (parentPost?.tweetId) {
              replyToTweetId = parentPost.tweetId
              console.log(`[Publish Scheduled] Found parent tweet ID from database: ${replyToTweetId}`)
              
              // Add delay for replies to ensure parent tweet is processed (no verification needed)
              await new Promise(resolve => setTimeout(resolve, 3000))
            } else {
              console.warn(`[Publish Scheduled] Parent post ${post.parentPostId} has no tweetId`)
            }
          }

          const result = await postToTwitter(post.user.id, post.content, replyToTweetId)
          console.log(`[Publish Scheduled] Twitter API result for post ${post.id}:`, result.success ? 'SUCCESS' : `FAILED: ${result.error}`)

          publishResult = result.success
            ? { success: true, message: 'Published to Twitter/X', postUrl: result.postUrl, tweetId: result.tweetId }
            : { success: false, message: result.error, error: result.error }
        } else {
          publishResult = { success: false, message: `Unsupported platform: ${post.platform}`, error: `Unsupported platform: ${post.platform}` }
        }

        if (publishResult.success) {
          console.log(`[Publish Scheduled] Successfully published post ${post.id} to ${post.platform}`)
          
          // Update post status to published
          await prisma.post.update({
            where: { id: post.id },
            data: {
              status: 'published',
              publishedAt: new Date(),
              scheduledAt: null, // Clear scheduledAt since it's now published
              postUrl: publishResult.postUrl || null,
              tweetId: publishResult.tweetId || null, // Save tweetId directly
            },
          })

          results.processed++
          results.published.push(post.id)

          // If this is a summary post and all platforms are published, update draft status
          if (post.draftId && !post.parentPostId) {
            const draft = await prisma.draft.findUnique({
              where: { id: post.draftId },
            })

            if (draft) {
              // Get all published posts for this draft (only summary posts)
              const publishedPosts = await prisma.post.findMany({
                where: {
                  draftId: post.draftId,
                  status: 'published',
                  parentPostId: null, // Only count summary posts
                },
                select: {
                  platform: true,
                },
              })

              const publishedPlatforms = publishedPosts.map(p => p.platform)
              const draftPlatforms = draft.platforms === 'both' 
                ? ['linkedin', 'twitter'] 
                : [draft.platforms]

              // Check if all platforms for this draft are published
              const allPublished = draftPlatforms.every(platform => 
                publishedPlatforms.includes(platform)
              )

              if (allPublished) {
                await prisma.draft.update({
                  where: { id: post.draftId },
                  data: {
                    status: 'published',
                    publishedAt: new Date(),
                  },
                })
              }
            }
          }
        } else {
          // Publishing failed
          console.error(`[Publish Scheduled] Failed to publish post ${post.id}:`, publishResult.error)
          
          // Don't mark as failed if it's a rate limit - keep it scheduled for retry
          // But check if we should delay retry based on reset time
          const isRateLimit = publishResult.error?.toLowerCase().includes('rate limit')
          
          if (isRateLimit) {
            // Extract reset time from error message if available
            const resetMatch = publishResult.error?.match(/resets at ([^\.]+)/)
            const resetTime = resetMatch ? new Date(resetMatch[1]) : null
            
            // If we have a reset time, we could potentially reschedule, but for now just keep as scheduled
            // The cron job will retry every minute, and once the rate limit resets, it will succeed
            console.log(`[Publish Scheduled] Post ${post.id} rate limited, keeping as scheduled for retry`)
            
            await prisma.post.update({
              where: { id: post.id },
              data: {
                status: 'scheduled', // Keep scheduled if rate limited
                errorMsg: publishResult.error || 'Rate limit exceeded',
              },
            })
          } else {
            await prisma.post.update({
              where: { id: post.id },
              data: {
                status: 'failed',
                errorMsg: publishResult.error || 'Failed to publish',
              },
            })

            results.failed.push({
              id: post.id,
              error: publishResult.error || 'Unknown error',
            })
          }
        }
      } catch (error) {
        console.error(`Error publishing post ${post.id}:`, error)
        
        await prisma.post.update({
          where: { id: post.id },
          data: {
            status: 'failed',
            errorMsg: error instanceof Error ? error.message : 'Unknown error',
          },
        })

        results.failed.push({
          id: post.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    console.log(`[Publish Scheduled] Completed: ${results.processed} published, ${results.failed.length} failed`)
    
    return NextResponse.json({
      message: `Processed ${results.processed} scheduled post(s)`,
      ...results,
    })
  } catch (error) {
    console.error('Error processing scheduled posts:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process scheduled posts',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
