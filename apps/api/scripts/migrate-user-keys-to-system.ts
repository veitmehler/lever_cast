/**
 * One-time migration: copy per-user ApiKey rows into the SystemApiKey table.
 *
 * Run on the DO server:
 *   docker exec socioply-api npx tsx /app/apps/api/scripts/migrate-user-keys-to-system.ts
 */

// DigitalOcean Managed Postgres uses a self-signed CA; skip verification
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

import { PrismaClient } from '@prisma/client'
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from 'crypto'

const prisma = new PrismaClient()

// ── Inline decrypt/encrypt (mirrors apps/api/src/lib/encryption.ts) ─────────
// Duplicated here so the script can run standalone without resolving the TS
// module alias @/ which does not work with plain tsx outside the build.

const ALGO = 'aes-256-gcm'

function resolveKey(envVar: string): Buffer | null {
  const val = process.env[envVar]
  if (!val) return null
  return Buffer.from(val, 'base64')
}

function getPrimaryKey(): Buffer {
  const k = resolveKey('ENCRYPTION_KEY')
  if (k) return k
  return Buffer.alloc(32, 'dev')
}

function decryptValue(stored: string): string {
  if (!stored) return ''

  if (stored.startsWith('v2.')) {
    const parts = stored.split('.')
    if (parts.length !== 4) return ''
    const [, ivB64, tagB64, ctB64] = parts
    const iv = Buffer.from(ivB64, 'base64')
    const tag = Buffer.from(tagB64, 'base64')
    const ct = Buffer.from(ctB64, 'base64')
    const keysToTry: Buffer[] = [getPrimaryKey()]
    const oldKey = resolveKey('ENCRYPTION_KEY_OLD')
    if (oldKey) keysToTry.push(oldKey)
    for (const key of keysToTry) {
      try {
        const d = createDecipheriv(ALGO, key, iv)
        d.setAuthTag(tag)
        return Buffer.concat([d.update(ct), d.final()]).toString('utf8')
      } catch { /* try next */ }
    }
    return ''
  }

  // Legacy base64
  try {
    const decoded = Buffer.from(stored, 'base64').toString('utf8')
    if (decoded && /^[\x20-\x7E]+$/.test(decoded)) return decoded
  } catch { /* not base64 */ }

  if (/^[\x20-\x7E]+$/.test(stored)) return stored
  return ''
}

function encryptValue(plaintext: string): string {
  if (!plaintext) return ''
  const KEY = getPrimaryKey()
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGO, KEY, iv)
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `v2.${iv.toString('base64')}.${tag.toString('base64')}.${ct.toString('base64')}`
}

// ── Provider name normalisation ───────────────────────────────────────────────
// ApiKey.provider values seen in the wild → canonical SystemApiKey.provider
const PROVIDER_MAP: Record<string, string> = {
  openai: 'openai',
  anthropic: 'anthropic',
  gemini: 'gemini',
  openrouter: 'openrouter',
  'fal-ai': 'fal-ai',
  fal: 'fal-ai',
  telegram: 'telegram',  // not used by the article pipeline but migrate it anyway
}

async function main() {
  console.log('=== Migrate user ApiKey rows → SystemApiKey ===\n')

  // Find all user API keys
  const userKeys = await prisma.apiKey.findMany({
    select: { provider: true, encryptedKey: true, user: { select: { email: true } } },
    orderBy: { provider: 'asc' },
  })

  if (userKeys.length === 0) {
    console.log('No ApiKey rows found. Nothing to migrate.')
    await prisma.$disconnect()
    return
  }

  console.log(`Found ${userKeys.length} user API key(s):\n`)

  const results: Array<{ provider: string; status: string }> = []

  for (const row of userKeys) {
    const canonicalProvider = PROVIDER_MAP[row.provider.toLowerCase()] ?? row.provider.toLowerCase()

    // Skip providers that are not relevant to the article pipeline
    const pipelineProviders = new Set(['openai', 'anthropic', 'gemini', 'openrouter', 'fal-ai'])
    if (!pipelineProviders.has(canonicalProvider)) {
      console.log(`  ⏭  ${row.provider} (${row.user.email}) — skipped (not a pipeline provider)`)
      results.push({ provider: row.provider, status: 'skipped' })
      continue
    }

    const plainKey = decryptValue(row.encryptedKey)
    if (!plainKey) {
      console.log(`  ✗  ${row.provider} (${row.user.email}) — failed to decrypt`)
      results.push({ provider: row.provider, status: 'decrypt_failed' })
      continue
    }

    const reEncrypted = encryptValue(plainKey)

    await prisma.systemApiKey.upsert({
      where: { provider: canonicalProvider },
      create: { provider: canonicalProvider, encryptedKey: reEncrypted },
      update: { encryptedKey: reEncrypted },
    })

    // Mask the key for the log
    const masked = '•'.repeat(Math.min(20, plainKey.length - 4)) + plainKey.slice(-4)
    console.log(`  ✓  ${canonicalProvider} — migrated (key: ${masked})`)
    results.push({ provider: canonicalProvider, status: 'migrated' })
  }

  console.log('\n=== Summary ===')
  const migrated = results.filter((r) => r.status === 'migrated')
  const skipped = results.filter((r) => r.status === 'skipped')
  const failed = results.filter((r) => r.status === 'decrypt_failed')
  console.log(`  Migrated : ${migrated.length}`)
  console.log(`  Skipped  : ${skipped.length}`)
  console.log(`  Failed   : ${failed.length}`)

  if (migrated.length > 0) {
    console.log('\nVerifying SystemApiKey table:')
    const systemKeys = await prisma.systemApiKey.findMany({ select: { provider: true, updatedAt: true } })
    for (const sk of systemKeys) {
      console.log(`  ✓  ${sk.provider} (updated ${sk.updatedAt.toISOString()})`)
    }
  }

  await prisma.$disconnect()
  console.log('\nDone.')
}

main().catch((err) => {
  console.error('Migration failed:', err)
  prisma.$disconnect().catch(() => {})
  process.exit(1)
})
