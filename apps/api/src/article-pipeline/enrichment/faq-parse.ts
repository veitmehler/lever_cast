/** Parse Step 6 (research_faqs) output into question strings */
export function parseFaqQuestions(step6Output: string): string[] {
  if (!step6Output?.trim()) return []
  const parts = step6Output.split(/#\s*Question\s*\d+\s*[:：]?\s*/i).slice(1)
  const out: string[] = []
  for (const chunk of parts) {
    const quoted = chunk.match(/"([^"]{3,})"/)?.[1]?.trim()
    if (quoted) {
      out.push(quoted)
      continue
    }
    const line = chunk
      .split(/\n/)
      .map((l) => l.trim())
      .find((l) => l.length > 10 && /[?.؟…]?\s*$/.test(l))
    if (line) out.push(line.replace(/^["'`]+|["'`]+$/g, ''))
  }
  return [...new Set(out.filter(Boolean))]
}

/** Secondary keywords from Step 2 JSON output */
export function parseSecondaryKeywords(step2Output: string): string[] {
  if (!step2Output?.trim()) return []
  try {
    const j = JSON.parse(step2Output) as Record<string, unknown>
    const raw = j.secondary_keywords ?? j['Secondary Keywords']
    if (Array.isArray(raw)) return raw.map((x) => String(x).trim()).filter(s => Boolean(s) && s.toLowerCase() !== 'null')
  } catch {
    /* ignore */
  }
  return []
}

/** Pick secondary keyword most overlapping with heading (word overlap heuristic) */
export function pickKeywordForSection(heading: string, keywords: string[]): string {
  if (keywords.length === 0) return heading
  const hWords = new Set(
    heading
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2),
  )
  let best = keywords[0]
  let bestScore = -1
  for (const kw of keywords) {
    const kWords = kw
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2)
    let score = 0
    for (const w of kWords) {
      if (hWords.has(w)) score += 2
    }
    score += kWords.filter((k) => heading.toLowerCase().includes(k)).length
    if (score > bestScore) {
      bestScore = score
      best = kw
    }
  }
  return best ?? heading
}
