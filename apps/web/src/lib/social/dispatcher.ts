import { createGhlPost } from '@/lib/ghl/client'
import { getGhlCredentials } from '@/lib/ghl/settings'
import { GHL_PLATFORMS, type GhlPlatform } from '@/lib/ghl/types'
import { postToLinkedIn } from '@/lib/linkedinApi'
import { postToTwitter, postTwitterThread } from '@/lib/twitterApi'
import { postToFacebook } from '@/lib/facebookApi'
import { postToInstagram } from '@/lib/instagramApi'
import { postToTelegram } from '@/lib/telegramApi'
import { postToThreads } from '@/lib/threadsApi'

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

function useDirectSocialPublish(): boolean {
  return process.env.USE_DIRECT_SOCIAL_PUBLISH === 'true'
}

function isGhlPlatform(platform: string): platform is GhlPlatform {
  return (GHL_PLATFORMS as readonly string[]).includes(platform)
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
      error: 'Go HighLevel is not configured. Add your GHL API key and location in Settings.',
    }
  }

  const accountId = creds.accountIds[platform]
  if (!accountId) {
    return {
      success: false,
      error: `No Go HighLevel account linked for ${platform}. Map your ${platform} account in Settings → Go HighLevel.`,
    }
  }

  const summary = Array.isArray(content) ? content[0] : content
  const media: Array<{ url: string; type?: string }> = []

  if (options.imageUrl) {
    media.push({ url: options.imageUrl, type: 'image' })
  }
  if (options.mediaUrls?.length) {
    for (const url of options.mediaUrls) {
      media.push({ url, type: 'image' })
    }
  }
  if (options.videoUrl) {
    media.push({ url: options.videoUrl, type: 'video' })
  }

  if (platform === 'instagram' && media.length === 0) {
    return { success: false, error: 'Instagram requires an image or video.' }
  }

  const postType = options.postAsStory ? 'story' : options.videoUrl ? 'reel' : 'post'
  const scheduleDate = (options.scheduledAt ?? new Date()).toISOString()

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

  if (platform === 'linkedin') {
    const contentStr = Array.isArray(content) ? content[0] : content
    const result = await postToLinkedIn(userId, contentStr, imageUrl)
    return result.success
      ? { success: true, postUrl: result.postUrl, provider: 'direct' }
      : result
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

  if (platform === 'facebook') {
    const contentStr = Array.isArray(content) ? content[0] : content
    const result = await postToFacebook(userId, contentStr, imageUrl)
    if (result.success) {
      return { success: true, postUrl: result.postUrl, postId: result.postId, provider: 'direct' }
    }
    return result
  }

  if (platform === 'instagram') {
    const contentStr = Array.isArray(content) ? content[0] : content
    if (!imageUrl) return { success: false, error: 'Instagram requires an image.' }
    const result = await postToInstagram(userId, contentStr, imageUrl)
    if (result.success) {
      return { success: true, postUrl: result.postUrl, postId: result.postId, provider: 'direct' }
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

  if (platform === 'threads') {
    const contentStr = Array.isArray(content) ? content[0] : content
    const result = await postToThreads(userId, contentStr, imageUrl)
    if (result.success) {
      return { success: true, postUrl: result.postUrl, postId: result.postId, provider: 'direct' }
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
  if (isGhlPlatform(platform) && !useDirectSocialPublish()) {
    return publishViaGhl(userId, platform, content, options)
  }
  return publishViaDirect(userId, platform, content, options)
}

export function isGhlManagedPlatform(platform: string): boolean {
  return isGhlPlatform(platform) && !useDirectSocialPublish()
}
