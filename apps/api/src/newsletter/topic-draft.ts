/**
 * Auto-draft an account-scoped NewsletterTopic override's structured fields
 * (bullets, secondary topic, recipe hints) from just its bare `topic` string,
 * immediately before generation. See
 * .plans/newsletter-topic-override.implementation-plan.md Phase 4.
 *
 * Runs ONCE per override topic (gated by draftedAt) — the result is exactly the
 * same shape an admin's CSV row would supply, so ensureTopicResearch() and the
 * rest of the pipeline run completely unchanged afterward. No review step: the
 * user only ever sees the final generated newsletter.
 */
import { prisma, brandSettingsForUser } from '@omniply/shared'
import { logger } from '../lib/logger'
import { runNewsletterJsonPrompt } from './llm'
import { specializationLabel } from './calendar-routing'

interface TopicExpandJson {
  topic?: string
  bullet1?: string
  bullet2?: string
  bullet3?: string
  secondaryTopic?: string
  recipe?: string
  recipe2?: string
}

/**
 * Recent secondary topics from an account's routed calendar, as drafting
 * exemplars — so a custom edition's secondary article fits the same content
 * schedule as the specialization's admin-curated calendar, not an isolated
 * guess. Mirrors research.ts's priorRecipeTitles().
 */
async function priorSecondaryTopics(calendarId: string | null, limit = 20): Promise<string[]> {
  if (!calendarId) return []
  const rows = await prisma.newsletterTopic.findMany({
    where: { calendarId, secondaryTopic: { not: null } },
    select: { secondaryTopic: true },
    orderBy: { date: 'desc' },
    take: limit,
  })
  return rows.map((r) => r.secondaryTopic).filter((s): s is string => !!s)
}

/**
 * Fill bullet1-3/secondaryTopic/recipe hints for an account-scoped override
 * topic that hasn't been drafted yet. No-op for calendar-routed topics or
 * already-drafted ones.
 */
export async function ensureTopicDraft(topicId: string): Promise<void> {
  const topic = await prisma.newsletterTopic.findUnique({ where: { id: topicId } })
  if (!topic) throw new Error(`NewsletterTopic ${topicId} not found`)
  if (!topic.accountId || topic.draftedAt) return

  const account = await prisma.account.findUnique({
    where: { id: topic.accountId },
    select: { ownerUserId: true },
  })
  const ownerUserId = account?.ownerUserId
  const [brand, owner] = await Promise.all([
    ownerUserId ? brandSettingsForUser(ownerUserId) : Promise.resolve(null),
    ownerUserId
      ? prisma.user.findUnique({ where: { id: ownerUserId }, select: { newsletterCalendarId: true } })
      : Promise.resolve(null),
  ])

  const industry = brand?.industry ?? ''
  const specialization = await specializationLabel(brand?.primarySpecialization ?? null)
  const exemplars = await priorSecondaryTopics(owner?.newsletterCalendarId ?? null)

  const { data } = await runNewsletterJsonPrompt<TopicExpandJson>('nl_topic_expand', {
    topic: topic.topic,
    industry,
    specialization,
    who: brand?.who ?? specialization,
    recentSecondaryTopics: exemplars.join('\n'),
  })

  await prisma.newsletterTopic.update({
    where: { id: topicId },
    data: {
      topic: (data.topic ?? topic.topic).trim() || topic.topic,
      bullet1: (data.bullet1 ?? '').trim(),
      bullet2: (data.bullet2 ?? '').trim(),
      bullet3: (data.bullet3 ?? '').trim(),
      secondaryTopic: (data.secondaryTopic ?? '').trim() || null,
      recipe: (data.recipe ?? '').trim() || null,
      recipe2: (data.recipe2 ?? '').trim() || null,
      draftedAt: new Date(),
    },
  })
  logger.info({ topicId }, '[newsletter/topic-draft] auto-drafted account-override topic')
}
