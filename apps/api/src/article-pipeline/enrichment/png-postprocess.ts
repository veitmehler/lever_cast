/**
 * Tight crop + square padding for Puppeteer screenshots (diagram PNG export).
 */

import sharp from 'sharp'

const PIXEL_THRESHOLD = 20

function hexToRgb(hex: string): [number, number, number] {
  const n = hex.replace(/^#/, '').trim()
  if (n.length === 3) {
    const r = Number.parseInt(n[0] + n[0], 16)
    const g = Number.parseInt(n[1] + n[1], 16)
    const b = Number.parseInt(n[2] + n[2], 16)
    return [r, g, b]
  }
  const r = Number.parseInt(n.slice(0, 2), 16)
  const g = Number.parseInt(n.slice(2, 4), 16)
  const b = Number.parseInt(n.slice(4, 6), 16)
  return [r, g, b]
}

/** Remove transparent margins by scanning bounding box vs background RGB. */
export async function cropToContent(pngBuffer: Buffer, bgHex: string): Promise<Buffer> {
  const [bgR, bgG, bgB] = hexToRgb(bgHex)

  const { data, info } = await sharp(pngBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const ch = info.channels
  const w = info.width
  const h = info.height

  function isContent(idx: number): boolean {
    const a = ch === 4 ? data[idx + 3] : 255
    if (a < 24) return false
    const r = data[idx]
    const g = data[idx + 1]
    const b = data[idx + 2]
    return (
      Math.abs(r - bgR) > PIXEL_THRESHOLD ||
      Math.abs(g - bgG) > PIXEL_THRESHOLD ||
      Math.abs(b - bgB) > PIXEL_THRESHOLD
    )
  }

  let firstRow = -1
  outerTop: for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * ch
      if (isContent(idx)) {
        firstRow = y
        break outerTop
      }
    }
  }

  if (firstRow === -1) return pngBuffer

  let lastRow = firstRow
  outerBottom: for (let y = h - 1; y >= firstRow; y--) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * ch
      if (isContent(idx)) {
        lastRow = y
        break outerBottom
      }
    }
  }

  let leftCol = 0
  outerLeft: for (let x = 0; x < w; x++) {
    for (let y = firstRow; y <= lastRow; y++) {
      const idx = (y * w + x) * ch
      if (isContent(idx)) {
        leftCol = x
        break outerLeft
      }
    }
  }

  let rightCol = leftCol
  outerRight: for (let x = w - 1; x >= leftCol; x--) {
    for (let y = firstRow; y <= lastRow; y++) {
      const idx = (y * w + x) * ch
      if (isContent(idx)) {
        rightCol = x
        break outerRight
      }
    }
  }

  const cropW = Math.max(1, rightCol - leftCol + 1)
  const cropH = Math.max(1, lastRow - firstRow + 1)

  return sharp(pngBuffer).extract({ left: leftCol, top: firstRow, width: cropW, height: cropH }).png().toBuffer()
}

/** Center content on square canvas with `marginPctPerSide`% padding on each side (vs max(width,height)). */
export async function squarePad(
  pngBuffer: Buffer,
  bgHex: string,
  marginPctPerSide = 5,
): Promise<{ png: Buffer; size: number }> {
  const meta = await sharp(pngBuffer).metadata()
  const w = meta.width ?? 1
  const h = meta.height ?? 1
  const maxDim = Math.max(w, h)
  const multiplier = 1 + (2 * marginPctPerSide) / 100
  const size = Math.max(2, Math.ceil(maxDim * multiplier))
  const padX = Math.floor((size - w) / 2)
  const padY = Math.floor((size - h) / 2)

  const [r, g, b] = hexToRgb(bgHex)

  const png = await sharp({
    create: {
      width: size,
      height: size,
      channels: 3,
      background: { r, g, b },
    },
  })
    .composite([{ input: pngBuffer, left: padX, top: padY }])
    .png()
    .toBuffer()

  return { png, size }
}

/** Crop to non-background pixels, then composite onto a centered square canvas. */
export async function postprocessDiagramPng(
  rawPng: Buffer,
  bgHex: string,
  marginPctPerSide = 5,
): Promise<{ png: Buffer; width: number; height: number }> {
  const cropped = await cropToContent(rawPng, bgHex)
  const { png, size } = await squarePad(cropped, bgHex, marginPctPerSide)
  return { png, width: size, height: size }
}
