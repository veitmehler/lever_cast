/**
 * Account hard-deletion job (multi-tenancy plan Phase C).
 *
 * Entry points: the 90-day lifecycle clock (reason 'auto-90d') and the admin
 * endpoint (reason 'manual' — also serves statutory deletion requests, which
 * override the retention window).
 *
 * Order of operations:
 *  1. LLMUsage detach (userId → null): cost rows are OUR business records and
 *     survive as anonymous aggregates. ErrorLog detaches via its own SetNull.
 *  2. Explicit deletes for tables with a userId column but NO Prisma relation
 *     (cascade can't reach them): video_generation_jobs, syndication_articles,
 *     article_email_campaigns, site_pages, output_attempts.
 *  3. Delete member users (cascades: topics, jobs, posts, drafts, newsletters,
 *     settings, connections, media rows, …).
 *  4. Delete the account row (cascades: members roster, billing events,
 *     newsletter-topic overrides, client stories, content batches, …).
 *  5. S3 sweep: per-member `${userId}/` prefix (the media convention) plus
 *     `tmp/` keys referenced by the account's rows. Shared newsletter research
 *     assets (`newsletter/<topicId>/…`) are deliberately NOT touched — other
 *     accounts on the same calendar reference them.
 *
 * `dryRun: true` produces the full per-table report without touching anything.
 * Published client websites live on client servers — out of scope by design.
 */
import type PgBoss from 'pg-boss'
import { prisma, deleteS3Prefix, extractFilePathFromUrl, deleteS3Keys } from '@socioply/shared'
import { logger } from '../lib/logger'
import { sendFailureAlert } from '../lib/alerts'

export interface AccountDeleteJobData {
  accountId: string
  reason: 'auto-90d' | 'manual'
  dryRun?: boolean
}

const NO_RELATION_TABLES = [
  'videoGenerationJob',
  'syndicationArticle',
  'articleEmailCampaign',
  'sitePage',
  'outputAttempt',
] as const

export async function accountDeleteHandler(jobs: PgBoss.Job<AccountDeleteJobData>[]): Promise<void> {
  for (const job of jobs) {
    const { accountId, reason, dryRun = false } = job.data
    try {
      await deleteAccount(accountId, reason, dryRun)
    } catch (err) {
      logger.error({ accountId, reason, err }, '[account-delete] FAILED')
      await sendFailureAlert({
        errorType: 'account-delete-failed',
        message: `Account deletion ${dryRun ? '(dry run) ' : ''}for ${accountId} failed: ${err instanceof Error ? err.message : String(err)}`,
        context: { accountId, reason },
      }).catch(() => {})
      throw err
    }
  }
}

async function deleteAccount(accountId: string, reason: string, dryRun: boolean): Promise<void> {
  const account = await prisma.account.findUnique({
    where: { id: accountId },
    select: { id: true, name: true, status: true, statusChangedAt: true },
  })
  if (!account) {
    logger.warn({ accountId }, '[account-delete] account not found — nothing to do')
    return
  }

  // Defense in depth for the automatic path: re-verify the account really is
  // cancelled. Manual/statutory deletions may target any status.
  if (reason === 'auto-90d' && account.status !== 'cancelled') {
    logger.warn({ accountId, status: account.status }, '[account-delete] auto path but account not cancelled — aborting')
    return
  }

  const members = await prisma.user.findMany({ where: { accountId }, select: { id: true, email: true } })
  const memberIds = members.map((m) => m.id)

  // ── Report: what exists ────────────────────────────────────────────────────
  const counts: Record<string, number> = {}
  counts.users = members.length
  counts.llmUsageToDetach = memberIds.length
    ? await prisma.lLMUsage.count({ where: { userId: { in: memberIds } } })
    : 0
  for (const model of NO_RELATION_TABLES) {
    // @ts-expect-error dynamic model access over a fixed allowlist
    counts[model] = memberIds.length ? await prisma[model].count({ where: { userId: { in: memberIds } } }) : 0
  }
  counts.topics = memberIds.length ? await prisma.topic.count({ where: { userId: { in: memberIds } } }) : 0
  counts.posts = memberIds.length ? await prisma.post.count({ where: { userId: { in: memberIds } } }) : 0
  counts.newsletters = memberIds.length ? await prisma.newsletter.count({ where: { userId: { in: memberIds } } }) : 0

  // tmp/ keys referenced by this account's rows (member-prefix keys are wiped
  // wholesale by the prefix sweep below).
  const tmpKeys = new Set<string>()
  if (memberIds.length) {
    const mediaRows = await prisma.media.findMany({ where: { userId: { in: memberIds } }, select: { url: true } })
    const postRows = await prisma.post.findMany({
      where: { userId: { in: memberIds } },
      select: { imageUrl: true, mediaUrls: true, videoUrl: true },
    })
    const urls: (string | null)[] = [
      ...mediaRows.map((m) => m.url),
      ...postRows.flatMap((p) => [p.imageUrl, p.videoUrl, ...(p.mediaUrls ?? [])]),
    ]
    for (const u of urls) {
      if (!u) continue
      const key = extractFilePathFromUrl(u)
      if (key?.startsWith('tmp/')) tmpKeys.add(key)
    }
  }
  counts.s3TmpKeys = tmpKeys.size

  const summary = `Account ${account.name ?? accountId} (${memberIds.length} users: ${members.map((m) => m.email).join(', ')}) — ${JSON.stringify(counts)}`

  if (dryRun) {
    logger.info({ accountId, counts }, '[account-delete] DRY RUN — nothing deleted')
    await sendFailureAlert({
      errorType: 'account-delete-dry-run',
      message: `DRY RUN (${reason}): would delete ${summary}. Arm with ACCOUNT_AUTO_DELETE_ENABLED=true or run the admin endpoint without dryRun.`,
      context: { accountId, reason, counts },
    }).catch(() => {})
    return
  }

  // ── Execute ────────────────────────────────────────────────────────────────
  if (memberIds.length) {
    // 1. Detach our cost records.
    await prisma.lLMUsage.updateMany({ where: { userId: { in: memberIds } }, data: { userId: null } })
    // 2. Tables cascade can't reach.
    for (const model of NO_RELATION_TABLES) {
      // @ts-expect-error dynamic model access over a fixed allowlist
      await prisma[model].deleteMany({ where: { userId: { in: memberIds } } })
    }
    // 3. Users (cascades the bulk of client content).
    await prisma.user.deleteMany({ where: { id: { in: memberIds } } })
  }
  // 4. The account row (cascades account-keyed tables).
  await prisma.account.delete({ where: { id: accountId } })

  // 5. S3 sweep — after the DB so a failure here can't strand half-deleted rows.
  for (const uid of memberIds) {
    await deleteS3Prefix(`${uid}/`).catch((err) =>
      logger.error({ accountId, uid, err }, '[account-delete] S3 prefix sweep failed (continuing)'),
    )
  }
  await deleteS3Keys([...tmpKeys]).catch((err) =>
    logger.error({ accountId, err }, '[account-delete] S3 tmp-key sweep failed (continuing)'),
  )

  logger.warn({ accountId, counts }, '[account-delete] account deleted')
  await sendFailureAlert({
    errorType: 'account-deleted',
    message: `Account DELETED (${reason}): ${summary}`,
    context: { accountId, reason, counts },
  }).catch(() => {})
}
