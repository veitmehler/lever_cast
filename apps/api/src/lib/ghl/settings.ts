import { prisma } from '../prisma'
import { decrypt, encrypt } from '../encryption'
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

export async function getGhlAccountId(
  userId: string,
  platform: string,
): Promise<string | null> {
  const creds = await getGhlCredentials(userId)
  if (!creds) return null
  return creds.accountIds[platform as keyof GhlAccountIds] ?? null
}

export function encryptGhlApiKey(apiKey: string): string {
  return encrypt(apiKey.trim())
}
