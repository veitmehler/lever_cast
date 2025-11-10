import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { postToLinkedIn } from '@/lib/linkedinApi'
import { postToTwitter, postTwitterThread } from '@/lib/twitterApi'

// Helper function to get or create user
async function getOrCreateUser(clerkId: string) {
  let user = await prisma.user.findUnique({
    where: { clerkId },
  })

  if (!user) {
    const clerkUser = await currentUser()
    
    if (!clerkUser) {
      throw new Error('User not found in Clerk')
    }

    const email = clerkUser.emailAddresses.find(
      (e) => e.id === clerkUser.primaryEmailAddressId
    )?.emailAddress

    if (!email) {
      throw new Error('No email found')
    }

    const name = clerkUser.firstName
      ? `${clerkUser.firstName}${clerkUser.lastName ? ' ' + clerkUser.lastName : ''}`
      : email.split('@')[0]

    user = await prisma.user.create({
      data: {
        clerkId,
        name,
        email,
      },
    })
  }

  return user
}

/**
 * POST /api/posts/publish - Publish a post to social media
 * This endpoint handles the actual publishing to LinkedIn/Twitter using OAuth
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await auth()
    const clerkId = authResult.userId

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { platform, content, imageUrl } = body

    if (!platform || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: platform, content' },
        { status: 400 }
      )
    }

    // Get or create user
    const user = await getOrCreateUser(clerkId)

    // Publish to platform
    let publishResult: { success: true; postUrl: string | string[]; tweetId?: string; tweetIds?: string[] } | { success: false; error: string }

    if (platform === 'linkedin') {
      const contentStr = Array.isArray(content) ? content[0] : content
      publishResult = await postToLinkedIn(user.id, contentStr, imageUrl)
    } else if (platform === 'twitter') {
      if (Array.isArray(content)) {
        // Twitter thread
        const threadResult = await postTwitterThread(user.id, content)
        if (threadResult.success) {
          publishResult = { success: true, postUrl: threadResult.postUrls, tweetIds: threadResult.tweetIds }
        } else {
          publishResult = threadResult
        }
      } else {
        // Single tweet
        const tweetResult = await postToTwitter(user.id, content)
        if (tweetResult.success) {
          publishResult = { success: true, postUrl: tweetResult.postUrl, tweetId: tweetResult.tweetId }
        } else {
          publishResult = tweetResult
        }
      }
    } else {
      return NextResponse.json(
        { error: `Unsupported platform: ${platform}` },
        { status: 400 }
      )
    }

    if (!publishResult.success) {
      return NextResponse.json(
        { error: publishResult.error },
        { status: 400 }
      )
    }

    // Return success with post URL(s) and tweet ID(s)
    return NextResponse.json({
      success: true,
      postUrl: publishResult.postUrl,
      tweetId: 'tweetId' in publishResult ? publishResult.tweetId : undefined,
      tweetIds: 'tweetIds' in publishResult ? publishResult.tweetIds : undefined,
      message: `Post successfully published to ${platform === 'linkedin' ? 'LinkedIn' : 'Twitter/X'}!`,
    })
  } catch (error) {
    console.error('Error publishing post:', error)
    return NextResponse.json(
      {
        error: 'Failed to publish post',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

