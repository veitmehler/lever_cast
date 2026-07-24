/**
 * Select + inject a client story into an article topic's `realCaseStudies`
 * field, if it doesn't already have one. See
 * .plans/client-story-review-mining.implementation-plan.md Phase 7. Called at
 * the very start of the article pipeline (executor.ts), before step 0 —
 * mirrors how the newsletter override plan's ensureTopicDraft hooks in before
 * ensureTopicResearch.
 */
import { prisma } from '@omniply/shared'
import { logger } from '../../lib/logger'

const ONCE_A_MONTH_MS = 30 * 24 * 60 * 60 * 1000

function scoreOverlap(topicTags: string[], topicText: string): number {
  const haystack = topicText.toLowerCase()
  return topicTags.reduce((score, tag) => (haystack.includes(tag.toLowerCase()) ? score + 1 : score), 0)
}

/**
 * If `topic.realCaseStudies` is empty, pick the best-matching unused-this-month
 * ClientStory for the account and write it in. Never overwrites a user-provided
 * value. No-op if the bank has nothing usable — the article prompts' existing
 * empty-fallback ("write a generalised illustrative example") handles that.
 */
export async function injectClientStory(topicId: string): Promise<void> {
  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    select: { id: true, topic: true, realCaseStudies: true, userId: true },
  })
  if (!topic || topic.realCaseStudies?.trim()) return // user already has one — never overwrite

  const accountId = await prisma.user.findUnique({ where: { id: topic.userId }, select: { accountId: true } })
  if (!accountId?.accountId) return

  const candidates = await prisma.clientStory.findMany({
    where: {
      accountId: accountId.accountId,
      OR: [{ lastUsedAt: null }, { lastUsedAt: { lt: new Date(Date.now() - ONCE_A_MONTH_MS) } }],
    },
    select: { id: true, storyText: true, topicTags: true },
  })
  if (candidates.length === 0) return

  const best = candidates
    .map((c) => ({ ...c, score: scoreOverlap(c.topicTags, topic.topic) }))
    .sort((a, b) => b.score - a.score)[0]

  // A weak/no match is worse than the prompt's own generalized fallback — only inject
  // when at least one tag genuinely overlaps the topic.
  if (best.score === 0) return

  await prisma.$transaction([
    prisma.topic.update({ where: { id: topicId }, data: { realCaseStudies: best.storyText } }),
    prisma.clientStory.update({
      where: { id: best.id },
      data: { lastUsedAt: new Date(), useCount: { increment: 1 } },
    }),
  ])
  logger.info({ topicId, clientStoryId: best.id }, '[client-stories/select] injected client story into topic')
}
