import { getLLMAdapter } from '../../article-pipeline/llm/factory'
import { cleanAndParseJSON, cleanTextOutput } from '../../article-pipeline/output-cleaner'

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
  const adapter = getLLMAdapter('anthropic')
  const run = await adapter.call({
    systemPrompt: DEF_SYS,
    userPrompt: DEF_USER.replace(/\{\{content\}\}/g, content.slice(0, 8000)),
    model: 'claude-sonnet-4-5-20250929',
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
