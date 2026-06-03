import path from 'node:path'
import fs from 'node:fs/promises'
import { assertStoryVideoConstraints, cropCenterToStoryAspect, loopVideo, withTempDir } from './ffmpeg'
import { buildSlideshowVideo } from './slideshow-video'
import { synthesizeSpeech } from '../../lib/elevenlabs/client'
import { getVoiceSettings } from '../../lib/elevenlabs/settings'

export interface QuoteVideoOptions {
  userId: string
  quoteImageUrls: string[]
  outputPath: string
  narrationText?: string
  secondsPerSlide?: number
}

/** S3: quote cards → timed slideshow video, optional ElevenLabs VO. */
export async function buildQuoteVideo(opts: QuoteVideoOptions): Promise<{
  probe: Awaited<ReturnType<typeof buildSlideshowVideo>>
  voiceoverUsed: boolean
}> {
  return withTempDir('quote-video-', async (tmpDir) => {
    const silentPath = path.join(tmpDir, 'quote-silent.mp4')
    let audioPath: string | undefined
    let voiceoverUsed = false

    const voice = await getVoiceSettings(opts.userId)
    if (opts.narrationText && voice.voiceoverEnabled && voice.apiKey && voice.voiceId) {
      const mp3 = await synthesizeSpeech({
        apiKey: voice.apiKey,
        voiceId: voice.voiceId,
        text: opts.narrationText,
        modelId: voice.modelId,
        stability: voice.stability,
        similarityBoost: voice.similarity,
      })
      audioPath = path.join(tmpDir, 'voiceover.mp3')
      await fs.writeFile(audioPath, mp3)
      voiceoverUsed = true
    }

    const probe = await buildSlideshowVideo({
      imageUrls: opts.quoteImageUrls,
      outputPath: opts.outputPath,
      variant: 'story',
      secondsPerSlide: opts.secondsPerSlide ?? 4,
      audioPath,
    })

    assertStoryVideoConstraints(probe)
    return { probe, voiceoverUsed }
  })
}

/** S2: loop an existing reel 3× for story read time. */
export async function buildLoopedStoryReel(
  sourceVideoUrl: string,
  outputPath: string,
  loopCount = 3,
): Promise<Awaited<ReturnType<typeof buildSlideshowVideo>>> {
  return withTempDir('loop-reel-', async (tmpDir) => {
    const { downloadToFile, probeVideo } = await import('./ffmpeg')
    const sourcePath = path.join(tmpDir, 'source.mp4')
    const croppedPath = path.join(tmpDir, 'story-cropped.mp4')
    await downloadToFile(sourceVideoUrl, sourcePath)
    // F2 feed reels are 1:1; Stories require 9:16 before looping.
    await cropCenterToStoryAspect(sourcePath, croppedPath)
    await loopVideo(croppedPath, outputPath, loopCount)
    const probe = await probeVideo(outputPath)
    assertStoryVideoConstraints(probe)
    return probe
  })
}
