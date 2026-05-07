import { prisma } from '../lib/prisma'
import { logger } from '../lib/logger'
import { StepRunner } from './step-runner'
import { DuplicateKeywordError, validatePrimaryKeywordUniqueness } from './keyword-validator'
import { assignOutlineFramework } from './outline-assignment'
import { sanitizeKeywordJson, sanitizeKeywordText } from './keyword-sanitizer'
import type { PipelineContext } from './variable-resolver'

const PHASE_A_STEPS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
const MAX_KEYWORD_RETRIES = 3

/** Executes Phase A (Steps 1–12) for a given ArticleJob. */
export async function runPipelinePhaseA(jobId: string): Promise<void> {
  // Load job + topic
  const job = await prisma.articleJob.findUniqueOrThrow({
    where: { id: jobId },
    include: { topic: true },
  })

  const userId = job.userId
  const topicId = job.topicId

  // Build initial context
  const ctx: PipelineContext = {
    jobId,
    userId,
    topicId,
    topicText: job.topic.topic,
    topicSlug: job.topic.slug,
    completedSteps: new Map(),
    parsedSteps: new Map(),
  }

  // Pre-load any already-completed steps (for resume support)
  const existingSteps = await prisma.pipelineStep.findMany({
    where: { jobId, status: 'completed' },
    orderBy: { stepNumber: 'asc' },
  })
  for (const step of existingSteps) {
    ctx.completedSteps.set(step.stepNumber, step.output ?? '')
    if ([2, 12, 13].includes(step.stepNumber) && step.output) {
      try {
        ctx.parsedSteps.set(step.stepNumber, JSON.parse(step.output))
      } catch { /* ignore */ }
    }
  }

  // Mark job as in_progress
  await prisma.articleJob.update({
    where: { id: jobId },
    data: { status: 'in_progress', startedAt: new Date() },
  })

  // Pre-flight: ensure the topic has an outline framework assigned.
  // Runs here (in the worker) instead of in POST /api/topics so the HTTP
  // response is fast and not subject to Vercel's serverless function timeout.
  // Idempotent — does nothing if a framework is already set.
  try {
    await assignOutlineFramework(topicId)
  } catch (err) {
    // assignOutlineFramework already falls back to framework #1 internally;
    // any unexpected failure here is logged and we continue with whatever the topic has.
    logger.warn({ jobId, topicId, err }, '[executor] outline auto-assignment failed — continuing')
  }

  for (const stepNumber of PHASE_A_STEPS) {
    // Skip already-completed steps (resume support)
    if (ctx.completedSteps.has(stepNumber)) {
      logger.info({ jobId, stepNumber }, '[executor] skipping already-completed step')
      continue
    }

    logger.info({ jobId, stepNumber }, '[executor] running step')

    try {
      await prisma.articleJob.update({
        where: { id: jobId },
        data: { currentStep: stepNumber },
      })

      if (stepNumber === 2) {
        await executeStep2WithValidation(jobId, stepNumber, ctx)
      } else {
        const result = await new StepRunner(jobId, stepNumber, ctx).execute()

        // Strip local-intent keyword modifiers ("near me" etc.) from plain-text keyword steps
        let stepOutput = result.output
        if (stepNumber === 3 || stepNumber === 6) {
          stepOutput = sanitizeKeywordText(stepOutput, stepNumber, jobId)
        }

        ctx.completedSteps.set(stepNumber, stepOutput)
        if (result.parsedOutput !== undefined) {
          ctx.parsedSteps.set(stepNumber, result.parsedOutput)
        }
      }
    } catch (err) {
      logger.error({ jobId, stepNumber, err }, '[executor] step failed — aborting pipeline')
      await prisma.articleJob.update({
        where: { id: jobId },
        data: { status: 'failed' },
      })
      await updateJobMetrics(jobId)
      throw err
    }

    // Update metrics after each step
    await updateJobMetrics(jobId)
  }

  // All steps complete
  await prisma.articleJob.update({
    where: { id: jobId },
    data: { status: 'completed', currentStep: 12 },
  })
  logger.info({ jobId }, '[executor] Phase A complete — job status set to completed')
}

/**
 * Robustly extract the primary keyword string from whatever JSON shape an LLM returns.
 * Handles all observed Gemini / OpenAI response variants:
 *   { primary_keyword: "string" }
 *   { primary_keyword: { keyword: "string", ... } }
 *   { keyword_research: { primary_keyword: { keyword: "string" } } }
 *   { keywords: [{ type: "Primary Keyword", keyword: "string" }, ...] }
 */
