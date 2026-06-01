import sharp from 'sharp'
import type { SocialBrandTheme } from '../brand-theme'
import { centeredTextLines, escapeXml, wrapText } from '../svg-utils'

export type PitchStoryType = 'carousel' | 'hook'

export interface PitchStoryInput {
  title: string
  pitchType: PitchStoryType
  brand: SocialBrandTheme
  logoBuffer?: Buffer | null
}

const WIDTH = 1080
const HEIGHT = 1920

function ctaText(pitchType: PitchStoryType): string {
  return pitchType === 'carousel'
    ? 'Go to our profile to read the full carousel →'
    : 'Go to our profile to watch the full video →'
}

function buildTitleSlideSvg(title: string, brand: SocialBrandTheme): string {
  const lines = wrapText(title, 22, 5)
  const fontSize = 52
  const lineHeight = Math.round(fontSize * 1.3)
  const startY = Math.round(HEIGHT * 0.38)

  return `<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${escapeXml(brand.primaryColor)}"/>
  <rect x="64" y="64" width="${WIDTH - 128}" height="${HEIGHT - 128}" rx="24" fill="#FFFFFF" opacity="0.08"/>
  <text text-anchor="middle" font-family="${escapeXml(brand.fontFamily)}" font-size="${fontSize}" font-weight="700" fill="#FFFFFF">
    ${centeredTextLines(lines, WIDTH / 2, startY, lineHeight)}
  </text>
  <text x="${WIDTH / 2}" y="${HEIGHT - 180}" text-anchor="middle" font-family="${escapeXml(brand.fontFamily)}" font-size="28" fill="#FFFFFF" opacity="0.85">${escapeXml(brand.organizationName)}</text>
</svg>`
}

function buildCtaSlideSvg(pitchType: PitchStoryType, brand: SocialBrandTheme): string {
  const cta = ctaText(pitchType)
  const lines = wrapText(cta, 24, 4)
  const fontSize = 44
  const lineHeight = Math.round(fontSize * 1.35)
  const startY = Math.round(HEIGHT * 0.42)

  return `<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="#FFFFFF"/>
  <rect x="0" y="0" width="${WIDTH}" height="12" fill="${escapeXml(brand.secondaryColor)}"/>
  <text text-anchor="middle" font-family="${escapeXml(brand.fontFamily)}" font-size="${fontSize}" font-weight="600" fill="${escapeXml(brand.textColor)}">
    ${centeredTextLines(lines, WIDTH / 2, startY, lineHeight)}
  </text>
  <rect x="${WIDTH / 2 - 180}" y="${HEIGHT - 220}" width="360" height="72" rx="36" fill="${escapeXml(brand.primaryColor)}"/>
  <text x="${WIDTH / 2}" y="${HEIGHT - 176}" text-anchor="middle" font-family="${escapeXml(brand.fontFamily)}" font-size="28" font-weight="600" fill="#FFFFFF">View Profile</text>
</svg>`
}

async function renderSvgToPng(svg: string): Promise<Buffer> {
  return sharp(Buffer.from(svg)).png().toBuffer()
}

/** Render a 2-slide pitch story (title + CTA) for S4/S6 story posts. */
export async function renderPitchStory(input: PitchStoryInput): Promise<Buffer[]> {
  const titleSvg = buildTitleSlideSvg(input.title, input.brand)
  const ctaSvg = buildCtaSlideSvg(input.pitchType, input.brand)
  return Promise.all([renderSvgToPng(titleSvg), renderSvgToPng(ctaSvg)])
}

export function pitchStoryDimensions(): { width: number; height: number } {
  return { width: WIDTH, height: HEIGHT }
}
