/**
 * Per-customer voiced newsletter generation (Phase 1c).
 *
 * For an assigned customer × topic, fills the Newsletter row section-by-section in
 * the customer's voice, reading the SHARED research (video/recipe/teaser sources)
 * produced by ensureTopicResearch. Each section is fault-tolerant: a failure
 * leaves its column null and review surfaces the gap. Only a thrown FEATURE
 * article aborts the edition (per the plan).
 *
 * Rendering (renderedHtml) lands in Phase 1d; here we set status=ready_for_review
 * with the content populated.
 */
import { Prisma } from '@prisma/client'
import { prisma } from '@socioply/shared'
import {
  generateWithFalAI,
  uploadBufferWithKey,
} from '@socioply/shared'
import type { LLMResponse } from '../article-pipeline/llm/adapter'
import { getSystemApiKey } from '../lib/system-keys'
import { cleanTextOutput } from '../article-pipeline/output-cleaner'
import { logger } from '../lib/logger'
import { runNewsletterPrompt, runNewsletterWriterJson } from './llm'
import { generateArticle, type VoiceVars, type UsageRecorder } from './article'
import type { TopicResearch, TeaserSource } from './research'

const NL_IMAGE_MODEL = 'fal-ai/flux-pro'

const J = (v: unknown): Prisma.InputJsonValue => v as unknown as Prisma.InputJsonValue

/** Records LLMUsage per call and accumulates totals for the Newsletter row. */
class Usage implements UsageRecorder {
  cost = 0
  input = 0
  output = 0
  constructor(private userId: string) {}
  async record(r: LLMResponse): Promise<void> {
    this.cost += r.cost
    this.input += r.tokens.input
    this.output += r.tokens.output
    try {
      await prisma.lLMUsage.create({
        data: {
          userId: this.userId,
          source: 'newsletter',
          provider: r.provider,
          model: r.model,
          inputTokens: r.tokens.input,
          outputTokens: r.tokens.output,
          cost: r.cost,
        },
      })
    } catch (err) {
      logger.warn({ err }, '[newsletter/generate] LLMUsage write failed (non-fatal)')
    }
  }
}

interface Teaser {
  title: string
  body: string
  cta: string
  link: string
}

async function voiceTeasers(
  sources: TeaserSource[],
  voice: VoiceVars,
  usage: Usage,
): Promise<Teaser[]> {
  const out: Teaser[] = []
  for (const s of sources) {
    try {
      const { data, response } = await runNewsletterWriterJson<{
        title?: string
        body?: string
        cta?: string
      }>('nl_teaser_summarizer_system', 'nl_teaser_summarizer_user', {
        bulletPoint: s.bullet,
        articleContent: s.extract,
        writingStyle: voice.writingStyle,
        targetAudience: voice.targetAudience,
        industry: voice.industry,
      })
      await usage.record(response)
      out.push({
        title: (data.title ?? s.bullet).trim(),
        body: data.body ?? '',
        cta: data.cta ?? '',
        link: s.url,
      })
    } catch (err) {
      logger.warn({ bullet: s.bullet, err }, '[newsletter/generate] teaser voicing failed')
    }
  }
  return out
}

interface QuickHits {
  tips: string[]
  facts: string[]
}

async function generateQuickHits(
  topicVars: Record<string, string>,
  voice: VoiceVars,
  usage: Usage,
): Promise<QuickHits> {
  const vars = { ...topicVars, ...voiceToVars(voice) }
  const result: QuickHits = { tips: [], facts: [] }

  try {
    const { data, response } = await runNewsletterWriterJson<Record<string, string>>(
      'nl_tips_system',
      'nl_tips_user',
      vars,
    )
    await usage.record(response)
    result.tips = [data.tip_1, data.tip_2, data.tip_3, data.tip_4].filter(Boolean) as string[]
  } catch (err) {
    logger.warn({ err }, '[newsletter/generate] tips failed')
  }

  try {
    const { data, response } = await runNewsletterWriterJson<Record<string, string>>(
      'nl_facts_system',
      'nl_facts_user',
      vars,
    )
    await usage.record(response)
    result.facts = [data.fact_1, data.fact_2, data.fact_3, data.fact_4].filter(Boolean) as string[]
  } catch (err) {
    logger.warn({ err }, '[newsletter/generate] facts failed')
  }

  return result
}

