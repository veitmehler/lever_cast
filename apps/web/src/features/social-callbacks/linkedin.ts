import type { NextResponse } from 'next/server'
import type { CallbackOutcome, TokenData } from './types'
import {
  LINKEDIN_CLIENT_ID,
  LINKEDIN_CLIENT_SECRET,
  LINKEDIN_REDIRECT_URI,
  LINKEDIN_COMPANY_CLIENT_ID,
  LINKEDIN_COMPANY_CLIENT_SECRET,
  LINKEDIN_COMPANY_REDIRECT_URI,
} from './config'

export async function handleLinkedinCallback(args: {
  code: string
  targetType: 'personal' | 'company' | undefined
  redirectWithCleanup: (relativePath: string) => NextResponse
}): Promise<CallbackOutcome> {
  const { code, targetType, redirectWithCleanup } = args

  let refreshToken: string | null = null
  let tokenExpiry: Date | null = null
  let platformUserId: string
  let platformUsername: string
  let tokenData: TokenData | null = null

  // Determine if this is the company callback (from state token)
  const isCompanyCallback = targetType === 'company'

  // Select appropriate app credentials
  const clientId = isCompanyCallback ? LINKEDIN_COMPANY_CLIENT_ID : LINKEDIN_CLIENT_ID
  const clientSecret = isCompanyCallback ? LINKEDIN_COMPANY_CLIENT_SECRET : LINKEDIN_CLIENT_SECRET
  const redirectUri = isCompanyCallback ? LINKEDIN_COMPANY_REDIRECT_URI : LINKEDIN_REDIRECT_URI

  if (!clientId || !clientSecret) {
    const appType = isCompanyCallback ? 'Company Pages' : 'Personal Profile'
    return { kind: 'redirect', response: redirectWithCleanup(`/settings?error=oauth_not_configured&message=${encodeURIComponent(`LinkedIn ${appType} OAuth not configured. Please set LINKEDIN${isCompanyCallback ? '_COMPANY' : ''}_CLIENT_ID and LINKEDIN${isCompanyCallback ? '_COMPANY' : ''}_CLIENT_SECRET environment variables.`)}`) }
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
    return { kind: 'redirect', response: redirectWithCleanup(`/settings?error=${encodeURIComponent(error.error_description || 'token_exchange_failed')}`) }
  }

  tokenData = await tokenResponse.json()

  // Check scopes to determine app type
  const scopes = (tokenData?.scope as string)?.split(' ') || []
  const hasOrganizationScope = scopes.includes('w_organization_social') || scopes.includes('r_organization_admin') || scopes.includes('rw_organization_admin')
  const hasOpenIDScope = scopes.includes('openid')
  const appType = hasOrganizationScope ? 'company' : 'personal'

  console.log('[LinkedIn OAuth] Token exchange successful', {
    scope: tokenData?.scope,
    scopes: scopes,
    appType: appType,
    hasOpenIDScope,
    isCompanyCallback: isCompanyCallback,
    targetType: targetType,
    expires_in: tokenData?.expires_in,
    token_type: tokenData?.token_type,
  })

  if (!tokenData?.access_token) throw new Error('No access token received')
  const accessToken = tokenData.access_token
  refreshToken = tokenData?.refresh_token || null
  tokenExpiry = tokenData?.expires_in
    ? new Date(Date.now() + tokenData.expires_in * 1000)
    : null

  // Fetch user profile
  // For Company Pages (Community Management API), OpenID Connect is not available
  // Use a fallback approach or skip profile fetching for company connections
  if (hasOpenIDScope) {
    // Personal Profile: Use OpenID Connect userinfo endpoint
    const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (!profileResponse.ok) {
      const errorText = await profileResponse.text()
      console.error('[LinkedIn OAuth] Failed to fetch user profile:', errorText)
      return { kind: 'redirect', response: redirectWithCleanup('/settings?error=profile_fetch_failed') }
    }

    const profile = await profileResponse.json()
    platformUserId = profile.sub
    platformUsername = profile.name || profile.email || 'LinkedIn User'
  } else {
    // Company Pages: Profile fetching not critical - use placeholder values
    // The organization scopes don't include profile access, but we can still save the connection
    console.log('[LinkedIn OAuth] Company Pages connection - skipping profile fetch (OpenID Connect not available)')
    platformUserId = 'company_connection'
    platformUsername = 'LinkedIn Company Page'
  }

  return {
    kind: 'token',
    accessToken,
    refreshToken,
    tokenExpiry,
    platformUserId,
    platformUsername,
    tokenData,
    isCompanyCallback,
  }
}
