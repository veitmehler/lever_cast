import path from 'node:path'
import fs from 'node:fs/promises'
import {
  concatAudioFiles,
  makeSilenceAudio,
  padAudioToDuration,
  probeVideo,
  runFfmpeg,
} from './ffmpeg'
import {
  synthesizeSpeech,
  synthesizeSpeechWithTimestamps,
  type CharacterAlignment,
} from '../../lib/elevenlabs/client'
import { logger } from '../../lib/logger'

export interface PerSlideNarrationResult {
  /** One duration (seconds) per slide — the slideshow holds each slide this long. */
  slideDurations: number[]
  /** Contiguous body-narration track whose length equals the sum of slideDurations. */
  audioPath: string
}

export interface PerSlideNarrationOptions {
  apiKey: string
  voiceId: string
  modelId?: string
  stability?: number
  similarity?: number
  speed?: number
  /** Spoken text per slide, index-aligned with the slide images. Empty entries are allowed. */
  slideTexts: string[]
  tmpDir: string
  /** Trailing silence (seconds) appended after each slide's speech in legacy fallback. Defaults to 0.6. */
  paddingSeconds?: number
  /** Duration (seconds) for slides that have no spoken text. Defaults to 3. */
  emptySlideSeconds?: number
}

const MIN_SLIDE_SECS = 2
const TAIL_PADDING_SECS = 0.3
const MAX_JOINED_TEXT_CHARS = 4500

function endsWithSentencePunctuation(text: string): boolean {
  return /[.!?]$/.test(text.trim())
}

function buildJoinedNarrationText(slideTexts: string[]): {
  joined: string
  /** Exclusive end character offset in `joined` for each text-bearing slide index. */
  endOffsetsBySlideIndex: Map<number, number>
} {
  const endOffsetsBySlideIndex = new Map<number, number>()
  let joined = ''
  let lastTextSlideIndex = -1

  for (let i = 0; i < slideTexts.length; i++) {
    const text = slideTexts[i]?.trim() ?? ''
    if (!text) continue

    if (joined.length > 0) {
      const prevText = slideTexts[lastTextSlideIndex]?.trim() ?? ''
      joined += endsWithSentencePunctuation(prevText) ? ' ' : '. '
    }
    joined += text
    endOffsetsBySlideIndex.set(i, joined.length)
    lastTextSlideIndex = i
  }

  return { joined, endOffsetsBySlideIndex }
}

/** End time (seconds) of the character before exclusive offset `endOffset`. */
function timeAtCharOffset(alignment: CharacterAlignment, endOffset: number): number {
  const { character_end_times_seconds: ends } = alignment
  if (ends.length === 0) return 0
  const idx = Math.min(Math.max(0, endOffset - 1), ends.length - 1)
  if (endOffset - 1 >= ends.length) {
    logger.warn(
      { endOffset, alignmentLength: ends.length },
      'buildContinuousNarration: boundary offset beyond alignment — using last character',
    )
  }
  return ends[idx] ?? ends[ends.length - 1] ?? 0
}

async function extractAudioSlice(
  inputPath: string,
  outputPath: string,
  startSec: number,
  endSec: number,
  targetDurationSec: number,
): Promise<void> {
  const slicePath = outputPath.replace(/\.m4a$/, '-slice.mp3')
  await runFfmpeg([
    '-i', inputPath,
    '-ss', String(Math.max(0, startSec)),
    '-to', String(Math.max(startSec, endSec)),
    '-c:a', 'libmp3lame',
    slicePath,
  ])
  await padAudioToDuration(slicePath, outputPath, targetDurationSec)
}

/**
 * One continuous ElevenLabs synthesis with character-level timestamps.
 * Slide durations are derived from alignment boundaries — no per-slide padding gaps.
 */
