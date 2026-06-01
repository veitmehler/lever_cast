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

function buildSlideOverlaySvg(input: CarouselSlideInput): string {
  const { slide, slideIndex, totalSlides, brand } = input
  const headlineLines = wrapText(slide.headline, 24, 2)
  const bulletLines = slide.bullets.slice(0, 4).map((b) => `• ${b}`)
  const wrappedBullets = bulletLines.flatMap((b) => wrapText(b, 34, 2)).slice(0, 5)

  const headlineFontSize = 46
  const bulletFontSize = 30
  const headlineStartY = 780
  const bulletStartY = headlineStartY + headlineLines.length * 58 + 24

  const headlineSvg = centeredTextLines(
    headlineLines,
    SLIDE_SIZE / 2,
    headlineStartY,
    58,
  )
  const bulletSvg = centeredTextLines(
    wrappedBullets,
    SLIDE_SIZE / 2,
    bulletStartY,
    42,
  )

  return `<svg width="${SLIDE_SIZE}" height="${SLIDE_SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="overlay" x1="0" y1="520" x2="0" y2="${SLIDE_SIZE}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="35%" stop-color="#000000" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.82"/>
    </linearGradient>
  </defs>
  <rect x="0" y="520" width="${SLIDE_SIZE}" height="${SLIDE_SIZE - 520}" fill="url(#overlay)"/>
  <rect x="0" y="${SLIDE_SIZE - 72}" width="${SLIDE_SIZE}" height="72" fill="${escapeXml(brand.primaryColor)}"/>
  <text x="36" y="${SLIDE_SIZE - 28}" font-family="${escapeXml(brand.fontFamily)}" font-size="24" font-weight="600" fill="#FFFFFF">${escapeXml(brand.organizationName)}</text>
  <text x="${SLIDE_SIZE - 36}" y="${SLIDE_SIZE - 28}" text-anchor="end" font-family="${escapeXml(brand.fontFamily)}" font-size="22" fill="#FFFFFF" opacity="0.85">${slideIndex + 1}/${totalSlides}</text>
  <text text-anchor="middle" font-family="${escapeXml(brand.fontFamily)}" font-size="${headlineFontSize}" font-weight="700" fill="#FFFFFF">
    ${headlineSvg}
  </text>
  <text text-anchor="middle" font-family="${escapeXml(brand.fontFamily)}" font-size="${bulletFontSize}" fill="#FFFFFF" opacity="0.95">
    ${bulletSvg}
  </text>
</svg>`
}

async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to download carousel background: ${response.status}`)
  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

async function compositeLogo(base: Buffer, logoBuffer: Buffer | null | undefined): Promise<Buffer> {
  if (!logoBuffer) return base
  const logoSize = 56
  const logo = await sharp(logoBuffer)
    .resize(logoSize, logoSize, { fit: 'inside', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()

  return sharp(base)
    .composite([{ input: logo, left: SLIDE_SIZE - logoSize - 28, top: 28 }])
    .png()
    .toBuffer()
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

/** Composite one carousel slide: fal background + branded text overlay + logo. */
export async function renderCarouselSlide(
  backgroundBuffer: Buffer,
  input: CarouselSlideInput,
): Promise<Buffer> {
  const overlaySvg = buildSlideOverlaySvg(input)
  const overlayPng = await sharp(Buffer.from(overlaySvg)).png().toBuffer()

  const resizedBg = await sharp(backgroundBuffer)
    .resize(SLIDE_SIZE, SLIDE_SIZE, { fit: 'cover', position: 'centre' })
    .png()
    .toBuffer()

  const composited = await sharp(resizedBg)
    .composite([{ input: overlayPng, top: 0, left: 0 }])
    .png()
    .toBuffer()

  return compositeLogo(composited, input.logoBuffer)
}

export function carouselSlideDimensions(): { width: number; height: number } {
  return { width: SLIDE_SIZE, height: SLIDE_SIZE }
}
