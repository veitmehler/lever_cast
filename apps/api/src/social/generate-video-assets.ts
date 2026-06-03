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
import { generateQuoteVideoNarration } from './generators/quote-video-narration'
import { loadSocialBrandTheme } from './brand-theme'

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
  jobId?: string
}): Promise<GeneratedVideoReel> {
  const genId = generationId()
  const jobId = opts.jobId ?? genId
  const brand = await loadSocialBrandTheme(opts.userId)
  const bullets = await extractReelBullets(opts.content)

  const carousel = await generateCarouselAssets({
    userId: opts.userId,
    content: opts.content,
    slideCount: 1,
    jobId,
  })
  const backgroundImageUrl = carousel.imageUrls[0]

  return withTempDir('video-reel-', async (tmpDir) => {
    const outputPath = path.join(tmpDir, 'reel.mp4')
    const probe = await buildVideoReel({
      prompt: `Cinematic subtle motion for ${brand.organizationName}: ${bullets[0]}`,
      backgroundImageUrl,
      bullets,
      outputPath,
      tmpDir,
    })

    const uploaded = await uploadVideoFile({
      userId: opts.userId,
      filePath: outputPath,
      s3Key: `social/${opts.userId}/${jobId}/video-reel.mp4`,
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

  const carousel: GeneratedCarousel = await generateCarouselAssets({
    userId: opts.userId,
    content: opts.content,
    slideCount,
    jobId,
  })

  const title = opts.title?.trim() || carousel.slides[0]?.headline || 'Watch this'

  return withTempDir('hook-video-', async (tmpDir) => {
    const outputPath = path.join(tmpDir, 'hook.mp4')
    const probe = await buildHookVideo({
      title,
      hookPrompt: `Dynamic opening hook: ${title}`,
      hookImageUrl: carousel.imageUrls[0],
      slideshowImageUrls: carousel.imageUrls.slice(1),
      outputPath,
      tmpDir,
    })

    const uploaded = await uploadVideoFile({
      userId: opts.userId,
      filePath: outputPath,
      s3Key: `social/${opts.userId}/${jobId}/hook-video.mp4`,
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
      s3Key: `social/${opts.userId}/${jobId}/quote-video.mp4`,
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
      s3Key: `social/${opts.userId}/${jobId}/loop-reel.mp4`,
      title: `Looped reel (${loopCount}×)`,
      width: probe.width,
      height: probe.height,
      jobId,
    })

    return { postType: 'video_reel' as const, ...uploaded, loopCount }
  })
}
