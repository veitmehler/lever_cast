/**
 * AI diagram restyle ("Nano Banana") — Phase 2: logo watermark.
 *
 * Composites a semi-transparent brand logo onto the bottom-right of a stylized
 * diagram. Best-effort: if there's no logo or anything goes wrong, the base
 * image is returned unchanged (branding never fails a diagram).
 */

import sharp from 'sharp'
import { logger } from '../../lib/logger'

export interface LogoOverlayOptions {
  /** Logo width as a fraction of the canvas width. */
  widthRatio?: number
  /** Uniform alpha multiplier applied to the logo (0..1). */
  opacity?: number
  /** Inset from the bottom/right edges as a fraction of the canvas width. */
  marginRatio?: number
}

const DEFAULTS: Required<LogoOverlayOptions> = {
  widthRatio: 0.22,
  opacity: 0.3,
  marginRatio: 0.03,
}

export async function overlayLogo(
  basePng: Buffer,
  logoBuffer: Buffer | null | undefined,
  options: LogoOverlayOptions = {},
): Promise<Buffer> {
  if (!logoBuffer || logoBuffer.length === 0) return basePng
  const { widthRatio, opacity, marginRatio } = { ...DEFAULTS, ...options }

  try {
    const baseMeta = await sharp(basePng).metadata()
    const baseW = baseMeta.width ?? 0
    const baseH = baseMeta.height ?? 0
    if (!baseW || !baseH) return basePng

    const targetW = Math.max(1, Math.round(baseW * widthRatio))

    // Resize the logo to the target width, then fade its alpha uniformly by
    // multiplying the raw alpha channel (matches logo-process.ts's raw-buffer style).
    const { data, info } = await sharp(logoBuffer)
      .resize({ width: targetW, withoutEnlargement: false })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })

    const faded = Buffer.from(data)
    for (let i = 3; i < faded.length; i += 4) {
      faded[i] = Math.round(faded[i] * opacity)
    }
    const fadedLogo = await sharp(faded, {
      raw: { width: info.width, height: info.height, channels: 4 },
    })
      .png()
      .toBuffer()

    const margin = Math.round(baseW * marginRatio)
    const left = Math.max(0, baseW - info.width - margin)
    const top = Math.max(0, baseH - info.height - margin)

    return await sharp(basePng).composite([{ input: fadedLogo, left, top }]).png().toBuffer()
  } catch (err) {
    logger.warn({ err }, '[diagram-logo] overlay failed — returning base image')
    return basePng
  }
}
