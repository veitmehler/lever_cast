import { getLLMAdapter } from '../../article-pipeline/llm/factory'
import { cleanAndParseJSON, cleanTextOutput } from '../../article-pipeline/output-cleaner'
import { loadPromptTemplate } from '../../article-pipeline/enrichment/prompt-template'

const DEF_SYS =
  'You are a social media content strategist. Select the single most compelling, shareable quote from the provided content. The quote must stand alone without context, be under 220 characters, and avoid hashtags or emojis.'

const DEF_USER = `Select ONE quote from the content below for a branded social media quote card.

Content:
{{content}}

Organization: {{organizationName}}

Rules:
- Return ONLY valid JSON: { "quote": "...", "attribution": "optional source label" }
- Quote must be ≤ 220 characters
- Prefer declarative insights, surprising facts, or actionable advice
- Do not invent facts not present in the content
- attribution is optional (e.g. article title or author); omit if unclear`

const DEF_BATCH_SYS =
  'You are a social media content strategist. Extract the most compelling, shareable quotes from the provided content. Each quote must stand alone without context, be under 220 characters, and avoid hashtags or emojis. Every quote must cover a DIFFERENT idea from the content — no two quotes may restate the same insight.'

const DEF_BATCH_USER = `Select {{count}} DISTINCT quotes from the content below for a branded social media quote-card slideshow.

Content:
{{content}}

Organization: {{organizationName}}

Rules:
- Return ONLY valid JSON: { "quotes": [ { "quote": "...", "attribution": "optional source label" } ] }
- Exactly {{count}} quotes, each ≤ 220 characters
- Each quote MUST cover a different idea, fact, or piece of advice — never the same insight reworded
- Prefer declarative insights, surprising facts, or actionable advice
- Do not invent facts not present in the content
- attribution is optional (e.g. article title or author); omit if unclear`

export interface QuoteSelectionResult {
  quote: string
  attribution?: string
}

export async function selectQuoteForCard(opts: {
  content: string
  organizationName: string
}): Promise<QuoteSelectionResult> {
  const t = await loadPromptTemplate(201)
  const provider = (t?.defaultProvider ?? 'anthropic').toLowerCase()
  const model = t?.defaultModel ?? 'claude-sonnet-4-5-20250929'

  const userPrompt = (t?.userPrompt ?? DEF_USER)
    .replace(/\{\{content\}\}/g, opts.content.slice(0, 8000))
    .replace(/\{\{organizationName\}\}/g, opts.organizationName)

  const adapter = getLLMAdapter(provider)
  const run = await adapter.call({
    systemPrompt: t?.systemPrompt ?? DEF_SYS,
    userPrompt,
    model,
    temperature: 0.4,
    maxTokens: 256,
    jsonMode: true,
  })

  let quote = ''
  let attributionRaw: string | undefined

  try {
    const parsed = cleanAndParseJSON(cleanTextOutput(run.content))
    const data = parsed.data as { quote?: string; attribution?: string }
    quote = (data.quote ?? '').trim()
    attributionRaw = data.attribution?.trim()
  } catch {
    // LLM returned plain text instead of JSON — treat it as the quote directly
    const plain = cleanTextOutput(run.content).trim()
    if (plain.length > 0 && plain.length <= 400) {
      quote = plain
    } else {
      throw new Error(`LLM did not return a valid quote or JSON: ${run.content.slice(0, 120)}`)
    }
  }

  if (!quote) throw new Error('LLM did not return a quote')

  return {
    quote: quote.slice(0, 280),
    attribution: attributionRaw || undefined,
  }
}

/**
 * Batch variant for multi-slide quote videos (S3): ONE LLM call returning
 * `count` quotes that each cover a different idea, so the slides are not the
 * same insight reworded (which is what independent selectQuoteForCard calls
 * on the same content produce).
 */
export async function selectQuotesForCards(opts: {
  content: string
  organizationName: string
  count: number
}): Promise<QuoteSelectionResult[]> {
  const t = await loadPromptTemplate(209)
  const provider = (t?.defaultProvider ?? 'anthropic').toLowerCase()
  const model = t?.defaultModel ?? 'claude-sonnet-4-5-20250929'

  const userPrompt = (t?.userPrompt ?? DEF_BATCH_USER)
    .replace(/\{\{content\}\}/g, opts.content.slice(0, 8000))
    .replace(/\{\{organizationName\}\}/g, opts.organizationName)
    .replace(/\{\{count\}\}/g, String(opts.count))

  const adapter = getLLMAdapter(provider)
  const run = await adapter.call({
    systemPrompt: t?.systemPrompt ?? DEF_BATCH_SYS,
    userPrompt,
    model,
    temperature: 0.4,
    maxTokens: 1024,
    jsonMode: true,
  })

  const parsed = cleanAndParseJSON(cleanTextOutput(run.content))
  const data = parsed.data as { quotes?: Array<{ quote?: string; attribution?: string }> }
  const quotes = (data.quotes ?? [])
    .map((q) => ({
      quote: (q.quote ?? '').trim().slice(0, 280),
      attribution: q.attribution?.trim() || undefined,
    }))
    .filter((q) => q.quote.length > 0)

  if (quotes.length === 0) throw new Error('LLM did not return any quotes')
  return quotes.slice(0, opts.count)
}
