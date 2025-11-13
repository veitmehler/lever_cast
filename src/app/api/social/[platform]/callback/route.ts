import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { encrypt } from '@/lib/encryption'
import { verifyOAuthState } from '@/lib/oauth'

// Valid platform names
const VALID_PLATFORMS = ['linkedin', 'twitter', 'facebook', 'instagram', 'threads']

// OAuth configuration
const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET
const LINKEDIN_REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI || 
  `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/social/linkedin/callback`

// LinkedIn Company Pages App (separate app for Community Management API)
const LINKEDIN_COMPANY_CLIENT_ID = process.env.LINKEDIN_COMPANY_CLIENT_ID
const LINKEDIN_COMPANY_CLIENT_SECRET = process.env.LINKEDIN_COMPANY_CLIENT_SECRET
// Note: Company callback uses same path but with ?target=company query param
const LINKEDIN_COMPANY_REDIRECT_URI = process.env.LINKEDIN_COMPANY_REDIRECT_URI || 
  `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/social/linkedin/callback?target=company`

const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET
const TWITTER_REDIRECT_URI = process.env.TWITTER_REDIRECT_URI || 
  `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/social/twitter/callback`

const FACEBOOK_CLIENT_ID = process.env.FACEBOOK_CLIENT_ID
const FACEBOOK_CLIENT_SECRET = process.env.FACEBOOK_CLIENT_SECRET
const FACEBOOK_REDIRECT_URI = process.env.FACEBOOK_REDIRECT_URI || 
  `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/social/facebook/callback`

const INSTAGRAM_CLIENT_ID = process.env.INSTAGRAM_CLIENT_ID || process.env.FACEBOOK_CLIENT_ID
const INSTAGRAM_CLIENT_SECRET = process.env.INSTAGRAM_CLIENT_SECRET || process.env.FACEBOOK_CLIENT_SECRET
const INSTAGRAM_REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI || 
  `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/social/instagram/callback`

const THREADS_CLIENT_ID = process.env.THREADS_CLIENT_ID || process.env.FACEBOOK_CLIENT_ID
const THREADS_CLIENT_SECRET = process.env.THREADS_CLIENT_SECRET || process.env.FACEBOOK_CLIENT_SECRET
const THREADS_REDIRECT_URI = process.env.THREADS_REDIRECT_URI || 
  `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/social/threads/callback`

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
    let stateCookieData: { state: string; codeVerifier?: string; target?: 'personal' | 'company' } | null = null
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
      
      // Handle w_organization_social scope error - this is optional for Company Pages
      // Users can still connect and post to personal profiles without it
      if (error === 'unauthorized_scope_error' && errorDescription.includes('w_organization_social')) {
        console.warn('[LinkedIn OAuth] w_organization_social scope not approved - connecting without Company Pages support')
        // Remove w_organization_social from scope and retry
        // We'll handle this by allowing connection without Company Pages
        return redirectWithCleanup(`/settings?error=w_organization_social_not_approved&message=${encodeURIComponent('LinkedIn Company Pages are not available. You can still connect and post to your personal profile. To enable Company Pages, request w_organization_social permission in your LinkedIn Developer Portal.')}`)
      }
      
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
      // Fallback to cookie data if state token not found (for Twitter PKCE)
      // Note: For LinkedIn, we should always have the state in the store, not cookies
      console.warn(`[OAuth Callback] State not found in store, using cookie fallback for ${platform}`)
      stateVerification = {
        valid: true,
        codeVerifier: stateCookieData.codeVerifier,
        target: stateCookieData.target as 'personal' | 'company' | undefined,
      }
    }

    if (!stateVerification.valid) {
      console.error(`[OAuth Callback] Invalid state token for ${platform}`, {
        state,
        clerkId,
        platform,
        cookieState: stateCookieData?.state,
      })
      return redirectWithCleanup('/settings?error=invalid_state')
    }
    
    // Get target type from state verification (for LinkedIn)
    const targetType = stateVerification.target
    console.log(`[OAuth Callback] State verified for ${platform}`, {
      targetType,
      hasTarget: targetType !== undefined,
      platform,
    })

    const user = await getOrCreateUser(clerkId)

    let accessToken: string
    let refreshToken: string | null = null
    let tokenExpiry: Date | null = null
    let platformUserId: string
    let platformUsername: string
let tokenData: any = null // Store token data for later use (especially for LinkedIn appType determination)
let isCompanyCallback: boolean = false // For LinkedIn: track if this is a company callback
let appTypeColumnAvailable: boolean | null = null // Track if social_connections.appType column exists (null = unknown)

