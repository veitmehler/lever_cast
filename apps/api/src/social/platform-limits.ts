/** Per-platform image limits for carousel / multi-image posts (GHL constraints). */

export const PLATFORM_IMAGE_LIMITS: Record<string, number> = {
  twitter: 4,
  linkedin: 9,
  facebook: 10,
  instagram: 10,
  telegram: 10,
  threads: 10,
}

const DEFAULT_CAROUSEL_SLIDES = 6

/** Resolve the max slide count for a set of target platforms. */
export function maxSlidesForPlatforms(platforms: string[]): number {
  if (platforms.length === 0) return DEFAULT_CAROUSEL_SLIDES

  let limit = DEFAULT_CAROUSEL_SLIDES
  for (const p of platforms) {
    const cap = PLATFORM_IMAGE_LIMITS[p]
    if (cap !== undefined && cap < limit) limit = cap
  }
  return Math.max(2, limit)
}

/** Trim slide URLs to the platform-specific maximum. */
export function trimSlidesForPlatform(slides: string[], platform: string): string[] {
  const cap = PLATFORM_IMAGE_LIMITS[platform] ?? slides.length
  return slides.slice(0, cap)
}
