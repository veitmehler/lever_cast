/**
 * Approval Service — Phase B
 *
 * Triggered by POST /api/articles/:jobId/approve.
 * Precondition: ArticleJob.status === 'completed'.
 *
 * Flow:
 *   1. Build PipelineContext from DB-persisted step outputs (1-12)
 *   2. Step 13  — generate_seo_metadata  (JSON: metaTitle, metaDescription, urlSlug)
 *   3. Step 15  — generate_image_prompt  (text prompt sent to Fal.ai)
 *      ↳ generateFeaturedImage → uploadFeaturedImageToS3 → Media row
 *   4. Upsert SitePage (body, SEO fields, citations, featured image)
 *   5. Step 16  — generate_schema_markup → SitePage.schemaJson (non-fatal if fails)
 *   6. Step 17  — generate_excerpt       → SitePage.excerpt
 *   7. Step 18  — generate_legal_disclaimer → SitePage.disclaimer
 *   8. Mark ArticleJob.status = 'approved'
 *   9. Enqueue 'article-enrichment' via pg-boss
 */

import type { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { logger } from '../lib/logger'
import { Sentry } from '../lib/sentry'
import { StepRunner } from './step-runner'
import { generateFeaturedImage } from './image-generation'
import { uploadFeaturedImageToS3WithRetry } from './image-uploader'
import { getBoss, QUEUES } from '../queues/index'
import type { PipelineContext } from './variable-resolver'

// ── Helpers ────────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

/** Calculate approximate reading time in minutes from HTML. */
function calculateReadingTime(html: string): number {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  const words = text.split(' ').filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

/** Returns a slug that is unique for the user, appending a jobId suffix on collision. */
async function resolveUniqueSlug(userId: string, jobId: string, base: string): Promise<string> {
  if (!base) return `article-${jobId.slice(0, 8)}`
  const conflict = await prisma.sitePage.findFirst({
    where: { userId, slug: base, NOT: { jobId } },
    select: { id: true },
  })
  return conflict ? `${base}-${jobId.slice(0, 8)}` : base
}

/** Extract SEO fields from the parsed Step 13 output. */
function extractSeoFields(parsed: Record<string, unknown>): {
  metaTitle: string
  metaDescription: string
  urlSlug: string
} {
  return {
    metaTitle: String(parsed.metaTitle ?? parsed['meta title'] ?? parsed.title ?? ''),
    metaDescription: String(parsed.metaDescription ?? parsed['meta description'] ?? parsed.description ?? ''),
    urlSlug: String(parsed.urlSlug ?? parsed.url_slug ?? parsed.slug ?? ''),
  }
}

/** Extract primaryKeyword from the parsed Step 2 output. */
function extractPrimaryKeyword(parsed: Record<string, unknown> | undefined): string {
  if (!parsed) return ''
  return String(
    parsed['Primary Keyword'] ??
    parsed.primary_keyword ??
    parsed.primaryKeyword ??
    '',
  )
}

/** Parse citations from the Step 12 output. */
function parseCitations(raw: string): Record<string, unknown> | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return { resource_links: parsed }
    if (parsed && typeof parsed === 'object') return parsed as Record<string, unknown>
  } catch { /* ignore */ }
  return null
}

/** Truncate excerpt to ≤150 chars. */
function truncateExcerpt(text: string): string {
  const cleaned = text.replace(/<[^>]+>/g, '').trim()
  return cleaned.length > 150 ? `${cleaned.slice(0, 147)}...` : cleaned
}

/** Strip a leading markdown doc title (step 11 often starts with `# Corrected Article` etc.) */
export function cleanStepOutput(text: string): string {
  return text.replace(/^#+\s+[^\r\n]+\s*\r?\n+/, '').trimStart()
}

/**
 * Ensures every H2 that is phrased as a question ends with a `?`.
 * Detection: the visible text starts with a common English interrogative word.
 * Only appends `?` when the heading has no terminal punctuation at all.
 */
export function normalizeH2Questions(html: string): string {
  const QUESTION_START =
    /^(how|why|what|when|where|which|who|is|are|can|does|do|will|should|could|would|has|have|did)\b/i
  const TERMINAL_PUNCT = /[?!.]$/

  return html.replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/gi, (match, attrs: string, inner: string) => {
    const text = inner.replace(/<[^>]+>/g, '').trim()
    if (!QUESTION_START.test(text) || TERMINAL_PUNCT.test(text)) return match

    // Inject `?` just before any trailing closing HTML tags, or at the end of inner.
    const fixedInner = inner.trimEnd().replace(/(<\/[a-z][^>]*>(?:\s*<\/[a-z][^>]*>)*)$/i, '?$1')
    const finalInner = fixedInner === inner.trimEnd() ? inner.trimEnd() + '?' : fixedInner
    return `<h2${attrs}>${finalInner}</h2>`
  })
}

