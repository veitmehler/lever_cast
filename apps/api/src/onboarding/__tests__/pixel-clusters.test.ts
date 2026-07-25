import { describe, it, expect } from 'vitest'
import sharp from 'sharp'
import { pixelClusters } from '../site-analysis'

/**
 * Parker bench finding: a button's worth of vivid color (~1-2% of page area)
 * must survive into the cluster evidence despite acres of white — the
 * saturation-weighted histogram guarantees it.
 */
describe('pixelClusters', () => {
  it('keeps a tiny vivid button color as evidence', async () => {
    // 200x200 white page with a 24x12 orange "button" (~0.7% of the area) and
    // a large soft-grey band (to fill broad clusters with neutrals).
    const png = await sharp({
      create: { width: 200, height: 200, channels: 3, background: '#ffffff' },
    })
      .composite([
        {
          input: await sharp({ create: { width: 200, height: 60, channels: 3, background: '#eeeeee' } }).png().toBuffer(),
          top: 120,
          left: 0,
        },
        {
          input: await sharp({ create: { width: 24, height: 12, channels: 3, background: '#e8620a' } }).png().toBuffer(),
          top: 30,
          left: 30,
        },
      ])
      .png()
      .toBuffer()

    const clusters = await pixelClusters(png)
    const near = (a: string, b: string) => {
      const na = parseInt(a.slice(1), 16)
      const nb = parseInt(b.slice(1), 16)
      const d = Math.sqrt(
        (((na >> 16) & 255) - ((nb >> 16) & 255)) ** 2 +
          (((na >> 8) & 255) - ((nb >> 8) & 255)) ** 2 +
          ((na & 255) - (nb & 255)) ** 2,
      )
      return d < 60
    }
    expect(clusters.some((c) => near(c.hex, '#e8620a'))).toBe(true)
    // Ground still dominates by coverage.
    expect(near(clusters[0].hex, '#ffffff')).toBe(true)
  })
})
