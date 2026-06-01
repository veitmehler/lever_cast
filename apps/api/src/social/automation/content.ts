import type { SitePage } from '@prisma/client'
import { extractH2Sections, stripTags } from '../../article-pipeline/enrichment/html-parser'

export interface ArticleContentContext {
  title: string
  introText: string
  keyTakeawaysText: string
  h2Title: string
  h2SectionText: string
}

function extractIntro(bodyHtml: string, excerpt?: string | null): string {
  if (excerpt?.trim()) return excerpt.trim()
  const match = bodyHtml.match(/<p[^>]*>([\s\S]*?)<\/p>/i)
  if (match) return stripTags(match[1]).slice(0, 800)
  return stripTags(bodyHtml).slice(0, 800)
}

export function buildArticleContentContext(sitePage: SitePage): ArticleContentContext {
  const bodyHtml = sitePage.bodyHtml ?? ''
  const sections = extractH2Sections(bodyHtml)
  const first = sections[0]

  return {
    title: sitePage.title,
    introText: extractIntro(bodyHtml, sitePage.excerpt),
    keyTakeawaysText: sitePage.keyTakeawaysHtml
      ? stripTags(sitePage.keyTakeawaysHtml).slice(0, 2000)
      : extractIntro(bodyHtml, sitePage.excerpt),
    h2Title: first?.heading ?? sitePage.title,
    h2SectionText: first ? stripTags(first.sectionHtml).slice(0, 3000) : stripTags(bodyHtml).slice(0, 3000),
  }
}

export interface SlotContent {
  text: string
  title?: string
  quoteText?: string
}

/** Map each slot to the article section used for generation. */
export function resolveSlotContent(slotKey: string, ctx: ArticleContentContext): SlotContent {
  switch (slotKey) {
    case 'F1':
    case 'S1':
      return { text: ctx.introText, quoteText: ctx.introText.slice(0, 280) }
    case 'F2':
    case 'S3':
      return { text: ctx.keyTakeawaysText || ctx.introText }
    case 'F3':
    case 'S5':
      return { text: ctx.keyTakeawaysText || ctx.h2SectionText }
    case 'F4':
    case 'F6':
      return { text: ctx.h2SectionText, title: ctx.h2Title }
    case 'F5':
      return { text: ctx.h2SectionText, quoteText: ctx.h2Title }
    case 'S2':
      return { text: ctx.keyTakeawaysText || ctx.introText }
    case 'S4':
      return { text: ctx.h2SectionText, title: ctx.h2Title }
    case 'S6':
      return { text: ctx.h2SectionText, title: ctx.h2Title }
    default:
      return { text: ctx.introText }
  }
}
