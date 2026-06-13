import type { CarouselSlidePlan, SocialPostType } from '@/lib/social/types'

// TypeScript definitions for Web Speech API
export interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null
  onend: ((this: SpeechRecognition, ev: Event) => void) | null
}

export interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}

export interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message?: string
}

export interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

export interface SpeechRecognitionResult {
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
  isFinal: boolean
}

export interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

export interface Window {
  SpeechRecognition: {
    new (): SpeechRecognition
  }
  webkitSpeechRecognition: {
    new (): SpeechRecognition
  }
}

// Template type matching database schema
export type Template = {
  id: string
  userId: string
  name: string
  tone: 'professional' | 'casual' | 'inspirational' | 'question-based' | 'storytelling'
  description: string
  linkedinTemplate: string
  twitterTemplate: string
  facebookTemplate?: string | null
  instagramTemplate?: string | null
  telegramTemplate?: string | null
  threadsTemplate?: string | null
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface IdeaCaptureProps {
  onGenerate: (
    content: string,
    platform: 'linkedin' | 'twitter' | 'facebook' | 'instagram' | 'telegram' | 'threads' | 'all' | ('linkedin' | 'twitter' | 'facebook' | 'instagram' | 'telegram' | 'threads')[],
    templateId?: string,
    image?: string,
    twitterFormat?: 'single' | 'thread'
  ) => void
  onImageAttached?: (imageUrl: string) => void
  onMediaAssetsReady?: (assets: {
    postType: SocialPostType
    imageUrl?: string
    mediaUrls?: string[]
    videoUrl?: string
    quoteText?: string
    slidePlans?: CarouselSlidePlan[]
    carouselJobId?: string
  }) => void
  postType?: SocialPostType
  onPostTypeChange?: (postType: SocialPostType) => void
  carouselImages?: string[]
  initialIdea?: string
}
