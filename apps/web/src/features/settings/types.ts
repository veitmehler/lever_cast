export type ApiKeyData = {
  id: string
  provider: string
  maskedKey: string
  createdAt: string
  updatedAt: string
}

export type SocialConnection = {
  id: string
  platform: string
  appType: 'personal' | 'company' | null // For LinkedIn: distinguishes between Personal Profile and Company Pages apps
  platformUserId: string | null
  platformUsername: string | null
  postTargetType: 'personal' | 'page' | null
  selectedPageId: string | null
  isActive: boolean
  lastUsed: string | null
  createdAt: string
  updatedAt: string
}

export type SocialPage = {
  id: string
  name: string
  vanityName?: string
  access_token?: string
}
