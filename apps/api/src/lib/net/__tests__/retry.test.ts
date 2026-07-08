import { describe, it, expect, vi } from 'vitest'
import { withRetry, isRetryableNetworkError } from '../retry'
import { TimeoutError } from '../with-timeout'

describe('isRetryableNetworkError', () => {
  it('treats TimeoutError as retryable', () => {
    expect(isRetryableNetworkError(new TimeoutError('op', 100))).toBe(true)
  })

  it('treats 429 and 5xx status errors as retryable', () => {
    expect(isRetryableNetworkError({ status: 429 })).toBe(true)
    expect(isRetryableNetworkError({ status: 500 })).toBe(true)
    expect(isRetryableNetworkError({ status: 503 })).toBe(true)
  })

  it('does NOT retry 401/403/404/422 — the 2026-07-08 Fal 403 incident', () => {
    // Fal returned 403 "Exhausted balance" — retrying wastes the attempt
    // budget on a failure retries cannot fix.
    expect(isRetryableNetworkError({ status: 403 })).toBe(false)
    expect(isRetryableNetworkError({ status: 401 })).toBe(false)
    expect(isRetryableNetworkError({ status: 404 })).toBe(false)
    expect(isRetryableNetworkError({ status: 422 })).toBe(false)
  })

  it('treats common network error messages as retryable', () => {
    expect(isRetryableNetworkError(new Error('fetch failed'))).toBe(true)
    expect(isRetryableNetworkError(new Error('ECONNRESET'))).toBe(true)
    expect(isRetryableNetworkError(new Error('socket hang up'))).toBe(true)
  })

  it('defaults unknown errors to non-retryable', () => {
    expect(isRetryableNetworkError(new Error('Forbidden'))).toBe(false)
    expect(isRetryableNetworkError(new Error('validation failed'))).toBe(false)
  })

  it('sees through .cause — instrumentCall wraps a TimeoutError in a plain Error', () => {
    // Regression: instrumentCall (lib/net/instrument.ts) re-throws a `new
    // Error(...)` with the original attached via `.cause` so the message can
    // be enriched. Without cause-traversal, a wrapped TimeoutError would be
    // misclassified as non-retryable and break e.g. image-generation.ts's
    // outer retry loop.
    const wrapped = new Error('fal-ai image failed after 180000ms: op timed out after 180000ms')
    wrapped.cause = new TimeoutError('op', 180000)
    expect(isRetryableNetworkError(wrapped)).toBe(true)
  })

  it('sees through .cause for a wrapped status-bearing error too', () => {
    const original = Object.assign(new Error('Forbidden'), { status: 403 })
    const wrapped = new Error('fal-ai image (403) failed after 50ms: Forbidden')
    wrapped.cause = original
    expect(isRetryableNetworkError(wrapped)).toBe(false) // 403 stays non-retryable through the wrapper
  })
})

describe('withRetry', () => {
  it('returns immediately on success without retrying', async () => {
    const fn = vi.fn().mockResolvedValue('ok')
    const result = await withRetry(fn, { baseDelayMs: 1 })
    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('retries a retryable failure and succeeds on the 2nd attempt', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new TimeoutError('op', 10))
      .mockResolvedValueOnce('recovered')
    const result = await withRetry(fn, { attempts: 2, baseDelayMs: 1 })
    expect(result).toBe('recovered')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('stops retrying once attempts is exhausted and throws the last error', async () => {
    const fn = vi.fn().mockRejectedValue(new TimeoutError('op', 10))
    await expect(withRetry(fn, { attempts: 3, baseDelayMs: 1 })).rejects.toThrow(TimeoutError)
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('does NOT retry a non-retryable error (fails fast — the 403 case)', async () => {
    const fn = vi.fn().mockRejectedValue(Object.assign(new Error('Forbidden'), { status: 403 }))
    await expect(withRetry(fn, { attempts: 3, baseDelayMs: 1 })).rejects.toThrow('Forbidden')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('honors a custom isRetryable predicate', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('custom-transient'))
      .mockResolvedValueOnce('ok')
    const result = await withRetry(fn, {
      attempts: 2,
      baseDelayMs: 1,
      isRetryable: (err) => err instanceof Error && err.message === 'custom-transient',
    })
    expect(result).toBe('ok')
  })

  it('calls onRetry with the error and attempt number', async () => {
    const onRetry = vi.fn()
    const fn = vi.fn()
      .mockRejectedValueOnce(new TimeoutError('op', 10))
      .mockResolvedValueOnce('ok')
    await withRetry(fn, { attempts: 2, baseDelayMs: 1, onRetry })
    expect(onRetry).toHaveBeenCalledTimes(1)
    expect(onRetry.mock.calls[0][1]).toBe(1)
  })
})
