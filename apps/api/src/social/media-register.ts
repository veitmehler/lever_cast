import sharp from 'sharp'
import { uploadBufferWithKey } from '../lib/storage'
import { prisma } from '../lib/prisma'

export type SocialMediaSource = 'quote_card' | 'carousel_slide' | 'pitch_story' | 'social_video'

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
  mimeType?: string
  width?: number
  height?: number
}): Promise<RegisteredMedia> {
  const meta = await sharp(opts.buffer).metadata()
  const width = opts.width ?? meta.width ?? 1080
  const height = opts.height ?? meta.height ?? 1080
  const mimeType = opts.mimeType ?? 'image/png'

  const { url } = await uploadBufferWithKey(opts.s3Key, opts.buffer, mimeType)

  const media = await prisma.media.create({
    data: {
      userId: opts.userId,
      s3Key: opts.s3Key,
      url,
      altText: opts.altText ?? opts.title,
      mimeType,
      width,
      height,
      source: opts.source,
      title: opts.title,
      jobId: opts.jobId,
    },
  })

  return { mediaId: media.id, url, s3Key: opts.s3Key, width, height }
}

/** Upload an MP4 video to S3 and register a Media library row. */
export async function registerSocialVideo(opts: {
  userId: string
  buffer: Buffer
  s3Key: string
  title: string
  width: number
  height: number
  jobId?: string
}): Promise<RegisteredMedia> {
  const { url } = await uploadBufferWithKey(opts.s3Key, opts.buffer, 'video/mp4')

  const media = await prisma.media.create({
    data: {
      userId: opts.userId,
      s3Key: opts.s3Key,
      url,
      altText: opts.title,
      mimeType: 'video/mp4',
      width: opts.width,
      height: opts.height,
      source: 'social_video',
      title: opts.title,
      jobId: opts.jobId,
    },
  })

  return { mediaId: media.id, url, s3Key: opts.s3Key, width: opts.width, height: opts.height }
}
