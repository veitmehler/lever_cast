import { describe, it, expect } from 'vitest'
import { hemisphereForCountry, isEdgeCountry } from '../hemisphere'

describe('hemisphereForCountry', () => {
  it('maps clearly-southern countries to south, not edge', () => {
    for (const c of ['AU', 'NZ', 'AR', 'ZA', 'CL']) {
      expect(hemisphereForCountry(c)).toEqual({ hemisphere: 'south', edge: false })
    }
  })

  it('maps clearly-northern (and unknown) countries to north, not edge', () => {
    for (const c of ['US', 'GB', 'DE', 'JP', 'ZZ']) {
      expect(hemisphereForCountry(c)).toEqual({ hemisphere: 'north', edge: false })
    }
  })

  it('marks equator-straddling countries as edge with a majority default', () => {
    expect(hemisphereForCountry('BR')).toEqual({ hemisphere: 'south', edge: true })
    expect(hemisphereForCountry('CO')).toEqual({ hemisphere: 'north', edge: true })
    expect(hemisphereForCountry('ID')).toEqual({ hemisphere: 'south', edge: true })
  })

  it('is case- and whitespace-insensitive', () => {
    expect(hemisphereForCountry(' br ')).toEqual({ hemisphere: 'south', edge: true })
    expect(hemisphereForCountry('au')).toEqual({ hemisphere: 'south', edge: false })
  })

  it('defaults empty/null to north (caller treats missing country separately)', () => {
    expect(hemisphereForCountry('')).toEqual({ hemisphere: 'north', edge: false })
    expect(hemisphereForCountry(null)).toEqual({ hemisphere: 'north', edge: false })
  })
})

describe('isEdgeCountry', () => {
  it('is true only for equator-straddling countries', () => {
    expect(isEdgeCountry('BR')).toBe(true)
    expect(isEdgeCountry('co')).toBe(true)
    expect(isEdgeCountry('AU')).toBe(false)
    expect(isEdgeCountry('US')).toBe(false)
    expect(isEdgeCountry(null)).toBe(false)
  })
})
