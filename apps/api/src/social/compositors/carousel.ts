import sharp from 'sharp'
import { fal } from '@fal-ai/client'
import { getSystemApiKey } from '../../lib/system-keys'
import { logger } from '../../lib/logger'
import { generateFeaturedImage } from '../../article-pipeline/image-generation'
import type { SocialBrandTheme } from '../brand-theme'
import { centeredTextLines, escapeXml, leftAlignedTextLines, wrapText } from '../svg-utils'

export type CarouselSlideType = 'hook' | 'content' | 'cta'

export interface CarouselSlidePlan {
  type: CarouselSlideType
  headlineText: string | null
  bodyText: string | null
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

// Patched per-weight Helvetica Neue family names (registered with fontconfig).
const FONT_MEDIUM = 'HelveticaNeue Medium'
const FONT_LIGHT  = 'HelveticaNeue Light'

// ── Hook slide ───────────────────────────────────────────────────────────────
// Full background visible. Dark semi-transparent rounded box sits only behind
// the headline. Headline centered, HelveticaNeue Medium 52px, 22 chars/line.
function buildHookSlideOverlaySvg(input: CarouselSlideInput): string {
  const { slide, brand } = input
  const watermark = escapeXml(brand.organizationName)

  const fontSize   = 52
  const lineHeight = 68
  const maxChars   = 22
  const maxLines   = 5

  // If headlineText is absent, fall back to the first line of bodyText so the
  // hook slide always has visible text even when the LLM omitted the headline.
  const displayText = slide.headlineText?.trim() || slide.bodyText?.split('\n')[0]?.trim() || ''

  const lines = wrapText(displayText, maxChars, maxLines)
  const textBlockHeight = lines.length * lineHeight

  const boxPadV = 40
  const boxPadH = 60
  const boxW    = SLIDE_SIZE - 2 * boxPadH
  const boxH    = Math.max(textBlockHeight + 2 * boxPadV, 2 * boxPadV + fontSize)
  const boxX    = boxPadH
  const boxY    = Math.round((SLIDE_SIZE - boxH) / 2) - 40
  const textStartY = boxY + boxPadV + fontSize

  const textSvg = centeredTextLines(lines, SLIDE_SIZE / 2, textStartY, lineHeight)

  // Don't render a box if there's genuinely nothing to show
  const boxSvg = displayText
    ? `<rect x="${boxX}" y="${boxY}" width="${boxW}" height="${boxH}" rx="6" fill="#000000" fill-opacity="0.65"/>`
    : ''
  const textElement = displayText
    ? `<text text-anchor="middle" font-family="${FONT_MEDIUM}" font-size="${fontSize}" fill="#FFFFFF">\n    ${textSvg}\n  </text>`
    : ''

  return `<svg width="${SLIDE_SIZE}" height="${SLIDE_SIZE}" xmlns="http://www.w3.org/2000/svg">
  ${boxSvg}
  ${textElement}
  <text x="${SLIDE_SIZE - 32}" y="${SLIDE_SIZE - 28}" text-anchor="end" font-family="${FONT_LIGHT}" font-size="20" fill="#FFFFFF" opacity="0.6">${watermark}</text>
</svg>`
}

// ── Content slides ───────────────────────────────────────────────────────────
// Dark half-panel alternates left/right based on slideIndex (1st content = left,
// 2nd = right, etc.). Hook is index 0 so content slides start at index 1 — odd
// content indices are left panels, even content indices are right panels.
// Optional headline: HelveticaNeue Medium 42px, 22 chars/line.
// Body text: HelveticaNeue Light 24px, 29 chars/line; paragraphs split on \n.
function buildContentSlideOverlaySvg(input: CarouselSlideInput): string {
  const { slide, slideIndex, brand } = input
  const watermark = escapeXml(brand.organizationName)

  // Alternate: odd slideIndex = left panel, even = right panel.
  // (slideIndex 0 is the hook, so first content slide is index 1 → left.)
  const isRightPanel = slideIndex % 2 === 0

  const panelX = isRightPanel ? SLIDE_SIZE / 2 : 0
  const textX  = isRightPanel ? SLIDE_SIZE / 2 + 52 : 52

  const startY         = 68
  const headlineFontSz = 42
  const headlineLineH  = 54
  const headlineMaxC   = 22
  const headlineMaxL   = 3
  const bodyFontSz     = 24
  const bodyLineH      = 34
  const bodyMaxChars   = 29
  const bodyMaxLines   = 7
  const paragraphGap   = 18
  const headBodyGap    = 26

  let currentY = startY
  const tspans: string[] = []

  // Optional headline
  if (slide.headlineText) {
    const headLines = wrapText(slide.headlineText, headlineMaxC, headlineMaxL)
    tspans.push(
      `<text font-family="${FONT_MEDIUM}" font-size="${headlineFontSz}" fill="#FFFFFF">` +
      leftAlignedTextLines(headLines, textX, currentY + headlineFontSz, headlineLineH) +
      `</text>`,
    )
    currentY += headLines.length * headlineLineH + headBodyGap
  }

  // Body paragraphs (split on \n)
  const paragraphs = (slide.bodyText ?? '').split('\n').filter((p) => p.trim().length > 0)
  const bodyTspans: string[] = []
  for (const para of paragraphs) {
    const lines = wrapText(para.trim(), bodyMaxChars, bodyMaxLines)
    for (const line of lines) {
      bodyTspans.push(`<tspan x="${textX}" y="${currentY + bodyFontSz}">${escapeXml(line)}</tspan>`)
      currentY += bodyLineH
    }
    currentY += paragraphGap
    if (currentY > SLIDE_SIZE - 60) break
  }

  const bodyBlock = bodyTspans.length > 0
    ? `<text font-family="${FONT_LIGHT}" font-size="${bodyFontSz}" fill="#FFFFFF">${bodyTspans.join('')}</text>`
    : ''

  return `<svg width="${SLIDE_SIZE}" height="${SLIDE_SIZE}" xmlns="http://www.w3.org/2000/svg">
  <rect x="${panelX}" y="0" width="${SLIDE_SIZE / 2}" height="${SLIDE_SIZE}" fill="#000000" fill-opacity="0.65"/>
  ${tspans.join('\n  ')}
  ${bodyBlock}
  <text x="${SLIDE_SIZE - 32}" y="${SLIDE_SIZE - 28}" text-anchor="end" font-family="${FONT_LIGHT}" font-size="20" fill="#FFFFFF" opacity="0.6">${watermark}</text>
</svg>`
}

// ── CTA slide ────────────────────────────────────────────────────────────────
// Full-frame dark overlay. Headline centered, HelveticaNeue Medium 48px,
// 22 chars/line. Body text HelveticaNeue Light 24px, 35 chars/line.
function buildCtaSlideOverlaySvg(input: CarouselSlideInput): string {
  const { slide, brand } = input
  const watermark = escapeXml(brand.organizationName)

  const textX          = 80
  const headlineFontSz = 48
  const headlineLineH  = 62
  const headlineMaxC   = 22
  const headlineMaxL   = 3
  const bodyFontSz     = 24
  const bodyLineH      = 34
  const bodyMaxChars   = 35
  const bodyMaxLines   = 6
  const paragraphGap   = 14
  const headBodyGap    = 32

  // Build headline lines first to compute total block height for centering
  const headLines = slide.headlineText
    ? wrapText(slide.headlineText, headlineMaxC, headlineMaxL)
    : []
  const paragraphs = (slide.bodyText ?? '').split('\n').filter((p) => p.trim().length > 0)
  const bodyLineGroups = paragraphs.map((p) => wrapText(p.trim(), bodyMaxChars, bodyMaxLines))
  const totalBodyLines = bodyLineGroups.reduce((n, g) => n + g.length, 0)
  const totalBodyGaps  = bodyLineGroups.length > 0 ? bodyLineGroups.length - 1 : 0

  const headlineBlockH = headLines.length * headlineLineH
  const bodyBlockH     = totalBodyLines * bodyLineH + totalBodyGaps * paragraphGap
  const gapH           = headLines.length > 0 && totalBodyLines > 0 ? headBodyGap : 0
  const totalH         = headlineBlockH + gapH + bodyBlockH

  let currentY = Math.round((SLIDE_SIZE - totalH) / 2)

  const elements: string[] = []

  if (headLines.length > 0) {
    elements.push(
      `<text text-anchor="left" font-family="${FONT_MEDIUM}" font-size="${headlineFontSz}" fill="#FFFFFF">` +
      leftAlignedTextLines(headLines, textX, currentY + headlineFontSz, headlineLineH) +
      `</text>`,
    )
    currentY += headlineBlockH + headBodyGap
  }

  const bodyTspans: string[] = []
  for (const lines of bodyLineGroups) {
    for (const line of lines) {
      bodyTspans.push(`<tspan x="${textX}" y="${currentY + bodyFontSz}">${escapeXml(line)}</tspan>`)
      currentY += bodyLineH
    }
    currentY += paragraphGap
  }

  if (bodyTspans.length > 0) {
    elements.push(
      `<text font-family="${FONT_LIGHT}" font-size="${bodyFontSz}" fill="#FFFFFF">${bodyTspans.join('')}</text>`,
    )
  }

  return `<svg width="${SLIDE_SIZE}" height="${SLIDE_SIZE}" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="${SLIDE_SIZE}" height="${SLIDE_SIZE}" fill="#000000" fill-opacity="0.70"/>
  ${elements.join('\n  ')}
  <text x="${SLIDE_SIZE - 32}" y="${SLIDE_SIZE - 28}" text-anchor="end" font-family="${FONT_LIGHT}" font-size="20" fill="#FFFFFF" opacity="0.6">${watermark}</text>
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
 * Routes to the correct overlay function based on slide.type:
 *   hook    → centered headline box (full image visible)
 *   content → left-half dark overlay with optional headline + body paragraphs
 *   cta     → full-frame dark overlay with headline + body
 */
export async function renderCarouselSlide(
  backgroundBuffer: Buffer,
  input: CarouselSlideInput,
): Promise<Buffer> {
  let overlaySvg: string
  switch (input.slide.type) {
    case 'hook':
      overlaySvg = buildHookSlideOverlaySvg(input)
      break
    case 'cta':
      overlaySvg = buildCtaSlideOverlaySvg(input)
      break
    case 'content':
    default:
      overlaySvg = buildContentSlideOverlaySvg(input)
      break
  }

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

const STORY_W = 1080
const STORY_H = 1920

/**
 * Center-crop a source image buffer to 1080×1920 (9:16) using Sharp.
 * Used by S4/S6 to prepare a raw background before converting to video.
 */
export async function cropBufferToStoryAspect(buf: Buffer): Promise<Buffer> {
  return sharp(buf)
    .resize(STORY_W, STORY_H, { fit: 'cover', position: 'centre' })
    .png()
    .toBuffer()
}

/** Word-wrap without a line cap — used for pitch auto-fit. */
function wrapTextUnlimited(text: string, maxCharsPerLine: number): string[] {
  return wrapText(text, maxCharsPerLine, 99)
}

/** Downward-pointing arrow (vector path, no glyph dependency). */
function buildDownArrowSvg(cx: number, cy: number): string {
  const shaftTop = cy - 28
  const shaftBot = cy + 8
  const headY    = cy + 28
  return `<path
    d="M ${cx} ${shaftTop} L ${cx} ${shaftBot} M ${cx - 18} ${headY - 18} L ${cx} ${headY} L ${cx + 18} ${headY - 18}"
    stroke="#FFFFFF"
    stroke-width="5"
    fill="none"
    stroke-linecap="round"
    stroke-linejoin="round"
  />`
}

const PITCH_REGION_TOP    = 280
const PITCH_REGION_BOTTOM = 1380
const PITCH_MAX_HEIGHT    = PITCH_REGION_BOTTOM - PITCH_REGION_TOP
const CTA_FONT_SIZE       = 36
const CTA_LINE_H          = 48
const CTA_MAX_CHARS       = 28
const CTA_MAX_LINES       = 2
const CTA_FIRST_LINE_Y    = STORY_H - 340
const ARROW_CY            = STORY_H - 200

/**
 * Composite a 9:16 story pitch slide: center-crop the source background to
 * 1080×1920, apply a full-frame dark overlay, then render:
 *   - pitch body (upper-center, auto-fit font so nothing is truncated)
 *   - CTA line anchored near the bottom
 *   - drawn downward arrow below the CTA
 */
export async function buildPitchSlidePng(
  backgroundBuffer: Buffer,
  pitchText: string,
  ctaText: string,
): Promise<Buffer> {
  const bg = await sharp(backgroundBuffer)
    .resize(STORY_W, STORY_H, { fit: 'cover', position: 'centre' })
    .png()
    .toBuffer()

  const centerX = STORY_W / 2

  // Auto-fit pitch: shrink font until the full text fits the upper region.
  let pitchFontSize = 48
  let pitchLineH    = 66
  let pitchLines: string[] = []
  let pitchStartY   = PITCH_REGION_TOP

  for (let fs = 48; fs >= 30; fs -= 2) {
    const lineH    = Math.round(fs * 1.375)
    const maxChars = Math.max(20, Math.round(32 * (fs / 48)))
    const lines    = wrapTextUnlimited(pitchText, maxChars)
    const height   = lines.length * lineH
    if (height <= PITCH_MAX_HEIGHT) {
      pitchFontSize = fs
      pitchLineH    = lineH
      pitchLines    = lines
      pitchStartY   = PITCH_REGION_TOP + Math.round((PITCH_MAX_HEIGHT - height) / 2)
      break
    }
    if (fs === 30) {
      pitchFontSize = fs
      pitchLineH    = lineH
      pitchLines    = lines
      pitchStartY   = PITCH_REGION_TOP
    }
  }

  const pitchTspans = pitchLines
    .map((line, i) =>
      `<tspan x="${centerX}" y="${pitchStartY + pitchFontSize + i * pitchLineH}">${escapeXml(line)}</tspan>`,
    )
    .join('')

  const ctaLines = wrapText(ctaText, CTA_MAX_CHARS, CTA_MAX_LINES)
  const ctaTspans = ctaLines
    .map((line, i) =>
      `<tspan x="${centerX}" y="${CTA_FIRST_LINE_Y + CTA_FONT_SIZE + i * CTA_LINE_H}">${escapeXml(line)}</tspan>`,
    )
    .join('')

  const overlaySvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${STORY_W}" height="${STORY_H}">
  <rect width="${STORY_W}" height="${STORY_H}" fill="rgba(0,0,0,0.72)"/>
  <text
    font-family="${FONT_MEDIUM}"
    font-size="${pitchFontSize}"
    fill="#FFFFFF"
    text-anchor="middle"
    dominant-baseline="auto"
  >${pitchTspans}</text>
  <text
    font-family="${FONT_MEDIUM}"
    font-size="${CTA_FONT_SIZE}"
    fill="#FFFFFF"
    text-anchor="middle"
    dominant-baseline="auto"
    opacity="0.95"
  >${ctaTspans}</text>
  ${buildDownArrowSvg(centerX, ARROW_CY)}
</svg>`

  const overlayPng = await sharp(Buffer.from(overlaySvg)).png().toBuffer()

  return sharp(bg)
    .composite([{ input: overlayPng, top: 0, left: 0 }])
    .png()
    .toBuffer()
}
