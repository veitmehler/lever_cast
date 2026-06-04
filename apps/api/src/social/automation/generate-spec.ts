import type { SocialPostSpec } from '@prisma/client'
import {
  generateQuoteCardAsset,
  generateCarouselAssets,
  generatePitchStoryAssets,
} from '../generate-assets'
import {
  generateVideoReelAsset,
  generateHookVideoAsset,
  generateQuoteVideoAsset,
  generateLoopedReelAsset,
} from '../generate-video-assets'
import type { ArticleContentContext, SlotContent } from './content'
import { resolveSlotContent } from './content'
import type { AutomationLogContext } from './log-context'

export interface SpecAssets {
  postType: string
  imageUrl?: string
  mediaUrls?: string[]
  videoUrl?: string
  title?: string
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
        slideCount,
        jobId: assetJobId,
      })
      return {
        postType: 'carousel',
        mediaUrls: carousel.imageUrls,
        imageUrl: carousel.imageUrls[0],
        title: carousel.slides[0]?.headline ?? articleCtx.h2Title,
      }
    }

    case 'video_reel': {
      if (slotKey === 'S2') {
        const f2 = priorAssets.get('F2')
        if (!f2?.videoUrl) throw new Error('F2 video reel is required before S2')
        const looped = await generateLoopedReelAsset({
          userId,
          sourceVideoUrl: f2.videoUrl,
          jobId: assetJobId,
        })
        return { postType: 'video_reel', videoUrl: looped.videoUrl }
      }
      const reel = await generateVideoReelAsset({
        userId,
        content: content.text,
        title: articleCtx.title,
        jobId: assetJobId,
      })
      return { postType: 'video_reel', videoUrl: reel.videoUrl }
    }

    case 'hook_video': {
      const hook = await generateHookVideoAsset({
        userId,
        content: content.text,
        title: content.title ?? articleCtx.h2Title,
        slideCount,
        jobId: assetJobId,
      })
      return { postType: 'hook_video', videoUrl: hook.videoUrl, title: hook.title }
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
      const f4 = priorAssets.get('F4')
      const title = f4?.title ?? articleCtx.h2Title
      const pitch = await generatePitchStoryAssets({
        userId,
        title,
        pitchType: 'carousel',
        jobId: assetJobId,
      })
      return {
        postType: 'pitch_carousel',
        mediaUrls: pitch.imageUrls,
        imageUrl: pitch.imageUrls[0],
        title,
      }
    }

    case 'pitch_hook': {
      const f6 = priorAssets.get('F6')
      const title = f6?.title ?? articleCtx.h2Title
      const pitch = await generatePitchStoryAssets({
        userId,
        title,
        pitchType: 'hook',
        jobId: assetJobId,
      })
      return {
        postType: 'pitch_hook',
        mediaUrls: pitch.imageUrls,
        imageUrl: pitch.imageUrls[0],
        title,
      }
    }

    default:
      throw new Error(`Unsupported post type: ${spec.postType}`)
  }
}
