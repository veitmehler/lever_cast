import { describe, it, expect, vi } from 'vitest'

vi.mock('../../../lib/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }))

import sharp from 'sharp'
import { overlayLogo } from '../diagram-logo'

function solidPng(w: number, h: number, color: { r: number; g: number; b: number }): Promise<Buffer> {
  return sharp({ create: { width: w, height: h, channels: 4, background: { ...color, alpha: 1 } } }).png().toBuffer()
}

/** Read a single pixel's RGBA from a PNG buffer. */
async function pixel(buf: Buffer, x: number, y: number): Promise<[number, number, number, number]> {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const idx = (y * info.width + x) * 4
  return [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]]
}

describe('overlayLogo', () => {
  it('returns the base unchanged when no logo is given', async () => {
    const base = await solidPng(100, 100, { r: 255, g: 255, b: 255 })
    expect(await overlayLogo(base, null)).toBe(base)
    expect(await overlayLogo(base, Buffer.alloc(0))).toBe(base)
  })

  it('preserves the base canvas size', async () => {
    const base = await solidPng(200, 200, { r: 255, g: 255, b: 255 })
    const logo = await solidPng(80, 80, { r: 255, g: 0, b: 0 })
    const out = await overlayLogo(base, logo)
    const meta = await sharp(out).metadata()
    expect(meta.width).toBe(200)
    expect(meta.height).toBe(200)
  })

  it('places a faded logo bottom-right and leaves the top-left clear', async () => {
    const base = await solidPng(100, 100, { r: 255, g: 255, b: 255 })
    const logo = await solidPng(50, 50, { r: 255, g: 0, b: 0 })
    // widthRatio 0.22 → 22px logo; margin 3px → occupies ~[75..97]².
    const out = await overlayLogo(base, logo, { widthRatio: 0.22, opacity: 0.4, marginRatio: 0.03 })

    const [, tg, tb] = await pixel(out, 5, 5)
    expect(tg).toBe(255) // top-left still white
    expect(tb).toBe(255)

    // Bottom-right pixel: red logo at 40% over white → ~(255, 153, 153).
    const [br, bg, bbl] = await pixel(out, 85, 85)
    expect(br).toBe(255)
    expect(bg).toBeGreaterThan(110)
    expect(bg).toBeLessThan(200)
    expect(bbl).toBeLessThan(200) // not pure white → logo present
  })

  it('returns the base image on a malformed logo buffer', async () => {
    const base = await solidPng(60, 60, { r: 255, g: 255, b: 255 })
    const out = await overlayLogo(base, Buffer.from('not-an-image'))
    expect(out).toBe(base)
  })
})
