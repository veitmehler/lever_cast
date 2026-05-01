import { GeminiAdapter } from './gemini'
import { AnthropicAdapter } from './anthropic'
import { OpenAIAdapter } from './openai'
import type { LLMAdapter } from './adapter'

export function getLLMAdapter(provider: string): LLMAdapter {
  switch (provider.toLowerCase()) {
    case 'gemini':
      return new GeminiAdapter()
    case 'openai':
      return new OpenAIAdapter()
    case 'anthropic':
    case 'claude':
      return new AnthropicAdapter()
    default:
      throw new Error(`Unknown LLM provider: ${provider}`)
  }
}
