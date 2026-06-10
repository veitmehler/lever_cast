import path from 'node:path'
import { assertStoryVideoConstraints, loopVideo, withTempDir } from './ffmpeg'
import { buildSlideshowVideo } from './slideshow-video'
import { buildPerSlideNarration } from './narration'
import { getVoiceSettings } from '../../lib/elevenlabs/settings'
import { logger } from '../../lib/logger'

export interface QuoteVideoOptions {
  userId: string
  quoteImageUrls: string[]
  /** Per-slide spoken text used to sync slide durations to speech timing. */
  slideTexts: string[]
  outputPath: string
  /** Fallback seconds-per-slide used when voiceover is disabled. Defaults to 4. */
  secondsPerSlide?: number
}

/** S3: quote cards → timed slideshow video, slide durations synced to ElevenLabs VO. */
export async function buildQuoteVideo(opts: QuoteVideoOptions): Promise<{
  probe: Awaited<ReturnType<typeof buildSlideshowVideo>>
  voiceoverUsed: boolean
}> {
  return withTempDir('quote-video-', async (tmpDir) => {
    let audioPath: string | undefined
    let slideDurations: number[] | undefined
    let voiceoverUsed = false

    const voice = await getVoiceSettings(opts.userId)
    const hasText = opts.slideTexts.some((t) => t.trim().length > 0)

    logger.info(
      {
        hasText,
        voiceoverEnabled: voice.voiceoverEnabled,
        hasApiKey: !!voice.apiKey,
        hasVoiceId: !!voice.voiceId,
        slideCount: opts.slideTexts.length,
      },
      'buildQuoteVideo: voiceover check',
    )

    if (hasText && voice.voiceoverEnabled && voice.apiKey && voice.voiceId) {
      try {
        // Synthesize one clip per quote so each slide is shown for exactly the
        // length of its own narration (index-aligned with quoteImageUrls).
        const narration = await buildPerSlideNarration({
          apiKey: voice.apiKey,
          voiceId: voice.voiceId,
          modelId: voice.modelId,
          stability: voice.stability,
          similarity: voice.similarity,
          speed: voice.speed,
          slideTexts: opts.slideTexts,
          tmpDir,
        })
        audioPath = narration.audioPath
        slideDurations = narration.slideDurations
        voiceoverUsed = true
        logger.info({ slideDurations }, 'buildQuoteVideo: narration complete')
      } catch (err) {
        logger.error({ err }, 'buildQuoteVideo: narration failed — falling back to silent slideshow')
      }
    }

    const probe = await buildSlideshowVideo({
      imageUrls: opts.quoteImageUrls,
      outputPath: opts.outputPath,
      variant: 'story',
      slideDurations,
      secondsPerSlide: opts.secondsPerSlide ?? 4,
      audioPath,
    })

    assertStoryVideoConstraints(probe)
    return { probe, voiceoverUsed }
  })
}

/** S2: loop F2's 9:16 reel 3× for story read time (no crop — F2 is already 9:16). */
export async function buildLoopedStoryReel(
  sourceVideoUrl: string,
  outputPath: string,
  loopCount = 3,
): Promise<Awaited<ReturnType<typeof buildSlideshowVideo>>> {
  return withTempDir('loop-reel-', async (tmpDir) => {
    const { downloadToFile, probeVideo } = await import('./ffmpeg')
    const sourcePath = path.join(tmpDir, 'source.mp4')
    await downloadToFile(sourceVideoUrl, sourcePath)
    await loopVideo(sourcePath, outputPath, loopCount)
    const probe = await probeVideo(outputPath)
    assertStoryVideoConstraints(probe)
    return probe
  })
}
