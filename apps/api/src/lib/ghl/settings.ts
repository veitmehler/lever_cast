import { ghlSettingsForUser } from '@omniply/shared'
import { decrypt, encrypt } from '@omniply/shared'
import type { GhlAccountIds } from './types'

export interface GhlCredentials {
  apiKey: string
  locationId: string
  ghlUserId: string
  accountIds: GhlAccountIds
}

export async function getGhlCredentials(userId: string): Promise<GhlCredentials | null> {
  const row = await ghlSettingsForUser(userId)
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
  /** GHL user id that owns created campaigns — required by the email API. */
  ghlUserId: string
  tagId: string
  tagName: string | null
  sendTime: string // "HH:mm"
  timezone: string
  fromName: string | null
  fromEmail: string | null
}

/**
 * Returns the promotional-email config only when the feature is fully usable:
 * enabled, a decryptable API key, a locationId, a GHL user id (campaign owner),
 * and a target tag. Otherwise null so callers can cheaply skip.
 */
export async function getPromoEmailConfig(userId: string): Promise<PromoEmailConfig | null> {
  const row = await ghlSettingsForUser(userId)
  if (
    !row?.promoEmailEnabled ||
    !row.ghlApiKey ||
    !row.ghlLocationId ||
    !row.ghlUserId ||
    !row.promoEmailTagId
  ) {
    return null
  }
  const apiKey = decrypt(row.ghlApiKey)
  if (!apiKey) return null

  return {
    apiKey,
    locationId: row.ghlLocationId,
    ghlUserId: row.ghlUserId,
    tagId: row.promoEmailTagId,
    tagName: row.promoEmailTagName,
    sendTime: row.promoEmailSendTime ?? '09:00',
    timezone: row.promoEmailTimezone ?? 'America/New_York',
    fromName: row.promoEmailFromName,
    fromEmail: row.promoEmailFromEmail,
  }
}

export interface NewsletterEmailConfig {
  apiKey: string
  locationId: string
  ghlUserId: string
  tagId: string
  tagName: string | null
  sendTime: string // "HH:mm"
  timezone: string
  fromName: string | null
  fromEmail: string
}

/**
 * Returns the newsletter delivery config only when fully usable: a decryptable
 * API key, locationId, GHL user id (campaign owner), a target tag, and a From
 * email. Otherwise null so the approve route can return a clear error.
 */
export async function getNewsletterEmailConfig(userId: string): Promise<NewsletterEmailConfig | null> {
  const row = await ghlSettingsForUser(userId)
  if (
    !row?.ghlApiKey ||
    !row.ghlLocationId ||
    !row.ghlUserId ||
    !row.newsletterTagId ||
    !row.newsletterFromEmail
  ) {
    return null
  }
  const apiKey = decrypt(row.ghlApiKey)
  if (!apiKey) return null

  return {
    apiKey,
    locationId: row.ghlLocationId,
    ghlUserId: row.ghlUserId,
    tagId: row.newsletterTagId,
    tagName: row.newsletterTagName,
    sendTime: row.newsletterSendTime ?? '09:00',
    timezone: row.newsletterTimezone ?? 'America/New_York',
    fromName: row.newsletterFromName,
    fromEmail: row.newsletterFromEmail,
  }
}
