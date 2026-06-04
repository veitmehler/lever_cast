import sharp from 'sharp'
import type { SocialBrandTheme } from '../brand-theme'
import { escapeXml, leftAlignedTextLines, wrapText } from '../svg-utils'

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

// Layout constants matching the Hormozi-style reference design:
// black background, circular logo + company name header, large left-aligned
// white quote text filling the card body.
const PADDING = 72
const LOGO_SIZE = 100
const LOGO_TOP_FEED = 72
const LOGO_TOP_STORY = 140
const NAME_FONT_SIZE = 36
const HEADER_GAP = 20

function buildQuoteCardSvg(input: QuoteCardInput): string {
  const { width, height } = DIMENSIONS[input.variant]
  const isStory = input.variant === 'story'

  const logoTop = isStory ? LOGO_TOP_STORY : LOGO_TOP_FEED
  const headerBottom = logoTop + LOGO_SIZE + 48

  const maxChars = isStory ? 22 : 24
  const maxLines = isStory ? 16 : 10
  const fontSize = isStory ? 60 : 56
  const lineHeight = Math.round(fontSize * 1.45)

  const lines = wrapText(input.quoteText, maxChars, maxLines)
  const textBlockHeight = lines.length * lineHeight

  // Vertically center the text in the space below the header
  const availableHeight = height - headerBottom - PADDING
  const textStartY = headerBottom + Math.round((availableHeight - textBlockHeight) / 2) + fontSize

  const font = escapeXml(input.brand.fontFamily)

  // Company name baseline aligns vertically with the logo center
  const nameY = logoTop + Math.round(LOGO_SIZE / 2) + Math.round(NAME_FONT_SIZE / 3)
  const nameX = PADDING + LOGO_SIZE + HEADER_GAP

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="#000000"/>
  <text x="${nameX}" y="${nameY}" font-family="${font}" font-size="${NAME_FONT_SIZE}" font-weight="700" fill="#FFFFFF">${escapeXml(input.brand.organizationName)}</text>
  <text font-family="${font}" font-size="${fontSize}" font-weight="700" fill="#FFFFFF">
    ${leftAlignedTextLines(lines, PADDING, textStartY, lineHeight)}
  </text>
</svg>`
}

/** Composite the logo as a circle in the upper-left header area. */
async function compositeLogo(
  pngBuffer: Buffer,
  logoBuffer: Buffer | null | undefined,
  variant: QuoteCardVariant,
  brand: SocialBrandTheme,
): Promise<Buffer> {
  const logoTop = variant === 'story' ? LOGO_TOP_STORY : LOGO_TOP_FEED
  const logoLeft = PADDING

  if (!logoBuffer) {
    // No logo: render a colored circle with the first letter of the org name
    const letter = (brand.organizationName[0] ?? 'B').toUpperCase()
    const fallbackSvg = Buffer.from(`<svg width="${LOGO_SIZE}" height="${LOGO_SIZE}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${LOGO_SIZE / 2}" cy="${LOGO_SIZE / 2}" r="${LOGO_SIZE / 2}" fill="${escapeXml(brand.primaryColor)}"/>
      <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-family="${escapeXml(brand.fontFamily)}" font-size="48" font-weight="700" fill="#FFFFFF">${escapeXml(letter)}</text>
    </svg>`)
    const fallbackPng = await sharp(fallbackSvg).png().toBuffer()
    return sharp(pngBuffer).composite([{ input: fallbackPng, left: logoLeft, top: logoTop }]).png().toBuffer()
  }

  // Resize the logo and clip into a circle
  const resized = await sharp(logoBuffer)
    .resize(LOGO_SIZE, LOGO_SIZE, { fit: 'cover' })
    .png()
    .toBuffer()

  const circleMask = Buffer.from(`<svg width="${LOGO_SIZE}" height="${LOGO_SIZE}"><circle cx="${LOGO_SIZE / 2}" cy="${LOGO_SIZE / 2}" r="${LOGO_SIZE / 2}" fill="white"/></svg>`)
  const circularLogo = await sharp(resized)
    .composite([{ input: circleMask, blend: 'dest-in' }])
    .png()
    .toBuffer()

  return sharp(pngBuffer).composite([{ input: circularLogo, left: logoLeft, top: logoTop }]).png().toBuffer()
}

/** Render a branded quote card PNG (1:1 feed or 9:16 story). */
export async function renderQuoteCard(input: QuoteCardInput): Promise<Buffer> {
  const svg = buildQuoteCardSvg(input)
  const base = await sharp(Buffer.from(svg)).png().toBuffer()
  return compositeLogo(base, input.logoBuffer, input.variant, input.brand)
}

export function quoteCardDimensions(variant: QuoteCardVariant): { width: number; height: number } {
  return DIMENSIONS[variant]
}
