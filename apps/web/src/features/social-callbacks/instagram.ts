import type { NextResponse } from 'next/server'
import type { CallbackOutcome, RequestWithInstagramParams } from './types'
import { INSTAGRAM_CLIENT_ID, INSTAGRAM_CLIENT_SECRET, INSTAGRAM_REDIRECT_URI } from './config'

export async function handleInstagramCallback(args: {
  code: string
  request: Request
  userId: string
  redirectWithCleanup: (relativePath: string) => NextResponse
}): Promise<CallbackOutcome> {
  const { code, request, userId, redirectWithCleanup } = args

  let refreshToken: string | null = null
  let tokenExpiry: Date | null = null
  let platformUserId: string
  let platformUsername: string

  if (!INSTAGRAM_CLIENT_ID || !INSTAGRAM_CLIENT_SECRET) {
    return { kind: 'redirect', response: redirectWithCleanup('/settings?error=oauth_not_configured') }
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
    return { kind: 'redirect', response: redirectWithCleanup(`/settings?error=${encodeURIComponent(error.error?.message || 'token_exchange_failed')}`) }
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
    return { kind: 'redirect', response: redirectWithCleanup('/settings?error=profile_fetch_failed') }
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
        return { kind: 'redirect', response: redirectWithCleanup('/settings?error=instagram_permission_required') }
      }
    }

    return { kind: 'redirect', response: redirectWithCleanup('/settings?error=no_instagram_account') }
  }

  // Store Page access token (Instagram API requires Page token, not user token)
  // But also store user token in refreshToken field (since Instagram doesn't use refresh tokens)
  // We need user token to fetch username via /me/accounts
  const accessToken = pageAccessToken
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
      return { kind: 'redirect', response: redirectWithCleanup('/settings?error=profile_fetch_failed') }
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

  // Store parameters for background username fetch (if username is still default)
  // Store on request object so it's available after connection is saved
  if (!platformUsername || platformUsername === 'Instagram User') {
    (request as RequestWithInstagramParams).__instagramFetchParams = {
      userId: userId,
      instagramAccountId: platformUserId,
      pageAccessToken: pageAccessToken,
      userAccessToken: userAccessToken, // Store user token for fetching pages
    }
  }

  return {
    kind: 'token',
    accessToken,
    refreshToken,
    tokenExpiry,
    platformUserId,
    platformUsername,
  }
}
