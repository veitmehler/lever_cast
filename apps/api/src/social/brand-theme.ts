import { prisma, brandSettingsForUser } from '@socioply/shared'
import { downloadImageFromStorage } from '@socioply/shared'
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
  /** What the social posts should promote or drive toward — injected as {{call_to_action}}. */
  socialCallToAction: string
  /** Brand voice fields — injected into caption and carousel prompts. */
  writingStyle: string
  businessDescription: string
  who: string
  industry: string
}

export async function loadSocialBrandTheme(userId: string): Promise<SocialBrandTheme> {
  const [brand, settings] = await Promise.all([
    brandSettingsForUser(userId),
    prisma.settings.findUnique({ where: { userId } }),
  ])
  const theme = themeFromBrand(brand)

  // Social compositors always use the bundled Helvetica Neue — never inherit
  // article or diagram font settings, which are unrelated concerns.
  const fontFamily = 'HelveticaNeue, Helvetica, Arial, sans-serif'

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
    socialCallToAction: brand?.socialCallToAction?.trim() ?? '',
    writingStyle: settings?.writingStyle?.trim() ?? '',
    businessDescription: brand?.businessDescription?.trim() ?? '',
    who: brand?.who?.trim() ?? '',
    industry: brand?.industry?.trim() ?? '',
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
