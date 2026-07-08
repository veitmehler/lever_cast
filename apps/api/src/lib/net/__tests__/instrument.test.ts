import { describe, it, expect, beforeEach } from 'vitest'
import { instrumentCall } from '../instrument'
import { getCircuitBreaker, resetAllCircuitBreakers } from '../circuit-breaker'

beforeEach(() => resetAllCircuitBreakers())

describe('instrumentCall', () => {
  it('resolves with the underlying result on success', async () => {
    const result = await instrumentCall({ provider: 'fal-ai', op: 'image' }, async () => 'ok')
    expect(result).toBe('ok')
  })

  it('enriches the thrown error message with provider, op, status, and duration', async () => {
    const err = Object.assign(new Error('Forbidden'), { status: 403 })
    await expect(
      instrumentCall({ provider: 'fal-ai', op: 'image:fal-ai/flux/schnell' }, async () => {
        throw err
      }),
    ).rejects.toThrow(/fal-ai image:fal-ai\/flux\/schnell \(403\) failed after \d+ms: Forbidden/)
  })

  it('omits the status parenthetical when the error has no status', async () => {
    await expect(
      instrumentCall({ provider: 'elevenlabs', op: 'tts' }, async () => {
        throw new Error('network blip')
      }),
    ).rejects.toThrow(/^elevenlabs tts failed after \d+ms: network blip$/)
  })

  it('preserves the original message verbatim so keyword-matching classifiers still work', async () => {
    // parseAnthropicError/parseOpenAIError/parseGeminiError lowercase-match
    // substrings like "429" / "rate limit" / "quota" against err.message.
    try {
      await instrumentCall({ provider: 'anthropic', op: 'llm-call' }, async () => {
        throw new Error('429 rate_limit_error: too many requests')
      })
      expect.unreachable()
    } catch (err) {
      expect((err as Error).message).toContain('429 rate_limit_error: too many requests')
    }
  })

  it('sets .cause to the original error for debugging', async () => {
    const original = new Error('boom')
    try {
      await instrumentCall({ provider: 'p', op: 'o' }, async () => {
        throw original
      })
      expect.unreachable()
    } catch (err) {
      expect((err as Error).cause).toBe(original)
    }
  })

  it('re-throws non-Error thrown values without crashing', async () => {
    await expect(
      instrumentCall({ provider: 'p', op: 'o' }, async () => {
        throw 'a string failure'
      }),
    ).rejects.toThrow(/p o failed after \d+ms: a string failure/)
  })
})

describe('instrumentCall — circuit breaker integration (Phase 6)', () => {
  it('opens the provider circuit after 5 consecutive failures and short-circuits without calling fn', async () => {
    const fn = async () => {
      throw new Error('down')
    }
    for (let i = 0; i < 5; i++) {
      await expect(instrumentCall({ provider: 'circuit-test', op: 'x' }, fn)).rejects.toThrow()
    }
    expect(getCircuitBreaker('circuit-test').getState()).toBe('open')

    let called = false
    await expect(
      instrumentCall({ provider: 'circuit-test', op: 'x' }, async () => {
        called = true
        return 'should never get here'
      }),
    ).rejects.toThrow(/circuit-test circuit is open/)
    expect(called).toBe(false)
  })

  it('a success resets the failure count so an open circuit requires a fresh streak', async () => {
    const provider = 'circuit-test-2'
    for (let i = 0; i < 4; i++) {
      await expect(
        instrumentCall({ provider, op: 'x' }, async () => {
          throw new Error('down')
        }),
      ).rejects.toThrow()
    }
    expect(getCircuitBreaker(provider).getState()).toBe('closed') // 4 < threshold of 5

    await instrumentCall({ provider, op: 'x' }, async () => 'ok') // resets the streak
    expect(getCircuitBreaker(provider).getState()).toBe('closed')

    for (let i = 0; i < 4; i++) {
      await expect(
        instrumentCall({ provider, op: 'x' }, async () => {
          throw new Error('down')
        }),
      ).rejects.toThrow()
    }
    // Still only 4 in a row since the reset — still closed.
    expect(getCircuitBreaker(provider).getState()).toBe('closed')
  })

  it('the circuit-open rejection carries a clear message, not the generic provider-op-duration enrichment', async () => {
    const provider = 'circuit-test-3'
    for (let i = 0; i < 5; i++) {
      await expect(
        instrumentCall({ provider, op: 'x' }, async () => {
          throw new Error('down')
        }),
      ).rejects.toThrow()
    }
    await expect(instrumentCall({ provider, op: 'x' }, async () => 'ok')).rejects.toThrow(
      /circuit-test-3 circuit is open \(too many recent failures\)/,
    )
  })
})
