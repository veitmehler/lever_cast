/**
 * Drive ACL rotation (user design, 2026-07-29).
 *
 * Google Drive caps direct shares at ~600 people per file, and grant-all puts
 * every captured lead on every file's ACL. Rotation = re-upload the SAME PDF
 * (S3 pdfKey is the source of truth — no LLM recompile, no content drift) as a
 * NEW Drive file with a fresh ACL budget, archive the old file (existing leads
 * keep access), silently regrant the active-drip cohort, and repoint the
 * omniply-guide-<slug> trigger link. Auto-triggered by the poller when the
 * shares-since-rotation estimate crosses ROTATION_THRESHOLD.
 */
import { prisma, readS3Object } from '@omniply/shared'
import { logger } from '../lib/logger'
import { sendFailureAlert } from '../lib/alerts'
import { driveConfigured, ensureAccountFolder, uploadPdf } from '../lib/gdrive/client'
import { regrantActiveCohort, repointGuideTriggerLink } from './compile'

/** Rotate before Google's ~600 direct-share ceiling; headroom for the cohort regrant. */
export const ROTATION_THRESHOLD = 500

export async function rotateDocumentDriveFile(documentId: string): Promise<boolean> {
  if (!driveConfigured()) return false
  const doc = await prisma.leadGenDocument.findUnique({
    where: { id: documentId },
    select: {
      id: true,
      accountId: true,
      userId: true,
      title: true,
      slug: true,
      status: true,
      pdfKey: true,
      driveFileId: true,
      account: { select: { driveFolderId: true, name: true } },
    },
  })
  if (!doc?.pdfKey || doc.status !== 'live') return false
  try {
    const { body } = await readS3Object(doc.pdfKey)
    let folderId = doc.account.driveFolderId
    if (!folderId) folderId = await ensureAccountFolder(doc.accountId, doc.account.name ?? 'client')
    const uploaded = await uploadPdf(folderId, `${doc.title}.pdf`, body)

    await regrantActiveCohort(doc.accountId, uploaded.fileId, doc.id)
    await prisma.leadGenDocument.update({
      where: { id: doc.id },
      data: {
        driveFileId: uploaded.fileId,
        driveLink: uploaded.webViewLink,
        rotatedAt: new Date(),
        ...(doc.driveFileId ? { archivedDriveFileIds: { push: doc.driveFileId } } : {}),
      },
    })
    await repointGuideTriggerLink(doc.userId, doc.slug, uploaded.webViewLink, doc.id)

    logger.info({ documentId: doc.id, newFileId: uploaded.fileId }, '[leadgen-rotate] Drive file rotated (fresh ACL budget)')
    await sendFailureAlert({
      errorType: 'leadgen-rotation',
      message: `Lead magnet "${doc.title}" auto-rotated its Drive file (~${ROTATION_THRESHOLD}+ shares reached). New file active; old file archived with existing access intact. No action needed — informational.`,
      context: { documentId: doc.id },
    }).catch(() => {})
    return true
  } catch (err) {
    logger.error({ documentId, err }, '[leadgen-rotate] rotation FAILED (old file still serving)')
    return false
  }
}

/**
 * Shares-since-rotation estimate for a document: grant-all means every distinct
 * captured email in the ACCOUNT since this file's rotation anchor holds a slot
 * on this file's ACL (plus the cohort regrant seed, covered by threshold headroom).
 */
export async function estimateSharesSinceRotation(
  accountId: string,
  since: Date,
): Promise<number> {
  const rows = await prisma.leadCapture.findMany({
    where: { document: { accountId }, createdAt: { gte: since }, status: { in: ['captured', 'ghl_failed'] } },
    select: { requesterEmail: true },
    distinct: ['requesterEmail'],
    take: ROTATION_THRESHOLD + 50,
  })
  return rows.length
}
