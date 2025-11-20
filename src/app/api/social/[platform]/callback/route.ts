import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { encrypt, decrypt } from '@/lib/encryption'
import { verifyOAuthState } from '@/lib/oauth'
import { fetchInstagramUsername as fetchInstagramUsernameUtil } from '@/lib/instagramUsername'

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

// Threads requires its own Client ID and Secret (separate from Facebook)
// Threads OAuth REQUIRES HTTPS - cannot use HTTP even for localhost
const THREADS_CLIENT_ID = process.env.THREADS_CLIENT_ID
const THREADS_CLIENT_SECRET = process.env.THREADS_CLIENT_SECRET
// For local development, you must use an HTTPS URL (e.g., ngrok: https://your-domain.ngrok.io)
const getThreadsRedirectUri = () => {
  if (process.env.THREADS_REDIRECT_URI) {
    return process.env.THREADS_REDIRECT_URI
  }
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  if (baseUrl.startsWith('https://')) {
    return `${baseUrl}/api/social/threads/callback`
  }
  return `${baseUrl}/api/social/threads/callback`
}
const THREADS_REDIRECT_URI = getThreadsRedirectUri()

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
interface TokenData {
  access_token?: string
  refresh_token?: string
  expires_in?: number
  token_type?: string
  [key: string]: unknown
}

interface PrismaError extends Error {
  code?: string
  message: string
}

interface RequestWithInstagramParams extends Request {
  __instagramFetchParams?: {
    userAccessToken: string | null
    pageAccessToken: string
    instagramAccountId: string
  }
}

let tokenData: TokenData | null = null // Store token data for later use (especially for LinkedIn appType determination)
let isCompanyCallback: boolean = false // For LinkedIn: track if this is a company callback
let appTypeColumnAvailable: boolean | null = null // Track if social_connections.appType column exists (null = unknown)

