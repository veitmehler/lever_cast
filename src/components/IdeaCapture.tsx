'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Mic, Image as ImageIcon, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ImageGenerationModal } from '@/components/ImageGenerationModal'
import Image from 'next/image'

// TypeScript definitions for Web Speech API
interface SpeechRecognition extends EventTarget {
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

interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message?: string
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
  isFinal: boolean
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface Window {
  SpeechRecognition: {
    new (): SpeechRecognition
  }
  webkitSpeechRecognition: {
    new (): SpeechRecognition
  }
}

// Template type matching database schema
type Template = {
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

interface IdeaCaptureProps {
  onGenerate: (
    content: string, 
    platform: 'linkedin' | 'twitter' | 'facebook' | 'instagram' | 'telegram' | 'threads' | 'all' | ('linkedin' | 'twitter' | 'facebook' | 'instagram' | 'telegram' | 'threads')[], 
    templateId?: string, 
    image?: string,
    twitterFormat?: 'single' | 'thread'
  ) => void
  onImageAttached?: (imageUrl: string) => void // Callback when image is attached after posts are generated
}

export function IdeaCapture({ onGenerate, onImageAttached }: IdeaCaptureProps) {
  const [content, setContent] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isImageGenerationModalOpen, setIsImageGenerationModalOpen] = useState(false)
  // Use Set to track multiple selected platforms
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<'linkedin' | 'twitter' | 'facebook' | 'instagram' | 'telegram' | 'threads'>>(new Set())
  const [twitterFormat, setTwitterFormat] = useState<'single' | 'thread'>('single')
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true)
  const [availablePlatforms, setAvailablePlatforms] = useState<Set<string>>(new Set(['linkedin', 'twitter', 'facebook', 'instagram', 'telegram', 'threads', 'all']))
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const [recognitionError, setRecognitionError] = useState<string | null>(null)

  // Fetch available platforms (social connections + Telegram API key)
  const fetchAvailablePlatforms = async () => {
    try {
      const platforms = new Set<string>(['all']) // Always show "Select All"
      
      // Fetch social connections
      const connectionsResponse = await fetch('/api/social/connections')
      if (connectionsResponse.ok) {
        const connections = await connectionsResponse.json()
        connections.forEach((conn: { platform: string; isActive: boolean }) => {
          if (conn.isActive) {
            platforms.add(conn.platform)
          }
        })
      }
      
      // Check for Telegram API key
      const apiKeysResponse = await fetch('/api/api-keys')
      if (apiKeysResponse.ok) {
        const apiKeys = await apiKeysResponse.json()
        const hasTelegramKey = apiKeys.some((key: { provider: string }) => key.provider === 'telegram')
        if (hasTelegramKey) {
          platforms.add('telegram')
        }
      }
      
      setAvailablePlatforms(platforms)
    } catch (error) {
      console.error('Error fetching available platforms:', error)
      // On error, show all platforms as fallback
      setAvailablePlatforms(new Set(['linkedin', 'twitter', 'facebook', 'instagram', 'telegram', 'threads', 'all']))
    }
  }

  // Seed default templates
  // Defined first so fetchTemplates can reference it
  const seedTemplates = useCallback(async () => {
    try {
      console.log('[IdeaCapture] Seeding templates...')
      const response = await fetch('/api/templates/seed', {
        method: 'POST',
      })
      
      console.log('[IdeaCapture] Seed response status:', response.status)
      
      if (response.ok) {
        console.log('[IdeaCapture] Templates seeded successfully, refetching...')
        // Note: Will trigger fetchTemplates via the dependency
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('[IdeaCapture] Failed to seed templates:', response.status, errorData)
      }
    } catch (error) {
      console.error('[IdeaCapture] Error seeding templates:', error)
    }
  }, [])

