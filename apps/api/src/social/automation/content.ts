import type { SitePage } from '@prisma/client'
import { extractH2Sections, stripTags } from '../../article-pipeline/enrichment/html-parser'

export interface H2Section {
  heading: string
  text: string
}

export interface ArticleContentContext {
  title: string
  introText: string
  keyTakeawaysText: string
  h2Sections: H2Section[]
  /** First H2 section (legacy helpers). */
  h2Title: string
  h2SectionText: string
}

/** Round-robin section index per H2-based slot (plan §4). */
const H2_SLOT_SECTION_INDEX: Record<string, number> = {
  F4: 0,
  F5: 1,
  F6: 2,
  S4: 3,
  S6: 4,
}

function extractIntro(bodyHtml: string, excerpt?: string | null): string {
  if (excerpt?.trim()) return excerpt.trim()
  const match = bodyHtml.match(/<p[^>]*>([\s\S]*?)<\/p>/i)
  if (match) return stripTags(match[1]).slice(0, 800)
  return stripTags(bodyHtml).slice(0, 800)
}

function sectionAt(sections: H2Section[], index: number): H2Section | undefined {
  if (sections.length === 0) return undefined
  return sections[index % sections.length]
}

export function buildArticleContentContext(sitePage: SitePage): ArticleContentContext {
  const bodyHtml = sitePage.bodyHtml ?? ''
  const rawSections = extractH2Sections(bodyHtml)
  const h2Sections: H2Section[] = rawSections.map((s) => ({
    heading: s.heading,
    text: stripTags(s.sectionHtml).slice(0, 3000),
  }))
  const first = h2Sections[0]
  const fallbackText = stripTags(bodyHtml).slice(0, 3000)

  return {
    title: sitePage.title,
    introText: extractIntro(bodyHtml, sitePage.excerpt),
    keyTakeawaysText: sitePage.keyTakeawaysHtml
      ? stripTags(sitePage.keyTakeawaysHtml).slice(0, 2000)
      : extractIntro(bodyHtml, sitePage.excerpt),
    h2Sections,
    h2Title: first?.heading ?? sitePage.title,
    h2SectionText: first?.text ?? fallbackText,
  }
}

export interface SlotContent {
  text: string
  title?: string
  quoteText?: string
}

function h2SlotContent(slotKey: string, ctx: ArticleContentContext): SlotContent {
  const index = H2_SLOT_SECTION_INDEX[slotKey] ?? 0
  const sec = sectionAt(ctx.h2Sections, index)
  const text = sec?.text ?? ctx.h2SectionText
  const title = sec?.heading ?? ctx.h2Title
  if (slotKey === 'F5') {
    return { text, quoteText: title }
  }
  return { text, title }
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
    case 'S4':
    case 'S6':
      return h2SlotContent(slotKey, ctx)
    case 'F5':
      return h2SlotContent(slotKey, ctx)
    case 'S2':
      return { text: ctx.keyTakeawaysText || ctx.introText }
    default:
      return { text: ctx.introText }
  }
}