interface Fun {
  triviaQuestion: string | null
  triviaAnswer: string | null
  joke: string | null
}

async function generateFun(
  topicVars: Record<string, string>,
  voice: VoiceVars,
  usage: Usage,
): Promise<Fun> {
  const vars = { ...topicVars, ...voiceToVars(voice) }
  const fun: Fun = { triviaQuestion: null, triviaAnswer: null, joke: null }

  try {
    const { data, response } = await runNewsletterWriterJson<{
      trivia_question?: string
      trivia_answer?: string
    }>('nl_trivia_system', 'nl_trivia_user', vars)
    await usage.record(response)
    fun.triviaQuestion = data.trivia_question ?? null
    fun.triviaAnswer = data.trivia_answer ?? null
  } catch (err) {
    logger.warn({ err }, '[newsletter/generate] trivia failed')
  }

  try {
    const { data, response } = await runNewsletterWriterJson<{ joke?: string }>(
      'nl_joke_system',
      'nl_joke_user',
      vars,
    )
    await usage.record(response)
    fun.joke = data.joke ?? null
  } catch (err) {
    logger.warn({ err }, '[newsletter/generate] joke failed')
  }

  return fun
}

interface Modules {
  recipe?: { intro: string; ingredients: string; instructions: string; imageUrl: string | null }
  kidsSnack?: { intro: string; ingredients: string; instructions: string; imageUrl: string | null }
  techFreeActivity?: { intro: string; materials: string; instructions: string }
}

async function falImage(prompt: string, key: string): Promise<string | null> {
  try {
    const falKey = await getSystemApiKey('fal-ai')
    const clean = cleanTextOutput(prompt)
    if (!falKey || !clean) return null
    const buf = await generateWithFalAI(falKey, clean, NL_IMAGE_MODEL)
    const { url } = await uploadBufferWithKey(`newsletter/${key}.jpg`, buf, 'image/jpeg')
    return url
  } catch (err) {
    logger.warn({ key, err }, '[newsletter/generate] module image failed (non-fatal)')
    return null
  }
}

