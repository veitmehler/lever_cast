import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

// No Oxylabs creds → these tests exercise the direct-HEAD fallback path.
vi.mock('../../lib/oxylabs-auth', () => ({
  getOxylabsSerpAuth: vi.fn().mockResolvedValue(null),
  basicAuthHeader: (c: { username: string; password: string }) =>
    `Basic ${Buffer.from(`${c.username}:${c.password}`).toString('base64')}`,
}))

import { extractCitationsForValidation, validateCitationUrls } from '../citation-validator'

describe('extractCitationsForValidation', () => {
  it('returns [] for empty or malformed JSON', () => {
    expect(extractCitationsForValidation('')).toEqual([])
    expect(extractCitationsForValidation('not json')).toEqual([])
  })

  it('reads a bare array shape', () => {
    const raw = JSON.stringify([{ title: 'A', url: 'https://a.com' }])
    expect(extractCitationsForValidation(raw)).toEqual([{ title: 'A', url: 'https://a.com' }])
  })

  it('reads the { resource_links: [...] } shape', () => {
    const raw = JSON.stringify({ resource_links: [{ link_title: 'B', link_url: 'https://b.com' }] })
    expect(extractCitationsForValidation(raw)).toEqual([{ title: 'B', url: 'https://b.com' }])
  })

  it('reads the { links: [...] } shape', () => {
    const raw = JSON.stringify({ links: [{ sourceTitle: 'C', sourceUrl: 'https://c.com' }] })
    expect(extractCitationsForValidation(raw)).toEqual([{ title: 'C', url: 'https://c.com' }])
  })

  it('filters out entries whose url is not http(s)', () => {
    const raw = JSON.stringify([
      { title: 'ok', url: 'https://ok.com' },
      { title: 'bad', url: 'ftp://nope.com' },
      { title: 'empty', url: '' },
    ])
    expect(extractCitationsForValidation(raw)).toEqual([{ title: 'ok', url: 'https://ok.com' }])
  })
})

describe('validateCitationUrls (direct HEAD path, no OxyLabs)', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Force the direct-HEAD branch.
    vi.stubEnv('OXYLABS_USERNAME', '')
    vi.stubEnv('OXYLABS_PASSWORD', '')
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('returns [] without calling fetch when there are no citations', async () => {
    const out = await validateCitationUrls([], 'job1')
    expect(out).toEqual([])
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('classifies HTTP statuses into valid / uncertain / dead', async () => {
    const citations = [
      { title: '200', url: 'https://ok.com' },
      { title: '404', url: 'https://gone.com' },
      { title: '403', url: 'https://blocked.com' },
      { title: '500', url: 'https://broken.com' },
    ]
    fetchMock.mockImplementation((url: string) => {
      const map: Record<string, number> = {
        'https://ok.com': 200,
        'https://gone.com': 404,
        'https://blocked.com': 403,
        'https://broken.com': 500,
      }
      return Promise.resolve({ status: map[url] } as Response)
    })

    const out = await validateCitationUrls(citations, 'job1')
    const byUrl = Object.fromEntries(out.map((c) => [c.url, c.status]))
    expect(byUrl['https://ok.com']).toBe('valid')
    expect(byUrl['https://gone.com']).toBe('dead')
    expect(byUrl['https://blocked.com']).toBe('uncertain')
    expect(byUrl['https://broken.com']).toBe('uncertain')
  })

  it('treats a thrown fetch (network error / timeout) as uncertain and keeps the citation', async () => {
    fetchMock.mockRejectedValue(new Error('timeout'))
    const out = await validateCitationUrls([{ title: 'x', url: 'https://x.com' }], 'job1')
    expect(out).toEqual([{ title: 'x', url: 'https://x.com', status: 'uncertain' }])
  })

  it('issues a HEAD request per citation', async () => {
    fetchMock.mockResolvedValue({ status: 200 } as Response)
    await validateCitationUrls([{ title: 'x', url: 'https://x.com' }], 'job1')
    const init = fetchMock.mock.calls[0][1] as { method: string }
    expect(init.method).toBe('HEAD')
  })
})
