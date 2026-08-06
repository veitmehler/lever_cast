/**
 * Thin prompt runner for the newsletter pipeline.
 *
 * Fetches a DB-backed PromptTemplate by its string `key` (the nl_* prompts),
 * substitutes {{variables}}, and calls the configured provider/model through the
 * shared LLM adapter. Two variants: plain text and JSON (with the article
 * pipeline's clean-and-parse + a small retry).
 *
 * Cost: returns the LLMResponse so callers can record LLMUsage when a user
 * context exists (per-customer generation, Phase 1c). Shared topic-level research
 * has no user, so it just logs the cost.
 */
import { resolvePromptByKey } from '../lib/prompt-resolver'
import { getLLMAdapter } from '../article-pipeline/llm/factory'
import type { LLMResponse } from '../article-pipeline/llm/adapter'
import { cleanAndParseJSON } from '../article-pipeline/output-cleaner'
import { logger } from '../lib/logger'

export type PromptVars = Record<string, string | null | undefined>

/** Substitute {{var}} tokens (and the special {{ $now.year }}). */
export function fillPrompt(template: string, vars: PromptVars): string {
  return template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_m, raw: string) => {
    const key = raw.trim()
    if (key === '$now.year') return String(new Date().getFullYear())
    const v = vars[key]
    return v == null ? '' : String(v)
  })
}

export interface RunOptions {
  useSearch?: boolean
  jsonMode?: boolean
  temperature?: number
  maxTokens?: number
  /** Vertical resolution context (V0): the generating user (or explicit vertical). */
  userId?: string | null
  vertical?: string | null
}

export interface RunResult {
  content: string
  response: LLMResponse
}

/** Run a prompt by key → raw text response. Throws if the prompt is not seeded. */
export async function runNewsletterPrompt(
  key: string,
  vars: PromptVars,
  opts: RunOptions = {},
): Promise<RunResult> {
  const template = await resolvePromptByKey(key, { userId: opts.userId, vertical: opts.vertical })
  if (!template || !template.isActive) {
    throw new Error(`Newsletter prompt "${key}" is not configured (seed nl_* prompts).`)
  }

  const systemPrompt = template.systemPrompt ? fillPrompt(template.systemPrompt, vars) : null
  const userPrompt = fillPrompt(template.userPrompt, vars)

  const adapter = getLLMAdapter(template.defaultProvider)
  const response = await adapter.call({
    systemPrompt,
    userPrompt,
    model: template.defaultModel,
    temperature: opts.temperature,
    maxTokens: opts.maxTokens ?? template.maxTokens ?? undefined,
    useGenerativeSearch: opts.useSearch,
    jsonMode: opts.jsonMode,
  })

  return { content: response.content, response }
}

/**
 * Run a writer step expressed as the reference's two-key split: a `*_system`
 * prompt (whose content lives in its userPrompt field, systemPrompt=null) drives
 * the model config + system instructions, and a `*_user` prompt supplies the user
 * turn. Returns parsed JSON with a small retry. Used for recipe / kids-snack /
 * tech-free / teaser / article / quick-hits writers.
 */
export async function runNewsletterWriterJson<T = Record<string, unknown>>(
  systemKey: string,
  userKey: string,
  vars: PromptVars,
  opts: RunOptions = {},
): Promise<{ data: T; response: LLMResponse }> {
  const [sys, usr] = await Promise.all([
    resolvePromptByKey(systemKey, { userId: opts.userId, vertical: opts.vertical }),
    resolvePromptByKey(userKey, { userId: opts.userId, vertical: opts.vertical }),
  ])
  if (!sys || !usr) {
    throw new Error(`Newsletter writer prompts not configured (${systemKey} / ${userKey}).`)
  }
  const systemPrompt = fillPrompt(sys.systemPrompt ?? sys.userPrompt, vars)
  const userPrompt = fillPrompt(usr.userPrompt, vars)
  const adapter = getLLMAdapter(sys.defaultProvider)

  let lastErr: unknown
  for (let attempt = 1; attempt <= 3; attempt++) {
    const response = await adapter.call({
      systemPrompt,
      userPrompt,
      model: sys.defaultModel,
      temperature: opts.temperature ?? 0.75,
      maxTokens: opts.maxTokens ?? sys.maxTokens ?? undefined,
      jsonMode: true,
    })
    try {
      const { data } = cleanAndParseJSON(response.content)
      return { data: data as T, response }
    } catch (err) {
      lastErr = err
      logger.warn({ systemKey, attempt }, '[newsletter/llm] writer JSON parse failed — retrying')
      if (attempt < 3) await new Promise((r) => setTimeout(r, 1000 * attempt))
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(`Failed to parse JSON from "${systemKey}"`)
}

/**
 * Run a prompt that must return JSON. Retries up to 3× on parse failure (the
 * model occasionally wraps JSON in prose / fences — cleanAndParseJSON handles
 * most, the retry covers the rest).
 */
export async function runNewsletterJsonPrompt<T = Record<string, unknown>>(
  key: string,
  vars: PromptVars,
  opts: RunOptions = {},
): Promise<{ data: T; response: LLMResponse }> {
  let lastErr: unknown
  for (let attempt = 1; attempt <= 3; attempt++) {
    const { content, response } = await runNewsletterPrompt(key, vars, { ...opts, jsonMode: true })
    try {
      const { data } = cleanAndParseJSON(content)
      return { data: data as T, response }
    } catch (err) {
      lastErr = err
      logger.warn({ key, attempt }, '[newsletter/llm] JSON parse failed — retrying')
      if (attempt < 3) await new Promise((r) => setTimeout(r, 1000 * attempt))
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(`Failed to parse JSON from "${key}"`)
}
