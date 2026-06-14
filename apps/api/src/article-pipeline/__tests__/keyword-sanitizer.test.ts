import { describe, it, expect, vi } from 'vitest'

// Keep the pino logger quiet — these are pure-transform tests.
vi.mock('../../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

import { sanitizeKeywordPhrase, sanitizeKeywordJson, sanitizeKeywordText } from '../keyword-sanitizer'

describe('sanitizeKeywordPhrase', () => {
  it.each([
    ['plumbers near me', 'plumbers'],
    ['coffee shops near you', 'coffee shops'],
    ['emergency dentist near us', 'emergency dentist'],
    ['locksmith close to me', 'locksmith'],
    ['gyms close by', 'gyms'],
    ['restaurants around me', 'restaurants'],
    ['hardware stores in my area', 'hardware stores'],
    ['vets in my city', 'vets'],
    ['movers in my town', 'movers'],
  ])('strips the local-intent modifier from %j', (input, expected) => {
    expect(sanitizeKeywordPhrase(input)).toBe(expected)
  })

  it('preserves explicit city/state geo qualifiers', () => {
    expect(sanitizeKeywordPhrase('plumbers in Austin')).toBe('plumbers in Austin')
    expect(sanitizeKeywordPhrase('best tacos in Texas')).toBe('best tacos in Texas')
  })

  it('leaves informational phrases untouched', () => {
    expect(sanitizeKeywordPhrase('how to fix a leaky faucet')).toBe('how to fix a leaky faucet')
  })

  it('is case-insensitive', () => {
    expect(sanitizeKeywordPhrase('Plumbers Near Me')).toBe('Plumbers')
  })
})

describe('sanitizeKeywordJson', () => {
  it('cleans string values and string array items, preserving other types', () => {
    const input = {
      primaryKeyword: 'plumbers near me',
      secondary: ['coffee shops near you', 'best coffee', 42],
      count: 7,
      flag: true,
    }
    const out = sanitizeKeywordJson(input)
    expect(out).toEqual({
      primaryKeyword: 'plumbers',
      secondary: ['coffee shops', 'best coffee', 42],
      count: 7,
      flag: true,
    })
  })

  it('does not mutate the input object', () => {
    const input = { k: 'gyms near me' }
    sanitizeKeywordJson(input)
    expect(input.k).toBe('gyms near me')
  })
})

describe('sanitizeKeywordText', () => {
  it('cleans modifier lines while preserving blank lines and leading whitespace', () => {
    const input = '# Heading\n\n  plumbers near me\nbest coffee'
    const out = sanitizeKeywordText(input)
    expect(out).toBe('# Heading\n\n  plumbers\nbest coffee')
  })

  it('returns text unchanged when no line carries a local modifier', () => {
    const input = 'line one\nline two'
    expect(sanitizeKeywordText(input)).toBe(input)
  })
})
