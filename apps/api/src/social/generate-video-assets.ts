import fs from 'node:fs/promises'
import path from 'node:path'
import {
  withTempDir,
  downloadToFile,
  overlayTitleAndBulletsOnVideo,
  overlayBulletsOnVideo,
  overlayTitleOnVideoFadeIn,
  rescaleVideo,
  probeVideo,
  concatVideos,
  defaultFontPath,
} from './video/ffmpeg'
import { buildVideoReel, buildHookVideo } from './video/hook-video'
import { buildQuoteVideo, buildLoopedStoryReel } from './video/quote-video'
import { buildSlideshowVideo } from './video/slideshow-video'
import { generateSeedanceClip, downloadSeedanceClip } from './video/seedance'
import { registerSocialMedia, registerSocialVideo } from './media-register'
import {
  generateCarouselAssets,
  generateQuoteCardAsset,
  type GeneratedCarousel,
} from './generate-assets'
import { extractReelBullets } from './generators/reel-bullets'
import { generateVideoReelPrompt } from './generators/video-reel-prompt'
import { generateQuoteVideoNarration } from './generators/quote-video-narration'
import { generatePitchSlideText } from './generators/pitch-slide-text'
import { buildPitchSlidePng } from './compositors/carousel'
import { loadSocialBrandTheme } from './brand-theme'
import { loadPromptTemplate } from '../article-pipeline/enrichment/prompt-template'
import { synthesizeSpeech } from '../lib/elevenlabs/client'
import { getVoiceSettings } from '../lib/elevenlabs/settings'

function generationId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export interface GeneratedVideoReel {
  postType: 'video_reel'
  videoUrl: string
  mediaId: string
  bullets: string[]
  /** Pre-overlay Seedance background URL — stored so S2 can reuse F2's background. */
  rawVideoUrl: string
  rawMediaId: string
}

export interface GeneratedHookVideo {
  postType: 'hook_video'
  videoUrl: string
  mediaId: string
  title: string
  /** Carousel image URLs generated for this hook video (index 0 = hook slide, 1+ = content). */
  carouselImageUrls: string[]
  /** Raw (pre-overlay) background image URLs — parallel array to carouselImageUrls. */
  carouselBackgroundImageUrls: string[]
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

    // Upload the raw (pre-overlay) background so S2 can reuse it with fresh bullets.
    const rawPath = path.join(tmpDir, 'reel-raw.mp4')
    const [uploaded, rawUploaded] = await Promise.all([
      uploadVideoFile({
        userId: opts.userId,
        filePath: outputPath,
        s3Key: `social/${opts.userId}/${jobId}/video-reel-${genId}.mp4`,
        title: 'Video reel',
        width: probe.width,
        height: probe.height,
        jobId,
      }),
      uploadVideoFile({
        userId: opts.userId,
        filePath: rawPath,
        s3Key: `social/${opts.userId}/${jobId}/video-reel-raw-${genId}.mp4`,
        title: 'Video reel (raw background)',
        width: probe.width,
        height: probe.height,
        jobId,
      }),
    ])

    return {
      postType: 'video_reel' as const,
      ...uploaded,
      bullets,
      rawVideoUrl: rawUploaded.videoUrl,
      rawMediaId: rawUploaded.mediaId,
    }
  })
}

/**
 * S2: reuse F2's raw Seedance background but generate fresh bullets from a
 * different content section, producing a unique story video.
 */
