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

/** Thrown when a stored value cannot be decrypted (non-v2, malformed, or wrong key). */
export class DecryptionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DecryptionError'
  }
}

/**
 * Decrypt a v2 (AES-256-GCM) ciphertext produced by encrypt().
 *
 * Phase 3: strict. Empty/null input returns '' (callers may store optional
 * credentials). Anything else MUST be authenticated v2 ciphertext — the legacy
 * base64 and plaintext-passthrough fallbacks were removed once every stored row
 * was confirmed v2. A value that isn't v2, is malformed, or can't be decrypted
 * with any active key throws DecryptionError rather than silently returning ''
 * (which previously masked tampering/corruption with an empty credential).
 */
export function decrypt(stored: string): string {
  if (!stored) return ''

  if (!stored.startsWith(`${V2_PREFIX}.`)) {
    throw new DecryptionError('Refusing to decrypt a non-v2 value')
  }

  const parts = stored.split('.')
  if (parts.length !== 4) {
    throw new DecryptionError('Malformed v2 ciphertext')
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
      return Buffer.concat([d.update(ct), d.final()]).toString('utf8')
    } catch {
      // Try next key
    }
  }

  throw new DecryptionError('Failed to decrypt v2 ciphertext with any active key')
}

/**
 * Fail fast at startup if encryption isn't usable. In production this throws when
 * ENCRYPTION_KEY is missing/invalid (getPrimaryKey enforces it), so the process
 * never boots silently using the insecure dev fallback key.
 */
export function assertEncryptionConfigured(): void {
  getPrimaryKey()
}

/**
 * Mask a key for UI display, showing only the last 4 characters.
 */
export function maskApiKey(key: string): string {
  if (!key || key.length <= 4) return '••••••••'
  return '•'.repeat(Math.min(20, key.length - 4)) + key.slice(-4)
}
