import { getLLMAdapter } from '../../article-pipeline/llm/factory'
import { cleanTextOutput } from '../../article-pipeline/output-cleaner'
import { loadPromptTemplate } from '../../article-pipeline/enrichment/prompt-template'
import { sendFailureAlert } from '../../lib/alerts'
import { logger } from '../../lib/logger'
import { loadSocialBrandTheme } from '../brand-theme'
import type { AutomationLogContext } from '../automation/log-context'
import type { ArticleContentContext } from '../automation/content'
import { resolveSlotContent } from '../automation/content'
import { buildPlatformCaption, PLATFORM_CHAR_LIMITS } from '../automation/captions'

const PLATFORM_TONE: Record<string, string> = {
  linkedin:  'professional, thought-leadership tone; 1–2 short paragraphs; minimal hashtags',
  twitter:   'punchy, concise, conversational; no title repetition; 0–2 hashtags max',
  threads:   'casual, conversational, slightly playful; short sentences',
  instagram: 'engaging, visual-first caption; line breaks ok; 2–4 relevant hashtags at end',
  facebook:  'friendly, community-oriented; clear hook in first line',
  telegram:  'direct and informative; minimal fluff',
}

const DEF_SYS =
  'You write platform-native social media captions. Match the platform tone and brand voice exactly. Never invent facts not in the source content.'

const DEF_USER = `Write a {{platform}} caption for slot {{slotKey}} ({{postType}}).

Article title: {{title}}
Section text (this slot\'s source):
{{sectionText}}

Platform tone: {{platformTone}}
Character limit: {{charLimit}}

Brand voice:
- Organization: {{organizationName}}
- Business: {{businessDescription}}
- Target audience: {{who}}
- Writing style: {{writingStyle}}

Rules:
- Return ONLY the caption text — no quotes, labels, or JSON
- Stay under {{charLimit}} characters
- Do not use markdown
- Match native {{platform}} posting style
- Apply the brand writing style above; if writing style is empty, default to the platform tone`

export async function generatePlatformCaption(opts: {
  postType: string
  articleCtx: ArticleContentContext
  logCtx: AutomationLogContext
}): Promise<string> {
  const { logCtx, postType, articleCtx } = opts
  const platform  = logCtx.platform ?? 'unknown'
  const slotKey   = logCtx.slotKey ?? 'unknown'
  const charLimit = PLATFORM_CHAR_LIMITS[platform] ?? 2000
  const platformTone = PLATFORM_TONE[platform] ?? 'clear and engaging'

  try {
    const [t, brand] = await Promise.all([
      loadPromptTemplate(203),
      loadSocialBrandTheme(logCtx.userId),
    ])

    const provider = (t?.defaultProvider ?? 'anthropic').toLowerCase()
    const model = t?.defaultModel ?? 'claude-sonnet-4-5-20250929'

    const slotContent = resolveSlotContent(slotKey, articleCtx)
    const sectionText  = slotContent.text.slice(0, 4000)
    const sectionTitle = slotContent.title ?? articleCtx.title

    const userPrompt = (t?.userPrompt ?? DEF_USER)
      .replace(/\{\{platform\}\}/g, platform)
      .replace(/\{\{slotKey\}\}/g, slotKey)
      .replace(/\{\{postType\}\}/g, postType)
      .replace(/\{\{title\}\}/g, articleCtx.title)
      .replace(/\{\{sectionText\}\}/g, sectionText)
      .replace(/\{\{sectionTitle\}\}/g, sectionTitle)
      .replace(/\{\{content\}\}/g, sectionText)
      .replace(/\{\{platformTone\}\}/g, platformTone)
      .replace(/\{\{charLimit\}\}/g, String(charLimit))
      .replace(/\{\{organizationName\}\}/g, brand.organizationName)
      .replace(/\{\{businessDescription\}\}/g, brand.businessDescription || 'Not specified')
      .replace(/\{\{who\}\}/g, brand.who || 'Not specified')
      .replace(/\{\{writingStyle\}\}/g, brand.writingStyle || 'Not specified')
      .replace(/\{\{industry\}\}/g, brand.industry || 'general business')

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
