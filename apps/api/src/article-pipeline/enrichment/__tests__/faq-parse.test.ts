import { describe, it, expect } from 'vitest'
import { parseFaqQuestions, parseSecondaryKeywords, pickKeywordForSection } from '../faq-parse'

describe('parseFaqQuestions', () => {
  it('returns [] for empty input', () => {
    expect(parseFaqQuestions('')).toEqual([])
    expect(parseFaqQuestions('   ')).toEqual([])
  })

  it('extracts quoted questions per "# Question N:" block', () => {
    const input = '# Question 1: "What is the best way to learn?"\nblah\n# Question 2: "How do I start today?"'
    expect(parseFaqQuestions(input)).toEqual([
      'What is the best way to learn?',
      'How do I start today?',
    ])
  })

  it('falls back to the first substantial line when no quotes are present', () => {
    const input = '# Question 1:\nWhat is the meaning of life?'
    expect(parseFaqQuestions(input)).toEqual(['What is the meaning of life?'])
  })

  it('de-duplicates repeated questions', () => {
    const input = '# Question 1: "Same question here?"\n# Question 2: "Same question here?"'
    expect(parseFaqQuestions(input)).toEqual(['Same question here?'])
  })
})

describe('parseSecondaryKeywords', () => {
  it('reads the secondary_keywords array and drops empties / "null"', () => {
    expect(parseSecondaryKeywords('{"secondary_keywords":["seo","content","null",""]}')).toEqual(['seo', 'content'])
  })

  it('also accepts the "Secondary Keywords" key', () => {
    expect(parseSecondaryKeywords('{"Secondary Keywords":["growth"]}')).toEqual(['growth'])
  })

  it('returns [] for invalid JSON or a missing field', () => {
    expect(parseSecondaryKeywords('not json')).toEqual([])
    expect(parseSecondaryKeywords('{"other":1}')).toEqual([])
  })
})

describe('pickKeywordForSection', () => {
  it('returns the heading when there are no keywords', () => {
    expect(pickKeywordForSection('My Heading', [])).toBe('My Heading')
  })

  it('picks the keyword with the most word overlap with the heading', () => {
    const best = pickKeywordForSection('Machine Learning Basics', ['cooking recipes', 'machine learning intro'])
    expect(best).toBe('machine learning intro')
  })
})
