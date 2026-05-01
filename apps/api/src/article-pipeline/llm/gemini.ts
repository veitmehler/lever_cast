import { GoogleGenerativeAI } from '@google/generative-ai'
import { getSystemApiKey } from '../../lib/system-keys'
import { calculateCost } from './cost-table'
import type { LLMAdapter, LLMCallOptions, LLMResponse } from './adapter'
import { LLMError } from './adapter'

const DEFAULT_MODEL = 'gemini-2.5-flash'

function parseGeminiError(err: unknown): LLMError {
  const msg = err instanceof Error ? err.message : String(err)
  const lower = msg.toLowerCase()

  // Daily quota exhausted
  if (lower.includes('quota') || lower.includes('resource_exhausted')) {
    const llmErr = new LLMError(msg, { quotaType: 'daily' })
    // Try to extract retryAfterSeconds from errorDetails
    try {
      const detailMatch = msg.match(/"retryDelay":"(\d+)s"/)
      if (detailMatch) llmErr.retryAfterSeconds = parseInt(detailMatch[1], 10)
    } catch { /* ignore */ }
    return llmErr
  }

  // Rate limit (429)
  if (lower.includes('429') || lower.includes('rate_limit') || lower.includes('rate limit')) {
    const retryMatch = msg.match(/retry in ([\d.]+)s/i)
    return new LLMError(msg, {
      quotaType: 'rate_limit',
      retryAfterSeconds: retryMatch ? Math.ceil(parseFloat(retryMatch[1])) : 60,
    })
  }

  // Server overloaded
  if (lower.includes('503') || lower.includes('overloaded')) {
    return new LLMError(msg, { quotaType: 'overloaded', retryAfterSeconds: 30 })
  }

  return new LLMError(msg, { quotaType: 'unknown' })
}

export class GeminiAdapter implements LLMAdapter {
  getProvider() { return 'gemini' }

  supportsModel(model: string) {
    return model.startsWith('gemini')
  }

  async call(options: LLMCallOptions): Promise<LLMResponse> {
    const apiKey = await getSystemApiKey('gemini')
    if (!apiKey) throw new LLMError('No API key configured for provider: gemini')

    const model = options.model || DEFAULT_MODEL
    const temperature = options.temperature ?? 0.7
    const maxTokens = options.maxTokens ?? 8192

    try {
      if (options.useGenerativeSearch) {
        return await this.callWithSearch(apiKey, model, options, temperature, maxTokens)
      }
      return await this.callStandard(apiKey, model, options, temperature, maxTokens)
    } catch (err) {
      if (err instanceof LLMError) throw err
      throw parseGeminiError(err)
    }
  }

  private async callStandard(
    apiKey: string,
    model: string,
    options: LLMCallOptions,
    temperature: number,
    maxTokens: number,
  ): Promise<LLMResponse> {
    const genAI = new GoogleGenerativeAI(apiKey)
    const genModel = genAI.getGenerativeModel({
      model,
      ...(options.systemPrompt ? { systemInstruction: options.systemPrompt } : {}),
      generationConfig: { temperature, maxOutputTokens: maxTokens },
    })

    const result = await genModel.generateContent(options.userPrompt)
    const response = result.response

    if (response.promptFeedback?.blockReason) {
      throw new LLMError(`Gemini blocked: ${response.promptFeedback.blockReason}`)
    }

    const text = response.text() || ''
    if (!text.trim()) throw new LLMError('Gemini returned empty response')

    const inputTokens = response.usageMetadata?.promptTokenCount ?? 0
    const outputTokens = response.usageMetadata?.candidatesTokenCount ?? 0

    return {
      content: text,
      tokens: { input: inputTokens, output: outputTokens, total: inputTokens + outputTokens },
      cost: calculateCost(model, inputTokens, outputTokens),
      model,
      provider: 'gemini',
    }
  }

  private async callWithSearch(
    apiKey: string,
    model: string,
    options: LLMCallOptions,
    temperature: number,
    maxTokens: number,
  ): Promise<LLMResponse> {
    // Concatenate system + user prompt as the search endpoint ignores systemInstruction
    const combinedPrompt = options.systemPrompt
      ? `${options.systemPrompt}\n\n${options.userPrompt}`
      : options.userPrompt

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
    const body = {
      contents: [{ role: 'user', parts: [{ text: combinedPrompt }] }],
      tools: [{ google_search: {} }],
      generationConfig: { temperature, maxOutputTokens: maxTokens },
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}))
      const msg = errBody?.error?.message || `Gemini search API error ${res.status}`
      throw parseGeminiError(new Error(msg))
    }

    const data = await res.json()
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    if (!text.trim()) throw new LLMError('Gemini (search) returned empty response')

    const inputTokens = data?.usageMetadata?.promptTokenCount ?? 0
    const outputTokens = data?.usageMetadata?.candidatesTokenCount ?? 0

    return {
      content: text,
      tokens: { input: inputTokens, output: outputTokens, total: inputTokens + outputTokens },
      cost: calculateCost(model, inputTokens, outputTokens),
      model,
      provider: 'gemini',
    }
  }
}
