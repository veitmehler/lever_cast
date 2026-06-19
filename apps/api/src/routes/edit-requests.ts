import type { FastifyInstance } from 'fastify'
import { randomUUID } from 'node:crypto'
import { prisma } from '@socioply/shared'
import { requireAccount } from '../middleware/account'
import { sendTransactionalEmail } from '../lib/alerts'
import { logger } from '../lib/logger'

interface NewRequest {
  quotedText: string
  prefixContext?: string
  suffixContext?: string
  note: string
}

function baseUrl(): string {
  return process.env.APP_BASE_URL ?? 'https://app.socioply.com'
}

export async function editRequestRoutes(app: FastifyInstance) {
  // POST /articles/:jobId/edit-requests — reviewer sends a batch of edits to a teammate
  app.post<{ Params: { jobId: string }; Body: { assigneeEmail?: string; requests?: NewRequest[] } }>(
    '/articles/:jobId/edit-requests',
    async (request, reply) => {
      const account = await requireAccount(request, reply)
      if (!account) return

      const sitePage = await prisma.sitePage.findFirst({
        where: { jobId: request.params.jobId, userId: account.userId }, // extension → account members
        select: { id: true, title: true },
      })
      if (!sitePage) return reply.status(404).send({ error: 'Article not found' })

      const requests = (request.body?.requests ?? []).filter((r) => r.quotedText?.trim() && r.note?.trim())
      if (requests.length === 0) return reply.status(400).send({ error: 'No edit requests provided' })

      // Assignee: explicit, else the account default. Resolve to a member if possible.
      const acct = await prisma.account.findUnique({
        where: { id: account.accountId },
        select: { assistantEmail: true },
      })
      const assigneeEmail = (request.body?.assigneeEmail ?? acct?.assistantEmail ?? '').trim().toLowerCase()
      if (!assigneeEmail) return reply.status(400).send({ error: 'No assignee email (set a default in Settings → Team or pass one).' })

      const member = await prisma.user.findFirst({
        where: { accountId: account.accountId, email: assigneeEmail },
        select: { id: true },
      })

      const reviewRoundId = randomUUID()
      await prisma.$transaction([
        prisma.articleEditRequest.createMany({
          data: requests.map((r) => ({
            sitePageId: sitePage.id,
            reviewRoundId,
            requestedByUserId: account.userId,
            assigneeEmail,
            assigneeUserId: member?.id ?? null,
            quotedText: r.quotedText.trim(),
            prefixContext: r.prefixContext?.trim() || null,
            suffixContext: r.suffixContext?.trim() || null,
            note: r.note.trim(),
          })),
        }),
        prisma.sitePage.update({ where: { id: sitePage.id }, data: { reviewState: 'edits_requested' } }),
      ])

      const link = `${baseUrl()}/review/${request.params.jobId}`
      await sendTransactionalEmail({
        to: assigneeEmail,
        subject: `${requests.length} edit request(s) on "${sitePage.title}"`,
        html: `<p>You've been asked to make ${requests.length} edit(s) on the article <strong>${sitePage.title}</strong>.</p><p><a href="${link}">Open the article and work through the requests →</a></p>`,
        text: `You've been asked to make ${requests.length} edit(s) on "${sitePage.title}".\n\nOpen it here: ${link}`,
      }).catch((err) => logger.warn({ err }, '[edit-requests] assignee email failed'))

      return reply.status(201).send({ reviewRoundId, count: requests.length })
    },
  )

  // GET /articles/:jobId/edit-requests — list for the assistant panel + reviewer view
  app.get<{ Params: { jobId: string } }>('/articles/:jobId/edit-requests', async (request, reply) => {
    const account = await requireAccount(request, reply)
    if (!account) return

    const sitePage = await prisma.sitePage.findFirst({
      where: { jobId: request.params.jobId, userId: account.userId },
      select: { id: true, reviewState: true },
    })
    if (!sitePage) return reply.status(404).send({ error: 'Article not found' })

    const requests = await prisma.articleEditRequest.findMany({
      where: { sitePageId: sitePage.id },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        quotedText: true,
        prefixContext: true,
        suffixContext: true,
        note: true,
        status: true,
        createdAt: true,
      },
    })
    const openCount = requests.filter((r) => r.status === 'open').length
    return reply.send({ reviewState: sitePage.reviewState, requests, openCount })
  })

  // PATCH /edit-requests/:id { status } — assistant resolves / reopens
  app.patch<{ Params: { id: string }; Body: { status?: string } }>(
    '/edit-requests/:id',
    async (request, reply) => {
      const account = await requireAccount(request, reply)
      if (!account) return

      const status = request.body?.status
      if (!status || !['open', 'resolved', 'wont_fix'].includes(status)) {
        return reply.status(400).send({ error: 'status must be open | resolved | wont_fix' })
      }

      // Ownership: the request's sitePage must belong to the account.
      const er = await prisma.articleEditRequest.findUnique({
        where: { id: request.params.id },
        select: { id: true, sitePageId: true },
      })
      if (!er) return reply.status(404).send({ error: 'Edit request not found' })
      const owned = await prisma.sitePage.findFirst({
        where: { id: er.sitePageId, userId: account.userId },
        select: { id: true },
      })
      if (!owned) return reply.status(404).send({ error: 'Edit request not found' })

      const updated = await prisma.articleEditRequest.update({
        where: { id: request.params.id },
        data: {
          status,
          resolvedByUserId: status === 'open' ? null : account.userId,
          resolvedAt: status === 'open' ? null : new Date(),
        },
      })
      return reply.send({ request: updated })
    },
  )

  // POST /articles/:jobId/request-review — assistant hands the article back for re-review
  app.post<{ Params: { jobId: string } }>('/articles/:jobId/request-review', async (request, reply) => {
    const account = await requireAccount(request, reply)
    if (!account) return

    const sitePage = await prisma.sitePage.findFirst({
      where: { jobId: request.params.jobId, userId: account.userId },
      select: { id: true, title: true },
    })
    if (!sitePage) return reply.status(404).send({ error: 'Article not found' })

    await prisma.sitePage.update({ where: { id: sitePage.id }, data: { reviewState: 're_review_requested' } })

    // Notify the most recent requester (the reviewer who asked for the edits).
    const lastRound = await prisma.articleEditRequest.findFirst({
      where: { sitePageId: sitePage.id },
      orderBy: { createdAt: 'desc' },
      select: { requestedByUserId: true },
    })
    if (lastRound) {
      const reviewer = await prisma.user.findUnique({
        where: { id: lastRound.requestedByUserId },
        select: { email: true, name: true },
      })
      if (reviewer?.email) {
        const link = `${baseUrl()}/dashboard`
        await sendTransactionalEmail({
          to: reviewer.email,
          subject: `Your requested edits on "${sitePage.title}" are ready to review`,
          html: `<p>Hi ${reviewer.name ?? 'there'},</p><p>The edits you requested on <strong>${sitePage.title}</strong> have been made and it's ready for your review.</p><p><a href="${link}">Review &amp; approve on your dashboard →</a></p>`,
          text: `The edits you requested on "${sitePage.title}" are ready to review.\n\n${link}`,
        }).catch((err) => logger.warn({ err }, '[edit-requests] reviewer email failed'))
      }
    }

    return reply.send({ ok: true })
  })
}
