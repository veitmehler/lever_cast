import { getLLMAdapter } from '../../article-pipeline/llm/factory'
import { cleanAndParseJSON, cleanTextOutput } from '../../article-pipeline/output-cleaner'
import { loadPromptTemplate } from '../../article-pipeline/enrichment/prompt-template'

const DEF_SYS =
  'You extract concise bullet points from article content for a short social media video reel overlay. Each bullet must be ≤ 60 characters.'

const DEF_USER = `Extract 3–5 bullet points from the content below for a video reel text overlay.

Content:
{{content}}

Return ONLY valid JSON: { "bullets": ["...", "..."] }
- 3–5 bullets
- Each ≤ 60 characters
- Declarative, scannable
- No hashtags or emojis`

export async function extractReelBullets(content: string): Promise<string[]> {
  const t = await loadPromptTemplate(204)
  const provider = (t?.defaultProvider ?? 'anthropic').toLowerCase()
  const model = t?.defaultModel ?? 'claude-sonnet-4-5-20250929'

  const userPrompt = (t?.userPrompt ?? DEF_USER).replace(
    /\{\{content\}\}/g,
    content.slice(0, 8000),
  )

  const adapter = getLLMAdapter(provider)
  const run = await adapter.call({
    systemPrompt: t?.systemPrompt ?? DEF_SYS,
    userPrompt,
    model,
    temperature: 0.35,
    maxTokens: 256,
    jsonMode: true,
  })

  const parsed = cleanAndParseJSON(cleanTextOutput(run.content))
  const data = parsed.data as { bullets?: string[] }
  const bullets = (data.bullets ?? []).map((b) => b.trim()).filter(Boolean).slice(0, 5)
  if (bullets.length === 0) throw new Error('Could not extract reel bullets from content')
  return bullets
}
