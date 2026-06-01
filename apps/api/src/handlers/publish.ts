import PgBoss from 'pg-boss'
import { prisma } from '../lib/prisma'
import { dispatchPublish } from '../social/dispatcher'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PublishJobData {
  postIds: string[]
  userId: string
  platform: string
  content: string | string[]
  imageUrl?: string
  chatId?: string
}

export interface PublishScheduledJobData {
  /** Set by worker.ts when the scheduled cron fires — no payload needed for batch run. */
  _batch?: true
}

// ─── publishHandler ───────────────────────────────────────────────────────────

/**
 * Manual publish — enqueued by the Next.js proxy when a user clicks "Publish now".
 * Returns immediately; the job runs in the worker.
 */
export async function publishHandler(jobs: PgBoss.Job<PublishJobData>[]) {
  for (const job of jobs) {
    const { userId, platform, content, imageUrl, chatId } = job.data
    console.log(`[publish] job ${job.id} — ${platform} user ${userId}`)

    const result = await dispatchPublish(userId, platform, content, { imageUrl, chatId })

    if (!result.success) {
      console.error(`[publish] job ${job.id} failed:`, result.error)
    } else {
      console.log(`[publish] job ${job.id} succeeded — postUrl: ${result.postUrl}`)
    }
  }
}

// ─── publishScheduledHandler ──────────────────────────────────────────────────

/**
 * Batch cron handler that fires every minute.
 * Finds Post rows with status='scheduled' and scheduledAt <= now, then publishes them.
 * Posts with provider='ghl' are skipped — GHL Social Planner owns their schedule.
 */
export async function publishScheduledHandler(jobs: PgBoss.Job<PublishScheduledJobData>[]) {
  console.log(`[publish-scheduled] tick — ${jobs.length} job(s)`)

  const now = new Date()

  const scheduledPostsRaw = await prisma.post.findMany({
    where: {
      status: 'scheduled',
      scheduledAt: { lte: now },
      OR: [
        { provider: null },
        { provider: { not: 'ghl' } },
      ],
    },
    include: {
      user: { select: { id: true } },
      draft: { select: { id: true, attachedImage: true } },
    },
    orderBy: { scheduledAt: 'asc' },
  })

  const scheduledPosts = scheduledPostsRaw.sort((a, b) => {
    if (a.threadOrder === null && b.threadOrder === null) return 0
    if (a.threadOrder === null) return 1
    if (b.threadOrder === null) return -1
    const diff = a.threadOrder - b.threadOrder
    if (diff !== 0) return diff
    if (a.scheduledAt && b.scheduledAt) return a.scheduledAt.getTime() - b.scheduledAt.getTime()
    return 0
  })

  console.log(`[publish-scheduled] found ${scheduledPosts.length} post(s) due`)

  const published: string[] = []
  const failed: { id: string; error: string }[] = []

  for (const post of scheduledPosts) {
    try {
      if (post.provider === 'ghl') {
        continue
      }

      if (post.parentPostId) {
        const parentPublishedInBatch = published.includes(post.parentPostId)
        if (!parentPublishedInBatch) {
          const parent = await prisma.post.findUnique({
            where: { id: post.parentPostId },
            select: { status: true, tweetId: true },
          })
          if (!parent || parent.status !== 'published') {
            console.log(`[publish-scheduled] skipping reply ${post.id} — parent not published`)
            continue
          }
        }
      }

      const imageUrl = post.imageUrl || post.draft?.attachedImage || undefined
      const mediaUrls = post.mediaUrls?.length ? post.mediaUrls : undefined
      const videoUrl = post.videoUrl ?? undefined

      let replyToTweetId: string | undefined
      if (post.platform === 'twitter' && post.parentPostId) {
        const parent = await prisma.post.findUnique({
          where: { id: post.parentPostId },
          select: { tweetId: true },
        })
        replyToTweetId = parent?.tweetId ?? undefined
        if (replyToTweetId && !published.includes(post.parentPostId)) {
          await new Promise((r) => setTimeout(r, 3000))
        }
      }

      const attachImage =
        imageUrl && (post.threadOrder === null || post.threadOrder === 0) ? imageUrl : undefined

      let telegramChatId: string | undefined
      if (post.platform === 'telegram') {
        const settings = await prisma.settings.findUnique({ where: { userId: post.user.id } })
        telegramChatId = settings?.telegramChatId ?? undefined
      }

      const result = await dispatchPublish(
        post.user.id,
        post.platform,
        post.content,
        {
          imageUrl: attachImage,
          mediaUrls,
          videoUrl,
          chatId: telegramChatId,
          replyToTweetId,
          postAsStory: post.postAsStory,
          scheduledAt: post.scheduledAt ?? new Date(),
        },
      )

      if (result.success) {
        const shouldStoreImage = attachImage != null
        await prisma.post.update({
          where: { id: post.id },
          data: {
            status: 'published',
            publishedAt: new Date(),
            scheduledAt: null,
            postUrl: Array.isArray(result.postUrl) ? result.postUrl[0] : result.postUrl ?? null,
            tweetId: result.tweetId ?? null,
            imageUrl: shouldStoreImage ? attachImage : null,
            provider: result.provider ?? post.provider,
            ghlPostId: result.ghlPostId ?? post.ghlPostId,
          },
        })
        published.push(post.id)

        if (post.draftId && !post.parentPostId) {
          const allDraftSummaryPosts = await prisma.post.findMany({
            where: { draftId: post.draftId, parentPostId: null },
            select: { status: true, platform: true },
          })
          const allDone = allDraftSummaryPosts.every((p) => p.status === 'published')
          if (allDone) {
            await prisma.draft.update({
              where: { id: post.draftId },
              data: { status: 'published', publishedAt: new Date() },
            })
          }
        }
      } else {
        const isRateLimit = result.error?.toLowerCase().includes('rate limit')
        await prisma.post.update({
          where: { id: post.id },
          data: {
            status: isRateLimit ? 'scheduled' : 'failed',
            errorMsg: result.error ?? 'Unknown error',
          },
        })
        if (!isRateLimit) failed.push({ id: post.id, error: result.error ?? 'Unknown error' })
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[publish-scheduled] post ${post.id} threw:`, msg)
      await prisma.post.update({
        where: { id: post.id },
        data: { status: 'failed', errorMsg: msg },
      })
      failed.push({ id: post.id, error: msg })
    }
  }

  console.log(`[publish-scheduled] done — published: ${published.length}, failed: ${failed.length}`)
}
