import type { SocialPostSpec } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { logger } from '../../lib/logger'
import { dispatchPublish, isGhlManagedPlatform } from '../dispatcher'
import { trimSlidesForPlatform } from '../platform-limits'
import { generatePlatformCaption } from '../generators/platform-caption'
import type { ArticleContentContext } from './content'
import { listAutomationPlatforms } from './platforms'
import { sendFailureAlert } from '../../lib/alerts'
import type { SpecAssets } from './generate-spec'

export async function schedulePostsForSpec(opts: {
  runId: string
  userId: string
  jobId?: string
  slotKey: string
  spec: SocialPostSpec
  assets: SpecAssets
  scheduledAt: Date
  articleCtx: ArticleContentContext
}): Promise<{ scheduled: number; skipped: number; failed: number }> {
  const { runId, userId, jobId, slotKey, spec, assets, scheduledAt, articleCtx } = opts
  const platforms = await listAutomationPlatforms(userId, spec.isStory)

  let scheduled = 0
  let skipped = 0
  let failed = 0

  for (const platform of platforms) {
    const caption = await generatePlatformCaption({
      platform,
      slotKey,
      postType: assets.postType,
      articleCtx,
    })
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
          await sendFailureAlert({
            userId,
            jobId,
            errorType: 'social_ghl_schedule',
            message: `GHL schedule failed for ${platform} (${slotKey}): ${result.error}`,
            context: { runId, slotKey, platform },
          })
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
            slotKey,
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
            slotKey,
          },
        })
        scheduled++
      }
    } catch (err) {
      failed++
      const message = err instanceof Error ? err.message : String(err)
      logger.error({ runId, slotKey, platform, err }, '[social-automation] failed to schedule post')
      await sendFailureAlert({
        userId,
        jobId,
        errorType: 'social_schedule',
        message: `Failed to schedule ${platform} (${slotKey}): ${message}`,
        context: { runId, slotKey, platform },
      })
    }
  }

  if (scheduled === 0 && platforms.length === 0) {
    logger.info({ runId, slotKey }, '[social-automation] no platforms configured for slot')
  }

  return { scheduled, skipped, failed }
}
