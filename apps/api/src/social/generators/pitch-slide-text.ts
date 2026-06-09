import { getLLMAdapter } from '../../article-pipeline/llm/factory'
import { cleanTextOutput } from '../../article-pipeline/output-cleaner'
import { loadPromptTemplate } from '../../article-pipeline/enrichment/prompt-template'

const DEF_SYS = `You write ultra-short slide copy for social media story posts.
Your job: given an article topic and a brief content summary, write 2–4 short sentences that tease what the post contains and invite the viewer to tap through to read the full carousel.

RULES:
1. 2–4 short sentences total. Keep the whole pitch under ~180 characters.
2. Use normal sentence punctuation (periods, commas). No hashtags, no emojis.
3. Never start with "Did you know" or generic filler.
4. Tone: direct, confident, punchy — matching the brand voice.
5. Output ONLY the pitch text. No quotes, no labels, no markdown.`

const DEF_USER = `Write a 2–4 sentence story pitch slide for this post.

Topic: {{topic}}

Content summary:
{{content}}

Return ONLY the pitch text.`

export async function generatePitchSlideText(opts: {
  topic: string
  content: string
}): Promise<string> {
  const t = await loadPromptTemplate(208)
  const provider = (t?.defaultProvider ?? 'anthropic').toLowerCase()
  const model = t?.defaultModel ?? 'claude-sonnet-4-5-20250929'

  const userPrompt = (t?.userPrompt ?? DEF_USER)
    .replace(/\{\{topic\}\}/g, opts.topic.slice(0, 300))
    .replace(/\{\{content\}\}/g, opts.content.replace(/<[^>]+>/g, ' ').slice(0, 1200))

  const adapter = getLLMAdapter(provider)
  const run = await adapter.call({
    systemPrompt: t?.systemPrompt ?? DEF_SYS,
    userPrompt,
    model,
    temperature: 0.7,
    maxTokens: 200,
  })

  return cleanTextOutput(run.content).trim()
}
