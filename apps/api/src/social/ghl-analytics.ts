import type { Post } from '@prisma/client'
import { Prisma } from '@prisma/client'
import { getGhlPost } from '../lib/ghl/client'
import { getGhlCredentials } from '../lib/ghl/settings'
import { prisma } from '@socioply/shared'

function extractGhlPostPayload(data: Record<string, unknown>): Record<string, unknown> {
  const results = data.results as Record<string, unknown> | undefined
  const post = (results?.post ?? data.post ?? data) as Record<string, unknown>
  return post ?? {}
}

function mapGhlAnalytics(post: Record<string, unknown>): Prisma.InputJsonValue {
  const analytics = post.analytics ?? post.insights ?? post.metrics
  return {
    source: 'ghl',
    status: post.status,
    postUrl: post.postUrl ?? post.url ?? post.postId,
    platformPostId: post.postId,
    syncedAt: new Date().toISOString(),
    raw: analytics ?? post,
  } as Prisma.InputJsonValue
}

function isPublishedStatus(status: unknown): boolean {
  if (typeof status !== 'string') return false
  const s = status.toLowerCase()
  return s === 'published' || s === 'posted' || s === 'live' || s === 'success'
}

/** Read GHL post status + analytics and update our Post row. */
export async function syncGhlPostFromApi(post: Post): Promise<boolean> {
  if (post.provider !== 'ghl' || !post.ghlPostId) return false

  const creds = await getGhlCredentials(post.userId)
  if (!creds) return false

  const data = await getGhlPost(creds.apiKey, creds.locationId, post.ghlPostId)
  const ghlPost = extractGhlPostPayload(data as Record<string, unknown>)

  const updates: Prisma.PostUpdateInput = {
    analyticsData: mapGhlAnalytics(ghlPost),
    analyticsLastSyncedAt: new Date(),
  }

  if (isPublishedStatus(ghlPost.status) && post.status === 'scheduled') {
    updates.status = 'published'
    updates.publishedAt = new Date()
    const postUrl = ghlPost.postUrl ?? ghlPost.url ?? ghlPost.postId
    if (typeof postUrl === 'string') updates.postUrl = postUrl
  }

  await prisma.post.update({ where: { id: post.id }, data: updates })
  return true
}
