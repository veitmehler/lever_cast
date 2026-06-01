import { getLLMAdapter } from '../../article-pipeline/llm/factory'
import { cleanTextOutput } from '../../article-pipeline/output-cleaner'
import { loadPromptTemplate } from '../../article-pipeline/enrichment/prompt-template'
import { sendFailureAlert } from '../../lib/alerts'
import { logger } from '../../lib/logger'
import type { AutomationLogContext } from '../automation/log-context'
import type { ArticleContentContext } from '../automation/content'
import { buildPlatformCaption, PLATFORM_CHAR_LIMITS } from '../automation/captions'

const PLATFORM_TONE: Record<string, string> = {
  linkedin: 'professional, thought-leadership tone; 1–2 short paragraphs; minimal hashtags',
  twitter: 'punchy, concise, conversational; no title repetition; 0–2 hashtags max',
  threads: 'casual, conversational, slightly playful; short sentences',
  instagram: 'engaging, visual-first caption; line breaks ok; 2–4 relevant hashtags at end',
  facebook: 'friendly, community-oriented; clear hook in first line',
  telegram: 'direct and informative; minimal fluff',
}

const DEF_SYS =
  'You write platform-native social media captions. Match the platform tone exactly. Never invent facts not in the source content.'

const DEF_USER = `Write a {{platform}} caption for slot {{slotKey}} ({{postType}}).

Article title: {{title}}
Source excerpt:
{{content}}

Platform tone: {{platformTone}}
Character limit: {{charLimit}}

Rules:
- Return ONLY the caption text — no quotes, labels, or JSON
- Stay under {{charLimit}} characters
- Do not use markdown
- Match native {{platform}} posting style`

export async function generatePlatformCaption(opts: {
  postType: string
  articleCtx: ArticleContentContext
  logCtx: AutomationLogContext
}): Promise<string> {
  const { logCtx, postType, articleCtx } = opts
  const platform = logCtx.platform ?? 'unknown'
  const slotKey = logCtx.slotKey ?? 'unknown'
  const charLimit = PLATFORM_CHAR_LIMITS[platform] ?? 2000
  const platformTone = PLATFORM_TONE[platform] ?? 'clear and engaging'

  try {
    const t = await loadPromptTemplate(203)
    const provider = (t?.defaultProvider ?? 'anthropic').toLowerCase()
    const model = t?.defaultModel ?? 'claude-sonnet-4-5-20250929'

    const sourceText = [
      articleCtx.introText,
      articleCtx.keyTakeawaysText,
      articleCtx.h2SectionText,
    ]
      .filter(Boolean)
      .join('\n\n')
      .slice(0, 4000)

    const userPrompt = (t?.userPrompt ?? DEF_USER)
      .replace(/\{\{platform\}\}/g, platform)
      .replace(/\{\{slotKey\}\}/g, slotKey)
      .replace(/\{\{postType\}\}/g, postType)
      .replace(/\{\{title\}\}/g, articleCtx.title)
      .replace(/\{\{content\}\}/g, sourceText)
      .replace(/\{\{platformTone\}\}/g, platformTone)
      .replace(/\{\{charLimit\}\}/g, String(charLimit))

    const adapter = getLLMAdapter(provider)
    const run = await adapter.call({
      systemPrompt: t?.systemPrompt ?? DEF_SYS,
      userPrompt,
      model,
      temperature: 0.6,
      maxTokens: 512,
    })

    const caption = cleanTextOutput(run.content).trim()
    if (!caption) throw new Error('Empty caption')

    return caption.length <= charLimit ? caption : caption.slice(0, charLimit - 1).trim() + '…'
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    logger.warn(
      { ...logCtx, err },
      '[platform-caption] LLM generation failed — falling back to template',
    )
    void sendFailureAlert({
      userId: logCtx.userId,
      jobId: logCtx.jobId,
      errorType: 'social_caption_fallback',
      message: `LLM caption failed for ${platform}/${slotKey}: ${message}`,
      context: { ...logCtx },
    }).catch(() => {})
    return buildPlatformCaption(platform, articleCtx, slotKey)
  }
}
