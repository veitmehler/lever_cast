import path from 'node:path'
import fs from 'node:fs/promises'
import {
  concatAudioFiles,
  concatVideos,
  defaultFontPath,
  makeSilenceAudio,
  mergeAudioVideo,
  overlayBulletsOnVideo,
  overlayTitleAndBulletsOnVideo,
  overlayTitleOnVideoFadeIn,
  probeVideo,
  type VideoProbe,
} from './ffmpeg'
import { generateSeedanceClip, downloadSeedanceClip } from './seedance'
import { buildSlideshowVideo } from './slideshow-video'
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
  /** Path to the contiguous body-narration track (length == sum of slide
   *  durations). When provided it is placed AFTER a lead-in silence equal to the
   *  intro length so narration starts exactly on the first content slide. */
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
 *  1. Build a silent intro (hookTitled) and a silent slideshow body whose slide
 *     durations match each slide's narration clip.
 *  2. Concat intro + body into a silent video (concat demuxer, as before).
 *  3. Derive the intro length from the rendered files (full − body) so it can't
 *     drift, build a lead-in silence of that length, and prepend it to the body
 *     narration to form a full-length audio track.
 *  4. Mux that audio onto the silent video. Narration therefore begins exactly
 *     when the first content slide appears — no probe-based delay required.
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
  logger.info('buildHookVideo: intro clip titled')

  const bodyPath = path.join(opts.tmpDir, 'hook-body.mp4')
  await buildSlideshowVideo({
    imageUrls: opts.slideshowImageUrls,
    outputPath: bodyPath,
    variant: 'feed',
    slideDurations: opts.slideDurations,
    secondsPerSlide: opts.secondsPerSlide ?? 4,
    // No audio here — muxed after concat so timing is relative to the full video.
  })
  logger.info({ slideDurations: opts.slideDurations }, 'buildHookVideo: slideshow body built')

  if (opts.voiceAudioPath) {
    const silentFull = path.join(opts.tmpDir, 'hook-silent.mp4')
    await concatVideos([hookTitled, bodyPath], silentFull)

    // Intro length = full video − body video, measured from the rendered files
    // so it is exact (no reliance on a single intro-clip probe).
    const fullDuration = (await probeVideo(silentFull)).duration
    const bodyDuration = (await probeVideo(bodyPath)).duration
    const introDuration = Math.max(0, fullDuration - bodyDuration)
    logger.info({ fullDuration, bodyDuration, introDuration }, 'buildHookVideo: durations probed')

    let fullAudio = opts.voiceAudioPath
    if (introDuration > 0.05) {
      const leadSilence = path.join(opts.tmpDir, 'hook-lead-silence.m4a')
      await makeSilenceAudio(leadSilence, introDuration)
      fullAudio = path.join(opts.tmpDir, 'hook-full-audio.m4a')
      await concatAudioFiles([leadSilence, opts.voiceAudioPath], fullAudio)
      logger.info({ introDuration }, 'buildHookVideo: lead silence prepended')
    }

    await mergeAudioVideo(silentFull, fullAudio, opts.outputPath)
    logger.info('buildHookVideo: audio merged')
  } else {
    logger.info('buildHookVideo: no voiceover — concatenating silent video')
    await concatVideos([hookTitled, bodyPath], opts.outputPath)
  }

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
