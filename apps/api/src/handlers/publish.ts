import PgBoss from 'pg-boss'
import { prisma } from '../lib/prisma'
import { postToLinkedIn } from '../lib/linkedinApi'
import { postToTwitter, postTwitterThread } from '../lib/twitterApi'
import { postToFacebook } from '../lib/facebookApi'
import { postToInstagram } from '../lib/instagramApi'
import { postToTelegram } from '../lib/telegramApi'
import { postToThreads } from '../lib/threadsApi'

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

// ─── Shared dispatch logic ────────────────────────────────────────────────────

type PublishOutcome =
  | { success: true; postUrl: string | string[]; tweetId?: string; tweetIds?: string[]; postId?: string }
  | { success: false; error: string }

async function dispatchToPlatform(
  userId: string,
  platform: string,
  content: string | string[],
  imageUrl?: string,
  chatId?: string,
  replyToTweetId?: string,
  threadImageForFirstTweetOnly?: boolean,
): Promise<PublishOutcome> {
  if (platform === 'linkedin') {
    const contentStr = Array.isArray(content) ? content[0] : content
    return postToLinkedIn(userId, contentStr, imageUrl)
  }

  if (platform === 'twitter') {
    if (Array.isArray(content)) {
      const result = await postTwitterThread(userId, content, imageUrl)
      if (result.success) return { success: true, postUrl: result.postUrls, tweetIds: result.tweetIds }
      return result
    }
    const result = await postToTwitter(
      userId,
      content,
      replyToTweetId,
      threadImageForFirstTweetOnly ? imageUrl : imageUrl,
    )
    if (result.success) return { success: true, postUrl: result.postUrl, tweetId: result.tweetId }
    return result
  }

  if (platform === 'facebook') {
    const contentStr = Array.isArray(content) ? content[0] : content
    return postToFacebook(userId, contentStr, imageUrl)
  }

  if (platform === 'instagram') {
    const contentStr = Array.isArray(content) ? content[0] : content
    if (!imageUrl) return { success: false, error: 'Instagram requires an image.' }
    return postToInstagram(userId, contentStr, imageUrl)
  }

  if (platform === 'telegram') {
    const contentStr = Array.isArray(content) ? content[0] : content
    if (!chatId) return { success: false, error: 'Telegram chat ID is required.' }
    const result = await postToTelegram(userId, contentStr, chatId, imageUrl)
    if (result.success) {
      return {
        success: true,
        postUrl: `https://t.me/${chatId.replace('@', '')}/${result.messageId}`,
        postId: String(result.messageId),
      }
    }
    return result
  }

  if (platform === 'threads') {
    const contentStr = Array.isArray(content) ? content[0] : content
    return postToThreads(userId, contentStr, imageUrl)
  }

  return { success: false, error: `Unsupported platform: ${platform}` }
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

    const result = await dispatchToPlatform(userId, platform, content, imageUrl, chatId)

    if (!result.success) {
      console.error(`[publish] job ${job.id} failed:`, result.error)
    } else {
      console.log(`[publish] job ${job.id} succeeded — postUrl: ${result.postUrl}`)
    }
  }
}

// ─── publishScheduledHandler ──────────────────────────────────────────────────

/**
 * Batch cron handler that fires every minute (same semantics as the Vercel cron it replaces).
 * Finds all Post rows with status='scheduled' and scheduledAt <= now, then publishes them.
 */
export async function publishScheduledHandler(jobs: PgBoss.Job<PublishScheduledJobData>[]) {
  console.log(`[publish-scheduled] tick — ${jobs.length} job(s)`)

  const now = new Date()

  const scheduledPostsRaw = await prisma.post.findMany({
    where: {
      status: 'scheduled',
      scheduledAt: { lte: now },
    },
    include: {
      user: { select: { id: true } },
      draft: { select: { id: true, attachedImage: true } },
    },
    orderBy: { scheduledAt: 'asc' },
  })

  // Sort so thread parent (threadOrder=0) always precedes replies
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
      // For thread replies, ensure parent is already published
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

      let replyToTweetId: string | undefined
      if (post.platform === 'twitter' && post.parentPostId) {
        const parent = await prisma.post.findUnique({
          where: { id: post.parentPostId },
          select: { tweetId: true },
        })
        replyToTweetId = parent?.tweetId ?? undefined
        if (replyToTweetId && !published.includes(post.parentPostId)) {
          // Add a small delay so Twitter has time to index the parent tweet
          await new Promise((r) => setTimeout(r, 3000))
        }
      }

      // Only attach image to the root post in a thread
      const attachImage =
        imageUrl && (post.threadOrder === null || post.threadOrder === 0) ? imageUrl : undefined

      let telegramChatId: string | undefined
      if (post.platform === 'telegram') {
        const settings = await prisma.settings.findUnique({ where: { userId: post.user.id } })
        telegramChatId = settings?.telegramChatId ?? undefined
      }

      const result = await dispatchToPlatform(
        post.user.id,
        post.platform,
        post.content,
        attachImage,
        telegramChatId,
        replyToTweetId,
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
          },
        })
        published.push(post.id)

        // Update parent draft to 'published' when all platforms are done
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
