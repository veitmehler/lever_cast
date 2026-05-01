/**
 * Fal.ai image generation for the article pipeline.
 * Uses system-owned API keys (not per-user keys).
 * Implements retry with exponential back-off.
 */

import { fal } from '@fal-ai/client'
import { getSystemApiKey } from '../lib/system-keys'
import { logger } from '../lib/logger'

const FAL_MODEL = 'fal-ai/flux-pro'
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 5_000

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

/** Generate a featured image with Fal.ai flux-pro and return the remote image URL. */
export async function generateFeaturedImage(
  imagePrompt: string,
  jobId: string,
): Promise<string> {
  const apiKey = await getSystemApiKey('fal-ai')
  if (!apiKey) throw new Error('No Fal.ai system API key configured')

  // Truncate prompt to avoid API limits
  const prompt = imagePrompt.slice(0, 2_000)

  let lastErr: unknown
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      fal.config({ credentials: apiKey })

      const result = await fal.subscribe(FAL_MODEL, {
        input: {
          prompt,
          image_size: 'square_hd',
          num_inference_steps: 28,
          guidance_scale: 3.5,
        },
        pollInterval: 3_000,
        logs: false,
      })

      const imageUrl = extractImageUrl(result as FalResult)
      if (!imageUrl) throw new Error('Fal.ai returned no image URL in response')

      logger.info({ jobId, attempt, model: FAL_MODEL }, '[image-gen] featured image generated')
      return imageUrl
    } catch (err) {
      lastErr = err
      logger.warn({ jobId, attempt, err }, '[image-gen] fal.ai attempt failed')
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt))
      }
    }
  }

  throw lastErr
}
