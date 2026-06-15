import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

import { listGhlTags, createGhlEmailCampaign, scheduleGhlEmailCampaign } from '../client'

function mockFetch(status: number, body: unknown) {
  const fn = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  })
  vi.stubGlobal('fetch', fn)
  return fn
}

beforeEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('listGhlTags', () => {
  it('GETs the location tags endpoint and returns the tags array', async () => {
    const fetchFn = mockFetch(200, { tags: [{ id: 't1', name: 'VIP' }, { id: 't2', name: 'Newsletter' }] })
    const tags = await listGhlTags('key', 'loc1')

    expect(tags).toEqual([{ id: 't1', name: 'VIP' }, { id: 't2', name: 'Newsletter' }])
    const [url, init] = fetchFn.mock.calls[0]
    expect(url).toContain('/locations/loc1/tags')
    expect(init.method).toBe('GET')
    expect(init.headers.Authorization).toBe('Bearer key')
  })

  it('tolerates a bare array response', async () => {
    mockFetch(200, [{ id: 't1', name: 'VIP' }])
    expect(await listGhlTags('key', 'loc1')).toEqual([{ id: 't1', name: 'VIP' }])
  })
})

describe('createGhlEmailCampaign', () => {
  it('POSTs subject/html/tag and extracts the campaign id', async () => {
    const fetchFn = mockFetch(201, { campaign: { id: 'camp_123' } })
    const result = await createGhlEmailCampaign({
      apiKey: 'key',
      locationId: 'loc1',
      name: 'Promo',
      subject: 'Read this',
      bodyHtml: '<p>hi</p>',
      tagId: 'tag9',
      fromName: 'Acme',
    })

    expect(result.campaignId).toBe('camp_123')
    const [url, init] = fetchFn.mock.calls[0]
    expect(url).toContain('/emails/public/v2/locations/loc1/campaigns')
    expect(init.method).toBe('POST')
    const body = JSON.parse(init.body)
    expect(body.subject).toBe('Read this')
    expect(body.html).toBe('<p>hi</p>')
    expect(body.tagIds).toEqual(['tag9'])
    expect(body.fromName).toBe('Acme')
  })

  it('throws when no campaign id is returned', async () => {
    mockFetch(200, { ok: true })
    await expect(
      createGhlEmailCampaign({ apiKey: 'k', locationId: 'l', name: 'n', subject: 's', bodyHtml: 'b', tagId: 't' }),
    ).rejects.toThrow(/campaign id/i)
  })

  it('surfaces GHL error messages', async () => {
    mockFetch(422, { message: 'sender not verified' })
    await expect(
      createGhlEmailCampaign({ apiKey: 'k', locationId: 'l', name: 'n', subject: 's', bodyHtml: 'b', tagId: 't' }),
    ).rejects.toThrow('sender not verified')
  })
})

describe('scheduleGhlEmailCampaign', () => {
  it('POSTs the schedule timestamp to the campaign schedule endpoint', async () => {
    const fetchFn = mockFetch(200, { ok: true })
    await scheduleGhlEmailCampaign('key', 'loc1', 'camp_123', '2026-06-20T13:00:00.000Z')

    const [url, init] = fetchFn.mock.calls[0]
    expect(url).toContain('/emails/public/v2/locations/loc1/campaigns/camp_123/schedule')
    expect(init.method).toBe('POST')
    const body = JSON.parse(init.body)
    expect(body.scheduleTimestamp).toBe('2026-06-20T13:00:00.000Z')
  })
})
