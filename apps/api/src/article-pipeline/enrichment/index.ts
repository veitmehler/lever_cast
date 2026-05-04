/**
 * Article enrichment orchestrator — Phase C
 *
 * 1) GEO (optional): match FAQ questions, summaries, restructure headings
 * 2) Key takeaways + collapsible TOC (after intro, before first content H2)
 * 3) Mermaid diagrams per content H2 (runs on body after intro split — skips takeaways)
 * 4) Optional WP category when topic has wordPressConnectionId
 */

import { prisma } from '../../lib/prisma'
import { logger } from '../../lib/logger'
import { Sentry } from '../../lib/sentry'
import { decrypt } from '../../lib/encryption'
import { uploadBufferWithKey } from '../../lib/storage'
import {
  extractH2Sections,
  buildEnrichedHtml,
  buildFigureHtml,
  injectHeadingIds,
  extractHeadingsForToc,
  buildTocHtml,
  findFirstH2Index,
  stripTags,
} from './html-parser'
import { generateMermaidDiagram } from './mermaid-generator'
import { renderMermaidToSvg } from './svg-renderer'
import { rasterizeSvg } from './svg-rasterizer'
import { parseFaqQuestions, parseSecondaryKeywords, pickKeywordForSection } from './faq-parse'
import { matchQuestionsToSections } from './geo-question-matcher'
import { generateQuestionFromKeyword, rephraseForUniqueness } from './geo-question-generator'
import { generateAiSummary } from './geo-summary-generator'
import { restructureHtmlWithGeo, type GeoSectionData } from './geo-html-restructurer'
import { generateKeyTakeaways } from './key-takeaways-generator'
import { selectWordPressCategory } from './wp-category-selector'

const CDN_BASE = process.env.CDN_BASE ?? ''

const GEO_EXCLUDE =
  /^(faq|frequently asked questions|conclusion|key takeaways)\b/i

function isGeoExcluded(heading: string): boolean {
  const t = stripTags(heading).trim()
  return GEO_EXCLUDE.test(t)
}

function getCdnUrl(s3Key: string): string {
  return `${CDN_BASE.replace(/\/$/, '')}/${s3Key}`
}

function buildCaption(sectionTitle: string): string {
  return `Diagram: ${sectionTitle}`
}

