import { prisma } from '@socioply/shared'
import { decrypt, encrypt } from '@socioply/shared'
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

export interface PromoEmailConfig {
  apiKey: string
  locationId: string
  tagId: string
  tagName: string | null
  sendTime: string // "HH:mm"
  timezone: string
  fromName: string | null
  fromEmail: string | null
}

/**
 * Returns the promotional-email config only when the feature is fully usable:
 * enabled, a decryptable API key, a locationId, and a target tag. Otherwise null
 * so callers can cheaply skip.
 */
export async function getPromoEmailConfig(userId: string): Promise<PromoEmailConfig | null> {
  const row = await prisma.ghlSettings.findUnique({ where: { userId } })
  if (!row?.promoEmailEnabled || !row.ghlApiKey || !row.ghlLocationId || !row.promoEmailTagId) {
    return null
  }
  const apiKey = decrypt(row.ghlApiKey)
  if (!apiKey) return null

  return {
    apiKey,
    locationId: row.ghlLocationId,
    tagId: row.promoEmailTagId,
    tagName: row.promoEmailTagName,
    sendTime: row.promoEmailSendTime ?? '09:00',
    timezone: row.promoEmailTimezone ?? 'America/New_York',
    fromName: row.promoEmailFromName,
    fromEmail: row.promoEmailFromEmail,
  }
}
