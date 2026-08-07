import { prisma } from '@omniply/shared'
import { getBoss, QUEUES } from '../../queues/index'
import { formatScheduledDate, utcDateKey } from './schedule'
import { generationGateForUser } from '../../lib/account-billing'
import { verticalForUser } from '../../lib/prompt-resolver'
import { logger } from '../../lib/logger'

/** YYYY-MM-DD + n days (UTC-safe). */
function addDays(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  const dt = new Date(Date.UTC(y, (m ?? 1) - 1, (d ?? 1) + days))
  return dt.toISOString().slice(0, 10)
}

/**
 * How long pg-boss lets a SOCIAL_GENERATE job sit `active` before expiring it.
 * Was 3 hours — the 2026-07-08 hang incident's job sat wedged for 13+ minutes
 * before manual intervention; at 3h, pg-boss's own expire-and-retry safety net
 * would never have fired within any reasonable window. 30 min comfortably
 * covers a full 6-slot run (observed ~8 min typical; Phase 2's per-slot hard
 * deadlines cap the worst case at 20 min feed / 15 min story) while still
 * being realistic, not a multi-hour blind spot.
 */
export const SOCIAL_GENERATE_EXPIRE_SECONDS = 30 * 60

export interface EnqueueSocialAutomationOpts {
  userId: string
  jobId: string
  sitePageId: string
  publishingDate: Date
  timeZone?: string
}

export async function enqueueSocialAutomation(
  opts: EnqueueSocialAutomationOpts,
): Promise<{ runId: string; enqueued: boolean; message?: string }> {
  // Lifecycle gate (multi-tenancy Phase A): social runs generate content.
  const gate = await generationGateForUser(opts.userId)
  if (!gate.allowed) {
    return { runId: '', enqueued: false, message: gate.reason }
  }

  // Article content dates are date-only (UTC midnight); use the UTC calendar day
  // so the social run day matches the dashboard content plan (and the correct
  // weekday matrix). Post times still apply the user's timezone via slotToUtc.
  const scheduledDate = utcDateKey(opts.publishingDate)

  // Guards are scoped to the day-1 run (slotVariant null) — the azavea
  // companion run below has its own idempotency check.
  const inProgress = await prisma.socialAutomationRun.findFirst({
    where: {
      jobId: opts.jobId,
      slotVariant: null,
      status: { in: ['pending', 'processing', 'scheduling'] },
    },
  })
  if (inProgress) {
    return { runId: inProgress.id, enqueued: false, message: 'Social automation already in progress' }
  }

  const awaitingApproval = await prisma.socialAutomationRun.findFirst({
    where: { jobId: opts.jobId, slotVariant: null, status: 'ready' },
  })
  if (awaitingApproval) {
    return {
      runId: awaitingApproval.id,
      enqueued: false,
      message: 'Social preview ready — approve to schedule to Omniply',
    }
  }

  const completed = await prisma.socialAutomationRun.findFirst({
    where: { jobId: opts.jobId, slotVariant: null, status: 'completed' },
  })
  if (completed) {
    return { runId: completed.id, enqueued: false, message: 'Social set already scheduled for this article' }
  }

  const run = await prisma.socialAutomationRun.create({
    data: {
      userId: opts.userId,
      jobId: opts.jobId,
      sitePageId: opts.sitePageId,
      scheduledDate,
      status: 'pending',
      groupId: `${opts.jobId}-${scheduledDate}`,
    },
  })

  const boss = await getBoss()
  await boss.send(
    QUEUES.SOCIAL_GENERATE,
    { runId: run.id },
    {
      singletonKey: `social-generate-${opts.jobId}`,
      expireInSeconds: SOCIAL_GENERATE_EXPIRE_SECONDS,
    },
  )

  // Azavea 6-day cadence (user-locked 2026-08-07): each article also gets a
  // companion run the NEXT day (Tue/Thu/Sat) from sections day 1 didn't use
  // (ARTICLE_DAY2_SLOTS). Both runs generate now → one review sitting; only
  // the scheduled dates differ. Azavea-only; clinics keep the single run.
  try {
    if ((await verticalForUser(opts.userId)) === 'azavea') {
      const existingDay2 = await prisma.socialAutomationRun.findFirst({
        where: { jobId: opts.jobId, slotVariant: 'article_day2', status: { not: 'failed' } },
      })
      if (!existingDay2) {
        const day2Date = addDays(scheduledDate, 1)
        const day2 = await prisma.socialAutomationRun.create({
          data: {
            userId: opts.userId,
            jobId: opts.jobId,
            sitePageId: opts.sitePageId,
            scheduledDate: day2Date,
            slotVariant: 'article_day2',
            status: 'pending',
            groupId: `${opts.jobId}-${day2Date}`,
          },
        })
        await boss.send(
          QUEUES.SOCIAL_GENERATE,
          { runId: day2.id },
          {
            singletonKey: `social-generate-${opts.jobId}-day2`,
            expireInSeconds: SOCIAL_GENERATE_EXPIRE_SECONDS,
          },
        )
        logger.info({ jobId: opts.jobId, day2RunId: day2.id, day2Date }, '[social-automation] azavea day-2 companion run enqueued')
      }
    }
  } catch (err) {
    // The day-1 run is already committed — never fail the enqueue over the companion.
    logger.error({ err, jobId: opts.jobId }, '[social-automation] azavea day-2 companion enqueue failed')
  }

  return { runId: run.id, enqueued: true }
}

