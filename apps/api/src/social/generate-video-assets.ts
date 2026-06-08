import fs from 'node:fs/promises'
import path from 'node:path'
import { withTempDir } from './video/ffmpeg'
import { buildVideoReel, buildHookVideo } from './video/hook-video'
import { buildQuoteVideo, buildLoopedStoryReel } from './video/quote-video'
import { registerSocialVideo } from './media-register'
import {
  generateCarouselAssets,
  generateQuoteCardAsset,
  type GeneratedCarousel,
} from './generate-assets'
import { extractReelBullets } from './generators/reel-bullets'
import { generateVideoReelPrompt } from './generators/video-reel-prompt'
import { generateQuoteVideoNarration } from './generators/quote-video-narration'
import { loadSocialBrandTheme } from './brand-theme'
import { loadPromptTemplate } from '../article-pipeline/enrichment/prompt-template'

function generationId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export interface GeneratedVideoReel {
  postType: 'video_reel'
  videoUrl: string
  mediaId: string
  bullets: string[]
}

export interface GeneratedHookVideo {
  postType: 'hook_video'
  videoUrl: string
  mediaId: string
  title: string
}

export interface GeneratedQuoteVideo {
  postType: 'quote_video'
  videoUrl: string
  mediaId: string
  voiceoverUsed: boolean
}

export interface GeneratedLoopedReel {
  postType: 'video_reel'
  videoUrl: string
  mediaId: string
  loopCount: number
}

async function uploadVideoFile(opts: {
  userId: string
  filePath: string
  s3Key: string
  title: string
  width: number
  height: number
  jobId?: string
}): Promise<{ videoUrl: string; mediaId: string }> {
  const buffer = await fs.readFile(opts.filePath)
  const registered = await registerSocialVideo({
    userId: opts.userId,
    buffer,
    s3Key: opts.s3Key,
    title: opts.title,
    width: opts.width,
    height: opts.height,
    jobId: opts.jobId,
  })
  return { videoUrl: registered.url, mediaId: registered.mediaId }
}

export async function generateVideoReelAsset(opts: {
  userId: string
  content: string
  /** Article title / topic — used as {{topic}} in the video prompt. Falls back to first line of content. */
  topic?: string
  /** First H2 section text — used as {{details}} in the video prompt. Falls back to content slice. */
  h2Content?: string
  jobId?: string
}): Promise<GeneratedVideoReel> {
  const genId = generationId()
  const jobId = opts.jobId ?? genId

  const [brand, videoModelTemplate] = await Promise.all([
    loadSocialBrandTheme(opts.userId),
    loadPromptTemplate(207),
  ])

  const falModel = videoModelTemplate?.defaultModel ?? 'fal-ai/bytedance/seedance/v1/lite/text-to-video'

  const topic = opts.topic?.trim() ||
    opts.content.replace(/<[^>]+>/g, ' ').split(/[\n.!?]/)[0]?.trim().slice(0, 200) ||
    brand.organizationName
  const details = opts.h2Content?.trim() ||
    opts.content.replace(/<[^>]+>/g, ' ').slice(0, 1500)

  const [{ headline, bullets }, videoPrompt] = await Promise.all([
    extractReelBullets({
      content: opts.content,
      topic,
      details,
      specialInstructions: brand.videoSpecialInstructions,
    }),
    generateVideoReelPrompt({
      topic,
      details,
      specialInstructions: brand.videoSpecialInstructions,
      videoModel: falModel,
    }),
  ])

  return withTempDir('video-reel-', async (tmpDir) => {
    const outputPath = path.join(tmpDir, 'reel.mp4')
    const probe = await buildVideoReel({
      prompt: videoPrompt,
      headline,
      bullets,
      outputPath,
      tmpDir,
      falModel,
    })

    const uploaded = await uploadVideoFile({
      userId: opts.userId,
      filePath: outputPath,
      s3Key: `social/${opts.userId}/${jobId}/video-reel-${genId}.mp4`,
      title: 'Video reel',
      width: probe.width,
      height: probe.height,
      jobId,
    })

    return { postType: 'video_reel', ...uploaded, bullets }
  })
}

