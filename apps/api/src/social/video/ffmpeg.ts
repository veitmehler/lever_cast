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

/** Bundled Helvetica Neue Regular. */
export function helveticaNeueRegularFontPath(): string {
  return (
    process.env.HELVETICA_NEUE_REGULAR_FONT_PATH ||
    '/usr/share/fonts/helvetica-neue/HelveticaNeue-Regular.ttf'
  )
}

/** Bundled Helvetica Neue Light — used for F2/S2 video reel bullet overlays. */
export function helveticaNeweLightFontPath(): string {
  return (
    process.env.HELVETICA_NEUE_LIGHT_FONT_PATH ||
    '/usr/share/fonts/helvetica-neue/HelveticaNeue-Light.ttf'
  )
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

/**
 * Escape text for a single-quoted `drawtext=text='...'` value used together
 * with `expansion=none`.
 *
 * The libavfilter parser splits filter options on `:` even inside single
 * quotes, so the colon (and backslash and quote) must be backslash-escaped at
 * the filtergraph level; the parser consumes those backslashes, so nothing is
 * rendered literally. The surrounding single quotes are still required to
 * preserve leading spaces (continuation-line indentation) and any commas.
 *
 * `%` is deliberately NOT escaped: with `expansion=none` it prints verbatim,
 * whereas the old `\%` escaping triggered a "Stray %" error that silently
 * dropped any line containing a percent sign.
 */
function escapeDrawtext(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/:/g, '\\:')
    .replace(/'/g, "\\'")
}

/** Minimal word-wrap used for title overlay sizing (mirrors svg-utils wrapText). */
function wrapTitle(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.trim().split(/\s+/)
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (candidate.length <= maxChars) {
      current = candidate
    } else {
      if (current) lines.push(current)
      current = word
      if (lines.length >= maxLines) break
    }
  }
  if (current && lines.length < maxLines) lines.push(current)
  return lines.slice(0, maxLines)
}

/**
 * Overlay the article title on a video clip using the carousel title-slide
 * design: a dark semi-transparent box sized only around the text (not a
 * full-frame veil), centred slightly above the vertical midpoint.
 *
 * Layout values are scaled to the actual video dimensions so the design holds
 * for both 720×720 Seedance clips and 1080×1080 slideshow frames.
 */
export async function overlayTitleOnVideo(
  inputPath: string,
  outputPath: string,
  title: string,
  fontPath: string = defaultFontPath(),
): Promise<void> {
  const { width, height } = await probeVideo(inputPath)
  const scale = height / 1080

  const lines = wrapTitle(title, 22, 5)
  const fontSize  = Math.round(52  * scale)
  const lineH     = Math.round(68  * scale)
  const boxPadV   = Math.round(36  * scale)
  const boxPadH   = Math.round(60  * scale)
  const boxW      = width - 2 * boxPadH
  const boxH      = lines.length * lineH + 2 * boxPadV
  const boxX      = boxPadH
  // Slightly above vertical centre, matching the carousel title slide
  const boxY      = Math.round((height - boxH) / 2) - Math.round(40 * scale)

  const darkBox = `drawbox=x=${boxX}:y=${boxY}:w=${boxW}:h=${boxH}:color=black@0.65:t=fill`

  const textFilters = lines.map((line, i) => {
    const y = boxY + boxPadV + fontSize + i * lineH
    return `drawtext=fontfile=${fontPath}:text='${escapeDrawtext(line)}':expansion=none:fontcolor=white:fontsize=${fontSize}:x=(w-text_w)/2:y=${y}`
  })

  const vf = [darkBox, ...textFilters].join(',')
  await runFfmpeg(['-i', inputPath, '-vf', vf, '-c:a', 'copy', outputPath])
}

/**
 * Word-wrap a single bullet into display lines of at most `maxChars` content
 * characters each. The first line is prefixed with "- " and continuation lines
 * with "  " so the text stays aligned under the first character after the dash.
 */
