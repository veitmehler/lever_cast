import { describe, it, expect, vi, beforeEach } from 'vitest'
import type PgBoss from 'pg-boss'

// ─── Mocks ──────────────────────────────────────────────────────────────────
// dispatchPublish is the outward boundary (actually posts to a platform / GHL).
const dispatchPublish = vi.fn()
vi.mock('../../social/dispatcher', () => ({
  dispatchPublish: (...a: unknown[]) => dispatchPublish(...a),
}))

// Quiet, no-op logger so tests don't spew pino output.
vi.mock('../../lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), debug: vi.fn(), warn: vi.fn() },
}))

// Prisma — only the calls the handlers make.
const postFindMany = vi.fn()
const postFindUnique = vi.fn()
const postUpdate = vi.fn()
const draftUpdate = vi.fn()
const settingsFindUnique = vi.fn()
const accountFindUnique = vi.fn()
const accountIdForUserMock = vi.fn()
vi.mock('@socioply/shared', () => ({
  prisma: {
    post: {
      findMany: (...a: unknown[]) => postFindMany(...a),
      findUnique: (...a: unknown[]) => postFindUnique(...a),
      update: (...a: unknown[]) => postUpdate(...a),
    },
    draft: {
      update: (...a: unknown[]) => draftUpdate(...a),
    },
    settings: { findUnique: (...a: unknown[]) => settingsFindUnique(...a) },
    account: { findUnique: (...a: unknown[]) => accountFindUnique(...a) },
  },
  accountIdForUser: (...a: unknown[]) => accountIdForUserMock(...a),
}))

import { publishHandler, publishScheduledHandler } from '../publish'

// ─── Helpers ────────────────────────────────────────────────────────────────
type Post = Record<string, unknown>

function makePost(over: Partial<Post> = {}): Post {
  return {
    id: 'post_1',
    platform: 'linkedin',
    content: 'hello',
    status: 'scheduled',
    scheduledAt: new Date('2026-06-14T00:00:00Z'),
    provider: null,
    imageUrl: null,
    mediaUrls: [],
    videoUrl: null,
    threadOrder: null,
    parentPostId: null,
    tweetId: null,
    postAsStory: false,
    automationRunId: null,
    slotKey: null,
    draftId: null,
    ghlPostId: null,
    user: { id: 'user_A' },
    draft: null,
    ...over,
  }
}

const OK = { success: true as const, postUrl: 'https://x/p/1', provider: 'direct' as const }

beforeEach(() => {
  vi.clearAllMocks()
  dispatchPublish.mockResolvedValue(OK)
  postUpdate.mockResolvedValue({})
  draftUpdate.mockResolvedValue({})
  // Lifecycle publishing gate defaults: user has no account → gate allows.
  accountIdForUserMock.mockResolvedValue(null)
  accountFindUnique.mockResolvedValue(null)
})

function job<T>(data: T): PgBoss.Job<T> {
  return { id: 'job_1', name: 'q', data } as PgBoss.Job<T>
}

// ─── publishHandler (manual "publish now") ────────────────────────────────────
describe('publishHandler', () => {
  it('dispatches each job to its platform with image + chat context', async () => {
    await publishHandler([
      job({
        userId: 'user_A',
        platform: 'telegram',
        content: 'hi',
        imageUrl: 'https://cdn/i.png',
        chatId: '@chan',
        postIds: ['post_9'],
      }),
    ])

    expect(dispatchPublish).toHaveBeenCalledTimes(1)
    const [userId, platform, content, opts] = dispatchPublish.mock.calls[0]
    expect(userId).toBe('user_A')
    expect(platform).toBe('telegram')
    expect(content).toBe('hi')
    expect(opts).toMatchObject({ imageUrl: 'https://cdn/i.png', chatId: '@chan' })
  })

  it('does not throw when dispatch reports failure (only logs)', async () => {
    dispatchPublish.mockResolvedValue({ success: false, error: 'boom' })
    await expect(
      publishHandler([job({ userId: 'u', platform: 'linkedin', content: 'x', postIds: ['p'] })]),
    ).resolves.toBeUndefined()
  })
})

