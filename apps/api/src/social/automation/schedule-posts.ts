import type { SocialPostSpec } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { logger } from '../../lib/logger'
import { dispatchPublish, isGhlManagedPlatform } from '../dispatcher'
import { trimSlidesForPlatform } from '../platform-limits'
import type { ArticleContentContext } from './content'
import { buildPlatformCaption } from './captions'
import { listAutomationPlatforms } from './platforms'
import type { SpecAssets } from './generate-spec'

export async function schedulePostsForSpec(opts: {
  runId: string
  userId: string
  slotKey: string
  spec: SocialPostSpec
  assets: SpecAssets
  scheduledAt: Date
  articleCtx: ArticleContentContext
}): Promise<{ scheduled: number; skipped: number; failed: number }> {
  const { runId, userId, slotKey, spec, assets, scheduledAt, articleCtx } = opts
  const platforms = await listAutomationPlatforms(userId, spec.isStory)

  let scheduled = 0
  let skipped = 0
  let failed = 0

  for (const platform of platforms) {
    const caption = buildPlatformCaption(platform, articleCtx, slotKey)
    const mediaUrls = assets.mediaUrls?.length
      ? trimSlidesForPlatform(assets.mediaUrls, platform)
      : undefined
    const imageUrl = mediaUrls?.[0] ?? assets.imageUrl
    const videoUrl = assets.videoUrl

    if (!videoUrl && !imageUrl && !mediaUrls?.length) {
      skipped++
      continue
    }

    try {
      if (isGhlManagedPlatform(platform)) {
        const result = await dispatchPublish(userId, platform, caption, {
          imageUrl: mediaUrls ? undefined : imageUrl,
          mediaUrls,
          videoUrl,
          postAsStory: spec.isStory,
          scheduledAt,
        })

        if (!result.success) {
          failed++
          logger.warn({ runId, slotKey, platform, error: result.error }, '[social-automation] GHL schedule failed')
          continue
        }

        await prisma.post.create({
          data: {
            userId,
            platform,
            content: caption,
            status: 'scheduled',
            scheduledAt,
            imageUrl: mediaUrls ? null : imageUrl ?? null,
            mediaUrls: mediaUrls ?? [],
            videoUrl: videoUrl ?? null,
            postType: assets.postType,
            postAsStory: spec.isStory,
            provider: 'ghl',
            ghlPostId: result.ghlPostId ?? null,
            automationRunId: runId,
          },
        })
        scheduled++
      } else {
        await prisma.post.create({
          data: {
            userId,
            platform,
            content: caption,
            status: 'scheduled',
            scheduledAt,
            imageUrl: mediaUrls ? null : imageUrl ?? null,
            mediaUrls: mediaUrls ?? [],
            videoUrl: videoUrl ?? null,
            postType: assets.postType,
            postAsStory: spec.isStory,
            provider: 'direct',
            automationRunId: runId,
          },
        })
        scheduled++
      }
    } catch (err) {
      failed++
      logger.error({ runId, slotKey, platform, err }, '[social-automation] failed to schedule post')
    }
  }

  if (scheduled === 0 && platforms.length === 0) {
    logger.info({ runId, slotKey }, '[social-automation] no platforms configured for slot')
  }

  return { scheduled, skipped, failed }
}
