/**
 * Article enrichment orchestrator — Phase C
 *
 * 1) GEO (optional): match FAQ questions, summaries, restructure headings
 * 2) Key takeaways + collapsible TOC (after intro, before first content H2)
 * 3) Mermaid diagrams per content H2 (runs on body after intro split — skips takeaways)
 * 4) Optional WP category when topic has wordPressConnectionId
 * 5) Optional WP tags (up to 4) when topic has wordPressConnectionId
 */

import { prisma } from '../../lib/prisma'
import { logger } from '../../lib/logger'
import { Sentry } from '../../lib/sentry'
import { decrypt } from '../../lib/encryption'
import { uploadBufferWithKey, deleteS3Prefix } from '../../lib/storage'
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
import { generateMermaidDiagram, extractMermaidConcepts } from './mermaid-generator'
import { renderMermaidToSvg } from './svg-renderer'
import { rasterizeSvg } from './svg-rasterizer'
import { sanitizeSvg, addSvgAccessibility } from './svg-sanitizer'
import { selectDiagramType } from './diagram-type-selector'
import { buildDiagramInitDirective, buildDarkDiagramInitDirective, themeFromBrand, DIAGRAM_DARK_BACKGROUND } from './diagram-theme'
import { postprocessDiagramPng } from './png-postprocess'
import { parseFaqQuestions, parseSecondaryKeywords, pickKeywordForSection } from './faq-parse'
import { matchQuestionsToSections } from './geo-question-matcher'
import { generateQuestionFromKeyword, rephraseForUniqueness } from './geo-question-generator'
import { generateAiSummary } from './geo-summary-generator'
import { restructureHtmlWithGeo, type GeoSectionData } from './geo-html-restructurer'
import { sanitizeGeoQuestion } from './geo-question-sanitizer'
import { normalizeH2Questions } from '../approval-service'
import { generateKeyTakeaways } from './key-takeaways-generator'
import { generateDiagramCaption } from './diagram-caption-generator'
import { selectWordPressCategory } from './wp-category-selector'
import { selectWordPressTags } from './wp-tag-selector'
import { closeDiagramRasterBrowser, getDiagramRasterBrowser } from './diagram-browser-pool'

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

/** Phase C milestones → ArticleJob.currentStep (SSE + workflow UI). Not PromptTemplate IDs.
 * 19 GEO · 20 key takeaways+TOC · 21 diagrams · 22 merge figures · 23 save (.finish sets 25).
 */
