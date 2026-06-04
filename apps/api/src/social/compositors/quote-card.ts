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

// ── Layout constants ──────────────────────────────────────────────────────────
// Matches the reference design: white background, large circular profile photo,
// bold account name in black, large left-aligned quote text below.

const PADDING       = 80   // left/right margin
const LOGO_SIZE     = 200  // diameter of the circular profile photo
const LOGO_TOP_FEED  = 80
const LOGO_TOP_STORY = 140
const HEADER_GAP     = 24  // gap between logo right edge and name text

const NAME_FONT_SIZE  = 64  // account name next to the logo
const QUOTE_FONT_FEED  = 72
const QUOTE_FONT_STORY = 66

// Instagram verified badge: blue circle with a white checkmark tick, SVG.
// Dimensions are scaled to sit neatly after the account name.
const BADGE_SIZE = 56 // px — matches NAME_FONT_SIZE proportionally

function buildVerifiedBadgeSvg(size: number): string {
  const r = size / 2
  // The tick path is hand-tuned to look like Instagram's verified badge.
  const tick = `M${size * 0.28},${size * 0.52} L${size * 0.44},${size * 0.68} L${size * 0.72},${size * 0.36}`
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <circle cx="${r}" cy="${r}" r="${r}" fill="#3897F0"/>
  <path d="${tick}" stroke="#FFFFFF" stroke-width="${size * 0.1}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>`
}

function buildQuoteCardSvg(
  input: QuoteCardInput,
  namePxWidth: number, // estimated pixel width of the name text (for badge placement)
): string {
  const { width, height } = DIMENSIONS[input.variant]
  const isStory = input.variant === 'story'

  const logoTop     = isStory ? LOGO_TOP_STORY : LOGO_TOP_FEED
  const headerBottom = logoTop + LOGO_SIZE + 56 // breathing room below header row

  const fontSize   = isStory ? QUOTE_FONT_STORY : QUOTE_FONT_FEED
  const lineHeight = Math.round(fontSize * 1.45)
  const maxChars   = isStory ? 20 : 22
  const maxLines   = isStory ? 16 : 10

  const lines = wrapText(input.quoteText, maxChars, maxLines)
  const textBlockHeight = lines.length * lineHeight

  // Vertically centre the quote in the space below the header
  const availableHeight = height - headerBottom - PADDING
  const textStartY = headerBottom + Math.round((availableHeight - textBlockHeight) / 2) + fontSize

  const font      = escapeXml(input.brand.fontFamily)
  const nameText  = escapeXml(input.brand.socialAccountName)

  // Name baseline: optical centre of the logo circle.
  // cap-height ≈ 0.72 × font-size; to centre the cap on the logo midline we
  // shift down by (logo_centre_from_top) + (cap_height / 2).
  const logoCentreY  = logoTop + LOGO_SIZE / 2
  const capHalfHeight = Math.round(NAME_FONT_SIZE * 0.72 / 2)
  const nameY = logoCentreY + capHalfHeight
  const nameX = PADDING + LOGO_SIZE + HEADER_GAP

  // Verified badge: placed immediately after the name text.
  // namePxWidth is the measured/estimated advance width; add a small gap.
  const badgeX   = nameX + namePxWidth + 12
  const badgeTop = Math.round(logoCentreY - BADGE_SIZE / 2)

  const verifiedBadge = input.brand.instagramVerified
    ? `<image href="data:image/svg+xml;base64,${Buffer.from(buildVerifiedBadgeSvg(BADGE_SIZE)).toString('base64')}" x="${badgeX}" y="${badgeTop}" width="${BADGE_SIZE}" height="${BADGE_SIZE}"/>`
    : ''

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <!-- White background -->
  <rect width="${width}" height="${height}" fill="#FFFFFF"/>
  <!-- Account name -->
  <text x="${nameX}" y="${nameY}" font-family="${font}" font-size="${NAME_FONT_SIZE}" font-weight="700" fill="#1A1A1A">${nameText}</text>
  ${verifiedBadge}
  <!-- Quote body -->
  <text font-family="${font}" font-size="${fontSize}" font-weight="700" fill="#1A1A1A">
    ${leftAlignedTextLines(lines, PADDING, textStartY, lineHeight)}
  </text>
</svg>`
}

/** Estimate the rendered pixel advance width of a string at the given font size.
 *  This is an approximation (no actual font shaping), but good enough for badge placement. */
function estimateTextWidth(text: string, fontSize: number): number {
  // Average character advance ≈ 0.58 × font-size for a bold geometric sans.
  return Math.round(text.length * fontSize * 0.58)
}

/** Composite the logo as a circle in the upper-left header area. */
async function compositeLogo(
  pngBuffer: Buffer,
  logoBuffer: Buffer | null | undefined,
  variant: QuoteCardVariant,
  brand: SocialBrandTheme,
): Promise<Buffer> {
  const logoTop  = variant === 'story' ? LOGO_TOP_STORY : LOGO_TOP_FEED
  const logoLeft = PADDING

  if (!logoBuffer) {
    // Fallback: coloured circle with the first letter of the account name
    const letter = (brand.socialAccountName[0] ?? 'B').toUpperCase()
    const fallbackSvg = Buffer.from(`<svg width="${LOGO_SIZE}" height="${LOGO_SIZE}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${LOGO_SIZE / 2}" cy="${LOGO_SIZE / 2}" r="${LOGO_SIZE / 2}" fill="${escapeXml(brand.primaryColor)}"/>
      <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-family="${escapeXml(brand.fontFamily)}" font-size="${Math.round(LOGO_SIZE * 0.45)}" font-weight="700" fill="#FFFFFF">${escapeXml(letter)}</text>
    </svg>`)
    const fallbackPng = await sharp(fallbackSvg).png().toBuffer()
    return sharp(pngBuffer)
      .composite([{ input: fallbackPng, left: logoLeft, top: logoTop }])
      .png()
      .toBuffer()
  }

  // Resize logo and clip to circle
  const resized = await sharp(logoBuffer)
    .resize(LOGO_SIZE, LOGO_SIZE, { fit: 'cover' })
    .png()
    .toBuffer()

  const circleMask = Buffer.from(
    `<svg width="${LOGO_SIZE}" height="${LOGO_SIZE}"><circle cx="${LOGO_SIZE / 2}" cy="${LOGO_SIZE / 2}" r="${LOGO_SIZE / 2}" fill="white"/></svg>`,
  )
  const circularLogo = await sharp(resized)
    .composite([{ input: circleMask, blend: 'dest-in' }])
    .png()
    .toBuffer()

  return sharp(pngBuffer)
    .composite([{ input: circularLogo, left: logoLeft, top: logoTop }])
    .png()
    .toBuffer()
}

/** Render a branded quote card PNG (1:1 feed or 9:16 story). */
export async function renderQuoteCard(input: QuoteCardInput): Promise<Buffer> {
  const namePxWidth = estimateTextWidth(input.brand.socialAccountName, NAME_FONT_SIZE)
  const svg  = buildQuoteCardSvg(input, namePxWidth)
  const base = await sharp(Buffer.from(svg)).png().toBuffer()
  return compositeLogo(base, input.logoBuffer, input.variant, input.brand)
}

export function quoteCardDimensions(variant: QuoteCardVariant): { width: number; height: number } {
  return DIMENSIONS[variant]
}
