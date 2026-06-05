import { prisma } from '../lib/prisma'
import { downloadImageFromStorage } from '../lib/storage'
import { themeFromBrand } from '../article-pipeline/enrichment/diagram-theme'

export interface SocialBrandTheme {
  primaryColor: string
  secondaryColor: string
  textColor: string
  fontFamily: string
  organizationName: string
  /** Social account display name shown on quote cards. Falls back to organizationName. */
  socialAccountName: string
  /** When true, an Instagram-style blue verified badge is rendered on quote cards. */
  instagramVerified: boolean
  logoUrl: string | null
  /** Client-specific instructions injected into the Fal.ai video reel prompt (e.g. style, restrictions). */
  videoSpecialInstructions: string
}

export async function loadSocialBrandTheme(userId: string): Promise<SocialBrandTheme> {
  const brand = await prisma.brandSettings.findUnique({ where: { userId } })
  const theme = themeFromBrand(brand)

  // Social compositors have their own bundled font (Helvetica Neue) and should
  // not inherit article or diagram font settings — those are unrelated concerns.
  // A dedicated socialFontFamily field can be added later for per-account control.
  const fontFamily = theme.fontFamily

  const organizationName = brand?.organizationName?.trim() || 'Your Brand'
  return {
    primaryColor: theme.primaryColor,
    secondaryColor: theme.secondaryColor,
    textColor: brand?.diagramTextColor?.trim() || '#1F2937',
    fontFamily,
    organizationName,
    socialAccountName: brand?.socialAccountName?.trim() || organizationName,
    instagramVerified: brand?.instagramVerified ?? false,
    logoUrl: brand?.socialLogoUrl ?? brand?.organizationLogoUrl ?? null,
    videoSpecialInstructions: brand?.videoSpecialInstructions?.trim() ?? '',
  }
}

export async function loadLogoBuffer(logoUrl: string | null): Promise<Buffer | null> {
  if (!logoUrl) return null
  try {
    return await downloadImageFromStorage(logoUrl)
  } catch {
    return null
  }
}