function isAppTypeColumnError(error: unknown): boolean {
  const prismaError = error as PrismaError
  const message = prismaError?.message || ''
  return (
    message.includes('Unknown argument `appType`') ||
    message.includes('no such column: appType') ||
    message.includes('column "appType" of relation "social_connections" does not exist') ||
    prismaError?.code === 'P2001'
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
      const scopes = (tokenData?.scope as string)?.split(' ') || []
      const hasOrganizationScope = scopes.includes('w_organization_social') || scopes.includes('rw_organization_admin')
      const appType = hasOrganizationScope ? 'company' : 'personal'
      
      console.log('[LinkedIn OAuth] Token exchange successful', {
        scope: tokenData?.scope,
        scopes: scopes,
        appType: appType,
        isCompanyCallback: isCompanyCallback,
        targetType: targetType,
        expires_in: tokenData?.expires_in,
        token_type: tokenData?.token_type,
      })
      
      if (!tokenData?.access_token) throw new Error('No access token received')
      accessToken = tokenData.access_token
      refreshToken = tokenData?.refresh_token || null
      tokenExpiry = tokenData?.expires_in 
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
      if (!tokenData?.access_token) throw new Error('No access token received')
      accessToken = tokenData.access_token
      refreshToken = tokenData?.refresh_token || null
      tokenExpiry = tokenData?.expires_in 
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
      console.log('[Instagram OAuth] Token exchange successful (user token)', {
        expires_in: tokenData.expires_in,
        token_type: tokenData.token_type,
      })
      
      // Exchange short-lived user token for long-lived token (60 days)
      const shortLivedUserToken = tokenData.access_token
      const longLivedUserTokenResponse = await fetch(
        `https://graph.facebook.com/v24.0/oauth/access_token?` +
        `grant_type=fb_exchange_token&` +
        `client_id=${INSTAGRAM_CLIENT_ID}&` +
        `client_secret=${INSTAGRAM_CLIENT_SECRET}&` +
        `fb_exchange_token=${shortLivedUserToken}`
      )

      let userAccessToken = shortLivedUserToken
      if (longLivedUserTokenResponse.ok) {
        const longLivedTokenData = await longLivedUserTokenResponse.json()
        userAccessToken = longLivedTokenData.access_token
        const expiresIn = longLivedTokenData.expires_in || 5184000 // Default to 60 days
        tokenExpiry = new Date(Date.now() + expiresIn * 1000)
        console.log('[Instagram OAuth] Long-lived user token obtained', {
          expires_in: expiresIn,
          expires_at: tokenExpiry.toISOString(),
        })
      } else {
        tokenExpiry = tokenData.expires_in 
          ? new Date(Date.now() + tokenData.expires_in * 1000)
          : null
      }

      // Fetch pages with Instagram Business Account field
      // Try fetching with user token first to see if instagram_business_account is returned
      // Note: account_type is not available in nested queries, only id and username
      const pagesResponse = await fetch(
        `https://graph.facebook.com/v24.0/me/accounts?access_token=${userAccessToken}&fields=id,name,access_token,instagram_business_account{id,username}`
      )

      if (!pagesResponse.ok) {
        const errorText = await pagesResponse.text()
        console.error('[Instagram OAuth] Failed to fetch pages:', {
          status: pagesResponse.status,
          error: errorText,
        })
        return redirectWithCleanup('/settings?error=profile_fetch_failed')
      }

      const pagesData = await pagesResponse.json()
      const pages = pagesData.data || []
      
      interface FacebookPage {
        id: string
        name: string
        access_token?: string
        instagram_business_account?: {
          id: string
          username?: string
        }
      }

      console.log('[Instagram OAuth] Found pages:', pages.map((p: FacebookPage) => ({ 
        id: p.id, 
        name: p.name,
        has_instagram: !!p.instagram_business_account,
        instagram_id: p.instagram_business_account?.id,
      })))
      
      // Try to find page with Instagram account from initial fetch
      let pageWithInstagram = pages.find((p: FacebookPage) => p.instagram_business_account)
      let pageAccessToken: string | null = null
      
      // If not found in initial fetch, check each page individually with Page access token
      if (!pageWithInstagram) {
        console.log('[Instagram OAuth] Instagram account not found in initial fetch, checking pages individually...')
        
        for (const page of pages) {
          if (!page.access_token) {
            console.warn(`[Instagram OAuth] Page ${page.id} has no access token, skipping`)
            continue
          }
          
          // Try multiple approaches to find Instagram account
          // Approach 1: Query page directly with Page access token
          const pageCheckResponse = await fetch(
            `https://graph.facebook.com/v24.0/${page.id}?access_token=${page.access_token}&fields=id,name,instagram_business_account{id,username}`
          )
          
          if (pageCheckResponse.ok) {
            const pageInfo = await pageCheckResponse.json()
            console.log(`[Instagram OAuth] Checking page ${page.id} (${page.name}):`, {
              has_instagram: !!pageInfo.instagram_business_account,
              instagram_id: pageInfo.instagram_business_account?.id,
              instagram_username: pageInfo.instagram_business_account?.username,
            })
            
            if (pageInfo.instagram_business_account) {
              pageWithInstagram = pageInfo
              pageAccessToken = page.access_token
              break
            }
          } else {
            const errorText = await pageCheckResponse.text()
            console.warn(`[Instagram OAuth] Failed to check page ${page.id}:`, {
              status: pageCheckResponse.status,
              error: errorText,
            })
          }
          
          // Approach 2: Try querying Instagram accounts directly via /me/accounts with Page token
          // This might work if the Page token has Instagram permissions
          if (!pageWithInstagram) {
              const igAccountsResponse = await fetch(
                `https://graph.facebook.com/v24.0/me/accounts?access_token=${page.access_token}&fields=id,name,instagram_business_account{id,username}`
              )
            
            if (igAccountsResponse.ok) {
              const igAccountsData = await igAccountsResponse.json() as { data?: FacebookPage[] }
              const pageWithIg = igAccountsData.data?.find((p: FacebookPage) => p.id === page.id && p.instagram_business_account)
              if (pageWithIg) {
                console.log(`[Instagram OAuth] Found Instagram account via /me/accounts with Page token for page ${page.id}`)
                pageWithInstagram = pageWithIg
                pageAccessToken = page.access_token
                break
              }
            }
          }
        }
      } else {
        // Found Instagram account in initial fetch, use that page's access token
        pageAccessToken = pageWithInstagram.access_token
      }
      
      // Check granular scopes to find Instagram account ID directly
      // Meta's granular scopes grant instagram_content_publish to specific Instagram account IDs
      const debugTokenResponse = await fetch(
        `https://graph.facebook.com/v24.0/debug_token?input_token=${userAccessToken}&access_token=${INSTAGRAM_CLIENT_ID}|${INSTAGRAM_CLIENT_SECRET}`
      )
      
      interface GranularScope {
        scope: string
        target_ids?: string[]
      }

      interface DebugTokenData {
        data?: {
          granular_scopes?: GranularScope[]
          scopes?: string[]
        }
      }

      let instagramAccountId: string | null = null
      let debugData: DebugTokenData | null = null
      
      if (debugTokenResponse.ok) {
        debugData = await debugTokenResponse.json() as DebugTokenData
        const granularScopes = debugData.data?.granular_scopes || []
        
        // Find instagram_content_publish granular scope to get Instagram account ID
        const instagramScope = granularScopes.find((scope: GranularScope) => scope.scope === 'instagram_content_publish')
        if (instagramScope?.target_ids && instagramScope.target_ids.length > 0) {
          instagramAccountId = instagramScope.target_ids[0]
          console.log('[Instagram OAuth] Found Instagram account ID from granular scopes:', instagramAccountId)
        }
      }
      
      // If we found Instagram account ID from granular scopes, use it directly
      // Meta's granular scopes grant instagram_content_publish to this specific Instagram account
      // Even if we can't query the account details immediately, we can create the connection
      if (instagramAccountId && !pageWithInstagram?.instagram_business_account && pages.length > 0) {
        console.log('[Instagram OAuth] Using Instagram account ID from granular scopes directly')
        
        interface InstagramAccountDetails {
          id: string
          username?: string
          account_type?: string
        }

        // Use the first page's access token (should work for Instagram API)
        const firstPage = pages[0]
        if (firstPage.access_token) {
          // Try to get Instagram account details using the Page token
          // If this fails, we'll still create the connection with the ID we have
          let igAccountDetails: InstagramAccountDetails = {
            id: instagramAccountId,
            username: 'Instagram User', // Default, will be updated when we can query it
            account_type: 'BUSINESS',
          }
          
          // Try multiple ways to get Instagram account details
          // Method 1: Try querying via Page's instagram_business_account field
          const pageWithIgResponse = await fetch(
            `https://graph.facebook.com/v24.0/${firstPage.id}?access_token=${firstPage.access_token}&fields=instagram_business_account{id,username}`
          )
          
          if (pageWithIgResponse.ok) {
            const pageData = await pageWithIgResponse.json()
            if (pageData.instagram_business_account && pageData.instagram_business_account.id === instagramAccountId) {
              igAccountDetails = pageData.instagram_business_account
              console.log('[Instagram OAuth] Got Instagram account details via Page field:', igAccountDetails)
            }
          }
          
          // Method 2: Try querying Instagram account directly (might work with Page token)
          if (igAccountDetails.username === 'Instagram User') {
            const igDirectResponse = await fetch(
              `https://graph.facebook.com/v24.0/${instagramAccountId}?access_token=${firstPage.access_token}&fields=id,username,account_type`
            )
            
            if (igDirectResponse.ok) {
              igAccountDetails = await igDirectResponse.json()
              console.log('[Instagram OAuth] Got Instagram account details via direct query:', igAccountDetails)
            } else {
              console.log('[Instagram OAuth] Cannot query Instagram account details directly, using ID from granular scopes')
              // We'll use the ID we have - the username can be fetched later when posting
            }
          }
          
          // Create connection with Instagram account (even if we don't have full details)
          pageWithInstagram = {
            id: firstPage.id,
            name: firstPage.name,
            instagram_business_account: igAccountDetails,
          }
          pageAccessToken = firstPage.access_token
          console.log('[Instagram OAuth] Creating connection with Instagram account ID:', instagramAccountId)
        }
      }
      
      if (!pageWithInstagram?.instagram_business_account || !pageAccessToken) {
        console.error('[Instagram OAuth] No Instagram account found on any page. Checked pages:', pages.map((p: FacebookPage) => ({ id: p.id, name: p.name })))
        
        // Check if user token has instagram_content_publish permission
        if (debugData) {
          const permissions = debugData.data?.scopes || []
          const hasInstagramPublish = permissions.includes('instagram_content_publish')
          
          console.log('[Instagram OAuth] Token permissions:', permissions)
          
          if (!hasInstagramPublish) {
            console.error('[Instagram OAuth] Missing instagram_content_publish permission. This requires App Review.')
            return redirectWithCleanup('/settings?error=instagram_permission_required')
          }
        }
        
        return redirectWithCleanup('/settings?error=no_instagram_account')
      }

      // Store Page access token (Instagram API requires Page token, not user token)
      // But also store user token in refreshToken field (since Instagram doesn't use refresh tokens)
      // We need user token to fetch username via /me/accounts
      accessToken = pageAccessToken
      refreshToken = userAccessToken // Store user token here for username fetching
      // Note: Page tokens don't expire the same way, but we'll use the user token expiry as reference

      // Get Instagram account details (may already be in pageWithInstagram.instagram_business_account)
      const igAccount = pageWithInstagram.instagram_business_account
      
      if (!igAccount.id) {
        // If we don't have full Instagram account info, fetch it
        const igAccountResponse = await fetch(
          `https://graph.facebook.com/v24.0/${igAccount.id}?access_token=${pageAccessToken}&fields=id,username,account_type`
        )

        if (!igAccountResponse.ok) {
          const errorText = await igAccountResponse.text()
          console.error('[Instagram OAuth] Failed to fetch Instagram account:', {
            status: igAccountResponse.status,
            error: errorText,
          })
          return redirectWithCleanup('/settings?error=profile_fetch_failed')
        }

        const fetchedIgAccount = await igAccountResponse.json()
        platformUserId = fetchedIgAccount.id
        platformUsername = fetchedIgAccount.username || 'Instagram User'
      } else {
        platformUserId = igAccount.id
        platformUsername = igAccount.username || 'Instagram User'
      }
      
      console.log('[Instagram OAuth] Instagram account found:', {
        id: platformUserId,
        username: platformUsername,
        account_type: igAccount.account_type,
        page_id: pageWithInstagram.id,
        page_name: pageWithInstagram.name,
      })
      
      interface InstagramFetchParams {
        userId: string
        instagramAccountId: string
        pageAccessToken: string
        userAccessToken: string
      }

      interface RequestWithInstagramParams extends Request {
        __instagramFetchParams?: InstagramFetchParams
      }

      // Store parameters for background username fetch (if username is still default)
      // Store on request object so it's available after connection is saved
      if (!platformUsername || platformUsername === 'Instagram User') {
        (request as RequestWithInstagramParams).__instagramFetchParams = {
          userId: user.id,
          instagramAccountId: platformUserId,
          pageAccessToken: pageAccessToken,
          userAccessToken: userAccessToken, // Store user token for fetching pages
        }
      }

    } else if (platform === 'threads') {
      if (!THREADS_CLIENT_ID || !THREADS_CLIENT_SECRET) {
        return redirectWithCleanup('/settings?error=oauth_not_configured')
      }

      // Threads OAuth uses its own domain: graph.threads.net (not graph.facebook.com)
      // Exchange authorization code for access token
      const tokenResponse = await fetch(
        `https://graph.threads.net/oauth/access_token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: THREADS_CLIENT_ID,
            client_secret: THREADS_CLIENT_SECRET,
            code: code,
            grant_type: 'authorization_code',
            redirect_uri: THREADS_REDIRECT_URI,
          }),
        }
      )

      if (!tokenResponse.ok) {
        const error = await tokenResponse.json().catch(() => ({ error: { message: 'Unknown error' } }))
        console.error('[Threads OAuth] Token exchange error:', error)
        return redirectWithCleanup(`/settings?error=${encodeURIComponent(error.error?.message || 'token_exchange_failed')}`)
      }

      const tokenData = await tokenResponse.json()
      console.log('[Threads OAuth] Token exchange successful', {
        expires_in: tokenData.expires_in,
        token_type: tokenData.token_type,
      })
      
      // Threads API uses the user access token directly (no Page token needed)
      accessToken = tokenData.access_token
      refreshToken = null // Threads doesn't use refresh tokens the same way
      tokenExpiry = tokenData.expires_in 
        ? new Date(Date.now() + tokenData.expires_in * 1000)
        : null

      interface ThreadsAccount {
        id: string
        username?: string
      }

      // Fetch Threads account details using /me endpoint
      const threadsAccountResponse = await fetch(
        `https://graph.threads.net/v1.0/me?access_token=${accessToken}&fields=id,username`
      )

      if (!threadsAccountResponse.ok) {
        const errorText = await threadsAccountResponse.text()
        console.error('[Threads OAuth] Failed to fetch Threads account:', {
          status: threadsAccountResponse.status,
          error: errorText,
        })
        return redirectWithCleanup('/settings?error=profile_fetch_failed')
      }

      const threadsAccount = await threadsAccountResponse.json() as ThreadsAccount
      platformUserId = threadsAccount.id
      platformUsername = threadsAccount.username || 'Threads User'
      
      console.log('[Threads OAuth] Threads account found:', {
        id: threadsAccount.id,
        username: threadsAccount.username,
      })

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
      const scopes = (tokenData?.scope as string)?.split(' ') || []
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
      existingConnection = await prisma.socialConnection.findUnique({
        where: {
          userId_platform_appType: {
            userId: user.id,
            platform,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            appType: connectionAppType as any,
          },
        },
      })
      appTypeColumnAvailable = true
    } catch (error: unknown) {
      const prismaError = error as PrismaError
      // If unique constraint doesn't exist yet, use findFirst
      if (prismaError.message?.includes('userId_platform_appType') || 
          prismaError.message?.includes('Unknown argument') ||
          prismaError.code === 'P2009') {
        // Don't include appType in where clause - column doesn't exist yet
        // After migration, appType will be handled by the unique constraint above
        appTypeColumnAvailable = false
        const whereClause: { userId: string; platform: string; appType?: string | null } = {
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

    let savedConnectionId: string | null = null
    
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
      savedConnectionId = existingConnection.id
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
        let createdConnection
        if (appTypeColumnAvailable === false) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { appType: _appType, ...legacyData } = createData
          createdConnection = await prisma.socialConnection.create({
            data: legacyData,
          })
        } else {
          createdConnection = await prisma.socialConnection.create({
            data: createData,
          })
          appTypeColumnAvailable = true
        }
        savedConnectionId = createdConnection.id
      } catch (createError: unknown) {
        if (isAppTypeColumnError(createError)) {
          console.warn('[LinkedIn OAuth] appType column not available, creating connection without appType (migration not applied yet)')
          appTypeColumnAvailable = false
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { appType: _appType, ...legacyData } = createData
          const createdConnection = await prisma.socialConnection.create({
            data: legacyData,
          })
          savedConnectionId = createdConnection.id
        } else {
          throw createError
        }
      }
    }
    
    // For Instagram, fetch the actual username in the background if we don't have it yet
    if (platform === 'instagram' && savedConnectionId && (!platformUsername || platformUsername === 'Instagram User')) {
      const fetchParams = (request as RequestWithInstagramParams).__instagramFetchParams
      if (fetchParams) {
        // Fire and forget - fetch username asynchronously without blocking the redirect
        // Use user token from fetchParams (we have it from OAuth), or from refreshToken if stored
        const userTokenToUse = fetchParams.userAccessToken || (refreshToken ? decrypt(refreshToken) : null)
        const tokenToUse = userTokenToUse || fetchParams.pageAccessToken
        const tokenType = userTokenToUse ? 'user' : 'page'
        
        fetchInstagramUsernameUtil(
          savedConnectionId,
          tokenToUse,
          fetchParams.instagramAccountId,
          tokenType
        ).then(async (username) => {
          if (username) {
            // Update connection with fetched username
            await prisma.socialConnection.update({
              where: { id: savedConnectionId },
              data: {
                platformUsername: username,
              },
            })
            console.log('[Instagram OAuth] Successfully updated username in background:', username)
          }
        }).catch((error) => {
          console.error('[Instagram OAuth] Failed to fetch username in background:', error)
        })
      }
    }
    
    // Log connection details for debugging
    if (platform === 'linkedin') {
      const scopes = (tokenData?.scope as string)?.split(' ') || []
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

