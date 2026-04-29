'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, Sparkles, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import Image from 'next/image'

interface ImageGenerationModalProps {
  isOpen: boolean
  onClose: () => void
  onImageGenerated: (imageUrl: string) => void
  postContent: string
  draftId?: string
}

export function ImageGenerationModal({
  isOpen,
  onClose,
  onImageGenerated,
  postContent,
  draftId,
}: ImageGenerationModalProps) {
  const [prompt, setPrompt] = useState('')
  const [styleInstructions, setStyleInstructions] = useState('')
  const [provider, setProvider] = useState('fal')
  const [model, setModel] = useState('')
  const [aspectRatio, setAspectRatio] = useState('1:1')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null)
  const [availableModels, setAvailableModels] = useState<Array<{ value: string; label: string }>>([])
  const [isLoadingModels, setIsLoadingModels] = useState(false)
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(false)
  const [promptError, setPromptError] = useState<string | null>(null)
  
  // LLM provider and model for prompt generation
  const [llmProvider, setLlmProvider] = useState<string>('')
  const [llmModel, setLlmModel] = useState<string>('')
  const [availableLlmProviders, setAvailableLlmProviders] = useState<Array<{ value: string; label: string }>>([])
  const [availableLlmModels, setAvailableLlmModels] = useState<Array<{ value: string; label: string }>>([])
  const [isLoadingLlmModels, setIsLoadingLlmModels] = useState(false)
  
  // defaultImageProvider and defaultImageStyle are reserved for future use
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [defaultImageProvider, setDefaultImageProvider] = useState<string | null>(null)
  const [defaultImageModel, setDefaultImageModel] = useState<Record<string, string>>({})
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [defaultImageStyle, setDefaultImageStyle] = useState('')

  // Load settings on mount
  useEffect(() => {
    if (isOpen) {
      // Reset state
      setSettingsLoaded(false)
      setPrompt('')
      setPromptError(null)
      
      // Load settings (which will call loadAvailableLlmProviders internally after settings load)
      loadSettings()
    } else {
      // Reset when modal closes
      setSettingsLoaded(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, postContent])

  // Load models when provider changes
  useEffect(() => {
    if (isOpen && provider) {
      loadModels()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, provider])

  // Track if settings have been loaded to prevent race conditions
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  // Load LLM models when LLM provider changes
  useEffect(() => {
    if (isOpen && llmProvider) {
      loadLlmModels()
    } else {
      setAvailableLlmModels([])
      // Only clear model if settings haven't been loaded yet (to preserve saved values)
      if (!settingsLoaded) {
        setLlmModel('')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, llmProvider])

  // Set default LLM model when models are loaded
  useEffect(() => {
    if (availableLlmModels.length > 0 && llmProvider && settingsLoaded) {
      // If we have a saved model preference, check if it's still available
      if (llmModel) {
        const savedModelExists = availableLlmModels.find(m => m.value === llmModel)
        if (!savedModelExists) {
          // Saved model is no longer available, use first available
          setLlmModel(availableLlmModels[0].value)
          saveLlmSettings(llmProvider, availableLlmModels[0].value)
        }
        // If saved model exists, keep it (don't override)
      } else {
        // No saved preference, use first available
        setLlmModel(availableLlmModels[0].value)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableLlmModels, llmProvider, settingsLoaded])

  // Set default model when models are loaded
  useEffect(() => {
    if (availableModels.length > 0 && !model) {
      const defaultModelForProvider = defaultImageModel[provider]
      if (defaultModelForProvider && availableModels.find(m => m.value === defaultModelForProvider)) {
        setModel(defaultModelForProvider)
      } else {
        setModel(availableModels[0].value)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableModels, provider, defaultImageModel])

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const settings = await response.json()
        setDefaultImageProvider(settings.defaultImageProvider || 'fal')
        setProvider(settings.defaultImageProvider || 'fal')
        
        if (settings.defaultImageModel) {
          try {
            const parsed = JSON.parse(settings.defaultImageModel)
            setDefaultImageModel(parsed)
          } catch {
            // Ignore parse errors
          }
        }
        
        setDefaultImageStyle(settings.defaultImageStyle || '')
        setStyleInstructions(settings.defaultImageStyle || '')
        
        // Load saved LLM provider and model for prompt generation
        // Parse model if it's stored as JSON (like defaultImageModel)
        const savedLlmProvider = settings.defaultImagePromptLlmProvider
        const savedLlmModel = settings.defaultImagePromptLlmModel
        
        if (savedLlmProvider) {
          setLlmProvider(savedLlmProvider)
        }
        if (savedLlmModel) {
          try {
            // Try parsing as JSON first (in case it's stored as JSON string)
            const parsed = JSON.parse(savedLlmModel)
            // If parsed successfully and it's a string, use it; otherwise use original
            setLlmModel(typeof parsed === 'string' ? parsed : savedLlmModel)
          } catch {
            // If not JSON, use as plain string
            setLlmModel(savedLlmModel)
          }
        }
        
        // Mark settings as loaded
        setSettingsLoaded(true)
        
        // Load providers after settings are loaded, passing saved provider to prevent override
        loadAvailableLlmProviders(savedLlmProvider)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      setSettingsLoaded(true) // Still mark as loaded to prevent infinite waiting
      // Still try to load providers even if settings fail
      loadAvailableLlmProviders()
    }
  }
  
  const saveLlmSettings = async (provider: string, model: string) => {
    try {
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          defaultImagePromptLlmProvider: provider,
          defaultImagePromptLlmModel: model,
        }),
      })
    } catch (error) {
      console.error('Error saving LLM settings:', error)
      // Don't show error toast - this is a background save
    }
  }

  const loadModels = async () => {
    setIsLoadingModels(true)
    try {
      const response = await fetch(`/api/ai/models/${provider}`)
      if (response.ok) {
        const data = await response.json()
        setAvailableModels(data.models || [])
      } else {
        toast.error('Failed to load models')
        setAvailableModels([])
      }
    } catch (error) {
      console.error('Error loading models:', error)
      toast.error('Failed to load models')
      setAvailableModels([])
    } finally {
      setIsLoadingModels(false)
    }
  }

  const loadAvailableLlmProviders = async (savedProvider?: string | null) => {
    try {
      const response = await fetch('/api/api-keys')
      if (response.ok) {
        const keys: Array<{ provider: string; maskedKey: string }> = await response.json()
        const llmProviders = ['openai', 'anthropic', 'gemini', 'openrouter']
        const providersWithKeys = keys
          .filter(key => llmProviders.includes(key.provider) && key.maskedKey)
          .map(key => ({
            value: key.provider,
            label: key.provider === 'openai' ? 'OpenAI' 
                 : key.provider === 'anthropic' ? 'Anthropic'
                 : key.provider === 'gemini' ? 'Google Gemini'
                 : 'OpenRouter',
          }))
        setAvailableLlmProviders(providersWithKeys)
        
        // Only set default provider if no saved provider exists
        // Use savedProvider parameter if provided, otherwise check state
        const currentProvider = savedProvider !== undefined ? savedProvider : llmProvider
        if (providersWithKeys.length > 0 && !currentProvider) {
          setLlmProvider(providersWithKeys[0].value)
        }
      }
    } catch (error) {
      console.error('Error loading LLM providers:', error)
    }
  }

  const loadLlmModels = async () => {
    if (!llmProvider) return
    
    setIsLoadingLlmModels(true)
    try {
      const response = await fetch(`/api/ai/models/${llmProvider}`)
      if (response.ok) {
        const data = await response.json()
        setAvailableLlmModels(data.models || [])
      } else {
        toast.error('Failed to load LLM models')
        setAvailableLlmModels([])
      }
    } catch (error) {
      console.error('Error loading LLM models:', error)
      toast.error('Failed to load LLM models')
      setAvailableLlmModels([])
    } finally {
      setIsLoadingLlmModels(false)
    }
  }

  const handleGeneratePrompt = async () => {
    if (!llmProvider || !llmModel) {
      toast.error('Please select an AI provider and model for prompt generation')
      return
    }

    setIsLoadingPrompt(true)
    setPromptError(null)
    
    try {
      const response = await fetch('/api/images/generate-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postContent: postContent,
          styleInstructions: styleInstructions.trim() || undefined,
          imageProvider: provider,
          imageModel: model || defaultImageModel[provider] || 'fal-ai/flux/schnell',
          llmProvider: llmProvider,
          llmModel: llmModel,
        }),
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.prompt && result.prompt.trim()) {
          setPrompt(result.prompt)
          toast.success('Prompt generated successfully')
        } else {
          setPromptError('No prompt returned from AI')
        }
      } else {
        const error = await response.json().catch(() => ({ error: 'Unknown error', details: 'Failed to generate prompt' }))
        const errorMessage = error.details || error.error || 'Failed to generate prompt'
        setPromptError(errorMessage)
        toast.error(errorMessage)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate prompt'
      setPromptError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoadingPrompt(false)
    }
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt')
      return
    }

    if (!model) {
      toast.error('Please select a model')
      return
    }

    setIsGenerating(true)
    setGeneratedImageUrl(null)

    try {
      const response = await fetch('/api/images/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postContent: postContent, // Send original post content, not the edited prompt
          styleInstructions: styleInstructions.trim() || undefined,
          provider,
          model,
          aspectRatio,
          draftId,
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(error.error || error.details || 'Failed to generate image')
      }

      const result = await response.json()
      
      if (result.success && result.url) {
        setGeneratedImageUrl(result.url)
        toast.success('Image generated successfully!')
      } else {
        throw new Error('No image URL returned')
      }
    } catch (error) {
      console.error('Error generating image:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to generate image')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleUseImage = () => {
    if (generatedImageUrl) {
      onImageGenerated(generatedImageUrl)
      onClose()
    }
  }

  // handleRegenerate is reserved for future use
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleRegenerate = () => {
    setGeneratedImageUrl(null)
    handleGenerate()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border border-border bg-card p-6 shadow-lg">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-card-foreground">
                Generate Image with AI
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Create an AI-generated image for your post
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {/* LLM Provider Selection for Prompt Generation */}
          {availableLlmProviders.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-card-foreground mb-2 block">
                  AI Provider (for Prompt)
                </label>
                <select
                  value={llmProvider}
                  onChange={(e) => {
                    const newProvider = e.target.value
                    setLlmProvider(newProvider)
                    setLlmModel('') // Reset model when provider changes
                    // Save provider preference
                    if (newProvider) {
                      saveLlmSettings(newProvider, '')
                    }
                  }}
                  className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select provider...</option>
                  {availableLlmProviders.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-card-foreground mb-2 block">
                  AI Model (for Prompt)
                  {isLoadingLlmModels && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      <Loader2 className="w-3 h-3 inline animate-spin" /> Loading...
                    </span>
                  )}
                </label>
                <select
                  value={llmModel}
                  onChange={(e) => {
                    const newModel = e.target.value
                    setLlmModel(newModel)
                    // Save model preference
                    if (newModel && llmProvider) {
                      saveLlmSettings(llmProvider, newModel)
                    }
                  }}
                  disabled={availableLlmModels.length === 0 || isLoadingLlmModels || !llmProvider}
                  className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {availableLlmModels.length > 0 ? (
                    availableLlmModels.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))
                  ) : (
                    <option value="">{llmProvider ? 'No models available' : 'Select provider first'}</option>
                  )}
                </select>
              </div>
            </div>
          )}

          {/* Prompt */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-card-foreground">
                Image Prompt
              </label>
              {availableLlmProviders.length > 0 && llmProvider && llmModel && (
                <Button
                  onClick={handleGeneratePrompt}
                  disabled={isLoadingPrompt || !llmProvider || !llmModel}
                  size="sm"
                  variant="outline"
                  className="h-8 !border-[#C3F43B] hover:!border-[#C3F43B]"
                  style={{ borderWidth: '1px', borderStyle: 'solid', borderColor: '#C3F43B' }}
                >
                  {isLoadingPrompt ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 mr-2" />
                      Generate Prompt
                    </>
                  )}
                </Button>
              )}
            </div>
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value)
                  setPromptError(null) // Clear error when user edits
                }}
                placeholder={availableLlmProviders.length > 0 
                  ? "Write your image prompt here, or click 'Generate Prompt' to create one with AI..."
                  : "Describe the image you want to generate..."}
                className={`w-full rounded-lg border px-4 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[100px] ${
                  promptError ? 'border-destructive bg-background' : 'border-input bg-background'
                }`}
              />
            </div>
            {promptError && (
              <p className="text-xs text-destructive mt-1">
                {promptError}
              </p>
            )}
            {!promptError && (
              <p className="text-xs text-muted-foreground mt-1">
                {availableLlmProviders.length > 0 
                  ? 'Enter a prompt manually or use AI to generate one from your post content.'
                  : 'Enter a prompt describing the image you want to generate.'}
              </p>
            )}
          </div>

          {/* Style Instructions */}
          <div>
            <label className="text-sm font-medium text-card-foreground mb-2 block">
              Style Instructions (Optional)
            </label>
            <input
              type="text"
              value={styleInstructions}
              onChange={(e) => setStyleInstructions(e.target.value)}
              placeholder="e.g., minimalist, professional, colorful, abstract..."
              className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Add specific style preferences to guide the image generation
            </p>
          </div>

          {/* Provider Selection */}
          <div>
            <label className="text-sm font-medium text-card-foreground mb-2 block">
              AI Provider
            </label>
            <select
              value={provider}
              onChange={(e) => {
                setProvider(e.target.value)
                setModel('') // Reset model when provider changes
              }}
              className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="fal">Fal.ai</option>
              <option value="openai-dalle">OpenAI DALL-E</option>
              <option value="replicate">Replicate</option>
            </select>
          </div>

          {/* Model Selection */}
          <div>
            <label className="text-sm font-medium text-card-foreground mb-2 block">
              Model
              {isLoadingModels && (
                <span className="ml-2 text-xs text-muted-foreground">
                  <Loader2 className="w-3 h-3 inline animate-spin" /> Loading...
                </span>
              )}
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={availableModels.length === 0 || isLoadingModels}
              className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {availableModels.length > 0 ? (
                availableModels.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))
              ) : (
                <option value="">No models available</option>
              )}
            </select>
            {availableModels.length === 0 && !isLoadingModels && (
              <p className="text-xs text-muted-foreground mt-1">
                Add an API key for this provider in settings to see available models
              </p>
            )}
          </div>

          {/* Aspect Ratio (only for DALL-E) */}
          {provider === 'openai-dalle' && (
            <div>
              <label className="text-sm font-medium text-card-foreground mb-2 block">
                Aspect Ratio
              </label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="1:1">Square (1:1)</option>
                <option value="16:9">Landscape (16:9)</option>
                <option value="9:16">Portrait (9:16)</option>
                <option value="4:3">Standard (4:3)</option>
                <option value="3:4">Portrait (3:4)</option>
              </select>
            </div>
          )}

          {/* Generated Image Preview */}
          {generatedImageUrl && (
            <div className="rounded-lg border border-border p-4">
              <label className="text-sm font-medium text-card-foreground mb-2 block">
                Generated Image
              </label>
              <div className="relative rounded-lg overflow-hidden border border-border">
                <Image
                  src={generatedImageUrl}
                  alt="Generated"
                  width={768}
                  height={768}
                  className="w-full h-auto max-h-96 object-contain"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim() || !model}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : generatedImageUrl ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerate
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Image
                </>
              )}
            </Button>
            {generatedImageUrl && (
              <Button
                onClick={handleUseImage}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Use This Image
              </Button>
            )}
            <Button
              onClick={onClose}
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

