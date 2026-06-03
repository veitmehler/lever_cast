/** Normalized preview stored on SocialAutomationSpecResult.previewJson */
export type SpecPreviewPlatform = {
  platform: string
  caption: string
  imageUrl?: string
  mediaUrls?: string[]
  videoUrl?: string
  status: 'ready'
  postId: string
}

export type SpecPreviewPayload = {
  slotKey: string
  postType: string
  isStory: boolean
  scheduledAt: string
  platforms: SpecPreviewPlatform[]
  assets: {
    imageUrl?: string
    mediaUrls?: string[]
    videoUrl?: string
    title?: string
  }
}