// ─── publishScheduledHandler (cron batch) ─────────────────────────────────────
describe('publishScheduledHandler — query scoping', () => {
  it('queries only due, scheduled, non-GHL posts', async () => {
    postFindMany.mockResolvedValue([])
    await publishScheduledHandler([job({ _batch: true })])

    const where = (postFindMany.mock.calls[0][0] as { where: Record<string, unknown> }).where
    expect(where.status).toBe('scheduled')
    expect(where.scheduledAt).toHaveProperty('lte')
    expect(where.OR).toEqual([{ provider: null }, { provider: { not: 'ghl' } }])
  })
})

describe('publishScheduledHandler — happy path', () => {
  it('publishes a due post and marks it published', async () => {
    postFindMany.mockResolvedValue([makePost({ id: 'p1' })])

    await publishScheduledHandler([job({ _batch: true })])

    expect(dispatchPublish).toHaveBeenCalledTimes(1)
    const update = postUpdate.mock.calls[0][0] as { where: { id: string }; data: Record<string, unknown> }
    expect(update.where.id).toBe('p1')
    expect(update.data.status).toBe('published')
    expect(update.data.scheduledAt).toBeNull()
    expect(update.data.publishedAt).toBeInstanceOf(Date)
  })

  it('resolves the image from the draft when the post has none, but only for the head of a thread', async () => {
    postFindMany.mockResolvedValue([
      makePost({ id: 'head', threadOrder: 0, draft: { id: 'd', attachedImage: 'https://cdn/draft.png' } }),
    ])

    await publishScheduledHandler([job({ _batch: true })])

    const opts = dispatchPublish.mock.calls[0][3] as { imageUrl?: string }
    expect(opts.imageUrl).toBe('https://cdn/draft.png')
  })

  it('does not attach an image to a non-head thread post', async () => {
    postFindMany.mockResolvedValue([
      makePost({ id: 'reply', threadOrder: 2, imageUrl: 'https://cdn/i.png', parentPostId: null }),
    ])

    await publishScheduledHandler([job({ _batch: true })])

    const opts = dispatchPublish.mock.calls[0][3] as { imageUrl?: string }
    expect(opts.imageUrl).toBeUndefined()
  })

  it('marks the parent draft published once every sibling post is published', async () => {
    // 1st findMany: the due posts. 2nd findMany: the draft's sibling summary.
    postFindMany
      .mockResolvedValueOnce([makePost({ id: 'p1', draftId: 'draft_1' })])
      .mockResolvedValueOnce([{ status: 'published', platform: 'linkedin' }])

    await publishScheduledHandler([job({ _batch: true })])

    expect(draftUpdate).toHaveBeenCalledTimes(1)
    const du = draftUpdate.mock.calls[0][0] as { where: { id: string }; data: Record<string, unknown> }
    expect(du.where.id).toBe('draft_1')
    expect(du.data.status).toBe('published')
  })

  it('leaves the draft alone while a sibling is still unpublished', async () => {
    postFindMany
      .mockResolvedValueOnce([makePost({ id: 'p1', draftId: 'draft_1' })])
      .mockResolvedValueOnce([
        { status: 'published', platform: 'linkedin' },
        { status: 'scheduled', platform: 'twitter' },
      ])

    await publishScheduledHandler([job({ _batch: true })])

    expect(draftUpdate).not.toHaveBeenCalled()
  })
})

describe('publishScheduledHandler — failure handling', () => {
  it('keeps a rate-limited post scheduled for the next tick', async () => {
    postFindMany.mockResolvedValue([makePost({ id: 'p1' })])
    dispatchPublish.mockResolvedValue({ success: false, error: 'Rate limit exceeded' })

    await publishScheduledHandler([job({ _batch: true })])

    const data = (postUpdate.mock.calls[0][0] as { data: Record<string, unknown> }).data
    expect(data.status).toBe('scheduled')
    expect(data.errorMsg).toBe('Rate limit exceeded')
  })

  it('marks a non-rate-limit failure as failed', async () => {
    postFindMany.mockResolvedValue([makePost({ id: 'p1' })])
    dispatchPublish.mockResolvedValue({ success: false, error: 'invalid token' })

    await publishScheduledHandler([job({ _batch: true })])

    const data = (postUpdate.mock.calls[0][0] as { data: Record<string, unknown> }).data
    expect(data.status).toBe('failed')
    expect(data.errorMsg).toBe('invalid token')
  })

  it('marks a post failed when dispatch throws, without aborting the batch', async () => {
    postFindMany.mockResolvedValue([makePost({ id: 'p1' }), makePost({ id: 'p2' })])
    dispatchPublish
      .mockRejectedValueOnce(new Error('network blew up'))
      .mockResolvedValueOnce(OK)

    await publishScheduledHandler([job({ _batch: true })])

    const first = postUpdate.mock.calls.find(
      (c) => (c[0] as { where: { id: string } }).where.id === 'p1',
    )?.[0] as { data: Record<string, unknown> }
    expect(first.data.status).toBe('failed')
    expect(first.data.errorMsg).toBe('network blew up')
    // batch continued to p2
    expect(dispatchPublish).toHaveBeenCalledTimes(2)
  })
})

