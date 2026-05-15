/**
 * Sanitizes and validates GEO-generated questions before they are written
 * into article headings.
 *
 * Returns the cleaned question string, or null when the input is too short
 * or appears truncated (signals the caller to fall through to the next
 * question source or skip the section entirely).
 */

const INTERROGATIVE_START =
  /^(how|what|why|when|where|which|who|is|are|can|does|do|will|should|could|would)\b/i

const TERMINAL_PUNCT = /[?.!]$/

/** Common English word endings — a final word matching these is "complete". */
const COMPLETE_WORD_ENDINGS = /(?:ing|tion|sion|ness|ment|ity|ous|ful|ive|ent|ant|ance|ence|al|ic|er|or|ly|ed|es|'s|n't|'t)$/i

/**
 * Returns true when the string appears to end mid-word or mid-sentence:
 *   - last char is a plain letter (no terminal punctuation)
 *   - AND the last "word" doesn't look like a complete English word
 */
function looksTruncated(text: string): boolean {
  if (TERMINAL_PUNCT.test(text)) return false

  const words = text.trim().split(/\s+/)
  const lastWord = words[words.length - 1] ?? ''

  // Very short words are likely complete ("a", "in", "to", etc.)
  if (lastWord.length <= 3) return false

  // If the last word ends with a known complete suffix it's probably fine
  if (COMPLETE_WORD_ENDINGS.test(lastWord)) return false

  // Last character is a letter — probably truncated
  return /[a-z]$/i.test(lastWord)
}

/**
 * Sanitize a GEO-generated question string.
 *
 * @returns The cleaned question, or null if the question should be discarded.
 */
export function sanitizeGeoQuestion(raw: string | null | undefined): string | null {
  if (!raw) return null

  // Strip wrapping whitespace and quotes
  let q = raw.trim().replace(/^["'`]+|["'`]+$/g, '').trim()

  if (!q || q.toLowerCase() === 'null') return null

  // Too short to be a real question
  if (q.length < 15) return null

  // Appears truncated mid-word
  if (looksTruncated(q)) return null

  // Capitalise first character
  q = q.charAt(0).toUpperCase() + q.slice(1)

  // Append '?' when the question starts with an interrogative word but lacks
  // terminal punctuation (normalizeH2Questions also does this but only runs on
  // the pre-enrichment body — we enforce it here for GEO headings)
  if (INTERROGATIVE_START.test(q) && !TERMINAL_PUNCT.test(q)) {
    q = `${q}?`
  }

  return q
}
