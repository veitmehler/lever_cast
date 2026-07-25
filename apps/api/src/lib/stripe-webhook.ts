/**
 * Stripe webhook signature verification (Stripe-central billing, 2026-07-24).
 * Implements Stripe's scheme with node:crypto — no stripe SDK dependency:
 * header `Stripe-Signature: t=<ts>,v1=<hmac>[,v1=…]`, signed payload is
 * `<ts>.<rawBody>`, HMAC-SHA256 with the endpoint's signing secret.
 */
import { createHmac, timingSafeEqual } from 'node:crypto'

const DEFAULT_TOLERANCE_SECONDS = 5 * 60

export function verifyStripeSignature(
  rawBody: string,
  signatureHeader: string | undefined,
  secret: string,
  toleranceSeconds = DEFAULT_TOLERANCE_SECONDS,
  nowMs = Date.now(),
): boolean {
  if (!signatureHeader) return false
  let timestamp: number | null = null
  const signatures: string[] = []
  for (const part of signatureHeader.split(',')) {
    const [k, v] = part.split('=', 2)
    if (k?.trim() === 't' && v) timestamp = Number(v)
    if (k?.trim() === 'v1' && v) signatures.push(v.trim())
  }
  if (!timestamp || !Number.isFinite(timestamp) || signatures.length === 0) return false
  if (Math.abs(nowMs / 1000 - timestamp) > toleranceSeconds) return false

  const expected = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex')
  const expectedBuf = Buffer.from(expected, 'utf8')
  return signatures.some((sig) => {
    const given = Buffer.from(sig, 'utf8')
    return given.length === expectedBuf.length && timingSafeEqual(given, expectedBuf)
  })
}

/** Test helper: produce a valid Stripe-Signature header for a payload. */
export function signStripePayloadForTest(rawBody: string, secret: string, tsMs = Date.now()): string {
  const t = Math.floor(tsMs / 1000)
  const v1 = createHmac('sha256', secret).update(`${t}.${rawBody}`).digest('hex')
  return `t=${t},v1=${v1}`
}
