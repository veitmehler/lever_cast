import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Fastify from 'fastify'

const accountFindUnique = vi.fn()
vi.mock('@omniply/shared', () => ({
  prisma: { account: { findUnique: (...a: unknown[]) => accountFindUnique(...a) } },
}))

const applyBillingEvent = vi.fn()
vi.mock('../../lib/account-lifecycle', () => ({
  applyBillingEvent: (...a: unknown[]) => applyBillingEvent(...a),
  BILLING_EVENT_TYPES: ['payment_cleared', 'payment_failed', 'cancelled'],
}))

vi.mock('../../lib/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }))

import { ghlBillingRoutes } from '../ghl-billing'

async function build() {
  const app = Fastify()
  await app.register(ghlBillingRoutes)
  await app.ready()
  return app
}

const URL = '/ghl/billing-events/tok_abc'
const HEADERS = { 'x-billing-secret': 'shh' }

beforeEach(() => {
  vi.clearAllMocks()
  process.env.GHL_BILLING_WEBHOOK_SECRET = 'shh'
  accountFindUnique.mockResolvedValue({ id: 'acct_1' })
  applyBillingEvent.mockResolvedValue({ applied: true, duplicate: false })
})

afterEach(() => {
  delete process.env.GHL_BILLING_WEBHOOK_SECRET
})

describe('POST /ghl/billing-events/:token', () => {
  it('503s when the shared secret is not configured', async () => {
    delete process.env.GHL_BILLING_WEBHOOK_SECRET
    const app = await build()
    const res = await app.inject({ method: 'POST', url: URL, headers: HEADERS, payload: { type: 'payment_cleared' } })
    expect(res.statusCode).toBe(503)
    await app.close()
  })

  it('401s on a wrong shared secret', async () => {
    const app = await build()
    const res = await app.inject({
      method: 'POST', url: URL, headers: { 'x-billing-secret': 'nope' }, payload: { type: 'payment_cleared' },
    })
    expect(res.statusCode).toBe(401)
    expect(applyBillingEvent).not.toHaveBeenCalled()
    await app.close()
  })

  it('404s on an unknown token without leaking detail', async () => {
    accountFindUnique.mockResolvedValue(null)
    const app = await build()
    const res = await app.inject({ method: 'POST', url: URL, headers: HEADERS, payload: { type: 'payment_cleared' } })
    expect(res.statusCode).toBe(404)
    expect(applyBillingEvent).not.toHaveBeenCalled()
    await app.close()
  })

  it('400s on an unknown event type', async () => {
    const app = await build()
    const res = await app.inject({ method: 'POST', url: URL, headers: HEADERS, payload: { type: 'refund' } })
    expect(res.statusCode).toBe(400)
    await app.close()
  })

  it('applies a valid event and echoes the result', async () => {
    applyBillingEvent.mockResolvedValue({ applied: true, duplicate: false, burst: { batchId: 'b1', itemCount: 4 } })
    const app = await build()
    const res = await app.inject({ method: 'POST', url: URL, headers: HEADERS, payload: { type: 'payment_cleared' } })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toMatchObject({ received: true, applied: true, duplicate: false, burst: { batchId: 'b1' } })
    expect(applyBillingEvent).toHaveBeenCalledWith('acct_1', 'payment_cleared', expect.objectContaining({ type: 'payment_cleared' }))
    await app.close()
  })

  it('reports duplicates without applying', async () => {
    applyBillingEvent.mockResolvedValue({ applied: false, duplicate: true })
    const app = await build()
    const res = await app.inject({ method: 'POST', url: URL, headers: HEADERS, payload: { type: 'payment_failed' } })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toMatchObject({ received: true, applied: false, duplicate: true })
    await app.close()
  })
})