  // Fetch templates from API
  const fetchTemplates = useCallback(async () => {
    try {
      setIsLoadingTemplates(true)
      console.log('[IdeaCapture] Fetching templates...')
      const response = await fetch('/api/templates')
      
      console.log('[IdeaCapture] Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('[IdeaCapture] Templates fetched:', data.length, 'templates')
        setTemplates(data)
        
        // If no templates exist, seed default ones
        if (data.length === 0) {
          console.log('[IdeaCapture] No templates found, seeding defaults...')
          await seedTemplates()
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('[IdeaCapture] Failed to fetch templates:', response.status, errorData)
        // Try to seed templates as fallback
        console.log('[IdeaCapture] Attempting to seed templates as fallback...')
        await seedTemplates()
      }
    } catch (error) {
      console.error('[IdeaCapture] Error fetching templates:', error)
      // Try to seed templates as fallback
      try {
        console.log('[IdeaCapture] Attempting to seed templates as fallback...')
        await seedTemplates()
      } catch (seedError) {
        console.error('[IdeaCapture] Failed to seed templates:', seedError)
      }
    } finally {
      setIsLoadingTemplates(false)
      console.log('[IdeaCapture] Templates loading complete')
    }
  }, [seedTemplates])

  useEffect(() => {
    fetchTemplates()
    fetchAvailablePlatforms()
    // Default to "none" - no template selected
    setSelectedTemplate('none')

    // Initialize Speech Recognition API
    if (typeof window !== 'undefined') {
      type WindowWithSpeechRecognition = Window & {
        SpeechRecognition?: new () => SpeechRecognition
        webkitSpeechRecognition?: new () => SpeechRecognition
      }
      const SpeechRecognitionConstructor = (window as unknown as WindowWithSpeechRecognition).SpeechRecognition || (window as unknown as WindowWithSpeechRecognition).webkitSpeechRecognition
      
      if (SpeechRecognitionConstructor) {
        const recognition = new SpeechRecognitionConstructor() as SpeechRecognition
        recognition.continuous = true // Keep listening until stopped
        recognition.interimResults = true // Show interim results
        recognition.lang = 'en-US' // Set language

        recognition.onstart = () => {
          console.log('[Voice] Speech recognition started')
          setRecognitionError(null)
        }

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let interimTranscript = ''
          let finalTranscript = ''

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' '
            } else {
              interimTranscript += transcript
            }
          }

          // Update content with final transcript
          if (finalTranscript) {
            setContent(prev => {
              // Remove any previous interim text and add final transcript
              const cleaned = prev.replace(interimTranscript, '').trim()
              return cleaned + (cleaned ? ' ' : '') + finalTranscript.trim()
            })
          } else if (interimTranscript) {
            // Show interim results (optional - can be removed if not desired)
            // For now, we'll only add final results to avoid clutter
          }
        }

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('[Voice] Speech recognition error:', event.error)
          setIsRecording(false)
          
          let errorMessage = 'Speech recognition error'
          switch (event.error) {
            case 'no-speech':
              errorMessage = 'No speech detected. Please try again.'
              break
            case 'audio-capture':
              errorMessage = 'No microphone found. Please check your microphone settings.'
              break
            case 'not-allowed':
              errorMessage = 'Microphone permission denied. Please allow microphone access and try again.'
              break
            case 'network':
              errorMessage = 'Network error. Please check your connection.'
              break
            case 'aborted':
              // User stopped recording, not an error
              return
            default:
              errorMessage = `Speech recognition error: ${event.error}`
          }
          setRecognitionError(errorMessage)
        }

        recognition.onend = () => {
          console.log('[Voice] Speech recognition ended')
          setIsRecording(false)
        }

        recognitionRef.current = recognition
      } else {
        setRecognitionError('Speech recognition is not supported in this browser. Please use Chrome or Edge.')
      }
    }

    // Cleanup on unmount
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch {
          // Ignore errors during cleanup
        }
      }
    }
  }, [fetchTemplates])

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      alert('Image size must be less than 10MB')
      return
    }

    setIsUploadingImage(true)

    try {
      // Upload to Supabase Storage
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/images/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Failed to upload image')
      }

      const result = await response.json()
      
      // Store the Supabase Storage URL instead of base64
      setSelectedImage(result.url)
      
      // Notify parent component if callback is provided (for attaching image after posts are generated)
      if (onImageAttached) {
        onImageAttached(result.url)
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      alert(error instanceof Error ? error.message : 'Failed to upload image')
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleImageGenerated = (imageUrl: string) => {
    setSelectedImage(imageUrl)
    
    // Notify parent component if callback is provided (for attaching image after posts are generated)
    if (onImageAttached) {
      onImageAttached(imageUrl)
    }
  }

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      setRecognitionError('Speech recognition is not available. Please use Chrome or Edge browser.')
      return
    }

    if (isRecording) {
      // Stop recording
      try {
        recognitionRef.current.stop()
        setIsRecording(false)
        setRecognitionError(null)
      } catch (error) {
        console.error('[Voice] Error stopping recognition:', error)
        setIsRecording(false)
      }
    } else {
      // Start recording
      try {
        setRecognitionError(null)
        recognitionRef.current.start()
        setIsRecording(true)
      } catch (error) {
        console.error('[Voice] Error starting recognition:', error)
        setRecognitionError('Failed to start recording. Please try again.')
        setIsRecording(false)
      }
    }
  }

  const handleGenerate = () => {
    if (content.trim() && selectedPlatforms.size > 0) {
      // Pass undefined if "none" is selected, otherwise pass the template ID
      const templateId = selectedTemplate === 'none' ? undefined : selectedTemplate
      
      // Convert Set to array for passing to onGenerate
      // If all available platforms are selected, pass 'all', otherwise pass array
      const allAvailable: ('linkedin' | 'twitter' | 'facebook' | 'instagram' | 'telegram' | 'threads')[] = []
      if (availablePlatforms.has('linkedin')) allAvailable.push('linkedin')
      if (availablePlatforms.has('twitter')) allAvailable.push('twitter')
      if (availablePlatforms.has('facebook')) allAvailable.push('facebook')
      if (availablePlatforms.has('instagram')) allAvailable.push('instagram')
      if (availablePlatforms.has('telegram')) allAvailable.push('telegram')
      if (availablePlatforms.has('threads')) allAvailable.push('threads')
      
      const allSelected = allAvailable.length > 0 && allAvailable.every(p => selectedPlatforms.has(p))
      const platformParam: 'linkedin' | 'twitter' | 'facebook' | 'instagram' | 'telegram' | 'threads' | 'all' | ('linkedin' | 'twitter' | 'facebook' | 'instagram' | 'telegram' | 'threads')[] = 
        allSelected ? 'all' : Array.from(selectedPlatforms)
      
      // Pass twitterFormat when Twitter is selected
      const twitterFormatParam = selectedPlatforms.has('twitter') 
        ? twitterFormat 
        : undefined
      onGenerate(content, platformParam, templateId, selectedImage || undefined, twitterFormatParam)
    } else if (content.trim() && selectedPlatforms.size === 0) {
      // Show error if no platforms selected
      alert('Please select at least one platform')
    }
  }

  const charCount = content.length
  const maxChars = 2000
  const charPercentage = (charCount / maxChars) * 100

  // Determine color based on percentage
  const getCharCountColor = () => {
    if (charCount > maxChars) {
      return 'text-red-500 dark:text-red-400 font-bold'
    } else if (charPercentage >= 95) {
      return 'text-red-600 dark:text-red-500 font-semibold'
    } else if (charPercentage >= 80) {
      return 'text-yellow-600 dark:text-yellow-400 font-medium'
    }
    return 'text-muted-foreground'
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-card-foreground mb-2">
          Capture Your Idea
        </h2>
        <p className="text-sm text-muted-foreground">
          Type or record your thought, and let AI transform it into a fact-driven post outline.
        </p>
      </div>

      {/* Main Input Area */}
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type your idea here... What's on your mind?"
          className="w-full min-h-[200px] p-4 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          disabled={isRecording}
        />
        
        {/* Character Counter */}
        <div className={`absolute bottom-3 right-3 text-xs ${getCharCountColor()}`}>
          {charCount} / {maxChars}
          {charCount > maxChars && ' ⚠️'}
        </div>
      </div>

      {/* Image Preview */}
      {selectedImage && (
        <div className="mt-4 relative inline-block">
          <Image
            src={selectedImage}
            alt="Attached"
            width={96}
            height={96}
            className="h-24 w-24 object-cover rounded-lg border border-border"
          />
          <button
            onClick={handleRemoveImage}
            className="absolute -top-2 -right-2 p-1 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Recording Indicator */}
      {isRecording && (
        <div className="mt-4 flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
          <div className="flex gap-1">
            <div className="w-1 h-4 bg-primary rounded animate-pulse" style={{ animationDelay: '0ms' }} />
            <div className="w-1 h-4 bg-primary rounded animate-pulse" style={{ animationDelay: '150ms' }} />
            <div className="w-1 h-4 bg-primary rounded animate-pulse" style={{ animationDelay: '300ms' }} />
            <div className="w-1 h-4 bg-primary rounded animate-pulse" style={{ animationDelay: '450ms' }} />
          </div>
          <span className="text-sm font-medium text-foreground">Recording... Speak now</span>
        </div>
      )}

      {/* Recognition Error */}
      {recognitionError && (
        <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <p className="text-sm text-destructive">{recognitionError}</p>
        </div>
      )}

      {/* Template & Platform Selection */}
      <div className="mt-4 flex gap-4">
        {/* Template Selection - 1/3 width */}
        <div className="w-1/3">
          <label className="text-sm font-medium text-card-foreground mb-2 block">
            Content Template
          </label>
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            disabled={isLoadingTemplates}
            className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="none">
              {isLoadingTemplates ? 'Loading templates...' : 'None (Raw AI)'}
            </option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name} - {template.tone}
              </option>
            ))}
          </select>
          {!isLoadingTemplates && templates.length === 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              No templates available. You can create templates on the Templates page.
            </p>
          )}
        </div>

        {/* Platform Selection - 2/3 width */}
        <div className="w-2/3">
          <label className="text-sm font-medium text-card-foreground mb-2 block">
            Target Platform {selectedPlatforms.size > 0 && `(${selectedPlatforms.size} selected)`}
          </label>
          <div className="flex gap-2 flex-wrap">
            {availablePlatforms.has('linkedin') && (
              <button
                type="button"
                onClick={() => {
                  setSelectedPlatforms(prev => {
                    const next = new Set(prev)
                    if (next.has('linkedin')) {
                      next.delete('linkedin')
                    } else {
                      next.add('linkedin')
                    }
                    return next
                  })
                }}
                className={`flex-1 min-w-[100px] px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedPlatforms.has('linkedin')
                    ? 'bg-[#0A66C2] text-white'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                LinkedIn
              </button>
            )}
            {availablePlatforms.has('twitter') && (
              <button
                type="button"
                onClick={() => {
                  setSelectedPlatforms(prev => {
                    const next = new Set(prev)
                    if (next.has('twitter')) {
                      next.delete('twitter')
                    } else {
                      next.add('twitter')
                    }
                    return next
                  })
                }}
                className={`flex-1 min-w-[100px] px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedPlatforms.has('twitter')
                    ? 'bg-[#1DA1F2] text-white'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                Twitter
              </button>
            )}
            {availablePlatforms.has('facebook') && (
              <button
                type="button"
                onClick={() => {
                  setSelectedPlatforms(prev => {
                    const next = new Set(prev)
                    if (next.has('facebook')) {
                      next.delete('facebook')
                    } else {
                      next.add('facebook')
                    }
                    return next
                  })
                }}
                className={`flex-1 min-w-[100px] px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedPlatforms.has('facebook')
                    ? 'bg-[#1877F2] text-white'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                Facebook
              </button>
            )}
            {availablePlatforms.has('instagram') && (
              <button
                type="button"
                onClick={() => {
                  setSelectedPlatforms(prev => {
                    const next = new Set(prev)
                    if (next.has('instagram')) {
                      next.delete('instagram')
                    } else {
                      next.add('instagram')
                    }
                    return next
                  })
                }}
                className={`flex-1 min-w-[100px] px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedPlatforms.has('instagram')
                    ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                Instagram
              </button>
            )}
            {availablePlatforms.has('telegram') && (
              <button
                type="button"
                onClick={() => {
                  setSelectedPlatforms(prev => {
                    const next = new Set(prev)
                    if (next.has('telegram')) {
                      next.delete('telegram')
                    } else {
                      next.add('telegram')
                    }
                    return next
                  })
                }}
                className={`flex-1 min-w-[100px] px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedPlatforms.has('telegram')
                    ? 'bg-[#0088cc] text-white'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                Telegram
              </button>
            )}
            {availablePlatforms.has('threads') && (
              <button
                type="button"
                onClick={() => {
                  setSelectedPlatforms(prev => {
                    const next = new Set(prev)
                    if (next.has('threads')) {
                      next.delete('threads')
                    } else {
                      next.add('threads')
                    }
                    return next
                  })
                }}
                className={`flex-1 min-w-[100px] px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedPlatforms.has('threads')
                    ? 'bg-black text-white dark:bg-white dark:text-black'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                Threads
              </button>
            )}
            {availablePlatforms.has('all') && (
              <button
                type="button"
                onClick={() => {
                  // Get all available platforms (excluding 'all')
                  const allAvailable: ('linkedin' | 'twitter' | 'facebook' | 'instagram' | 'telegram' | 'threads')[] = []
                  if (availablePlatforms.has('linkedin')) allAvailable.push('linkedin')
                  if (availablePlatforms.has('twitter')) allAvailable.push('twitter')
                  if (availablePlatforms.has('facebook')) allAvailable.push('facebook')
                  if (availablePlatforms.has('instagram')) allAvailable.push('instagram')
                  if (availablePlatforms.has('telegram')) allAvailable.push('telegram')
                  if (availablePlatforms.has('threads')) allAvailable.push('threads')
                  
                  // Check if all are selected
                  const allSelected = allAvailable.every(p => selectedPlatforms.has(p))
                  
                  if (allSelected) {
                    // Deselect all
                    setSelectedPlatforms(new Set())
                  } else {
                    // Select all
                    setSelectedPlatforms(new Set(allAvailable))
                  }
                }}
                className={`flex-1 min-w-[100px] px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  (() => {
                    const allAvailable: ('linkedin' | 'twitter' | 'facebook' | 'instagram' | 'telegram' | 'threads')[] = []
                    if (availablePlatforms.has('linkedin')) allAvailable.push('linkedin')
                    if (availablePlatforms.has('twitter')) allAvailable.push('twitter')
                    if (availablePlatforms.has('facebook')) allAvailable.push('facebook')
                    if (availablePlatforms.has('instagram')) allAvailable.push('instagram')
                    if (availablePlatforms.has('telegram')) allAvailable.push('telegram')
                    if (availablePlatforms.has('threads')) allAvailable.push('threads')
                    return allAvailable.every(p => selectedPlatforms.has(p))
                  })()
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                Select All
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Twitter Format Selection */}
      {selectedPlatforms.has('twitter') && (
        <div className="mt-4">
          <label className="text-sm font-medium text-card-foreground mb-2 block">
            Twitter Format
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="twitterFormat"
                value="single"
                checked={twitterFormat === 'single'}
                onChange={(e) => setTwitterFormat(e.target.value as 'single' | 'thread')}
                className="w-4 h-4 text-primary focus:ring-primary"
              />
              <span className="text-sm text-card-foreground">Single Post</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="twitterFormat"
                value="thread"
                checked={twitterFormat === 'thread'}
                onChange={(e) => setTwitterFormat(e.target.value as 'single' | 'thread')}
                className="w-4 h-4 text-primary focus:ring-primary"
              />
              <span className="text-sm text-card-foreground">Thread</span>
            </label>
          </div>
          {twitterFormat === 'thread' && (
            <p className="text-xs text-muted-foreground mt-1">
              Create a thread with summary + key insights (templates not used for threads)
            </p>
          )}
        </div>
      )}

      {/* Template Preview */}
      {selectedTemplate !== 'none' && templates.find(t => t.id === selectedTemplate) && (
        <div className="mt-4 p-4 rounded-lg bg-secondary/30 border border-border">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                ✨ {templates.find(t => t.id === selectedTemplate)?.name} Template
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {templates.find(t => t.id === selectedTemplate)?.description}
              </p>
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary font-medium">
              {templates.find(t => t.id === selectedTemplate)?.tone}
            </span>
          </div>
          
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {/* LinkedIn Preview */}
            {selectedPlatforms.has('linkedin') && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded bg-[#0A66C2] flex items-center justify-center text-white text-[10px] font-bold">
                    in
                  </div>
                  <span className="text-xs font-medium text-foreground">LinkedIn Format</span>
                </div>
                <div className="rounded border border-border bg-background p-3 max-h-32 overflow-y-auto">
                  <pre className="text-[10px] text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
                    {templates.find(t => t.id === selectedTemplate)?.linkedinTemplate}
                  </pre>
                </div>
              </div>
            )}

            {/* Twitter Preview */}
            {selectedPlatforms.has('twitter') && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded bg-[#1DA1F2] flex items-center justify-center text-white text-[10px] font-bold">
                    𝕏
                  </div>
                  <span className="text-xs font-medium text-foreground">Twitter Format</span>
                </div>
                <div className="rounded border border-border bg-background p-3 max-h-32 overflow-y-auto">
                  <pre className="text-[10px] text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
                    {templates.find(t => t.id === selectedTemplate)?.twitterTemplate}
                  </pre>
                </div>
              </div>
            )}

            {/* Facebook Preview */}
            {selectedPlatforms.has('facebook') && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded bg-[#1877F2] flex items-center justify-center text-white text-[10px] font-bold">
                    f
                  </div>
                  <span className="text-xs font-medium text-foreground">Facebook Format</span>
                </div>
                <div className="rounded border border-border bg-background p-3 max-h-32 overflow-y-auto">
                  <pre className="text-[10px] text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
                    {templates.find(t => t.id === selectedTemplate)?.facebookTemplate || 'No Facebook template available'}
                  </pre>
                </div>
              </div>
            )}

            {/* Instagram Preview */}
            {selectedPlatforms.has('instagram') && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center text-white text-[10px] font-bold">
                    📷
                  </div>
                  <span className="text-xs font-medium text-foreground">Instagram Format</span>
                </div>
                <div className="rounded border border-border bg-background p-3 max-h-32 overflow-y-auto">
                  <pre className="text-[10px] text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
                    {templates.find(t => t.id === selectedTemplate)?.instagramTemplate || 'No Instagram template available'}
                  </pre>
                </div>
              </div>
            )}

            {/* Telegram Preview */}
            {selectedPlatforms.has('telegram') && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded bg-[#0088cc] flex items-center justify-center text-white text-[10px] font-bold">
                    ✈
                  </div>
                  <span className="text-xs font-medium text-foreground">Telegram Format</span>
                </div>
                <div className="rounded border border-border bg-background p-3 max-h-32 overflow-y-auto">
                  <pre className="text-[10px] text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
                    {templates.find(t => t.id === selectedTemplate)?.telegramTemplate || 'No Telegram template available'}
                  </pre>
                </div>
              </div>
            )}

            {/* Threads Preview */}
            {selectedPlatforms.has('threads') && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded bg-black dark:bg-white flex items-center justify-center text-white dark:text-black text-[10px] font-bold">
                    @
                  </div>
                  <span className="text-xs font-medium text-foreground">Threads Format</span>
                </div>
                <div className="rounded border border-border bg-background p-3 max-h-32 overflow-y-auto">
                  <pre className="text-[10px] text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
                    {templates.find(t => t.id === selectedTemplate)?.threadsTemplate || 'No Threads template available'}
                  </pre>
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-[10px] text-muted-foreground">
              💡 <span className="font-medium">How it works:</span> Type your raw idea above, then click Generate. AI will automatically format it using this template structure.
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-6 flex items-center gap-3 flex-wrap">
        <button
          onClick={toggleRecording}
          className={`p-3 md:p-3 min-h-[44px] min-w-[44px] rounded-full transition-all flex items-center justify-center ${
            isRecording
              ? 'bg-destructive text-destructive-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
          title={isRecording ? 'Stop recording' : 'Start voice recording'}
        >
          <Mic className="w-5 h-5" />
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploadingImage}
          className="p-3 md:p-3 min-h-[44px] min-w-[44px] rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          title={isUploadingImage ? 'Uploading image...' : 'Upload image'}
        >
          {isUploadingImage ? (
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <ImageIcon className="w-5 h-5" />
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />

        <button
          onClick={() => setIsImageGenerationModalOpen(true)}
          className="p-3 md:p-3 min-h-[44px] min-w-[44px] rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all flex items-center justify-center"
          title="Generate image with AI"
        >
          <Sparkles className="w-5 h-5" />
        </button>

        <div className="flex-1" />

        <Button
          onClick={handleGenerate}
          disabled={!content.trim() || isRecording}
          className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Generate Outline
        </Button>
      </div>

      {/* Image Generation Modal */}
      <ImageGenerationModal
        isOpen={isImageGenerationModalOpen}
        onClose={() => setIsImageGenerationModalOpen(false)}
        onImageGenerated={handleImageGenerated}
        postContent={content || 'Generate an image for my post'}
      />
    </div>
  )
}

