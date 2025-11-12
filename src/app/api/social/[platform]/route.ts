import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { encrypt, decrypt } from '@/lib/encryption'
import { generateOAuthState } from '@/lib/oauth'
import { createHash } from 'crypto'

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
  params: Promise<{
    platform: string
  }>
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

    const { platform } = await context.params

    if (!VALID_PLATFORMS.includes(platform)) {
      return NextResponse.json(
        { error: `Invalid platform. Must be one of: ${VALID_PLATFORMS.join(', ')}` },
        { status: 400 }
      )
    }

    // Generate OAuth state token
    const { state, codeVerifier } = generateOAuthState(clerkId, platform)

    let redirectUrl: string

    if (platform === 'linkedin') {
      if (!LINKEDIN_CLIENT_ID) {
        return NextResponse.json(
          { error: 'LinkedIn OAuth not configured. Please set LINKEDIN_CLIENT_ID environment variable.' },
          { status: 500 }
        )
      }

      // LinkedIn OAuth 2.0 authorization URL
      // Note: 
      // - w_member_social scope requires "Share on LinkedIn" product approval (for posting)
      // - r_member_social scope is required for reading posts and analytics, BUT:
      //   LinkedIn has currently restricted access to r_member_social and is not accepting new requests
      //   See: https://stackoverflow.com/questions/79774322/r-member-social-scope-permission-in-linkedin-api
      //   Analytics will not be available until LinkedIn reopens access to this permission
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: LINKEDIN_CLIENT_ID,
        redirect_uri: LINKEDIN_REDIRECT_URI,
        state,
        scope: 'openid profile email w_member_social', // r_member_social not available - LinkedIn has restricted access
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
      const codeChallenge = createHash('sha256')
        .update(codeVerifier)
        .digest('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: TWITTER_CLIENT_ID,
        redirect_uri: TWITTER_REDIRECT_URI,
        state,
        scope: 'tweet.read tweet.write users.read offline.access media.write', // Required scopes for posting and media uploads
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
      })

      redirectUrl = `https://twitter.com/i/oauth2/authorize?${params.toString()}`
    } else {
      return NextResponse.json(
        { error: `Unsupported platform: ${platform}` },
        { status: 400 }
      )
    }

    const response = NextResponse.json({
      redirectUrl,
      platform,
    })

    try {
      const cookieName = `oauth_state_${platform}`
      const cookieData: { state: string; codeVerifier?: string } = { state }
      if (platform === 'twitter' && codeVerifier) {
        cookieData.codeVerifier = codeVerifier
      }

      response.cookies.set({
        name: cookieName,
        value: JSON.stringify(cookieData),
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 10 * 60, // 10 minutes
        path: '/',
      })
    } catch (cookieError) {
      console.warn('Failed to set OAuth state cookie:', cookieError)
    }

    return response
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

    const { platform } = await context.params

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

