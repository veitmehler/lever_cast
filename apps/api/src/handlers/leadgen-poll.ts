/**
 * Lead-gen access-proposal poller (leadgen plan Phase 3) — the capture engine.
 *
 * Every 2 minutes: for each LIVE document, list pending Drive access
 * proposals; for each new one (proposalId-deduped): ACCEPT it (the marketing
 * promise — prospect gets the doc), then upsert the requester into the
 * clinic's GHL with the document's tags. GHL failure NEVER blocks access:
 * the capture is recorded as ghl_failed and retried on later ticks.
 */
import type PgBoss from 'pg-boss'
import { prisma } from '@omniply/shared'
import { logger } from '../lib/logger'
import { sendFailureAlert } from '../lib/alerts'
import { driveConfigured, listAccessProposals, resolveAccessProposal, grantReader } from '../lib/gdrive/client'
import { rotateDocumentDriveFile, estimateSharesSinceRotation, ROTATION_THRESHOLD } from '../leadgen/rotate'
import { getGhlCredentials } from '../lib/ghl/settings'
import { upsertGhlContact, getGuideLinkFieldId } from '../lib/ghl/client'

export async function leadgenPollHandler(_jobs: PgBoss.Job<object>[]): Promise<void> {
  if (!driveConfigured()) return // feature dormant until the key lands

  const docs = await prisma.leadGenDocument.findMany({
    where: { status: 'live', driveFileId: { not: null } },
    select: { id: true, accountId: true, userId: true, driveFileId: true, driveLink: true, slug: true, ghlTagNames: true, rotatedAt: true, createdAt: true },
  })
  if (docs.length === 0) {
    await retryFailedGhlCaptures()
    return
  }

  for (const doc of docs) {
    let proposals
    try {
      proposals = await listAccessProposals(doc.driveFileId!)
    } catch (err) {
      logger.warn({ documentId: doc.id, err }, '[leadgen-poll] proposal list failed (next tick retries)')
      continue
    }

    for (const p of proposals) {
      const requesterEmail = p.requesterEmailAddress ?? p.recipientEmailAddress
      if (!p.proposalId || !requesterEmail) continue
      const existing = await prisma.leadCapture.findUnique({ where: { proposalId: p.proposalId } })
      if (existing) continue

      // 1. Grant access FIRST — the prospect experience never waits on CRM.
      try {
        await resolveAccessProposal(doc.driveFileId!, p.proposalId)
      } catch (err) {
        logger.error({ documentId: doc.id, proposalId: p.proposalId, err }, '[leadgen-poll] resolve failed')
        continue // retry next tick — proposal stays pending
      }

      // 1b. Grant-all (drip design, 2026-07-29): this email is now KNOWN — grant
      // it reader access on the account's OTHER live guides silently, so every
      // later drip link opens without another request-access wall.
      const siblings = docs.filter((d) => d.accountId === doc.accountId && d.id !== doc.id && d.driveFileId)
      for (const sib of siblings) {
        await grantReader(sib.driveFileId!, requesterEmail, false).catch((err) =>
          logger.warn({ documentId: sib.id, err }, '[leadgen-poll] sibling grant failed (non-fatal)'),
        )
      }

      // 2. Capture the lead.
      const capture = await prisma.leadCapture.create({
        data: {
          documentId: doc.id,
          accountId: doc.accountId,
          requesterEmail,
          proposalId: p.proposalId,
          status: 'ghl_failed', // upgraded below on success
        },
      })
      await pushCaptureToGhl(capture.id, doc.userId, requesterEmail, doc.ghlTagNames, doc.slug, doc.driveLink)
    }
  }

  await retryFailedGhlCaptures()

  // ACL-rotation check (user design 2026-07-29): grant-all means every account
  // capture consumes a share slot on EVERY file — rotate any file approaching
  // Google's ~600 direct-share ceiling. rotatedAt resets the counter.
  for (const doc of docs) {
    try {
      const since = doc.rotatedAt ?? doc.createdAt
      const shares = await estimateSharesSinceRotation(doc.accountId, since)
      if (shares >= ROTATION_THRESHOLD) {
        logger.warn({ documentId: doc.id, shares }, '[leadgen-poll] share ceiling approaching — rotating Drive file')
        await rotateDocumentDriveFile(doc.id)
      }
    } catch (err) {
      logger.warn({ documentId: doc.id, err }, '[leadgen-poll] rotation check failed (next tick retries)')
    }
  }
}

async function pushCaptureToGhl(
  captureId: string,
  ownerUserId: string,
  email: string,
  tags: string[],
  slug: string,
  driveLink?: string | null,
): Promise<void> {
  try {
    const creds = await getGhlCredentials(ownerUserId)
    if (!creds) throw new Error('No GHL credentials for account owner')
    // "Guide Link" contact field (snapshot asset): the nurture email's
    // "here's your guide again" merge — best-effort, older snapshots lack it.
    let customFields: { id: string; value: string }[] | undefined
    if (driveLink) {
      const fieldId = await getGuideLinkFieldId(creds.apiKey, creds.locationId).catch(() => null)
      if (fieldId) customFields = [{ id: fieldId, value: driveLink }]
    }
    const result = await upsertGhlContact(creds.apiKey, creds.locationId, {
      email,
      tags,
      source: `leadgen:${slug}`,
      ...(customFields ? { customFields } : {}),
    })
    await prisma.leadCapture.update({
      where: { id: captureId },
      data: { status: 'captured', ghlContactId: result.contactId },
    })
    logger.info({ captureId, slug }, '[leadgen-poll] lead captured → GHL')
  } catch (err) {
    logger.error({ captureId, err }, '[leadgen-poll] GHL push failed (access already granted; will retry)')
    await sendFailureAlert({
      errorType: 'leadgen-ghl-failed',
      message: `Lead captured (${email} → ${slug}) but the GHL contact push failed: ${err instanceof Error ? err.message : String(err)}. Access WAS granted; push retries automatically.`,
      context: { captureId },
    }).catch(() => {})
  }
}

/** Second-chance loop: captures whose GHL push failed earlier. */
async function retryFailedGhlCaptures(): Promise<void> {
  const failed = await prisma.leadCapture.findMany({
    where: { status: 'ghl_failed' },
    take: 20,
    include: { document: { select: { userId: true, ghlTagNames: true, slug: true, driveLink: true } } },
  })
  for (const c of failed) {
    await pushCaptureToGhl(c.id, c.document.userId, c.requesterEmail, c.document.ghlTagNames, c.document.slug, c.document.driveLink)
  }
}
