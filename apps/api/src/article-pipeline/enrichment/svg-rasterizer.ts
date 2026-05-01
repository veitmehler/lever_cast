/**
 * SVG → PNG rasterizer using @resvg/resvg-js.
 *
 * Pure-Node native binding — no libvips required.
 * Better Mermaid SVG fidelity than Sharp (handles foreignObject text).
 * 5–10× faster than Sharp for SVG→PNG specifically.
 */

import { Resvg } from '@resvg/resvg-js'

export interface RasterizeResult {
  png: Buffer
  width: number
  height: number
}

export function rasterizeSvg(svg: string, targetWidth = 1200): RasterizeResult {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: targetWidth },
    background: '#ffffff',
    font: {
      defaultFontFamily: 'Arial, Helvetica, sans-serif',
      loadSystemFonts: true,
    },
  })

  const rendered = resvg.render()
  return {
    png: rendered.asPng(),
    width: rendered.width,
    height: rendered.height,
  }
}
