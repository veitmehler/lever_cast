import { describe, it, expect } from 'vitest'
import { sanitizeGeoQuestion } from '../geo-question-sanitizer'

describe('sanitizeGeoQuestion', () => {
  it('returns null for nullish / "null" / empty input', () => {
    expect(sanitizeGeoQuestion(null)).toBeNull()
    expect(sanitizeGeoQuestion(undefined)).toBeNull()
    expect(sanitizeGeoQuestion('null')).toBeNull()
    expect(sanitizeGeoQuestion('   ')).toBeNull()
  })

  it('returns null for questions shorter than 15 chars', () => {
    expect(sanitizeGeoQuestion('Too short?')).toBeNull()
  })

  it('returns null for text that appears truncated mid-word', () => {
    // ends on a long letter-only word with no complete suffix and no punctuation
    expect(sanitizeGeoQuestion('How do I optimize my websi')).toBeNull()
  })

  it('capitalises and appends a question mark for an interrogative without punctuation', () => {
    expect(sanitizeGeoQuestion('how can I improve my writing')).toBe('How can I improve my writing?')
  })

  it('does not double up an existing question mark', () => {
    expect(sanitizeGeoQuestion('What is the fastest route?')).toBe('What is the fastest route?')
  })

  it('strips wrapping quotes', () => {
    expect(sanitizeGeoQuestion('"What is the fastest route?"')).toBe('What is the fastest route?')
  })

  it('leaves a complete non-interrogative statement without forcing a "?"', () => {
    // ends in a complete-suffix word, not interrogative → no '?' appended, just capitalised
    expect(sanitizeGeoQuestion('the system handles scaling')).toBe('The system handles scaling')
  })
})
