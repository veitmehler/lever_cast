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
import { type AutomationLogContext, withPlatform, withPost } from './log-context'

export async function schedulePostsForSpec(opts: {
  logCtx: AutomationLogContext
  spec: SocialPostSpec
  assets: SpecAssets
  scheduledAt: Date
  articleCtx: ArticleContentContext
}): Promise<{ scheduled: number; skipped: number; failed: number }> {
  const { logCtx, spec, assets, scheduledAt, articleCtx } = opts
  const platforms = await listAutomationPlatforms(logCtx.userId, spec.isStory)

  let scheduled = 0
  let skipped = 0
  let failed = 0

  for (const platform of platforms) {
    const platformCtx = withPlatform(logCtx, platform)
    const caption = await generatePlatformCaption({
      postType: assets.postType,
      articleCtx,
      logCtx: platformCtx,
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
        const result = await dispatchPublish(logCtx.userId, platform, caption, {
          imageUrl: mediaUrls ? undefined : imageUrl,
          mediaUrls,
          videoUrl,
          postAsStory: spec.isStory,
          scheduledAt,
          logCtx: platformCtx,
        })

        if (!result.success) {
          failed++
          logger.warn({ ...platformCtx, error: result.error }, '[social-automation] GHL schedule failed')
          await sendFailureAlert({
            userId: logCtx.userId,
            jobId: logCtx.jobId,
            errorType: 'social_ghl_schedule',
            message: `GHL schedule failed for ${platform} (${logCtx.slotKey}): ${result.error}`,
            context: { ...platformCtx },
          })
          continue
        }

        const created = await prisma.post.create({
          data: {
            userId: logCtx.userId,
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
            automationRunId: logCtx.runId,
            slotKey: logCtx.slotKey,
          },
        })
        logger.info(
          {
            ...withPost(platformCtx, created.id, result.ghlPostId ?? undefined),
            scheduledAt,
            provider: 'ghl',
            postType: assets.postType,
          },
          '[social-automation] post scheduled',
        )
        scheduled++
      } else {
        const created = await prisma.post.create({
          data: {
            userId: logCtx.userId,
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
            automationRunId: logCtx.runId,
            slotKey: logCtx.slotKey,
          },
        })
        logger.info(
          {
            ...withPost(platformCtx, created.id),
            scheduledAt,
            provider: 'direct',
            postType: assets.postType,
          },
          '[social-automation] post scheduled',
        )
        scheduled++
      }
    } catch (err) {
      failed++
      const message = err instanceof Error ? err.message : String(err)
      logger.error({ ...platformCtx, err }, '[social-automation] failed to schedule post')
      await sendFailureAlert({
        userId: logCtx.userId,
        jobId: logCtx.jobId,
        errorType: 'social_schedule',
        message: `Failed to schedule ${platform} (${logCtx.slotKey}): ${message}`,
        context: { ...platformCtx },
      })
    }
  }

  if (scheduled === 0 && platforms.length === 0) {
    logger.info(logCtx, '[social-automation] no platforms configured for slot')
  }

  return { scheduled, skipped, failed }
}