// ── Main approval flow ─────────────────────────────────────────────────────────

export async function approveArticleJob(jobId: string): Promise<void> {
  logger.info({ jobId }, '[approval] starting approval chain')

  // Load job + topic
  const job = await prisma.articleJob.findUniqueOrThrow({
    where: { id: jobId },
    include: { topic: true },
  })

  const { userId, topic } = job

  // ── Build PipelineContext from completed Phase A steps ─────────────────────
  const existingSteps = await prisma.pipelineStep.findMany({
    where: { jobId, status: 'completed' },
    orderBy: { stepNumber: 'asc' },
  })

  const ctx: PipelineContext = {
    jobId,
    userId,
    topicId: job.topicId,
    topicText: topic.topic,
    topicSlug: topic.slug,
    completedSteps: new Map(),
    parsedSteps: new Map(),
  }

  for (const step of existingSteps) {
    ctx.completedSteps.set(step.stepNumber, step.output ?? '')
    if ([2, 12, 13].includes(step.stepNumber) && step.output) {
      try { ctx.parsedSteps.set(step.stepNumber, JSON.parse(step.output)) } catch { /* ok */ }
    }
  }

  // ── Confirm we have the minimum steps needed ───────────────────────────────
  const step11Raw = ctx.completedSteps.get(11) ?? ctx.completedSteps.get(9) ?? ''
  if (!step11Raw) {
    throw new Error('Missing step 11 (article body) — cannot approve')
  }
  const step11 = normalizeH2Questions(cleanStepOutput(step11Raw))

  // ── Step 13: generate_seo_metadata ────────────────────────────────────────
  logger.info({ jobId }, '[approval] step 13 — generate_seo_metadata')
  await prisma.articleJob.update({ where: { id: jobId }, data: { currentStep: 13 } })

  const runner13 = new StepRunner(jobId, 13, ctx)
  const result13 = await runner13.execute()

  ctx.completedSteps.set(13, result13.output)
  if (result13.parsedOutput !== undefined) {
    ctx.parsedSteps.set(13, result13.parsedOutput)
  }

  const seo = extractSeoFields(
    (result13.parsedOutput as Record<string, unknown> | undefined) ?? {},
  )
  logger.info({ jobId, seo }, '[approval] step 13 complete')

  // ── Step 15: generate_image_prompt → Fal.ai → S3 → Media ─────────────────
  logger.info({ jobId }, '[approval] step 15 — generate_image_prompt')
  await prisma.articleJob.update({ where: { id: jobId }, data: { currentStep: 15 } })

  const runner15 = new StepRunner(jobId, 15, ctx)
  const result15 = await runner15.execute()

  ctx.completedSteps.set(15, result15.output)
  const imagePromptText = result15.output.trim()

  let mediaId: string | null = null
  try {
    logger.info({ jobId }, '[approval] generating featured image with Fal.ai')
    const falImageUrl = await generateFeaturedImage(imagePromptText, jobId)

    const altText = seo.metaTitle || topic.topic
    const upload = await uploadFeaturedImageToS3WithRetry(falImageUrl, userId, jobId, altText)
    mediaId = upload.mediaId
    logger.info({ jobId, mediaId }, '[approval] featured image ready')
  } catch (err) {
    // Image generation failure is non-fatal — log + Sentry, continue without image
    logger.error({ jobId, err }, '[approval] featured image failed — continuing without image')
    Sentry.captureException(err, { tags: { phase: 'approval', step: 15 } })
  }

  // ── Upsert SitePage (makes {{article_title}} resolvable for steps 17/18) ──
  logger.info({ jobId }, '[approval] upserting SitePage')

  const primaryKeyword = extractPrimaryKeyword(
    ctx.parsedSteps.get(2) as Record<string, unknown> | undefined,
  )
  const citations = parseCitations(ctx.completedSteps.get(12) ?? '')
  const baseSlug = slugify(seo.urlSlug || seo.metaTitle || topic.topic)
  const finalSlug = await resolveUniqueSlug(userId, jobId, baseSlug)
  const seoTitle = seo.metaTitle || topic.topic
  const readingTime = calculateReadingTime(step11)

  // Delete any conflicting sitePage keyed by jobId — shouldn't exist, but defensive
  await prisma.sitePage.upsert({
    where: { jobId },
    create: {
      jobId,
      userId,
      slug: finalSlug,
      title: seoTitle,
      bodyHtml: step11,
      originalBodyHtml: step11,
      seoTitle,
      seoDescription: seo.metaDescription || null,
      primaryKeyword: primaryKeyword || null,
      citations: (citations ?? undefined) as Prisma.InputJsonValue | undefined,
      readingTime,
      featuredImageId: mediaId,
      enrichmentStatus: 'pending',
    },
    update: {
      slug: finalSlug,
      title: seoTitle,
      bodyHtml: step11,
      originalBodyHtml: step11,
      seoTitle,
      seoDescription: seo.metaDescription || null,
      primaryKeyword: primaryKeyword || null,
      citations: (citations ?? undefined) as Prisma.InputJsonValue | undefined,
      readingTime,
      featuredImageId: mediaId,
      enrichmentStatus: 'pending',
    },
  })

  // ── Step 16: generate_schema_markup ───────────────────────────────────────
  // Runs after SitePage upsert so {{article_url}} resolves (slug is now persisted).
  logger.info({ jobId }, '[approval] step 16 — generate_schema_markup')
  await prisma.articleJob.update({ where: { id: jobId }, data: { currentStep: 16 } })

  try {
    const runner16 = new StepRunner(jobId, 16, ctx)
    const result16 = await runner16.execute()
    ctx.completedSteps.set(16, result16.output)

    const rawSchema = result16.output.trim()
    if (rawSchema) {
      // Validate it's parseable JSON before persisting
      JSON.parse(rawSchema)
      await prisma.sitePage.update({
        where: { jobId },
        data: { schemaJson: rawSchema },
      })
      logger.info({ jobId }, '[approval] step 16 — schema markup persisted')
    }
  } catch (err) {
    // Schema markup failure is non-fatal — log + Sentry, article is still approved
    logger.error({ jobId, err }, '[approval] step 16 — schema markup failed, continuing')
    Sentry.captureException(err, { tags: { phase: 'approval', step: 16 } })
  }

  // ── Step 17: generate_excerpt ──────────────────────────────────────────────
  logger.info({ jobId }, '[approval] step 17 — generate_excerpt')
  await prisma.articleJob.update({ where: { id: jobId }, data: { currentStep: 17 } })

  const runner17 = new StepRunner(jobId, 17, ctx)
  const result17 = await runner17.execute()
  ctx.completedSteps.set(17, result17.output)
  const excerpt = truncateExcerpt(result17.output)

  await prisma.sitePage.update({
    where: { jobId },
    data: { excerpt },
  })

  // ── Step 18: generate_legal_disclaimer ────────────────────────────────────
  logger.info({ jobId }, '[approval] step 18 — generate_legal_disclaimer')
  await prisma.articleJob.update({ where: { id: jobId }, data: { currentStep: 18 } })

  const runner18 = new StepRunner(jobId, 18, ctx)
  const result18 = await runner18.execute()
  ctx.completedSteps.set(18, result18.output)
  const disclaimer = result18.output.trim()

  await prisma.sitePage.update({
    where: { jobId },
    data: { disclaimer },
  })

  // ── Aggregate costs & mark approved ───────────────────────────────────────
  const approvalSteps = await prisma.pipelineStep.findMany({
    where: { jobId, stepNumber: { in: [13, 15, 16, 17, 18] }, status: 'completed' },
    select: { cost: true, inputTokens: true, outputTokens: true },
  })

  const addedCost = approvalSteps.reduce((s, r) => s + (r.cost ?? 0), 0)
  const addedTokens = approvalSteps.reduce(
    (s, r) => s + (r.inputTokens ?? 0) + (r.outputTokens ?? 0),
    0,
  )

  await prisma.articleJob.update({
    where: { id: jobId },
    data: {
      status: 'approved',
      approvedAt: new Date(),
      currentStep: 18,  // highest completed Phase B step
      totalCost: { increment: addedCost },
      totalTokens: { increment: addedTokens },
    },
  })

  // ── Auto-enqueue Phase C enrichment ───────────────────────────────────────
  try {
    const boss = await getBoss()
    const enrichmentBossId = await boss.send(QUEUES.ARTICLE_ENRICHMENT, { jobId })
    if (enrichmentBossId) {
      await prisma.articleJob.update({
        where: { id: jobId },
        data: { enrichmentJobId: enrichmentBossId },
      })
    }
    logger.info({ jobId, enrichmentBossId }, '[approval] enrichment job enqueued')
  } catch (err) {
    logger.error({ jobId, err }, '[approval] failed to enqueue enrichment — job is still approved')
    Sentry.captureException(err, { tags: { phase: 'approval', step: 'enqueue-enrichment' } })
  }

  logger.info({ jobId }, '[approval] approval chain complete')
}
