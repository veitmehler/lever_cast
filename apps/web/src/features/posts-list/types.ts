export type FilterStatus = 'all' | 'published' | 'draft' | 'scheduled'

// Draft type matching database schema
export type Draft = {
  id: string
  userId: string
  title: string
  contentRaw: string
  linkedinContent: string | null
  twitterContent: string | null
  facebookContent: string | null
  instagramContent: string | null
  telegramContent: string | null
  threadsContent: string | null
  platforms: string
  templateId: string | null
  attachedImage: string | null
  status: string
  publishedAt: Date | null
  createdAt: Date
  updatedAt: Date
  posts?: Array<{
    id: string
    platform: string
    publishedAt: Date | null
    scheduledAt: Date | null
    status: string
    parentPostId?: string | null // For filtering out reply posts
  }>
}
