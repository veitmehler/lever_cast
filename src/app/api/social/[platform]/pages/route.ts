import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSocialConnection } from '@/lib/socialConnections'
import { decrypt } from '@/lib/encryption'
import { prisma } from '@/lib/prisma'

const LINKEDIN_API_BASE = 'https://api.linkedin.com/v2'
const FACEBOOK_API_BASE = 'https://graph.facebook.com/v24.0'

type RouteContext = {
  params: Promise<{
    platform: string
  }>
}

// GET /api/social/[platform]/pages - Fetch available pages for LinkedIn or Facebook
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  let platform: string | undefined
  try {
    const authResult = await auth()
    const clerkId = authResult.userId

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params
    platform = params.platform

    if (platform !== 'linkedin' && platform !== 'facebook') {
      return NextResponse.json(
        { error: 'Platform must be linkedin or facebook' },
        { status: 400 }
      )
    }

    // Get user from Clerk ID
    const { prisma } = await import('@/lib/prisma')
    const user = await prisma.user.findUnique({
      where: { clerkId },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // For LinkedIn, try to get company connection first (for fetching pages)
    // If not found, fall back to personal connection
    let connection = null
    try {
      if (platform === 'linkedin') {
        // Try company connection first (for Company Pages)
        connection = await getSocialConnection(user.id, platform, 'company')
        // If no company connection, try personal (but it won't have access to Company Pages)
        if (!connection) {
          connection = await getSocialConnection(user.id, platform, 'personal')
        }
      } else {
        connection = await getSocialConnection(user.id, platform)
      }
    } catch (error: unknown) {
      interface PrismaError extends Error {
        code?: string
        message: string
      }

      interface SocialConnectionWithAppType {
        appType: string | null
        accessToken: string
        refreshToken: string | null
        [key: string]: unknown
      }

      const prismaError = error as PrismaError
      console.error(`[Pages API] Error fetching ${platform} connection:`, prismaError)
      // If it's a constraint error, try without appType filtering
      if (prismaError.message?.includes('userId_platform_appType') || 
          prismaError.message?.includes('Unknown argument')) {
        // Fallback: try to get any connection for this platform
        const connections = await prisma.socialConnection.findMany({
          where: {
            userId: user.id,
            platform,
            isActive: true,
          },
          take: 1,
        })
        if (connections.length > 0) {
          const conn = connections[0]
          connection = {
            ...conn,
            appType: platform === 'linkedin' ? ((conn as SocialConnectionWithAppType).appType || 'personal') : null,
            accessToken: decrypt(conn.accessToken),
            refreshToken: conn.refreshToken ? decrypt(conn.refreshToken) : null,
          } as SocialConnectionWithAppType & { accessToken: string; refreshToken: string | null }
        }
      } else {
        throw error
      }
    }
    
    if (!connection) {
      return NextResponse.json(
        { error: `${platform} account not connected` },
        { status: 404 }
      )
    }
    
    // Log which connection type is being used
    if (platform === 'linkedin') {
      console.log('[LinkedIn Pages API] Using connection', {
        appType: connection.appType,
        platformUsername: connection.platformUsername,
      })
    }

    // Check if token needs refresh
    if (connection.tokenExpiry && new Date(connection.tokenExpiry as Date) <= new Date()) {
      return NextResponse.json(
        { error: 'Access token expired. Please reconnect your account.' },
        { status: 401 }
      )
    }

    // Note: getSocialConnection already decrypts the token, so we use it directly
    const accessToken = connection.accessToken

    // Debug: Check token permissions for Facebook
    if (platform === 'facebook') {
      try {
        const debugResponse = await fetch(
          `${FACEBOOK_API_BASE}/me/permissions?access_token=${accessToken}`
        )
        if (debugResponse.ok) {
          const debugData = await debugResponse.json()
          console.log('[Facebook Pages API] Token permissions:', debugData)
        }
      } catch (e) {
        console.warn('[Facebook Pages API] Could not check permissions:', e)
      }
    }

    if (platform === 'linkedin') {
      // First, check if the token has the required scopes for Company Pages
      // We can't directly check scopes from the token, but we can try the API call
      // and check the error response
      
      // Fetch LinkedIn Company Pages
      // LinkedIn requires w_organization_social + r_organization_admin scopes to access company pages
      // Using organizationalEntityAcls endpoint (correct endpoint name per LinkedIn API docs)
      // Note: Query tunneling may be required for long URLs (see LinkedIn API docs)
      console.log('[LinkedIn Pages API] Attempting to fetch organizations with access token')
      const orgsResponse = await fetch(
        `${LINKEDIN_API_BASE}/organizationalEntityAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED&projection=(elements*(organizationalTarget~(id,name,vanityName)))`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      interface LinkedInError {
        code?: string
        message?: string
        [key: string]: unknown
      }

      if (!orgsResponse.ok) {
        const errorText = await orgsResponse.text()
        let errorData: LinkedInError = {}
        try {
          errorData = JSON.parse(errorText) as LinkedInError
        } catch {
          errorData = { message: errorText }
        }
        
        console.error('[LinkedIn Pages API] Failed to fetch organizations:', {
          status: orgsResponse.status,
          error: errorData,
        })
        
        // If we don't have permission or token invalid, return empty array
        if (orgsResponse.status === 403 || orgsResponse.status === 401 || orgsResponse.status === 400) {
          const errorCode = errorData.code || ''
          const errorMessage = errorData.message || ''
          
          // Check if this is a scope/permission issue
          const isScopeIssue = errorCode === 'ACCESS_DENIED' || 
                              errorMessage.includes('permissions') ||
                              errorMessage.includes('w_organization_social') ||
                              errorMessage.includes('r_organization_admin') ||
                              errorMessage.includes('organizationalEntityAcls')
          
          console.warn('[LinkedIn Pages API] Company Pages not available:', {
            reason: isScopeIssue 
              ? 'LinkedIn Company Pages require w_organization_social and r_organization_admin scopes (Community Management API product)'
              : 'LinkedIn Company Pages require the "Community Management API" product (MDP was deprecated April 2024)',
            errorCode: errorCode,
            errorMessage: errorMessage,
            note: 'Make sure you connected using the "Company Page" button, not "Personal Profile". Company Pages require a separate LinkedIn app with Community Management API approval and both w_organization_social and r_organization_admin scopes.',
            endpoint: 'organizationalEntityAcls (correct endpoint per LinkedIn API docs)',
            moreInfo: 'See: https://www.linkedin.com/help/linkedin/answer/a527267/ for Community Management API access',
          })
          return NextResponse.json({ pages: [] })
        }
        
        return NextResponse.json(
          { error: `Failed to fetch LinkedIn pages: ${errorData.message || orgsResponse.status}` },
          { status: orgsResponse.status }
        )
      }

      interface LinkedInOrgElement {
        organizationalTarget: {
          id: string
          name?: string
          vanityName?: string
        }
      }

      interface LinkedInOrgsResponse {
        elements?: LinkedInOrgElement[]
      }

      const orgsData = await orgsResponse.json() as LinkedInOrgsResponse
      const pages = (orgsData.elements || []).map((element: LinkedInOrgElement) => {
        // LinkedIn API returns organizationalTarget (not organization) per API docs
        const org = element.organizationalTarget
        return {
          id: org.id,
          name: org.name || org.vanityName || 'Unnamed Page',
          vanityName: org.vanityName,
        }
      })

      return NextResponse.json({ pages })
    } else if (platform === 'facebook') {
      // Fetch Facebook Pages
      // Note: Requires pages_show_list permission on the user access token
      console.log('[Facebook Pages API] Fetching pages with access token (first 10 chars):', accessToken.substring(0, 10) + '...')
      
      const pagesResponse = await fetch(
        `${FACEBOOK_API_BASE}/me/accounts?access_token=${accessToken}&fields=id,name,access_token`
      )

      interface FacebookError {
        error?: {
          message?: string
          code?: number
        }
        message?: string
        [key: string]: unknown
      }

      if (!pagesResponse.ok) {
        const errorText = await pagesResponse.text()
        let errorData: FacebookError = {}
        try {
          errorData = JSON.parse(errorText) as FacebookError
        } catch {
          errorData = { message: errorText }
        }
        
        console.error('[Facebook Pages API] Failed to fetch pages:', {
          status: pagesResponse.status,
          statusText: pagesResponse.statusText,
          error: errorData,
          url: `${FACEBOOK_API_BASE}/me/accounts?access_token=${accessToken.substring(0, 10)}...`,
        })
        
        // Log the full error for debugging
        console.error('[Facebook Pages API] Full error response:', errorText)
        
        // Check if this is a rate limit error (code 4, is_transient: true)
        const isRateLimit = errorData.error?.code === 4 && 
                           (errorData.error as { is_transient?: boolean }).is_transient === true
        
        // If permission denied, token invalid, or rate limited, bubble the error up to the client
        if (pagesResponse.status === 400 || pagesResponse.status === 401 || pagesResponse.status === 403) {
          const errorMessage = errorData.error?.message || errorData.message || pagesResponse.statusText
          
          if (isRateLimit) {
            console.warn('[Facebook Pages API] Rate limit reached, returning error to client')
            return NextResponse.json(
              {
                error: 'Facebook API rate limit reached. Please wait a few minutes and try again.',
                rateLimit: true,
                retryAfterMs: 5 * 60 * 1000,
                details: errorMessage,
              },
              { status: 429 }
            )
          }

          console.warn('[Facebook Pages API] Permission issue or no pages available:', errorMessage)
          return NextResponse.json(
            {
              error: errorMessage || 'Facebook API permissions issue. Please reconnect your Facebook account.',
              code: errorData.error?.code,
            },
            { status: pagesResponse.status }
          )
        }
        
        return NextResponse.json(
          { error: `Failed to fetch Facebook pages: ${errorData.error?.message || errorData.message || pagesResponse.status}` },
          { status: pagesResponse.status }
        )
      }

      const pagesData = await pagesResponse.json()
      console.log('[Facebook Pages API] Raw response:', JSON.stringify(pagesData, null, 2))
      
      // Handle case where API returns an error object instead of data array
      if (pagesData.error) {
        console.error('[Facebook Pages API] API returned error:', pagesData.error)
        const isRateLimit = pagesData.error.code === 4 && pagesData.error.is_transient === true
        if (isRateLimit) {
          return NextResponse.json(
            {
              error: 'Facebook API rate limit reached. Please wait a few minutes and try again.',
              rateLimit: true,
              retryAfterMs: 5 * 60 * 1000,
              details: pagesData.error.message,
            },
            { status: 429 }
          )
        }
        return NextResponse.json(
          {
            error: pagesData.error.message || 'Failed to fetch Facebook pages.',
            code: pagesData.error.code,
          },
          { status: 400 }
        )
      }
      
      interface FacebookPage {
        id: string
        name: string
        access_token?: string
      }

      const pages = (pagesData.data || []).map((page: FacebookPage) => ({
        id: page.id,
        name: page.name,
        access_token: page.access_token, // Page access token needed for posting
      }))

      console.log('[Facebook Pages API] Found pages:', pages.length, pages.map((p: { id: string; name: string; access_token: string }) => p.name))
      return NextResponse.json({ pages })
    }

    return NextResponse.json({ error: 'Invalid platform' }, { status: 400 })
  } catch (error) {
    console.error(`Error fetching ${platform || 'unknown'} pages:`, error)
    // Return empty array instead of error to prevent UI issues
    // The user can still use the app even if pages can't be fetched
    return NextResponse.json({ pages: [] })
  }
}

