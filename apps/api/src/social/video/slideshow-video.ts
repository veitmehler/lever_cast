import path from 'node:path'
import fs from 'node:fs/promises'
import {
  downloadToFile,
  mergeAudioVideo,
  probeVideo,
  runFfmpeg,
  type VideoProbe,
} from './ffmpeg'

export type SlideshowVariant = 'feed' | 'story'

const DIMENSIONS: Record<SlideshowVariant, { width: number; height: number }> = {
  feed: { width: 1080, height: 1080 },
  story: { width: 1080, height: 1920 },
}

export interface SlideshowOptions {
  imageUrls: string[]
  outputPath: string
  variant?: SlideshowVariant
  secondsPerSlide?: number
  audioPath?: string
  kenBurns?: boolean
}

function scaleFilter(variant: SlideshowVariant, kenBurns: boolean, duration: number): string {
  const { width, height } = DIMENSIONS[variant]
  const base = `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=black`
  if (!kenBurns) return base
  const frames = Math.max(1, Math.round(duration * 30))
  return `${base},zoompan=z='min(zoom+0.001,1.08)':d=${frames}:s=${width}x${height}:fps=30`
}

/** Build an MP4 slideshow from ordered image URLs. */
export async function buildSlideshowVideo(opts: SlideshowOptions): Promise<VideoProbe> {
  const variant = opts.variant ?? 'feed'
  const secondsPerSlide = opts.secondsPerSlide ?? 3
  const kenBurns = opts.kenBurns ?? false
  const tmpDir = path.dirname(opts.outputPath)
  const localImages: string[] = []

  for (let i = 0; i < opts.imageUrls.length; i++) {
    const localPath = path.join(tmpDir, `slide-${i}.png`)
    await downloadToFile(opts.imageUrls[i], localPath)
    localImages.push(localPath)
  }

  if (localImages.length === 0) throw new Error('No images provided for slideshow')

  const segmentPaths: string[] = []
  for (let i = 0; i < localImages.length; i++) {
    const segPath = path.join(tmpDir, `seg-${i}.mp4`)
    const vf = scaleFilter(variant, kenBurns, secondsPerSlide)
    await runFfmpeg([
      '-loop',
      '1',
      '-t',
      String(secondsPerSlide),
      '-i',
      localImages[i],
      '-vf',
      vf,
      '-pix_fmt',
      'yuv420p',
      '-r',
      '30',
      segPath,
    ])
    segmentPaths.push(segPath)
  }

  const silentPath = path.join(tmpDir, 'slideshow-silent.mp4')
  if (segmentPaths.length === 1) {
    await fs.copyFile(segmentPaths[0], silentPath)
  } else {
    const listPath = path.join(tmpDir, 'slideshow-list.txt')
    await fs.writeFile(
      listPath,
      segmentPaths.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join('\n'),
    )
    await runFfmpeg([
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      listPath,
      '-c',
      'copy',
      silentPath,
    ])
  }

  if (opts.audioPath) {
    await mergeAudioVideo(silentPath, opts.audioPath, opts.outputPath)
  } else {
    await fs.copyFile(silentPath, opts.outputPath)
  }

  return probeVideo(opts.outputPath)
}

export function slideshowDimensions(variant: SlideshowVariant): { width: number; height: number } {
  return DIMENSIONS[variant]
}