async function buildContinuousNarration(
  opts: PerSlideNarrationOptions,
): Promise<PerSlideNarrationResult> {
  const emptySeconds = opts.emptySlideSeconds ?? 3
  const { joined, endOffsetsBySlideIndex } = buildJoinedNarrationText(opts.slideTexts)

  if (!joined.trim()) {
    throw new Error('No slide text to synthesize')
  }

  logger.info(
    {
      totalSlides: opts.slideTexts.length,
      textSlides: endOffsetsBySlideIndex.size,
      joinedLength: joined.length,
      voiceId: opts.voiceId,
    },
    'buildContinuousNarration: start',
  )

  const { audio, alignment } = await synthesizeSpeechWithTimestamps({
    apiKey: opts.apiKey,
    voiceId: opts.voiceId,
    text: joined,
    modelId: opts.modelId,
    stability: opts.stability,
    similarityBoost: opts.similarity,
    speed: opts.speed,
  })

  const rawMp3 = path.join(opts.tmpDir, 'narration-continuous.mp3')
  await fs.writeFile(rawMp3, audio)

  const alignmentCharCount = alignment.characters.length
  const audioEndTime = alignment.character_end_times_seconds[alignmentCharCount - 1] ?? 0

  logger.info(
    { alignmentCharCount, audioEndTime, joinedLength: joined.length },
    'buildContinuousNarration: TTS complete',
  )

  const textSlideIndices = [...endOffsetsBySlideIndex.keys()].sort((a, b) => a - b)
  const lastTextSlideIdx = textSlideIndices[textSlideIndices.length - 1]
  const hasEmptySlides = opts.slideTexts.some((t) => !t.trim())

  const boundaryTimes = new Map<number, number>()
  for (const slideIdx of textSlideIndices) {
    const endOffset = endOffsetsBySlideIndex.get(slideIdx)!
    boundaryTimes.set(slideIdx, timeAtCharOffset(alignment, endOffset))
  }

  const slideDurations: number[] = []
  const segmentPaths: string[] = []
  let prevTime = 0

  for (let i = 0; i < opts.slideTexts.length; i++) {
    const text = opts.slideTexts[i]?.trim() ?? ''

    if (!text) {
      slideDurations.push(emptySeconds)
      const silPath = path.join(opts.tmpDir, `narration-empty-${i}.m4a`)
      await makeSilenceAudio(silPath, emptySeconds)
      segmentPaths.push(silPath)
      continue
    }

    const endTime = boundaryTimes.get(i)!
    let duration = endTime - prevTime
    if (i === lastTextSlideIdx) duration += TAIL_PADDING_SECS
    duration = Math.max(MIN_SLIDE_SECS, duration)
    slideDurations.push(duration)

    if (hasEmptySlides) {
      const extractEnd = i === lastTextSlideIdx ? endTime + TAIL_PADDING_SECS : endTime
      const segPath = path.join(opts.tmpDir, `narration-slice-${i}.m4a`)
      await extractAudioSlice(rawMp3, segPath, prevTime, extractEnd, duration)
      segmentPaths.push(segPath)
    }

    prevTime = endTime
    if (i === lastTextSlideIdx) prevTime = endTime + TAIL_PADDING_SECS
  }

  const audioPath = path.join(opts.tmpDir, 'narration-body.m4a')

  if (hasEmptySlides) {
    await concatAudioFiles(segmentPaths, audioPath)
  } else {
    const totalDuration = slideDurations.reduce((a, b) => a + b, 0)
    await padAudioToDuration(rawMp3, audioPath, totalDuration)
  }

  logger.info(
    { slideDurations, totalDuration: slideDurations.reduce((a, b) => a + b, 0) },
    'buildContinuousNarration: boundaries resolved',
  )

  return { slideDurations, audioPath }
}

/** Legacy per-slide synthesis — used when continuous path is unavailable. */
async function buildPerSlideNarrationFallback(
  opts: PerSlideNarrationOptions,
): Promise<PerSlideNarrationResult> {
  const padding = opts.paddingSeconds ?? 0.6
  const emptySeconds = opts.emptySlideSeconds ?? 3

  const segmentPaths: string[] = []
  const slideDurations: number[] = []

  logger.info(
    { totalSlides: opts.slideTexts.length, voiceId: opts.voiceId },
    'buildPerSlideNarrationFallback: start',
  )

  for (let i = 0; i < opts.slideTexts.length; i++) {
    const text = opts.slideTexts[i]?.trim() ?? ''
    const segPath = path.join(opts.tmpDir, `narration-seg-${i}.m4a`)

    if (!text) {
      await makeSilenceAudio(segPath, emptySeconds)
      slideDurations.push(emptySeconds)
      segmentPaths.push(segPath)
      continue
    }

    const rawMp3 = path.join(opts.tmpDir, `narration-raw-${i}.mp3`)
    const audio = await synthesizeSpeech({
      apiKey: opts.apiKey,
      voiceId: opts.voiceId,
      text,
      modelId: opts.modelId,
      stability: opts.stability,
      similarityBoost: opts.similarity,
      speed: opts.speed,
    })
    await fs.writeFile(rawMp3, audio)

    const speechDuration = (await probeVideo(rawMp3)).duration
    const segDuration = Math.max(1, speechDuration) + padding
    await padAudioToDuration(rawMp3, segPath, segDuration)

    slideDurations.push(segDuration)
    segmentPaths.push(segPath)
  }

  const audioPath = path.join(opts.tmpDir, 'narration-body.m4a')
  await concatAudioFiles(segmentPaths, audioPath)

  logger.info(
    { audioPath, totalDuration: slideDurations.reduce((a, b) => a + b, 0) },
    'buildPerSlideNarrationFallback: complete',
  )
  return { slideDurations, audioPath }
}

/**
 * Build a contiguous narration track synced to slide images.
 * Uses one continuous ElevenLabs synthesis with timestamp boundaries when possible;
 * falls back to per-slide synthesis for long text or alignment failures.
 */
export async function buildPerSlideNarration(
  opts: PerSlideNarrationOptions,
): Promise<PerSlideNarrationResult> {
  const { joined } = buildJoinedNarrationText(opts.slideTexts)

  if (joined.length > MAX_JOINED_TEXT_CHARS) {
    logger.warn(
      { joinedLength: joined.length, max: MAX_JOINED_TEXT_CHARS },
      'buildPerSlideNarration: joined text too long — using per-slide fallback',
    )
    return buildPerSlideNarrationFallback(opts)
  }

  try {
    return await buildContinuousNarration(opts)
  } catch (err) {
    logger.warn({ err }, 'buildPerSlideNarration: continuous narration failed — using per-slide fallback')
    return buildPerSlideNarrationFallback(opts)
  }
}
