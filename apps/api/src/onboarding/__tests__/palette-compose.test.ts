import { describe, it, expect } from 'vitest'
import {
  composePalette,
  contrastRatio,
  relLuminance,
  adjustForContrast,
  normalizeHex,
  hexToHsl,
  type BrandInventory,
} from '../palette-compose'

// Coast Chiropractic (the motivating live case, 2026-07-24): cream ground,
// navy/slate/gold mains, light blue + green supporting bands.
const COAST: BrandInventory = {
  colors: [
    { hex: '#f7f1e3', name: 'cream', prominence: 'ground', observedRoles: ['nav_background', 'hero_background'], coverage: 0.42 },
    { hex: '#2e4a5f', name: 'navy', prominence: 'main', observedRoles: ['hero_background', 'band'], coverage: 0.2 },
    { hex: '#3d5a6c', name: 'slate', prominence: 'main', observedRoles: ['button_fill'], coverage: 0.05 },
    { hex: '#f2cc54', name: 'gold', prominence: 'main', observedRoles: ['band', 'icon_accent'], coverage: 0.06 },
    { hex: '#99c9d3', name: 'light blue', prominence: 'supporting', observedRoles: ['band'], coverage: 0.05 },
    { hex: '#3d5f4a', name: 'green', prominence: 'supporting', observedRoles: ['band'], coverage: 0.04 },
  ],
}

describe('color math', () => {
  it('computes WCAG luminance/contrast (white vs black = 21)', () => {
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 0)
    expect(relLuminance('#ffffff')).toBeCloseTo(1, 5)
  })

  it('normalizes 3- and 6-digit hex, rejects junk', () => {
    expect(normalizeHex('FA0')).toBe('#ffaa00')
    expect(normalizeHex('#F7F1E3')).toBe('#f7f1e3')
    expect(normalizeHex('rgb(1,2,3)')).toBeNull()
  })

  it('darkens within hue until contrast target is met', () => {
    const adj = adjustForContrast('#99c9d3', '#f7f1e3', 4.5)
    expect(adj).not.toBeNull()
    expect(contrastRatio(adj!.hex, '#f7f1e3')).toBeGreaterThanOrEqual(4.5)
    // Hue preserved (within a few degrees).
    const dh = Math.abs(hexToHsl(adj!.hex).h - hexToHsl('#99c9d3').h)
    expect(Math.min(dh, 360 - dh)).toBeLessThan(8)
  })

  it('returns as-is when contrast already passes', () => {
    expect(adjustForContrast('#3d5a6c', '#f7f1e3', 4.5)).toEqual({ hex: '#3d5a6c', deltaL: 0 })
  })
})

describe('composePalette — Coast fixture', () => {
  const p = composePalette(COAST)

  it('grounds on the cream and keeps the cream nav as header', () => {
    expect(p.bodyBackground).toBe('#f7f1e3')
    expect(p.headerBackground).toBe('#f7f1e3')
  })

  it('keeps the observed slate button (readable label)', () => {
    expect(p.button).toBe('#3d5a6c')
  })

  it('never ships a link color that fails 4.5:1 on the body', () => {
    expect(contrastRatio(p.accent!, p.bodyBackground!)).toBeGreaterThanOrEqual(4.5)
  })

  it('prefers an extracted passing color over heavy darkening (gold cannot win as-is)', () => {
    // Gold at 2:1 must not survive as the link color.
    expect(p.accent!.toLowerCase()).not.toBe('#f2cc54')
  })

  it('offers pre-validated alternates for links', () => {
    expect(p.alternates?.accent?.length).toBeGreaterThan(0)
    for (const alt of p.alternates!.accent!) {
      expect(contrastRatio(alt, p.bodyBackground!)).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('derives two hue-diverse light section tints', () => {
    expect(p.sectionTints).toHaveLength(2)
    for (const t of p.sectionTints!) expect(relLuminance(t)).toBeGreaterThanOrEqual(0.8)
  })

  it('is deterministic', () => {
    expect(composePalette(COAST)).toEqual(p)
  })
})

describe('composePalette — edge cases', () => {
  it('dark-theme site: falls back to a light email ground and readable roles', () => {
    const p = composePalette({
      colors: [
        { hex: '#101418', prominence: 'ground', observedRoles: ['nav_background', 'hero_background'], coverage: 0.6 },
        { hex: '#00e0a4', prominence: 'main', observedRoles: ['button_fill', 'link_text'], coverage: 0.08 },
      ],
    })
    expect(relLuminance(p.bodyBackground!)).toBeGreaterThan(0.8)
    expect(contrastRatio(p.accent!, p.bodyBackground!)).toBeGreaterThanOrEqual(4.5)
  })

  it('monochrome site: still produces a full palette', () => {
    const p = composePalette({
      colors: [
        { hex: '#ffffff', prominence: 'ground', observedRoles: ['nav_background'], coverage: 0.7 },
        { hex: '#22364a', prominence: 'main', observedRoles: ['button_fill', 'hero_background'], coverage: 0.2 },
      ],
    })
    expect(p.accent).toBeTruthy()
    expect(p.button).toBe('#22364a')
    expect(p.sectionTints).toHaveLength(2)
    expect(contrastRatio(p.accent!, p.bodyBackground!)).toBeGreaterThanOrEqual(4.5)
  })

  it('empty inventory: safe fallbacks throughout', () => {
    const p = composePalette({ colors: [] })
    expect(p.bodyBackground).toBe('#ffffff')
    expect(contrastRatio(p.accent!, p.bodyBackground!)).toBeGreaterThanOrEqual(4.5)
    expect(p.sectionTints).toHaveLength(2)
  })
})
