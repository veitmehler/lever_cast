import sharp from 'sharp'
import { fal } from '@fal-ai/client'
import { getSystemApiKey } from '../../lib/system-keys'
import { logger } from '../../lib/logger'
import { generateFeaturedImage } from '../../article-pipeline/image-generation'
import type { SocialBrandTheme } from '../brand-theme'
import { centeredTextLines, escapeXml, wrapText } from '../svg-utils'

export interface CarouselSlidePlan {
  headline: string
  bullets: string[]
  imagePrompt: string
}

export interface CarouselSlideInput {
  slide: CarouselSlidePlan
  slideIndex: number
  totalSlides: number
  brand: SocialBrandTheme
  logoBuffer?: Buffer | null
}

const SLIDE_SIZE = 1080

// ── Title slide (index 0) ────────────────────────────────────────────────────
// Full background image is visible. A dark semi-transparent rounded rectangle
// sits only behind the title text. Small watermark in the bottom-right corner.
function buildTitleSlideOverlaySvg(input: CarouselSlideInput): string {
  const { slide, brand } = input
  const font = escapeXml(brand.fontFamily)
  const fontSize = 58
  const lineHeight = 74
  const maxChars = 22

  const lines = wrapText(slide.headline, maxChars, 5)
  const textBlockHeight = lines.length * lineHeight

  // Box metrics
  const boxPadV = 38
  const boxW = SLIDE_SIZE - 120 // 60px margin each side
  const boxH = textBlockHeight + boxPadV * 2
  const boxX = 60
  // Position box slightly above vertical centre
  const boxY = Math.round((SLIDE_SIZE - boxH) / 2) - 40
  // First text baseline is boxY + top padding + fontSize
  const textStartY = boxY + boxPadV + fontSize

  const textSvg = centeredTextLines(lines, SLIDE_SIZE / 2, textStartY, lineHeight)
  const watermark = escapeXml(brand.organizationName)

  return `<svg width="${SLIDE_SIZE}" height="${SLIDE_SIZE}" xmlns="http://www.w3.org/2000/svg">
  <rect x="${boxX}" y="${boxY}" width="${boxW}" height="${boxH}" rx="6" fill="#000000" fill-opacity="0.65"/>
  <text text-anchor="middle" font-family="${font}" font-size="${fontSize}" font-weight="700" fill="#FFFFFF">
    ${textSvg}
  </text>
  <text x="${SLIDE_SIZE - 32}" y="${SLIDE_SIZE - 28}" text-anchor="end" font-family="${font}" font-size="20" fill="#FFFFFF" opacity="0.6">${watermark}</text>
</svg>`
}

// ── Content slides (index 1+) ─────────────────────────────────────────────────
// Left half: dark overlay + paragraph text (each bullet = one paragraph block).
// Right half: the background image shows naturally — no overlay.
// Slide counter top-right, watermark bottom-right.
function buildContentSlideOverlaySvg(input: CarouselSlideInput): string {
  const { slide, slideIndex, totalSlides, brand } = input
  const font = escapeXml(brand.fontFamily)
  const fontSize = 28
  const lineHeight = 44
  const paragraphGap = 26
  // Left-half text area: from x=52 with ~30px right margin before the mid-point
  const textX = 52
  const maxChars = 30 // ~460px usable width at 28px
  const maxLinesPerBullet = 7
  const startY = 68

  // Build tspan elements for each bullet (paragraph)
  let currentY = startY + fontSize
  const tspans: string[] = []
  for (const bullet of slide.bullets.slice(0, 6)) {
    const lines = wrapText(bullet, maxChars, maxLinesPerBullet)
    for (const line of lines) {
      tspans.push(`<tspan x="${textX}" y="${currentY}">${escapeXml(line)}</tspan>`)
      currentY += lineHeight
    }
    currentY += paragraphGap
    if (currentY > SLIDE_SIZE - 60) break
  }

  const counter = escapeXml(`${slideIndex + 1}/${totalSlides}`)
  const watermark = escapeXml(brand.organizationName)

  return `<svg width="${SLIDE_SIZE}" height="${SLIDE_SIZE}" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="${SLIDE_SIZE / 2}" height="${SLIDE_SIZE}" fill="#000000" fill-opacity="0.65"/>
  <text font-family="${font}" font-size="${fontSize}" fill="#FFFFFF">
    ${tspans.join('\n    ')}
  </text>
  <text x="${SLIDE_SIZE - 32}" y="52" text-anchor="end" font-family="${font}" font-size="26" font-weight="600" fill="#FFFFFF">${counter}</text>
  <text x="${SLIDE_SIZE - 32}" y="${SLIDE_SIZE - 28}" text-anchor="end" font-family="${font}" font-size="20" fill="#FFFFFF" opacity="0.6">${watermark}</text>
</svg>`
}

async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to download carousel background: ${response.status}`)
  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

/** Generate a fal.ai background image for one carousel slide. */
export async function generateCarouselBackground(
  imagePrompt: string,
  jobId: string,
): Promise<Buffer> {
  const apiKey = await getSystemApiKey('fal-ai')
  if (!apiKey) throw new Error('No Fal.ai system API key configured')

  fal.config({ credentials: apiKey })

  const prompt = imagePrompt.slice(0, 2000)
  const result = await fal.subscribe('fal-ai/flux/schnell', {
    input: {
      prompt,
      image_size: 'square_hd',
      num_inference_steps: 4,
    },
    pollInterval: 2000,
    logs: false,
  })

  const data = result.data as { images?: Array<{ url: string }> }
  const url = data?.images?.[0]?.url
  if (!url) {
    logger.warn({ jobId }, '[carousel] fal returned no URL, falling back to flux-pro')
    const fallbackUrl = await generateFeaturedImage(prompt, jobId)
    return downloadImage(fallbackUrl)
  }

  return downloadImage(url)
}

/**
 * Composite one carousel slide: fal background + text overlay.
 *
 * Slide 0 (title): full image visible, dark rounded box only behind the title.
 * Slides 1+: left-half dark overlay with paragraph text, right half shows the
 * image naturally, slide counter top-right, watermark bottom-right.
 */
export async function renderCarouselSlide(
  backgroundBuffer: Buffer,
  input: CarouselSlideInput,
): Promise<Buffer> {
  const overlaySvg = input.slideIndex === 0
    ? buildTitleSlideOverlaySvg(input)
    : buildContentSlideOverlaySvg(input)

  const overlayPng = await sharp(Buffer.from(overlaySvg)).png().toBuffer()

  const resizedBg = await sharp(backgroundBuffer)
    .resize(SLIDE_SIZE, SLIDE_SIZE, { fit: 'cover', position: 'centre' })
    .png()
    .toBuffer()

  return sharp(resizedBg)
    .composite([{ input: overlayPng, top: 0, left: 0 }])
    .png()
    .toBuffer()
}

export function carouselSlideDimensions(): { width: number; height: number } {
  return { width: SLIDE_SIZE, height: SLIDE_SIZE }
}
