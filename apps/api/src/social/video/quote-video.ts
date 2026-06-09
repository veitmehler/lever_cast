import path from 'node:path'
import fs from 'node:fs/promises'
import { assertStoryVideoConstraints, loopVideo, withTempDir } from './ffmpeg'
import { buildSlideshowVideo } from './slideshow-video'
import {
  synthesizeSpeechWithTimestamps,
  computeSlideDurations,
} from '../../lib/elevenlabs/client'
import { getVoiceSettings } from '../../lib/elevenlabs/settings'

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
    const slideTexts = opts.slideTexts.filter((t) => t.trim().length > 0)

    if (slideTexts.length > 0 && voice.voiceoverEnabled && voice.apiKey && voice.voiceId) {
      try {
        const fullText = slideTexts.join(' ')
        const { audio, alignment } = await synthesizeSpeechWithTimestamps({
          apiKey: voice.apiKey,
          voiceId: voice.voiceId,
          text: fullText,
          modelId: voice.modelId,
          stability: voice.stability,
          similarityBoost: voice.similarity,
          speed: voice.speed,
        })
        audioPath = path.join(tmpDir, 'voiceover.mp3')
        await fs.writeFile(audioPath, audio)
        slideDurations = computeSlideDurations(slideTexts, alignment)
        voiceoverUsed = true
      } catch {
        // Non-fatal — fall back to silent slideshow with default timing
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
