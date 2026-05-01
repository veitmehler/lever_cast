import { prisma } from '../lib/prisma'
import { logger } from '../lib/logger'
import { getLLMAdapter } from './llm/factory'
import { LLMError } from './llm/adapter'
import { cleanTextOutput, cleanAndParseJSON } from './output-cleaner'
import { resolveVariables } from './variable-resolver'
import type { PipelineContext } from './variable-resolver'

// Steps whose output is parsed as JSON
const JSON_STEPS = new Set([2, 12, 13])

// Set VERBOSE_LLM_LOGS=true in the environment to log full prompts + responses.
// Set VERBOSE_LLM_LOGS_TRUNCATE=0 to disable truncation (logs full text).
const VERBOSE = process.env.VERBOSE_LLM_LOGS === 'true'
const TRUNCATE = parseInt(process.env.VERBOSE_LLM_LOGS_TRUNCATE ?? '3000', 10)

function truncate(s: string, n: number): string {
  if (n <= 0) return s
  return s.length > n ? s.slice(0, n) + `… [+${s.length - n} chars]` : s
}

// Steps that use Gemini generative search
const SEARCH_STEPS = new Set([6, 7, 8, 10, 12])

const MAX_RETRIES = 3
const BASE_RETRY_DELAY_MS = 1000
const BACKOFF_MULTIPLIER = 2

export interface StepRunResult {
  output: string
  parsedOutput?: unknown
  inputTokens: number
  outputTokens: number
  cost: number
  durationMs: number
  provider: string
  model: string
}

export class StepRunner {
  constructor(
    private jobId: string,
    private stepNumber: number,
    private ctx: PipelineContext,
  ) {}