export interface EnqueueNewsletterSocialOpts {
  userId: string
  newsletterId: string
  publishingDate: Date
  timeZone?: string
}

/** Enqueue a newsletter-sourced social run (weekly cadence, newsletter days). */
export async function enqueueNewsletterSocialAutomation(
  opts: EnqueueNewsletterSocialOpts,
): Promise<{ runId: string; enqueued: boolean; message?: string }> {
  // Lifecycle gate (multi-tenancy Phase A): social runs generate content.
  const gate = await generationGateForUser(opts.userId)
  if (!gate.allowed) {
    return { runId: '', enqueued: false, message: gate.reason }
  }

  const timeZone = opts.timeZone ?? 'America/New_York'
  const scheduledDate = formatScheduledDate(opts.publishingDate, timeZone)

  const existing = await prisma.socialAutomationRun.findFirst({
    where: {
      newsletterId: opts.newsletterId,
      status: { in: ['pending', 'processing', 'scheduling', 'ready', 'completed'] },
    },
  })
  if (existing) {
    return { runId: existing.id, enqueued: false, message: 'Social run already exists for this newsletter' }
  }

  const run = await prisma.socialAutomationRun.create({
    data: {
      userId: opts.userId,
      newsletterId: opts.newsletterId,
      scheduledDate,
      status: 'pending',
      groupId: `nl-${opts.newsletterId}-${scheduledDate}`,
    },
  })

  const boss = await getBoss()
  await boss.send(
    QUEUES.SOCIAL_GENERATE,
    { runId: run.id },
    { singletonKey: `social-generate-nl-${opts.newsletterId}`, expireInSeconds: SOCIAL_GENERATE_EXPIRE_SECONDS },
  )

  return { runId: run.id, enqueued: true }
}

/** Trigger newsletter-sourced social on approval, respecting the per-user toggle. */
export async function maybeEnqueueNewsletterSocialAutomation(newsletterId: string): Promise<void> {
  const nl = await prisma.newsletter.findUnique({ where: { id: newsletterId } })
  if (!nl) return

  const settings = await prisma.settings.findUnique({ where: { userId: nl.userId } })
  if (settings?.socialAutomationEnabled === false) return

  await enqueueNewsletterSocialAutomation({
    userId: nl.userId,
    newsletterId: nl.id,
    publishingDate: nl.scheduledFor ?? new Date(),
    timeZone: settings?.socialTimezone ?? 'America/New_York',
  })
}

export async function maybeEnqueueSocialAutomationAfterEnrichment(jobId: string): Promise<void> {
  const job = await prisma.articleJob.findUnique({
    where: { id: jobId },
    include: {
      topic: true,
      sitePage: { select: { id: true } },
    },
  })

  if (!job?.sitePage?.id) return
  if (job.topic.skipSocialMedia) return
  if (job.topic.mode === 'social_only') return

  const settings = await prisma.settings.findUnique({ where: { userId: job.userId } })
  if (settings?.socialAutomationEnabled === false) return

  const publishingDate = job.topic.publishingDate ?? job.topic.scheduledDate ?? new Date()

  await enqueueSocialAutomation({
    userId: job.userId,
    jobId: job.id,
    sitePageId: job.sitePage.id,
    publishingDate,
    timeZone: settings?.socialTimezone ?? 'America/New_York',
  })
}
