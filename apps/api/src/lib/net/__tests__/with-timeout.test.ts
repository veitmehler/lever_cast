import { describe, it, expect, vi } from 'vitest'
import { withTimeout, TimeoutError } from '../with-timeout'

describe('withTimeout', () => {
  it('resolves when fn finishes before the deadline', async () => {
    const result = await withTimeout(async () => 'ok', 100, 'test-op')
    expect(result).toBe('ok')
  })

  it('rejects with TimeoutError when fn never resolves', async () => {
    const hung = () => new Promise<never>(() => {}) // never resolves — simulates the incident
    await expect(withTimeout(hung, 20, 'hung-op')).rejects.toThrow(TimeoutError)
  })

  it('TimeoutError message includes the label and duration', async () => {
    const hung = () => new Promise<never>(() => {})
    await expect(withTimeout(hung, 20, 'fal-video')).rejects.toThrow(/fal-video timed out after 20ms/)
  })

  it('aborts the signal when the timeout fires', async () => {
    let observedAborted = false
    const fn = (signal: AbortSignal) =>
      new Promise<never>((_, reject) => {
        signal.addEventListener('abort', () => {
          observedAborted = true
          reject(new Error('aborted'))
        })
      })
    await expect(withTimeout(fn, 20, 'op')).rejects.toThrow()
    expect(observedAborted).toBe(true)
  })

  it('propagates the original rejection when fn fails before the deadline', async () => {
    const failing = async () => {
      throw new Error('boom')
    }
    await expect(withTimeout(failing, 1000, 'op')).rejects.toThrow('boom')
  })

  it('clears the timer on success (no dangling handle)', async () => {
    const spy = vi.spyOn(global, 'clearTimeout')
    await withTimeout(async () => 'ok', 1000, 'op')
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })
})