function wrapBulletLines(text: string, maxChars: number): string[] {
  const words = text.trim().split(/\s+/)
  const contentLines: string[] = []
  let current = ''

  for (const word of words) {
    const w = word.slice(0, maxChars) // guard against a single word longer than the limit
    if (!current) {
      current = w
    } else {
      const candidate = `${current} ${w}`
      if (candidate.length <= maxChars) {
        current = candidate
      } else {
        contentLines.push(current)
        current = w
      }
    }
  }
  if (current) contentLines.push(current)

  return contentLines.map((line, i) => (i === 0 ? `- ${line}` : `  ${line}`))
}

/**
 * Overlay a full-frame dark veil + vertically centred bullet list (F2/S2 Video Reel).
 * Bullet text word-wraps at 28 characters per line; continuation lines are indented
 * to align with the text after the "- " prefix. An empty-line gap separates bullets.
 */
export async function overlayBulletsOnVideo(
  inputPath: string,
  outputPath: string,
  bullets: string[],
  fontPath: string = helveticaNeweLightFontPath(),
): Promise<void> {
  const { height } = await probeVideo(inputPath)
  const scale = height / 1080

  const bulletFontSize = Math.round(36 * scale)
  const bulletLineHeight = Math.round(52 * scale)
  // One extra line-height of blank space between consecutive bullets.
  const interBulletGap = bulletLineHeight

  const list = bullets.slice(0, 6)
  const wrappedBullets = list.map((b) => wrapBulletLines(b, 28))

  // Total block height: all wrapped lines + one gap between each bullet pair.
  const totalLines = wrappedBullets.reduce((n, lines) => n + lines.length, 0)
  const totalGaps  = wrappedBullets.length - 1
  const bulletBlockHeight = totalLines * bulletLineHeight + totalGaps * interBulletGap
  const startY = Math.round((height - bulletBlockHeight) / 2)

  const bulletFilters: string[] = []
  let currentY = startY
  for (let bi = 0; bi < wrappedBullets.length; bi++) {
    for (const line of wrappedBullets[bi]) {
      const text = escapeDrawtext(line)
      bulletFilters.push(
        `drawtext=fontfile=${fontPath}:text='${text}':expansion=none:fontcolor=white:fontsize=${bulletFontSize}:x=w*0.08:y=${currentY}`,
      )
      currentY += bulletLineHeight
    }
    if (bi < wrappedBullets.length - 1) currentY += interBulletGap
  }

  const vf = [
    `drawbox=x=0:y=0:w=iw:h=ih:color=black@0.75:t=fill`,
    ...bulletFilters,
  ].join(',')

  await runFfmpeg(['-i', inputPath, '-vf', vf, '-c:a', 'copy', outputPath])
}

/**
 * Overlay a full-frame dark veil + title + ✓ bullet list on a video (F2 Video Reel).
 * Layout mirrors the reference design: all text is top-anchored at 150 px.
 */
export async function overlayTitleAndBulletsOnVideo(
  inputPath: string,
  outputPath: string,
  title: string,
  bullets: string[],
  fontPath: string = defaultFontPath(),
): Promise<void> {
  const titleFontSize = 52
  const bulletFontSize = 36
  const titleY = 150
  const titleBulletGap = 76
  const bulletLineHeight = 72

  const safeTitle = escapeDrawtext(title.slice(0, 80))

  const bulletFilters = bullets.slice(0, 6).map((bullet, i) => {
    const text = escapeDrawtext(`- ${bullet.slice(0, 28)}`)
    const y = titleY + titleFontSize + titleBulletGap + i * bulletLineHeight
    return `drawtext=fontfile=${fontPath}:text='${text}':expansion=none:fontcolor=white:fontsize=${bulletFontSize}:x=w*0.08:y=${y}`
  })

  // Single -vf chain:
  //   1. drawbox fills the entire frame with black@0.55 (dark veil)
  //   2. drawtext for the centred title at y=150
  //   3. drawtext for each ✓ bullet, left-aligned, stacked below the title
  const vf = [
    `drawbox=x=0:y=0:w=iw:h=ih:color=black@0.55:t=fill`,
    `drawtext=fontfile=${fontPath}:text='${safeTitle}':expansion=none:fontcolor=white:fontsize=${titleFontSize}:x=(w-text_w)/2:y=${titleY}`,
    ...bulletFilters,
  ].join(',')

  await runFfmpeg(['-i', inputPath, '-vf', vf, '-c:a', 'copy', outputPath])
}
