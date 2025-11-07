import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { publishToPlatform } from '@/lib/mockAI'

// This endpoint checks for scheduled posts that are due and publishes them
// Can be called manually or set up as a cron job (e.g., every minute)
export async function GET(request: Request) {
  try {
    // Optional: Add authentication/authorization for cron jobs
    // For now, we'll allow unauthenticated access (you should secure this in production)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    
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

    if (scheduledPosts.length === 0) {
      return NextResponse.json({ 
        message: 'No scheduled posts due for publishing',
        processed: 0 
      })
    }

    const results = {
      processed: 0,
      published: [] as string[],
      failed: [] as Array<{ id: string; error: string }>,
    }

    // Process each scheduled post
    for (const post of scheduledPosts) {
      try {
        // For Twitter threads, check if this is a reply (has parentPostId)
        // Replies should be published after the parent post is published
        if (post.parentPostId) {
          // Check if parent post is published
          const parentPost = await prisma.post.findUnique({
            where: { id: post.parentPostId },
          })
          
          if (!parentPost || parentPost.status !== 'published') {
            // Skip this reply - parent not published yet
            continue
          }
        }

        // Publish to platform (currently mock, will be real API when integrated)
        const publishResult = await publishToPlatform(
          post.platform as 'linkedin' | 'twitter',
          post.content
        )

        if (publishResult.success) {
          // Update post status to published
          await prisma.post.update({
            where: { id: post.id },
            data: {
              status: 'published',
              publishedAt: new Date(),
              scheduledAt: null, // Clear scheduledAt since it's now published
              postUrl: publishResult.postUrl || null,
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

