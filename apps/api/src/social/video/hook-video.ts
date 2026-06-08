import path from 'node:path'
import fs from 'node:fs/promises'
import {
  concatVideos,
  defaultFontPath,
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
  /** Seconds each content slide is held. If voiceAudioPath is set this should
   *  be derived from the audio duration. Defaults to 4. */
  secondsPerSlide?: number
  /** Path to an ElevenLabs MP3 narration file. When provided it is merged into
   *  the slideshow body (not the Seedance intro clip). */
  voiceAudioPath?: string
}

/** F6: Seedance intro clip with title fade-in + content slideshow with optional voiceover. */
export async function buildHookVideo(opts: HookVideoOptions): Promise<VideoProbe> {
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
  // Always overlay the title using the fade-in variant (starts at t=1s, 0.5s fade)
  await overlayTitleOnVideoFadeIn(hookRaw, hookTitled, opts.title, defaultFontPath())

  const bodyPath = path.join(opts.tmpDir, 'hook-body.mp4')
  await buildSlideshowVideo({
    imageUrls: opts.slideshowImageUrls,
    outputPath: bodyPath,
    variant: 'feed',
    secondsPerSlide: opts.secondsPerSlide ?? 4,
    audioPath: opts.voiceAudioPath,
  })

  await concatVideos([hookTitled, bodyPath], opts.outputPath)
  return probeVideo(opts.outputPath)
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
