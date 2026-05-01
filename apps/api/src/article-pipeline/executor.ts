import { prisma } from '../lib/prisma'
import { logger } from '../lib/logger'
import { StepRunner } from './step-runner'
import { DuplicateKeywordError, validatePrimaryKeywordUniqueness } from './keyword-validator'
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
        ctx.completedSteps.set(stepNumber, result.output)
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
    ctx.completedSteps.set(stepNumber, result.output)
    if (result.parsedOutput !== undefined) {
      ctx.parsedSteps.set(stepNumber, result.parsedOutput)
    }

    const parsed = result.parsedOutput as Record<string, unknown> | undefined

    // Handle multiple JSON shapes Gemini and other LLMs return for the primary keyword:
    // 1. { primary_keyword: "..." }          (ideal)
    // 2. { primaryKeyword: "..." }
    // 3. { "Primary Keyword": "..." }
    // 4. { keywords: [{ type: "Primary Keyword", keyword: "..." }, ...] }
    // 5. { keywords: [{ keyword: "...", type: "primary" }, ...] }
    let primaryKeyword: string | undefined =
      (parsed?.['Primary Keyword'] ?? parsed?.primaryKeyword ?? parsed?.primary_keyword) as string | undefined

    if (!primaryKeyword && Array.isArray(parsed?.keywords)) {
      const kwArray = parsed!.keywords as Array<Record<string, string>>
      const pkEntry = kwArray.find(
        (k) =>
          k.type?.toLowerCase().includes('primary') ||
          k.keyword_type?.toLowerCase().includes('primary') ||
          k.category?.toLowerCase().includes('primary'),
      )
      primaryKeyword = pkEntry?.keyword ?? pkEntry?.value ?? kwArray[0]?.keyword
    }

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
