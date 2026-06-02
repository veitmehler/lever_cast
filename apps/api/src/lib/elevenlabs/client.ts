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
      },
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`ElevenLabs TTS failed (${res.status}): ${body.slice(0, 200)}`)
  }

  return Buffer.from(await res.arrayBuffer())
}
