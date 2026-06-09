import type { SocialPostSpec } from '@prisma/client'
import {
  generateQuoteCardAsset,
  generateCarouselAssets,
} from '../generate-assets'
import {
  generateVideoReelAsset,
  generateHookVideoAsset,
  generateQuoteVideoAsset,
  generateStoriesReelAsset,
  generateStoryCarouselVideo,
  generateStoryHookVideo,
} from '../generate-video-assets'
import type { ArticleContentContext, SlotContent } from './content'
import { resolveSlotContent } from './content'
import type { AutomationLogContext } from './log-context'

export interface SpecAssets {
  postType: string
  imageUrl?: string
  mediaUrls?: string[]
  videoUrl?: string
  /** Pre-overlay raw Seedance background video URL — stored so S2 can reuse F2's background. */
  rawVideoUrl?: string
  title?: string
  /** Raw (pre-overlay) carousel background image URLs — stored so S4/S6 can build pitch slides. */
  backgroundImageUrls?: string[]
  /** F6's raw Seedance hook clip (1:1, no title) — stored so S6 can reuse it at 9:16. */
  hookRawVideoUrl?: string
}

export async function generateSpecAssets(opts: {
  userId: string
  jobId: string
  slotKey: string
  spec: SocialPostSpec
  articleCtx: ArticleContentContext
  priorAssets: Map<string, SpecAssets>
  slideCount: number
  logCtx: AutomationLogContext
}): Promise<SpecAssets> {
  const { userId, jobId, slotKey, spec, articleCtx, priorAssets, slideCount } = opts
  const assetJobId = `${jobId}-${slotKey}`
  const content: SlotContent = resolveSlotContent(slotKey, articleCtx)

  switch (spec.postType) {
    case 'quote': {
      const variant = spec.isStory ? 'story' : 'feed'
      const card = await generateQuoteCardAsset({
        userId,
        content: content.text,
        variant,
        quoteText: content.quoteText,
        jobId: assetJobId,
      })
      return { postType: 'quote', imageUrl: card.imageUrl }
    }

    case 'carousel': {
      const carousel = await generateCarouselAssets({
        userId,
        content: content.text,
        topic: articleCtx.title,
        articleUrl: '',
        slideCount,
        jobId: assetJobId,
      })
      return {
        postType: 'carousel',
        mediaUrls: carousel.imageUrls,
        imageUrl: carousel.imageUrls[0],
        title: carousel.slides[0]?.headline ?? articleCtx.h2Title,
        backgroundImageUrls: carousel.backgroundImageUrls,
      }
    }

    case 'video_reel': {
      if (slotKey === 'S2') {
        const f2 = priorAssets.get('F2')
        if (!f2?.rawVideoUrl) throw new Error('F2 raw background video is required before S2')
        const reel = await generateStoriesReelAsset({
          userId,
          rawVideoUrl: f2.rawVideoUrl,
          content: content.text,
          topic: articleCtx.title,
          jobId: assetJobId,
        })
        return { postType: 'video_reel', videoUrl: reel.videoUrl, rawVideoUrl: reel.rawVideoUrl }
      }
      const reel = await generateVideoReelAsset({
        userId,
        content: content.text,
        topic: articleCtx.title,
        h2Content: articleCtx.h2SectionText,
        jobId: assetJobId,
      })
      return {
        postType: 'video_reel',
        videoUrl: reel.videoUrl,
        rawVideoUrl: reel.rawVideoUrl,
      }
    }

    case 'hook_video': {
      const hook = await generateHookVideoAsset({
        userId,
        content: content.text,
        title: content.title ?? articleCtx.h2Title,
        slideCount,
        jobId: assetJobId,
      })
      // Store carousel images, raw backgrounds, and raw hook clip so S6 can reuse them.
      return {
        postType: 'hook_video',
        videoUrl: hook.videoUrl,
        title: hook.title,
        mediaUrls: hook.carouselImageUrls,
        backgroundImageUrls: hook.carouselBackgroundImageUrls,
        hookRawVideoUrl: hook.hookRawVideoUrl,
      }
    }

    case 'quote_video': {
      const qv = await generateQuoteVideoAsset({
        userId,
        content: content.text,
        jobId: assetJobId,
        useNarrationPrompt: true,
      })
      return { postType: 'quote_video', videoUrl: qv.videoUrl }
    }

    case 'pitch_carousel': {
      // S4 — 9:16 story video: F4 hook image (slide 1) + pitch slide from F4 raw background.
      const f4 = priorAssets.get('F4')
      if (!f4?.mediaUrls?.length) throw new Error('F4 carousel images are required before S4')
      if (!f4?.backgroundImageUrls?.length) throw new Error('F4 background images are required before S4')
      const s4 = await generateStoryCarouselVideo({
        userId,
        imageUrls: f4.mediaUrls,
        backgroundImageUrls: f4.backgroundImageUrls,
        content: content.text,
        topic: content.title ?? articleCtx.h2Title,
        jobId: assetJobId,
      })
      return { postType: 'pitch_carousel', videoUrl: s4.videoUrl }
    }

    case 'pitch_hook': {
      // S6 — 9:16 story video: F6's raw hook clip cropped to 9:16 + pitch slide from F6 raw background.
      const f6 = priorAssets.get('F6')
      const title = f6?.title ?? content.title ?? articleCtx.h2Title
      const backgroundImageUrl = f6?.backgroundImageUrls?.[1] ?? f6?.backgroundImageUrls?.[0]
      const hookRawVideoUrl = f6?.hookRawVideoUrl
      if (!backgroundImageUrl) throw new Error('F6 background images are required before S6')
      if (!hookRawVideoUrl) throw new Error('F6 raw hook video is required before S6')
      const s6 = await generateStoryHookVideo({
        userId,
        title,
        content: content.text,
        topic: content.title ?? articleCtx.h2Title,
        hookRawVideoUrl,
        backgroundImageUrl,
        jobId: assetJobId,
      })
      return { postType: 'pitch_hook', videoUrl: s6.videoUrl, title }
    }

    default:
      throw new Error(`Unsupported post type: ${spec.postType}`)
  }
}
