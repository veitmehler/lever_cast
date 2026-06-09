const ELEVENLABS_BASE = 'https://api.elevenlabs.io/v1'

export interface ElevenLabsVoice {
  voice_id: string
  name: string
  category?: string
  labels?: Record<string, string>
}

export interface CloneVoiceResult {
  voice_id: string
  requires_verification?: boolean
}

async function elevenFetch<T>(
  apiKey: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${ELEVENLABS_BASE}${path}`, {
    ...init,
    headers: {
      'xi-api-key': apiKey,
      ...(init?.headers ?? {}),
    },
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    if (res.status === 401) throw new Error(`ElevenLabs auth failed (401): ${body.slice(0, 200) || 'no details'}`)
    if (res.status === 403) {
      throw new Error(
        'ElevenLabs denied this request. Instant Voice Cloning requires a paid ElevenLabs plan.',
      )
    }
    throw new Error(`ElevenLabs API error (${res.status}): ${body.slice(0, 200)}`)
  }

  return res.json() as Promise<T>
}

export async function verifyElevenLabsKey(apiKey: string): Promise<{ ok: true; subscription?: string }> {
  const data = await elevenFetch<{ subscription?: { tier?: string } }>(apiKey, '/user')
  return { ok: true, subscription: data.subscription?.tier }
}

export async function listElevenLabsVoices(apiKey: string): Promise<ElevenLabsVoice[]> {
  const data = await elevenFetch<{ voices?: ElevenLabsVoice[] }>(apiKey, '/voices')
  return data.voices ?? []
}

export async function cloneElevenLabsVoice(opts: {
  apiKey: string
  name: string
  sampleBuffer: Buffer
  filename: string
}): Promise<CloneVoiceResult> {
  const form = new FormData()
  form.append('name', opts.name)
  form.append('files', new Blob([opts.sampleBuffer]), opts.filename)

  const res = await fetch(`${ELEVENLABS_BASE}/voices/add`, {
    method: 'POST',
    headers: { 'xi-api-key': opts.apiKey },
    body: form,
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    if (res.status === 403) {
      throw new Error(
        'Voice cloning requires a paid ElevenLabs plan (IVC). Upgrade your account or select an existing voice.',
      )
    }
    throw new Error(`ElevenLabs clone failed (${res.status}): ${body.slice(0, 200)}`)
  }

  return res.json() as Promise<CloneVoiceResult>
}

export async function synthesizeSpeech(opts: {
  apiKey: string
  voiceId: string
  text: string
  modelId?: string
  stability?: number
  similarityBoost?: number
  speed?: number
}): Promise<Buffer> {
  const res = await fetch(`${ELEVENLABS_BASE}/text-to-speech/${opts.voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': opts.apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text: opts.text.slice(0, 5000),
      model_id: opts.modelId ?? 'eleven_multilingual_v2',
      voice_settings: {
        stability: opts.stability ?? 0.5,
        similarity_boost: opts.similarityBoost ?? 0.75,
        speed: opts.speed ?? 1.0,
      },
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`ElevenLabs TTS failed (${res.status}): ${body.slice(0, 200)}`)
  }

  return Buffer.from(await res.arrayBuffer())
}

// ---------------------------------------------------------------------------
// Timestamp-aware TTS — used for slide-synced voiceover
// ---------------------------------------------------------------------------

interface CharacterAlignment {
  characters: string[]
  character_start_times_seconds: number[]
  character_end_times_seconds: number[]
}

export interface SpeechWithTimestamps {
  audio: Buffer
  /** Character-level timing from the ElevenLabs normalized_alignment field. */
  alignment: CharacterAlignment
}

/** Synthesize speech and return MP3 audio + character-level timing data. */
export async function synthesizeSpeechWithTimestamps(opts: {
  apiKey: string
  voiceId: string
  text: string
  modelId?: string
  stability?: number
  similarityBoost?: number
  speed?: number
}): Promise<SpeechWithTimestamps> {
  const res = await fetch(`${ELEVENLABS_BASE}/text-to-speech/${opts.voiceId}/with-timestamps`, {
    method: 'POST',
    headers: {
      'xi-api-key': opts.apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: opts.text.slice(0, 5000),
      model_id: opts.modelId ?? 'eleven_multilingual_v2',
      voice_settings: {
        stability: opts.stability ?? 0.5,
        similarity_boost: opts.similarityBoost ?? 0.75,
        speed: opts.speed ?? 1.0,
      },
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`ElevenLabs TTS (with-timestamps) failed (${res.status}): ${body.slice(0, 200)}`)
  }

  const data = (await res.json()) as {
    audio_base64: string
    normalized_alignment?: CharacterAlignment | null
    alignment?: CharacterAlignment | null
  }

  const audio = Buffer.from(data.audio_base64, 'base64')
  const alignment = data.normalized_alignment ?? data.alignment

  if (!alignment) {
    throw new Error('ElevenLabs returned no alignment data')
  }

  return { audio, alignment }
}

/**
 * Given the full narration text assembled by joining per-slide texts (with a
 * single space separator between each segment) and the character-level timing
 * returned by synthesizeSpeechWithTimestamps, compute how long (seconds) each
 * slide should be shown.
 *
 * Algorithm:
 * 1. Walk the joined text and record the character offset where each new slide
 *    segment starts.
 * 2. Map each offset to the closest character index in the alignment array
 *    (normalized text may collapse whitespace/punctuation).
 * 3. Slide duration = start_time(next boundary) - start_time(this boundary).
 *    Last slide: end_time of the final character in the segment.
 * 4. Clamp each duration to [minDuration, maxDuration].
 */
export function computeSlideDurations(
  slideTexts: string[],
  alignment: CharacterAlignment,
  minDuration = 1.5,
  maxDuration = 20,
): number[] {
  if (slideTexts.length === 0) return []

  const starts = alignment.character_start_times_seconds
  const ends = alignment.character_end_times_seconds

  // Build cumulative character offsets for each slide in the joined text.
  // Slides are joined with a single space.
  const boundaries: number[] = []
  let offset = 0
  for (let i = 0; i < slideTexts.length; i++) {
    boundaries.push(offset)
    offset += slideTexts[i].length + 1 // +1 for the space separator
  }

  const totalAlignChars = starts.length

  // Map a text offset to a timing index (nearest within bounds).
  function offsetToTimingIndex(charOffset: number): number {
    return Math.min(Math.max(0, charOffset), totalAlignChars - 1)
  }

  const durations: number[] = []
  for (let i = 0; i < slideTexts.length; i++) {
    const thisIdx = offsetToTimingIndex(boundaries[i])
    let duration: number

    if (i < slideTexts.length - 1) {
      const nextIdx = offsetToTimingIndex(boundaries[i + 1])
      duration = starts[nextIdx] - starts[thisIdx]
    } else {
      // Last slide: from its start to the end of the last character
      const lastChar = totalAlignChars - 1
      duration = ends[lastChar] - starts[thisIdx]
    }

    durations.push(Math.min(maxDuration, Math.max(minDuration, duration)))
  }

  return durations
}
