import path from 'node:path'
import fs from 'node:fs/promises'
import {
  concatVideosReencode,
  defaultFontPath,
  overlayBulletsOnVideo,
  overlayTitleAndBulletsOnVideo,
  overlayTitleOnVideoFadeIn,
  probeVideo,
  runFfmpeg,
  type VideoProbe,
} from './ffmpeg'
import { generateSeedanceClip, downloadSeedanceClip } from './seedance'
import { buildSlideshowVideo, slideshowDimensions } from './slideshow-video'
import { logger } from '../../lib/logger'

export interface HookVideoOptions {
  title: string
  hookPrompt: string
  hookImageUrl?: string
  slideshowImageUrls: string[]
  outputPath: string
  tmpDir: string
  hookDuration?: '5'
  /** Uniform seconds-per-slide fallback when voiceover is disabled. Defaults to 4. */
  secondsPerSlide?: number
  /** Per-slide durations (seconds) — each slide holds its own duration. When
   *  provided, slideDurations.length must equal slideshowImageUrls.length. */
  slideDurations?: number[]
  /** Contiguous body-narration track (length == sum of slide durations). Muxed
   *  directly onto the slideshow body so narration starts on the first content slide. */
  voiceAudioPath?: string
}

export interface HookVideoResult {
  probe: VideoProbe
  /** Local path to the raw (pre-title, pre-concat) Seedance clip — caller should upload to S3. */
  hookRawPath: string
}

const MAX_INTRO_SECS = 5
const FEED_DIMS = slideshowDimensions('feed')

/** F6: Seedance intro clip with title fade-in + content slideshow with optional voiceover.
 *
 * Audio strategy (when voiceAudioPath is provided):
 *  1. Build the slideshow body with per-slide durations matching each narration clip.
 *  2. Mux the body narration onto that slideshow (same pattern as S3 quote video).
 *  3. Re-encode-concat the silent intro + narrated body — no duration probing or
 *     lead-in silence math. Narration therefore begins exactly when the first content
 *     slide appears because it is physically bound to the body segment.
 */
export async function buildHookVideo(opts: HookVideoOptions): Promise<HookVideoResult> {
  logger.info(
    { slideCount: opts.slideshowImageUrls.length, hasVoiceAudio: !!opts.voiceAudioPath },
    'buildHookVideo: start — generating Seedance clip',
  )
  const hookUrl = await generateSeedanceClip({
    prompt: opts.hookPrompt,
    imageUrl: opts.hookImageUrl,
    duration: opts.hookDuration ?? '5',
    resolution: '720p',
    aspectRatio: '1:1',
  })
  logger.info({ hookUrl }, 'buildHookVideo: Seedance clip generated')

  const hookRaw    = path.join(opts.tmpDir, 'hook-raw.mp4')
  const hookTitled = path.join(opts.tmpDir, 'hook-titled.mp4')
  await downloadSeedanceClip(hookUrl, hookRaw)
  await overlayTitleOnVideoFadeIn(hookRaw, hookTitled, opts.title, defaultFontPath())

  // Seedance sometimes returns clips much longer than the requested duration.
  const introProbedDuration = (await probeVideo(hookTitled)).duration
  if (introProbedDuration > MAX_INTRO_SECS + 0.5) {
    const hookTitledTrimmed = path.join(opts.tmpDir, 'hook-titled-trimmed.mp4')
    await runFfmpeg([
      '-i', hookTitled,
      '-t', String(MAX_INTRO_SECS),
      '-c:v', 'libx264', '-crf', '18', '-preset', 'fast',
      '-an',
      hookTitledTrimmed,
    ])
    await fs.rename(hookTitledTrimmed, hookTitled)
    logger.info({ originalDuration: introProbedDuration, trimmedTo: MAX_INTRO_SECS }, 'buildHookVideo: intro trimmed')
  }

  logger.info('buildHookVideo: intro clip titled')

  const bodyPath = path.join(opts.tmpDir, 'hook-body.mp4')
  await buildSlideshowVideo({
    imageUrls: opts.slideshowImageUrls,
    outputPath: bodyPath,
    variant: 'feed',
    slideDurations: opts.slideDurations,
    secondsPerSlide: opts.secondsPerSlide ?? 4,
    audioPath: opts.voiceAudioPath,
  })
  logger.info(
    { slideDurations: opts.slideDurations, hasVoiceAudio: !!opts.voiceAudioPath },
    'buildHookVideo: slideshow body built',
  )

  await concatVideosReencode(
    [hookTitled, bodyPath],
    opts.outputPath,
    { width: FEED_DIMS.width, height: FEED_DIMS.height, fps: 30 },
  )
  logger.info(
    { hasVoiceAudio: !!opts.voiceAudioPath },
    'buildHookVideo: intro + body concatenated',
  )

  const probe = await probeVideo(opts.outputPath)
  logger.info({ duration: probe.duration, width: probe.width, height: probe.height }, 'buildHookVideo: complete')
  return { probe, hookRawPath: hookRaw }
}

export interface VideoReelOptions {
  prompt: string
  /** Optional background image sent to Seedance for image-to-video. Omit for pure text-to-video. */
  backgroundImageUrl?: string
  /** Headline displayed above the bullets using Helvetica Neue Regular. */
  headline?: string
  bullets: string[]
  outputPath: string
  tmpDir: string
  /** Override the Fal.ai model slug. Defaults to Seedance v1 Lite text-to-video. */
  falModel?: string
}

/** F2/S2: 9:16 Seedance background + dark veil + headline + ✓ bullet list. */
export async function buildVideoReel(opts: VideoReelOptions): Promise<VideoProbe> {
  const seedanceUrl = await generateSeedanceClip({
    prompt: opts.prompt,
    imageUrl: opts.backgroundImageUrl,
    duration: '6',
    resolution: '720p',
    aspectRatio: '9:16',
    model: opts.falModel,
  })

  const rawPath = path.join(opts.tmpDir, 'reel-raw.mp4')
  const finalPath = path.join(opts.tmpDir, 'reel-overlay.mp4')
  await downloadSeedanceClip(seedanceUrl, rawPath)

  if (opts.headline) {
    await overlayTitleAndBulletsOnVideo(rawPath, finalPath, opts.headline, opts.bullets)
  } else {
    await overlayBulletsOnVideo(rawPath, finalPath, opts.bullets)
  }

  await fs.copyFile(finalPath, opts.outputPath)
  return probeVideo(opts.outputPath)
}

export { loopVideo, assertStoryVideoConstraints } from './ffmpeg'
