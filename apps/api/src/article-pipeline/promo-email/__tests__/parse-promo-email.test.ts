import { describe, it, expect, vi } from 'vitest'

vi.mock('@omniply/shared', () => ({ prisma: {} }))
vi.mock('../../llm/factory', () => ({ getLLMAdapter: vi.fn() }))
vi.mock('../../../lib/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }))

import { parsePromoEmail } from '../generate'

describe('parsePromoEmail', () => {
  it('parses strict JSON', () => {
    const out = parsePromoEmail('{"subject":"Hello","bodyHtml":"<p>Body</p>"}', 'fallback')
    expect(out).toEqual({ subject: 'Hello', bodyHtml: '<p>Body</p>' })
  })

  it('parses JSON wrapped in a ```json fence', () => {
    const raw = '```json\n{"subject":"Hi","bodyHtml":"<p>x</p>"}\n```'
    expect(parsePromoEmail(raw, 'fallback')).toEqual({ subject: 'Hi', bodyHtml: '<p>x</p>' })
  })

  it('falls back to first-line subject + remainder body for non-JSON', () => {
    const raw = 'Read our new guide\n<p>Check it out</p>'
    expect(parsePromoEmail(raw, 'fallback')).toEqual({
      subject: 'Read our new guide',
      bodyHtml: '<p>Check it out</p>',
    })
  })

  it('strips a leading "Subject:" label in the fallback path', () => {
    const raw = 'Subject: Big news\n<p>body</p>'
    expect(parsePromoEmail(raw, 'fallback').subject).toBe('Big news')
  })

  it('uses the fallback subject when only a single block of body is present', () => {
    const out = parsePromoEmail('<p>just a body, no subject line break</p>', 'My Article')
    expect(out.subject).toBe('My Article')
    expect(out.bodyHtml).toContain('just a body')
  })
})
