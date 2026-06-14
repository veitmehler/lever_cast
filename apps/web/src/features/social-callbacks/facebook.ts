import type { NextResponse } from 'next/server'
import type { CallbackOutcome } from './types'
import { FACEBOOK_CLIENT_ID, FACEBOOK_CLIENT_SECRET, FACEBOOK_REDIRECT_URI } from './config'

export async function handleFacebookCallback(args: {
  code: string
  redirectWithCleanup: (relativePath: string) => NextResponse
}): Promise<CallbackOutcome> {
  const { code, redirectWithCleanup } = args

  let accessToken: string
  let refreshToken: string | null = null
  let tokenExpiry: Date | null = null

  if (!FACEBOOK_CLIENT_ID || !FACEBOOK_CLIENT_SECRET) {
    return { kind: 'redirect', response: redirectWithCleanup('/settings?error=oauth_not_configured') }
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
    return { kind: 'redirect', response: redirectWithCleanup(`/settings?error=${encodeURIComponent(error.error?.message || 'token_exchange_failed')}`) }
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
    return { kind: 'redirect', response: redirectWithCleanup('/settings?error=profile_fetch_failed') }
  }

  const profile = await profileResponse.json()
  const platformUserId = profile.id
  const platformUsername = profile.name || 'Facebook User'

  return {
    kind: 'token',
    accessToken,
    refreshToken,
    tokenExpiry,
    platformUserId,
    platformUsername,
  }
}
