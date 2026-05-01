/**
 * Article enrichment orchestrator — Phase C
 *
 * Triggered by the `article-enrichment` pg-boss queue after Phase B approval.
 *
 * For every <h2> section in SitePage.bodyHtml:
 *  1. Generate Mermaid syntax (Anthropic Claude, temperature 0.3)
 *  2. If SKIP → no diagram for this section
 *  3. Render Mermaid → SVG (mmdc / headless Chromium)
 *  4. If render fails → retry once with error feedback; skip on second failure
 *  5. Rasterize SVG → PNG @ 1200px (resvg-js)
 *  6. Upload PNG to S3 at diagrams/{jobId}/{position}.png
 *  7. Store ArticleDiagram row (mermaidSyntax + svgContent + pngS3Key)
 *  8. Rewrite bodyHtml with <figure> blocks
 *  9. Flip status → enriched
 *
 * Failure semantics:
 *  - A single failed section is logged + skipped; the article still ships
 *  - All sections fail → enrichmentStatus='failed', ArticleJob.status stays 'approved'
 */

import { prisma } from '../../lib/prisma'
import { logger } from '../../lib/logger'
import { Sentry } from '../../lib/sentry'
import { uploadBufferWithKey } from '../../lib/storage'
import { extractH2Sections, buildEnrichedHtml, buildFigureHtml } from './html-parser'
import { generateMermaidDiagram } from './mermaid-generator'
import { renderMermaidToSvg, MermaidRenderError } from './svg-renderer'
import { rasterizeSvg } from './svg-rasterizer'

const CDN_BASE = process.env.CDN_BASE ?? ''

function getCdnUrl(s3Key: string): string {
  return `${CDN_BASE.replace(/\/$/, '')}/${s3Key}`
}

function buildCaption(sectionTitle: string): string {
  return `Diagram: ${sectionTitle}`
}

