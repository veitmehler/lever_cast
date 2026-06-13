import { useState, useRef, useEffect, useCallback, type ChangeEvent } from 'react'
import type { GeneratedCarouselResponse, GeneratedQuoteCardResponse } from '@/lib/social/types'
import { GHL_PLATFORMS } from '@/lib/ghl/types'
import { toast } from 'sonner'
import type { IdeaCaptureProps, SpeechRecognition, SpeechRecognitionErrorEvent, SpeechRecognitionEvent, Template } from './types'

export function useIdeaCapture({
  onGenerate,
  onImageAttached,
  onMediaAssetsReady,
  postType = 'standard',
  onPostTypeChange,
  carouselImages = [],
  initialIdea,
}: IdeaCaptureProps) {
  const [content, setContent] = useState(initialIdea ?? '')
  const [isRecording, setIsRecording] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isImageGenerationModalOpen, setIsImageGenerationModalOpen] = useState(false)
  const [isLibraryPickerOpen, setIsLibraryPickerOpen] = useState(false)
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
  const [isGeneratingAssets, setIsGeneratingAssets] = useState(false)
  const [quoteVariant, setQuoteVariant] = useState<'feed' | 'story'>('feed')

  // Fetch available platforms. A platform is offered using the SAME system that
  // actually publishes it (see dispatchPublish): LinkedIn/Facebook/Instagram/
  // Threads publish via Omniply (GHL), so they're available when an Omniply
  // account is mapped — NOT from a legacy direct-OAuth row, which would publish
  // via Omniply anyway and fail without ghl_settings. Twitter uses direct OAuth;
  // Telegram uses its API key.
  const fetchAvailablePlatforms = async () => {
    try {
      const platforms = new Set<string>(['all']) // Always show "Select All"
      const ghlPlatforms = GHL_PLATFORMS as readonly string[]

      // Omniply (GHL)-managed platforms: available when an account is mapped
      try {
        const ghlResponse = await fetch('/api/ghl/settings')
        if (ghlResponse.ok) {
          const ghl = await ghlResponse.json()
          const accountIds = (ghl?.accountIds ?? {}) as Record<string, string | undefined>
          for (const platform of ghlPlatforms) {
            if (accountIds[platform]) {
              platforms.add(platform)
            }
          }
        }
      } catch (ghlError) {
        console.error('Error fetching Omniply settings:', ghlError)
      }

      // Direct-OAuth platforms (e.g. Twitter): active social connections only.
      // Skip GHL-managed platforms here — those are gated by Omniply above.
      const connectionsResponse = await fetch('/api/social/connections')
      if (connectionsResponse.ok) {
        const connections = await connectionsResponse.json()
        connections.forEach((conn: { platform: string; isActive: boolean }) => {
          if (conn.isActive && !ghlPlatforms.includes(conn.platform)) {
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
              errorMessage = 'Voice dictation needs a Chromium browser (Chrome or Edge) with internet access to Google’s speech service. It may be blocked by Brave, Arc, a VPN, or an ad blocker.'
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

  const handleImageSelect = async (e: ChangeEvent<HTMLInputElement>) => {
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

      // Always pass the explicit list of selected platforms. (Previously this
      // collapsed to 'all' when every available platform was selected, but the
      // server then re-derived 'all' from direct-OAuth `social_connections`
      // only and fell back to a hardcoded ['linkedin','twitter'] — ignoring
      // Omniply-connected platforms. Sending the exact selection generates
      // precisely the chosen platforms.)
      const platformParam: ('linkedin' | 'twitter' | 'facebook' | 'instagram' | 'telegram' | 'threads')[] =
        Array.from(selectedPlatforms)

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

  const selectedPlatformList = Array.from(selectedPlatforms)

  const handleGenerateQuoteCard = async () => {
    if (!content.trim()) {
      toast.error('Enter your content first')
      return
    }

    setIsGeneratingAssets(true)
    try {
      const response = await fetch('/api/social/generate/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          variant: quoteVariant,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.details || errorData.error || 'Failed to generate quote card')
      }

      const result = (await response.json()) as GeneratedQuoteCardResponse
      setSelectedImage(result.imageUrl)
      onImageAttached?.(result.imageUrl)
      onMediaAssetsReady?.({
        postType: 'quote',
        imageUrl: result.imageUrl,
        quoteText: result.quoteText,
      })
      toast.success('Quote card generated!')
    } catch (error) {
      console.error('Quote card generation failed:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to generate quote card')
    } finally {
      setIsGeneratingAssets(false)
    }
  }

  const handleGenerateCarousel = async () => {
    if (!content.trim()) {
      toast.error('Enter your content first')
      return
    }

    setIsGeneratingAssets(true)
    try {
      const response = await fetch('/api/social/generate/carousel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          platforms: selectedPlatformList,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.details || errorData.error || 'Failed to generate carousel')
      }

      const result = (await response.json()) as GeneratedCarouselResponse
      const firstUrl = result.imageUrls[0]
      if (firstUrl) {
        setSelectedImage(firstUrl)
        onImageAttached?.(firstUrl)
      }
      onMediaAssetsReady?.({
        postType: 'carousel',
        imageUrl: firstUrl,
        mediaUrls: result.imageUrls,
        slidePlans: result.slidePlans,
        carouselJobId: result.jobId,
      })
      toast.success(`Carousel generated (${result.slideCount} slides)`)
    } catch (error) {
      console.error('Carousel generation failed:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to generate carousel')
    } finally {
      setIsGeneratingAssets(false)
    }
  }

  // Video assets (reel / hook / quote video) take several minutes to build, so
  // the server enqueues a job and returns immediately; we poll for the result.
  // Waiting on a single HTTP request would exceed the proxy/serverless timeout
  // (the server would finish but the browser request would have already failed).
  const generateVideoAsset = async (
    endpoint: string,
    postType: 'video_reel' | 'hook_video' | 'quote_video',
    successMessage: string,
  ) => {
    if (!content.trim()) {
      toast.error('Enter your content first')
      return
    }
    setIsGeneratingAssets(true)
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.details || errorData.error || 'Failed to start video generation')
      }
      const { jobId } = await response.json()
      if (!jobId) throw new Error('Video generation did not start')

      // Poll the job until it completes or fails (ceiling well above the ~6 min
      // worst case so a slow generation isn't reported as a failure).
      const deadline = Date.now() + 15 * 60 * 1000
      let videoUrl: string | undefined
      while (Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 4000))
        const statusRes = await fetch(`/api/social/generate/video-status/${jobId}`)
        if (!statusRes.ok) continue
        const job = await statusRes.json()
        if (job.status === 'completed') {
          videoUrl = job.videoUrl
          break
        }
        if (job.status === 'failed') {
          throw new Error(job.error || 'Video generation failed')
        }
      }
      if (!videoUrl) throw new Error('Video generation timed out — please try again')

      onMediaAssetsReady?.({ postType, videoUrl })
      toast.success(successMessage)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate video')
    } finally {
      setIsGeneratingAssets(false)
    }
  }

  const handleGenerateVideoReel = () =>
    generateVideoAsset('/api/social/generate/video-reel', 'video_reel', 'Video reel generated!')

  const handleGenerateHookVideo = () =>
    generateVideoAsset('/api/social/generate/hook-video', 'hook_video', 'Hook video generated!')

  const handleGenerateQuoteVideo = () =>
    generateVideoAsset('/api/social/generate/quote-video', 'quote_video', 'Quote video generated!')

  // Single entry point for the primary "Generate Posts" button: produce the
  // per-platform text (so the preview cards appear) AND, for non-"standard"
  // post types, the matching media asset. Text is generated first so the reset
  // inside the parent's generate handler clears any stale media before the
  // asset populates it.
  const handleGeneratePost = async () => {
    if (!content.trim()) return
    if (selectedPlatforms.size === 0) {
      alert('Please select at least one platform')
      return
    }

    handleGenerate()

    switch (postType) {
      case 'quote':
        await handleGenerateQuoteCard()
        break
      case 'carousel':
        await handleGenerateCarousel()
        break
      case 'video_reel':
        await handleGenerateVideoReel()
        break
      case 'hook_video':
        await handleGenerateHookVideo()
        break
      case 'quote_video':
        await handleGenerateQuoteVideo()
        break
      default:
        break
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

  return {
    // seed props passed through for the view
    postType,
    onPostTypeChange,
    onImageAttached,
    carouselImages,
    // state
    content,
    setContent,
    isRecording,
    selectedImage,
    setSelectedImage,
    isUploadingImage,
    isImageGenerationModalOpen,
    setIsImageGenerationModalOpen,
    isLibraryPickerOpen,
    setIsLibraryPickerOpen,
    selectedPlatforms,
    setSelectedPlatforms,
    twitterFormat,
    setTwitterFormat,
    templates,
    selectedTemplate,
    setSelectedTemplate,
    isLoadingTemplates,
    availablePlatforms,
    fileInputRef,
    recognitionError,
    isGeneratingAssets,
    quoteVariant,
    setQuoteVariant,
    // handlers
    handleImageSelect,
    handleRemoveImage,
    handleImageGenerated,
    toggleRecording,
    handleGenerate,
    handleGeneratePost,
    handleGenerateQuoteCard,
    handleGenerateCarousel,
    handleGenerateVideoReel,
    handleGenerateHookVideo,
    handleGenerateQuoteVideo,
    // derived
    selectedPlatformList,
    charCount,
    maxChars,
    getCharCountColor,
  }
}

export type IdeaCaptureView = ReturnType<typeof useIdeaCapture>