export async function runArticleEnrichment(jobId: string): Promise<void> {
  logger.info({ jobId }, '[enrichment] starting')

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

  const primaryKeyword = sitePage.primaryKeyword ?? ''

  const topic = await prisma.topic.findUniqueOrThrow({
    where: { id: job.topicId },
    select: {
      topic: true,
      wordPressConnectionId: true,
    },
  })

  await prisma.sitePage.update({
    where: { id: sitePage.id },
    data: { enrichmentStatus: 'in_progress', keyTakeawaysHtml: null, tocHtml: null },
  })

  await prisma.sectionEnrichment.deleteMany({ where: { sitePageId: sitePage.id } })

  const stepRows = await prisma.pipelineStep.findMany({
    where: { jobId, status: 'completed', stepNumber: { in: [2, 6] } },
  })
  const step2 = stepRows.find((s) => s.stepNumber === 2)?.output ?? ''
  const step6 = stepRows.find((s) => s.stepNumber === 6)?.output ?? ''

  const faqQuestions = parseFaqQuestions(step6)
  const secondaryKws = parseSecondaryKeywords(step2)

  let totalCost = 0
  let totalInputTokens = 0
  let totalOutputTokens = 0

  const baseSections = extractH2Sections(bodyHtml)
  let geoHtml = bodyHtml
  const geoByPosition = new Map<number, GeoSectionData>()

  type Eligible = {
    position: number
    heading: string
    contentSnippet: string
  }
  const eligible: Eligible[] = []
  for (const s of baseSections) {
    if (isGeoExcluded(s.heading)) continue
    eligible.push({
      position: s.position,
      heading: s.heading,
      contentSnippet: stripTags(s.sectionHtml).slice(0, 600),
    })
  }

  if (eligible.length > 0) {
    const matchByPos = new Map<number, string | null>()
    if (faqQuestions.length > 0) {
      try {
        const m = await matchQuestionsToSections({
          sections: eligible.map((e) => ({
            position: e.position,
            heading: e.heading,
            contentSnippet: e.contentSnippet,
          })),
          faqQuestions,
          jobId,
        })
        totalCost += m.cost
        totalInputTokens += m.inputTokens
        totalOutputTokens += m.outputTokens
        eligible.forEach((e, j) => {
          matchByPos.set(e.position, m.matches[j] ?? null)
        })
      } catch (err) {
        logger.warn({ jobId, err }, '[enrichment] GEO 101 failed — falling back to keyword questions')
        eligible.forEach((e) => matchByPos.set(e.position, null))
      }
    } else {
      eligible.forEach((e) => matchByPos.set(e.position, null))
    }

    for (const e of eligible) {
      let question = matchByPos.get(e.position) ?? null
      let source: 'faq_match' | 'keyword_gen' | 'rephrased' | null = question ? 'faq_match' : null
      let qCost = 0
      let qIn = 0
      let qOut = 0
      let qProv = ''
      let qModel = ''

      if (!question?.trim()) {
        try {
          const kw = pickKeywordForSection(e.heading, secondaryKws)
          const g = await generateQuestionFromKeyword({
            keyword: kw,
            sectionHeading: e.heading,
            jobId,
            position: e.position,
          })
          question = g.question
          source = 'keyword_gen'
          qCost += g.cost
          qIn += g.inputTokens
          qOut += g.outputTokens
          qProv = g.provider
          qModel = g.model
          totalCost += g.cost
          totalInputTokens += g.inputTokens
          totalOutputTokens += g.outputTokens
        } catch (err) {
          logger.warn({ jobId, err, position: e.position }, '[enrichment] geo 102 failed')
        }
      }

      if (!question?.trim()) continue

      try {
        const collision = await prisma.sectionEnrichment.count({
          where: {
            userId: job.userId,
            question,
            NOT: { sitePageId: sitePage.id },
          },
        })
        if (collision > 0) {
          const r = await rephraseForUniqueness({ question, jobId, position: e.position })
          question = r.question
          source = 'rephrased'
          totalCost += r.cost
          totalInputTokens += r.inputTokens
          totalOutputTokens += r.outputTokens
          qCost += r.cost
          qIn += r.inputTokens
          qOut += r.outputTokens
          qProv = r.provider
          qModel = r.model
        }
      } catch (err) {
        logger.warn({ jobId, err }, '[enrichment] geo 103 skipped')
      }

      let summary: string | undefined
      const sectionHtml =
        baseSections.find((s) => s.position === e.position)?.sectionHtml ?? ''
      const plainBody = stripTags(sectionHtml).slice(0, 8000)
      try {
        const s104 = await generateAiSummary({
          question,
          sectionContent: plainBody,
          jobId,
          position: e.position,
        })
        summary = s104.summary
        totalCost += s104.cost
        totalInputTokens += s104.inputTokens
        totalOutputTokens += s104.outputTokens
        qCost += s104.cost
        qIn += s104.inputTokens
        qOut += s104.outputTokens
        qProv = s104.provider
        qModel = s104.model
      } catch (err) {
        logger.warn({ jobId, err, position: e.position }, '[enrichment] geo 104 failed')
      }

      geoByPosition.set(e.position, {
        position: e.position,
        question,
        summary: summary ?? null,
      })

      try {
        await prisma.sectionEnrichment.upsert({
          where: {
            sitePageId_position: { sitePageId: sitePage.id, position: e.position },
          },
          create: {
            sitePageId: sitePage.id,
            userId: job.userId,
            position: e.position,
            originalH2: e.heading,
            question,
            summary: summary ?? null,
            questionSource: source,
            llmProvider: qProv || null,
            llmModel: qModel || null,
            inputTokens: qIn,
            outputTokens: qOut,
            cost: qCost,
          },
          update: {
            originalH2: e.heading,
            question,
            summary: summary ?? null,
            questionSource: source,
            llmProvider: qProv || null,
            llmModel: qModel || null,
            inputTokens: qIn,
            outputTokens: qOut,
            cost: qCost,
          },
        })
      } catch (err) {
        logger.warn({ jobId, err }, '[enrichment] sectionEnrichment upsert failed')
      }
    }

    if (geoByPosition.size > 0) {
      geoHtml = restructureHtmlWithGeo(bodyHtml, baseSections, geoByPosition)
    }
  }

  const cut = findFirstH2Index(geoHtml)
  const intro = cut >= 0 ? geoHtml.slice(0, cut) : ''
  const bodyOnly = cut >= 0 ? geoHtml.slice(cut) : geoHtml

  let keyTakeawaysHtml: string | null = null
  let tocHtml: string | null = null
  try {
    const kt = await generateKeyTakeaways({
      bodyHtml: geoHtml,
      primaryKeyword,
      jobId,
    })
    totalCost += kt.cost
    totalInputTokens += kt.inputTokens
    totalOutputTokens += kt.outputTokens
    keyTakeawaysHtml = kt.sectionHtml

    const stemForToc = injectHeadingIds(intro + kt.sectionHtml + bodyOnly)
    tocHtml = buildTocHtml(extractHeadingsForToc(stemForToc))
  } catch (err) {
    logger.warn({ jobId, err }, '[enrichment] key takeaways / toc failed')
  }

  const bodyWithIds = injectHeadingIds(bodyOnly)
  const sections = extractH2Sections(bodyWithIds)

  if (sections.length === 0) {
    const mergedPlain =
      intro +
      (keyTakeawaysHtml ?? '') +
      (tocHtml ?? '') +
      bodyWithIds
    await finishEnrichment(jobId, sitePage.id, mergedPlain, keyTakeawaysHtml, tocHtml, totalCost, totalInputTokens, totalOutputTokens)
    await maybeWpCategory(jobId)
    return
  }

  let successCount = 0
  let failCount = 0
  const figuresToInsert: Array<{ afterH2Offset: number; figureHtml: string }> = []

  for (const section of sections) {
    logger.info(
      { jobId, position: section.position, heading: section.heading.slice(0, 60) },
      '[enrichment] processing section (mermaid)',
    )

    try {
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

      if (gen1.mermaidSyntax === null) {
        logger.info({ jobId, position: section.position }, '[enrichment] section skipped by LLM')
        continue
      }

      let svgContent: string
      try {
        svgContent = await renderMermaidToSvg(gen1.mermaidSyntax)
      } catch (renderErr) {
        const errMsg = renderErr instanceof Error ? renderErr.message : String(renderErr)
        logger.warn({ jobId, position: section.position, errMsg }, '[enrichment] render failed — retrying')

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
          continue
        }

        try {
          svgContent = await renderMermaidToSvg(gen2.mermaidSyntax)
        } catch (retryRenderErr) {
          const retryMsg = retryRenderErr instanceof Error ? retryRenderErr.message : String(retryRenderErr)
          logger.warn({ jobId, position: section.position, retryMsg }, '[enrichment] render failed after retry')
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

  if (successCount === 0 && sections.length > 0 && failCount === sections.length) {
    await prisma.sitePage.update({
      where: { id: sitePage.id },
      data: {
        enrichmentStatus: 'failed',
        enrichmentError: `All ${sections.length} sections failed to generate diagrams`,
        keyTakeawaysHtml,
        tocHtml,
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

  const diagrammedBody = buildEnrichedHtml(bodyWithIds, figuresToInsert)
  const merged =
    intro +
    (keyTakeawaysHtml ?? '') +
    (tocHtml ?? '') +
    diagrammedBody

  await finishEnrichment(
    jobId,
    sitePage.id,
    merged,
    keyTakeawaysHtml,
    tocHtml,
    totalCost,
    totalInputTokens,
    totalOutputTokens,
  )

  await maybeWpCategory(jobId)
}

async function maybeWpCategory(jobId: string): Promise<void> {
  try {
    const job = await prisma.articleJob.findUnique({
      where: { id: jobId },
      select: { userId: true, topicId: true },
    })
    if (!job) return

    const topicRow = await prisma.topic.findUnique({
      where: { id: job.topicId },
      select: { id: true, topic: true, wordPressConnectionId: true },
    })
    if (!topicRow?.wordPressConnectionId) return

    const conn = await prisma.wordPressConnection.findFirst({
      where: { id: topicRow.wordPressConnectionId, userId: job.userId },
    })
    if (!conn) return

    const sp = await prisma.sitePage.findUnique({
      where: { jobId },
      select: { title: true },
    })

    const plain = decrypt(conn.appPassword)
    const auth = 'Basic ' + Buffer.from(`${conn.username}:${plain}`).toString('base64')

    const cat = await selectWordPressCategory({
      topic: topicRow.topic,
      title: sp?.title ?? topicRow.topic,
      siteUrl: conn.siteUrl,
      authHeader: auth,
      jobId,
    })

    if (cat.categoryId != null) {
      await prisma.topic.update({
        where: { id: topicRow.id },
        data: { wpCategoryId: cat.categoryId },
      })
      await prisma.articleJob.update({
        where: { id: jobId },
        data: {
          totalCost: { increment: cat.cost },
          totalTokens: { increment: cat.inputTokens + cat.outputTokens },
        },
      })
    }
  } catch (err) {
    logger.warn({ jobId, err }, '[enrichment] WP category selection failed')
  }
}

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

  const { png, width, height } = rasterizeSvg(svgContent, 1200)

  const s3Key = `diagrams/${jobId}/${section.position}.png`
  await uploadBufferWithKey(s3Key, png, 'image/png')
  const pngUrl = getCdnUrl(s3Key)

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
  keyTakeawaysHtml: string | null,
  tocHtml: string | null,
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
      keyTakeawaysHtml,
      tocHtml,
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
