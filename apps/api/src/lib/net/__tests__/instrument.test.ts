import { describe, it, expect } from 'vitest'
import { instrumentCall } from '../instrument'

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
