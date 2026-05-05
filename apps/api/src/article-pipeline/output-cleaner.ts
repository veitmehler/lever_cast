export interface CleanLog {
  fixes: string[]
  originalLength: number
  finalLength: number
}

export interface ParseResult {
  data: unknown
  log: CleanLog
}

/** Strip markdown code fences and surrounding quotes from plain text LLM output. */
export function cleanTextOutput(raw: string): string {
  let text = raw.trim()
  // Remove BOM
  text = text.replace(/^\uFEFF/, '')
  // Strip ``` fences with any optional language tag (e.g. ```mermaid, ```json, etc.)
  text = text.replace(/^```\w*\s*/i, '').replace(/```\s*$/, '').trim()
  // Strip wrapping quotes
  if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
    text = text.slice(1, -1).trim()
  }
  return text
}

/** Parse and clean JSON from raw LLM output. Applies a sequence of fixes in order. */
export function cleanAndParseJSON(rawText: string, withFixes = true): ParseResult {
  const log: CleanLog = { fixes: [], originalLength: rawText.length, finalLength: 0 }

  let text = rawText

  // 1. Strip BOM
  if (text.startsWith('\uFEFF')) {
    text = text.slice(1)
    log.fixes.push('stripped BOM')
  }

  // 2. Direct parse
  const direct = tryParse(text)
  if (direct !== null) {
    log.finalLength = text.length
    return { data: direct, log }
  }

  if (!withFixes) {
    throw new SyntaxError(`JSON parse failed (no fixes): ${text.slice(0, 200)}`)
  }

  // 3. Decode if double-encoded
  if (text.startsWith('"') && text.endsWith('"')) {
    try {
      const decoded = JSON.parse(text) as string
      const inner = tryParse(decoded)
      if (inner !== null) {
        log.fixes.push('decoded double-encoded JSON string')
        log.finalLength = decoded.length
        return { data: inner, log }
      }
    } catch { /* continue */ }
  }

  // 4. Extract first markdown code fence
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenceMatch?.[1]) {
    const inner = tryParse(fenceMatch[1].trim())
    if (inner !== null) {
      log.fixes.push('extracted from code fence')
      log.finalLength = fenceMatch[1].length
      return { data: inner, log }
    }
    text = fenceMatch[1].trim()
  }

  // 5. Strip code fences generally
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/g, '').trim()

  // 6. Unescape common sequences
  const unescaped = text
    .replace(/\\"/g, '"')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
  if (unescaped !== text) {
    const parsed = tryParse(unescaped)
    if (parsed !== null) {
      log.fixes.push('unescaped common sequences')
      log.finalLength = unescaped.length
      return { data: parsed, log }
    }
    text = unescaped
  }

  // 7. Regex-extract first {...} or [...]
  const objMatch = text.match(/(\{[\s\S]*\})/)?.[1]
  const arrMatch = text.match(/(\[[\s\S]*\])/)?.[1]
  const candidate = objMatch || arrMatch
  if (candidate) {
    const parsed = tryParse(candidate)
    if (parsed !== null) {
      log.fixes.push('regex-extracted first object/array')
      log.finalLength = candidate.length
      return { data: parsed, log }
    }
    text = candidate
  }

  // 8. Fix missing opening brace (e.g. raw `"resource_links": [...]`)
  if (!text.trim().startsWith('{') && !text.trim().startsWith('[')) {
    const wrapped = `{${text}}`
    const parsed = tryParse(wrapped)
    if (parsed !== null) {
      log.fixes.push('wrapped in braces')
      log.finalLength = wrapped.length
      return { data: parsed, log }
    }
  }

  // 9. Strip trailing commas before } or ]
  const noTrailing = text.replace(/,(\s*[}\]])/g, '$1')
  if (noTrailing !== text) {
    const parsed = tryParse(noTrailing)
    if (parsed !== null) {
      log.fixes.push('removed trailing commas')
      log.finalLength = noTrailing.length
      return { data: parsed, log }
    }
    text = noTrailing
  }

  log.finalLength = text.length
  throw new SyntaxError(`JSON parse failed after all fixes: ${text.slice(0, 200)}`)
}

function tryParse(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}
