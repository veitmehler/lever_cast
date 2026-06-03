import type { SocialPostSpec } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { logger } from '../../lib/logger'
import { isGhlManagedPlatform } from '../dispatcher'
import { trimSlidesForPlatform } from '../platform-limits'
import { generatePlatformCaption } from '../generators/platform-caption'
import type { ArticleContentContext } from './content'
import { listAutomationPlatforms } from './platforms'
import type { SpecAssets } from './generate-spec'
import { type AutomationLogContext, withPlatform, withPost } from './log-context'
import type { SpecPreviewPayload } from './preview-types'

export async function buildPostsForSpec(opts: {
  logCtx: AutomationLogContext
  spec: SocialPostSpec
  assets: SpecAssets
  scheduledAt: Date
  articleCtx: ArticleContentContext
}): Promise<{
  built: number
  skipped: number
  failed: number
  preview: SpecPreviewPayload
}> {
  const { logCtx, spec, assets, scheduledAt, articleCtx } = opts
  const platforms = await listAutomationPlatforms(logCtx.userId, spec.isStory)

  let built = 0
  let skipped = 0
  let failed = 0

  const preview: SpecPreviewPayload = {
    slotKey: logCtx.slotKey ?? '',
    postType: assets.postType,
    isStory: spec.isStory,
    scheduledAt: scheduledAt.toISOString(),
    platforms: [],
    assets: {
      imageUrl: assets.imageUrl,
      mediaUrls: assets.mediaUrls,
      videoUrl: assets.videoUrl,
      title: assets.title,
    },
  }

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
      const provider = isGhlManagedPlatform(platform) ? 'ghl' : 'direct'
      const created = await prisma.post.create({
        data: {
          userId: logCtx.userId,
          platform,
          content: caption,
          status: 'ready',
          scheduledAt,
          imageUrl: mediaUrls ? null : imageUrl ?? null,
          mediaUrls: mediaUrls ?? [],
          videoUrl: videoUrl ?? null,
          postType: assets.postType,
          postAsStory: spec.isStory,
          provider,
          automationRunId: logCtx.runId,
          slotKey: logCtx.slotKey,
        },
      })

      preview.platforms.push({
        platform,
        caption,
        imageUrl: mediaUrls ? undefined : imageUrl,
        mediaUrls,
        videoUrl,
        status: 'ready',
        postId: created.id,
      })

      logger.info(
        {
          ...withPost(platformCtx, created.id),
          scheduledAt,
          provider,
          postType: assets.postType,
        },
        '[social-automation] post ready for preview',
      )
      built++
    } catch (err) {
      failed++
      const message = err instanceof Error ? err.message : String(err)
      logger.error({ ...platformCtx, err }, '[social-automation] failed to build ready post')
    }
  }

  if (built === 0 && platforms.length === 0) {
    logger.info(logCtx, '[social-automation] no platforms configured for slot')
  }

  return { built, skipped, failed, preview }
}
