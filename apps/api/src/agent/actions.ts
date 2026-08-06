/**
 * Agent action EXECUTION (.plans/chat-agent-v1.implementation-plan.md C2).
 *
 * The engine validates actions (tools.ts); this module makes them real:
 *  - request_callback → GHL contact upsert (phone-first) + `callback-requested`
 *    tag (snapshot workflow notifies the front desk) + a contact note carrying
 *    the LLM-generated 2–3 sentence chat summary (decision C).
 *  - capture_contact → same machinery as the Spine Check capture: Drive
 *    grant-all, LeadCapture row, guide drip tags.
 *  - add_contact_email → patches the conversation's contact with the backup
 *    email (asked right after a callback is arranged).
 *
 * All best-effort: the visitor's chat never breaks on a CRM hiccup — failures
 * alert us (spine-check pattern) and are visible in the transcript flags.
 */
import { randomUUID } from 'node:crypto'
import { prisma } from '@omniply/shared'
import { logger } from '../lib/logger'
import { sendFailureAlert } from '../lib/alerts'
import { getGhlCredentials } from '../lib/ghl/settings'
import { createGhlContactNote, getChatSummaryFieldId, updateGhlContact, upsertGhlContact } from '../lib/ghl/client'
import { driveConfigured, grantReader } from '../lib/gdrive/client'
import { recordLLMUsage } from '../lib/llm-usage'
import { runNewsletterPrompt } from '../newsletter/llm'
import type { AgentContext } from './context'
import type { AgentAction } from './tools'

/** Compact transcript for the front-desk summary prompt. */
async function transcriptFor(conversationId: string): Promise<string> {
  const rows = await prisma.agentMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
    take: 40,
    select: { role: true, content: true },
  })
  return rows.map((m) => `${m.role === 'visitor' ? 'Visitor' : 'Assistant'}: ${m.content}`).join('\n')
}

/** 2–3 sentence handover summary (decision C). Empty string on any failure. */
async function callbackSummary(ctx: AgentContext, conversationId: string): Promise<string> {
  try {
    const transcript = await transcriptFor(conversationId)
    const { content, response } = await runNewsletterPrompt('agent_summary', { transcript }, { vertical: ctx.vertical })
    await recordLLMUsage(ctx.ownerUserId, 'agent', response)
    return content.trim().slice(0, 1000)
  } catch (err) {
    logger.warn({ err, conversationId }, '[agent] callback summary generation failed')
    return ''
  }
}

async function executeCallback(
  ctx: AgentContext,
  conversationId: string,
  action: Extract<AgentAction, { type: 'request_callback' }>,
): Promise<void> {
  const creds = await getGhlCredentials(ctx.ownerUserId)
  if (!creds) throw new Error('No GHL credentials for account owner')

  const summary = await callbackSummary(ctx, conversationId)
  // The summary also lands in the "Chat Summary" custom field (find-or-create)
  // so the snapshot's notification workflow can merge {{contact.chat_summary}}
  // straight into the front-desk SMS/email text.
  const summaryText = [action.reason, summary].filter(Boolean).join(' — ')
  const fieldId = summaryText
    ? await getChatSummaryFieldId(creds.apiKey, creds.locationId).catch(() => null)
    : null
  const result = await upsertGhlContact(creds.apiKey, creds.locationId, {
    phone: action.phone,
    firstName: action.name,
    tags: ['callback-requested', 'chat-agent-lead'],
    source: 'chat-agent',
    ...(fieldId && summaryText ? { customFields: [{ id: fieldId, value: summaryText.slice(0, 2000) }] } : {}),
  })
  if (result.contactId) {
    await prisma.agentConversation.update({
      where: { id: conversationId },
      data: { ghlContactId: result.contactId },
    })
    const note = [
      '📞 Chat assistant callback request',
      action.reason ? `Reason: ${action.reason}` : null,
      summary ? `Chat summary: ${summary}` : null,
    ]
      .filter(Boolean)
      .join('\n')
    await createGhlContactNote(creds.apiKey, result.contactId, note).catch((err) =>
      logger.warn({ err, conversationId }, '[agent] contact note failed (contact + tag landed)'),
    )
  }
  logger.info({ accountId: ctx.accountId, conversationId }, '[agent] callback → GHL contact + tag')
}

