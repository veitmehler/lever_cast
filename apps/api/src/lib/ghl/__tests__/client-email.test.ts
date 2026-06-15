import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

import {
  listGhlTags,
  createGhlEmailCampaign,
  scheduleGhlEmailCampaign,
  formatLocalSendAt,
  type GhlEmailMeta,
} from '../client'

const META: GhlEmailMeta = {
  subject: 'Read this',
  fromName: 'Acme',
  fromEmail: 'news@acme.com',
  previewText: 'a quick preview',
}

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
  it('POSTs inline HTML to the email-campaign endpoint and extracts the id', async () => {
    const fetchFn = mockFetch(201, { id: 'camp_123' })
    const result = await createGhlEmailCampaign({
      apiKey: 'key',
      locationId: 'loc1',
      name: 'Promo',
      meta: META,
      bodyHtml: '<p>hi</p>',
      timeZone: 'America/New_York',
      userId: 'user_9',
    })

    expect(result.campaignId).toBe('camp_123')
    const [url, init] = fetchFn.mock.calls[0]
    expect(url).toContain('/emails/public/v2/locations/loc1/campaigns/email-campaign')
    expect(init.method).toBe('POST')
    const body = JSON.parse(init.body)
    expect(body.subject).toBe('Read this')
    expect(body.editorType).toBe('html')
    expect(body.editorContent).toBe('<p>hi</p>')
    expect(body.fromEmail).toBe('news@acme.com')
    expect(body.timeZone).toBe('America/New_York')
    expect(body.userId).toBe('user_9')
    expect(body.emailMeta).toEqual(META)
    // The tag audience is NOT set at create time.
    expect(body.tagIds).toBeUndefined()
    expect(body.recipients).toBeUndefined()
  })

  it('reads the id from data.campaignId too', async () => {
    mockFetch(201, { campaignId: 'camp_xyz' })
    const r = await createGhlEmailCampaign({
      apiKey: 'k', locationId: 'l', name: 'n', meta: META, bodyHtml: 'b', timeZone: 'UTC', userId: 'u',
    })
    expect(r.campaignId).toBe('camp_xyz')
  })

  it('throws when no campaign id is returned', async () => {
    mockFetch(200, { ok: true })
    await expect(
      createGhlEmailCampaign({ apiKey: 'k', locationId: 'l', name: 'n', meta: META, bodyHtml: 'b', timeZone: 'UTC', userId: 'u' }),
    ).rejects.toThrow(/campaign id/i)
  })

  it('surfaces GHL error messages', async () => {
    mockFetch(422, { message: 'sender not verified' })
    await expect(
      createGhlEmailCampaign({ apiKey: 'k', locationId: 'l', name: 'n', meta: META, bodyHtml: 'b', timeZone: 'UTC', userId: 'u' }),
    ).rejects.toThrow('sender not verified')
  })
})

describe('scheduleGhlEmailCampaign', () => {
  it('POSTs scheduleType/recipients/scheduleConfig to the schedule endpoint', async () => {
    const fetchFn = mockFetch(200, { ok: true })
    await scheduleGhlEmailCampaign({
      apiKey: 'key',
      locationId: 'loc1',
      campaignId: 'camp_123',
      meta: META,
      tagIds: ['tag9'],
      timeZone: 'America/New_York',
      userId: 'user_9',
      sendAt: '2026-06-20T09:00:00',
    })

    const [url, init] = fetchFn.mock.calls[0]
    expect(url).toContain('/emails/public/v2/locations/loc1/campaigns/camp_123/schedule')
    expect(init.method).toBe('POST')
    const body = JSON.parse(init.body)
    expect(body.scheduleType).toBe('scheduled')
    expect(body.timeZone).toBe('America/New_York')
    expect(body.userId).toBe('user_9')
    expect(body.recipients).toEqual({ type: 'tag', tagIds: ['tag9'] })
    expect(body.scheduleConfig).toEqual({ sendAt: '2026-06-20T09:00:00' })
    // sendAt must be a local wall-clock string, no Z suffix.
    expect(body.scheduleConfig.sendAt).not.toMatch(/Z$/)
  })
})

describe('formatLocalSendAt', () => {
  it('formats a UTC instant as local wall-clock (no Z) in the given zone', () => {
    // 13:00 UTC = 09:00 EDT on 2026-06-20
    expect(formatLocalSendAt(new Date('2026-06-20T13:00:00.000Z'), 'America/New_York')).toBe('2026-06-20T09:00:00')
  })

  it('handles a positive-offset zone', () => {
    // 04:00 UTC = 09:30 IST
    expect(formatLocalSendAt(new Date('2026-06-20T04:00:00.000Z'), 'Asia/Kolkata')).toBe('2026-06-20T09:30:00')
  })
})