export async function generateStoriesReelAsset(opts: {
  userId: string
  /** Raw (pre-overlay) background video URL from F2. */
  rawVideoUrl: string
  /** Content for this slot's bullet generation (different H2 section from F2). */
  content: string
  topic?: string
  jobId?: string
}): Promise<GeneratedVideoReel> {
  const genId = generationId()
  const jobId = opts.jobId ?? genId

  const brand = await loadSocialBrandTheme(opts.userId)

  const topic = opts.topic?.trim() ||
    opts.content.replace(/<[^>]+>/g, ' ').split(/[\n.!?]/)[0]?.trim().slice(0, 200) ||
    brand.organizationName

  const { headline, bullets } = await extractReelBullets({
    content: opts.content,
    topic,
    details: opts.content.replace(/<[^>]+>/g, ' ').slice(0, 1500),
    specialInstructions: brand.videoSpecialInstructions,
  })

  return withTempDir('stories-reel-', async (tmpDir) => {
    const rawPath  = path.join(tmpDir, 'reel-raw.mp4')
    const finalPath = path.join(tmpDir, 'reel-overlay.mp4')

    await downloadToFile(opts.rawVideoUrl, rawPath)

    if (headline) {
      await overlayTitleAndBulletsOnVideo(rawPath, finalPath, headline, bullets)
    } else {
      await overlayBulletsOnVideo(rawPath, finalPath, bullets)
    }

    const probe = await probeVideo(finalPath)

    const uploaded = await uploadVideoFile({
      userId: opts.userId,
      filePath: finalPath,
      s3Key: `social/${opts.userId}/${jobId}/stories-reel-${genId}.mp4`,
      title: 'Stories reel',
      width: probe.width,
      height: probe.height,
      jobId,
    })

    return {
      postType: 'video_reel' as const,
      ...uploaded,
      bullets,
      rawVideoUrl: opts.rawVideoUrl,
      rawMediaId: '',
    }
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

  const [carousel, brand, voice] = await Promise.all([
    generateCarouselAssets({
      userId: opts.userId,
      content: opts.content,
      slideCount,
      jobId,
    }),
    loadSocialBrandTheme(opts.userId),
    getVoiceSettings(opts.userId),
  ])

  const title = opts.title?.trim() || carousel.slides[0]?.headline || 'Watch this'

  // Content slides are everything after the hook/title slide (index 0).
  // The title is overlaid directly on the Seedance intro clip, so slide 0 is not
  // needed in the slideshow and would create a duplicate title frame.
  const contentSlideUrls = carousel.imageUrls.slice(1)

  const topic = title
  const details = opts.content.replace(/<[^>]+>/g, ' ').slice(0, 1500)

  // Generate Seedance video prompt and voiceover narration in parallel
  const [hookVideoPrompt, narrationText] = await Promise.all([
    generateVideoReelPrompt({
      topic,
      details,
      specialInstructions: brand.videoSpecialInstructions,
      videoModel: 'fal-ai/bytedance/seedance/v1/lite/text-to-video',
    }),
    generateQuoteVideoNarration(opts.userId, opts.content).catch(() => ''),
  ])

  return withTempDir('hook-video-', async (tmpDir) => {
    const outputPath = path.join(tmpDir, 'hook.mp4')

    // Voiceover: synthesize if enabled, then derive slide duration from audio length
    let voiceAudioPath: string | undefined
    let secondsPerSlide = 4

    const canUseVoice =
      narrationText &&
      voice.voiceoverEnabled &&
      voice.apiKey &&
      voice.voiceId

    if (canUseVoice) {
      try {
        const mp3Buffer = await synthesizeSpeech({
          apiKey: voice.apiKey!,
          voiceId: voice.voiceId!,
          text: narrationText,
          modelId: voice.modelId,
          stability: voice.stability,
          similarityBoost: voice.similarity,
        })
        const audioFilePath = path.join(tmpDir, 'narration.mp3')
        await fs.writeFile(audioFilePath, mp3Buffer)
        // Measure the actual audio duration so slides fit the narration exactly
        const audioProbe = await probeVideo(audioFilePath)
        const audioDuration = audioProbe.duration
        if (audioDuration > 0 && contentSlideUrls.length > 0) {
          secondsPerSlide = audioDuration / contentSlideUrls.length
        }
        voiceAudioPath = audioFilePath
      } catch {
        // Non-fatal — fall back to silent slideshow with default timing
      }
    }

    const probe = await buildHookVideo({
      title,
      hookPrompt: hookVideoPrompt,
      // Pure T2V — no image input so Seedance has a clean background without
      // any baked-in text from the carousel hook slide.
      hookImageUrl: undefined,
      slideshowImageUrls: contentSlideUrls,
      outputPath,
      tmpDir,
      secondsPerSlide,
      voiceAudioPath,
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

    return {
      postType: 'hook_video',
      ...uploaded,
      title,
      carouselImageUrls: carousel.imageUrls,
      carouselBackgroundImageUrls: carousel.backgroundImageUrls,
    }
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

/**
 * S4: 9:16 story video.
 * Slide 1 = F4 hook carousel image (pre-baked title overlay), letterboxed to story.
 * Slide 2 = F4 raw background (content slide 1) center-cropped to 9:16 with a
 *   full-frame dark overlay + uniquely LLM-generated pitch text (centered, white).
 */
export async function generateStoryCarouselVideo(opts: {
  userId: string
  /** imageUrls[0] = pre-baked F4 hook slide. */
  imageUrls: string[]
  /** backgroundImageUrls[1] = raw background for F4 content slide 1. */
  backgroundImageUrls: string[]
  /** S4's own article section text — used to generate the pitch copy. */
  content: string
  topic: string
  jobId?: string
}): Promise<{ postType: 'pitch_carousel'; videoUrl: string; mediaId: string }> {
  const genId = generationId()
  const jobId = opts.jobId ?? genId

  const hookImageUrl  = opts.imageUrls[0]
  const rawBgUrl      = opts.backgroundImageUrls[1] ?? opts.backgroundImageUrls[0]
  if (!hookImageUrl) throw new Error('generateStoryCarouselVideo: no imageUrls provided')
  if (!rawBgUrl)     throw new Error('generateStoryCarouselVideo: no backgroundImageUrls provided')

  // Generate unique pitch text for this S4 run
  const pitchText = await generatePitchSlideText({
    topic: opts.topic,
    content: opts.content,
  })

  // Download raw background and composite the pitch slide PNG
  const bgResp   = await fetch(rawBgUrl)
  const bgBuffer = Buffer.from(await bgResp.arrayBuffer())
  const pitchPng = await buildPitchSlidePng(bgBuffer, pitchText)

  // Random 4–7 s per slide
  const secondsPerSlide = 4 + Math.floor(Math.random() * 4)

  // Register pitch PNG to S3 so buildSlideshowVideo can download it by URL
  const pitchRegistered = await registerSocialMedia({
    userId: opts.userId,
    buffer: pitchPng,
    s3Key: `social/${opts.userId}/${jobId}/story-pitch-${genId}.png`,
    title: 'Story pitch slide',
    altText: pitchText,
    source: 'carousel_slide',
    jobId,
    width: 1080,
    height: 1920,
  })

  return withTempDir('story-carousel-', async (tmpDir) => {
    const outputPath = path.join(tmpDir, 'story-carousel.mp4')

    const probe = await buildSlideshowVideo({
      imageUrls: [hookImageUrl, pitchRegistered.url],
      outputPath,
      variant: 'story',
      secondsPerSlide,
    })

    const uploaded = await uploadVideoFile({
      userId: opts.userId,
      filePath: outputPath,
      s3Key: `social/${opts.userId}/${jobId}/story-carousel-${genId}.mp4`,
      title: 'Story carousel video',
      width: probe.width,
      height: probe.height,
      jobId,
    })

    return { postType: 'pitch_carousel', ...uploaded }
  })
}

/**
 * S6: 9:16 story video with a fresh Fal.ai T2V intro clip (title fade-in) followed
 * by a pitch slide built from F6's raw content background.
 *
 * Flow:
 *  1. Generate Seedance T2V at 9:16 (720×1280)
 *  2. Overlay title with fade-in via overlayTitleOnVideoFadeIn
 *  3. Rescale to 1080×1920 to match the content slideshow
 *  4. Download F6 raw background, 9:16 crop-scale, overlay dark + LLM pitch text
 *  5. Concat intro clip + pitch slide
 */
export async function generateStoryHookVideo(opts: {
  userId: string
  title: string
  /** Article section text — used both for Seedance prompt and pitch copy. */
  content: string
  topic: string
  /** F6's backgroundImageUrls[1] — raw background (no text) from F6 content slide 1. */
  backgroundImageUrl: string
  jobId?: string
}): Promise<{ postType: 'pitch_hook'; videoUrl: string; mediaId: string }> {
  const genId = generationId()
  const jobId = opts.jobId ?? genId

  const brand = await loadSocialBrandTheme(opts.userId)

  // Run the Seedance video prompt and the pitch text LLM in parallel
  const [hookVideoPrompt, pitchText] = await Promise.all([
    generateVideoReelPrompt({
      topic: opts.title,
      details: opts.content.replace(/<[^>]+>/g, ' ').slice(0, 1500),
      specialInstructions: brand.videoSpecialInstructions,
      videoModel: 'fal-ai/bytedance/seedance/v1/lite/text-to-video',
    }),
    generatePitchSlideText({ topic: opts.topic, content: opts.content }),
  ])

  // Download raw background and composite the 9:16 pitch slide PNG
  const bgResp   = await fetch(opts.backgroundImageUrl)
  const bgBuffer = Buffer.from(await bgResp.arrayBuffer())
  const pitchPng = await buildPitchSlidePng(bgBuffer, pitchText)

  // Register pitch PNG to S3 so buildSlideshowVideo can download it by URL
  const pitchRegistered = await registerSocialMedia({
    userId: opts.userId,
    buffer: pitchPng,
    s3Key: `social/${opts.userId}/${jobId}/story-pitch-${genId}.png`,
    title: 'Story pitch slide',
    altText: pitchText,
    source: 'carousel_slide',
    jobId,
    width: 1080,
    height: 1920,
  })

  // Random 4–7 s for the pitch slide
  const secondsPerSlide = 4 + Math.floor(Math.random() * 4)

  return withTempDir('story-hook-', async (tmpDir) => {
    const hookRaw    = path.join(tmpDir, 'hook-raw.mp4')
    const hookTitled = path.join(tmpDir, 'hook-titled.mp4')
    const hookScaled = path.join(tmpDir, 'hook-scaled.mp4')
    const bodyPath   = path.join(tmpDir, 'hook-body.mp4')
    const outputPath = path.join(tmpDir, 'story-hook.mp4')

    // Step 1 — Seedance T2V at 9:16 (720×1280)
    const seedanceUrl = await generateSeedanceClip({
      prompt: hookVideoPrompt,
      duration: '5',
      resolution: '720p',
      aspectRatio: '9:16',
      jobId,
    })
    await downloadSeedanceClip(seedanceUrl, hookRaw)

    // Step 2 — Title fade-in overlay (result stays at 720×1280)
    await overlayTitleOnVideoFadeIn(hookRaw, hookTitled, opts.title, defaultFontPath())

    // Step 3 — Upscale to 1080×1920 so concat matches the slideshow dimensions
    await rescaleVideo(hookTitled, hookScaled, 1080, 1920)

    // Step 4 — Pitch slide as a timed clip (already 1080×1920)
    await buildSlideshowVideo({
      imageUrls: [pitchRegistered.url],
      outputPath: bodyPath,
      variant: 'story',
      secondsPerSlide,
    })

    // Step 5 — Concat intro clip + pitch slide
    await concatVideos([hookScaled, bodyPath], outputPath)
    const probe = await probeVideo(outputPath)

    const uploaded = await uploadVideoFile({
      userId: opts.userId,
      filePath: outputPath,
      s3Key: `social/${opts.userId}/${jobId}/story-hook-${genId}.mp4`,
      title: `Story hook — ${opts.title.slice(0, 40)}`,
      width: probe.width,
      height: probe.height,
      jobId,
    })

    return { postType: 'pitch_hook', ...uploaded }
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
