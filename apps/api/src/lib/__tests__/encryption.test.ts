import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { encrypt, decrypt, maskApiKey } from '../encryption'

// A deterministic 32-byte key (base64) so v2 ciphertext round-trips reproducibly.
const KEY_A = Buffer.alloc(32, 0x07).toString('base64')
const KEY_B = Buffer.alloc(32, 0x42).toString('base64')

beforeAll(() => {
  process.env.ENCRYPTION_KEY = KEY_A
  delete process.env.ENCRYPTION_KEY_OLD
})

afterEach(() => {
  process.env.ENCRYPTION_KEY = KEY_A
  delete process.env.ENCRYPTION_KEY_OLD
})

// These tests pin the CURRENT behavior of the encryption module. Phase 3 will
// intentionally tighten decrypt() (drop legacy/plaintext fallbacks, fail loud);
// the legacy-acceptance assertions below are expected to be updated then.
describe('encryption (characterization)', () => {
  it('round-trips a v2 ciphertext', () => {
    const out = encrypt('hello-secret')
    expect(decrypt(out)).toBe('hello-secret')
  })

  it('produces a v2.<iv>.<tag>.<ct> ciphertext shape', () => {
    const out = encrypt('something')
    const parts = out.split('.')
    expect(parts[0]).toBe('v2')
    expect(parts).toHaveLength(4)
  })

  it('treats empty input as empty on both encrypt and decrypt', () => {
    expect(encrypt('')).toBe('')
    expect(decrypt('')).toBe('')
  })

  it('decrypts legacy base64-encoded plaintext (back-compat path)', () => {
    const legacy = Buffer.from('legacy-token', 'utf8').toString('base64')
    expect(decrypt(legacy)).toBe('legacy-token')
  })

  it('passes through bare printable-ASCII plaintext (back-compat path)', () => {
    expect(decrypt('plain-token-123')).toBe('plain-token-123')
  })

  it('returns empty string for malformed v2 ciphertext', () => {
    expect(decrypt('v2.onlytwo.parts')).toBe('')
  })

  it('decrypts with ENCRYPTION_KEY_OLD after a key rotation', () => {
    // Encrypt under the current primary (KEY_A)...
    const ciphertext = encrypt('rotate-me')
    // ...then rotate: new primary KEY_B, old key KEY_A as fallback.
    process.env.ENCRYPTION_KEY = KEY_B
    process.env.ENCRYPTION_KEY_OLD = KEY_A
    expect(decrypt(ciphertext)).toBe('rotate-me')
  })

  describe('maskApiKey', () => {
    it('shows only the last 4 characters', () => {
      expect(maskApiKey('abcdefgh')).toBe('••••efgh')
    })
    it('fully masks short keys', () => {
      expect(maskApiKey('abc')).toBe('••••••••')
      expect(maskApiKey('')).toBe('••••••••')
    })
  })
})
