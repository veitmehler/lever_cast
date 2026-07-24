/**
 * Embedded-app authentication (onboarding plan Phase 0).
 *
 * Inside the GHL iframe there is no Clerk: the decrypted GHL SSO context IS
 * the identity. We exchange it for our own short-lived HMAC token, sent as
 * `Authorization: Bearer emb_<token>` — no cookies, so third-party-cookie
 * blocking is irrelevant. Clerk continues to protect the open web unchanged.
 *
 * GHL encrypts the SSO payload with CryptoJS.AES (OpenSSL EVP format):
 * base64("Salted__" + 8-byte salt + ciphertext), key+iv derived from the
 * shared secret via MD5-based EVP_BytesToKey. Implemented with node:crypto —
 * no crypto-js dependency.
 */
import { createDecipheriv, createHash, createHmac, timingSafeEqual } from 'node:crypto'

export interface GhlSsoContext {
  userId: string
  companyId: string
  role?: string
  type?: string
  activeLocation?: string
  userName?: string
  email?: string
  [key: string]: unknown
}

/** OpenSSL EVP_BytesToKey (MD5, no iterations) — CryptoJS-compatible KDF. */
function evpKdf(password: Buffer, salt: Buffer, keyLen: number, ivLen: number) {
  let derived = Buffer.alloc(0)
  let block = Buffer.alloc(0)
  while (derived.length < keyLen + ivLen) {
    block = createHash('md5').update(Buffer.concat([block, password, salt])).digest()
    derived = Buffer.concat([derived, block])
  }
  return { key: derived.subarray(0, keyLen), iv: derived.subarray(keyLen, keyLen + ivLen) }
}

export function decryptGhlSso(encrypted: string, ssoSecret: string): GhlSsoContext {
  const raw = Buffer.from(encrypted, 'base64')
  if (raw.subarray(0, 8).toString('latin1') !== 'Salted__') {
    throw new Error('Unexpected SSO payload format (missing OpenSSL salt header)')
  }
  const salt = raw.subarray(8, 16)
  const ciphertext = raw.subarray(16)
  const { key, iv } = evpKdf(Buffer.from(ssoSecret, 'utf8'), salt, 32, 16)
  const decipher = createDecipheriv('aes-256-cbc', key, iv)
  const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')
  const parsed = JSON.parse(plain) as GhlSsoContext
  if (!parsed.userId) throw new Error('SSO payload missing userId')
  return parsed
}

/** CryptoJS-compatible encrypt — used by tests and the staging simulator only. */
export function encryptGhlSsoForTest(payload: object, ssoSecret: string, salt?: Buffer): string {
  const s = salt ?? createHash('md5').update(String(Math.random())).digest().subarray(0, 8)
  const { key, iv } = evpKdf(Buffer.from(ssoSecret, 'utf8'), s, 32, 16)
  const { createCipheriv } = require('node:crypto') as typeof import('node:crypto')
  const cipher = createCipheriv('aes-256-cbc', key, iv)
  const ct = Buffer.concat([cipher.update(JSON.stringify(payload), 'utf8'), cipher.final()])
  return Buffer.concat([Buffer.from('Salted__', 'latin1'), s, ct]).toString('base64')
}

// ── Our embed session token (minimal HS256 JWT, node:crypto only) ────────────

const EMBED_TOKEN_TTL_SECONDS = 15 * 60

function tokenSecret(): string {
  const s = process.env.EMBED_JWT_SECRET || process.env.GHL_SSO_SECRET
  if (!s) throw new Error('EMBED_JWT_SECRET / GHL_SSO_SECRET not configured')
  return s
}

function b64url(buf: Buffer): string {
  return buf.toString('base64url')
}

export interface EmbedTokenPayload {
  /** The synthetic clerkId ("ghl:<ghlUserId>") every existing code path keys on. */
  sub: string
  accountId: string
  exp: number
}

export function signEmbedToken(payload: Omit<EmbedTokenPayload, 'exp'>): string {
  const full: EmbedTokenPayload = { ...payload, exp: Math.floor(Date.now() / 1000) + EMBED_TOKEN_TTL_SECONDS }
  const header = b64url(Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })))
  const body = b64url(Buffer.from(JSON.stringify(full)))
  const sig = b64url(createHmac('sha256', tokenSecret()).update(`${header}.${body}`).digest())
  return `${header}.${body}.${sig}`
}

export function verifyEmbedToken(token: string): EmbedTokenPayload | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [header, body, sig] = parts
  const expected = createHmac('sha256', tokenSecret()).update(`${header}.${body}`).digest()
  const given = Buffer.from(sig, 'base64url')
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as EmbedTokenPayload
    if (!payload.sub || payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

/** Synthetic clerkId for GHL-SSO users — keeps clerkId-keyed code paths intact. */
export function ghlClerkId(ghlUserId: string): string {
  return `ghl:${ghlUserId}`
}
