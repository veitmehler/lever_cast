import path from 'node:path'
import fs from 'node:fs/promises'
import {
  concatVideos,
  defaultFontPath,
  overlayBulletsOnVideo,
  overlayTitleOnVideo,
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
}

/** F6: fal hook clip with title overlay + carousel slideshow body. */
export async function buildHookVideo(opts: HookVideoOptions): Promise<VideoProbe> {
  const hookUrl = await generateSeedanceClip({
    prompt: opts.hookPrompt,
    imageUrl: opts.hookImageUrl,
    duration: opts.hookDuration ?? '5',
    resolution: '720p',
    aspectRatio: '1:1',
  })

  const hookRaw = path.join(opts.tmpDir, 'hook-raw.mp4')
  const hookTitled = path.join(opts.tmpDir, 'hook-titled.mp4')
  await downloadSeedanceClip(hookUrl, hookRaw)
  await overlayTitleOnVideo(hookRaw, hookTitled, opts.title, defaultFontPath())

  const bodyPath = path.join(opts.tmpDir, 'hook-body.mp4')
  await buildSlideshowVideo({
    imageUrls: opts.slideshowImageUrls,
    outputPath: bodyPath,
    variant: 'feed',
    secondsPerSlide: 3,
  })

  await concatVideos([hookTitled, bodyPath], opts.outputPath)
  return probeVideo(opts.outputPath)
}

export interface VideoReelOptions {
  prompt: string
  backgroundImageUrl: string
  bullets: string[]
  outputPath: string
  tmpDir: string
}

/** F2: 9:16 Seedance background + dark veil + centred ✓ bullets (no title). */
export async function buildVideoReel(opts: VideoReelOptions): Promise<VideoProbe> {
  const seedanceUrl = await generateSeedanceClip({
    prompt: opts.prompt,
    imageUrl: opts.backgroundImageUrl,
    duration: '6',
    resolution: '720p',
    aspectRatio: '9:16',
  })

  const rawPath = path.join(opts.tmpDir, 'reel-raw.mp4')
  const finalPath = path.join(opts.tmpDir, 'reel-overlay.mp4')
  await downloadSeedanceClip(seedanceUrl, rawPath)
  await overlayBulletsOnVideo(rawPath, finalPath, opts.bullets, defaultFontPath())
  await fs.copyFile(finalPath, opts.outputPath)
  return probeVideo(opts.outputPath)
}

export { loopVideo, assertStoryVideoConstraints } from './ffmpeg'
