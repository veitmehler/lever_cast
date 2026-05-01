// USD per 1 million tokens
const COST_TABLE: Record<string, { input: number; output: number }> = {
  // Gemini
  'gemini-2.5-flash': { input: 0.075, output: 0.30 },
  'gemini-2.5-pro': { input: 1.25, output: 5.00 },
  'gemini-3-flash': { input: 0.50, output: 3.00 },
  'gemini-3.1-pro': { input: 2.00, output: 12.00 },
  'gemini-pro': { input: 0.50, output: 1.50 },

  // Anthropic
  'claude-sonnet-4-5-20250929': { input: 3.00, output: 15.00 },
  'claude-3-5-sonnet-20241022': { input: 3.00, output: 15.00 },
  'claude-3-opus-20240229': { input: 15.00, output: 75.00 },
  'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },

  // OpenAI
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
  'gpt-4o': { input: 2.50, output: 10.00 },
  'gpt-4-turbo': { input: 10.00, output: 30.00 },
}

export function getCostPerToken(model: string, type: 'input' | 'output'): number {
  const entry = COST_TABLE[model]
  if (!entry) return type === 'input' ? 0.50 : 1.50  // conservative unknown fallback per 1M
  return entry[type]
}

export function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens / 1_000_000) * getCostPerToken(model, 'input')
  const outputCost = (outputTokens / 1_000_000) * getCostPerToken(model, 'output')
  return Number((inputCost + outputCost).toFixed(8))
}
