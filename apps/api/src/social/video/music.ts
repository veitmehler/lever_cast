import path from 'node:path'
import { prisma } from '@omniply/shared'
import { downloadToFile, hasAudioStream, runFfmpeg } from './ffmpeg'
import { logger } from '../../lib/logger'

/**
 * Background music for social videos.
 *
 * Tracks come from the admin-managed library (music_tracks), already
 * loudness-normalized to −16 LUFS AAC on upload, so mix levels here are
 * predictable. The mix pass never re-encodes video (`-c:v copy`) — it only
 * encodes the audio track and remuxes, so it is cheap for every post type.
 *
 * Ducking is deterministic by offset (the callers know exactly when narration
 * starts), not sidechain compression.
 */

export interface MusicMixOptions {
  /** Final video duration in seconds (from the caller's existing probe). */
  videoDuration: number
  /** Narration onset in seconds; undefined = never duck (no spoken words). */
  duckAtSec?: number
  /** Duck depth in dB below full level. Defaults to 20. */
  duckDb?: number
  /** Ramp length of the duck transition. Defaults to 0.5s. */
  duckRampSec?: number
  /** End-of-video fade-out length. Defaults to 2s. */
  fadeOutSec?: number
  /** Overall music level in dB below full volume (e.g. 12 → −12 dB). Applied before ducking. */
  baseGainDb?: number
}

/**
 * Build the music filter chain (loop → trim to video length → duck envelope →
 * end fade-out → uniform format). Pure string builder so it is unit-testable.
 *
 * The volume envelope is `1 → gain` ramped linearly over duckRampSec and
 * COMPLETING exactly at duckAtSec (the ramp starts duckRampSec earlier), so
 * the music is already fully ducked when the first word lands. gain =
 * 10^(−duckDb/20). When the ramp would start before t=0 (narration from the
 * first frame), the music is held at the ducked level throughout instead.
 * Commas inside expressions are escaped for the filtergraph parser (same
 * convention as the blend ramp in ffmpeg.ts).
 */
export function buildMusicFilterChain(opts: MusicMixOptions): string {
  const dur = opts.videoDuration
  const fadeOut = opts.fadeOutSec ?? 2
  const fadeStart = Math.max(0, dur - fadeOut)

  const parts = [
    `aloop=loop=-1:size=2147483647`,
    `atrim=0:${dur.toFixed(3)}`,
    `asetpts=PTS-STARTPTS`,
  ]

  if (opts.baseGainDb !== undefined && opts.baseGainDb > 0) {
    parts.push(`volume=${Math.pow(10, -opts.baseGainDb / 20).toFixed(4)}`)
  }

  if (opts.duckAtSec !== undefined) {
    const duckDb = opts.duckDb ?? 20
    const ramp = opts.duckRampSec ?? 0.5
    const gain = Math.pow(10, -duckDb / 20)
    const drop = (1 - gain).toFixed(4)
    const rampStart = opts.duckAtSec - ramp
    if (rampStart <= 0) {
      parts.push(`volume=${gain.toFixed(4)}`)
    } else {
      parts.push(
        `volume='1-${drop}*clip((t-${rampStart.toFixed(3)})/${ramp}\\,0\\,1)':eval=frame`,
      )
    }
  }

  parts.push(
    `afade=t=out:st=${fadeStart.toFixed(3)}:d=${fadeOut}`,
    `aformat=sample_rates=44100:channel_layouts=stereo`,
  )

  return parts.join(',')
}

/** Random active track from the library, or null when the library is empty. */
export async function pickRandomMusicTrack(): Promise<{
  id: string
  url: string
  duration: number
} | null> {
  const tracks = await prisma.musicTrack.findMany({
    where: { isActive: true },
    select: { id: true, url: true, duration: true },
  })
  if (tracks.length === 0) return null
  return tracks[Math.floor(Math.random() * tracks.length)]
}

/**
 * Mix a music file under a finished video. Video stream is stream-copied —
 * only the audio is encoded. When the video already has audio (narration),
 * the two are mixed without auto-normalization so absolute levels hold.
 */
export async function mixMusicIntoVideo(
  videoPath: string,
  musicPath: string,
  outputPath: string,
  opts: MusicMixOptions,
): Promise<void> {
  const chain = buildMusicFilterChain(opts)
  const videoHasAudio = await hasAudioStream(videoPath)

  const filter = videoHasAudio
    ? `[1:a]${chain}[bgm];[0:a][bgm]amix=inputs=2:duration=first:normalize=0[aout]`
    : `[1:a]${chain}[aout]`

  await runFfmpeg([
    '-i', videoPath,
    '-i', musicPath,
    '-filter_complex', filter,
    '-map', '0:v',
    '-map', '[aout]',
    '-c:v', 'copy',
    '-c:a', 'aac', '-b:a', '192k',
    '-shortest',
    outputPath,
  ])
}

/**
 * Orchestrator used by the generate*Asset call sites: pick a random track,
 * download it, mix it under the video, and return the mixed file path.
 * Any failure (empty library, download error, ffmpeg error) logs a warning
 * and returns the ORIGINAL path — music must never fail a post.
 */
export async function addBackgroundMusic(
  videoPath: string,
  tmpDir: string,
  opts: MusicMixOptions,
): Promise<string> {
  try {
    const track = await pickRandomMusicTrack()
    if (!track) {
      logger.info('[music] library empty — generating without background music')
      return videoPath
    }

    const musicPath = path.join(tmpDir, 'bgm-source.m4a')
    await downloadToFile(track.url, musicPath)

    const outputPath = videoPath.replace(/\.mp4$/, '-music.mp4')
    await mixMusicIntoVideo(videoPath, musicPath, outputPath, opts)

    logger.info(
      { trackId: track.id, duckAtSec: opts.duckAtSec, videoDuration: opts.videoDuration },
      '[music] background music mixed',
    )
    return outputPath
  } catch (err) {
    logger.warn({ err }, '[music] failed to add background music — shipping video without it')
    return videoPath
  }
}
