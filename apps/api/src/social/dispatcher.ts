import { createGhlPost } from '../lib/ghl/client'
import { getGhlCredentials } from '../lib/ghl/settings'
import { GHL_PLATFORMS, type GhlPlatform } from '../lib/ghl/types'
import { logger } from '../lib/logger'
import { postToTwitter, postTwitterThread } from '../lib/twitterApi'
import { postToTelegram } from '../lib/telegramApi'
import { postToThreads } from '../lib/threadsApi'
import type { AutomationLogContext } from './automation/log-context'

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
  logCtx?: Partial<AutomationLogContext>
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
  const { logCtx } = options
  const baseLog = { userId, platform, provider: 'ghl' as const, ...logCtx }

  const creds = await getGhlCredentials(userId)
  if (!creds) {
    logger.warn(baseLog, '[dispatcher] GHL not configured')
    return {
      success: false,
      error: 'Go HighLevel is not configured. Add your GHL API key and location in Settings.',
    }
  }

  const accountId = creds.accountIds[platform]
  if (!accountId) {
    logger.warn(baseLog, '[dispatcher] GHL account not mapped for platform')
    return {
      success: false,
      error: `No Go HighLevel account linked for ${platform}. Map your ${platform} account in Settings → Go HighLevel.`,
    }
  }

  const summary = Array.isArray(content) ? content[0] : content
  const media: Array<{ url: string; type?: string }> = []

  if (options.mediaUrls?.length) {
    for (const url of options.mediaUrls) {
      media.push({ url, type: 'image' })
    }
  } else if (options.imageUrl) {
    media.push({ url: options.imageUrl, type: 'image' })
  }
  if (options.videoUrl) {
    media.push({ url: options.videoUrl, type: 'video' })
  }

  if (platform === 'instagram' && media.length === 0) {
    logger.warn(baseLog, '[dispatcher] Instagram requires media')
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

    logger.info(
      {
        ...baseLog,
        ghlPostId: result.ghlPostId,
        postUrl: result.postUrl,
        platformPostId: result.platformPostId,
      },
      '[dispatcher] GHL post created',
    )

    return {
      success: true,
      postUrl: result.postUrl ?? '',
      postId: result.platformPostId ?? result.ghlPostId,
      provider: 'ghl',
      ghlPostId: result.ghlPostId,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    logger.error({ ...baseLog, err }, '[dispatcher] GHL post failed')
    return { success: false, error: message }
  }
}

async function publishViaDirect(
  userId: string,
  platform: string,
  content: string | string[],
  options: DispatchPublishOptions = {},
): Promise<PublishOutcome> {
  const { imageUrl, chatId, replyToTweetId, logCtx } = options
  const baseLog = { userId, platform, provider: 'direct' as const, ...logCtx }

  if (platform === 'linkedin' || platform === 'facebook' || platform === 'instagram') {
    logger.warn(baseLog, '[dispatcher] platform requires GHL')
    return {
      success: false,
      error: `${platform} publishing is handled via Go HighLevel. Connect GHL in Settings.`,
    }
  }

  if (platform === 'twitter') {
    if (Array.isArray(content)) {
      const result = await postTwitterThread(userId, content, imageUrl)
      if (result.success) {
        logger.info({ ...baseLog, tweetIds: result.tweetIds }, '[dispatcher] Twitter thread published')
        return { success: true, postUrl: result.postUrls, tweetIds: result.tweetIds, provider: 'direct' }
      }
      logger.error({ ...baseLog, error: result.error }, '[dispatcher] Twitter thread failed')
      return result
    }
    const result = await postToTwitter(userId, content, replyToTweetId, imageUrl)
    if (result.success) {
      logger.info({ ...baseLog, tweetId: result.tweetId, postUrl: result.postUrl }, '[dispatcher] Twitter post published')
      return { success: true, postUrl: result.postUrl, tweetId: result.tweetId, provider: 'direct' }
    }
    logger.error({ ...baseLog, error: result.error }, '[dispatcher] Twitter post failed')
    return result
  }

  if (platform === 'telegram') {
    const contentStr = Array.isArray(content) ? content[0] : content
    if (!chatId) {
      logger.warn(baseLog, '[dispatcher] Telegram chat ID missing')
      return { success: false, error: 'Telegram chat ID is required.' }
    }
    const result = await postToTelegram(userId, contentStr, chatId, imageUrl)
    if (result.success) {
      logger.info({ ...baseLog, messageId: result.messageId }, '[dispatcher] Telegram post published')
      return {
        success: true,
        postUrl: `https://t.me/${chatId.replace('@', '')}/${result.messageId}`,
        postId: String(result.messageId),
        provider: 'direct',
      }
    }
    logger.error({ ...baseLog, error: result.error }, '[dispatcher] Telegram post failed')
    return result
  }

  if (platform === 'threads') {
    const contentStr = Array.isArray(content) ? content[0] : content
    const result = await postToThreads(userId, contentStr, imageUrl)
    if (result.success) {
      logger.info({ ...baseLog, postId: result.postId, postUrl: result.postUrl }, '[dispatcher] Threads post published')
      return { success: true, postUrl: result.postUrl, postId: result.postId, provider: 'direct' }
    }
    logger.error({ ...baseLog, error: result.error }, '[dispatcher] Threads post failed')
    return result
  }

  logger.warn({ ...baseLog }, '[dispatcher] unsupported platform')
  return { success: false, error: `Unsupported platform: ${platform}` }
}

export async function dispatchPublish(
  userId: string,
  platform: string,
  content: string | string[],
  options: DispatchPublishOptions = {},
): Promise<PublishOutcome> {
  if (isGhlPlatform(platform)) {
    return publishViaGhl(userId, platform, content, options)
  }
  return publishViaDirect(userId, platform, content, options)
}

export function isGhlManagedPlatform(platform: string): boolean {
  return isGhlPlatform(platform)
}
