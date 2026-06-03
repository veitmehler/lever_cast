import { createGhlPost } from '@/lib/ghl/client'
import { getGhlCredentials } from '@/lib/ghl/settings'
import { GHL_PLATFORMS, type GhlPlatform } from '@/lib/ghl/types'
import { postToTwitter, postTwitterThread } from '@/lib/twitterApi'
import { postToTelegram } from '@/lib/telegramApi'

export type PublishOutcome =
  | {
      success: true
      postUrl: string | string[]
      tweetId?: string
      tweetIds?: string[]
      postId?: string
      provider?: 'ghl' | 'direct'
      ghlPostId?: string
    }
  | { success: false; error: string }

export interface DispatchPublishOptions {
  imageUrl?: string
  mediaUrls?: string[]
  videoUrl?: string
  chatId?: string
  replyToTweetId?: string
  postAsStory?: boolean
  scheduledAt?: Date
}

function isGhlPlatform(platform: string): platform is GhlPlatform {
  return (GHL_PLATFORMS as readonly string[]).includes(platform)
}

const IMAGE_MIME_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
}

const VIDEO_MIME_BY_EXT: Record<string, string> = {
  mp4: 'video/mp4',
  mov: 'video/mov',
  webm: 'video/webm',
}

function inferMimeTypeFromUrl(url: string, kind: 'image' | 'video'): string {
  const fallback = kind === 'video' ? 'video/mp4' : 'image/jpeg'
  try {
    const pathname = new URL(url).pathname.toLowerCase()
    const ext = pathname.split('.').pop() ?? ''
    const map = kind === 'video' ? VIDEO_MIME_BY_EXT : IMAGE_MIME_BY_EXT
    return map[ext] ?? fallback
  } catch {
    return fallback
  }
}

const GHL_MIN_SCHEDULE_LEAD_MS = 10 * 60 * 1000

function ensureFutureScheduleDate(scheduledAt: Date, now = new Date()): Date {
  const minTime = now.getTime() + GHL_MIN_SCHEDULE_LEAD_MS
  if (scheduledAt.getTime() >= minTime) return scheduledAt
  return new Date(minTime)
}

async function publishViaGhl(
  userId: string,
  platform: GhlPlatform,
  content: string | string[],
  options: DispatchPublishOptions = {},
): Promise<PublishOutcome> {
  const creds = await getGhlCredentials(userId)
  if (!creds) {
    return {
      success: false,
      error: 'Omniply is not configured. Add your API key and Location ID in Settings → Omniply.',
    }
  }

  const accountId = creds.accountIds[platform]
  if (!accountId) {
    return {
      success: false,
      error: `No Omniply account linked for ${platform}. Map your ${platform} account in Settings → Omniply.`,
    }
  }

  // Facebook and Instagram Stories reject caption text via API (Meta constraint).
  const summary =
    options.postAsStory && (platform === 'facebook' || platform === 'instagram')
      ? ''
      : Array.isArray(content)
        ? content[0]
        : content
  const media: Array<{ url: string; type?: string }> = []

  if (options.mediaUrls?.length) {
    for (const url of options.mediaUrls) {
      media.push({ url, type: inferMimeTypeFromUrl(url, 'image') })
    }
  } else if (options.imageUrl) {
    media.push({ url: options.imageUrl, type: inferMimeTypeFromUrl(options.imageUrl, 'image') })
  }
  if (options.videoUrl) {
    media.push({ url: options.videoUrl, type: inferMimeTypeFromUrl(options.videoUrl, 'video') })
  }

  if (platform === 'instagram' && media.length === 0) {
    return { success: false, error: 'Instagram requires an image or video.' }
  }

  const postType = options.postAsStory ? 'story' : options.videoUrl ? 'reel' : 'post'
  const scheduleDate = ensureFutureScheduleDate(options.scheduledAt ?? new Date()).toISOString()

  try {
    const result = await createGhlPost({
      apiKey: creds.apiKey,
      locationId: creds.locationId,
      userId: creds.ghlUserId,
      accountIds: [accountId],
      summary,
      type: postType,
      media,
      status: 'scheduled',
      scheduleDate,
    })

    return {
      success: true,
      postUrl: result.postUrl ?? '',
      postId: result.platformPostId ?? result.ghlPostId,
      provider: 'ghl',
      ghlPostId: result.ghlPostId,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { success: false, error: message }
  }
}

async function publishViaDirect(
  userId: string,
  platform: string,
  content: string | string[],
  options: DispatchPublishOptions = {},
): Promise<PublishOutcome> {
  const { imageUrl, chatId, replyToTweetId } = options

  if (platform === 'linkedin' || platform === 'facebook' || platform === 'instagram' || platform === 'threads') {
    return {
      success: false,
      error: `${platform} publishing is handled via Omniply. Connect Omniply in Settings.`,
    }
  }

  if (platform === 'twitter') {
    if (Array.isArray(content)) {
      const result = await postTwitterThread(userId, content, imageUrl)
      if (result.success) {
        return { success: true, postUrl: result.postUrls, tweetIds: result.tweetIds, provider: 'direct' }
      }
      return result
    }
    const result = await postToTwitter(userId, content, replyToTweetId, imageUrl)
    if (result.success) {
      return { success: true, postUrl: result.postUrl, tweetId: result.tweetId, provider: 'direct' }
    }
    return result
  }

  if (platform === 'telegram') {
    const contentStr = Array.isArray(content) ? content[0] : content
    if (!chatId) return { success: false, error: 'Telegram chat ID is required.' }
    const result = await postToTelegram(userId, contentStr, chatId, imageUrl)
    if (result.success) {
      return {
        success: true,
        postUrl: `https://t.me/${chatId.replace('@', '')}/${result.messageId}`,
        postId: String(result.messageId),
        provider: 'direct',
      }
    }
    return result
  }

  return { success: false, error: `Unsupported platform: ${platform}` }
}

export async function dispatchPublish(
  userId: string,
  platform: string,
  content: string | string[],
  options: DispatchPublishOptions = {},
): Promise<PublishOutcome> {
  const result = isGhlPlatform(platform)
    ? await publishViaGhl(userId, platform, content, options)
    : await publishViaDirect(userId, platform, content, options)

  if (!result.success) {
    console.error('[dispatcher] publish failed', { userId, platform, error: result.error })
  }

  return result
}

export function isGhlManagedPlatform(platform: string): boolean {
  return isGhlPlatform(platform)
}
