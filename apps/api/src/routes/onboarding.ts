/**
 * Onboarding flow routes (onboarding plan Phase 1).
 *
 * Works in BOTH auth modes (embed token or Clerk) since requireAuth resolves
 * either to a clerkId. State is per-account and resumable.
 */
import type { FastifyInstance } from 'fastify'
import { prisma, resolveAccountForClerkId } from '@socioply/shared'
import { requireAuth } from '../middleware/auth'
import { logger } from '../lib/logger'
import {
  getOrCreateSession,
  currentStepView,
  commitAndAdvance,
  STEP_ORDER,
  type StepContext,
} from '../onboarding/flow'
import { bootstrapOnboarding } from '../onboarding/bootstrap'

export async function onboardingRoutes(app: FastifyInstance) {
  async function ctxFor(clerkId: string) {
    const account = await resolveAccountForClerkId(clerkId)
    if (!account) return null
    const session = await getOrCreateSession(account.accountId)
    const ctx: StepContext = {
      accountId: account.accountId,
      userId: account.userId,
      stepData: (session.stepData as Record<string, unknown>) ?? {},
    }
    return { account, session, ctx }
  }

  // GET /onboarding/state — current step view + chat history for resume.
  app.get('/onboarding/state', async (request, reply) => {
    const clerkId = await requireAuth(request, reply)
    if (!clerkId) return
    const r = await ctxFor(clerkId)
    if (!r) return reply.status(404).send({ error: 'No account' })

    const acct = await prisma.account.findUnique({
      where: { id: r.account.accountId },
      select: { onboardingCompletedAt: true },
    })
    if (acct?.onboardingCompletedAt) {
      return reply.send({ completed: true })
    }

    // First entry: pull the GHL Business Profile + start the website crawl
    // (idempotent; runs while the user answers the early questions).
    await bootstrapOnboarding(r.account.accountId, r.account.ownerUserId, r.session.id, r.ctx.stepData).catch(
      (err) => logger.warn({ err }, '[onboarding] bootstrap failed (manual fallbacks apply)'),
    )

    const view = await currentStepView(r.ctx, r.session.currentStep)
    return reply.send({
      completed: false,
      step: view,
      history: (r.ctx.stepData.__history as unknown[]) ?? [],
    })
  })

  // POST /onboarding/answer { step, answer } — commit + advance.
  app.post<{ Body: { step?: string; answer?: unknown } }>('/onboarding/answer', async (request, reply) => {
    const clerkId = await requireAuth(request, reply)
    if (!clerkId) return
    const r = await ctxFor(clerkId)
    if (!r) return reply.status(404).send({ error: 'No account' })

    const { step, answer } = request.body ?? {}
    if (!step) return reply.status(400).send({ error: 'step required' })
    if (step !== r.session.currentStep) {
      // Stale client (e.g. two tabs) — return the authoritative current view.
      const view = await currentStepView(r.ctx, r.session.currentStep)
      return reply.status(409).send({ error: 'Out of sync', step: view })
    }

    const result = await commitAndAdvance(r.ctx, r.session.id, step, answer)
    if (result.error) return reply.status(400).send({ error: result.error })

    const view = await currentStepView(r.ctx, result.nextStep)
    return reply.send({ step: view })
  })

  // POST /onboarding/back — one step back (edits are cheap, dead ends are not).
  app.post('/onboarding/back', async (request, reply) => {
    const clerkId = await requireAuth(request, reply)
    if (!clerkId) return
    const r = await ctxFor(clerkId)
    if (!r) return reply.status(404).send({ error: 'No account' })

    const idx = STEP_ORDER.indexOf(r.session.currentStep)
    const prev = STEP_ORDER[Math.max(0, idx - 1)]
    await prisma.onboardingSession.update({ where: { id: r.session.id }, data: { currentStep: prev } })
    const view = await currentStepView(r.ctx, prev)
    return reply.send({ step: view })
  })

  // POST /onboarding/complete — validator-gated (validator lands with Phase 7;
  // until then this only flips when explicitly forced by an admin test flag).
  app.post('/onboarding/complete', async (request, reply) => {
    const clerkId = await requireAuth(request, reply)
    if (!clerkId) return
    const r = await ctxFor(clerkId)
    if (!r) return reply.status(404).send({ error: 'No account' })

    // Phase 7 replaces this stub with generationReadiness(accountId).
    const readiness = { ready: false, missing: [{ field: 'validator', why: 'Generation-readiness validator not yet implemented (Phase 7)' }] }
    if (!readiness.ready) {
      return reply.status(409).send({ error: 'Onboarding incomplete', readiness })
    }

    await prisma.account.update({
      where: { id: r.account.accountId },
      data: { onboardingCompletedAt: new Date() },
    })
    await prisma.onboardingSession.update({ where: { id: r.session.id }, data: { status: 'completed' } })
    logger.info({ accountId: r.account.accountId }, '[onboarding] completed')
    return reply.send({ completed: true })
  })
}
