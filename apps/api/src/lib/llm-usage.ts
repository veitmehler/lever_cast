/**
 * Minimal LLMUsage persistence for call sites outside the article pipeline's
 * StepRunner (which records its own). Closes the social-generation cost blind
 * spot (multi-tenancy plan Phase D1). Never throws — cost accounting must not
 * fail content generation.
 */
import { prisma } from '@omniply/shared'
import { logger } from './logger'
import type { LLMResponse } from '../article-pipeline/llm/adapter'

export async function recordLLMUsage(
  userId: string | null | undefined,
  source: string,
  res: LLMResponse,
): Promise<void> {
  if (!userId) return
  try {
    await prisma.lLMUsage.create({
      data: {
        userId,
        provider: res.provider,
        model: res.model,
        inputTokens: res.tokens.input,
        outputTokens: res.tokens.output,
        cost: res.cost,
        source,
      },
    })
  } catch (err) {
    logger.warn({ userId, source, err }, '[llm-usage] failed to record usage (non-fatal)')
  }
}
