import type { Newsletter } from '@prisma/client'
import type { SlotContent } from './content'
import type { PostSource } from './weekly-matrix'

/**
 * Newsletter content source for social posts (weekly cadence, newsletter days).
 * Pulls from the Newsletter's authored JSON — no new content generation. Mirrors
 * ArticleContentContext / resolveSlotContent for the article side.
 */
export interface NewsletterContentContext {
  /** Edition topic titles — used for the "overview" reel bullets. */
  overviewTopics: string[]
  /** Tips of the Day — used for the quote post. */
  tips: string[]
  /** The edition's feature article — used for the image carousel. */
  feature: { title: string; body: string }
}

function asObj(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}
function str(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

export function buildNewsletterContentContext(nl: Newsletter): NewsletterContentContext {
  const feature = asObj(nl.featureArticle)
  const secondary = asObj(nl.secondaryArticle)
  const quickHits = asObj(nl.quickHits)
  const teasers = Array.isArray(nl.teasers) ? (nl.teasers as unknown[]) : []

  const overviewTopics: string[] = []
  if (feature && str(feature.title)) overviewTopics.push(str(feature.title))
  if (secondary && str(secondary.title)) overviewTopics.push(str(secondary.title))
  for (const t of teasers) {
    const o = asObj(t)
    if (o && str(o.title)) overviewTopics.push(str(o.title))
  }

  const tips: string[] = []
  if (quickHits && Array.isArray(quickHits.tips)) {
    for (const tip of quickHits.tips as unknown[]) {
      if (typeof tip === 'string' && tip.trim()) tips.push(tip.trim())
    }
  }

  const featureTitle =
    str(feature?.title) || nl.subjectLine || nl.summaryTitle || 'This edition'
  const featureBody = feature
    ? [str(feature.tldr), str(feature.body), str(feature.teaser)].filter(Boolean).join('\n\n')
    : ''

  return { overviewTopics, tips, feature: { title: featureTitle, body: featureBody } }
}

/** Resolve the content payload for a newsletter-sourced slot. */
export function resolveNewsletterSlotContent(
  source: PostSource,
  ctx: NewsletterContentContext,
): SlotContent {
  switch (source) {
    case 'nl_overview':
      // The reel generator extracts bullets from this text; feed it the topic list.
      return {
        text: ctx.overviewTopics.map((t) => `- ${t}`).join('\n'),
        title: 'In this edition',
      }
    case 'nl_tips': {
      const tip = ctx.tips.length ? ctx.tips[Math.floor(Math.random() * ctx.tips.length)] : ''
      return { text: ctx.tips.join('\n'), quoteText: tip }
    }
    case 'nl_feature':
    default:
      return { text: ctx.feature.body, title: ctx.feature.title }
  }
}