async function executeCapture(
  ctx: AgentContext,
  conversationId: string,
  action: Extract<AgentAction, { type: 'capture_contact' }>,
): Promise<void> {
  const docs = await prisma.leadGenDocument.findMany({
    where: { accountId: ctx.accountId, status: 'live', driveFileId: { not: null } },
    select: { id: true, slug: true, driveFileId: true, ghlTagNames: true },
  })
  const matched = docs.find((d) => d.slug === action.guideSlug) ?? null

  // Drive grant-all first — same posture as the Spine Check: the lead must
  // never hit a request-access wall when drip links arrive.
  if (driveConfigured()) {
    for (const doc of docs) {
      await grantReader(doc.driveFileId!, action.email, false).catch((err) =>
        logger.warn({ documentId: doc.id, err }, '[agent] drive grant failed (request-access flow remains)'),
      )
    }
  }

  let captureId: string | null = null
  if (matched) {
    const capture = await prisma.leadCapture.create({
      data: {
        documentId: matched.id,
        accountId: ctx.accountId,
        requesterEmail: action.email,
        proposalId: `chat-agent:${randomUUID()}`,
        status: 'ghl_failed', // upgraded below on success
      },
    })
    captureId = capture.id
  }

  const creds = await getGhlCredentials(ctx.ownerUserId)
  if (!creds) throw new Error('No GHL credentials for account owner')
  const guideTags = matched ? (matched.ghlTagNames.length ? matched.ghlTagNames : [`leadgen-${matched.slug}`]) : []
  const result = await upsertGhlContact(creds.apiKey, creds.locationId, {
    email: action.email,
    firstName: action.name,
    ...(action.phone ? { phone: action.phone } : {}),
    tags: [...guideTags, 'chat-agent-lead'],
    source: 'chat-agent',
  })
  if (result.contactId) {
    await prisma.agentConversation.update({
      where: { id: conversationId },
      data: { ghlContactId: result.contactId },
    })
  }
  if (captureId) {
    await prisma.leadCapture.update({
      where: { id: captureId },
      data: { status: 'captured', ghlContactId: result.contactId },
    })
  }
  logger.info({ accountId: ctx.accountId, conversationId, guide: action.guideSlug }, '[agent] capture → GHL + drip')
}

async function executeAddEmail(
  ctx: AgentContext,
  conversationId: string,
  action: Extract<AgentAction, { type: 'add_contact_email' }>,
): Promise<void> {
  const conversation = await prisma.agentConversation.findUnique({
    where: { id: conversationId },
    select: { ghlContactId: true },
  })
  if (!conversation?.ghlContactId) return
  const creds = await getGhlCredentials(ctx.ownerUserId)
  if (!creds) throw new Error('No GHL credentials for account owner')
  await updateGhlContact(creds.apiKey, conversation.ghlContactId, { email: action.email })
  logger.info({ accountId: ctx.accountId, conversationId }, '[agent] backup email added to contact')
}

/**
 * Execute a validated action. Never throws — failures alert + flag but the
 * visitor's reply has already shipped.
 */
export async function executeAgentAction(
  ctx: AgentContext,
  conversationId: string,
  action: AgentAction,
): Promise<void> {
  try {
    switch (action.type) {
      case 'request_callback':
        await executeCallback(ctx, conversationId, action)
        break
      case 'capture_contact':
        await executeCapture(ctx, conversationId, action)
        break
      case 'add_contact_email':
        await executeAddEmail(ctx, conversationId, action)
        break
      default:
        // send_booking_link / offer_guide render client-side; nothing to do.
        break
    }
  } catch (err) {
    logger.error({ err, conversationId, action: action.type }, '[agent] action execution failed')
    await prisma.agentConversation
      .update({ where: { id: conversationId }, data: { flagged: true, flagReason: `action-failed:${action.type}` } })
      .catch(() => {})
    await sendFailureAlert({
      errorType: 'agent-action-failed',
      message: `Chat-agent ${action.type} failed for account ${ctx.accountId}: ${err instanceof Error ? err.message : String(err)}. The visitor was told it succeeded — follow up via the flagged transcript.`,
      context: { accountId: ctx.accountId, conversationId },
    }).catch(() => {})
  }
}
