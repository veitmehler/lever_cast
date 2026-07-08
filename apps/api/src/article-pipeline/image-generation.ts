/**
 * Fal.ai image generation for the article pipeline.
 * Uses system-owned API keys (not per-user keys).
 * Implements retry with exponential back-off.
 */

import { fal } from '@fal-ai/client'
import { getSystemApiKey } from '../lib/system-keys'
import { logger } from '../lib/logger'
import { loadPromptTemplate } from './enrichment/prompt-template'
import { withTimeout } from '../lib/net/with-timeout'
import { isRetryableNetworkError } from '../lib/net/retry'
import { instrumentCall } from '../lib/net/instrument'

const DEFAULT_FAL_MODEL = 'fal-ai/flux-pro'
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 5_000
/** Bound each attempt — without this, a hung call never reaches the retry loop below. */
const FAL_IMAGE_TIMEOUT_MS = 3 * 60 * 1000

/** Read the configured Fal.ai model from the DB (step 150), falling back to the default. */
async function resolveImageModel(): Promise<string> {
  try {
    const t = await loadPromptTemplate(150)
    if (t?.defaultModel && t.defaultModel.startsWith('fal-ai/')) return t.defaultModel
  } catch {
    // non-fatal — use default
  }
  return DEFAULT_FAL_MODEL
}

interface FalResult {
  data?: { images?: Array<{ url: string } | string>; image?: { url: string } | string; url?: string }
  images?: Array<{ url: string } | string>
  image?: { url: string } | string
  url?: string
}

function extractImageUrl(result: FalResult): string | null {
  const d = (result.data ?? result) as FalResult
  if (d.images && Array.isArray(d.images) && d.images.length > 0) {
    const first = d.images[0]
    return typeof first === 'string' ? first : (first?.url ?? null)
  }
  if (d.image) {
    return typeof d.image === 'string' ? d.image : (d.image?.url ?? null)
  }
  if (d.url) return d.url
  return null
}

/** Generate a featured image with Fal.ai and return the remote image URL. */
export async function generateFeaturedImage(
  imagePrompt: string,
  jobId: string,
): Promise<string> {
  const apiKey = await getSystemApiKey('fal-ai')
  if (!apiKey) throw new Error('No Fal.ai system API key configured')

  const falModel = await resolveImageModel()

  // Truncate prompt to avoid API limits
  const prompt = imagePrompt.slice(0, 2_000)

  let lastErr: unknown
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      fal.config({ credentials: apiKey })

      const result = await instrumentCall({ provider: 'fal-ai', op: `image:${falModel}` }, () =>
        withTimeout(
          (signal) =>
            fal.subscribe(falModel, {
              input: {
                prompt,
                image_size: 'landscape_16_9',
                num_inference_steps: 28,
                guidance_scale: 3.5,
              },
              pollInterval: 3_000,
              logs: false,
              abortSignal: signal,
            }),
          FAL_IMAGE_TIMEOUT_MS,
          `fal-image:${falModel}`,
        ),
      )

      const imageUrl = extractImageUrl(result as FalResult)
      if (!imageUrl) throw new Error('Fal.ai returned no image URL in response')

      logger.info({ jobId, attempt, model: falModel }, '[image-gen] featured image generated')
      return imageUrl
    } catch (err) {
      lastErr = err
      logger.warn({ jobId, attempt, err }, '[image-gen] fal.ai attempt failed')
      // Auth/balance/validation failures (e.g. the 2026-07-08 Fal 403 "Exhausted
      // balance" incident) won't be fixed by retrying — fail fast instead of
      // burning the full retry budget on an error retries cannot resolve.
      if (!isRetryableNetworkError(err)) throw err
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt))
      }
    }
  }

  throw lastErr
}
