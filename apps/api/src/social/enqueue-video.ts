import { prisma } from '@omniply/shared'
import { getBoss, QUEUES } from '../queues/index'

export type VideoPostType = 'video_reel' | 'hook_video' | 'quote_video'

export interface EnqueueVideoOpts {
  userId: string
  postType: VideoPostType
  content: string
  title?: string
}

/**
 * Create a VideoGenerationJob row and enqueue it for the worker. Video assets
 * take several minutes to build (carousel + Seedance + FFmpeg + uploads) — far
 * longer than a serverless/proxy HTTP request stays open — so generation must
 * run on the worker and the client polls the row for the result.
 *
 * `retryLimit: 0` because a re-run would re-pay for Fal/ElevenLabs; a failed
 * job surfaces its error to the user instead of silently retrying.
 */
export async function enqueueVideoGeneration(
  opts: EnqueueVideoOpts,
): Promise<{ jobId: string }> {
  const row = await prisma.videoGenerationJob.create({
    data: {
      userId: opts.userId,
      postType: opts.postType,
      content: opts.content,
      title: opts.title ?? null,
      status: 'pending',
    },
  })

  const boss = await getBoss()
  await boss.send(
    QUEUES.SOCIAL_VIDEO_GENERATE,
    { jobId: row.id },
    {
      singletonKey: `social-video-generate-${row.id}`,
      retryLimit: 0,
      expireInSeconds: 60 * 30,
    },
  )

  return { jobId: row.id }
}
