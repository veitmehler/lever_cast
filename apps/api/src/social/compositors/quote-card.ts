import sharp from 'sharp'
import type { SocialBrandTheme } from '../brand-theme'
import { centeredTextLines, escapeXml, wrapText } from '../svg-utils'

export type QuoteCardVariant = 'feed' | 'story'

export interface QuoteCardInput {
  quoteText: string
  attribution?: string
  variant: QuoteCardVariant
  brand: SocialBrandTheme
  logoBuffer?: Buffer | null
}

const DIMENSIONS: Record<QuoteCardVariant, { width: number; height: number }> = {
  feed: { width: 1080, height: 1080 },
  story: { width: 1080, height: 1920 },
}

function buildQuoteCardSvg(input: QuoteCardInput): string {
  const { width, height } = DIMENSIONS[input.variant]
  const brandBarHeight = input.variant === 'story' ? 120 : 96
  const padding = 80
  const maxChars = input.variant === 'story' ? 28 : 32
  const maxLines = input.variant === 'story' ? 14 : 8
  const fontSize = input.variant === 'story' ? 44 : 48
  const lineHeight = Math.round(fontSize * 1.35)

  const lines = wrapText(input.quoteText, maxChars, maxLines)
  const textBlockHeight = lines.length * lineHeight
  const textStartY = Math.round((height - brandBarHeight - textBlockHeight) / 2) + fontSize

  const quoteMarks = `<text x="${padding}" y="${textStartY - fontSize}" font-family="${escapeXml(input.brand.fontFamily)}" font-size="${fontSize * 1.6}" fill="${escapeXml(input.brand.primaryColor)}" opacity="0.35">"</text>`

  const attribution = input.attribution?.trim()
    ? `<text x="${width / 2}" y="${height - brandBarHeight - 28}" text-anchor="middle" font-family="${escapeXml(input.brand.fontFamily)}" font-size="26" fill="${escapeXml(input.brand.textColor)}" opacity="0.7">— ${escapeXml(input.attribution)}</text>`
    : ''

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#F8FAFC"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <rect x="0" y="${height - brandBarHeight}" width="${width}" height="${brandBarHeight}" fill="${escapeXml(input.brand.primaryColor)}"/>
  <text x="${padding + 8}" y="${height - brandBarHeight / 2 + 8}" font-family="${escapeXml(input.brand.fontFamily)}" font-size="28" font-weight="600" fill="#FFFFFF">${escapeXml(input.brand.organizationName)}</text>
  ${quoteMarks}
  <text text-anchor="middle" font-family="${escapeXml(input.brand.fontFamily)}" font-size="${fontSize}" font-weight="600" fill="${escapeXml(input.brand.textColor)}">
    ${centeredTextLines(lines, width / 2, textStartY, lineHeight)}
  </text>
  ${attribution}
</svg>`
}

async function compositeLogo(
  pngBuffer: Buffer,
  logoBuffer: Buffer | null | undefined,
  variant: QuoteCardVariant,
): Promise<Buffer> {
  if (!logoBuffer) return pngBuffer

  const { width, height } = DIMENSIONS[variant]
  const brandBarHeight = variant === 'story' ? 120 : 96
  const logoSize = 64

  const logo = await sharp(logoBuffer)
    .resize(logoSize, logoSize, { fit: 'inside', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()

  return sharp(pngBuffer)
    .composite([
      {
        input: logo,
        left: width - logoSize - 32,
        top: height - brandBarHeight + Math.round((brandBarHeight - logoSize) / 2),
      },
    ])
    .png()
    .toBuffer()
}

/** Render a branded quote card PNG (1:1 feed or 9:16 story). */
export async function renderQuoteCard(input: QuoteCardInput): Promise<Buffer> {
  const svg = buildQuoteCardSvg(input)
  const base = await sharp(Buffer.from(svg)).png().toBuffer()
  return compositeLogo(base, input.logoBuffer, input.variant)
}

export function quoteCardDimensions(variant: QuoteCardVariant): { width: number; height: number } {
  return DIMENSIONS[variant]
}
