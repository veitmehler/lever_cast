import { prisma } from '@/lib/prisma'
import { decrypt, encrypt } from '@/lib/encryption'
import type { GhlAccountIds } from './types'

export interface GhlCredentials {
  apiKey: string
  locationId: string
  ghlUserId: string
  accountIds: GhlAccountIds
}

export async function getGhlCredentials(userId: string): Promise<GhlCredentials | null> {
  const row = await prisma.ghlSettings.findUnique({ where: { userId } })
  if (!row?.ghlApiKey || !row.ghlLocationId || !row.ghlUserId) {
    return null
  }

  const apiKey = decrypt(row.ghlApiKey)
  if (!apiKey) return null

  return {
    apiKey,
    locationId: row.ghlLocationId,
    ghlUserId: row.ghlUserId,
    accountIds: (row.accountIds ?? {}) as GhlAccountIds,
  }
}

export function encryptGhlApiKey(apiKey: string): string {
  return encrypt(apiKey.trim())
}
