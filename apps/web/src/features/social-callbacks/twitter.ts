import type { NextResponse } from 'next/server'
import type { CallbackOutcome, TokenData } from './types'
import { TWITTER_CLIENT_ID, TWITTER_CLIENT_SECRET, TWITTER_REDIRECT_URI } from './config'

export async function handleTwitterCallback(args: {
  code: string
  codeVerifier: string | undefined
  redirectWithCleanup: (relativePath: string) => NextResponse
}): Promise<CallbackOutcome> {
  const { code, codeVerifier, redirectWithCleanup } = args

  let refreshToken: string | null = null
  let tokenExpiry: Date | null = null
  let tokenData: TokenData | null = null

  if (!TWITTER_CLIENT_ID || !TWITTER_CLIENT_SECRET) {
    return { kind: 'redirect', response: redirectWithCleanup('/settings?error=oauth_not_configured') }
  }

  if (!codeVerifier) {
    console.error('Twitter OAuth callback missing codeVerifier for state')
    return { kind: 'redirect', response: redirectWithCleanup('/settings?error=invalid_state') }
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
      code_verifier: codeVerifier,
    }),
  })

  if (!tokenResponse.ok) {
    const error = await tokenResponse.json().catch(() => ({ error_description: 'Unknown error' }))
    console.error('Twitter token exchange error:', error)
    return { kind: 'redirect', response: redirectWithCleanup(`/settings?error=${encodeURIComponent(error.error_description || 'token_exchange_failed')}`) }
  }

  tokenData = await tokenResponse.json()
  if (!tokenData?.access_token) throw new Error('No access token received')
  const accessToken = tokenData.access_token
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
    return { kind: 'redirect', response: redirectWithCleanup('/settings?error=profile_fetch_failed') }
  }

  const profile = await profileResponse.json()
  const platformUserId = profile.data.id
  const platformUsername = profile.data.username || profile.data.name || 'Twitter User'

  return {
    kind: 'token',
    accessToken,
    refreshToken,
    tokenExpiry,
    platformUserId,
    platformUsername,
    tokenData,
  }
}
