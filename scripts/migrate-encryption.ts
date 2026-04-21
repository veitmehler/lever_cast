/**
 * One-time script: re-encrypt all ApiKey and SocialConnection rows from the legacy
 * base64 scheme to AES-256-GCM (v2 format).
 *
 * Prerequisites:
 *   1. Set ENCRYPTION_KEY in your environment (or .env file).
 *   2. Run against the target database (Supabase for now; DO Postgres later).
 *
 * Usage:
 *   npx dotenv -e .env -- npx tsx scripts/migrate-encryption.ts
 *
 *   Or simply:
 *   ENCRYPTION_KEY=<your-key> npx tsx scripts/migrate-encryption.ts
 *
 * The script is IDEMPOTENT: rows already in v2 format are skipped.
 * Safe to re-run after partial failures.
 */

import { PrismaClient } from '@prisma/client'
import { encrypt, decrypt } from '../src/lib/encryption'

const prisma = new PrismaClient()

interface Stats {
  apiKeys: { total: number; migrated: number; skipped: number; errors: number }
  connections: { total: number; migrated: number; skipped: number; errors: number }
}

async function migrateApiKeys(stats: Stats) {
  const rows = await prisma.apiKey.findMany({
    select: { id: true, encryptedKey: true },
  })
  stats.apiKeys.total = rows.length

  for (const row of rows) {
    if (row.encryptedKey.startsWith('v2.')) {
      stats.apiKeys.skipped++
      continue
    }
    try {
      const plain = decrypt(row.encryptedKey)
      if (!plain) {
        console.warn(`[api_keys] Row ${row.id}: decrypt returned empty — skipping`)
        stats.apiKeys.errors++
        continue
      }
      await prisma.apiKey.update({
        where: { id: row.id },
        data: { encryptedKey: encrypt(plain) },
      })
      stats.apiKeys.migrated++
    } catch (err) {
      console.error(`[api_keys] Row ${row.id}: error —`, err)
      stats.apiKeys.errors++
    }
  }
}

async function migrateSocialConnections(stats: Stats) {
  const rows = await prisma.socialConnection.findMany({
    select: { id: true, accessToken: true, refreshToken: true },
  })
  stats.connections.total = rows.length

  for (const row of rows) {
    const needsAccessToken = !row.accessToken.startsWith('v2.')
    const needsRefreshToken = row.refreshToken != null && !row.refreshToken.startsWith('v2.')

    if (!needsAccessToken && !needsRefreshToken) {
      stats.connections.skipped++
      continue
    }

    const updates: { accessToken?: string; refreshToken?: string } = {}

    try {
      if (needsAccessToken) {
        const plain = decrypt(row.accessToken)
        if (!plain) {
          console.warn(`[social_connections] Row ${row.id}: accessToken decrypt returned empty — skipping`)
          stats.connections.errors++
          continue
        }
        updates.accessToken = encrypt(plain)
      }
      if (needsRefreshToken && row.refreshToken) {
        const plain = decrypt(row.refreshToken)
        if (plain) {
          updates.refreshToken = encrypt(plain)
        }
        // A missing refresh token is non-fatal — leave it as-is
      }

      await prisma.socialConnection.update({
        where: { id: row.id },
        data: updates,
      })
      stats.connections.migrated++
    } catch (err) {
      console.error(`[social_connections] Row ${row.id}: error —`, err)
      stats.connections.errors++
    }
  }
}

async function main() {
  console.log('🔐 Starting encryption migration (base64 → AES-256-GCM)\n')

  const stats: Stats = {
    apiKeys:     { total: 0, migrated: 0, skipped: 0, errors: 0 },
    connections: { total: 0, migrated: 0, skipped: 0, errors: 0 },
  }

  console.log('→ Migrating api_keys…')
  await migrateApiKeys(stats)
  console.log(
    `  ✅ ${stats.apiKeys.migrated} migrated, ` +
    `${stats.apiKeys.skipped} already v2, ` +
    `${stats.apiKeys.errors} errors (of ${stats.apiKeys.total} total)`
  )

  console.log('\n→ Migrating social_connections…')
  await migrateSocialConnections(stats)
  console.log(
    `  ✅ ${stats.connections.migrated} migrated, ` +
    `${stats.connections.skipped} already v2, ` +
    `${stats.connections.errors} errors (of ${stats.connections.total} total)`
  )

  const totalErrors = stats.apiKeys.errors + stats.connections.errors
  if (totalErrors > 0) {
    console.warn(`\n⚠️  ${totalErrors} row(s) had errors. Review the output above and re-run if needed.`)
    process.exit(1)
  }

  console.log('\n✅ Migration complete. All tokens are now AES-256-GCM encrypted.')
}

main()
  .catch((err) => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
