import path from 'node:path'
import fs from 'node:fs/promises'
import {
  concatVideos,
  defaultFontPath,
  downloadToFile,
  overlayTitleOnVideo,
  probeVideo,
  runFfmpeg,
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

export interface ReelBulletsOverlayOptions {
  inputVideoPath: string
  outputPath: string
  bullets: string[]
  tmpDir: string
}

/** Overlay bullet list text on a video reel (F2). */
export async function overlayReelBullets(opts: ReelBulletsOverlayOptions): Promise<void> {
  const lines = opts.bullets.slice(0, 5)
  const filters = lines.map((bullet, i) => {
    const text = bullet.replace(/\\/g, '\\\\').replace(/:/g, '\\:').replace(/'/g, "\\'").slice(0, 60)
    const y = 0.55 + i * 0.08
    return `drawtext=fontfile=${defaultFontPath()}:text='• ${text}':fontcolor=white:fontsize=36:x=w*0.08:y=h*${y.toFixed(2)}:box=1:boxcolor=black@0.4:boxborderw=8`
  })
  await runFfmpeg([
    '-i',
    opts.inputVideoPath,
    '-vf',
    filters.join(','),
    '-c:a',
    'copy',
    opts.outputPath,
  ])
}

export interface VideoReelOptions {
  prompt: string
  backgroundImageUrl: string
  bullets: string[]
  outputPath: string
  tmpDir: string
}

/** F2: Seedance background + bullet overlays. */
export async function buildVideoReel(opts: VideoReelOptions): Promise<VideoProbe> {
  const seedanceUrl = await generateSeedanceClip({
    prompt: opts.prompt,
    imageUrl: opts.backgroundImageUrl,
    duration: '5',
    resolution: '720p',
    aspectRatio: '1:1',
  })

  const rawPath = path.join(opts.tmpDir, 'reel-raw.mp4')
  const finalPath = path.join(opts.tmpDir, 'reel-overlay.mp4')
  await downloadSeedanceClip(seedanceUrl, rawPath)
  await overlayReelBullets({
    inputVideoPath: rawPath,
    outputPath: finalPath,
    bullets: opts.bullets,
    tmpDir: opts.tmpDir,
  })
  await fs.copyFile(finalPath, opts.outputPath)
  return probeVideo(opts.outputPath)
}

export { loopVideo, assertStoryVideoConstraints } from './ffmpeg'
