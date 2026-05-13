import { getLLMAdapter } from '../llm/factory'
import { cleanTextOutput } from '../output-cleaner'
import { loadPromptTemplate } from './prompt-template'
import { withGeoRetry } from './geo-retry'
import { logger } from '../../lib/logger'

const DEF_SYS =
  'You are a content tagging expert. Given an article topic and a list of WordPress tags, select the most applicable tags.'
const DEF_USER = `Select the most applicable WordPress tags for this article.

Article topic: {{topic}}
Article title: {{title}}

Available tags (JSON):
{{tags}}

Rules:
- Select UP TO 4 tags from the list.
- Respond with ONLY a JSON array of tag IDs, e.g. [12, 47, 83].
- If fewer than 4 tags are relevant, return only the relevant ones.
- If no tags apply, return an empty array: []`

export async function fetchWpTags(
  siteUrl: string,
  authHeader: string,
): Promise<Array<{ id: number; name: string; slug: string }>> {
  const base = siteUrl.replace(/\/$/, '')
  const res = await fetch(`${base}/wp-json/wp/v2/tags?per_page=100`, {
    headers: { Authorization: authHeader },
  })
  if (!res.ok) {
    logger.warn({ status: res.status }, '[wp-tags] tags fetch failed')
    return []
  }
  const rows = (await res.json()) as Array<{ id: number; name: string; slug: string }>
  return rows.map((t) => ({ id: t.id, name: t.name, slug: t.slug }))
}

function parseTagIds(raw: string): number[] | null {
  const trimmed = cleanTextOutput(raw).trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const jsonStr = fenced ? fenced[1].trim() : trimmed
  try {
    const parsed = JSON.parse(jsonStr) as unknown
    if (!Array.isArray(parsed)) return null
    const nums: number[] = []
    for (const item of parsed) {
      const n = typeof item === 'number' ? item : parseInt(String(item), 10)
      if (Number.isFinite(n)) nums.push(n)
    }
    return nums
  } catch {
    const bracket = trimmed.match(/\[[\s\d,]*\]/)
    if (!bracket) return null
    try {
      const parsed = JSON.parse(bracket[0]) as unknown
      if (!Array.isArray(parsed)) return null
      return parsed
        .map((x) => (typeof x === 'number' ? x : parseInt(String(x), 10)))
        .filter((x) => Number.isFinite(x))
    } catch {
      return null
    }
  }
}

function validateAndCapTagIds(
  candidates: number[],
  validIds: Set<number>,
  max: number,
): number[] {
  const out: number[] = []
  const seen = new Set<number>()
  for (const id of candidates) {
    if (!validIds.has(id) || seen.has(id)) continue
    seen.add(id)
    out.push(id)
    if (out.length >= max) break
  }
  return out
}

/** When the model output is unusable, use the first few tag IDs from WP (same tolerance as category fallback). */
function fallbackTagIds(tags: Array<{ id: number }>): number[] {
  return tags.slice(0, 4).map((t) => t.id)
}

export async function selectWordPressTags(opts: {
  topic: string
  title: string
  siteUrl: string
  authHeader: string
  jobId: string
}): Promise<{
  tagIds: number[]
  inputTokens: number
  outputTokens: number
  cost: number
}> {
  const tags = await fetchWpTags(opts.siteUrl, opts.authHeader)
  if (tags.length === 0) {
    return { tagIds: [], inputTokens: 0, outputTokens: 0, cost: 0 }
  }

  const validIds = new Set(tags.map((t) => t.id))
  const t = await loadPromptTemplate(109)
  const provider = (t?.defaultProvider ?? 'openai').toLowerCase()
  const model = t?.defaultModel ?? 'gpt-4o-mini'
  const tagsJson = JSON.stringify(tags)
  const userPrompt = (t?.userPrompt ?? DEF_USER)
    .replace(/\{\{topic\}\}/g, opts.topic)
    .replace(/\{\{title\}\}/g, opts.title)
    .replace(/\{\{tags\}\}/g, tagsJson)

  const adapter = getLLMAdapter(provider)
  const run = await withGeoRetry(`wp_tags_${opts.jobId}`, () =>
    adapter.call({
      systemPrompt: t?.systemPrompt ?? DEF_SYS,
      userPrompt,
      model,
      temperature: 0.1,
      maxTokens: 128,
    }),
  )

  const raw = cleanTextOutput(run.content)
  const parsed = parseTagIds(raw)
  let tagIds: number[]
  if (parsed === null) {
    tagIds = fallbackTagIds(tags)
  } else {
    tagIds = validateAndCapTagIds(parsed, validIds, 4)
    if (tagIds.length === 0 && parsed.length > 0) tagIds = fallbackTagIds(tags)
  }

  return {
    tagIds,
    inputTokens: run.tokens.input,
    outputTokens: run.tokens.output,
    cost: run.cost,
  }
}
