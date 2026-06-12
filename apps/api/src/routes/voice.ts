import type { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middleware/auth'
import { encrypt, maskApiKey } from '@socioply/shared'
import {
  cloneElevenLabsVoice,
  listElevenLabsVoices,
  verifyElevenLabsKey,
} from '../lib/elevenlabs/client'
import { getVoiceSettings, updateVoiceSettings, getUserElevenLabsApiKey } from '../lib/elevenlabs/settings'
import { uploadBufferWithKey, deleteS3Prefix } from '@socioply/shared'

async function resolveUser(clerkId: string) {
  return prisma.user.findUnique({ where: { clerkId } })
}

export async function voiceRoutes(app: FastifyInstance) {
  // GET /api/voice/settings
  app.get('/voice/settings', async (request, reply) => {
    const clerkId = await requireAuth(request, reply)
    if (!clerkId) return

    const user = await resolveUser(clerkId)
    if (!user) return reply.status(404).send({ error: 'User not found' })

    const settings = await getVoiceSettings(user.id)
    return {
      voiceId: settings.voiceId,
      modelId: settings.modelId,
      voiceoverEnabled: settings.voiceoverEnabled,
      stability: settings.stability,
      similarity: settings.similarity,
      speed: settings.speed,
      hasApiKey: settings.hasApiKey,
    }
  })

  // PUT /api/voice/settings
  app.put('/voice/settings', async (request, reply) => {
    const clerkId = await requireAuth(request, reply)
    if (!clerkId) return

    const user = await resolveUser(clerkId)
    if (!user) return reply.status(404).send({ error: 'User not found' })

    const body = request.body as {
      elevenLabsApiKey?: string
      elevenLabsVoiceId?: string | null
      elevenLabsModelId?: string | null
      voiceoverEnabled?: boolean
      voiceoverStability?: number
      voiceoverSimilarity?: number
      voiceoverSpeed?: number
    }

    let verificationWarning: string | undefined

    if (body.elevenLabsApiKey?.trim()) {
      const key = body.elevenLabsApiKey.trim()

      try {
        await verifyElevenLabsKey(key)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        // Always save the key even when verification fails. A 401 from ElevenLabs
        // can mean a rate-limit, IP block, or transient auth issue — not necessarily
        // a wrong key. The user will get clear feedback when they click "Load Voices"
        // if the key is genuinely invalid.
        verificationWarning = `Key saved, but verification failed: ${msg}`
        request.log.warn({ err }, '[voice] ElevenLabs key verification failed — saving key anyway')
      }

      const encryptedKey = encrypt(key)
      const existing = await prisma.apiKey.findFirst({
        where: { userId: user.id, provider: 'elevenlabs' },
      })
      if (existing) {
        await prisma.apiKey.update({ where: { id: existing.id }, data: { encryptedKey } })
      } else {
        await prisma.apiKey.create({
          data: { userId: user.id, provider: 'elevenlabs', encryptedKey },
        })
      }
    }

    const updated = await updateVoiceSettings(user.id, {
      elevenLabsVoiceId: body.elevenLabsVoiceId,
      elevenLabsModelId: body.elevenLabsModelId,
      voiceoverEnabled: body.voiceoverEnabled,
      voiceoverStability: body.voiceoverStability,
      voiceoverSimilarity: body.voiceoverSimilarity,
      voiceoverSpeed: body.voiceoverSpeed,
    })

    return {
      voiceId: updated.voiceId,
      modelId: updated.modelId,
      voiceoverEnabled: updated.voiceoverEnabled,
      stability: updated.stability,
      similarity: updated.similarity,
      speed: updated.speed,
      hasApiKey: updated.hasApiKey,
      maskedApiKey: updated.apiKey ? maskApiKey(updated.apiKey) : '',
      ...(verificationWarning ? { verificationWarning } : {}),
    }
  })

  // POST /api/voice/verify
  app.post('/voice/verify', async (request, reply) => {
    const clerkId = await requireAuth(request, reply)
    if (!clerkId) return

    const user = await resolveUser(clerkId)
    if (!user) return reply.status(404).send({ error: 'User not found' })

    const body = request.body as { apiKey?: string }
    const apiKey = body.apiKey?.trim() || (await getUserElevenLabsApiKey(user.id))
    if (!apiKey) return reply.status(400).send({ error: 'No ElevenLabs API key provided' })

    try {
      const result = await verifyElevenLabsKey(apiKey)
      return { success: true, ...result }
    } catch (err) {
      return reply.status(400).send({
        error: err instanceof Error ? err.message : 'Verification failed',
      })
    }
  })

  // GET /api/voice/voices
  app.get('/voice/voices', async (request, reply) => {
    const clerkId = await requireAuth(request, reply)
    if (!clerkId) return

    const user = await resolveUser(clerkId)
    if (!user) return reply.status(404).send({ error: 'User not found' })

    const apiKey = await getUserElevenLabsApiKey(user.id)
    if (!apiKey) {
      return reply.status(400).send({ error: 'ElevenLabs API key not configured' })
    }

    try {
      const voices = await listElevenLabsVoices(apiKey)
      return { voices }
    } catch (err) {
      return reply.status(400).send({
        error: err instanceof Error ? err.message : 'Failed to list voices',
      })
    }
  })

  // POST /api/voice/clone — multipart: name + sample file
  app.post('/voice/clone', async (request, reply) => {
    const clerkId = await requireAuth(request, reply)
    if (!clerkId) return

    const user = await resolveUser(clerkId)
    if (!user) return reply.status(404).send({ error: 'User not found' })

    const apiKey = await getUserElevenLabsApiKey(user.id)
    if (!apiKey) {
      return reply.status(400).send({ error: 'ElevenLabs API key not configured' })
    }

    const data = await request.file()
    if (!data) return reply.status(400).send({ error: 'Missing audio sample file' })

    const nameField = data.fields.name
    const voiceName =
      (typeof nameField === 'object' && nameField !== null && 'value' in nameField
        ? String((nameField as { value: string }).value)
        : 'My Voice'
      ).trim() || 'My Voice'

    const sampleBuffer = await data.toBuffer()
    if (sampleBuffer.length < 1000) {
      return reply.status(400).send({ error: 'Audio sample too short — provide 1–2 minutes of clear speech' })
    }

    const s3Prefix = `voice-samples/${user.id}/${Date.now()}/`
    let s3Key: string | undefined
    try {
      s3Key = `${s3Prefix}sample.${data.filename?.split('.').pop() ?? 'mp3'}`
      await uploadBufferWithKey(s3Key, sampleBuffer, data.mimetype || 'audio/mpeg')

      const result = await cloneElevenLabsVoice({
        apiKey,
        name: voiceName,
        sampleBuffer,
        filename: data.filename || 'sample.mp3',
      })

      await updateVoiceSettings(user.id, { elevenLabsVoiceId: result.voice_id })

      return {
        success: true,
        voiceId: result.voice_id,
        requiresVerification: result.requires_verification ?? false,
        message: result.requires_verification
          ? 'Voice cloned — ElevenLabs requires verification before use.'
          : 'Voice cloned successfully.',
      }
    } catch (err) {
      return reply.status(400).send({
        error: err instanceof Error ? err.message : 'Voice cloning failed',
      })
    } finally {
      if (s3Key) await deleteS3Prefix(s3Prefix).catch(() => {})
    }
  })
}