async function setEnrichmentPhaseStep(jobId: string, phaseStep: number): Promise<void> {
  await prisma.articleJob.update({
    where: { id: jobId },
    data: { currentStep: phaseStep },
  })
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

  // Always start from the pre-enrichment backup so re-runs don't accumulate
  // stale <figure> tags from previous runs on top of new ones.
  const bodyHtml = sitePage.originalBodyHtml ?? sitePage.bodyHtml ?? ''
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

  // Wipe previous-run artefacts so re-runs are idempotent regardless of trigger.
  await prisma.sectionEnrichment.deleteMany({ where: { sitePageId: sitePage.id } })
  await prisma.articleDiagram.deleteMany({ where: { sitePageId: sitePage.id } })
  // Clear enrichment errors so the UI only shows errors from this run.
  await prisma.errorLog.deleteMany({ where: { jobId, errorType: { startsWith: 'enrichment_' } } })
  // Delete all S3 diagram objects so SKIPped sections don't show stale files from previous runs.
  await deleteS3Prefix(`articles/${job.userId}/${jobId}/diagrams/`).catch((err) =>
    logger.warn({ jobId, err }, '[enrichment] S3 diagram prefix delete failed — continuing'),
  )

  await setEnrichmentPhaseStep(jobId, 19)

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
      // Sanitize the FAQ-matched question first; null means fall through to keyword generation
      let question = sanitizeGeoQuestion(matchByPos.get(e.position) ?? null)
      let source: 'faq_match' | 'keyword_gen' | 'rephrased' | null = question ? 'faq_match' : null
      let qCost = 0
      let qIn = 0
      let qOut = 0
      let qProv = ''
      let qModel = ''

      if (!question) {
        try {
          const kw = pickKeywordForSection(e.heading, secondaryKws)
          const g = await generateQuestionFromKeyword({
            keyword: kw,
            sectionHeading: e.heading,
            jobId,
            position: e.position,
          })
          // Sanitize keyword-generated question; null means skip this section
          question = sanitizeGeoQuestion(g.question)
          if (question) {
            source = 'keyword_gen'
            qCost += g.cost
            qIn += g.inputTokens
            qOut += g.outputTokens
            qProv = g.provider
            qModel = g.model
            totalCost += g.cost
            totalInputTokens += g.inputTokens
            totalOutputTokens += g.outputTokens
          }
        } catch (err) {
          logger.warn({ jobId, err, position: e.position }, '[enrichment] geo 102 failed')
        }
      }

      if (!question) continue

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
          // Sanitize rephrased question; if null, keep the pre-rephrase question
          const rephrased = sanitizeGeoQuestion(r.question)
          if (rephrased) {
            question = rephrased
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

  await setEnrichmentPhaseStep(jobId, 20)

  const cut = findFirstH2Index(geoHtml)
  const intro = cut >= 0 ? geoHtml.slice(0, cut) : ''
  const bodyOnly = cut >= 0 ? geoHtml.slice(cut) : geoHtml

  let keyTakeawaysHtml: string | null = null
  let tocHtml: string | null = null
  // Default: inject heading IDs on body alone (used when key-takeaways generation fails).
  // Overridden inside the try block with a shared-pass result to keep ToC anchors aligned.
  let bodyWithIds = injectHeadingIds(bodyOnly)
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

    // Run injectHeadingIds once on the full concatenated HTML so the shared
    // `used` set guarantees ToC href anchors match body heading ids exactly,
    // even when multiple headings share a slug prefix.
    const BODY_SEP = '<!--BODY_START-->'
    const stemForToc = injectHeadingIds(intro + kt.sectionHtml + BODY_SEP + bodyOnly)
    tocHtml = buildTocHtml(extractHeadingsForToc(stemForToc))
    // Extract the body portion (with IDs) from the combined result
    const sepIdx = stemForToc.indexOf(BODY_SEP)
    if (sepIdx >= 0) {
      bodyWithIds = stemForToc.slice(sepIdx + BODY_SEP.length)
    }
  } catch (err) {
    logger.warn({ jobId, err }, '[enrichment] key takeaways / toc failed')
  }

  await setEnrichmentPhaseStep(jobId, 21)

  const sections = extractH2Sections(bodyWithIds)

  if (sections.length === 0) {
    await setEnrichmentPhaseStep(jobId, 22)

    await setEnrichmentPhaseStep(jobId, 23)
    const mergedPlain =
      intro +
      (keyTakeawaysHtml ?? '') +
      (tocHtml ?? '') +
      bodyWithIds
    await finishEnrichment(jobId, sitePage.id, mergedPlain, keyTakeawaysHtml, tocHtml, totalCost, totalInputTokens, totalOutputTokens)
    await maybeWpCategory(jobId)
    await maybeWpTags(jobId)
    return
  }

  let successCount = 0
  let failCount = 0
  const figuresToInsert: Array<{ afterH2Offset: number; figureHtml: string }> = []

  const brandStyle = await prisma.brandSettings.findUnique({
    where: { userId: job.userId },
    select: {
      diagramPrimaryColor: true,
      diagramSecondaryColor: true,
      diagramLineColor: true,
      diagramFontFamily: true,
    },
  })
  const theme = themeFromBrand(brandStyle ?? undefined)
  const diagramInitDirective = buildDiagramInitDirective(theme)
  const darkDiagramInitDirective = buildDarkDiagramInitDirective(theme)

  const usedDiagramTypes: string[] = []
  // Rolling window of concept labels from the last 2 successful diagrams.
  const priorConceptWindows: string[] = []

  try {
    await getDiagramRasterBrowser()

    for (const section of sections) {
      logger.info(
        { jobId, position: section.position, heading: section.heading.slice(0, 60) },
        '[enrichment] processing section (mermaid)',
      )

      try {
        let typePick = await selectDiagramType({
          sectionTitle: section.heading,
          contentSnippet: stripTags(section.sectionHtml),
          alreadyUsed: [...usedDiagramTypes],
          jobId,
          position: section.position,
        })
        totalCost += typePick.cost
        totalInputTokens += typePick.inputTokens
        totalOutputTokens += typePick.outputTokens

        // Code-enforced diversity: if the LLM picked the same type as the last
        // used one, re-query once with a hard exclusion so back-to-back dupes
        // are broken without relying on prompt-only soft hints.
        const lastUsed = usedDiagramTypes.at(-1)
        if (typePick.diagramType !== null && typePick.diagramType === lastUsed) {
          logger.info(
            { jobId, position: section.position, type: typePick.diagramType },
            '[enrichment] type same as previous — re-querying with exclusion',
          )
          const retry = await selectDiagramType({
            sectionTitle: section.heading,
            contentSnippet: stripTags(section.sectionHtml),
            alreadyUsed: [...usedDiagramTypes],
            excludeType: typePick.diagramType,
            jobId,
            position: section.position,
          })
          totalCost += retry.cost
          totalInputTokens += retry.inputTokens
          totalOutputTokens += retry.outputTokens
          // Use the retry result if it yielded a different (non-null) type; otherwise
          // keep the original so the section still gets a diagram.
          if (retry.diagramType !== null) typePick = retry
        }

        if (typePick.diagramType === null) {
          logger.info({ jobId, position: section.position }, '[enrichment] section skipped by diagram-type selector')
          continue
        }

        const diagramType = typePick.diagramType

        // Build prior-concepts hint: concat labels from the last 2 diagrams.
        const priorConceptsContext = priorConceptWindows.length > 0
          ? priorConceptWindows.join(', ')
          : undefined

        const gen1 = await generateMermaidDiagram({
          sectionTitle: section.heading,
          sectionHtml: section.sectionHtml,
          articleTopic: topic.topic,
          primaryKeyword,
          diagramType,
          priorConceptsContext,
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
          svgContent = await renderMermaidToSvg(gen1.mermaidSyntax, diagramInitDirective)
        } catch (renderErr) {
          const errMsg = renderErr instanceof Error ? renderErr.message : String(renderErr)
          logger.warn({ jobId, position: section.position, errMsg }, '[enrichment] render failed — retrying')

          const gen2 = await generateMermaidDiagram({
            sectionTitle: section.heading,
            sectionHtml: section.sectionHtml,
            articleTopic: topic.topic,
            primaryKeyword,
            diagramType,
            priorConceptsContext,
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
            svgContent = await renderMermaidToSvg(gen2.mermaidSyntax, diagramInitDirective)
          } catch (retryRenderErr) {
            const retryMsg =
              retryRenderErr instanceof Error ? retryRenderErr.message : String(retryRenderErr)
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

          const captionResult2 = await generateDiagramCaption({
            articleTopic: topic.topic,
            sectionTitle: section.heading,
            diagramType,
            mermaidSyntax: gen2.mermaidSyntax,
            jobId,
            position: section.position,
          })
          totalCost += captionResult2.cost
          totalInputTokens += captionResult2.inputTokens
          totalOutputTokens += captionResult2.outputTokens
          await saveDiagramAndInsert({
            jobId,
            sitePage: { id: sitePage.id, userId: job.userId },
            section,
            mermaidSyntax: gen2.mermaidSyntax,
            svgContent,
            gen: gen2,
            figuresToInsert,
            darkDiagramInitDirective,
            caption: captionResult2.caption,
          })
          usedDiagramTypes.push(diagramType)
          priorConceptWindows.push(extractMermaidConcepts(gen2.mermaidSyntax))
          if (priorConceptWindows.length > 2) priorConceptWindows.shift()
          successCount++
          continue
        }

        const captionResult1 = await generateDiagramCaption({
          articleTopic: topic.topic,
          sectionTitle: section.heading,
          diagramType,
          mermaidSyntax: gen1.mermaidSyntax,
          jobId,
          position: section.position,
        })
        totalCost += captionResult1.cost
        totalInputTokens += captionResult1.inputTokens
        totalOutputTokens += captionResult1.outputTokens
        await saveDiagramAndInsert({
          jobId,
          sitePage: { id: sitePage.id, userId: job.userId },
          section,
          mermaidSyntax: gen1.mermaidSyntax,
          svgContent,
          gen: gen1,
          figuresToInsert,
          darkDiagramInitDirective,
          caption: captionResult1.caption,
        })
        usedDiagramTypes.push(diagramType)
        priorConceptWindows.push(extractMermaidConcepts(gen1.mermaidSyntax))
        if (priorConceptWindows.length > 2) priorConceptWindows.shift()
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
  } finally {
    await closeDiagramRasterBrowser()
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

  await setEnrichmentPhaseStep(jobId, 22)

  const diagrammedBody = buildEnrichedHtml(bodyWithIds, figuresToInsert)
  const merged =
    intro +
    (keyTakeawaysHtml ?? '') +
    (tocHtml ?? '') +
    diagrammedBody

  await setEnrichmentPhaseStep(jobId, 23)

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
  await maybeWpTags(jobId)
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

async function maybeWpTags(jobId: string): Promise<void> {
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

    const sel = await selectWordPressTags({
      topic: topicRow.topic,
      title: sp?.title ?? topicRow.topic,
      siteUrl: conn.siteUrl,
      authHeader: auth,
      jobId,
    })

    await prisma.topic.update({
      where: { id: topicRow.id },
      data: { wpTagIds: sel.tagIds },
    })

    await prisma.articleJob.update({
      where: { id: jobId },
      data: {
        totalCost: { increment: sel.cost },
        totalTokens: { increment: sel.inputTokens + sel.outputTokens },
      },
    })
  } catch (err) {
    logger.warn({ jobId, err }, '[enrichment] WP tag selection failed')
  }
}

interface SaveDiagramOpts {
  jobId: string
  sitePage: { id: string; userId: string }
  section: { position: number; anchor: string; heading: string; afterH2Offset: number }
  mermaidSyntax: string
  svgContent: string
  gen: { inputTokens: number; outputTokens: number; cost: number; provider: string; model: string }
  figuresToInsert: Array<{ afterH2Offset: number; figureHtml: string }>
  darkDiagramInitDirective: string
  caption: string
}

/** Match screenshot + crop background (mmdc `-b white`). */
const DIAGRAM_LIGHT_RASTER_BG = '#FFFFFF'

async function saveDiagramAndInsert(opts: SaveDiagramOpts): Promise<void> {
  const { jobId, sitePage, section, mermaidSyntax, svgContent, gen, figuresToInsert, darkDiagramInitDirective, caption } =
    opts

  const cleanSvg = addSvgAccessibility(
    sanitizeSvg(svgContent),
    caption || section.heading,
    section.heading,
    `diagram-title-${jobId.slice(0, 8)}-${section.position}`,
  )

  // SVG — primary format embedded in article HTML
  const svgKey = `articles/${sitePage.userId}/${jobId}/diagrams/${section.position}.svg`
  await uploadBufferWithKey(svgKey, Buffer.from(cleanSvg, 'utf8'), 'image/svg+xml')
  const svgUrl = getCdnUrl(svgKey)

  // PNG — light theme, tight crop + square pad (social / email fallback)
  const rawLight = await rasterizeSvg(cleanSvg, 1200, DIAGRAM_LIGHT_RASTER_BG)
  const light = await postprocessDiagramPng(rawLight.png, DIAGRAM_LIGHT_RASTER_BG)
  const pngKey = `articles/${sitePage.userId}/${jobId}/diagrams/${section.position}.png`
  await uploadBufferWithKey(pngKey, light.png, 'image/png')

  let pngDarkKey: string | null = null
  let darkW: number | null = null
  let darkH: number | null = null
  try {
    const darkSvg = await renderMermaidToSvg(mermaidSyntax, darkDiagramInitDirective, DIAGRAM_DARK_BACKGROUND)
    const darkClean = sanitizeSvg(darkSvg)
    const rawDark = await rasterizeSvg(darkClean, 1200, DIAGRAM_DARK_BACKGROUND)
    const dark = await postprocessDiagramPng(rawDark.png, DIAGRAM_DARK_BACKGROUND)
    pngDarkKey = `articles/${sitePage.userId}/${jobId}/diagrams/${section.position}-dark.png`
    await uploadBufferWithKey(pngDarkKey, dark.png, 'image/png')
    darkW = dark.width
    darkH = dark.height
  } catch (err) {
    logger.warn({ jobId, position: section.position, err }, '[enrichment] dark PNG render failed — skipping')
  }

  await prisma.articleDiagram.upsert({
    where: { sitePageId_position: { sitePageId: sitePage.id, position: section.position } },
    create: {
      sitePageId: sitePage.id,
      position: section.position,
      sectionAnchor: section.anchor,
      sectionTitle: section.heading,
      caption,
      mermaidSyntax,
      svgContent: cleanSvg,
      svgS3Key: svgKey,
      pngS3Key: pngKey,
      pngWidth: light.width,
      pngHeight: light.height,
      pngDarkS3Key: pngDarkKey,
      pngDarkWidth: darkW,
      pngDarkHeight: darkH,
      pngGeneratedAt: new Date(),
      llmProvider: gen.provider,
      llmModel: gen.model,
      inputTokens: gen.inputTokens,
      outputTokens: gen.outputTokens,
      cost: gen.cost,
    },
    update: {
      caption,
      mermaidSyntax,
      svgContent: cleanSvg,
      svgS3Key: svgKey,
      pngS3Key: pngKey,
      pngWidth: light.width,
      pngHeight: light.height,
      pngDarkS3Key: pngDarkKey,
      pngDarkWidth: darkW,
      pngDarkHeight: darkH,
      pngGeneratedAt: new Date(),
      llmProvider: gen.provider,
      llmModel: gen.model,
      inputTokens: gen.inputTokens,
      outputTokens: gen.outputTokens,
      cost: gen.cost,
    },
  })

  // Article HTML references the SVG — browsers render it natively and it's
  // AI-crawlable text. PNG is kept for bundle/email fallback only.
  figuresToInsert.push({
    afterH2Offset: section.afterH2Offset,
    figureHtml: buildFigureHtml({
      imgUrl: svgUrl,
      alt: section.heading,
      caption,
    }),
  })

  logger.info({ jobId, position: section.position, svgUrl }, '[enrichment] diagram saved')
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
  const normalizedHtml = normalizeH2Questions(enrichedHtml)

  await prisma.sitePage.update({
    where: { id: sitePageId },
    data: {
      bodyHtml: normalizedHtml,
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
      currentStep: 25,
    },
  })

  logger.info({ jobId, cost }, '[enrichment] article enriched successfully')
}