async function generateModules(
  topic: { id: string; recipe: string | null; kidsSnack: string | null; techFreeActivity: string | null },
  research: TopicResearch,
  voice: VoiceVars,
  usage: Usage,
): Promise<Modules> {
  const modules: Modules = {}

  // Recipe: reuse the shared (neutral-voice) research as-is — it was written once
  // per topic and is the same for every customer.
  if (research.recipe) {
    modules.recipe = {
      intro: research.recipe.intro,
      ingredients: research.recipe.ingredients,
      instructions: research.recipe.instructions,
      imageUrl: research.recipe.imageUrl,
    }
  }

  // Kids snack: generated per customer (not part of shared research).
  if (topic.kidsSnack) {
    try {
      const r = await runNewsletterPrompt('nl_kids_snack_researcher', { snackHint: topic.kidsSnack }, { useSearch: true })
      await usage.record(r.response)
      const { data, response } = await runNewsletterWriterJson<{
        kids_snack_intro?: string
        kids_snack_ingredients?: string
        kids_snack_instructions?: string
      }>('nl_kids_snack_writer_system', 'nl_kids_snack_writer_user', {
        snackHint: topic.kidsSnack,
        snackResearch: r.content,
        previousSnackTitles: '',
        ...voiceToVars(voice),
      })
      await usage.record(response)
      const intro = data.kids_snack_intro ?? ''
      let imageUrl: string | null = null
      try {
        const img = await runNewsletterPrompt('nl_kids_snack_image_prompt', {
          snackContent: `${intro}\n${data.kids_snack_ingredients ?? ''}`,
        })
        await usage.record(img.response)
        imageUrl = await falImage(img.content, `${topic.id}/kids-snack`)
      } catch (err) {
        logger.warn({ topicId: topic.id, err }, '[newsletter/generate] kids snack image prompt failed')
      }
      modules.kidsSnack = {
        intro,
        ingredients: data.kids_snack_ingredients ?? '',
        instructions: data.kids_snack_instructions ?? '',
        imageUrl,
      }
    } catch (err) {
      logger.warn({ topicId: topic.id, err }, '[newsletter/generate] kids snack failed')
    }
  }

  // Tech-free activity: per customer, no image.
  if (topic.techFreeActivity) {
    try {
      const r = await runNewsletterPrompt('nl_tech_free_researcher', { activityHint: topic.techFreeActivity }, { useSearch: true })
      await usage.record(r.response)
      const { data, response } = await runNewsletterWriterJson<{
        tech_free_activity_intro?: string
        tech_free_activity_materials?: string
        tech_free_activity_instructions?: string
      }>('nl_tech_free_writer_system', 'nl_tech_free_writer_user', {
        activityHint: topic.techFreeActivity,
        research: r.content,
        previousActivityTitles: '',
        ...voiceToVars(voice),
      })
      await usage.record(response)
      modules.techFreeActivity = {
        intro: data.tech_free_activity_intro ?? '',
        materials: data.tech_free_activity_materials ?? '',
        instructions: data.tech_free_activity_instructions ?? '',
      }
    } catch (err) {
      logger.warn({ topicId: topic.id, err }, '[newsletter/generate] tech-free activity failed')
    }
  }

  return modules
}

function voiceToVars(v: VoiceVars): Record<string, string> {
  return {
    writingStyle: v.writingStyle,
    targetAudience: v.targetAudience,
    industry: v.industry,
    specialization: v.specialization,
  }
}

// ── Validation (ported, lightweight — logged, non-blocking) ────────────────────

interface ValidationResult {
  completionPercentage: number
  missing: string[]
}

function validateNewsletter(parts: {
  featureArticle: { body: string; title: string } | null
  teasers: Teaser[] | null
  quickHits: QuickHits | null
  fun: Fun | null
  subjectLine: string | null
  previewText: string | null
  research: TopicResearch
  needsRecipe: boolean
}): ValidationResult {
  const checks: Array<[string, boolean]> = [
    ['featureArticle', !!parts.featureArticle && parts.featureArticle.body.length >= 200],
    ['teasers', (parts.teasers?.length ?? 0) >= 3],
    ['tips', (parts.quickHits?.tips.length ?? 0) >= 4],
    ['facts', (parts.quickHits?.facts.length ?? 0) >= 4],
    ['trivia', !!parts.fun?.triviaQuestion && !!parts.fun?.triviaAnswer],
    ['joke', !!parts.fun?.joke],
    ['subjectLine', !!parts.subjectLine],
    ['previewText', !!parts.previewText],
    ['video', !!parts.research.video && (!!parts.research.video.url || parts.research.video.manual)],
  ]
  if (parts.needsRecipe) checks.push(['recipe', !!parts.research.recipe])

  const passed = checks.filter(([, ok]) => ok).length
  const missing = checks.filter(([, ok]) => !ok).map(([name]) => name)
  return {
    completionPercentage: Math.round((passed / checks.length) * 100),
    missing,
  }
}

// ── Entry point ─────────────────────────────────────────────────────────────

/**
 * Generate (or re-generate) the voiced content for one (userId, topicId) and set
 * status=ready_for_review. The Newsletter row must already exist (enqueue creates
 * it). Assumes ensureTopicResearch has run (the handler calls it first).
 */
