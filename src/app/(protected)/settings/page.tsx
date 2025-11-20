'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Eye, EyeOff, Save, Check, Loader2, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/ThemeProvider'
import { toast } from 'sonner'

type ApiKeyData = {
  id: string
  provider: string
  maskedKey: string
  createdAt: string
  updatedAt: string
}

type SocialConnection = {
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

type SocialPage = {
  id: string
  name: string
  vanityName?: string
  access_token?: string
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({})
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({
    openai: '',
    anthropic: '',
    gemini: '',
    openrouter: ''
  })
  const [maskedKeys, setMaskedKeys] = useState<Record<string, string>>({})
  const [selectedProvider, setSelectedProvider] = useState('openai')
  const [selectedModels, setSelectedModels] = useState<Record<string, string>>({
    openai: 'gpt-4o-mini',
    anthropic: 'claude-3-5-sonnet-20241022',
    gemini: 'gemini-pro',
    openrouter: 'openai/gpt-4o-mini',
  })
  const [providerModels, setProviderModels] = useState<Record<string, Array<{ value: string; label: string }>>>({
    openai: [],
    anthropic: [],
    gemini: [],
    openrouter: [],
  })
  const [isLoadingModels, setIsLoadingModels] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingAISettings, setIsSavingAISettings] = useState(false)
  const [socialConnections, setSocialConnections] = useState<SocialConnection[]>([])
  const [isLoadingConnections, setIsLoadingConnections] = useState(true)
  const [isDisconnecting, setIsDisconnecting] = useState<Record<string, boolean>>({})
  const [isConnecting, setIsConnecting] = useState<Record<string, boolean>>({})
  const [editingApiKeys, setEditingApiKeys] = useState<Record<string, boolean>>({})
  const [showImageApiKeys, setShowImageApiKeys] = useState<Record<string, boolean>>({})
  const [availablePages, setAvailablePages] = useState<Record<string, SocialPage[]>>({})
  const [isLoadingPages, setIsLoadingPages] = useState<Record<string, boolean>>({})
  const [rateLimitUntil, setRateLimitUntil] = useState<Record<string, number | null>>({})
  const [postTargetTypes, setPostTargetTypes] = useState<Record<string, 'personal' | 'page'>>({})
  // Track which platforms have already had their pages fetched to prevent duplicate calls
  const pagesFetchedRef = useRef<Set<string>>(new Set())
  const [selectedPageIds, setSelectedPageIds] = useState<Record<string, string>>({})
  const [isRefreshingUsername, setIsRefreshingUsername] = useState<Record<string, boolean>>({})

  // Image generation settings
  const [imageApiKeys, setImageApiKeys] = useState<Record<string, string>>({
    fal: '',
    'openai-dalle': '',
    replicate: '',
  })
  const [imageMaskedKeys, setImageMaskedKeys] = useState<Record<string, string>>({})
  const [selectedImageProvider, setSelectedImageProvider] = useState('fal')
  const [selectedImageModels, setSelectedImageModels] = useState<Record<string, string>>({
    fal: 'fal-ai/flux/schnell',
    'openai-dalle': 'dall-e-3',
    replicate: 'stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf',
  })
  const [imageProviderModels, setImageProviderModels] = useState<Record<string, Array<{ value: string; label: string }>>>({
    fal: [],
    'openai-dalle': [],
    replicate: [],
  })
  const [isLoadingImageModels, setIsLoadingImageModels] = useState<Record<string, boolean>>({})
  const [isSavingImageSettings, setIsSavingImageSettings] = useState(false)
  const [defaultImageStyle, setDefaultImageStyle] = useState('')
  const [editingImageApiKeys, setEditingImageApiKeys] = useState<Record<string, boolean>>({})
  
  // Writing style settings
  const [writingStyle, setWritingStyle] = useState('')
  const [isSavingWritingStyle, setIsSavingWritingStyle] = useState(false)
  const [isAnalyzingStyle, setIsAnalyzingStyle] = useState(false)
  const [showStyleAnalysisModal, setShowStyleAnalysisModal] = useState(false)
  const [sampleText, setSampleText] = useState('')
  
  // Telegram channel settings
  const [telegramChatId, setTelegramChatId] = useState('')
  const [isSavingTelegramChatId, setIsSavingTelegramChatId] = useState(false)

  // Fetch settings and API keys on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true)
        
        // Fetch settings
        const settingsResponse = await fetch('/api/settings')
        if (settingsResponse.ok) {
          const settings = await settingsResponse.json()
          if (settings.defaultProvider) {
            setSelectedProvider(settings.defaultProvider)
          }
          if (settings.defaultModel) {
            try {
              const models = JSON.parse(settings.defaultModel)
              setSelectedModels(prev => ({ ...prev, ...models }))
            } catch {
              // If not JSON, ignore
            }
          }

          // Fetch image generation settings
          if (settings.defaultImageProvider) {
            setSelectedImageProvider(settings.defaultImageProvider)
          }
          if (settings.defaultImageModel) {
            try {
              const models = JSON.parse(settings.defaultImageModel)
              setSelectedImageModels(prev => ({ ...prev, ...models }))
            } catch {
              // If not JSON, ignore
            }
          }
          if (settings.defaultImageStyle) {
            setDefaultImageStyle(settings.defaultImageStyle)
          }
          if (settings.writingStyle) {
            setWritingStyle(settings.writingStyle)
          }
          if (settings.telegramChatId) {
            setTelegramChatId(settings.telegramChatId)
          }
        }

        // Fetch API keys
        const keysResponse = await fetch('/api/api-keys')
        if (keysResponse.ok) {
          const keys: ApiKeyData[] = await keysResponse.json()
          const masked: Record<string, string> = {}
          keys.forEach(key => {
            masked[key.provider] = key.maskedKey
          })
          setMaskedKeys(masked)
          
          // Fetch models for LLM providers that have API keys
          const llmProviders = ['openai', 'anthropic', 'gemini', 'openrouter']
          Object.keys(masked).forEach(provider => {
            if (masked[provider] && llmProviders.includes(provider)) {
              console.log(`Found API key for ${provider}, fetching models...`)
              fetchModelsForProvider(provider, true) // Pass true since we know it has a key
            }
          })
        }

        // Fetch image API keys
        const imageKeysResponse = await fetch('/api/api-keys')
        if (imageKeysResponse.ok) {
          const keys: ApiKeyData[] = await imageKeysResponse.json()
          const masked: Record<string, string> = {}
          keys.forEach(key => {
            if (['fal', 'openai-dalle', 'replicate', 'telegram'].includes(key.provider)) {
              masked[key.provider] = key.maskedKey
            }
          })
          setImageMaskedKeys(masked)
          
          // Fetch models for image providers that have API keys
          Object.keys(masked).forEach(provider => {
            if (masked[provider] && !['telegram'].includes(provider)) {
              fetchImageModelsForProvider(provider)
            }
          })
        }
      } catch (error) {
        console.error('Error fetching settings:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Function to fetch image models for a provider
  const fetchImageModelsForProvider = async (provider: string) => {
    if (!imageMaskedKeys[provider]) return // No API key, can't fetch models
    
    setIsLoadingImageModels(prev => ({ ...prev, [provider]: true }))
    try {
      const response = await fetch(`/api/ai/models/${provider}`)
      if (response.ok) {
        const data = await response.json()
        if (data.models && data.models.length > 0) {
          setImageProviderModels(prev => ({
            ...prev,
            [provider]: data.models,
          }))
          // Set default model if not already set
          if (!selectedImageModels[provider] && data.models[0]) {
            setSelectedImageModels(prev => ({
              ...prev,
              [provider]: data.models[0].value,
            }))
          }
        }
      }
    } catch (error) {
      console.error(`Error fetching image models for ${provider}:`, error)
    } finally {
      setIsLoadingImageModels(prev => ({ ...prev, [provider]: false }))
    }
  }

  // Fetch image models when API keys are saved
  useEffect(() => {
    Object.keys(imageMaskedKeys).forEach(provider => {
      if (imageMaskedKeys[provider]) {
        fetchImageModelsForProvider(provider)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageMaskedKeys])

  const handleSaveImageApiKey = async (provider: string) => {
    const apiKey = imageApiKeys[provider]?.trim()
    if (!apiKey) {
      toast.error('Please enter an API key')
      return
    }

    try {
      setIsSaving(true)
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider, apiKey }),
      })

      if (response.ok) {
        const result: ApiKeyData = await response.json()
        setImageMaskedKeys(prev => ({ ...prev, [provider]: result.maskedKey }))
        setImageApiKeys(prev => ({ ...prev, [provider]: '' })) // Clear input
        setEditingImageApiKeys(prev => ({ ...prev, [provider]: false }))
        // Fetch models for this provider
        fetchImageModelsForProvider(provider)
        toast.success(`${provider} API key saved successfully`)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to save API key')
      }
    } catch (error) {
      console.error('Error saving API key:', error)
      toast.error('Failed to save API key')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveImageSettings = async () => {
    try {
      setIsSavingImageSettings(true)
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          defaultImageProvider: selectedImageProvider,
          defaultImageModel: JSON.stringify(selectedImageModels),
          defaultImageStyle: defaultImageStyle,
        }),
      })

      if (response.ok) {
        toast.success('Image generation settings saved successfully')
      } else {
        const error = await response.json()
        console.error('Failed to save image settings:', error)
        toast.error(error.details || error.error || 'Failed to save image settings')
      }
    } catch (error) {
      console.error('Error saving image settings:', error)
      toast.error('Failed to save image settings')
    } finally {
      setIsSavingImageSettings(false)
    }
  }

  const handleSaveWritingStyle = async () => {
    try {
      setIsSavingWritingStyle(true)
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          writingStyle: writingStyle || null,
        }),
      })

      if (response.ok) {
        toast.success('Writing style saved successfully')
      } else {
        const error = await response.json()
        console.error('Failed to save writing style:', error)
        toast.error(error.details || error.error || 'Failed to save writing style')
      }
    } catch (error) {
      console.error('Error saving writing style:', error)
      toast.error('Failed to save writing style')
    } finally {
      setIsSavingWritingStyle(false)
    }
  }

  const handleAnalyzeWritingStyle = async () => {
    if (!sampleText.trim() || sampleText.trim().split(/\s+/).length < 500) {
      toast.error('Please paste at least 500 words of sample text')
      return
    }

    try {
      setIsAnalyzingStyle(true)
      const response = await fetch('/api/ai/analyze-writing-style', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sampleText: sampleText.trim(),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setWritingStyle(data.writingStyle || '')
        setShowStyleAnalysisModal(false)
        setSampleText('')
        toast.success('Writing style analyzed and applied successfully')
      } else {
        const error = await response.json()
        console.error('Failed to analyze writing style:', error)
        toast.error(error.details || error.error || 'Failed to analyze writing style')
      }
    } catch (error) {
      console.error('Error analyzing writing style:', error)
      toast.error('Failed to analyze writing style')
    } finally {
      setIsAnalyzingStyle(false)
    }
  }

  // Function to fetch models for a provider
  const fetchModelsForProvider = async (provider: string, hasApiKey?: boolean) => {
    // Check if provider has API key (either from parameter or state)
    const hasKey = hasApiKey !== undefined ? hasApiKey : !!maskedKeys[provider]
    if (!hasKey) {
      console.log(`Skipping model fetch for ${provider}: No API key`)
      return // No API key, can't fetch models
    }
    
    console.log(`Fetching models for ${provider}...`)
    setIsLoadingModels(prev => ({ ...prev, [provider]: true }))
    try {
      const response = await fetch(`/api/ai/models/${provider}`)
      if (response.ok) {
        const data = await response.json()
        console.log(`Models fetched for ${provider}:`, data.models?.length || 0)
        if (data.models && data.models.length > 0) {
          setProviderModels(prev => ({
            ...prev,
            [provider]: data.models,
          }))
          // Set default model if not already set
          setSelectedModels(prev => {
            if (!prev[provider] && data.models[0]) {
              return {
                ...prev,
                [provider]: data.models[0].value,
              }
            }
            return prev
          })
        } else {
          console.warn(`No models returned for ${provider}`)
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error(`Failed to fetch models for ${provider}:`, response.status, errorData)
      }
    } catch (error) {
      console.error(`Error fetching models for ${provider}:`, error)
    } finally {
      setIsLoadingModels(prev => ({ ...prev, [provider]: false }))
    }
  }

  // Track loading state with ref to avoid dependency issues
  const isLoadingPagesRef = useRef<Set<string>>(new Set())
  // Store pages in ref so we can access latest value without dependency issues
  const availablePagesRef = useRef<Record<string, SocialPage[]>>({})
  // Track rate limit cooldowns (platform -> timestamp when we can retry)
  const rateLimitCooldownRef = useRef<Record<string, number>>({})
  
  // Update ref whenever state changes
  useEffect(() => {
    availablePagesRef.current = availablePages
  }, [availablePages])
  
  // Fetch pages for a platform
  // Using useCallback with empty deps and refs to break dependency cycle
  const fetchPages = useCallback(async (platform: string, forceRefresh = false): Promise<SocialPage[]> => {
    if (platform !== 'linkedin' && platform !== 'facebook') return []
    
    // Prevent duplicate calls: if already loading (unless force refresh)
    if (!forceRefresh && isLoadingPagesRef.current.has(platform)) {
      // Return current pages from ref (always up-to-date)
      return availablePagesRef.current[platform] || []
    }
    
    // Check rate limit cooldown
    const cooldownEnd = rateLimitCooldownRef.current[platform]
    if (!forceRefresh && cooldownEnd && Date.now() < cooldownEnd) {
      console.log(`[Settings] Rate limit cooldown active for ${platform}, skipping fetch`)
      return availablePagesRef.current[platform] || []
    }
    
    // Only skip if already fetched AND we have pages (not if fetch failed)
    if (!forceRefresh && pagesFetchedRef.current.has(platform)) {
      const cachedPages = availablePagesRef.current[platform] || []
      // If we have cached pages, return them
      if (cachedPages.length > 0) {
        return cachedPages
      }
      // If cached pages are empty but not due to rate limit, allow retry
      // (Rate limit cooldown check above will prevent immediate retry)
    }
    
    try {
      isLoadingPagesRef.current.add(platform)
      setIsLoadingPages(prev => ({ ...prev, [platform]: true }))
      const response = await fetch(`/api/social/${platform}/pages`)
      if (response.ok) {
        const data = await response.json() as { pages: SocialPage[]; rateLimit?: boolean }
        const pages = data.pages || []
        
        // If rate limit, set cooldown (5 minutes)
        if (data.rateLimit) {
          console.warn(`[Settings] Rate limit detected for ${platform}, setting 5-minute cooldown`)
          const cooldownEndTime = Date.now() + 5 * 60 * 1000 // 5 minutes
          rateLimitCooldownRef.current[platform] = cooldownEndTime
          setRateLimitUntil(prev => ({ ...prev, [platform]: cooldownEndTime }))
          // Still mark as fetched to prevent immediate retries
          pagesFetchedRef.current.add(platform)
        } else {
          // Clear cooldown if we got a successful response
          delete rateLimitCooldownRef.current[platform]
          setRateLimitUntil(prev => {
            if (!prev[platform]) return prev
            const updated = { ...prev }
            delete updated[platform]
            return updated
          })
          // Mark as fetched if API call succeeded (even if pages array is empty)
          pagesFetchedRef.current.add(platform)
        }
        
        setAvailablePages(prev => ({ ...prev, [platform]: pages }))
        // Update ref immediately
        availablePagesRef.current[platform] = pages
        return pages
      } else {
        let errorData: { error?: string; rateLimit?: boolean; retryAfterMs?: number } | null = null
        try {
          errorData = await response.json()
        } catch {
          errorData = null
        }

        const isRateLimitError = response.status === 429 || errorData?.rateLimit
        const retryAfterMs = errorData?.retryAfterMs || 5 * 60 * 1000

        if (isRateLimitError) {
          console.warn(`[Settings] ${platform} pages rate limited. Pausing new requests for ${(retryAfterMs / 60000).toFixed(1)} minutes.`)
          const cooldownEndTime = Date.now() + retryAfterMs
          rateLimitCooldownRef.current[platform] = cooldownEndTime
          setRateLimitUntil(prev => ({ ...prev, [platform]: cooldownEndTime }))
          pagesFetchedRef.current.add(platform) // Prevent immediate retries
          toast.warning('Facebook API rate limit reached. Please wait a few minutes before trying again.', {
            duration: 12000,
          })
        } else {
          // Ensure cooldown cleared so future retries are allowed
          delete rateLimitCooldownRef.current[platform]
          setRateLimitUntil(prev => {
            if (!prev[platform]) return prev
            const updated = { ...prev }
            delete updated[platform]
            return updated
          })
          pagesFetchedRef.current.delete(platform)
          const errorMessage = errorData?.error || `Failed to fetch ${platform} pages (${response.status})`
          toast.error(errorMessage)
        }

        setAvailablePages(prev => ({ ...prev, [platform]: [] }))
        availablePagesRef.current[platform] = []
        return []
      }
    } catch (error) {
      console.error(`Error fetching ${platform} pages:`, error)
      setAvailablePages(prev => ({ ...prev, [platform]: [] }))
      availablePagesRef.current[platform] = []
      delete rateLimitCooldownRef.current[platform]
      setRateLimitUntil(prev => {
        if (!prev[platform]) return prev
        const updated = { ...prev }
        delete updated[platform]
        return updated
      })
      // Don't mark as fetched if there was an error, so we can retry
      pagesFetchedRef.current.delete(platform)
      return []
    } finally {
      isLoadingPagesRef.current.delete(platform)
      setIsLoadingPages(prev => ({ ...prev, [platform]: false }))
    }
  }, []) // Empty deps - use refs to access latest state without causing re-renders

  // Update post target settings
  const updatePostTargetSettings = async (platform: string, postTargetType: 'personal' | 'page', selectedPageId?: string) => {
    try {
      const response = await fetch(`/api/social/${platform}/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postTargetType,
          selectedPageId: postTargetType === 'page' ? selectedPageId : null,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        // Update local state
        setSocialConnections(prev => prev.map(c => 
          c.platform === platform && c.isActive
            ? { ...c, postTargetType: data.connection.postTargetType, selectedPageId: data.connection.selectedPageId }
            : c
        ))
        toast.success(`${platform === 'linkedin' ? 'LinkedIn' : 'Facebook'} posting target updated`)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update settings')
      }
    } catch (error) {
      console.error(`Error updating ${platform} settings:`, error)
      toast.error('Failed to update settings')
    }
  }

  // Fetch social connections on mount
  // Using useCallback with fetchPages as dependency since we call it inside
  const fetchConnections = useCallback(async () => {
    try {
      setIsLoadingConnections(true)
      const response = await fetch('/api/social/connections')
      if (response.ok) {
        const connections: SocialConnection[] = await response.json()
        setSocialConnections(connections)
        
        // Initialize postTargetTypes and selectedPageIds from connections
        const targetTypes: Record<string, 'personal' | 'page'> = {}
        const pageIds: Record<string, string> = {}
        connections.forEach(conn => {
          if (conn.isActive && (conn.platform === 'linkedin' || conn.platform === 'facebook')) {
            targetTypes[conn.platform] = conn.postTargetType || 'personal'
            if (conn.selectedPageId) {
              pageIds[conn.platform] = conn.selectedPageId
            }
            // Fetch pages if connected - fetchPages has internal guards to prevent duplicates
            if (conn.platform === 'linkedin' || conn.platform === 'facebook') {
              // Call fetchPages directly - it's stable (empty deps) and has internal deduplication
              fetchPages(conn.platform, false).catch(err => {
                console.error(`Error fetching pages for ${conn.platform}:`, err)
              })
            }
          }
        })
        setPostTargetTypes(targetTypes)
        setSelectedPageIds(pageIds)
      }
    } catch (error) {
      console.error('Error fetching social connections:', error)
    } finally {
      setIsLoadingConnections(false)
    }
  }, [fetchPages]) // fetchPages is stable (empty deps), so this is safe

  // Check for OAuth callback messages in URL
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const connected = searchParams.get('connected')
    const error = searchParams.get('error')

    if (connected === 'true') {
      toast.success('Account connected successfully!')
      // Refresh connections list
      fetchConnections()
      // Clean up URL
      window.history.replaceState({}, '', '/settings')
    }

    if (error) {
      const errorMessages: Record<string, string> = {
        'oauth_not_configured': 'OAuth not configured. Please check environment variables.',
        'invalid_state': 'Invalid OAuth state. Please try again.',
        'token_exchange_failed': 'Failed to exchange authorization code. Please try again.',
        'profile_fetch_failed': 'Failed to fetch profile. Please try again.',
        'unauthorized_scope_error': 'LinkedIn app needs "Share on LinkedIn" product approval. See instructions below.',
        'w_organization_social_not_approved': 'LinkedIn Company Pages are not available. You can still connect and post to your personal profile.',
        'rate_limit': 'Twitter rate limit reached. Please wait 15 minutes before trying again.',
        'no_instagram_account': 'No Instagram Business account found linked to your Facebook Page. Please ensure your Instagram account is a Business or Creator account and is linked to your Facebook Page in Business Manager.',
        'instagram_permission_required': 'Instagram connection requires App Review. The app needs "instagram_content_publish" permission approved through Meta App Review. Please complete App Review in your Meta App Dashboard before connecting Instagram.',
        'page_token_missing': 'Failed to get Page access token. Please try reconnecting.',
      }
      
      // Check if error message contains rate limit indicators
      const decodedError = decodeURIComponent(error)
      const isRateLimit = decodedError.toLowerCase().includes('rate') || 
                         decodedError.toLowerCase().includes('429') ||
                         decodedError.toLowerCase().includes('too many requests')
      
      // Get custom message from URL if available
      const messageParam = searchParams.get('message')
      const customMessage = messageParam ? decodeURIComponent(messageParam) : null
      
      const errorMsg = customMessage || (isRateLimit 
        ? 'Twitter rate limit reached. Please wait 15 minutes before trying to connect again.'
        : errorMessages[error] || `Connection failed: ${decodedError}`)
      
      // Show warning for w_organization_social (not a blocking error)
      if (error === 'w_organization_social_not_approved') {
        toast.warning(errorMsg, {
          duration: 10000,
        })
      } else {
        toast.error(errorMsg, {
          duration: 15000, // Show longer for important errors
        })
      }
      
      // Show detailed message for scope errors
      if (error === 'unauthorized_scope_error') {
        console.error('LinkedIn Scope Error:', 'Your LinkedIn app needs to request access to "Share on LinkedIn" product.')
        console.error('Steps:')
        console.error('1. Go to https://www.linkedin.com/developers/')
        console.error('2. Select your app')
        console.error('3. Go to "Products" tab')
        console.error('4. Request access to "Share on LinkedIn"')
        console.error('5. Wait for approval (can take a few days)')
      }
      
      // Clean up URL
      window.history.replaceState({}, '', '/settings')
    }
  }, [fetchConnections])

  // Fetch social connections on mount
  useEffect(() => {
    fetchConnections()
  }, [fetchConnections]) // fetchConnections is stable (memoized with useCallback), so it won't change

  const toggleApiKeyVisibility = (provider: string) => {
    setShowApiKeys(prev => ({ ...prev, [provider]: !prev[provider] }))
  }

  const handleSaveApiKey = async (provider: string) => {
    const apiKey = apiKeys[provider]?.trim()
    if (!apiKey) {
      toast.error('Please enter an API key')
      return
    }

    try {
      setIsSaving(true)
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider, apiKey }),
      })

      if (response.ok) {
        const result: ApiKeyData = await response.json()
        setMaskedKeys(prev => ({ ...prev, [provider]: result.maskedKey }))
        setApiKeys(prev => ({ ...prev, [provider]: '' })) // Clear input
        setEditingApiKeys(prev => ({ ...prev, [provider]: false }))
        // Fetch models for this provider
        fetchModelsForProvider(provider, true) // Pass true since we just saved the key
        toast.success(`${provider} API key saved successfully`)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to save API key')
      }
    } catch (error) {
      console.error('Error saving API key:', error)
      toast.error('Failed to save API key')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveAllApiKeys = async () => {
    const providers = Object.keys(apiKeys)
    const keysToSave = providers.filter(provider => apiKeys[provider]?.trim())

    if (keysToSave.length === 0) {
      toast.error('No API keys to save')
      return
    }

    try {
      setIsSaving(true)
      const promises = keysToSave.map(provider =>
        fetch('/api/api-keys', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ provider, apiKey: apiKeys[provider].trim() }),
        })
      )

      const results = await Promise.all(promises)
      const allSuccess = results.every(r => r.ok)

      if (allSuccess) {
        // Refresh masked keys
        const response = await fetch('/api/api-keys')
        if (response.ok) {
          const keys: ApiKeyData[] = await response.json()
          const masked: Record<string, string> = {}
          keys.forEach(key => {
            masked[key.provider] = key.maskedKey
          })
          setMaskedKeys(masked)
        }
        setApiKeys({
          openai: '',
          anthropic: '',
          gemini: '',
          openrouter: ''
        })
        setEditingApiKeys({})
        // Fetch models for all LLM providers that have keys
        const llmProviders = ['openai', 'anthropic', 'gemini', 'openrouter']
        Object.keys(maskedKeys).forEach(provider => {
          if (maskedKeys[provider] && llmProviders.includes(provider)) {
            fetchModelsForProvider(provider, true) // Pass true since we know it has a key
          }
        })
        toast.success('All API keys saved successfully')
      } else {
        toast.error('Some API keys failed to save')
      }
    } catch (error) {
      console.error('Error saving API keys:', error)
      toast.error('Failed to save API keys')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveAISettings = async () => {
    try {
      setIsSavingAISettings(true)
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          defaultProvider: selectedProvider,
          defaultModel: JSON.stringify(selectedModels),
        }),
      })

      if (response.ok) {
        toast.success('AI settings saved successfully')
      } else {
        const error = await response.json()
        console.error('Failed to save AI settings:', error)
        toast.error(error.details || error.error || 'Failed to save AI settings')
      }
    } catch (error) {
      console.error('Error saving AI settings:', error)
      toast.error('Failed to save AI settings')
    } finally {
      setIsSavingAISettings(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your preferences, API keys, and connected accounts
        </p>
      </div>

      <div className="space-y-6">
        {/* Theme Settings */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-xl font-semibold text-card-foreground mb-4">Appearance</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-card-foreground mb-2 block">
                Theme
              </label>
              <div className="flex gap-3">
                <button 
                  onClick={() => setTheme('dark')}
                  className={`flex-1 rounded-lg p-4 text-left transition-all ${
                    theme === 'dark' 
                      ? 'border-2 border-primary bg-secondary' 
                      : 'border border-border bg-muted hover:border-primary/50'
                  }`}
                >
                  <div className="font-medium text-foreground">Dark Mode</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {theme === 'dark' ? 'Current theme' : 'Click to activate'}
                  </div>
                </button>
                <button 
                  onClick={() => setTheme('light')}
                  className={`flex-1 rounded-lg p-4 text-left transition-all ${
                    theme === 'light' 
                      ? 'border-2 border-primary bg-secondary' 
                      : 'border border-border bg-muted hover:border-primary/50'
                  }`}
                >
                  <div className="font-medium text-foreground">Light Mode</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {theme === 'light' ? 'Current theme' : 'Click to activate'}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* API Keys */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-xl font-semibold text-card-foreground mb-4">AI Provider Settings</h2>
          
          <div className="space-y-4 mb-6">
            <div>
              <label className="text-sm font-medium text-card-foreground mb-2 block">
                Default LLM Provider
              </label>
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic (Claude)</option>
                <option value="gemini">Google Gemini</option>
                <option value="openrouter">OpenRouter</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Select which provider to use by default when generating content
              </p>
            </div>

            {/* Model Selection for each provider */}
            <div className="space-y-3">
              {['openai', 'anthropic', 'gemini', 'openrouter'].map((provider) => {
                const hasApiKey = !!maskedKeys[provider]
                const models = providerModels[provider] || []
                const isLoadingModel = isLoadingModels[provider]
                
                return (
                  <div key={provider}>
                    <label className="text-sm font-medium text-card-foreground mb-2 block capitalize">
                      {provider === 'openrouter' ? 'OpenRouter' : provider} Model
                      {hasApiKey && isLoadingModel && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          <Loader2 className="w-3 h-3 inline animate-spin" /> Loading models...
                        </span>
                      )}
                      {hasApiKey && !isLoadingModel && models.length === 0 && (
                        <span className="ml-2 text-xs text-muted-foreground">(No models available)</span>
                      )}
                    </label>
                    <select
                      value={selectedModels[provider] || models[0]?.value || ''}
                      onChange={(e) => setSelectedModels(prev => ({ ...prev, [provider]: e.target.value }))}
                      disabled={models.length === 0 || isLoadingModel}
                      className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {models.length > 0 ? (
                        models.map((model) => (
                          <option key={model.value} value={model.value}>
                            {model.label}
                          </option>
                        ))
                      ) : (
                        <option value="">No models available</option>
                      )}
                    </select>
                    {!hasApiKey && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Add an API key to see available models
                      </p>
                    )}
                  </div>
                )
              })}
            </div>

            <Button
              onClick={handleSaveAISettings}
              disabled={isSavingAISettings}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSavingAISettings ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving AI Settings...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save AI Settings
                </>
              )}
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {Object.keys(apiKeys).map((provider) => {
                  const hasExistingKey = !!maskedKeys[provider]
                  const isEditing = editingApiKeys[provider] || false
                  const inputValue = apiKeys[provider] || ''
                  const displayValue = inputValue || (hasExistingKey && !isEditing ? maskedKeys[provider] : '')
                  
                  return (
                    <div key={provider}>
                      <label className="text-sm font-medium text-card-foreground mb-2 block capitalize">
                        {provider} API Key
                        {hasExistingKey && !isEditing && !inputValue && (
                          <span className="ml-2 text-xs text-muted-foreground">(Saved)</span>
                        )}
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type={showApiKeys[provider] && (inputValue || isEditing) ? 'text' : 'password'}
                            value={isEditing ? inputValue : displayValue}
                            onChange={(e) => {
                              setApiKeys(prev => ({ ...prev, [provider]: e.target.value }))
                              if (!isEditing && hasExistingKey) {
                                setEditingApiKeys(prev => ({ ...prev, [provider]: true }))
                              }
                            }}
                            placeholder={hasExistingKey && !isEditing ? maskedKeys[provider] : `Enter your ${provider} API key`}
                            className="w-full rounded-lg border border-input bg-background px-4 py-2 pr-10 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                          {(inputValue || isEditing) && (
                            <button
                              onClick={() => toggleApiKeyVisibility(provider)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showApiKeys[provider] ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                        {(inputValue || isEditing) && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!inputValue || isSaving}
                            onClick={() => {
                              handleSaveApiKey(provider)
                              setEditingApiKeys(prev => ({ ...prev, [provider]: false }))
                            }}
                            className="px-3"
                          >
                            {isSaving ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                        {hasExistingKey && !isEditing && !inputValue && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingApiKeys(prev => ({ ...prev, [provider]: true }))
                              setApiKeys(prev => ({ ...prev, [provider]: '' }))
                            }}
                            className="px-3"
                          >
                            Edit
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              <Button 
                className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleSaveAllApiKeys}
                disabled={isSaving || Object.values(apiKeys).every(key => !key.trim())}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save API Keys
                  </>
                )}
              </Button>
            </>
          )}
        </div>

        {/* AI Image Generation Settings */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-xl font-semibold text-card-foreground mb-4">AI Image Generation Settings</h2>
          
          <div className="space-y-4 mb-6">
            <div>
              <label className="text-sm font-medium text-card-foreground mb-2 block">
                Default Image Provider
              </label>
              <select
                value={selectedImageProvider}
                onChange={(e) => setSelectedImageProvider(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="fal">Fal.ai</option>
                <option value="openai-dalle">OpenAI DALL-E</option>
                <option value="replicate">Replicate</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Select which provider to use by default when generating images
              </p>
            </div>

            {/* Model Selection for each image provider */}
            <div className="space-y-3">
              {['fal', 'openai-dalle', 'replicate'].map((provider) => {
                const hasApiKey = !!imageMaskedKeys[provider]
                const models = imageProviderModels[provider] || []
                const isLoadingModel = isLoadingImageModels[provider]
                const providerLabel = provider === 'openai-dalle' ? 'OpenAI DALL-E' : provider === 'fal' ? 'Fal.ai' : 'Replicate'
                
                return (
                  <div key={provider}>
                    <label className="text-sm font-medium text-card-foreground mb-2 block">
                      {providerLabel} Model
                      {hasApiKey && isLoadingModel && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          <Loader2 className="w-3 h-3 inline animate-spin" /> Loading models...
                        </span>
                      )}
                      {hasApiKey && !isLoadingModel && models.length === 0 && (
                        <span className="ml-2 text-xs text-muted-foreground">(No models available)</span>
                      )}
                    </label>
                    <select
                      value={selectedImageModels[provider] || models[0]?.value || ''}
                      onChange={(e) => setSelectedImageModels(prev => ({ ...prev, [provider]: e.target.value }))}
                      disabled={models.length === 0}
                      className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {models.length > 0 ? (
                        models.map((model) => (
                          <option key={model.value} value={model.value}>
                            {model.label}
                          </option>
                        ))
                      ) : (
                        <option value="">No models available</option>
                      )}
                    </select>
                    {!hasApiKey && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Add an API key to see available models
                      </p>
                    )}
                  </div>
                )
              })}
            </div>

            <div>
              <label className="text-sm font-medium text-card-foreground mb-2 block">
                Default Style Instructions
              </label>
              <textarea
                value={defaultImageStyle}
                onChange={(e) => setDefaultImageStyle(e.target.value)}
                placeholder="e.g., minimalist, professional, colorful, abstract..."
                className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[80px]"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Default style instructions to append to image generation prompts
              </p>
            </div>

            <Button
              onClick={handleSaveImageSettings}
              disabled={isSavingImageSettings}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSavingImageSettings ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving Image Settings...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Image Settings
                </>
              )}
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {['fal', 'openai-dalle', 'replicate'].map((provider) => {
                  const hasExistingKey = !!imageMaskedKeys[provider]
                  const isEditing = editingImageApiKeys[provider] || false
                  const inputValue = imageApiKeys[provider] || ''
                  const displayValue = inputValue || (hasExistingKey && !isEditing ? imageMaskedKeys[provider] : '')
                  const providerLabel = provider === 'openai-dalle' ? 'OpenAI DALL-E' : provider === 'fal' ? 'Fal.ai' : 'Replicate'
                  
                  return (
                    <div key={provider}>
                      <label className="text-sm font-medium text-card-foreground mb-2 block">
                        {providerLabel} API Key
                        {hasExistingKey && !isEditing && !inputValue && (
                          <span className="ml-2 text-xs text-muted-foreground">(Saved)</span>
                        )}
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type={showImageApiKeys[provider] && (inputValue || isEditing) ? 'text' : 'password'}
                            value={isEditing ? inputValue : displayValue}
                            onChange={(e) => {
                              setImageApiKeys(prev => ({ ...prev, [provider]: e.target.value }))
                              if (!isEditing && hasExistingKey) {
                                setEditingImageApiKeys(prev => ({ ...prev, [provider]: true }))
                              }
                            }}
                            placeholder={hasExistingKey && !isEditing ? imageMaskedKeys[provider] : `Enter your ${providerLabel} API key`}
                            className="w-full rounded-lg border border-input bg-background px-4 py-2 pr-10 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                          {(inputValue || isEditing) && (
                            <button
                              onClick={() => {
                                setShowImageApiKeys(prev => ({ ...prev, [provider]: !prev[provider] }))
                              }}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showImageApiKeys[provider] ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                        {(inputValue || isEditing) && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!inputValue || isSaving}
                            onClick={() => {
                              handleSaveImageApiKey(provider)
                              setEditingImageApiKeys(prev => ({ ...prev, [provider]: false }))
                            }}
                            className="px-3"
                          >
                            {isSaving ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                        {hasExistingKey && !isEditing && !inputValue && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingImageApiKeys(prev => ({ ...prev, [provider]: true }))
                              setImageApiKeys(prev => ({ ...prev, [provider]: '' }))
                            }}
                            className="px-3"
                          >
                            Edit
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* Writing Style Settings */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-xl font-semibold text-card-foreground mb-4">Writing Style</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Define your writing voice and style. This will be used to guide AI-generated posts to match your preferred tone and style.
          </p>
          
          <div className="space-y-4 mb-6">
            <div>
              <label className="text-sm font-medium text-card-foreground mb-2 block">
                Writing Style Description
              </label>
              <textarea
                value={writingStyle}
                onChange={(e) => setWritingStyle(e.target.value)}
                placeholder="e.g., Professional yet conversational, uses short sentences, includes data-driven insights, friendly and approachable tone..."
                className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[120px]"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Describe your writing style, tone, and voice preferences. This will be included in AI prompts to ensure generated content matches your style.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setShowStyleAnalysisModal(true)}
                variant="outline"
                className="flex-1"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Analyze Sample Text
              </Button>
              <Button
                onClick={handleSaveWritingStyle}
                disabled={isSavingWritingStyle}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isSavingWritingStyle ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Writing Style
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Writing Style Analysis Modal */}
        {showStyleAnalysisModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-card-foreground">Analyze Writing Style</h3>
                <button
                  onClick={() => {
                    setShowStyleAnalysisModal(false)
                    setSampleText('')
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4">
                Paste at least 500 words of your existing writing (blog posts, articles, social media posts, etc.). 
                Our AI will analyze the text and generate a writing style description for you.
              </p>
              
              <div className="mb-4">
                <label className="text-sm font-medium text-card-foreground mb-2 block">
                  Sample Text (Minimum 500 words)
                </label>
                <textarea
                  value={sampleText}
                  onChange={(e) => setSampleText(e.target.value)}
                  placeholder="Paste your writing sample here..."
                  className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[300px]"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Word count: {sampleText.trim().split(/\s+/).filter(w => w.length > 0).length} / 500 minimum
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setShowStyleAnalysisModal(false)
                    setSampleText('')
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAnalyzeWritingStyle}
                  disabled={isAnalyzingStyle || sampleText.trim().split(/\s+/).filter(w => w.length > 0).length < 500}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isAnalyzingStyle ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Analyze & Apply
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Connected Accounts */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-xl font-semibold text-card-foreground mb-4">Connected Accounts</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Connect your social media accounts to publish directly from Levercast
          </p>
          
          {isLoadingConnections ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-3">
              {['linkedin', 'twitter', 'facebook', 'instagram', 'threads'].map((platform) => {
                // For LinkedIn, check for both personal and company connections
                // For other platforms, find the single connection
                let connection: typeof socialConnections[0] | undefined
                if (platform === 'linkedin') {
                  // Prefer company connection if available, otherwise personal
                  connection = socialConnections.find(c => 
                    c.platform === platform && 
                    c.isActive && 
                    (c.appType === 'company' || c.appType === 'personal')
                  )
                } else {
                  connection = socialConnections.find(c => c.platform === platform && c.isActive)
                }
                const isConnected = !!connection
                const isDisconnectingPlatform = isDisconnecting[platform] || false

                const handleConnect = async (target: 'personal' | 'company' = 'personal') => {
                  // For LinkedIn, create a unique key for personal vs company
                  const connectionKey = platform === 'linkedin' ? `${platform}-${target}` : platform
                  
                  // Prevent multiple rapid clicks
                  if (isConnecting[connectionKey] || isConnecting[platform]) {
                    return
                  }

                  try {
                    // Set connecting state for both the specific key and platform (for backward compatibility)
                    setIsConnecting(prev => ({ ...prev, [connectionKey]: true, [platform]: true }))
                    
                    // For LinkedIn, pass target parameter to select the correct app
                    const url = platform === 'linkedin' && target === 'company'
                      ? `/api/social/${platform}?target=company`
                      : `/api/social/${platform}`
                    const response = await fetch(url, {
                      method: 'POST',
                    })
                    const data = await response.json()
                    
                    if (response.ok) {
                      if (data.redirectUrl) {
                        // Redirect to OAuth URL
                        window.location.href = data.redirectUrl
                      } else {
                        toast.error('OAuth flow not configured. Please check server logs.')
                        setIsConnecting(prev => ({ ...prev, [connectionKey]: false, [platform]: false }))
                      }
                    } else {
                      // Show the actual error from the API
                      console.error(`OAuth error for ${platform}:`, data)
                      const errorMsg = data.error || `Failed to connect ${platform}. Please check that OAuth credentials are configured.`
                      
                      // Check for rate limit errors
                      if (errorMsg.toLowerCase().includes('rate') || errorMsg.toLowerCase().includes('429')) {
                        toast.error('Twitter rate limit reached. Please wait 15 minutes before trying again.', {
                          duration: 15000,
                        })
                      } else {
                        toast.error(errorMsg)
                      }
                      setIsConnecting(prev => ({ ...prev, [connectionKey]: false, [platform]: false }))
                    }
                  } catch (error) {
                    console.error('Error connecting platform:', error)
                    toast.error(`Failed to connect ${platform}. Check console for details.`)
                    setIsConnecting(prev => ({ ...prev, [connectionKey]: false, [platform]: false }))
                  }
                }

                const handleDisconnect = async () => {
                  if (!confirm(`Are you sure you want to disconnect ${platform}?`)) {
                    return
                  }

                  try {
                    setIsDisconnecting(prev => ({ ...prev, [platform]: true }))
                    const response = await fetch(`/api/social/${platform}`, {
                      method: 'DELETE',
                    })
                    if (response.ok) {
                      setSocialConnections(prev => prev.filter(c => !(c.platform === platform && c.isActive)))
                      toast.success(`${platform} disconnected successfully`)
                    } else {
                      const error = await response.json()
                      toast.error(error.error || 'Failed to disconnect')
                    }
                  } catch (error) {
                    console.error('Error disconnecting platform:', error)
                    toast.error('Failed to disconnect')
                  } finally {
                    setIsDisconnecting(prev => ({ ...prev, [platform]: false }))
                  }
                }

                const platformConfig = {
                  linkedin: { bg: '#0A66C2', icon: 'in', name: 'LinkedIn' },
                  twitter: { bg: '#1DA1F2', icon: '𝕏', name: 'Twitter / X' },
                  facebook: { bg: '#1877F2', icon: 'f', name: 'Facebook' },
                  instagram: { bg: '#E4405F', icon: '📷', name: 'Instagram' },
                  threads: { bg: '#000000', icon: '🧵', name: 'Threads' },
                  telegram: { bg: '#24A1DE', icon: '✈️', name: 'Telegram' },
                }[platform] ?? {
                  bg: '#6B7280',
                  icon: platform.slice(0, 1).toUpperCase(),
                  name: platform.charAt(0).toUpperCase() + platform.slice(1),
                }

                const showPageSelector = isConnected && (platform === 'linkedin' || platform === 'facebook')
                const currentPostTargetType = postTargetTypes[platform] || connection?.postTargetType || 'personal'
                const currentSelectedPageId = selectedPageIds[platform] || connection?.selectedPageId || ''
                const pages = availablePages[platform] || []
                const isLoadingPagesForPlatform = isLoadingPages[platform] || false
                const rateLimitEndTime = rateLimitUntil[platform] || null
                const rateLimitRemainingMs = rateLimitEndTime ? Math.max(rateLimitEndTime - Date.now(), 0) : 0
                const rateLimitActive = rateLimitRemainingMs > 0

                return (
                  <div key={platform} className="space-y-3">
                    <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold`}
                          style={platform === 'instagram' || platform === 'threads'
                            ? { background: platform === 'instagram' 
                                ? 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)'
                                : 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)' }
                            : { backgroundColor: platformConfig.bg }
                          }>
                          {platformConfig.icon}
                        </div>
                        <div>
                          <div className="font-medium text-card-foreground">
                            {platformConfig.name}
                          </div>
                          {isConnected ? (
                            <div className="text-xs text-primary">
                              Connected{connection?.platformUsername ? ` as ${connection.platformUsername}` : ''}
                              {connection?.lastUsed && (
                                <span className="text-muted-foreground ml-1">
                                  • Last used {new Date(connection.lastUsed).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground">Not connected</div>
                          )}
                        </div>
                      </div>
                      {platform === 'linkedin' && !isConnected ? (
                        // Show two buttons for LinkedIn: Personal Profile and Company Page
                        <div className="flex gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleConnect('personal')}
                            disabled={isConnecting[`${platform}-personal`] || isConnecting[platform]}
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                          >
                            {isConnecting[`${platform}-personal`] || isConnecting[platform] ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                Connecting...
                              </>
                            ) : (
                              'Personal Profile'
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleConnect('company')}
                            disabled={isConnecting[`${platform}-company`] || isConnecting[platform]}
                          >
                            {isConnecting[`${platform}-company`] || isConnecting[platform] ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                Connecting...
                              </>
                            ) : (
                              'Company Page'
                            )}
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          {isConnected && platform === 'instagram' && (!connection?.platformUsername || connection?.platformUsername === 'Instagram User') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                if (!connection?.id) return
                                
                                setIsRefreshingUsername(prev => ({ ...prev, [platform]: true }))
                                try {
                                  const response = await fetch('/api/social/instagram/refresh-username', {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                      connectionId: connection.id,
                                    }),
                                  })
                                  
                                  const data = await response.json()
                                  
                                  if (data.success && data.username) {
                                    toast.success(`Username updated to @${data.username}`)
                                    // Refresh connections to update UI
                                    await fetchConnections()
                                  } else {
                                    // Show warning instead of error - this is a known limitation
                                    toast.warning(data.error || 'Could not fetch username. It will be fetched automatically when you publish your first Instagram post.')
                                  }
                                } catch (error) {
                                  console.error('Error refreshing Instagram username:', error)
                                  toast.error('Failed to refresh username')
                                } finally {
                                  setIsRefreshingUsername(prev => ({ ...prev, [platform]: false }))
                                }
                              }}
                              disabled={isRefreshingUsername[platform]}
                              className="text-xs"
                            >
                              {isRefreshingUsername[platform] ? (
                                <>
                                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                  Refreshing...
                                </>
                              ) : (
                                'Refresh Username'
                              )}
                            </Button>
                          )}
                          <Button
                            variant={isConnected ? 'outline' : 'default'}
                            size="sm"
                            onClick={isConnected ? handleDisconnect : () => handleConnect()}
                            disabled={isDisconnectingPlatform || isConnecting[platform]}
                            className={isConnected ? '' : 'bg-primary text-primary-foreground hover:bg-primary/90'}
                          >
                            {isDisconnectingPlatform ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                Disconnecting...
                              </>
                            ) : isConnecting[platform] ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                Connecting...
                              </>
                            ) : (
                              isConnected ? 'Disconnect' : 'Connect'
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {/* Page/Profile Selector for LinkedIn and Facebook */}
                    {showPageSelector && (
                      <div className="ml-14 space-y-2 p-3 rounded-lg border border-border bg-muted/30">
                        <div className="text-sm font-medium text-card-foreground mb-2">Post Target</div>
                        <div className="flex gap-2 mb-2">
                          <Button
                            variant={currentPostTargetType === 'personal' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => {
                              setPostTargetTypes(prev => ({ ...prev, [platform]: 'personal' }))
                              updatePostTargetSettings(platform, 'personal')
                            }}
                            className={currentPostTargetType === 'personal' ? 'bg-primary text-primary-foreground' : ''}
                          >
                            Personal Profile
                          </Button>
                          <Button
                            variant={currentPostTargetType === 'page' ? 'default' : 'outline'}
                            size="sm"
                            onClick={async () => {
                              setPostTargetTypes(prev => ({ ...prev, [platform]: 'page' }))
                              
                              // Fetch pages if not already loaded (force refresh if user explicitly clicks)
                              let pagesToUse = pages
                              if (!isLoadingPagesForPlatform && pages.length === 0) {
                                console.log(`[Settings] Fetching pages for ${platform}...`)
                                pagesToUse = await fetchPages(platform, true) // Force refresh when user clicks
                              }
                              
                              // Auto-select first page if pages are available and none selected
                              if (pagesToUse.length > 0) {
                                const pageIdToUse = currentSelectedPageId || pagesToUse[0].id
                                setSelectedPageIds(prev => ({ ...prev, [platform]: pageIdToUse }))
                                updatePostTargetSettings(platform, 'page', pageIdToUse)
                              } else {
                                // No pages found, just set target type
                                updatePostTargetSettings(platform, 'page')
                              }
                            }}
                            className={currentPostTargetType === 'page' ? 'bg-primary text-primary-foreground' : ''}
                          >
                            Business Page
                          </Button>
                        </div>
                        
                        {currentPostTargetType === 'page' && (
                          <div className="space-y-2">
                            {isLoadingPagesForPlatform ? (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Loading pages...
                              </div>
                            ) : pages.length === 0 ? (
                              <div className="text-sm text-muted-foreground space-y-2">
                                <div>No pages found.</div>
                                {platform === 'linkedin' ? (
                                  <div className="text-xs">
                                    LinkedIn Company Pages require the &quot;Community Management API&quot; product approval (MDP was deprecated April 2024). This requires a separate LinkedIn app. You can still post to your personal profile.
                                  </div>
                                ) : (
                                  <div className="text-xs space-y-1">
                                    <div>Make sure you have admin access to at least one Facebook Page.</div>
                                    {currentSelectedPageId && (
                                      <div className="text-card-foreground">
                                        Saved Page ID: <code>{currentSelectedPageId}</code> (stored in the database and still used for publishing).
                                      </div>
                                    )}
                                    {rateLimitActive && (
                                      <div className="text-amber-600">
                                        Facebook API rate limit is active. Retry in approximately {Math.max(1, Math.ceil(rateLimitRemainingMs / 60000))} minute(s), or click &quot;Retry page fetch&quot; below once it clears.
                                      </div>
                                    )}
                                  </div>
                                )}
                                <div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={isLoadingPagesForPlatform}
                                    onClick={async () => {
                                      await fetchPages(platform, true)
                                    }}
                                  >
                                    {isLoadingPagesForPlatform ? (
                                      <>
                                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                        Retrying...
                                      </>
                                    ) : (
                                      'Retry page fetch'
                                    )}
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <select
                                value={currentSelectedPageId}
                                onChange={(e) => {
                                  const pageId = e.target.value
                                  setSelectedPageIds(prev => ({ ...prev, [platform]: pageId }))
                                  updatePostTargetSettings(platform, 'page', pageId)
                                }}
                                className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                              >
                                <option value="">Select a page...</option>
                                {pages.map((page) => (
                                  <option key={page.id} value={page.id}>
                                    {page.name}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
              
              {/* Telegram - Uses API Key instead of OAuth */}
              {(() => {
                const telegramKey = maskedKeys['telegram'] || imageMaskedKeys['telegram']
                const hasTelegramKey = !!telegramKey
                const isEditingTelegram = editingApiKeys['telegram'] || editingImageApiKeys['telegram'] || false
                const telegramInputValue = apiKeys['telegram'] || imageApiKeys['telegram'] || ''
                const telegramDisplayValue = telegramInputValue || (hasTelegramKey && !isEditingTelegram ? telegramKey : '')
                
                const handleSaveTelegramKey = async () => {
                  const apiKey = telegramInputValue?.trim()
                  if (!apiKey) {
                    toast.error('Please enter a Telegram bot token')
                    return
                  }

                  try {
                    setIsSaving(true)
                    const response = await fetch('/api/api-keys', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ provider: 'telegram', apiKey }),
                    })

                    if (response.ok) {
                      const result: ApiKeyData = await response.json()
                      setMaskedKeys(prev => ({ ...prev, telegram: result.maskedKey }))
                      setImageMaskedKeys(prev => ({ ...prev, telegram: result.maskedKey }))
                      setApiKeys(prev => ({ ...prev, telegram: '' }))
                      setImageApiKeys(prev => ({ ...prev, telegram: '' }))
                      setEditingApiKeys(prev => ({ ...prev, telegram: false }))
                      setEditingImageApiKeys(prev => ({ ...prev, telegram: false }))
                      toast.success('Telegram bot token saved successfully')
                    } else {
                      const error = await response.json()
                      toast.error(error.error || 'Failed to save Telegram bot token')
                    }
                  } catch (error) {
                    console.error('Error saving Telegram bot token:', error)
                    toast.error('Failed to save Telegram bot token')
                  } finally {
                    setIsSaving(false)
                  }
                }

                const handleRemoveTelegramKey = async () => {
                  if (!confirm('Are you sure you want to remove your Telegram bot token?')) {
                    return
                  }

                  try {
                    setIsDisconnecting(prev => ({ ...prev, telegram: true }))
                    const response = await fetch('/api/api-keys', {
                      method: 'DELETE',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ provider: 'telegram' }),
                    })
                    if (response.ok) {
                      setMaskedKeys(prev => {
                        const updated = { ...prev }
                        delete updated.telegram
                        return updated
                      })
                      setImageMaskedKeys(prev => {
                        const updated = { ...prev }
                        delete updated.telegram
                        return updated
                      })
                      toast.success('Telegram bot token removed successfully')
                    } else {
                      const error = await response.json()
                      toast.error(error.error || 'Failed to remove Telegram bot token')
                    }
                  } catch (error) {
                    console.error('Error removing Telegram bot token:', error)
                    toast.error('Failed to remove Telegram bot token')
                  } finally {
                    setIsDisconnecting(prev => ({ ...prev, telegram: false }))
                  }
                }

                return (
                  <div key="telegram" className="flex items-center justify-between p-4 rounded-lg border border-border">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold bg-[#0088cc]">
                        📱
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-card-foreground mb-2">
                          Telegram
                        </div>
                        <div className="relative">
                          <input
                            type={showApiKeys['telegram'] && (telegramInputValue || isEditingTelegram) ? 'text' : 'password'}
                            value={isEditingTelegram ? telegramInputValue : telegramDisplayValue}
                            onChange={(e) => {
                              setApiKeys(prev => ({ ...prev, telegram: e.target.value }))
                              setImageApiKeys(prev => ({ ...prev, telegram: e.target.value }))
                              if (!isEditingTelegram && hasTelegramKey) {
                                setEditingApiKeys(prev => ({ ...prev, telegram: true }))
                                setEditingImageApiKeys(prev => ({ ...prev, telegram: true }))
                              }
                            }}
                            placeholder={hasTelegramKey && !isEditingTelegram ? telegramKey : 'Enter your Telegram bot token'}
                            className="w-full rounded-lg border border-input bg-background px-4 py-2 pr-10 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                          />
                          {(telegramInputValue || isEditingTelegram) && (
                            <button
                              onClick={() => {
                                setShowApiKeys(prev => ({ ...prev, telegram: !prev.telegram }))
                              }}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showApiKeys['telegram'] ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {hasTelegramKey && !isEditingTelegram && !telegramInputValue
                            ? 'Bot token saved'
                            : 'Get your bot token from @BotFather on Telegram'}
                        </p>
                        {hasTelegramKey && (
                          <div className="mt-3">
                            <label className="text-xs font-medium text-card-foreground mb-1 block">
                              Default Telegram Channel ID
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={telegramChatId}
                                onChange={(e) => setTelegramChatId(e.target.value)}
                                placeholder="@channelname or -1001234567890"
                                className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={isSavingTelegramChatId}
                                onClick={async () => {
                                  try {
                                    setIsSavingTelegramChatId(true)
                                    const response = await fetch('/api/settings', {
                                      method: 'PATCH',
                                      headers: {
                                        'Content-Type': 'application/json',
                                      },
                                      body: JSON.stringify({
                                        telegramChatId: telegramChatId || null,
                                      }),
                                    })
                                    if (response.ok) {
                                      toast.success('Telegram channel ID saved successfully')
                                    } else {
                                      const error = await response.json()
                                      toast.error(error.error || 'Failed to save Telegram channel ID')
                                    }
                                  } catch (error) {
                                    console.error('Error saving Telegram channel ID:', error)
                                    toast.error('Failed to save Telegram channel ID')
                                  } finally {
                                    setIsSavingTelegramChatId(false)
                                  }
                                }}
                                className="px-3"
                              >
                                {isSavingTelegramChatId ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Check className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Channel username (e.g., @mychannel) or numeric ID (e.g., -1001234567890). Your bot must be an admin of this channel.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      {(telegramInputValue || isEditingTelegram) && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!telegramInputValue || isSaving}
                          onClick={() => {
                            handleSaveTelegramKey()
                            setEditingApiKeys(prev => ({ ...prev, telegram: false }))
                            setEditingImageApiKeys(prev => ({ ...prev, telegram: false }))
                          }}
                          className="px-3"
                        >
                          {isSaving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                      {hasTelegramKey && !isEditingTelegram && !telegramInputValue && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingApiKeys(prev => ({ ...prev, telegram: true }))
                              setEditingImageApiKeys(prev => ({ ...prev, telegram: true }))
                              setApiKeys(prev => ({ ...prev, telegram: '' }))
                              setImageApiKeys(prev => ({ ...prev, telegram: '' }))
                            }}
                            className="px-3"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRemoveTelegramKey}
                            disabled={isDisconnecting['telegram']}
                            className="px-3"
                          >
                            {isDisconnecting['telegram'] ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              'Remove'
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

