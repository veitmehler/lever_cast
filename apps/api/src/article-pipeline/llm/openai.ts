import OpenAI from 'openai'
import { getSystemApiKey } from '../../lib/system-keys'
import { calculateCost } from './cost-table'
import type { LLMAdapter, LLMCallOptions, LLMResponse } from './adapter'
import { LLMError } from './adapter'

const DEFAULT_MODEL = 'gpt-4o-mini'

function parseOpenAIError(err: unknown): LLMError {
  const msg = err instanceof Error ? err.message : String(err)
  const lower = msg.toLowerCase()

  if (lower.includes('429') || lower.includes('rate_limit') || lower.includes('rate limit')) {
    return new LLMError(msg, { quotaType: 'rate_limit', retryAfterSeconds: 60 })
  }

  if (lower.includes('quota') || lower.includes('insufficient')) {
    return new LLMError(msg, { quotaType: 'daily' })
  }

  return new LLMError(msg, { quotaType: 'unknown' })
}

export class OpenAIAdapter implements LLMAdapter {
  getProvider() { return 'openai' }

  supportsModel(model: string) {
    return model.startsWith('gpt')
  }

  async call(options: LLMCallOptions): Promise<LLMResponse> {
    const apiKey = await getSystemApiKey('openai')
    if (!apiKey) throw new LLMError('No API key configured for provider: openai')

    const model = options.model || DEFAULT_MODEL
    const temperature = options.temperature ?? 0.7
    const maxTokens = options.maxTokens

    try {
      const client = new OpenAI({ apiKey })
      const messages: OpenAI.ChatCompletionMessageParam[] = []
      if (options.systemPrompt) {
        messages.push({ role: 'system', content: options.systemPrompt })
      }
      messages.push({ role: 'user', content: options.userPrompt })

      const response = await client.chat.completions.create({
        model,
        messages,
        ...(options.reasoningEffort
          ? { reasoning_effort: options.reasoningEffort }
          : { temperature }),
        ...(maxTokens ? { max_tokens: maxTokens } : {}),
      } as OpenAI.Chat.ChatCompletionCreateParamsNonStreaming)

      const text = response.choices[0]?.message?.content ?? ''
      if (!text.trim()) throw new LLMError('OpenAI returned empty response')

      const inputTokens = response.usage?.prompt_tokens ?? 0
      const outputTokens = response.usage?.completion_tokens ?? 0

      return {
        content: text,
        tokens: { input: inputTokens, output: outputTokens, total: inputTokens + outputTokens },
        cost: calculateCost(model, inputTokens, outputTokens),
        model,
        provider: 'openai',
      }
    } catch (err) {
      if (err instanceof LLMError) throw err
      throw parseOpenAIError(err)
    }
  }
}
