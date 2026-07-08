import { TimeoutError } from './with-timeout'

export interface RetryOptions {
  /** Total attempts including the first (default 2 = one retry). */
  attempts?: number
  baseDelayMs?: number
  maxDelayMs?: number
  isRetryable?: (err: unknown) => boolean
  onRetry?: (err: unknown, attempt: number) => void
}

/** The wrapped original, if `err` carries one (Node's Error.cause, or instrumentCall's convention). */
function causeOf(err: unknown): unknown {
  if (err && typeof err === 'object' && 'cause' in err) return (err as { cause: unknown }).cause
  return undefined
}

/**
 * Duck-types provider error shapes (Fal ApiError, fetch Response-derived errors)
 * that expose `status`. Looks through one level of `.cause` so a status survives
 * instrumentCall's message-enriching wrapper (lib/net/instrument.ts).
 */
export function statusOf(err: unknown): number | undefined {
  if (err && typeof err === 'object' && 'status' in err) {
    const s = (err as { status: unknown }).status
    if (typeof s === 'number') return s
  }
  const cause = causeOf(err)
  return cause !== undefined ? statusOf(cause) : undefined
}

/**
 * Default retry policy: transient conditions only. Explicitly excludes auth
 * and balance/quota failures (401/403/404/422) — retrying those just delays
 * the inevitable failure and burns the attempt budget (observed in the
 * 2026-07-08 incident: Fal returned 403 "Exhausted balance" and retrying
 * would not have helped).
 *
 * Checks `.cause` too — instrumentCall wraps the original error in a plain
 * Error to enrich its message, which would otherwise hide a TimeoutError
 * instance or a provider's `.status` from this check.
 */
export function isRetryableNetworkError(err: unknown): boolean {
  if (err instanceof TimeoutError) return true

  const status = statusOf(err)
  if (status !== undefined) return status === 429 || status >= 500

  const message = err instanceof Error ? err.message : String(err)
  if (/ECONNRESET|ETIMEDOUT|ECONNREFUSED|EAI_AGAIN|fetch failed|network|socket hang up/i.test(message)) return true

  const cause = causeOf(err)
  return cause !== undefined ? isRetryableNetworkError(cause) : false
}

function jitteredDelay(attempt: number, baseDelayMs: number, maxDelayMs: number): number {
  const exp = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1))
  return Math.round(exp * (0.5 + Math.random() * 0.5)) // 50–100% of the exponential value
}

/** Retry `fn` with exponential backoff + jitter, bounded by `attempts`. */
export async function withRetry<T>(fn: () => Promise<T>, opts: RetryOptions = {}): Promise<T> {
  const attempts = opts.attempts ?? 2
  const baseDelayMs = opts.baseDelayMs ?? 1000
  const maxDelayMs = opts.maxDelayMs ?? 15000
  const isRetryable = opts.isRetryable ?? isRetryableNetworkError

  let lastErr: unknown
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      if (attempt >= attempts || !isRetryable(err)) throw err
      opts.onRetry?.(err, attempt)
      await new Promise((r) => setTimeout(r, jitteredDelay(attempt, baseDelayMs, maxDelayMs)))
    }
  }
  throw lastErr
}