describe('publishScheduledHandler — thread reply ordering', () => {
  it('skips a reply whose parent has not been published yet', async () => {
    postFindMany.mockResolvedValue([
      makePost({ id: 'reply', parentPostId: 'parent_x', platform: 'twitter' }),
    ])
    // parent lookup returns an unpublished parent
    postFindUnique.mockResolvedValue({ status: 'scheduled', tweetId: null })

    await publishScheduledHandler([job({ _batch: true })])

    expect(dispatchPublish).not.toHaveBeenCalled()
    expect(postUpdate).not.toHaveBeenCalled()
  })

  it('passes the parent tweetId as replyToTweetId for a twitter reply', async () => {
    postFindMany.mockResolvedValue([
      makePost({ id: 'reply', parentPostId: 'parent_x', platform: 'twitter', threadOrder: 1 }),
    ])
    // first findUnique: parent status check (published); second: tweetId lookup
    postFindUnique
      .mockResolvedValueOnce({ status: 'published', tweetId: 'tw_parent' })
      .mockResolvedValueOnce({ tweetId: 'tw_parent' })

    // The handler waits 3s before a reply whose parent wasn't published in-batch;
    // drive that timer instead of waiting on the wall clock.
    vi.useFakeTimers()
    const run = publishScheduledHandler([job({ _batch: true })])
    await vi.runAllTimersAsync()
    await run
    vi.useRealTimers()

    const opts = dispatchPublish.mock.calls[0][3] as { replyToTweetId?: string }
    expect(opts.replyToTweetId).toBe('tw_parent')
  })

  it('pulls the telegram chat id from user settings', async () => {
    postFindMany.mockResolvedValue([makePost({ id: 'p1', platform: 'telegram' })])
    settingsFindUnique.mockResolvedValue({ telegramChatId: '@mychan' })

    await publishScheduledHandler([job({ _batch: true })])

    const opts = dispatchPublish.mock.calls[0][3] as { chatId?: string }
    expect(opts.chatId).toBe('@mychan')
  })
})

describe('publishScheduledHandler — lifecycle publishing gate', () => {
  it('parks due posts when the account paid period has lapsed (skip, not fail)', async () => {
    accountIdForUserMock.mockResolvedValue('acct_1')
    accountFindUnique.mockResolvedValue({
      status: 'cancelled',
      paidThrough: new Date(Date.now() - 24 * 60 * 60 * 1000),
      billingExempt: false,
    })
    postFindMany.mockResolvedValueOnce([makePost()])
    await publishScheduledHandler([job({})])
    expect(dispatchPublish).not.toHaveBeenCalled()
    // Post must remain scheduled: no status update to published OR failed.
    const statusUpdates = postUpdate.mock.calls.filter(
      (c) => (c[0] as { data?: { status?: string } })?.data?.status,
    )
    expect(statusUpdates).toHaveLength(0)
  })

  it('publishes normally while paidThrough is still in the future on a cancelled account', async () => {
    accountIdForUserMock.mockResolvedValue('acct_1')
    accountFindUnique.mockResolvedValue({
      status: 'cancelled',
      paidThrough: new Date(Date.now() + 24 * 60 * 60 * 1000),
      billingExempt: false,
    })
    postFindMany.mockResolvedValueOnce([makePost()]).mockResolvedValue([])
    await publishScheduledHandler([job({})])
    expect(dispatchPublish).toHaveBeenCalledTimes(1)
  })
})
