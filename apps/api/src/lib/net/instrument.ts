import { logger } from '../logger'
import { statusOf } from './retry'

/**
 * Wrap an external call with structured timing/outcome logging AND enrich a
 * failure's message with provider/op/status/duration before re-throwing.
 *
 * Why enrich the message rather than just log: the 2026-07-08 Fal 403 incident
 * surfaced as a bare "Forbidden" in SocialAutomationSpecResult.error — no
 * provider, no status code, no duration. That field only ever stores
 * `err.message` (see matrix-processor.ts / story-processor.ts catch blocks),
 * so a structured log line alone wouldn't have fixed what the admin UI and
 * sendFailureAlert actually show. Enriching the message at the source means
 * every downstream consumer (DB error field, alert emails, admin UI, logs)
 * gets the context for free with no changes anywhere else.
 *
 * The original message is preserved verbatim as a suffix so callers that
 * pattern-match on it (parseAnthropicError/parseOpenAIError/parseGeminiError
 * keyword-match for 429/quota/etc.) keep working unmodified.
 */
export async function instrumentCall<T>(
  meta: { provider: string; op: string },
  fn: () => Promise<T>,
): Promise<T> {
  const start = Date.now()
  try {
    const result = await fn()
    logger.info(
      { provider: meta.provider, op: meta.op, durationMs: Date.now() - start, outcome: 'success' },
      '[net] call succeeded',
    )
    return result
  } catch (err) {
    const durationMs = Date.now() - start
    const status = statusOf(err)
    const rawMessage = err instanceof Error ? err.message : String(err)

    logger.warn(
      { provider: meta.provider, op: meta.op, durationMs, status, outcome: 'error', message: rawMessage },
      '[net] call failed',
    )

    const enriched = new Error(
      `${meta.provider} ${meta.op}${status !== undefined ? ` (${status})` : ''} failed after ${durationMs}ms: ${rawMessage}`,
    )
    if (err instanceof Error && err.stack) enriched.stack = err.stack
    enriched.cause = err
    throw enriched
  }
}
