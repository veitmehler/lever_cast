import path from 'node:path'
import fs from 'node:fs/promises'
import {
  concatAudioFiles,
  makeSilenceAudio,
  padAudioToDuration,
  probeVideo,
} from './ffmpeg'
import { synthesizeSpeech } from '../../lib/elevenlabs/client'
import { logger } from '../../lib/logger'

export interface PerSlideNarrationResult {
  /** One duration (seconds) per slide — the slideshow holds each slide this long. */
  slideDurations: number[]
  /** Contiguous body-narration track whose length equals the sum of slideDurations. */
  audioPath: string
}

export interface PerSlideNarrationOptions {
  apiKey: string
  voiceId: string
  modelId?: string
  stability?: number
  similarity?: number
  speed?: number
  /** Spoken text per slide, index-aligned with the slide images. Empty entries are allowed. */
  slideTexts: string[]
  tmpDir: string
  /** Trailing silence (seconds) appended after each slide's speech. Defaults to 0.6. */
  paddingSeconds?: number
  /** Duration (seconds) for slides that have no spoken text. Defaults to 3. */
  emptySlideSeconds?: number
}

/**
 * Synthesize one narration clip per slide, then concatenate them into a single
 * contiguous track. Because each slide's video duration is set to the exact
 * length of its own narration clip (speech + a little padding), the spoken
 * words always match the slide that is on screen — there is no character-offset
 * inference or text-normalization guesswork.
 */
export async function buildPerSlideNarration(
  opts: PerSlideNarrationOptions,
): Promise<PerSlideNarrationResult> {
  const padding = opts.paddingSeconds ?? 0.6
  const emptySeconds = opts.emptySlideSeconds ?? 3

  const segmentPaths: string[] = []
  const slideDurations: number[] = []

  logger.info({ totalSlides: opts.slideTexts.length, voiceId: opts.voiceId }, 'buildPerSlideNarration: start')

  for (let i = 0; i < opts.slideTexts.length; i++) {
    const text = opts.slideTexts[i]?.trim() ?? ''
    const segPath = path.join(opts.tmpDir, `narration-seg-${i}.m4a`)

    if (!text) {
      logger.info({ slide: i }, 'buildPerSlideNarration: empty slide — using silence')
      await makeSilenceAudio(segPath, emptySeconds)
      slideDurations.push(emptySeconds)
      segmentPaths.push(segPath)
      continue
    }

    logger.info({ slide: i, textLength: text.length }, 'buildPerSlideNarration: synthesizing speech')
    const rawMp3 = path.join(opts.tmpDir, `narration-raw-${i}.mp3`)
    const audio = await synthesizeSpeech({
      apiKey: opts.apiKey,
      voiceId: opts.voiceId,
      text,
      modelId: opts.modelId,
      stability: opts.stability,
      similarityBoost: opts.similarity,
      speed: opts.speed,
    })
    await fs.writeFile(rawMp3, audio)

    const speechDuration = (await probeVideo(rawMp3)).duration
    const segDuration = Math.max(1, speechDuration) + padding
    logger.info({ slide: i, speechDuration, segDuration }, 'buildPerSlideNarration: speech synthesized')
    await padAudioToDuration(rawMp3, segPath, segDuration)

    slideDurations.push(segDuration)
    segmentPaths.push(segPath)
  }

  const audioPath = path.join(opts.tmpDir, 'narration-body.m4a')
  logger.info({ segmentCount: segmentPaths.length, slideDurations }, 'buildPerSlideNarration: concatenating segments')
  await concatAudioFiles(segmentPaths, audioPath)

  logger.info({ audioPath, totalDuration: slideDurations.reduce((a, b) => a + b, 0) }, 'buildPerSlideNarration: complete')
  return { slideDurations, audioPath }
}