function isAppTypeColumnError(error: any) {
  const message = error?.message || ''
  return (
    message.includes('Unknown argument `appType`') ||
    message.includes('no such column: appType') ||
    message.includes('column "appType" of relation "social_connections" does not exist') ||
    error?.code === 'P2001'
  )
}

    // Exchange authorization code for access token
    if (platform === 'linkedin') {
      // Determine if this is the company callback (from state token)
      isCompanyCallback = targetType === 'company'
      
      // Select appropriate app credentials
      const clientId = isCompanyCallback ? LINKEDIN_COMPANY_CLIENT_ID : LINKEDIN_CLIENT_ID
      const clientSecret = isCompanyCallback ? LINKEDIN_COMPANY_CLIENT_SECRET : LINKEDIN_CLIENT_SECRET
      const redirectUri = isCompanyCallback ? LINKEDIN_COMPANY_REDIRECT_URI : LINKEDIN_REDIRECT_URI
      
      if (!clientId || !clientSecret) {
        const appType = isCompanyCallback ? 'Company Pages' : 'Personal Profile'
        return redirectWithCleanup(`/settings?error=oauth_not_configured&message=${encodeURIComponent(`LinkedIn ${appType} OAuth not configured. Please set LINKEDIN${isCompanyCallback ? '_COMPANY' : ''}_CLIENT_ID and LINKEDIN${isCompanyCallback ? '_COMPANY' : ''}_CLIENT_SECRET environment variables.`)}`)
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
          redirect_uri: redirectUri,
          client_id: clientId,
          client_secret: clientSecret,
        }),
      })

      if (!tokenResponse.ok) {
        const error = await tokenResponse.json().catch(() => ({ error_description: 'Unknown error' }))
        console.error('LinkedIn token exchange error:', error)
        return redirectWithCleanup(`/settings?error=${encodeURIComponent(error.error_description || 'token_exchange_failed')}`)
      }

      tokenData = await tokenResponse.json()
      
      // Check scopes to determine app type
      const scopes = tokenData.scope?.split(' ') || []
      const hasOrganizationScope = scopes.includes('w_organization_social') || scopes.includes('rw_organization_admin')
      const appType = hasOrganizationScope ? 'company' : 'personal'
      
      console.log('[LinkedIn OAuth] Token exchange successful', {
        scope: tokenData.scope,
        scopes: scopes,
        appType: appType,
        isCompanyCallback: isCompanyCallback,
        targetType: targetType,
        expires_in: tokenData.expires_in,
        token_type: tokenData.token_type,
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

      tokenData = await tokenResponse.json()
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

    } else if (platform === 'facebook') {
      if (!FACEBOOK_CLIENT_ID || !FACEBOOK_CLIENT_SECRET) {
        return redirectWithCleanup('/settings?error=oauth_not_configured')
      }

      // Exchange code for token
      const tokenResponse = await fetch(
        `https://graph.facebook.com/v24.0/oauth/access_token?` +
        `client_id=${FACEBOOK_CLIENT_ID}&` +
        `client_secret=${FACEBOOK_CLIENT_SECRET}&` +
        `redirect_uri=${encodeURIComponent(FACEBOOK_REDIRECT_URI)}&` +
        `code=${code}`,
        {
          method: 'GET',
        }
      )

      if (!tokenResponse.ok) {
        const error = await tokenResponse.json().catch(() => ({ error: { message: 'Unknown error' } }))
        console.error('Facebook token exchange error:', error)
        return redirectWithCleanup(`/settings?error=${encodeURIComponent(error.error?.message || 'token_exchange_failed')}`)
      }

      const tokenData = await tokenResponse.json()
      console.log('[Facebook OAuth] Token exchange successful (short-lived)', {
        expires_in: tokenData.expires_in,
        token_type: tokenData.token_type,
      })
      
      // Exchange short-lived token (1 hour) for long-lived token (60 days)
      const shortLivedToken = tokenData.access_token
      const longLivedTokenResponse = await fetch(
        `https://graph.facebook.com/v24.0/oauth/access_token?` +
        `grant_type=fb_exchange_token&` +
        `client_id=${FACEBOOK_CLIENT_ID}&` +
        `client_secret=${FACEBOOK_CLIENT_SECRET}&` +
        `fb_exchange_token=${shortLivedToken}`
      )

      if (longLivedTokenResponse.ok) {
        const longLivedTokenData = await longLivedTokenResponse.json()
        accessToken = longLivedTokenData.access_token
        const expiresIn = longLivedTokenData.expires_in || 5184000 // Default to 60 days (in seconds) if not provided
        tokenExpiry = new Date(Date.now() + expiresIn * 1000)
        console.log('[Facebook OAuth] Long-lived token obtained', {
          expires_in: expiresIn,
          expires_at: tokenExpiry.toISOString(),
        })
      } else {
        // Fallback to short-lived token if exchange fails
        const errorText = await longLivedTokenResponse.text()
        console.warn('[Facebook OAuth] Failed to exchange for long-lived token, using short-lived token', {
          status: longLivedTokenResponse.status,
          error: errorText,
        })
        accessToken = shortLivedToken
        tokenExpiry = tokenData.expires_in 
          ? new Date(Date.now() + tokenData.expires_in * 1000)
          : null
      }
      
      // Facebook tokens don't have refresh tokens in the same way
      refreshToken = null

      // Fetch user profile
      const profileResponse = await fetch(
        `https://graph.facebook.com/v24.0/me?fields=id,name&access_token=${accessToken}`
      )

      if (!profileResponse.ok) {
        return redirectWithCleanup('/settings?error=profile_fetch_failed')
      }

      const profile = await profileResponse.json()
      platformUserId = profile.id
      platformUsername = profile.name || 'Facebook User'

    } else if (platform === 'instagram') {
      if (!INSTAGRAM_CLIENT_ID || !INSTAGRAM_CLIENT_SECRET) {
        return redirectWithCleanup('/settings?error=oauth_not_configured')
      }

      // Instagram uses Facebook OAuth (same flow)
      const tokenResponse = await fetch(
        `https://graph.facebook.com/v24.0/oauth/access_token?` +
        `client_id=${INSTAGRAM_CLIENT_ID}&` +
        `client_secret=${INSTAGRAM_CLIENT_SECRET}&` +
        `redirect_uri=${encodeURIComponent(INSTAGRAM_REDIRECT_URI)}&` +
        `code=${code}`,
        {
          method: 'GET',
        }
      )

      if (!tokenResponse.ok) {
        const error = await tokenResponse.json().catch(() => ({ error: { message: 'Unknown error' } }))
        console.error('Instagram token exchange error:', error)
        return redirectWithCleanup(`/settings?error=${encodeURIComponent(error.error?.message || 'token_exchange_failed')}`)
      }

      const tokenData = await tokenResponse.json()
      console.log('[Instagram OAuth] Token exchange successful', {
        expires_in: tokenData.expires_in,
        token_type: tokenData.token_type,
      })
      accessToken = tokenData.access_token
      refreshToken = null
      tokenExpiry = tokenData.expires_in 
        ? new Date(Date.now() + tokenData.expires_in * 1000)
        : null

      // Fetch Instagram Business Account info
      // First get pages to find Instagram account
      const pagesResponse = await fetch(
        `https://graph.facebook.com/v24.0/me/accounts?access_token=${accessToken}&fields=instagram_business_account`
      )

      if (!pagesResponse.ok) {
        return redirectWithCleanup('/settings?error=profile_fetch_failed')
      }

      const pagesData = await pagesResponse.json()
      const page = pagesData.data?.find((p: any) => p.instagram_business_account)
      
      if (!page?.instagram_business_account) {
        return redirectWithCleanup('/settings?error=no_instagram_account')
      }

      const igAccountResponse = await fetch(
        `https://graph.facebook.com/v24.0/${page.instagram_business_account.id}?access_token=${accessToken}&fields=id,username`
      )

      if (!igAccountResponse.ok) {
        return redirectWithCleanup('/settings?error=profile_fetch_failed')
      }

      const igAccount = await igAccountResponse.json()
      platformUserId = igAccount.id
      platformUsername = igAccount.username || 'Instagram User'

    } else if (platform === 'threads') {
      if (!THREADS_CLIENT_ID || !THREADS_CLIENT_SECRET) {
        return redirectWithCleanup('/settings?error=oauth_not_configured')
      }

      // Threads uses Facebook OAuth (same flow as Instagram)
      const tokenResponse = await fetch(
        `https://graph.facebook.com/v24.0/oauth/access_token?` +
        `client_id=${THREADS_CLIENT_ID}&` +
        `client_secret=${THREADS_CLIENT_SECRET}&` +
        `redirect_uri=${encodeURIComponent(THREADS_REDIRECT_URI)}&` +
        `code=${code}`,
        {
          method: 'GET',
        }
      )

      if (!tokenResponse.ok) {
        const error = await tokenResponse.json().catch(() => ({ error: { message: 'Unknown error' } }))
        console.error('Threads token exchange error:', error)
        return redirectWithCleanup(`/settings?error=${encodeURIComponent(error.error?.message || 'token_exchange_failed')}`)
      }

      const tokenData = await tokenResponse.json()
      console.log('[Threads OAuth] Token exchange successful', {
        expires_in: tokenData.expires_in,
        token_type: tokenData.token_type,
      })
      accessToken = tokenData.access_token
      refreshToken = null
      tokenExpiry = tokenData.expires_in 
        ? new Date(Date.now() + tokenData.expires_in * 1000)
        : null

      // Fetch Threads account info (similar to Instagram)
      const pagesResponse = await fetch(
        `https://graph.facebook.com/v24.0/me/accounts?access_token=${accessToken}&fields=instagram_business_account`
      )

      if (!pagesResponse.ok) {
        return redirectWithCleanup('/settings?error=profile_fetch_failed')
      }

      const pagesData = await pagesResponse.json()
      const page = pagesData.data?.find((p: any) => p.instagram_business_account)
      
      if (!page?.instagram_business_account) {
        return redirectWithCleanup('/settings?error=no_threads_account')
      }

      const threadsAccountResponse = await fetch(
        `https://graph.facebook.com/v24.0/${page.instagram_business_account.id}?access_token=${accessToken}&fields=id,username`
      )

      if (!threadsAccountResponse.ok) {
        return redirectWithCleanup('/settings?error=profile_fetch_failed')
      }

      const threadsAccount = await threadsAccountResponse.json()
      platformUserId = threadsAccount.id
      platformUsername = threadsAccount.username || 'Threads User'

    } else {
      return NextResponse.json(
        { error: `Unsupported platform: ${platform}` },
        { status: 400 }
      )
    }

    // For LinkedIn, determine app type from scopes or targetType
    // For other platforms, appType is null
    let connectionAppType: 'personal' | 'company' | null = null
    if (platform === 'linkedin') {
      const scopes = tokenData?.scope?.split(' ') || []
      const hasOrganizationScope = scopes.includes('w_organization_social') || scopes.includes('r_organization_admin')
      // Use targetType from state, or determine from scopes
      connectionAppType = targetType === 'company' || hasOrganizationScope ? 'company' : 'personal'
      
      console.log('[LinkedIn OAuth] Determining app type', {
        targetType,
        isCompanyCallback,
        scopes: scopes,
        hasOrganizationScope,
        connectionAppType,
      })
    }
    
    // Check if connection already exists (for LinkedIn, check by appType)
    // Handle case where unique constraint doesn't exist yet (before migration)
    let existingConnection = null
    try {
      existingConnection = await (prisma.socialConnection.findUnique as any)({
        where: {
          userId_platform_appType: {
            userId: user.id,
            platform,
            appType: connectionAppType,
          },
        },
      })
      appTypeColumnAvailable = true
    } catch (error: any) {
      // If unique constraint doesn't exist yet, use findFirst
      if (error.message?.includes('userId_platform_appType') || 
          error.message?.includes('Unknown argument') ||
          error.code === 'P2009') {
        // Don't include appType in where clause - column doesn't exist yet
        // After migration, appType will be handled by the unique constraint above
        appTypeColumnAvailable = false
        const whereClause: any = {
          userId: user.id,
          platform,
        }
        // Note: Before migration, this will return the first connection for this platform
        // After migration, the unique constraint will handle appType filtering
        existingConnection = await prisma.socialConnection.findFirst({
          where: whereClause,
        })
      } else {
        throw error
      }
    }

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
      const createData = {
        userId: user.id,
        platform,
        appType: connectionAppType,
        accessToken: encrypt(accessToken),
        refreshToken: refreshToken ? encrypt(refreshToken) : null,
        tokenExpiry: tokenExpiry,
        platformUserId,
        platformUsername,
        isActive: true,
        lastUsed: new Date(),
      }

      try {
        if (appTypeColumnAvailable === false) {
          const { appType: _appType, ...legacyData } = createData
          await prisma.socialConnection.create({
            data: legacyData,
          })
        } else {
          await prisma.socialConnection.create({
            data: createData,
          })
          appTypeColumnAvailable = true
        }
      } catch (createError: any) {
        if (isAppTypeColumnError(createError)) {
          console.warn('[LinkedIn OAuth] appType column not available, creating connection without appType (migration not applied yet)')
          appTypeColumnAvailable = false
          const { appType: _appType, ...legacyData } = createData
          await prisma.socialConnection.create({
            data: legacyData,
          })
        } else {
          throw createError
        }
      }
    }
    
    // Log connection details for debugging
    if (platform === 'linkedin') {
      const scopes = tokenData?.scope?.split(' ') || []
      const hasOrganizationScope = scopes.includes('w_organization_social') || scopes.includes('r_organization_admin')
      console.log('[LinkedIn OAuth] Connection saved', {
        appType: connectionAppType,
        scopes: scopes,
        hasOrganizationScope,
        targetType,
        isCompanyCallback,
      })
    }

    // Redirect back to settings page
    return redirectWithCleanup('/settings?connected=true')
  } catch (error) {
    console.error('Error handling OAuth callback:', error)
    const response = NextResponse.redirect(new URL('/settings?error=oauth_failed', request.url))
    response.cookies.delete('oauth_state_twitter')
    response.cookies.delete('oauth_state_linkedin')
    response.cookies.delete('oauth_state_facebook')
    response.cookies.delete('oauth_state_instagram')
    response.cookies.delete('oauth_state_threads')
    return response
  }
}

