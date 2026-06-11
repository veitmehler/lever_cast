import { describe, it, expect, vi, beforeEach } from 'vitest'

const captureException = vi.fn()
vi.mock('../sentry', () => ({ Sentry: { captureException: (...a: unknown[]) => captureException(...a) } }))

import { handleError } from '../error-handler'

function fakeReplyAndReq() {
  const sent: { status?: number; body?: unknown } = {}
  const reply = {
    status(code: number) {
      sent.status = code
      return this
    },
    send(body: unknown) {
      sent.body = body
      return this
    },
  }
  const request = { log: { error: vi.fn() } }
  return { reply, request, sent }
}

beforeEach(() => vi.clearAllMocks())

describe('handleError', () => {
  it('returns a generic message for unhandled 500s (hides internal detail)', () => {
    const { reply, request, sent } = fakeReplyAndReq()
    const err = Object.assign(new Error('connection string secret leaked'), {})
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleError(err as any, request as any, reply as any)

    expect(sent.status).toBe(500)
    expect(sent.body).toEqual({ error: 'Internal Server Error' })
    expect(captureException).toHaveBeenCalledOnce()
  })

  it('preserves the message for intentional 4xx errors', () => {
    const { reply, request, sent } = fakeReplyAndReq()
    const err = Object.assign(new Error('rawIdea is required'), { statusCode: 400 })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleError(err as any, request as any, reply as any)

    expect(sent.status).toBe(400)
    expect(sent.body).toEqual({ error: 'rawIdea is required' })
  })

  it('treats explicit 5xx status codes as generic too', () => {
    const { reply, request, sent } = fakeReplyAndReq()
    const err = Object.assign(new Error('upstream blew up'), { statusCode: 502 })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleError(err as any, request as any, reply as any)

    expect(sent.status).toBe(502)
    expect(sent.body).toEqual({ error: 'Internal Server Error' })
  })
})
