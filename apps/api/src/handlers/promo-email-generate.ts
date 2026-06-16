import PgBoss from 'pg-boss'
import { prisma } from '@socioply/shared'
import { logger } from '../lib/logger'
import { sendFailureAlert } from '../lib/alerts'
import { generatePromoEmail, htmlToPreviewText } from '../article-pipeline/promo-email/generate'
import { getPromoEmailConfig } from '../lib/ghl/settings'
import {
  createGhlEmailCampaign,
  scheduleGhlEmailCampaign,
  deleteGhlEmailCampaign,
  formatLocalSendAt,
  type GhlEmailMeta,
} from '../lib/ghl/client'
import { GHL_MIN_SCHEDULE_LEAD_MS } from '../social/automation/schedule'

export interface PromoEmailGenerateJobData {
  jobId: string
  userId: string
  /** ISO string of the article publishing date. */
  publishingDate: string
}

/** Calendar Y/M/D of `date` as seen in `timeZone`. */
function calendarDateInZone(date: Date, timeZone: string): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const get = (type: string) => parseInt(parts.find((p) => p.type === type)?.value ?? '0', 10)
  return { year: get('year'), month: get('month'), day: get('day') }
}

/**
 * Convert a wall-clock time (year/month/day/hour/minute) in `timeZone` to a UTC
 * Date. Uses the single-step offset-correction method: guess the instant as if
 * the wall time were UTC, measure how that instant renders in the zone, and
 * subtract the resulting offset. Correct except within the ~1h DST-transition
 * window, which is acceptable for a promotional send time.
 */
function zonedWallTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  const guess = Date.UTC(year, month - 1, day, hour, minute, 0)
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(guess))
  const get = (type: string) => parseInt(fmt.find((p) => p.type === type)?.value ?? '0', 10)
  const asZoned = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'))
  const offset = asZoned - guess // tz offset (ms) at the target instant
  return new Date(guess - offset)
}

/**
 * Compute the absolute UTC instant the campaign should send: the configured
 * wall-clock `sendTime` (HH:mm) on the article's publishing date, in the user's
 * timezone. If that instant is already past (e.g. the article published late in
 * the day), send as soon as GHL allows (now + minimum lead time).
 */
export function computeSendAt(
  publishingDate: Date,
  sendTime: string,
  timezone: string,
  now: Date = new Date(),
): Date {
  const [hour, minute] = sendTime.split(':').map((n) => parseInt(n, 10))
  const { year, month, day } = calendarDateInZone(publishingDate, timezone)
  const target = zonedWallTimeToUtc(year, month, day, hour, minute, timezone)

  const earliest = new Date(now.getTime() + GHL_MIN_SCHEDULE_LEAD_MS)
  return target.getTime() < earliest.getTime() ? earliest : target
}

export async function promoEmailGenerateHandler(
  jobs: PgBoss.Job<PromoEmailGenerateJobData>[],
): Promise<void> {
  for (const job of jobs) {
    const { jobId, userId, publishingDate } = job.data
    logger.info({ jobId, pgBossJobId: job.id }, '[promo-email-generate] starting')

    await prisma.articleEmailCampaign.updateMany({
      where: { jobId, status: 'pending' },
      data: { status: 'processing' },
    })

    try {
      // Resolve config first so we fail fast if the feature was disabled after enqueue.
      const config = await getPromoEmailConfig(userId)
      if (!config) {
        logger.warn({ jobId }, '[promo-email-generate] promo email not configured/enabled — skipping')
        await prisma.articleEmailCampaign.deleteMany({ where: { jobId, status: 'processing' } })
        continue
      }

      // GHL requires a verified sender for email campaigns.
      if (!config.fromEmail) {
        throw new Error('Promotional email needs a "From email" — set it in Omniply settings')
      }

      const email = await generatePromoEmail(jobId, userId)

      const meta: GhlEmailMeta = {
        subject: email.subject,
        fromName: config.fromName ?? config.fromEmail,
        fromEmail: config.fromEmail,
        previewText: htmlToPreviewText(email.bodyHtml),
      }

      // Idempotency: reuse a campaign created by a prior attempt (e.g. a retry
      // after a schedule failure whose rollback didn't delete it) instead of
      // creating another one. Rollback nulls ghlCampaignId on successful delete,
      // so a non-null value here means a real draft still exists in GHL.
      const existing = await prisma.articleEmailCampaign.findUnique({
        where: { jobId },
        select: { ghlCampaignId: true },
      })
      let campaignId = existing?.ghlCampaignId ?? null
      if (campaignId) {
        logger.info({ jobId, campaignId }, '[promo-email-generate] reusing existing draft campaign (idempotent retry)')
      } else {
        const created = await createGhlEmailCampaign({
          apiKey: config.apiKey,
          locationId: config.locationId,
          name: `Article promo — ${email.subject}`.slice(0, 120),
          meta,
          bodyHtml: email.bodyHtml,
          timeZone: config.timezone,
          userId: config.ghlUserId,
        })
        campaignId = created.campaignId
        // Record the id immediately so a schedule failure leaves a traceable
        // reference even if rollback also fails.
        await prisma.articleEmailCampaign.update({
          where: { jobId },
          data: { ghlCampaignId: campaignId },
        })
      }

      // computeSendAt returns the correct UTC instant; GHL wants it as a local
      // wall-clock string paired with timeZone.
      const sendAtUtc = computeSendAt(new Date(publishingDate), config.sendTime, config.timezone)
      const sendAtLocal = formatLocalSendAt(sendAtUtc, config.timezone)
      try {
        await scheduleGhlEmailCampaign({
          apiKey: config.apiKey,
          locationId: config.locationId,
          campaignId,
          meta,
          tagIds: [config.tagId],
          timeZone: config.timezone,
          userId: config.ghlUserId,
          sendAt: sendAtLocal,
        })
      } catch (scheduleErr) {
        // Roll back the draft so failed publishes don't accumulate orphaned
        // campaigns in GHL. Best-effort: keep the original error.
        try {
          await deleteGhlEmailCampaign(config.apiKey, config.locationId, campaignId)
          await prisma.articleEmailCampaign.update({ where: { jobId }, data: { ghlCampaignId: null } })
          logger.info({ jobId, campaignId }, '[promo-email-generate] rolled back draft after schedule failure')
        } catch (rollbackErr) {
          logger.warn({ jobId, campaignId, rollbackErr }, '[promo-email-generate] failed to roll back draft campaign')
        }
        throw scheduleErr
      }

      await prisma.articleEmailCampaign.update({
        where: { jobId },
        data: {
          status: 'scheduled',
          ghlCampaignId: campaignId,
          tagId: config.tagId,
          tagName: config.tagName,
          scheduledFor: sendAtUtc,
          errorMessage: null,
        },
      })

      logger.info(
        { jobId, campaignId, sendAt: sendAtLocal, timeZone: config.timezone },
        '[promo-email-generate] campaign scheduled',
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      logger.error({ jobId, err }, '[promo-email-generate] failed')

      await prisma.articleEmailCampaign
        .updateMany({
          where: { jobId, status: { in: ['processing', 'generated'] } },
          data: { status: 'failed', errorMessage: message },
        })
        .catch(() => {})

      await sendFailureAlert({
        userId,
        jobId,
        errorType: 'promo_email_generate_failed',
        message,
        context: { jobId, pgBossJobId: job.id },
      }).catch(() => {})

      throw err
    }
  }
}
