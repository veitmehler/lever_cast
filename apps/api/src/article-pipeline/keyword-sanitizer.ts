import { logger } from '../lib/logger'

/**
 * Local-intent modifiers that should be stripped from keyword phrases.
 * These signal Google Maps / Local Pack intent, not informational article intent.
 * Matched case-insensitively, at word boundaries, at the end of a phrase.
 */
const LOCAL_INTENT_PATTERNS = [
  /\s+near\s+me\b/gi,
  /\s+near\s+you\b/gi,
  /\s+near\s+us\b/gi,
  /\s+close\s+to\s+me\b/gi,
  /\s+close\s+by\b/gi,
  /\s+close\s+to\s+you\b/gi,
  /\s+around\s+me\b/gi,
  /\s+around\s+here\b/gi,
  /\s+in\s+my\s+area\b/gi,
  /\s+in\s+your\s+area\b/gi,
  /\s+in\s+my\s+city\b/gi,
  /\s+in\s+my\s+town\b/gi,
]

/**
 * Strip local-intent modifiers ("near me", "close to me", etc.) from a single
 * keyword phrase. City/state qualifiers are intentionally preserved — they are
 * valid geo-targeting and should remain in the keyword.
 */
export function sanitizeKeywordPhrase(phrase: string): string {
  let result = phrase
  for (const pattern of LOCAL_INTENT_PATTERNS) {
    result = result.replace(pattern, '')
  }
  return result.trim()
}

/**
 * Walk the parsed Step 2 JSON object and apply sanitizeKeywordPhrase to every
 * string value. Returns a new object — does not mutate the input.
 */
export function sanitizeKeywordJson(
  parsed: Record<string, unknown>,
  jobId?: string,
): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(parsed)) {
    if (typeof value === 'string') {
      const cleaned = sanitizeKeywordPhrase(value)
      if (cleaned !== value) {
        logger.info(
          { jobId, step: 2, key, original: value, cleaned },
          '[keyword-sanitizer] stripped local modifier from keyword',
        )
      }
      result[key] = cleaned
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) => {
        if (typeof item === 'string') {
          const cleaned = sanitizeKeywordPhrase(item)
          if (cleaned !== item) {
            logger.info(
              { jobId, step: 2, key, original: item, cleaned },
              '[keyword-sanitizer] stripped local modifier from keyword array item',
            )
          }
          return cleaned
        }
        return item
      })
    } else {
      result[key] = value
    }
  }

  return result
}

/**
 * Apply sanitizeKeywordPhrase to a plain-text step output (Steps 3 and 6).
 * Processes the text line-by-line, preserving structure (headings, bullets, blank lines).
 * Each non-empty line that contains a local-intent modifier is cleaned in place.
 */
export function sanitizeKeywordText(text: string, step?: number, jobId?: string): string {
  const lines = text.split('\n')
  const cleaned = lines.map((line) => {
    const trimmed = line.trim()
    if (!trimmed) return line

    const sanitized = sanitizeKeywordPhrase(trimmed)
    if (sanitized !== trimmed) {
      // Preserve the original leading whitespace/prefix
      const leadingSpace = line.slice(0, line.indexOf(trimmed))
      logger.info(
        { jobId, step, original: trimmed, cleaned: sanitized },
        '[keyword-sanitizer] stripped local modifier from keyword text',
      )
      return leadingSpace + sanitized
    }
    return line
  })
  return cleaned.join('\n')
}