export async function runArticleEnrichment(jobId: string): Promise<void> {
  logger.info({ jobId }, '[enrichment] starting')

  // ── Load job + sitePage ───────────────────────────────────────────────────
  const job = await prisma.articleJob.findUniqueOrThrow({
    where: { id: jobId },
    include: { sitePage: true },
  })

  const sitePage = job.sitePage
  if (!sitePage) {
    throw new Error(`No SitePage found for job ${jobId} — approval must run first`)
  }

  const bodyHtml = sitePage.bodyHtml ?? sitePage.originalBodyHtml ?? ''
  if (!bodyHtml) {
    throw new Error(`SitePage has no bodyHtml for job ${jobId}`)
  }

  // Collect primary keyword for the diagram prompt
  const primaryKeyword = sitePage.primaryKeyword ?? ''

  // Load topic for article topic name
  const topic = await prisma.topic.findUniqueOrThrow({
    where: { id: job.topicId },
    select: { topic: true },
  })

  // ── Mark in_progress ──────────────────────────────────────────────────────
  await prisma.sitePage.update({
    where: { id: sitePage.id },
    data: { enrichmentStatus: 'in_progress' },
  })

  // ── Extract H2 sections ───────────────────────────────────────────────────
  const sections = extractH2Sections(bodyHtml)
  logger.info({ jobId, sectionCount: sections.length }, '[enrichment] parsed sections')

  if (sections.length === 0) {
    logger.info({ jobId }, '[enrichment] no h2 sections — marking enriched immediately')
    await finishEnrichment(jobId, sitePage.id, bodyHtml, 0, 0, 0)
    return
  }

  // ── Process each section ──────────────────────────────────────────────────
  let totalCost = 0
  let totalInputTokens = 0
  let totalOutputTokens = 0
  let successCount = 0
  let failCount = 0

  // Diagrams to insert into HTML (keyed by afterH2Offset)
  const figuresToInsert: Array<{ afterH2Offset: number; figureHtml: string }> = []

  for (const section of sections) {
    logger.info(
      { jobId, position: section.position, heading: section.heading.slice(0, 60) },
      '[enrichment] processing section',
    )

    try {
      // ── Step 1: Generate Mermaid syntax ────────────────────────────────
      const gen1 = await generateMermaidDiagram({
        sectionTitle: section.heading,
        sectionHtml: section.sectionHtml,
        articleTopic: topic.topic,
        primaryKeyword,
        jobId,
        position: section.position,
      })

      totalCost += gen1.cost
      totalInputTokens += gen1.inputTokens
      totalOutputTokens += gen1.outputTokens

      // LLM said SKIP
      if (gen1.mermaidSyntax === null) {
        logger.info({ jobId, position: section.position }, '[enrichment] section skipped by LLM')
        continue
      }

      // ── Step 2: Render SVG (with one retry) ────────────────────────────
      let svgContent: string
      try {
        svgContent = await renderMermaidToSvg(gen1.mermaidSyntax)
      } catch (renderErr) {
        const errMsg = renderErr instanceof Error ? renderErr.message : String(renderErr)
        logger.warn({ jobId, position: section.position, errMsg }, '[enrichment] render failed — retrying with error feedback')

        // Retry with error context fed back to LLM
        const gen2 = await generateMermaidDiagram({
          sectionTitle: section.heading,
          sectionHtml: section.sectionHtml,
          articleTopic: topic.topic,
          primaryKeyword,
          jobId,
          position: section.position,
          retryContext: errMsg,
        })

        totalCost += gen2.cost
        totalInputTokens += gen2.inputTokens
        totalOutputTokens += gen2.outputTokens

        if (gen2.mermaidSyntax === null) {
          logger.info({ jobId, position: section.position }, '[enrichment] retry returned SKIP')
          continue
        }

        // Try rendering again
        try {
          svgContent = await renderMermaidToSvg(gen2.mermaidSyntax)
        } catch (retryRenderErr) {
          // Both attempts failed — log + skip this section
          const retryMsg = retryRenderErr instanceof Error ? retryRenderErr.message : String(retryRenderErr)
          logger.warn(
            { jobId, position: section.position, retryMsg },
            '[enrichment] render failed after retry — skipping section',
          )
          await prisma.errorLog.create({
            data: {
              jobId,
              userId: job.userId,
              errorType: 'enrichment_render_failed',
              errorMessage: `Section "${section.heading}": mmdc render failed after retry: ${retryMsg}`,
              context: { position: section.position },
            },
          })
          failCount++
          continue
        }

        // Retry succeeded — record using gen2 syntax
        await saveDiagramAndInsert({
          jobId,
          sitePage,
          section,
          mermaidSyntax: gen2.mermaidSyntax,
          svgContent,
          gen: gen2,
          figuresToInsert,
        })
        successCount++
        continue
      }

      // ── Step 3: Rasterize + upload (first attempt succeeded) ───────────
      await saveDiagramAndInsert({
        jobId,
        sitePage,
        section,
        mermaidSyntax: gen1.mermaidSyntax,
        svgContent,
        gen: gen1,
        figuresToInsert,
      })
      successCount++

    } catch (sectionErr) {
      // Unexpected error (LLM quota, network, etc.) — log + skip
      const errMsg = sectionErr instanceof Error ? sectionErr.message : String(sectionErr)
      logger.error({ jobId, position: section.position, err: sectionErr }, '[enrichment] section error')
      Sentry.captureException(sectionErr, {
        tags: { phase: 'enrichment', jobId },
        extra: { position: section.position, heading: section.heading },
      })
      await prisma.errorLog.create({
        data: {
          jobId,
          userId: job.userId,
          errorType: 'enrichment_section_error',
          errorMessage: `Section "${section.heading}": ${errMsg}`,
          context: { position: section.position },
        },
      })
      failCount++
    }
  }

  logger.info(
    { jobId, successCount, failCount, totalCost },
    '[enrichment] section processing complete',
  )

  // ── Determine final enrichment status ─────────────────────────────────────
  if (successCount === 0 && sections.length > 0 && failCount === sections.length) {
    // Every section failed — mark failed but don't throw (job stays in 'approved')
    await prisma.sitePage.update({
      where: { id: sitePage.id },
      data: {
        enrichmentStatus: 'failed',
        enrichmentError: `All ${sections.length} sections failed to generate diagrams`,
      },
    })
    await prisma.errorLog.create({
      data: {
        jobId,
        userId: job.userId,
        errorType: 'enrichment_total_failure',
        errorMessage: `All ${sections.length} h2 sections failed during enrichment`,
      },
    })
    logger.error({ jobId }, '[enrichment] all sections failed — job stays approved')
    return
  }

  // ── Rewrite bodyHtml with figure insertions ────────────────────────────────
  const enrichedHtml = buildEnrichedHtml(bodyHtml, figuresToInsert)

  await finishEnrichment(
    jobId,
    sitePage.id,
    enrichedHtml,
    totalCost,
    totalInputTokens,
    totalOutputTokens,
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────────

interface SaveDiagramOpts {
  jobId: string
  sitePage: { id: string; userId?: string }
  section: { position: number; anchor: string; heading: string; afterH2Offset: number }
  mermaidSyntax: string
  svgContent: string
  gen: { inputTokens: number; outputTokens: number; cost: number; provider: string; model: string }
  figuresToInsert: Array<{ afterH2Offset: number; figureHtml: string }>
}

async function saveDiagramAndInsert(opts: SaveDiagramOpts): Promise<void> {
  const { jobId, sitePage, section, mermaidSyntax, svgContent, gen, figuresToInsert } = opts

  // Rasterize SVG → PNG
  const { png, width, height } = rasterizeSvg(svgContent, 1200)

  // Upload PNG to S3
  const s3Key = `diagrams/${jobId}/${section.position}.png`
  await uploadBufferWithKey(s3Key, png, 'image/png')
  const pngUrl = getCdnUrl(s3Key)

  // Store ArticleDiagram row
  await prisma.articleDiagram.upsert({
    where: { sitePageId_position: { sitePageId: sitePage.id, position: section.position } },
    create: {
      sitePageId: sitePage.id,
      position: section.position,
      sectionAnchor: section.anchor,
      sectionTitle: section.heading,
      caption: buildCaption(section.heading),
      mermaidSyntax,
      svgContent,
      pngS3Key: s3Key,
      pngWidth: width,
      pngHeight: height,
      pngGeneratedAt: new Date(),
      llmProvider: gen.provider,
      llmModel: gen.model,
      inputTokens: gen.inputTokens,
      outputTokens: gen.outputTokens,
      cost: gen.cost,
    },
    update: {
      mermaidSyntax,
      svgContent,
      pngS3Key: s3Key,
      pngWidth: width,
      pngHeight: height,
      pngGeneratedAt: new Date(),
      llmProvider: gen.provider,
      llmModel: gen.model,
      inputTokens: gen.inputTokens,
      outputTokens: gen.outputTokens,
      cost: gen.cost,
    },
  })

  // Queue figure HTML for insertion into bodyHtml
  figuresToInsert.push({
    afterH2Offset: section.afterH2Offset,
    figureHtml: buildFigureHtml({
      imgUrl: pngUrl,
      alt: section.heading,
      caption: buildCaption(section.heading),
    }),
  })

  logger.info({ jobId, position: section.position, pngUrl }, '[enrichment] diagram saved')
}

async function finishEnrichment(
  jobId: string,
  sitePageId: string,
  enrichedHtml: string,
  cost: number,
  inputTokens: number,
  outputTokens: number,
): Promise<void> {
  await prisma.sitePage.update({
    where: { id: sitePageId },
    data: {
      bodyHtml: enrichedHtml,
      enrichmentStatus: 'completed',
      enrichedAt: new Date(),
      enrichmentError: null,
    },
  })

  await prisma.articleJob.update({
    where: { id: jobId },
    data: {
      status: 'enriched',
      enrichedAt: new Date(),
      totalCost: { increment: cost },
      totalTokens: { increment: inputTokens + outputTokens },
    },
  })

  logger.info({ jobId, cost }, '[enrichment] article enriched successfully')
}
