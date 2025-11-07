import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { encrypt } from '@/lib/encryption'

// Valid platform names
const VALID_PLATFORMS = ['linkedin', 'twitter']

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

// GET /api/social/[platform]/callback - Handle OAuth callback
export async function GET(
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

    // Get OAuth parameters from query string
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(
        new URL(`/settings?error=${encodeURIComponent(error)}`, request.url)
      )
    }

    if (!code || !state) {
      return NextResponse.json(
        { error: 'Missing OAuth parameters' },
        { status: 400 }
      )
    }

    // TODO: Implement OAuth token exchange
    // For now, return a placeholder response
    // In production, this would:
    // 1. Verify state token matches stored value
    // 2. Exchange authorization code for access token
    // 3. Fetch user profile from platform API
    // 4. Store encrypted tokens in database
    
    const user = await getOrCreateUser(clerkId)

    // Placeholder: In production, use real OAuth tokens
    const accessToken = 'placeholder_access_token'
    const refreshToken = 'placeholder_refresh_token'
    const platformUserId = 'placeholder_user_id'
    const platformUsername = 'placeholder_username'

    // Check if connection already exists
    const existingConnection = await prisma.socialConnection.findUnique({
      where: {
        userId_platform: {
          userId: user.id,
          platform,
        },
      },
    })

    if (existingConnection) {
      // Update existing connection
      await prisma.socialConnection.update({
        where: { id: existingConnection.id },
        data: {
          accessToken: encrypt(accessToken),
          refreshToken: refreshToken ? encrypt(refreshToken) : null,
          platformUserId,
          platformUsername,
          isActive: true,
          lastUsed: new Date(),
        },
      })
    } else {
      // Create new connection
      await prisma.socialConnection.create({
        data: {
          userId: user.id,
          platform,
          accessToken: encrypt(accessToken),
          refreshToken: refreshToken ? encrypt(refreshToken) : null,
          platformUserId,
          platformUsername,
          isActive: true,
          lastUsed: new Date(),
        },
      })
    }

    // Redirect back to settings page
    return NextResponse.redirect(
      new URL('/settings?connected=true', request.url)
    )
  } catch (error) {
    console.error('Error handling OAuth callback:', error)
    return NextResponse.redirect(
      new URL('/settings?error=oauth_failed', request.url)
    )
  }
}

