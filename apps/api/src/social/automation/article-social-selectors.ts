import { prisma, readS3Object } from '@socioply/shared'
import { logger } from '../../lib/logger'
import type { ArticleContentContext, H2Section, SlotContent } from './content'
import type { PostSource } from './weekly-matrix'

/**
 * Non-content H2s injected by enrichment (Key Takeaways / TOC / FAQ / etc.). These
 * must never be chosen as a section for a social post. Superset of enrichment's
 * GEO_EXCLUDE so the hook/image-carousel slots only use real article sections.
 */
const NON_CONTENT_HEADING =
  /^(faq|frequently asked questions|conclusion|key takeaways|introduction|intro|references|sources|table of contents)\b/i

/** Real content H2 sections (excludes Key Takeaways / FAQ / Conclusion / etc.). */
function contentSections(ctx: ArticleContentContext): H2Section[] {
  return ctx.h2Sections.filter((s) => !NON_CONTENT_HEADING.test(s.heading.trim()))
}

export interface ArticleSlotResult {
  slot: SlotContent
  /** Stylized diagram buffer for a diagram carousel; null → image carousel fallback. */
  diagramBackground: Buffer | null
}

interface DiagramRef {
  sectionTitle: string
  stylizedPngS3Key: string
}

/** Stylized diagrams for the article, ordered by section position. */
async function loadStylizedDiagrams(jobId: string): Promise<DiagramRef[]> {
  const rows = await prisma.articleDiagram.findMany({
    where: { sitePage: { jobId }, stylizedPngS3Key: { not: null } },
    orderBy: { position: 'asc' },
    select: { sectionTitle: true, stylizedPngS3Key: true },
  })
  return rows
    .filter((r): r is { sectionTitle: string; stylizedPngS3Key: string } => !!r.stylizedPngS3Key)
    .map((r) => ({ sectionTitle: r.sectionTitle, stylizedPngS3Key: r.stylizedPngS3Key }))
}

function sectionTextByHeading(ctx: ArticleContentContext, heading: string): SlotContent | null {
  const sec = ctx.h2Sections.find((s) => s.heading.trim() === heading.trim())
  return sec ? { text: sec.text, title: sec.heading } : null
}

function sectionAtIndex(ctx: ArticleContentContext, index: number): SlotContent {
  const secs = contentSections(ctx)
  if (secs.length === 0) return { text: ctx.h2SectionText, title: ctx.h2Title }
  const sec = secs[index % secs.length]
  return { text: sec.text, title: sec.heading }
}

async function diagramBuffer(key: string, jobId: string): Promise<Buffer | null> {
  try {
    const { body } = await readS3Object(key)
    return body
  } catch (err) {
    logger.warn({ jobId, key, err }, '[article-social] diagram fetch failed — image-carousel fallback')
    return null
  }
}

/**
 * Resolve an article-sourced slot. Diagram carousels (`art_diagram_*`) return the
 * stylized diagram buffer for the nth diagram section, or null (→ image carousel)
 * when there aren't enough diagrams. Hook slots return section text only.
 */
export async function resolveArticleSlot(
  source: PostSource,
  jobId: string,
  ctx: ArticleContentContext,
): Promise<ArticleSlotResult> {
  if (source === 'art_keytakeaways') {
    return { slot: { text: ctx.keyTakeawaysText }, diagramBackground: null }
  }

  const diagrams = await loadStylizedDiagrams(jobId)

  if (source === 'art_diagram_0' || source === 'art_diagram_1') {
    const n = source === 'art_diagram_1' ? 1 : 0
    const ref = diagrams[n]
    if (ref) {
      const slot = sectionTextByHeading(ctx, ref.sectionTitle) ?? sectionAtIndex(ctx, n)
      return { slot, diagramBackground: await diagramBuffer(ref.stylizedPngS3Key, jobId) }
    }
    // Fallback: image carousel from the nth H2 section.
    return { slot: sectionAtIndex(ctx, n), diagramBackground: null }
  }

  if (source === 'art_hook_diagram0') {
    const ref = diagrams[0]
    const slot = (ref && sectionTextByHeading(ctx, ref.sectionTitle)) ?? sectionAtIndex(ctx, 0)
    return { slot, diagramBackground: null } // hook video uses Seedance, not the diagram image
  }

  // art_hook_other — a real content section that is NOT the day's diagram-carousel
  // section (diagram[0]); never a non-content section like "Key Takeaways".
  const diagramHeading = diagrams[0]?.sectionTitle?.trim()
  const secs = contentSections(ctx)
  const other = secs.find((s) => s.heading.trim() !== diagramHeading) ?? secs[0]
  const slot: SlotContent = other
    ? { text: other.text, title: other.heading }
    : { text: ctx.h2SectionText, title: ctx.h2Title }
  return { slot, diagramBackground: null }
}
