/**
 * Downloads a remote image URL, uploads it to S3 under a deterministic article key,
 * and creates a Media row.  Returns the new Media.id.
 */

import sharp from 'sharp'
import { uploadBufferWithKey } from '../lib/storage'
import { prisma } from '../lib/prisma'
import { logger } from '../lib/logger'

const MAX_RETRIES = 3
const RETRY_DELAY_MS = 3_000

/** Download a URL and return a Buffer. */
async function downloadRemoteImage(url: string): Promise<{ buffer: Buffer; contentType: string }> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download image from ${url}: ${response.status} ${response.statusText}`)
  }
  const contentType = response.headers.get('content-type') ?? 'image/jpeg'
  const arrayBuffer = await response.arrayBuffer()
  return { buffer: Buffer.from(arrayBuffer), contentType }
}

function extFromContentType(ct: string): string {
  if (ct.includes('png')) return 'png'
  if (ct.includes('webp')) return 'webp'
  if (ct.includes('gif')) return 'gif'
  return 'jpg'
}

interface UploadResult {
  mediaId: string
  cdnUrl: string
  s3Key: string
}

/**
 * Upload the featured image for an article job to S3 and persist a Media row.
 */
export async function uploadFeaturedImageToS3WithRetry(
  remoteUrl: string,
  userId: string,
  jobId: string,
  altText?: string,
): Promise<UploadResult> {
  let lastErr: unknown

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const { buffer, contentType } = await downloadRemoteImage(remoteUrl)
      const ext = extFromContentType(contentType)
      const s3Key = `articles/${userId}/${jobId}/featured.${ext}`

      const { url: cdnUrl } = await uploadBufferWithKey(s3Key, buffer, contentType)

      // Extract pixel dimensions before upload so schema markup can reference them
      let width: number | null = null
      let height: number | null = null
      try {
        const meta = await sharp(buffer).metadata()
        width  = meta.width  ?? null
        height = meta.height ?? null
      } catch {
        // Non-fatal — schema will just omit width/height
      }

      const media = await prisma.media.create({
        data: {
          userId,
          s3Key,
          url: cdnUrl,
          altText: altText ?? 'Featured Image',
          mimeType: contentType,
          width,
          height,
          source: 'ai_featured',
          jobId,
          title: altText ?? 'Featured Image',
        },
      })

      logger.info({ jobId, mediaId: media.id, s3Key }, '[image-uploader] featured image uploaded')
      return { mediaId: media.id, cdnUrl, s3Key }
    } catch (err) {
      lastErr = err
      logger.warn({ jobId, attempt, err }, '[image-uploader] upload attempt failed')
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt))
      }
    }
  }

  throw lastErr
}
