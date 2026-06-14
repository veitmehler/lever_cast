import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

import { resolveGroundingUrls, type GroundingSource } from '../grounding-resolver'

const REDIRECT = 'https://vertexaisearch.cloud.google.com/grounding-api-redirect'
const fetchMock = vi.fn()

function redirectResponse(location: string | null, ok = true) {
  return { ok, status: ok ? 302 : 404, headers: { get: (k: string) => (k === 'location' ? location : null) } } as unknown as Response
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => vi.unstubAllGlobals())

describe('resolveGroundingUrls', () => {
  it('returns [] without fetching for an empty source list', async () => {
    expect(await resolveGroundingUrls([], 3, 'job1')).toEqual([])
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('passes a non-redirect URI through unchanged (no fetch)', async () => {
    const sources: GroundingSource[] = [{ title: 'Direct', uri: 'https://direct.com/page' }]
    const out = await resolveGroundingUrls(sources, 5, 'job1')
    expect(out).toEqual([{ title: 'Direct', url: 'https://direct.com/page', step: 5 }])
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('resolves a redirect URI to its Location header', async () => {
    fetchMock.mockResolvedValue(redirectResponse('https://real-source.com/article'))
    const sources: GroundingSource[] = [{ title: 'R', uri: `${REDIRECT}/abc` }]
    const out = await resolveGroundingUrls(sources, 2, 'job1')
    expect(out).toEqual([{ title: 'R', url: 'https://real-source.com/article', step: 2 }])
    const init = fetchMock.mock.calls[0][1] as { redirect: string }
    expect(init.redirect).toBe('manual')
  })

  it('deduplicates sources that resolve to the same URL', async () => {
    fetchMock.mockResolvedValue(redirectResponse('https://same.com'))
    const sources: GroundingSource[] = [
      { title: 'One', uri: `${REDIRECT}/1` },
      { title: 'Two', uri: `${REDIRECT}/2` },
    ]
    const out = await resolveGroundingUrls(sources, 1, 'job1')
    expect(out).toHaveLength(1)
    expect(out[0].url).toBe('https://same.com')
  })

  it('drops a redirect that fails to resolve (no location, not ok)', async () => {
    fetchMock.mockResolvedValue(redirectResponse(null, false))
    const sources: GroundingSource[] = [{ title: 'Dead', uri: `${REDIRECT}/x` }]
    expect(await resolveGroundingUrls(sources, 1, 'job1')).toEqual([])
  })

  it('drops a redirect whose fetch throws, keeping other sources', async () => {
    fetchMock.mockImplementation((url: string) =>
      url.endsWith('/bad')
        ? Promise.reject(new Error('timeout'))
        : Promise.resolve(redirectResponse('https://good.com')),
    )
    const sources: GroundingSource[] = [
      { title: 'Bad', uri: `${REDIRECT}/bad` },
      { title: 'Good', uri: `${REDIRECT}/good` },
    ]
    const out = await resolveGroundingUrls(sources, 1, 'job1')
    expect(out).toEqual([{ title: 'Good', url: 'https://good.com', step: 1 }])
  })
})
