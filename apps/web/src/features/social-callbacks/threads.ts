import type { NextResponse } from 'next/server'
import type { CallbackOutcome } from './types'
import { THREADS_CLIENT_ID, THREADS_CLIENT_SECRET, THREADS_REDIRECT_URI } from './config'

export async function handleThreadsCallback(args: {
  code: string
  redirectWithCleanup: (relativePath: string) => NextResponse
}): Promise<CallbackOutcome> {
  const { code, redirectWithCleanup } = args

  let refreshToken: string | null = null
  let tokenExpiry: Date | null = null

  if (!THREADS_CLIENT_ID || !THREADS_CLIENT_SECRET) {
    return { kind: 'redirect', response: redirectWithCleanup('/settings?error=oauth_not_configured') }
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
    return { kind: 'redirect', response: redirectWithCleanup(`/settings?error=${encodeURIComponent(error.error?.message || 'token_exchange_failed')}`) }
  }

  const tokenData = await tokenResponse.json()
  console.log('[Threads OAuth] Token exchange successful', {
    expires_in: tokenData.expires_in,
    token_type: tokenData.token_type,
  })

  // Threads API uses the user access token directly (no Page token needed)
  const accessToken = tokenData.access_token
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
    return { kind: 'redirect', response: redirectWithCleanup('/settings?error=profile_fetch_failed') }
  }

  const threadsAccount = await threadsAccountResponse.json() as ThreadsAccount
  const platformUserId = threadsAccount.id
  const platformUsername = threadsAccount.username || 'Threads User'

  console.log('[Threads OAuth] Threads account found:', {
    id: threadsAccount.id,
    username: threadsAccount.username,
  })

  return {
    kind: 'token',
    accessToken,
    refreshToken,
    tokenExpiry,
    platformUserId,
    platformUsername,
  }
}
