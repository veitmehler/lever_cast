import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { encrypt } from '@/lib/encryption'
import { verifyOAuthState } from '@/lib/oauth'

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

    const { platform } = await context.params

    if (!VALID_PLATFORMS.includes(platform)) {
      return NextResponse.json(
        { error: `Invalid platform. Must be one of: ${VALID_PLATFORMS.join(', ')}` },
        { status: 400 }
      )
    }

    const stateCookieName = `oauth_state_${platform}`
    let stateCookieData: { state: string; codeVerifier?: string } | null = null
    const stateCookieValue = request.cookies.get(stateCookieName)?.value
    if (stateCookieValue) {
      try {
        stateCookieData = JSON.parse(stateCookieValue)
      } catch (cookieError) {
        console.warn('Failed to parse OAuth state cookie:', cookieError)
      }
    }

    const redirectWithCleanup = (relativePath: string) => {
      const response = NextResponse.redirect(new URL(relativePath, request.url))
      response.cookies.delete(stateCookieName)
      return response
    }

    // Get OAuth parameters from query string
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      // Handle specific LinkedIn scope errors gracefully
      const errorDescription = searchParams.get('error_description') || ''
      if (error === 'unauthorized_scope_error' && errorDescription.includes('r_member_social')) {
        // r_member_social is not approved yet - redirect with a helpful message
        return redirectWithCleanup(`/settings?error=scope_not_approved&scope=r_member_social&message=${encodeURIComponent('The r_member_social permission is required for analytics but is not yet approved for your LinkedIn app. Please request this permission in your LinkedIn Developer Portal.')}`)
      }
      return redirectWithCleanup(`/settings?error=${encodeURIComponent(error)}${errorDescription ? '&error_description=' + encodeURIComponent(errorDescription) : ''}`)
    }

    if (!code || !state) {
      return NextResponse.json(
        { error: 'Missing OAuth parameters' },
        { status: 400 }
      )
    }

    // Verify state token
    let stateVerification = verifyOAuthState(state, clerkId, platform)

    if (!stateVerification.valid && stateCookieData?.state === state) {
      stateVerification = {
        valid: true,
        codeVerifier: stateCookieData.codeVerifier,
      }
    }

    if (!stateVerification.valid) {
      return redirectWithCleanup('/settings?error=invalid_state')
    }

    const user = await getOrCreateUser(clerkId)

    let accessToken: string
    let refreshToken: string | null = null
    let tokenExpiry: Date | null = null
    let platformUserId: string
    let platformUsername: string

    // Exchange authorization code for access token
    if (platform === 'linkedin') {
      if (!LINKEDIN_CLIENT_ID || !LINKEDIN_CLIENT_SECRET) {
        return redirectWithCleanup('/settings?error=oauth_not_configured')
      }

      // Exchange code for token
      const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: LINKEDIN_REDIRECT_URI,
          client_id: LINKEDIN_CLIENT_ID,
          client_secret: LINKEDIN_CLIENT_SECRET,
        }),
      })

      if (!tokenResponse.ok) {
        const error = await tokenResponse.json().catch(() => ({ error_description: 'Unknown error' }))
        console.error('LinkedIn token exchange error:', error)
        return redirectWithCleanup(`/settings?error=${encodeURIComponent(error.error_description || 'token_exchange_failed')}`)
      }

      const tokenData = await tokenResponse.json()
      console.log('[Twitter OAuth] Token exchange successful', {
        scope: tokenData.scope,
        expires_in: tokenData.expires_in,
        token_type: tokenData.token_type,
        usedCookieState: stateCookieData?.state === state,
      })
      accessToken = tokenData.access_token
      refreshToken = tokenData.refresh_token || null
      tokenExpiry = tokenData.expires_in 
        ? new Date(Date.now() + tokenData.expires_in * 1000)
        : null

      // Fetch user profile
      const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      if (!profileResponse.ok) {
        return redirectWithCleanup('/settings?error=profile_fetch_failed')
      }

      const profile = await profileResponse.json()
      platformUserId = profile.sub
      platformUsername = profile.name || profile.email || 'LinkedIn User'

    } else if (platform === 'twitter') {
      if (!TWITTER_CLIENT_ID || !TWITTER_CLIENT_SECRET) {
        return redirectWithCleanup('/settings?error=oauth_not_configured')
      }

      if (!stateVerification.codeVerifier) {
        console.error('Twitter OAuth callback missing codeVerifier for state')
        return redirectWithCleanup('/settings?error=invalid_state')
      }

      // Exchange code for token (Twitter uses Basic Auth)
      const basicAuth = Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString('base64')
      
      const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: TWITTER_REDIRECT_URI,
          code_verifier: stateVerification.codeVerifier,
        }),
      })

      if (!tokenResponse.ok) {
        const error = await tokenResponse.json().catch(() => ({ error_description: 'Unknown error' }))
        console.error('Twitter token exchange error:', error)
        return redirectWithCleanup(`/settings?error=${encodeURIComponent(error.error_description || 'token_exchange_failed')}`)
      }

      const tokenData = await tokenResponse.json()
      accessToken = tokenData.access_token
      refreshToken = tokenData.refresh_token || null
      tokenExpiry = tokenData.expires_in 
        ? new Date(Date.now() + tokenData.expires_in * 1000)
        : null

      // Fetch user profile
      const profileResponse = await fetch('https://api.twitter.com/2/users/me?user.fields=username,name', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      if (!profileResponse.ok) {
        return redirectWithCleanup('/settings?error=profile_fetch_failed')
      }

      const profile = await profileResponse.json()
      platformUserId = profile.data.id
      platformUsername = profile.data.username || profile.data.name || 'Twitter User'

    } else {
      return NextResponse.json(
        { error: `Unsupported platform: ${platform}` },
        { status: 400 }
      )
    }

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
          tokenExpiry: tokenExpiry,
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
          tokenExpiry: tokenExpiry,
          platformUserId,
          platformUsername,
          isActive: true,
          lastUsed: new Date(),
        },
      })
    }

    // Redirect back to settings page
    return redirectWithCleanup('/settings?connected=true')
  } catch (error) {
    console.error('Error handling OAuth callback:', error)
    const response = NextResponse.redirect(new URL('/settings?error=oauth_failed', request.url))
    response.cookies.delete('oauth_state_twitter')
    response.cookies.delete('oauth_state_linkedin')
    return response
  }
}

