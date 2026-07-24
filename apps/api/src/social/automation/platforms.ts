import { prisma } from '@omniply/shared'
import { getGhlCredentials } from '../../lib/ghl/settings'
import { GHL_PLATFORMS } from '../../lib/ghl/types'
import { isGhlManagedPlatform } from '../dispatcher'
import { FEED_PLATFORMS, STORY_PLATFORMS } from './captions'

/** Returns true when the platform can receive an automated scheduled post. */
export async function isPlatformReadyForAutomation(
  userId: string,
  platform: string,
): Promise<boolean> {
  if (isGhlManagedPlatform(platform)) {
    const creds = await getGhlCredentials(userId)
    if (!creds) return false
    const accountId = creds.accountIds[platform as keyof typeof creds.accountIds]
    return !!accountId
  }

  if (platform === 'telegram') {
    const settings = await prisma.settings.findUnique({
      where: { userId },
      select: { telegramChatId: true },
    })
    return !!settings?.telegramChatId?.trim()
  }

  const connection = await prisma.socialConnection.findFirst({
    where: { userId, platform, isActive: true },
    select: { id: true },
  })
  return !!connection
}

export async function listAutomationPlatforms(
  userId: string,
  isStory: boolean,
): Promise<string[]> {
  const candidates = isStory ? STORY_PLATFORMS : FEED_PLATFORMS
  const ready: string[] = []
  for (const platform of candidates) {
    if (await isPlatformReadyForAutomation(userId, platform)) {
      ready.push(platform)
    }
  }
  return ready
}

export function isGhlPlatform(platform: string): boolean {
  return (GHL_PLATFORMS as readonly string[]).includes(platform)
}
