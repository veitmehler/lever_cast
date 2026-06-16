import { describe, it, expect, vi, beforeEach } from 'vitest'

const { count, findMany, updateMany, sendNewsletterReadyEmail } = vi.hoisted(() => ({
  count: vi.fn(),
  findMany: vi.fn(),
  updateMany: vi.fn(),
  sendNewsletterReadyEmail: vi.fn(),
}))

vi.mock('@socioply/shared', () => ({
  prisma: { newsletter: { count, findMany, updateMany } },
}))
vi.mock('../../lib/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }))
vi.mock('../../lib/alerts', () => ({ sendNewsletterReadyEmail }))

import { newsletterNotifyHandler } from '../newsletter-notify'

type Job = { id: string; data: { userId: string } }
const job = (userId: string): Job => ({ id: 'j1', data: { userId } })

beforeEach(() => {
  count.mockReset()
  findMany.mockReset()
  updateMany.mockReset()
  sendNewsletterReadyEmail.mockReset()
  updateMany.mockResolvedValue({ count: 0 })
  sendNewsletterReadyEmail.mockResolvedValue(true)
})

describe('newsletterNotifyHandler', () => {
  it('does nothing while editions are still in progress', async () => {
    count.mockResolvedValue(2) // still working
    await newsletterNotifyHandler([job('u1')] as never)
    expect(findMany).not.toHaveBeenCalled()
    expect(sendNewsletterReadyEmail).not.toHaveBeenCalled()
  })

  it('does nothing when the batch is done but nothing new to announce', async () => {
    count.mockResolvedValue(0)
    findMany.mockResolvedValue([]) // all already notified
    await newsletterNotifyHandler([job('u1')] as never)
    expect(sendNewsletterReadyEmail).not.toHaveBeenCalled()
    expect(updateMany).not.toHaveBeenCalled()
  })

  it('emails once and marks editions notified when the batch is ready', async () => {
    count.mockResolvedValue(0)
    findMany.mockResolvedValue([{ id: 'n1' }, { id: 'n2' }, { id: 'n3' }])
    await newsletterNotifyHandler([job('u1')] as never)
    expect(sendNewsletterReadyEmail).toHaveBeenCalledWith('u1', 3)
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['n1', 'n2', 'n3'] } },
      data: { notifiedAt: expect.any(Date) },
    })
  })

  it('still marks notified even if the email could not be sent', async () => {
    count.mockResolvedValue(0)
    findMany.mockResolvedValue([{ id: 'n1' }])
    sendNewsletterReadyEmail.mockResolvedValue(false)
    await newsletterNotifyHandler([job('u1')] as never)
    expect(updateMany).toHaveBeenCalled()
  })
})
