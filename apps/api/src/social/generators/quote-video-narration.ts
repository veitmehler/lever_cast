import { getLLMAdapter } from '../../article-pipeline/llm/factory'
import { cleanAndParseJSON, cleanTextOutput } from '../../article-pipeline/output-cleaner'
import { loadPromptTemplate } from '../../article-pipeline/enrichment/prompt-template'
import { loadSocialBrandTheme } from '../brand-theme'
import { recordLLMUsage } from '../../lib/llm-usage'

const DEF_SYS =
  'You write short spoken narration scripts for social media quote videos. The script must sound natural when read aloud by text-to-speech.'

const DEF_USER = `Write a spoken narration script for a short story quote video based on the section below.

Section content:
{{content}}

Organization: {{organizationName}}

Rules:
- Return ONLY valid JSON: { "narration": "..." }
- 2–4 sentences, conversational, under 400 characters total
- Summarize the theme; do not list quotes verbatim
- No hashtags, emojis, or markdown`

export async function generateQuoteVideoNarration(
  userId: string,
  content: string,
): Promise<string> {
  const brand = await loadSocialBrandTheme(userId)
  const t = await loadPromptTemplate(205)
  const provider = (t?.defaultProvider ?? 'anthropic').toLowerCase()
  const model = t?.defaultModel ?? 'claude-sonnet-4-5-20250929'

  const userPrompt = (t?.userPrompt ?? DEF_USER)
    .replace(/\{\{content\}\}/g, content.slice(0, 6000))
    .replace(/\{\{organizationName\}\}/g, brand.organizationName)

  const adapter = getLLMAdapter(provider)
  const run = await adapter.call({
    systemPrompt: t?.systemPrompt ?? DEF_SYS,
    userPrompt,
    model,
    temperature: 0.5,
    maxTokens: 256,
    jsonMode: true,
  })
  await recordLLMUsage(userId, 'social_narration', run)

  let narration = ''

  try {
    const parsed = cleanAndParseJSON(cleanTextOutput(run.content))
    const data = parsed.data as { narration?: string }
    narration = data.narration?.trim() ?? ''
  } catch {
    // LLM returned plain text instead of JSON — use it directly as narration
    const plain = cleanTextOutput(run.content).trim()
    if (plain.length > 0 && plain.length <= 500) {
      narration = plain
    }
  }

  if (!narration) throw new Error('Empty quote video narration')
  return narration.slice(0, 500)
}