export async function generateHookVideoAsset(opts: {
  userId: string
  content: string
  title?: string
  slideCount?: number
  jobId?: string
}): Promise<GeneratedHookVideo> {
  const genId = generationId()
  const jobId = opts.jobId ?? genId
  const slideCount = Math.min(Math.max(6, opts.slideCount ?? 6), 12)

  const [carousel, brand] = await Promise.all([
    generateCarouselAssets({
      userId: opts.userId,
      content: opts.content,
      slideCount,
      jobId,
    }),
    loadSocialBrandTheme(opts.userId),
  ])

  const title = opts.title?.trim() || carousel.slides[0]?.headline || 'Watch this'

  // Use the LLM-generated cinematic scene description (same step 206 as video reels)
  // so Seedance receives a proper visual prompt, not a title string.
  const topic = title
  const details = opts.content.replace(/<[^>]+>/g, ' ').slice(0, 1500)
  const hookVideoPrompt = await generateVideoReelPrompt({
    topic,
    details,
    specialInstructions: brand.videoSpecialInstructions,
    videoModel: 'fal-ai/bytedance/seedance/v1/lite/image-to-video',
  })

  return withTempDir('hook-video-', async (tmpDir) => {
    const outputPath = path.join(tmpDir, 'hook.mp4')
    const probe = await buildHookVideo({
      title,
      hookPrompt: hookVideoPrompt,
      // No hookImageUrl — pure T2V so Seedance doesn't receive an image with
      // baked-in headline text as its reference frame.
      hookImageUrl: undefined,
      // Pass all carousel slides (including slide 0 which has its own text overlay)
      slideshowImageUrls: carousel.imageUrls,
      outputPath,
      tmpDir,
      // Title overlay is redundant now — the hook slide in the slideshow already
      // has the headline rendered via the carousel SVG compositor.
      skipTitleOverlay: true,
    })

    const uploaded = await uploadVideoFile({
      userId: opts.userId,
      filePath: outputPath,
      s3Key: `social/${opts.userId}/${jobId}/hook-video-${genId}.mp4`,
      title: `Hook video — ${title.slice(0, 40)}`,
      width: probe.width,
      height: probe.height,
      jobId,
    })

    return { postType: 'hook_video', ...uploaded, title }
  })
}

export async function generateQuoteVideoAsset(opts: {
  userId: string
  content: string
  quoteCount?: number
  jobId?: string
  useNarrationPrompt?: boolean
}): Promise<GeneratedQuoteVideo> {
  const genId = generationId()
  const jobId = opts.jobId ?? genId
  const quoteCount = Math.min(Math.max(2, opts.quoteCount ?? 3), 5)

  return withTempDir('quote-video-', async (tmpDir) => {
    const quoteUrls: string[] = []
    let narration = ''

    if (opts.useNarrationPrompt) {
      try {
        narration = await generateQuoteVideoNarration(opts.userId, opts.content)
      } catch {
        narration = ''
      }
    }

    for (let i = 0; i < quoteCount; i++) {
      const card = await generateQuoteCardAsset({
        userId: opts.userId,
        content: opts.content,
        variant: 'story',
        jobId,
      })
      quoteUrls.push(card.imageUrl)
      if (!narration) {
        narration += `${card.quoteText}. `
      }
    }

    const outputPath = path.join(tmpDir, 'quote-video.mp4')
    const { probe, voiceoverUsed } = await buildQuoteVideo({
      userId: opts.userId,
      quoteImageUrls: quoteUrls,
      outputPath,
      narrationText: narration.trim(),
      secondsPerSlide: 4,
    })

    const uploaded = await uploadVideoFile({
      userId: opts.userId,
      filePath: outputPath,
      s3Key: `social/${opts.userId}/${jobId}/quote-video-${genId}.mp4`,
      title: 'Quote video',
      width: probe.width,
      height: probe.height,
      jobId,
    })

    return { postType: 'quote_video' as const, ...uploaded, voiceoverUsed }
  })
}

export async function generateLoopedReelAsset(opts: {
  userId: string
  sourceVideoUrl: string
  loopCount?: number
  jobId?: string
}): Promise<GeneratedLoopedReel> {
  const genId = generationId()
  const jobId = opts.jobId ?? genId
  const loopCount = opts.loopCount ?? 3

  return withTempDir('loop-reel-', async (tmpDir) => {
    const outputPath = path.join(tmpDir, 'loop-reel.mp4')
    const probe = await buildLoopedStoryReel(opts.sourceVideoUrl, outputPath, loopCount)

    const uploaded = await uploadVideoFile({
      userId: opts.userId,
      filePath: outputPath,
      s3Key: `social/${opts.userId}/${jobId}/loop-reel-${genId}.mp4`,
      title: `Looped reel (${loopCount}×)`,
      width: probe.width,
      height: probe.height,
      jobId,
    })

    return { postType: 'video_reel' as const, ...uploaded, loopCount }
  })
}
