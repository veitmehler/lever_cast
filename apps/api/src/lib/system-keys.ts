/**
 * System API key resolution.
 *
 * Resolution order for each provider:
 *   1. Environment variable (e.g. GEMINI_API_KEY) — fastest, no DB round-trip.
 *   2. SystemApiKey DB row (encrypted) — set via admin UI without redeploy.
 *
 * This allows managing keys via the admin panel after initial deploy.
 */

import { prisma } from './prisma'
import { decrypt, encrypt } from './encryption'

const ENV_VAR_MAP: Record<string, string> = {
  gemini: 'GEMINI_API_KEY',
  openai: 'OPENAI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
  openrouter: 'OPENROUTER_API_KEY',
  'fal-ai': 'FAL_KEY',
}

export async function getSystemApiKey(provider: string): Promise<string | null> {
  const envVar = ENV_VAR_MAP[provider]
  if (envVar && process.env[envVar]) {
    return process.env[envVar]!
  }

  const row = await prisma.systemApiKey.findUnique({ where: { provider } })
  if (!row) return null
  return decrypt(row.encryptedKey)
}

export async function setSystemApiKey(provider: string, plainKey: string): Promise<void> {
  const encryptedKey = encrypt(plainKey)
  await prisma.systemApiKey.upsert({
    where: { provider },
    create: { provider, encryptedKey },
    update: { encryptedKey },
  })
}

export async function listSystemApiKeys(): Promise<Array<{ provider: string; hasEnvKey: boolean; hasDbKey: boolean }>> {
  const providers = Object.keys(ENV_VAR_MAP)
  const dbRows = await prisma.systemApiKey.findMany({ select: { provider: true } })
  const dbProviders = new Set(dbRows.map((r) => r.provider))

  return providers.map((p) => ({
    provider: p,
    hasEnvKey: !!(ENV_VAR_MAP[p] && process.env[ENV_VAR_MAP[p]]),
    hasDbKey: dbProviders.has(p),
  }))
}
