import { prisma } from '@omniply/shared'
import type { OutputPayload, OutputAttemptResult, OutputTarget } from './types'

/**
 * Internal publish target (omniply brand-consolidation plan, Phase A).
 *
 * AZAVEA VERTICAL ONLY — selected exclusively by the vertical-gated branch in
 * the publish/output routes. Clinics keep wordpress/html/bundle untouched;
 * this target is purely additive to the registry.
 *
 * "Publishing" here is marking the SitePage live: the rendered HTML already
 * sits in our DB, and omniply.io/articles/<slug> renders it via the public
 * articles API. No upload, no external system.
 */
const PUBLIC_BASE = (process.env.MARKETING_PUBLIC_BASE ?? 'https://omniply.io').replace(/\/$/, '')

export class InternalTarget implements OutputTarget {
  name = 'internal'

  async publish(
    payload: OutputPayload,
    _config: Record<string, unknown>,
    _attemptId: string,
  ): Promise<OutputAttemptResult> {
    const started = Date.now()

    const sitePage = await prisma.sitePage.findUnique({
      where: { jobId: payload.jobId },
      select: { id: true, internalSlug: true, internalPublishedAt: true },
    })
    if (!sitePage) {
      return {
        success: false,
        errorMessage: `No SitePage for job ${payload.jobId}`,
        durationMs: Date.now() - started,
      }
    }

    // Idempotent: re-publishing keeps the original slug + date.
    let slug = sitePage.internalSlug
    if (!slug) {
      slug = await this.uniqueSlug(payload.slug, sitePage.id)
    }

    // Display date = the article's NOMINAL date (topic publishing/scheduled
    // date), not the approval click — backdated/backfill articles sort into
    // the past on /articles instead of piling up on approval day
    // (user request 2026-08-19).
    const topic = await prisma.articleJob.findUnique({
      where: { id: payload.jobId },
      select: { topic: { select: { publishingDate: true, scheduledDate: true } } },
    })
    const nominalDate = topic?.topic?.publishingDate ?? topic?.topic?.scheduledDate ?? new Date()

    await prisma.sitePage.update({
      where: { id: sitePage.id },
      data: {
        internalSlug: slug,
        internalPublishedAt: sitePage.internalPublishedAt ?? nominalDate,
      },
    })

    return {
      success: true,
      resultUrl: `${PUBLIC_BASE}/articles/${slug}`,
      targetRefId: sitePage.id,
      durationMs: Date.now() - started,
    }
  }

  private async uniqueSlug(base: string, sitePageId: string): Promise<string> {
    const clean = (base || 'article').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '') || 'article'
    let candidate = clean
    for (let i = 2; i <= 20; i++) {
      const clash = await prisma.sitePage.findFirst({
        where: { internalSlug: candidate, id: { not: sitePageId } },
        select: { id: true },
      })
      if (!clash) return candidate
      candidate = `${clean}-${i}`
    }
    return `${clean}-${Date.now()}`
  }
}
