export type SocialPostType = 'standard' | 'quote' | 'carousel'

export type QuoteCardVariant = 'feed' | 'story'

export interface GeneratedQuoteCardResponse {
  success: boolean
  postType: 'quote'
  quoteText: string
  attribution?: string
  variant: QuoteCardVariant
  imageUrl: string
  mediaId: string
}

export interface GeneratedCarouselResponse {
  success: boolean
  postType: 'carousel'
  slides: Array<{ imageUrl: string; mediaId: string; headline: string }>
  imageUrls: string[]
  slideCount: number
  platformLimit: number
}

export const PLATFORM_IMAGE_LIMITS: Record<string, number> = {
  twitter: 4,
  linkedin: 9,
  facebook: 10,
  instagram: 10,
  telegram: 10,
  threads: 10,
}

export function maxSlidesForPlatforms(platforms: string[]): number {
  if (platforms.length === 0) return 6
  let limit = 6
  for (const p of platforms) {
    const cap = PLATFORM_IMAGE_LIMITS[p]
    if (cap !== undefined && cap < limit) limit = cap
  }
  return Math.max(2, limit)
}

export function trimSlidesForPlatform(slides: string[], platform: string): string[] {
  const cap = PLATFORM_IMAGE_LIMITS[platform] ?? slides.length
  return slides.slice(0, cap)
}

export function buildPublishMedia(opts: {
  postType: SocialPostType
  platform: string
  attachedImage?: string
  mediaUrls?: string[]
}): { imageUrl?: string; mediaUrls?: string[]; postType?: string } {
  const { postType, platform, attachedImage, mediaUrls = [] } = opts

  if (postType === 'carousel' && mediaUrls.length > 0) {
    const trimmed = trimSlidesForPlatform(mediaUrls, platform)
    return {
      imageUrl: trimmed[0],
      mediaUrls: trimmed.length > 1 ? trimmed : undefined,
      postType: 'carousel',
    }
  }

  if (postType === 'quote' && attachedImage) {
    return { imageUrl: attachedImage, postType: 'quote' }
  }

  if (attachedImage) {
    return { imageUrl: attachedImage }
  }

  return {}
}
