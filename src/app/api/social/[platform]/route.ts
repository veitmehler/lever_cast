import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { encrypt, decrypt } from '@/lib/encryption'
import { generateOAuthState } from '@/lib/oauth'

// Valid platform names
const VALID_PLATFORMS = ['linkedin', 'twitter']

// OAuth configuration
const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET
const LINKEDIN_REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI || 
  `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/social/linkedin/callback`

const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET
const TWITTER_REDIRECT_URI = process.env.TWITTER_REDIRECT_URI || 
  `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/social/twitter/callback`

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

type RouteContext = {
  params: {
    platform: string
  }
}

// POST /api/social/[platform] - Initiate OAuth flow
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const authResult = await auth()
    const clerkId = authResult.userId

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { platform } = context.params

    if (!VALID_PLATFORMS.includes(platform)) {
      return NextResponse.json(
        { error: `Invalid platform. Must be one of: ${VALID_PLATFORMS.join(', ')}` },
        { status: 400 }
      )
    }

    // Generate OAuth state token
    const state = generateOAuthState(clerkId, platform)

    let redirectUrl: string

    if (platform === 'linkedin') {
      if (!LINKEDIN_CLIENT_ID) {
        return NextResponse.json(
          { error: 'LinkedIn OAuth not configured. Please set LINKEDIN_CLIENT_ID environment variable.' },
          { status: 500 }
        )
      }

      // LinkedIn OAuth 2.0 authorization URL
      // Note: w_member_social scope requires "Share on LinkedIn" product approval
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: LINKEDIN_CLIENT_ID,
        redirect_uri: LINKEDIN_REDIRECT_URI,
        state,
        scope: 'openid profile email w_member_social', // w_member_social requires "Share on LinkedIn" product
      })

      redirectUrl = `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`
    } else if (platform === 'twitter') {
      if (!TWITTER_CLIENT_ID) {
        return NextResponse.json(
          { error: 'Twitter/X OAuth not configured. Please set TWITTER_CLIENT_ID environment variable.' },
          { status: 500 }
        )
      }

      // Twitter OAuth 2.0 authorization URL
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: TWITTER_CLIENT_ID,
        redirect_uri: TWITTER_REDIRECT_URI,
        state,
        scope: 'tweet.read tweet.write users.read offline.access', // Required scopes for posting
        code_challenge: state, // Simplified PKCE (in production, use proper PKCE)
        code_challenge_method: 'plain',
      })

      redirectUrl = `https://twitter.com/i/oauth2/authorize?${params.toString()}`
    } else {
      return NextResponse.json(
        { error: `Unsupported platform: ${platform}` },
        { status: 400 }
      )
    }

    return NextResponse.json({
      redirectUrl,
      platform,
    })
  } catch (error) {
    console.error('Error initiating OAuth flow:', error)
    return NextResponse.json(
      { error: 'Failed to initiate OAuth flow' },
      { status: 500 }
    )
  }
}

// DELETE /api/social/[platform] - Disconnect platform
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const authResult = await auth()
    const clerkId = authResult.userId

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { platform } = context.params

    if (!VALID_PLATFORMS.includes(platform)) {
      return NextResponse.json(
        { error: `Invalid platform. Must be one of: ${VALID_PLATFORMS.join(', ')}` },
        { status: 400 }
      )
    }

    const user = await getOrCreateUser(clerkId)

    // Find and delete the connection
    const connection = await prisma.socialConnection.findUnique({
      where: {
        userId_platform: {
          userId: user.id,
          platform,
        },
      },
    })

    if (!connection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      )
    }

    await prisma.socialConnection.delete({
      where: { id: connection.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error disconnecting platform:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect platform' },
      { status: 500 }
    )
  }
}

