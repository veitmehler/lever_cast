import { describe, it, expect } from 'vitest'
import { augmentInventory } from '../site-analysis'
import type { BrandColor } from '../palette-compose'

/**
 * AlignLife bench finding: the LLM can miss a small CTA color entirely. A vivid
 * pixel cluster corroborated by the site's CSS hints is real by two independent
 * sources and gets injected as a role-unknown candidate.
 */
describe('augmentInventory', () => {
  const neutrals: BrandColor[] = [
    { hex: '#ffffff', prominence: 'ground', observedRoles: ['hero_background'], coverage: 0.5 },
    { hex: '#4c4c4c', prominence: 'main', observedRoles: ['band'], coverage: 0.1 },
    { hex: '#060606', prominence: 'main', observedRoles: ['footer_background'], coverage: 0.08 },
  ]

  it('injects a vivid cluster that matches a CSS hint but is missing from the inventory', () => {
    const out = augmentInventory(
      neutrals,
      [
        { hex: '#ffffff', coverage: 0.5 },
        { hex: '#f06018', coverage: 0.008 }, // the missed orange button (quantized)
      ],
      ['#4c4c4c', '#ee5f19', '#ffffff'],
    )
    const orange = out.find((c) => c.hex === '#ee5f19')
    expect(orange).toBeTruthy()
    expect(orange!.prominence).toBe('supporting')
    expect(orange!.observedRoles).toEqual([])
  })

  it('does NOT inject without CSS-hint corroboration (hallucination safety)', () => {
    const out = augmentInventory(neutrals, [{ hex: '#f06018', coverage: 0.008 }], ['#4c4c4c'])
    expect(out).toHaveLength(neutrals.length)
  })

  it('does NOT inject dull or trace-coverage clusters', () => {
    const out = augmentInventory(
      neutrals,
      [
        { hex: '#8a8a7a', coverage: 0.05 }, // dull
        { hex: '#f06018', coverage: 0.0005 }, // vivid but trace
      ],
      ['#8a8a7a', '#ee5f19'],
    )
    expect(out).toHaveLength(neutrals.length)
  })

  it('skips colors already represented in the inventory', () => {
    const withOrange: BrandColor[] = [...neutrals, { hex: '#ef6120', prominence: 'main', observedRoles: ['button_fill'], coverage: 0.01 }]
    const out = augmentInventory(withOrange, [{ hex: '#f06018', coverage: 0.008 }], ['#ee5f19'])
    expect(out).toHaveLength(withOrange.length)
  })
})
