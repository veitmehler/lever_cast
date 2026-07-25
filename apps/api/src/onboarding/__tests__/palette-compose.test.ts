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

  it('grounds on the cream but headers on the navy branding band (not page chrome)', () => {
    expect(p.bodyBackground).toBe('#f7f1e3')
    expect(p.headerBackground).toBe('#2e4a5f')
  })

  it('button is the popping gold, not the site\'s conservative navy', () => {
    // User rule: email CTAs must pop off body AND header — pure vividness wins;
    // yellow is allowed for buttons (dark label text carries it).
    expect(p.button).toBe('#f2cc54')
  })

  it('button label is the dark header ink (white fails on gold)', () => {
    expect(p.buttonText).toBe('#2e4a5f')
    expect(contrastRatio(p.buttonText!, p.button!)).toBeGreaterThanOrEqual(4.5)
  })

  it('the navy stays available as a button alternate', () => {
    expect(p.alternates?.button).toContain('#3d5a6c')
  })

  it('never ships a link color that fails 4.5:1 on the body', () => {
    expect(contrastRatio(p.accent!, p.bodyBackground!)).toBeGreaterThanOrEqual(4.5)
  })

  it('links come from the vivid light blue, darkened within its own hue', () => {
    // User rule: bright-and-alive hue wins; navy is too dull (s < 0.35), gold
    // is yellow-banned — the light blue, slightly darkened, is the link color.
    const srcHue = hexToHsl('#99c9d3').h
    const gotHue = hexToHsl(p.accent!).h
    const dh = Math.abs(gotHue - srcHue)
    expect(Math.min(dh, 360 - dh)).toBeLessThan(8)
  })

  it('links are never yellow/orange family', () => {
    const h = hexToHsl(p.accent!).h
    expect(h < 25 || h > 95).toBe(true)
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

  it('yellow-only brand: buttons may be gold, links never are', () => {
    const p = composePalette({
      colors: [
        { hex: '#ffffff', prominence: 'ground', observedRoles: ['nav_background'], coverage: 0.7 },
        { hex: '#f2b705', prominence: 'main', observedRoles: ['button_fill', 'band', 'icon_accent'], coverage: 0.2 },
      ],
    })
    const h = hexToHsl(p.accent!).h
    expect(h < 25 || h > 95).toBe(true)
    expect(contrastRatio(p.accent!, p.bodyBackground!)).toBeGreaterThanOrEqual(4.5)
    // The button keeps the brand gold (dark label text carries it).
    expect(p.button).toBe('#f2b705')
  })

  it('white site-buttons never yield an invisible button on our body (life.edu bench finding)', () => {
    const p = composePalette({
      colors: [
        { hex: '#ffffff', prominence: 'ground', observedRoles: ['nav_background', 'button_fill'], coverage: 0.6 },
        { hex: '#8dc340', prominence: 'main', observedRoles: ['hero_background', 'band'], coverage: 0.2 },
        { hex: '#036030', prominence: 'main', observedRoles: ['band'], coverage: 0.1 },
      ],
    })
    expect(p.button!.toLowerCase()).not.toBe('#ffffff')
    expect(contrastRatio(p.buttonText!, p.button!)).toBeGreaterThanOrEqual(4.5)
  })

  it('monochrome brands still get two visibly different section tints (thejoint bench finding)', () => {
    const p = composePalette({
      colors: [
        { hex: '#ffffff', prominence: 'ground', observedRoles: ['nav_background'], coverage: 0.6 },
        { hex: '#00b3be', prominence: 'main', observedRoles: ['button_fill', 'band', 'link_text'], coverage: 0.2 },
        { hex: '#00a4af', prominence: 'main', observedRoles: ['band'], coverage: 0.1 },
      ],
    })
    expect(p.sectionTints).toHaveLength(2)
    expect(p.sectionTints![0]).not.toBe(p.sectionTints![1])
  })

  it('warm-vivid brand color loses the header to a dark neutral (ACA bench finding)', () => {
    const p = composePalette({
      colors: [
        { hex: '#ffffff', prominence: 'ground', observedRoles: ['nav_background', 'hero_background'], coverage: 0.5 },
        { hex: '#e52823', prominence: 'main', observedRoles: ['button_fill', 'band', 'link_text'], coverage: 0.1 },
        { hex: '#333333', prominence: 'main', observedRoles: ['button_fill'], coverage: 0.08 },
        // A fringe supporting band must NOT outrank the main dark neutral
        // (second ACA run put a green band in the inventory).
        { hex: '#27ae60', prominence: 'supporting', observedRoles: ['band'], coverage: 0.03 },
      ],
    })
    expect(p.headerBackground).toBe('#333333')
    // Red keeps its life-color jobs: links and CTA.
    expect(hexToHsl(p.accent!).h < 25 || hexToHsl(p.accent!).h > 330).toBe(true)
  })

  it('warm structural loses to a calm structural dark even when mis-tagged as ground (Sherman bench finding)', () => {
    const p = composePalette({
      colors: [
        { hex: '#ffffff', prominence: 'ground', observedRoles: ['nav_background'], coverage: 0.5 },
        { hex: '#9b2743', prominence: 'main', observedRoles: ['button_fill', 'band', 'link_text'], coverage: 0.12 },
        { hex: '#000000', prominence: 'ground', observedRoles: ['footer_background'], coverage: 0.09 },
      ],
    })
    expect(p.headerBackground).toBe('#000000')
  })

  it('a truly red-only brand keeps its red header (brand-true beats taste)', () => {
    const p = composePalette({
      colors: [
        { hex: '#ffffff', prominence: 'ground', observedRoles: ['nav_background'], coverage: 0.6 },
        { hex: '#c62828', prominence: 'main', observedRoles: ['band', 'button_fill'], coverage: 0.2 },
      ],
    })
    expect(p.headerBackground).toBe('#c62828')
  })

  it('brand-consistent button: the site\'s own vivid button wins over a more exotic color (Foot Levelers finding)', () => {
    const p = composePalette({
      colors: [
        { hex: '#ffffff', prominence: 'ground', observedRoles: ['nav_background', 'hero_background'], coverage: 0.5 },
        { hex: '#263857', prominence: 'main', observedRoles: ['footer_background', 'link_text'], coverage: 0.1 },
        { hex: '#32baff', prominence: 'main', observedRoles: ['button_fill', 'icon_accent'], coverage: 0.06 },
        { hex: '#82c341', prominence: 'supporting', observedRoles: ['button_fill'], coverage: 0.03 },
      ],
    })
    // The light blue is the site's primary (main) button and passes all pop
    // gates — it must win even though its hue is near the navy links; link hue
    // is irrelevant to buttons (user rule).
    expect(p.button).toBe('#32baff')
    expect(contrastRatio(p.buttonText!, p.button!)).toBeGreaterThanOrEqual(4.5)
    expect(p.alternates?.button).toContain('#82c341')
  })

  it('deep-but-vivid observed brand button beats a fringe pop color — lightness band is free-choice-only (CMCC finding)', () => {
    const p = composePalette({
      colors: [
        { hex: '#ffffff', prominence: 'ground', observedRoles: ['nav_background', 'hero_background'], coverage: 0.5 },
        { hex: '#4b771c', prominence: 'main', observedRoles: ['band', 'button_fill', 'link_text'], coverage: 0.025 },
        { hex: '#4b2c5e', prominence: 'main', observedRoles: ['hero_background', 'link_text', 'band'], coverage: 0.002 },
        { hex: '#d9782d', prominence: 'main', observedRoles: ['link_text', 'band'], coverage: 0.0006 },
      ],
    })
    // Green: lightness 0.288 (below the free-choice floor) but the SITE uses it
    // as its button, it's vivid, reads white, and pops off body + purple header.
    expect(p.button).toBe('#4b771c')
    expect(p.headerBackground).toBe('#4b2c5e')
    expect(contrastRatio(p.buttonText!, p.button!)).toBeGreaterThanOrEqual(4.5)
  })

  it('hero background outranks a band color for the header (CMCC finding)', () => {
    const p = composePalette({
      colors: [
        { hex: '#fafafa', prominence: 'ground', observedRoles: ['nav_background'], coverage: 0.5 },
        { hex: '#4b771c', prominence: 'main', observedRoles: ['band', 'button_fill', 'link_text'], coverage: 0.1 },
        { hex: '#4d1a4d', prominence: 'main', observedRoles: ['hero_background', 'band', 'link_text'], coverage: 0.1 },
      ],
    })
    expect(p.headerBackground).toBe('#4d1a4d')
  })

  it('dedicated CTA color beats the all-purpose accent for the button (ICPA finding)', () => {
    const p = composePalette({
      colors: [
        { hex: '#002b5c', prominence: 'main', observedRoles: ['nav_background', 'footer_background'], coverage: 0.15 },
        { hex: '#ffffff', prominence: 'ground', observedRoles: ['hero_background', 'band'], coverage: 0.5 },
        { hex: '#2898ed', prominence: 'main', observedRoles: ['button_fill', 'link_text', 'icon_accent'], coverage: 0.08 },
        { hex: '#ffb81c', prominence: 'supporting', observedRoles: ['button_fill'], coverage: 0.02 },
      ],
    })
    // Orange serves buttons ONLY — the brand's true CTA color; blue keeps links.
    expect(p.button).toBe('#ffb81c')
    expect(contrastRatio(p.buttonText!, p.button!)).toBeGreaterThanOrEqual(4.5)
  })

  it('empty inventory: safe fallbacks throughout', () => {
    const p = composePalette({ colors: [] })
    expect(p.bodyBackground).toBe('#ffffff')
    expect(contrastRatio(p.accent!, p.bodyBackground!)).toBeGreaterThanOrEqual(4.5)
    expect(p.sectionTints).toHaveLength(2)
  })
})
