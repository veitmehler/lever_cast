import path from 'node:path'
import fs from 'node:fs/promises'
import {
  concatVideos,
  defaultFontPath,
  mergeAudioVideoWithDelay,
  overlayBulletsOnVideo,
  overlayTitleAndBulletsOnVideo,
  overlayTitleOnVideoFadeIn,
  probeVideo,
  type VideoProbe,
} from './ffmpeg'
import { generateSeedanceClip, downloadSeedanceClip } from './seedance'
import { buildSlideshowVideo } from './slideshow-video'

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
  /** Per-slide durations derived from ElevenLabs timestamp alignment. When provided
   *  each slide holds its own duration and slideDurations.length must equal
   *  slideshowImageUrls.length. */
  slideDurations?: number[]
  /** Path to an ElevenLabs MP3 narration file. When provided it is delay-merged
   *  onto the final video AFTER the intro so narration starts with the first
   *  content slide, not from t=0. */
  voiceAudioPath?: string
}

export interface HookVideoResult {
  probe: VideoProbe
  /** Local path to the raw (pre-title, pre-concat) Seedance clip — caller should upload to S3. */
  hookRawPath: string
}

/** F6: Seedance intro clip with title fade-in + content slideshow with optional voiceover.
 *
 * Audio strategy (when voiceAudioPath is provided):
 *  1. Build a silent video-only intro (hookTitled).
 *  2. Build a silent video-only slideshow body (no audio embedded at body level).
 *  3. Concat intro + body as video-only.
 *  4. Delay-merge narration onto the full video with adelay = intro duration in ms,
 *     so speech starts precisely when the first content slide appears.
 */
export async function buildHookVideo(opts: HookVideoOptions): Promise<HookVideoResult> {
  const hookUrl = await generateSeedanceClip({
    prompt: opts.hookPrompt,
    imageUrl: opts.hookImageUrl,
    duration: opts.hookDuration ?? '5',
    resolution: '720p',
    aspectRatio: '1:1',
  })

  const hookRaw    = path.join(opts.tmpDir, 'hook-raw.mp4')
  const hookTitled = path.join(opts.tmpDir, 'hook-titled.mp4')
  await downloadSeedanceClip(hookUrl, hookRaw)
  await overlayTitleOnVideoFadeIn(hookRaw, hookTitled, opts.title, defaultFontPath())

  // Probe intro duration so we know how long to delay the narration.
  const introDuration = opts.voiceAudioPath
    ? (await probeVideo(hookTitled)).duration
    : 0

  const bodyPath = path.join(opts.tmpDir, 'hook-body.mp4')
  await buildSlideshowVideo({
    imageUrls: opts.slideshowImageUrls,
    outputPath: bodyPath,
    variant: 'feed',
    slideDurations: opts.slideDurations,
    secondsPerSlide: opts.secondsPerSlide ?? 4,
    // No audio here — merged after concat so timing is relative to the full video.
  })

  // Concat video-only (no audio stream on either segment).
  const silentOutputPath = opts.voiceAudioPath
    ? path.join(opts.tmpDir, 'hook-silent.mp4')
    : opts.outputPath
  await concatVideos([hookTitled, bodyPath], silentOutputPath)

  // Delay-merge narration so it starts at the first content slide.
  if (opts.voiceAudioPath) {
    await mergeAudioVideoWithDelay(
      silentOutputPath,
      opts.voiceAudioPath,
      opts.outputPath,
      introDuration * 1000,
    )
  }

  return { probe: await probeVideo(opts.outputPath), hookRawPath: hookRaw }
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