export async function generateNewsletterForCustomer(userId: string, topicId: string): Promise<void> {
  const newsletter = await prisma.newsletter.findUnique({
    where: { userId_topicId: { userId, topicId } },
    include: { topic: { include: { calendar: true } } },
  })
  if (!newsletter) throw new Error(`Newsletter (${userId}, ${topicId}) not found`)

  const topic = newsletter.topic
  const calendar = topic.calendar
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { brandSettings: true, settings: true },
  })

  const voice: VoiceVars = {
    writingStyle: user?.settings?.writingStyle ?? '',
    targetAudience: user?.brandSettings?.who ?? '',
    industry: user?.brandSettings?.industry ?? calendar.industry,
    specialization: user?.brandSettings?.specialization ?? calendar.specialization ?? '',
  }
  const research = (topic.research as TopicResearch | null) ?? {}
  const usage = new Usage(userId)
  const bullets = [topic.bullet1, topic.bullet2, topic.bullet3]
  const topicVars = {
    topic: topic.topic,
    bullet1: topic.bullet1,
    bullet2: topic.bullet2,
    bullet3: topic.bullet3,
  }

  // Feature article — required (throw aborts the edition).
  const featureArticle = await generateArticle(topic.topic, bullets, voice, `${topic.id}/${userId}-feature`, usage)

  // Secondary article — optional.
  let secondaryArticle = null
  if (topic.secondaryTopic) {
    try {
      secondaryArticle = await generateArticle(
        topic.secondaryTopic,
        bullets,
        voice,
        `${topic.id}/${userId}-secondary`,
        usage,
      )
    } catch (err) {
      logger.warn({ topicId, err }, '[newsletter/generate] secondary article failed')
    }
  }

  // Teasers, quick-hits, fun, modules (all fault-tolerant).
  let teasers: Teaser[] | null = null
  try {
    teasers = await voiceTeasers(research.teaserSources ?? [], voice, usage)
  } catch (err) {
    logger.warn({ topicId, err }, '[newsletter/generate] teasers failed')
  }

  const quickHits = await generateQuickHits(topicVars, voice, usage)
  const fun = await generateFun(topicVars, voice, usage)
  const modules = await generateModules(topic, research, voice, usage)

  // Email metadata.
  let subjectLine: string | null = null
  let previewText: string | null = null
  try {
    const s = await runNewsletterPrompt('nl_subject_line', {
      topic: topic.topic,
      targetAudience: voice.targetAudience,
    })
    await usage.record(s.response)
    subjectLine = cleanTextOutput(s.content) || null
  } catch (err) {
    logger.warn({ topicId, err }, '[newsletter/generate] subject line failed')
  }
  try {
    const p = await runNewsletterPrompt('nl_preview_text', {
      topic: topic.topic,
      subjectLine: subjectLine ?? '',
      targetAudience: voice.targetAudience,
    })
    await usage.record(p.response)
    previewText = cleanTextOutput(p.content) || null
  } catch (err) {
    logger.warn({ topicId, err }, '[newsletter/generate] preview text failed')
  }

  const validation = validateNewsletter({
    featureArticle,
    teasers,
    quickHits,
    fun,
    subjectLine,
    previewText,
    research,
    needsRecipe: !!topic.recipe,
  })

  // Build update with only the sections that produced content (JSON columns can't
  // be set to plain null via Prisma; leaving them out keeps the default null).
  const data: Prisma.NewsletterUpdateInput = {
    status: 'ready_for_review',
    cost: usage.cost,
    inputTokens: usage.input,
    outputTokens: usage.output,
    featureArticle: J(featureArticle),
    quickHits: J(quickHits),
    fun: J(fun),
    validation: J(validation),
  }
  if (secondaryArticle) data.secondaryArticle = J(secondaryArticle)
  if (teasers && teasers.length > 0) data.teasers = J(teasers)
  if (Object.keys(modules).length > 0) data.modules = J(modules)
  if (subjectLine) data.subjectLine = subjectLine
  if (previewText) data.previewText = previewText

  await prisma.newsletter.update({ where: { id: newsletter.id }, data })
  logger.info(
    { topicId, userId, completion: validation.completionPercentage, cost: usage.cost },
    '[newsletter/generate] ready_for_review',
  )
}
