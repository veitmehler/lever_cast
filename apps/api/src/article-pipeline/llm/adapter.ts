export interface LLMResponse {
  content: string
  tokens: { input: number; output: number; total: number }
  cost: number
  model: string
  provider: string
}

export interface LLMCallOptions {
  systemPrompt?: string | null
  userPrompt: string
  model: string
  temperature?: number
  maxTokens?: number
  useGenerativeSearch?: boolean
  /** Force JSON output mode (Gemini: responseMimeType = 'application/json'). */
  jsonMode?: boolean
}

export interface LLMAdapter {
  call(options: LLMCallOptions): Promise<LLMResponse>
  getProvider(): string
  supportsModel(model: string): boolean
}

export class LLMError extends Error {
  quotaType?: 'daily' | 'rate_limit' | 'overloaded' | 'unknown'
  retryAfterSeconds?: number
  quotaLimit?: string

  constructor(
    message: string,
    opts?: { quotaType?: LLMError['quotaType']; retryAfterSeconds?: number; quotaLimit?: string },
  ) {
    super(message)
    this.name = 'LLMError'
    if (opts) {
      this.quotaType = opts.quotaType
      this.retryAfterSeconds = opts.retryAfterSeconds
      this.quotaLimit = opts.quotaLimit
    }
  }
}
