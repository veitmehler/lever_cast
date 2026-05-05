/**
 * SVG → PNG rasterizer using @resvg/resvg-js.
 *
 * Pure-Node native binding — no libvips required.
 * 5–10× faster than Sharp for SVG→PNG specifically.
 *
 * NOTE: resvg is a pure-SVG renderer and cannot render <foreignObject> content
 * (which requires an HTML/CSS layout engine).  Mermaid's defaults emit text
 * inside <foreignObject>, which would rasterize as empty boxes.  We force
 * `htmlLabels: false` in mermaid-config.json so labels are emitted as native
 * SVG <text> elements that resvg renders correctly.
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
      // Must be a single concrete family name — not a CSS comma-separated fallback.
      // font-liberation (Alpine package) installs Liberation Sans, the open-source
      // metric-compatible equivalent of Arial.
      defaultFontFamily: 'Liberation Sans',
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
