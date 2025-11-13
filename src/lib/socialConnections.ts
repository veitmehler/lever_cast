/**
 * Social Connections Service
 * Handles retrieving and managing social media connections
 */

import { decrypt } from './encryption'
import { prisma } from './prisma'

export interface SocialConnection {
  id: string
  userId: string
  platform: 'linkedin' | 'twitter' | 'facebook' | 'instagram' | 'threads'
  appType: 'personal' | 'company' | null // For LinkedIn: distinguishes between Personal Profile and Company Pages apps
  accessToken: string // Decrypted
  refreshToken: string | null // Decrypted
  tokenExpiry: Date | null
  platformUserId: string | null
  platformUsername: string | null
  postTargetType: 'personal' | 'page' | null
  selectedPageId: string | null
  isActive: boolean
}

/**
 * Get user's social connection for a platform
 * @param appType - For LinkedIn: 'personal' or 'company' to specify which app connection to retrieve. For other platforms, leave undefined/null.
 */
export async function getSocialConnection(
  userId: string,
  platform: 'linkedin' | 'twitter' | 'facebook' | 'instagram' | 'threads',
  appType?: 'personal' | 'company'
): Promise<SocialConnection | null> {
  // For LinkedIn, we need to specify appType. For other platforms, appType is null.
  const connectionAppType = platform === 'linkedin' ? (appType || 'personal') : null
  
  // Try to use the unique constraint first (after migration is applied)
  // Fall back to findFirst if the constraint doesn't exist yet (before migration)
  let connection = null
  
  try {
    // Try using the new unique constraint (works after migration)
    connection = await (prisma.socialConnection.findUnique as any)({
      where: {
        userId_platform_appType: {
          userId,
          platform,
          appType: connectionAppType,
        },
      },
    })
  } catch (error: any) {
    // If the unique constraint doesn't exist yet (migration not applied), use findFirst
    if (error.message?.includes('userId_platform_appType') || 
        error.message?.includes('Unknown argument') ||
        error.code === 'P2009') {
      console.warn(`[getSocialConnection] Unique constraint not found, using findFirst (migration may not be applied yet)`)
      
      // Build where clause - don't include appType since column doesn't exist yet
      // After migration, appType will be handled by the unique constraint above
      const whereClause: any = {
        userId,
        platform,
        isActive: true,
      }
      
      // Don't include appType in where clause - column doesn't exist yet
      // After migration is applied, the unique constraint will handle appType filtering
      // For now, just get the first connection for this platform
      // Note: This means before migration, LinkedIn will only return one connection
      // (either personal or company, whichever was connected first)
      
      connection = await prisma.socialConnection.findFirst({
        where: whereClause,
      })
    } else {
      // Re-throw if it's a different error
      throw error
    }
  }

  if (!connection || !connection.isActive) {
    return null
  }

  // Get appType from connection if it exists, otherwise default based on platform
  let finalAppType: 'personal' | 'company' | null = null
  if (platform === 'linkedin') {
    finalAppType = (connection as any).appType || connectionAppType || 'personal'
  }

  return {
    ...connection,
    platform: connection.platform as 'linkedin' | 'twitter' | 'facebook' | 'instagram' | 'threads',
    appType: finalAppType,
    postTargetType: connection.postTargetType as 'personal' | 'page' | null,
    accessToken: decrypt(connection.accessToken),
    refreshToken: connection.refreshToken ? decrypt(connection.refreshToken) : null,
  }
}

/**
 * Check if token is expired or expiring soon (within 5 minutes)
 */
export function isTokenExpiringSoon(tokenExpiry: Date | null): boolean {
  if (!tokenExpiry) return false
  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000)
  return tokenExpiry <= fiveMinutesFromNow
}

