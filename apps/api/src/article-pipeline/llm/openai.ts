import OpenAI from 'openai'
import { getSystemApiKey } from '../../lib/system-keys'
import { calculateCost } from './cost-table'
import { logger } from '../../lib/logger'
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
    return model.startsWith('gpt') || model.startsWith('o')
  }

  async call(options: LLMCallOptions): Promise<LLMResponse> {
    const apiKey = await getSystemApiKey('openai')
    if (!apiKey) throw new LLMError('No API key configured for provider: openai')

    const model = options.model || DEFAULT_MODEL

    try {
      const client = new OpenAI({ apiKey })

      // Reasoning models (e.g. gpt-5.2-codex) require the Responses API.
      // v1/chat/completions rejects them server-side even though the docs list it.
      if (options.reasoningEffort) {
        return await callResponsesApi(client, model, options)
      }

      return await callChatCompletions(client, model, options)
    } catch (err) {
      if (err instanceof LLMError) throw err
      throw parseOpenAIError(err)
    }
  }
}

/** Standard chat models — v1/chat/completions */
async function callChatCompletions(
  client: OpenAI,
  model: string,
  options: LLMCallOptions,
): Promise<LLMResponse> {
  const temperature = options.temperature ?? 0.7
  const maxTokens = options.maxTokens

  const messages: OpenAI.ChatCompletionMessageParam[] = []
  if (options.systemPrompt) {
    messages.push({ role: 'system', content: options.systemPrompt })
  }
  messages.push({ role: 'user', content: options.userPrompt })

  const response = await client.chat.completions.create({
    model,
    messages,
    temperature,
    ...(maxTokens ? { max_tokens: maxTokens } : {}),
  })

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
}

/** Reasoning models (Codex family) — v1/responses */
async function callResponsesApi(
  client: OpenAI,
  model: string,
  options: LLMCallOptions,
): Promise<LLMResponse> {
  const maxTokens = options.maxTokens

  // Build input: combine system instructions + user message into a flat string
  // when using the simpler `input` field, or pass as structured messages.
  const inputMessages: OpenAI.Responses.EasyInputMessage[] = []
  if (options.systemPrompt) {
    inputMessages.push({ role: 'user', content: options.systemPrompt + '\n\n' + options.userPrompt })
  } else {
    inputMessages.push({ role: 'user', content: options.userPrompt })
  }

  const response = await client.responses.create({
    model,
    input: inputMessages,
    reasoning: { effort: options.reasoningEffort! },
    ...(maxTokens ? { max_output_tokens: maxTokens } : {}),
  })

  const text = response.output_text ?? ''
  if (!text.trim()) throw new LLMError('OpenAI Responses API returned empty output')

  const inputTokens = response.usage?.input_tokens ?? 0
  // output_tokens already includes hidden reasoning tokens — correct for billing
  const outputTokens = response.usage?.output_tokens ?? 0
  const reasoningTokens = response.usage?.output_tokens_details?.reasoning_tokens ?? 0

  if (reasoningTokens > 0) {
    logger.debug({ model, inputTokens, outputTokens, reasoningTokens }, '[openai] reasoning tokens used')
  }

  return {
    content: text,
    tokens: { input: inputTokens, output: outputTokens, total: inputTokens + outputTokens },
    cost: calculateCost(model, inputTokens, outputTokens),
    model,
    provider: 'openai',
  }
}
