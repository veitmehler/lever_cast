import PgBoss from 'pg-boss'
import { logger } from '../lib/logger'
import { prisma } from '@omniply/shared'
import {
  generateHookVideoAsset,
  generateQuoteVideoAsset,
  generateVideoReelAsset,
} from '../social/generate-video-assets'

export interface SocialVideoGenerateJobData {
  jobId: string
}

/**
 * Worker handler for one-off dashboard video generation. Loads the
 * VideoGenerationJob row, runs the matching asset builder (these take minutes),
 * and records the result/error on the row so the client poll can surface it.
 */
export async function socialVideoGenerateHandler(
  jobs: PgBoss.Job<SocialVideoGenerateJobData>[],
): Promise<void> {
  for (const job of jobs) {
    const { jobId } = job.data

    const row = await prisma.videoGenerationJob.findUnique({ where: { id: jobId } })
    if (!row) {
      logger.warn({ jobId, pgBossJobId: job.id }, '[social-video-generate] job row not found')
      continue
    }
    if (row.status === 'completed') {
      logger.info({ jobId }, '[social-video-generate] already completed, skipping')
      continue
    }

    await prisma.videoGenerationJob.update({
      where: { id: jobId },
      data: { status: 'processing', error: null },
    })

    try {
      logger.info({ jobId, postType: row.postType }, '[social-video-generate] starting')

      let result: { videoUrl: string; mediaId: string }
      if (row.postType === 'video_reel') {
        result = await generateVideoReelAsset({ userId: row.userId, content: row.content, jobId: row.id })
      } else if (row.postType === 'hook_video') {
        result = await generateHookVideoAsset({
          userId: row.userId,
          content: row.content,
          title: row.title ?? undefined,
          jobId: row.id,
        })
      } else if (row.postType === 'quote_video') {
        result = await generateQuoteVideoAsset({ userId: row.userId, content: row.content, jobId: row.id })
      } else {
        throw new Error(`Unknown video postType: ${row.postType}`)
      }

      await prisma.videoGenerationJob.update({
        where: { id: jobId },
        data: { status: 'completed', videoUrl: result.videoUrl, mediaId: result.mediaId },
      })
      logger.info({ jobId, videoUrl: result.videoUrl }, '[social-video-generate] completed')
    } catch (err) {
      logger.error({ jobId, err }, '[social-video-generate] failed')
      await prisma.videoGenerationJob.update({
        where: { id: jobId },
        data: { status: 'failed', error: err instanceof Error ? err.message : String(err) },
      })
    }
  }
}