  async execute(): Promise<StepRunResult> {
    const template = await prisma.promptTemplate.findFirst({
      where: { stepNumber: this.stepNumber, isActive: true },
    })

    if (!template) {
      throw new Error(`No active prompt template found for step ${this.stepNumber}`)
    }

    // Resolve variables in both prompts
    const [systemPrompt, userPrompt] = await Promise.all([
      template.systemPrompt ? resolveVariables(template.systemPrompt, this.ctx) : Promise.resolve(null),
      resolveVariables(template.userPrompt, this.ctx),
    ])

    const provider = template.defaultProvider
    const model = template.defaultModel
    const useSearch = SEARCH_STEPS.has(this.stepNumber)
    const isJsonStep = JSON_STEPS.has(this.stepNumber)

    // Create/update the PipelineStep row to 'running'
    await prisma.pipelineStep.upsert({
      where: { jobId_stepNumber: { jobId: this.jobId, stepNumber: this.stepNumber } },
      create: {
        jobId: this.jobId,
        stepNumber: this.stepNumber,
        stepName: template.stepName,
        status: 'running',
        provider,
        model,
        startedAt: new Date(),
      },
      update: {
        status: 'running',
        startedAt: new Date(),
        errorMessage: null,
        retryCount: { increment: 0 },
      },
    })

    let lastError: LLMError | Error | null = null
    let attempt = 0
    const startTime = Date.now()

    while (attempt < MAX_RETRIES) {
      attempt++
      try {
        const adapter = getLLMAdapter(provider)

        if (VERBOSE) {
          logger.info(
            {
              jobId: this.jobId,
              step: this.stepNumber,
              provider,
              model,
              systemPrompt: systemPrompt ? truncate(systemPrompt, TRUNCATE) : null,
              userPrompt: truncate(userPrompt, TRUNCATE),
            },
            '[llm-verbose] PROMPT',
          )
        }

        const llmResponse = await adapter.call({
          systemPrompt,
          userPrompt,
          model,
          useGenerativeSearch: useSearch,
        })

        if (VERBOSE) {
          logger.info(
            {
              jobId: this.jobId,
              step: this.stepNumber,
              provider,
              model,
              inputTokens: llmResponse.tokens.input,
              outputTokens: llmResponse.tokens.output,
              cost: llmResponse.cost,
              response: truncate(llmResponse.content, TRUNCATE),
            },
            '[llm-verbose] RESPONSE',
          )
        }

        const rawOutput = llmResponse.content
        let finalOutput: string
        let parsedOutput: unknown | undefined

        if (isJsonStep) {
          try {
            const { data, log } = cleanAndParseJSON(rawOutput)
            parsedOutput = data
            finalOutput = JSON.stringify(data)
            if (log.fixes.length) {
              logger.info(
                { jobId: this.jobId, step: this.stepNumber, fixes: log.fixes },
                '[step-runner] JSON fixes applied',
              )
            }
          } catch (parseErr) {
            // Store raw output anyway and log the failure
            logger.warn(
              { jobId: this.jobId, step: this.stepNumber, parseErr },
              '[step-runner] JSON parse failed; storing raw output',
            )
            finalOutput = rawOutput
          }
        } else {
          finalOutput = cleanTextOutput(rawOutput)
        }

        const durationMs = Date.now() - startTime

        // Persist step result
        await prisma.pipelineStep.update({
          where: { jobId_stepNumber: { jobId: this.jobId, stepNumber: this.stepNumber } },
          data: {
            status: 'completed',
            output: finalOutput,
            inputTokens: llmResponse.tokens.input,
            outputTokens: llmResponse.tokens.output,
            totalTokens: llmResponse.tokens.total,
            cost: llmResponse.cost,
            duration: durationMs,
            retryCount: attempt - 1,
            completedAt: new Date(),
          },
        })

        // Write LLMUsage row
        await prisma.lLMUsage.create({
          data: {
            userId: this.ctx.userId,
            jobId: this.jobId,
            source: `pipeline_step_${this.stepNumber}`,
            provider,
            model,
            inputTokens: llmResponse.tokens.input,
            outputTokens: llmResponse.tokens.output,
            cost: llmResponse.cost,
          },
        })

        return {
          output: finalOutput,
          parsedOutput,
          inputTokens: llmResponse.tokens.input,
          outputTokens: llmResponse.tokens.output,
          cost: llmResponse.cost,
          durationMs,
          provider,
          model,
        }
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))
        const llmErr = err instanceof LLMError ? err : null

        logger.warn(
          {
            jobId: this.jobId,
            step: this.stepNumber,
            attempt,
            quotaType: llmErr?.quotaType,
            err: lastError.message,
          },
          '[step-runner] LLM call failed',
        )

        // Daily quota → fail immediately, no retry
        if (llmErr?.quotaType === 'daily') break

        if (attempt < MAX_RETRIES) {
          const sleepMs = llmErr?.retryAfterSeconds
            ? llmErr.retryAfterSeconds * 1000
            : BASE_RETRY_DELAY_MS * Math.pow(BACKOFF_MULTIPLIER, attempt - 1)
          logger.info({ jobId: this.jobId, step: this.stepNumber, sleepMs }, '[step-runner] retrying after delay')
          await sleep(sleepMs)
        }
      }
    }

    // All retries exhausted — record failure
    const durationMs = Date.now() - startTime
    const errorMessage = lastError?.message ?? 'Unknown error'
    const quotaType =
      lastError instanceof LLMError ? (lastError.quotaType ?? 'unknown') : 'unknown'

    await prisma.pipelineStep.update({
      where: { jobId_stepNumber: { jobId: this.jobId, stepNumber: this.stepNumber } },
      data: {
        status: 'failed',
        errorMessage,
        retryCount: attempt - 1,
        duration: durationMs,
        completedAt: new Date(),
      },
    })

    await prisma.errorLog.create({
      data: {
        userId: this.ctx.userId,
        jobId: this.jobId,
        errorType: quotaType === 'daily' ? 'quota_exhausted' : quotaType === 'rate_limit' ? 'rate_limit' : 'api_error',
        errorMessage,
        stackTrace: lastError instanceof Error ? lastError.stack : undefined,
      },
    })

    throw lastError ?? new Error(`Step ${this.stepNumber} failed after ${attempt} attempts`)
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
