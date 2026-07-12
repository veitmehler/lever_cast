import { prisma } from '@socioply/shared'
import { decrypt } from '@socioply/shared'

export interface VoiceSettings {
  voiceId: string | null
  modelId: string
  voiceoverEnabled: boolean
  stability: number
  similarity: number
  speed: number
  apiKey: string | null
  hasApiKey: boolean
}

export async function getUserElevenLabsApiKey(userId: string): Promise<string | null> {
  const row = await prisma.apiKey.findFirst({
    where: { userId, provider: 'elevenlabs' },
  })
  if (!row) return null
  return decrypt(row.encryptedKey) || null
}

export async function getVoiceSettings(userId: string): Promise<VoiceSettings> {
  const settings = await prisma.settings.findUnique({ where: { userId } })
  const apiKey = await getUserElevenLabsApiKey(userId)

  return {
    voiceId: settings?.elevenLabsVoiceId ?? null,
    modelId: settings?.elevenLabsModelId ?? 'eleven_multilingual_v2',
    voiceoverEnabled: settings?.voiceoverEnabled ?? false,
    stability: settings?.voiceoverStability ?? 0.5,
    similarity: settings?.voiceoverSimilarity ?? 0.75,
    speed: settings?.voiceoverSpeed ?? 1.0,
    apiKey,
    hasApiKey: !!apiKey,
  }
}

export async function updateVoiceSettings(
  userId: string,
  data: {
    elevenLabsVoiceId?: string | null
    elevenLabsModelId?: string | null
    voiceoverEnabled?: boolean
    voiceoverStability?: number
    voiceoverSimilarity?: number
    voiceoverSpeed?: number
  },
): Promise<VoiceSettings> {
  await prisma.settings.upsert({
    where: { userId },
    create: {
      userId,
      theme: 'light',
      sidebarState: 'open',
      ...data,
    },
    update: data,
  })
  return getVoiceSettings(userId)
}

/**
 * Does this account have a WORKING voice (key + cloned voice + toggle)?
 * The weekly matrix substitutes ALL video slots with accent-tinted carousels
 * when this is false — resolved per run, self-healing in both directions.
 * See .plans/non-elevenlabs-carousel-conversion.implementation-plan.md.
 */
export async function accountHasVoice(userId: string): Promise<boolean> {
  const v = await getVoiceSettings(userId)
  return !!(v.voiceoverEnabled && v.apiKey && v.voiceId)
}
