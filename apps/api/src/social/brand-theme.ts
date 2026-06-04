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
}

export async function loadSocialBrandTheme(userId: string): Promise<SocialBrandTheme> {
  const brand = await prisma.brandSettings.findUnique({ where: { userId } })
  const theme = themeFromBrand(brand)

  const fontFamily =
    (brand?.articleFontFamily?.trim() || brand?.diagramFontFamily?.trim() || theme.fontFamily)

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
