/**
 * Turn one uploaded logo into clean light (white) + dark (navy) transparent PNGs.
 *
 * We derive an alpha MASK of the logo, then recolour it — no generative redraw,
 * so the exact wordmark, sub-text (e.g. "KAWANA"), and thin lines are preserved
 * (a spike showed Nano Banana intermittently dropped fine elements). The mask:
 *   1. if the upload already has transparency → use its own alpha,
 *   2. else if it sits on a near-uniform solid background → key that colour out,
 *   3. else (complex background) → fall back to fal background removal (birefnet).
 * Then recolour to white / navy via the alpha, crop to content, upload.
 */
import sharp from 'sharp'
import { downloadImageFromUrl, uploadBufferWithKey, deleteOldVersions } from '@socioply/shared'
import { getSystemApiKey } from '../lib/system-keys'
import { vtoken } from './image-overlay'
import { logger } from '../lib/logger'

export interface ProcessedLogo {
  lightUrl: string
  darkUrl: string
}

interface BBox { left: number; top: number; width: number; height: number }
interface Mask { alpha: Buffer; width: number; height: number }

// Distance→alpha knee: < FLOOR transparent (the background), >= FULL fully opaque
// (logo content), smooth toe between for clean anti-aliased edges.
const FLOOR = 10
const FULL = 70
const keyCurve = (dist: number): number =>
  dist <= FLOOR ? 0 : dist >= FULL ? 255 : Math.round(((dist - FLOOR) * 255) / (FULL - FLOOR))

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return { r: 1, g: 19, b: 40 }
  const n = parseInt(m[1], 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

/** Background removal via fal birefnet → transparent PNG buffer (complex-bg fallback). */
async function birefnetCutout(sourceUrl: string): Promise<Buffer> {
  const falKey = await getSystemApiKey('fal-ai')
  if (!falKey) throw new Error('fal-ai key not configured (needed for logo background removal)')
  const res = await fetch('https://fal.run/fal-ai/birefnet', {
    method: 'POST',
    headers: { Authorization: `Key ${falKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_url: sourceUrl }),
  })
  if (!res.ok) throw new Error(`birefnet ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const data = (await res.json()) as { image?: { url?: string } }
  if (!data.image?.url) throw new Error('birefnet returned no image')
  return downloadImageFromUrl(data.image.url)
}

/** Build the logo alpha mask from a source buffer + URL (URL only used for the fal fallback). */
async function buildMask(srcBuf: Buffer, sourceUrl: string): Promise<Mask> {
  const { data, info } = await sharp(srcBuf).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width, height } = info
  const n = width * height
  const a = Buffer.alloc(n)

  // 1. Already transparent → trust the designer's alpha.
  let transparent = 0
  for (let p = 0; p < n; p++) if (data[p * 4 + 3] < 240) transparent++
  if (transparent > n * 0.02) {
    for (let p = 0; p < n; p++) a[p] = data[p * 4 + 3]
    return { alpha: a, width, height }
  }

  // 2. Near-uniform solid background → key it out.
  const corner = (x: number, y: number) => {
    const i = (y * width + x) * 4
    return [data[i], data[i + 1], data[i + 2]] as const
  }
  const cs = [corner(1, 1), corner(width - 2, 1), corner(1, height - 2), corner(width - 2, height - 2)]
  const ch = (k: number) => Math.max(...cs.map((c) => c[k])) - Math.min(...cs.map((c) => c[k]))
  const uniform = ch(0) < 24 && ch(1) < 24 && ch(2) < 24
  if (uniform) {
    const bg = [
      Math.round(cs.reduce((s, c) => s + c[0], 0) / 4),
      Math.round(cs.reduce((s, c) => s + c[1], 0) / 4),
      Math.round(cs.reduce((s, c) => s + c[2], 0) / 4),
    ]
    for (let p = 0; p < n; p++) {
      const i = p * 4
      const dist = Math.max(
        Math.abs(data[i] - bg[0]),
        Math.abs(data[i + 1] - bg[1]),
        Math.abs(data[i + 2] - bg[2]),
      )
      a[p] = keyCurve(dist)
    }
    return { alpha: a, width, height }
  }

  // 3. Complex background → fal birefnet, then use its alpha.
  logger.info('[newsletter/logo-process] complex background → birefnet fallback')
  const cut = await birefnetCutout(sourceUrl)
  const { data: cd, info: ci } = await sharp(cut).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const cn = ci.width * ci.height
  const ca = Buffer.alloc(cn)
  for (let p = 0; p < cn; p++) ca[p] = cd[p * 4 + 3]
  return { alpha: ca, width: ci.width, height: ci.height }
}

function alphaBBox({ alpha, width, height }: Mask): BBox {
  let minX = width, minY = height, maxX = -1, maxY = -1
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (alpha[y * width + x] > 8) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  if (maxX < 0) return { left: 0, top: 0, width, height }
  return { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 }
}

/** Solid-colour RGBA from the mask, cropped to content (two passes — sharp can't extract+joinChannel in one). */
async function recolor(mask: Mask, rgb: { r: number; g: number; b: number }, bbox: BBox): Promise<Buffer> {
  const { width, height, alpha } = mask
  const solid = await sharp({ create: { width, height, channels: 3, background: rgb } }).raw().toBuffer()
  const composed = await sharp(solid, { raw: { width, height, channels: 3 } })
    .joinChannel(alpha, { raw: { width, height, channels: 1 } })
    .png()
    .toBuffer()
  return sharp(composed).extract(bbox).png().toBuffer()
}

/**
 * Generate + store light/dark transparent variants from a source logo URL.
 * `darkHex` is the colour of the dark variant (for light backgrounds).
 */
export async function processLogo(
  userId: string,
  sourceUrl: string,
  darkHex = '#011328',
  // Storage key prefix. Defaults to the newsletter location; callers that store
  // variants elsewhere (e.g. diagram watermarks) pass a distinct base so
  // deleteOldVersions never prunes another feature's logo objects.
  keyBase = `newsletter/logos/${userId}`,
): Promise<ProcessedLogo> {
  const srcBuf = await downloadImageFromUrl(sourceUrl)
  const mask = await buildMask(srcBuf, sourceUrl)
  const bbox = alphaBBox(mask)

  const lightBuf = await recolor(mask, { r: 255, g: 255, b: 255 }, bbox)
  const darkBuf = await recolor(mask, hexToRgb(darkHex), bbox)

  const base = keyBase
  const lightKey = `${base}-light-${vtoken()}.png`
  const darkKey = `${base}-dark-${vtoken()}.png`
  const [{ url: lightUrl }, { url: darkUrl }] = await Promise.all([
    uploadBufferWithKey(lightKey, lightBuf, 'image/png'),
    uploadBufferWithKey(darkKey, darkBuf, 'image/png'),
  ])
  await deleteOldVersions(`${base}-light-`, lightKey)
  await deleteOldVersions(`${base}-dark-`, darkKey)

  logger.info({ userId }, '[newsletter/logo-process] generated light + dark variants')
  return { lightUrl, darkUrl }
}
