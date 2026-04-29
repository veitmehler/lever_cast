import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { postToLinkedIn } from '@/lib/linkedinApi'
import { postToTwitter, postTwitterThread } from '@/lib/twitterApi'
import { postToFacebook } from '@/lib/facebookApi'
import { postToInstagram } from '@/lib/instagramApi'
import { postToTelegram } from '@/lib/telegramApi'
import { postToThreads } from '@/lib/threadsApi'

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
    const { platform, content, imageUrl, chatId } = body // chatId for Telegram

    console.log(`[Publish API] Received publish request:`, {
      platform,
      contentLength: Array.isArray(content) ? content.length : content?.length,
      imageUrl: imageUrl || 'none',
      chatId: chatId || 'none',
    })

    if (!platform || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: platform, content' },
        { status: 400 }
      )
    }

    // Get or create user
    const user = await getOrCreateUser(clerkId)

    // Publish to platform
    let publishResult: { success: true; postUrl: string | string[]; tweetId?: string; tweetIds?: string[]; postId?: string; message?: string } | { success: false; error: string }

    if (platform === 'linkedin') {
      const contentStr = Array.isArray(content) ? content[0] : content
      console.log(`[Publish API] Publishing to LinkedIn with imageUrl: ${imageUrl || 'none'}`)
      publishResult = await postToLinkedIn(user.id, contentStr, imageUrl)
    } else if (platform === 'twitter') {
      if (Array.isArray(content)) {
        // Twitter thread - only attach image to first tweet
        const threadResult = await postTwitterThread(user.id, content, imageUrl)
        if (threadResult.success) {
          publishResult = { success: true, postUrl: threadResult.postUrls, tweetIds: threadResult.tweetIds }
        } else {
          publishResult = threadResult
        }
      } else {
        // Single tweet
        const tweetResult = await postToTwitter(user.id, content, undefined, imageUrl)
        if (tweetResult.success) {
          publishResult = { success: true, postUrl: tweetResult.postUrl, tweetId: tweetResult.tweetId }
        } else {
          publishResult = tweetResult
        }
      }
    } else if (platform === 'facebook') {
      const contentStr = Array.isArray(content) ? content[0] : content
      console.log(`[Publish API] Publishing to Facebook with imageUrl: ${imageUrl || 'none'}`)
      const facebookResult = await postToFacebook(user.id, contentStr, imageUrl)
      if (facebookResult.success) {
        publishResult = { success: true, postUrl: facebookResult.postUrl, postId: facebookResult.postId }
      } else {
        publishResult = facebookResult
      }
    } else if (platform === 'instagram') {
      const contentStr = Array.isArray(content) ? content[0] : content
      console.log(`[Publish API] Publishing to Instagram with imageUrl: ${imageUrl || 'none'}`)
      if (!imageUrl) {
        publishResult = { success: false, error: 'Instagram requires an image. Please attach an image to your post.' }
      } else {
        const instagramResult = await postToInstagram(user.id, contentStr, imageUrl)
        if (instagramResult.success) {
          publishResult = { success: true, postUrl: instagramResult.postUrl, postId: instagramResult.postId }
        } else {
          publishResult = instagramResult
        }
      }
    } else if (platform === 'telegram') {
      const contentStr = Array.isArray(content) ? content[0] : content
      console.log(`[Publish API] Publishing to Telegram with chatId: ${chatId || 'none'}, imageUrl: ${imageUrl || 'none'}`)
      if (!chatId) {
        publishResult = { success: false, error: 'Telegram chat/channel ID is required. Please specify the chat ID or channel username (e.g., "@channelname").' }
      } else {
        const telegramResult = await postToTelegram(user.id, contentStr, chatId, imageUrl)
        if (telegramResult.success) {
          publishResult = { success: true, postUrl: `https://t.me/${chatId.replace('@', '')}/${telegramResult.messageId}`, postId: telegramResult.messageId.toString() }
        } else {
          publishResult = telegramResult
        }
      }
    } else if (platform === 'threads') {
      const contentStr = Array.isArray(content) ? content[0] : content
      console.log(`[Publish API] Publishing to Threads with imageUrl: ${imageUrl || 'none'}`)
      const threadsResult = await postToThreads(user.id, contentStr, imageUrl)
      if (threadsResult.success) {
        publishResult = { success: true, postUrl: threadsResult.postUrl, postId: threadsResult.postId }
      } else {
        publishResult = threadsResult
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

    // Return success with post URL(s), tweet ID(s), and imageUrl
    return NextResponse.json({
      success: true,
      postUrl: publishResult.postUrl,
      tweetId: 'tweetId' in publishResult ? publishResult.tweetId : undefined,
      tweetIds: 'tweetIds' in publishResult ? publishResult.tweetIds : undefined,
      imageUrl: imageUrl || undefined,
      message: `Post successfully published to ${platform === 'linkedin' ? 'LinkedIn' : platform === 'facebook' ? 'Facebook' : platform === 'instagram' ? 'Instagram' : platform === 'telegram' ? 'Telegram' : platform === 'threads' ? 'Threads' : 'Twitter/X'}!`,
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

