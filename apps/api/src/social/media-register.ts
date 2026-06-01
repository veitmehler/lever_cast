import sharp from 'sharp'
import { uploadBufferWithKey } from '../lib/storage'
import { prisma } from '../lib/prisma'

export type SocialMediaSource = 'quote_card' | 'carousel_slide' | 'pitch_story'

export interface RegisteredMedia {
  mediaId: string
  url: string
  s3Key: string
  width: number
  height: number
}

/** Upload a PNG buffer to S3 and register a Media library row. */
export async function registerSocialMedia(opts: {
  userId: string
  buffer: Buffer
  s3Key: string
  title: string
  altText?: string
  source: SocialMediaSource
  jobId?: string
}): Promise<RegisteredMedia> {
  const meta = await sharp(opts.buffer).metadata()
  const width = meta.width ?? 1080
  const height = meta.height ?? 1080

  const { url } = await uploadBufferWithKey(opts.s3Key, opts.buffer, 'image/png')

  const media = await prisma.media.create({
    data: {
      userId: opts.userId,
      s3Key: opts.s3Key,
      url,
      altText: opts.altText ?? opts.title,
      mimeType: 'image/png',
      width,
      height,
      source: opts.source,
      title: opts.title,
      jobId: opts.jobId,
    },
  })

  return { mediaId: media.id, url, s3Key: opts.s3Key, width, height }
}
