/**
 * AES-256-GCM encryption for API keys and OAuth tokens.
 *
 * Ciphertext format (v2):  v2.<iv_b64>.<tag_b64>.<ct_b64>
 *
 * Backward compatibility:
 *   - Existing rows stored as plain base64 (legacy "encryption") are transparently
 *     decoded by decrypt() so no forced re-encryption is needed before deploying.
 *   - Run `scripts/migrate-encryption.ts` during the maintenance window to upgrade
 *     all rows to v2 format.
 *
 * Key rotation:
 *   - Set ENCRYPTION_KEY to the new key.
 *   - Optionally set ENCRYPTION_KEY_OLD to the previous key during the rotation window;
 *     decrypt() will try the old key as a fallback before giving up.
 *   - Remove ENCRYPTION_KEY_OLD once all rows have been re-encrypted.
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGO = 'aes-256-gcm'
const V2_PREFIX = 'v2'

function resolveKey(envVar: string): Buffer | null {
  const val = process.env[envVar]
  if (!val) return null
  const buf = Buffer.from(val, 'base64')
  if (buf.length !== 32) {
    throw new Error(
      `${envVar} must be a base64-encoded 32-byte key (got ${buf.length} bytes). ` +
        'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"'
    )
  }
  return buf
}

function getPrimaryKey(): Buffer {
  const key = resolveKey('ENCRYPTION_KEY')
  if (key) return key

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'ENCRYPTION_KEY env var is required in production. ' +
        'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"'
    )
  }

  // Development fallback — never used in production.
  console.warn(
    '[encryption] ENCRYPTION_KEY is not set. Using insecure dev fallback. ' +
      'Set ENCRYPTION_KEY in .env before storing any real tokens.'
  )
  return Buffer.alloc(32, 'dev') // 32 bytes, pattern "dev" repeated
}

function getOldKey(): Buffer | null {
  return resolveKey('ENCRYPTION_KEY_OLD')
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Encrypt a plaintext string. Always produces a v2 ciphertext.
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) return ''
  const KEY = getPrimaryKey()
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGO, KEY, iv)
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${V2_PREFIX}.${iv.toString('base64')}.${tag.toString('base64')}.${ct.toString('base64')}`
}

/**
 * Decrypt a string produced by encrypt() or by the legacy base64 scheme.
 *
 * Resolution order:
 *   1. v2 format → try ENCRYPTION_KEY, then ENCRYPTION_KEY_OLD.
 *   2. Legacy base64 → base64-decode; return if printable ASCII.
 *   3. Plaintext passthrough → return as-is if printable ASCII.
 *   4. Return '' and log a warning.
 */
export function decrypt(stored: string): string {
  if (!stored) return ''

  // v2 format: v2.<iv>.<tag>.<ct>
  if (stored.startsWith(`${V2_PREFIX}.`)) {
    const parts = stored.split('.')
    if (parts.length !== 4) {
      console.error('[encryption] Malformed v2 ciphertext')
      return ''
    }
    const [, ivB64, tagB64, ctB64] = parts
    const iv = Buffer.from(ivB64, 'base64')
    const tag = Buffer.from(tagB64, 'base64')
    const ct = Buffer.from(ctB64, 'base64')

    const keysToTry: Buffer[] = [getPrimaryKey()]
    const oldKey = getOldKey()
    if (oldKey) keysToTry.push(oldKey)

    for (const key of keysToTry) {
      try {
        const d = createDecipheriv(ALGO, key, iv)
        d.setAuthTag(tag)
        const plain = Buffer.concat([d.update(ct), d.final()]).toString('utf8')
        return plain
      } catch {
        // Try next key
      }
    }

    console.error('[encryption] Failed to decrypt v2 ciphertext with any active key')
    return ''
  }

  // Legacy: base64-encoded plaintext (old "encryption" scheme)
  try {
    const decoded = Buffer.from(stored, 'base64').toString('utf8')
    if (decoded && /^[\x20-\x7E]+$/.test(decoded)) {
      return decoded
    }
  } catch {
    // Not valid base64
  }

  // Plaintext passthrough (tokens stored before any encryption was applied)
  if (/^[\x20-\x7E]+$/.test(stored)) {
    return stored
  }

  console.warn('[encryption] Could not decrypt value — returning empty string')
  return ''
}

/**
 * Mask a key for UI display, showing only the last 4 characters.
 */
export function maskApiKey(key: string): string {
  if (!key || key.length <= 4) return '••••••••'
  return '•'.repeat(Math.min(20, key.length - 4)) + key.slice(-4)
}
