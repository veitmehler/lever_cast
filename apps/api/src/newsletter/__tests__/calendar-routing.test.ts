import { describe, it, expect } from 'vitest'
import { effectiveHemisphere } from '../calendar-routing'

describe('effectiveHemisphere', () => {
  it('returns null when country is missing (country is required)', () => {
    expect(effectiveHemisphere(null, null)).toBeNull()
    expect(effectiveHemisphere('', 'south')).toBeNull()
    expect(effectiveHemisphere('   ', 'north')).toBeNull()
  })

  it('uses the country-derived hemisphere for non-edge countries (override ignored)', () => {
    expect(effectiveHemisphere('AU', null)).toBe('south')
    expect(effectiveHemisphere('US', null)).toBe('north')
    // Override is ignored for clearly-hemisphere'd countries.
    expect(effectiveHemisphere('AU', 'north')).toBe('south')
    expect(effectiveHemisphere('US', 'south')).toBe('north')
  })

  it('honors a valid override only for edge (equator-straddling) countries', () => {
    expect(effectiveHemisphere('BR', null)).toBe('south') // default
    expect(effectiveHemisphere('BR', 'north')).toBe('north') // override applies
    expect(effectiveHemisphere('CO', 'south')).toBe('south') // override applies
  })

  it('ignores invalid override values, falling back to the default', () => {
    expect(effectiveHemisphere('BR', 'sideways')).toBe('south')
    expect(effectiveHemisphere('BR', '')).toBe('south')
  })
})
