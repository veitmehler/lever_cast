import Anthropic from '@anthropic-ai/sdk'
import { getSystemApiKey } from '../../lib/system-keys'
import { calculateCost } from './cost-table'
import type { LLMAdapter, LLMCallOptions, LLMResponse } from './adapter'
import { LLMError } from './adapter'
import { instrumentCall } from '../../lib/net/instrument'

const DEFAULT_MODEL = 'claude-sonnet-4-5-20250929'

// The SDK's own default is 10 minutes with 2 built-in retries (retried
// automatically on timeout/429/5xx) — far too long to hold a worker slot for
// a text call. 2 min covers the largest completions used here (maxTokens up
// to 8000). See .plans/social-generation-resilience.implementation-plan.md.
const ANTHROPIC_TIMEOUT_MS = 120_000

function parseAnthropicError(err: unknown): LLMError {
  const msg = err instanceof Error ? err.message : String(err)
  const lower = msg.toLowerCase()

  if (lower.includes('529') || lower.includes('overloaded')) {
    return new LLMError(msg, { quotaType: 'overloaded', retryAfterSeconds: 30 })
  }

  if (lower.includes('429') || lower.includes('rate_limit') || lower.includes('rate limit')) {
    // Try to read retry-after from the error if Anthropic SDK embeds it
    const retryMatch = msg.match(/retry.?after[:\s]+(\d+)/i)
    return new LLMError(msg, {
      quotaType: 'rate_limit',
      retryAfterSeconds: retryMatch ? parseInt(retryMatch[1], 10) : 60,
    })
  }

  return new LLMError(msg, { quotaType: 'unknown' })
}

export class AnthropicAdapter implements LLMAdapter {
  getProvider() { return 'anthropic' }

  supportsModel(model: string) {
    return model.startsWith('claude')
  }

  async call(options: LLMCallOptions): Promise<LLMResponse> {
    const apiKey = await getSystemApiKey('anthropic')
    if (!apiKey) throw new LLMError('No API key configured for provider: anthropic')

    const model = options.model || DEFAULT_MODEL
    const temperature = options.temperature ?? 0.7
    const maxTokens = options.maxTokens ?? 8192

    try {
      const client = new Anthropic({ apiKey, timeout: ANTHROPIC_TIMEOUT_MS })
      const response = await instrumentCall({ provider: 'anthropic', op: `messages.create:${model}` }, () =>
        client.messages.create({
          model,
          max_tokens: maxTokens,
          temperature,
          ...(options.systemPrompt ? { system: options.systemPrompt } : {}),
          messages: [{ role: 'user', content: options.userPrompt }],
        }),
      )

      const textBlock = response.content.find(
        (b): b is Anthropic.TextBlock => b.type === 'text',
      )
      const text = textBlock?.text ?? ''
      if (!text.trim()) throw new LLMError('Anthropic returned empty response')

      const inputTokens = response.usage.input_tokens
      const outputTokens = response.usage.output_tokens

      const rawFinish = response.stop_reason
      const finishReason =
        rawFinish === 'end_turn'      ? 'stop'   :
        rawFinish === 'max_tokens'    ? 'length' :
        rawFinish === 'stop_sequence' ? 'stop'   : 'other'

      return {
        content: text,
        tokens: { input: inputTokens, output: outputTokens, total: inputTokens + outputTokens },
        cost: calculateCost(model, inputTokens, outputTokens),
        model,
        provider: 'anthropic',
        finishReason,
      }
    } catch (err) {
      if (err instanceof LLMError) throw err
      throw parseAnthropicError(err)
    }
  }
}
