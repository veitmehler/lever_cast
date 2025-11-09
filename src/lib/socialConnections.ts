/**
 * Social Connections Service
 * Handles retrieving and managing social media connections
 */

import { decrypt } from './encryption'
import { prisma } from './prisma'

export interface SocialConnection {
  id: string
  userId: string
  platform: 'linkedin' | 'twitter'
  accessToken: string // Decrypted
  refreshToken: string | null // Decrypted
  tokenExpiry: Date | null
  platformUserId: string | null
  platformUsername: string | null
  isActive: boolean
}

/**
 * Get user's social connection for a platform
 */
export async function getSocialConnection(
  userId: string,
  platform: 'linkedin' | 'twitter'
): Promise<SocialConnection | null> {
  const connection = await prisma.socialConnection.findUnique({
    where: {
      userId_platform: {
        userId,
        platform,
      },
    },
  })

  if (!connection || !connection.isActive) {
    return null
  }

  return {
    ...connection,
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

