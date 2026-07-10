/**
 * Fingerprint + persist transcribed reviews. See
 * .plans/client-story-review-mining.implementation-plan.md Phase 3.
 *
 * Google only exposes relative dates ("2 weeks ago") which drift between runs
 * and can't serve as a stable cursor. Content fingerprinting is the entire
 * "detect new reviews" mechanism: a review whose fingerprint we've already
 * stored for this account is silently skipped (no-op, not an error) — no
 * separate "since last run" tracking needed.
 */
import { createHash } from 'crypto'
import { prisma } from '@socioply/shared'
import { logger } from '../../lib/logger'
import type { TranscribedReview } from './capture'

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim()
}

export function reviewFingerprint(reviewerName: string | null, reviewText: string): string {
  const key = `${normalize(reviewerName ?? '')}|${normalize(reviewText)}`
  return createHash('sha256').update(key).digest('hex')
}

/** Insert newly-seen reviews as pending RawReview rows; skip ones already fingerprinted for
 * this account. Returns the ids of newly-inserted rows (for triage to pick up). */
export async function persistNewReviews(
  accountId: string,
  reviews: TranscribedReview[],
): Promise<string[]> {
  const newIds: string[] = []
  for (const r of reviews) {
    const fingerprint = reviewFingerprint(r.reviewerName, r.reviewText)
    try {
      const row = await prisma.rawReview.create({
        data: {
          accountId,
          fingerprint,
          reviewText: r.reviewText,
          starRating: r.starRating,
          relativeDate: r.relativeDate,
        },
        select: { id: true },
      })
      newIds.push(row.id)
    } catch (err) {
      // Unique constraint violation on (accountId, fingerprint) = already known review.
      // Any other error is a real failure worth surfacing.
      const isDuplicate = err instanceof Error && 'code' in err && (err as { code?: string }).code === 'P2002'
      if (!isDuplicate) {
        logger.warn({ accountId, err }, '[client-stories/fingerprint] failed to persist a review')
      }
    }
  }
  return newIds
}
