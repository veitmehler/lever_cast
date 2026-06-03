import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'

const execFileAsync = promisify(execFile)

export function ffmpegBin(): string {
  return process.env.FFMPEG_PATH || 'ffmpeg'
}

export function ffprobeBin(): string {
  return process.env.FFPROBE_PATH || 'ffprobe'
}

export function defaultFontPath(): string {
  return process.env.FFMPEG_FONT_PATH || '/usr/share/fonts/liberation/LiberationSans-Bold.ttf'
}

export async function runFfmpeg(args: string[]): Promise<void> {
  await execFileAsync(ffmpegBin(), ['-y', ...args], {
    maxBuffer: 64 * 1024 * 1024,
  })
}

export interface VideoProbe {
  duration: number
  width: number
  height: number
}

export async function probeVideo(filePath: string): Promise<VideoProbe> {
  const { stdout } = await execFileAsync(ffprobeBin(), [
    '-v',
    'error',
    '-select_streams',
    'v:0',
    '-show_entries',
    'stream=width,height,duration',
    '-show_entries',
    'format=duration',
    '-of',
    'json',
    filePath,
  ])
  const parsed = JSON.parse(stdout) as {
    streams?: Array<{ width?: number; height?: number; duration?: string }>
    format?: { duration?: string }
  }
  const stream = parsed.streams?.[0]
  const duration = parseFloat(stream?.duration ?? parsed.format?.duration ?? '0')
  return {
    duration,
    width: stream?.width ?? 0,
    height: stream?.height ?? 0,
  }
}

export async function withTempDir<T>(prefix: string, fn: (dir: string) => Promise<T>): Promise<T> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), prefix))
  try {
    return await fn(dir)
  } finally {
    await fs.rm(dir, { recursive: true, force: true }).catch(() => {})
  }
}

export async function downloadToFile(url: string, dest: string): Promise<void> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`)
  await fs.writeFile(dest, Buffer.from(await res.arrayBuffer()))
}

/** Enforce IG/FB story video constraints (≤60s, ≥540×960, ~9:16). */
export function assertStoryVideoConstraints(probe: VideoProbe): void {
  if (probe.duration > 60.5) {
    throw new Error(`Story video is ${probe.duration.toFixed(1)}s — maximum is 60s`)
  }
  if (probe.width < 540 || probe.height < 960) {
    throw new Error(`Story video is ${probe.width}×${probe.height} — minimum is 540×960`)
  }
  const ratio = probe.width / probe.height
  if (Math.abs(ratio - 9 / 16) > 0.08) {
    throw new Error(`Story video aspect ratio must be 9:16 (got ${probe.width}×${probe.height})`)
  }
}

export async function concatVideos(segmentPaths: string[], outputPath: string): Promise<void> {
  const listPath = outputPath.replace(/\.mp4$/, '-concat.txt')
  const listContent = segmentPaths.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join('\n')
  await fs.writeFile(listPath, listContent)
  await runFfmpeg(['-f', 'concat', '-safe', '0', '-i', listPath, '-c', 'copy', outputPath])
}

/**
 * Center-crop (then scale) to 540×960 so feed reels (e.g. 1:1 F2) satisfy story constraints.
 */
export async function cropCenterToStoryAspect(
  inputPath: string,
  outputPath: string,
): Promise<VideoProbe> {
  await runFfmpeg([
    '-i',
    inputPath,
    '-vf',
    'scale=540:960:force_original_aspect_ratio=increase,crop=540:960',
    '-c:a',
    'copy',
    outputPath,
  ])
  return probeVideo(outputPath)
}

export async function loopVideo(inputPath: string, outputPath: string, times: number): Promise<void> {
  if (times < 2) {
    await fs.copyFile(inputPath, outputPath)
    return
  }
  await runFfmpeg([
    '-stream_loop',
    String(times - 1),
    '-i',
    inputPath,
    '-c',
    'copy',
    outputPath,
  ])
}

export async function mergeAudioVideo(
  videoPath: string,
  audioPath: string,
  outputPath: string,
): Promise<void> {
  await runFfmpeg([
    '-i',
    videoPath,
    '-i',
    audioPath,
    '-c:v',
    'copy',
    '-c:a',
    'aac',
    '-shortest',
    outputPath,
  ])
}

function escapeDrawtext(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/:/g, '\\:')
    .replace(/'/g, "\\'")
    .replace(/%/g, '\\%')
}

export async function overlayTitleOnVideo(
  inputPath: string,
  outputPath: string,
  title: string,
  fontPath: string = defaultFontPath(),
): Promise<void> {
  const safeTitle = escapeDrawtext(title.slice(0, 80))
  await runFfmpeg([
    '-i',
    inputPath,
    '-vf',
    `drawtext=fontfile=${fontPath}:text='${safeTitle}':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=h*0.12:box=1:boxcolor=black@0.45:boxborderw=12`,
    '-c:a',
    'copy',
    outputPath,
  ])
}
