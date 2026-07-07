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
  /**
   * The effective call-to-action injected as {{call_to_action}}. Derived from the
   * business's primary goal (link-in-bio strategy) — see resolveSocialCta. Falls
   * back to the raw custom text for backward compatibility.
   */
  socialCallToAction: string
  /** The business's link-in-bio page URL (reference — posts verbally say "link in bio"). */
  socialBioUrl: string
  /** Brand voice fields — injected into caption and carousel prompts. */
  writingStyle: string
  businessDescription: string
  who: string
  industry: string
}

/**
 * Resolve the effective {{call_to_action}} from the business's link-in-bio goal.
 * Because feed posts and stories can't carry a clickable link, every CTA drives
 * to the profile bio link. Presets emit LLM guidance that says "link in bio";
 * a null/absent goal preserves the legacy behavior (raw custom text verbatim).
 */
export function resolveSocialCta(
  goal: string | null | undefined,
  customText: string,
): string {
  const linkPhrase = 'via the link in our bio'
  switch (goal) {
    case 'newsletter':
      return `Encourage readers to subscribe to our free newsletter ${linkPhrase}.`
    case 'booking':
      return `Encourage readers to book an appointment with us ${linkPhrase}.`
    case 'custom':
      return customText
    default:
      // Legacy / unset — inject the raw custom text exactly as before.
      return customText
  }
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
    socialCallToAction: resolveSocialCta(brand?.socialPrimaryGoal, brand?.socialCallToAction?.trim() ?? ''),
    socialBioUrl: brand?.socialBioUrl?.trim() ?? '',
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
