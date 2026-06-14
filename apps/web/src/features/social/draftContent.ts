// Shared, behavior-preserving helpers for the social draft handlers used by both
// the dashboard (`useDashboard`) and the post editor (`usePostEditor`). These are
// the genuinely-identical pieces; the surrounding stateful handlers intentionally
// differ between the two screens (media/provider/ensure-draft vs. isPublished
// guard / loaded-draft) and are NOT shared.

export type SocialPlatform = 'linkedin' | 'twitter' | 'facebook' | 'instagram' | 'telegram' | 'threads'

// Map a platform + content value to the per-field PATCH payload for /api/drafts.
// Twitter content may be a thread array, which is stored JSON-stringified.
export function buildDraftContentUpdate(
  platform: SocialPlatform,
  content: string | string[]
): Record<string, string> {
  const updateData: Record<string, string> = {}
  if (platform === 'linkedin') {
    updateData.linkedinContent = content as string
  } else if (platform === 'facebook') {
    updateData.facebookContent = content as string
  } else if (platform === 'instagram') {
    updateData.instagramContent = content as string
  } else if (platform === 'telegram') {
    updateData.telegramContent = content as string
  } else if (platform === 'threads') {
    updateData.threadsContent = content as string
  } else {
    // Stringify if array, otherwise use as string
    updateData.twitterContent = Array.isArray(content)
      ? JSON.stringify(content)
      : content
  }
  return updateData
}

// Normalize a freshly-fetched draft in place: a JSON-string `twitterContent` that
// encodes a thread array is parsed back into an array; anything else is left as-is.
export function parseDraftTwitterContent<T extends { twitterContent?: unknown }>(draft: T): T {
  if (draft.twitterContent && typeof draft.twitterContent === 'string') {
    try {
      const parsed = JSON.parse(draft.twitterContent)
      if (Array.isArray(parsed)) {
        ;(draft as { twitterContent: unknown }).twitterContent = parsed
      }
    } catch {
      // Keep as string if not valid JSON
    }
  }
  return draft
}