function extractPrimaryKeyword(parsed: Record<string, unknown> | undefined): string | undefined {
  if (!parsed) return undefined

  // Helper to unwrap a leaf that may be a plain string or an object with a keyword/value/term field
  function unwrap(v: unknown): string | undefined {
    if (typeof v === 'string' && v.trim()) return v.trim()
    if (v && typeof v === 'object') {
      const o = v as Record<string, unknown>
      const leaf = o.keyword ?? o.value ?? o.term ?? o.phrase
      if (typeof leaf === 'string' && leaf.trim()) return leaf.trim()
    }
    return undefined
  }

  // 1. Top-level primary_keyword / primaryKeyword / "Primary Keyword"
  const direct =
    unwrap(parsed.primary_keyword) ??
    unwrap(parsed.primaryKeyword) ??
    unwrap(parsed['Primary Keyword'])
  if (direct) return direct

  // 2. Wrapped inside a keyword_research object: { keyword_research: { primary_keyword: ... } }
  if (parsed.keyword_research && typeof parsed.keyword_research === 'object') {
    const kr = extractPrimaryKeyword(parsed.keyword_research as Record<string, unknown>)
    if (kr) return kr
  }

  // 3. keywords array: [{ type: "Primary Keyword", keyword: "..." }]
  if (Array.isArray(parsed.keywords)) {
    const kwArray = parsed.keywords as Array<Record<string, unknown>>
    const pkEntry = kwArray.find((k) => {
      const t = String(k.type ?? k.keyword_type ?? k.category ?? '').toLowerCase()
      return t.includes('primary')
    })
    const candidate = pkEntry ?? kwArray[0]
    if (candidate) {
      const kw = unwrap(candidate.keyword ?? candidate.value ?? candidate.term ?? candidate)
      if (kw) return kw
    }
  }

  return undefined
}

/** Special handling for Step 2: retry up to 3 times if the primary keyword is not unique. */
async function executeStep2WithValidation(
  jobId: string,
  stepNumber: number,
  ctx: PipelineContext,
): Promise<void> {
  for (let attempt = 1; attempt <= MAX_KEYWORD_RETRIES; attempt++) {
    // Delete any failed or previous attempt for this step
    await prisma.pipelineStep.deleteMany({
      where: { jobId, stepNumber, status: { not: 'completed' } },
    })

    const result = await new StepRunner(jobId, stepNumber, ctx).execute()

    // Sanitize local-intent modifiers ("near me" etc.) from all keyword values
    const rawParsed = result.parsedOutput as Record<string, unknown> | undefined
    const sanitizedParsed = rawParsed ? sanitizeKeywordJson(rawParsed, jobId) : undefined
    ctx.completedSteps.set(stepNumber, sanitizedParsed ? JSON.stringify(sanitizedParsed) : result.output)
    if (sanitizedParsed !== undefined) {
      ctx.parsedSteps.set(stepNumber, sanitizedParsed)
    }

    const parsed = sanitizedParsed
    const primaryKeyword = extractPrimaryKeyword(parsed)

    if (!primaryKeyword) {
      logger.warn({ jobId, attempt }, '[executor] step 2 produced no primary keyword — retrying')
      await prisma.pipelineStep.deleteMany({ where: { jobId, stepNumber } })
      ctx.completedSteps.delete(stepNumber)
      ctx.parsedSteps.delete(stepNumber)
      continue
    }

    const validation = await validatePrimaryKeywordUniqueness(primaryKeyword, ctx.userId, jobId)
    if (validation.isUnique) {
      // Upsert a partial SitePage so future jobs' Step 2 can see this keyword
      await prisma.sitePage.upsert({
        where: { jobId },
        create: {
          jobId,
          userId: ctx.userId,
          slug: `pending-${jobId.slice(0, 8)}`,
          title: ctx.topicText,
          primaryKeyword: primaryKeyword.toLowerCase().trim(),
        },
        update: { primaryKeyword: primaryKeyword.toLowerCase().trim() },
      })

      // Invalidate the excluded keywords cache so subsequent steps see the new keyword
      ctx.excludedKeywordsCache = undefined
      return
    }

    // Duplicate keyword — add to topic's exclusion list and retry
    logger.info(
      { jobId, attempt, primaryKeyword, conflict: validation.conflict },
      '[executor] primary keyword duplicate — adding to excluded list and retrying',
    )
    await prisma.topic.update({
      where: { id: ctx.topicId },
      data: { excludedKeywords: { push: primaryKeyword } },
    })
    ctx.excludedKeywordsCache = undefined

    // Delete the step so the runner creates a fresh one next iteration
    await prisma.pipelineStep.deleteMany({ where: { jobId, stepNumber } })
    ctx.completedSteps.delete(stepNumber)
    ctx.parsedSteps.delete(stepNumber)
  }

  throw new DuplicateKeywordError('(exhausted)')
}

/** Sum step costs/tokens and write to ArticleJob. */
async function updateJobMetrics(jobId: string): Promise<void> {
  const steps = await prisma.pipelineStep.findMany({
    where: { jobId, status: 'completed' },
    select: { cost: true, totalTokens: true },
  })
  const totalCost = steps.reduce((s, r) => s + (r.cost ?? 0), 0)
  const totalTokens = steps.reduce((s, r) => s + (r.totalTokens ?? 0), 0)
  await prisma.articleJob.update({
    where: { id: jobId },
    data: { totalCost, totalTokens },
  })
}
