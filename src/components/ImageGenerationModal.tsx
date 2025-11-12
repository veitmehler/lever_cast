'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, Sparkles, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

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
  const [defaultImageProvider, setDefaultImageProvider] = useState<string | null>(null)
  const [defaultImageModel, setDefaultImageModel] = useState<Record<string, string>>({})
  const [defaultImageStyle, setDefaultImageStyle] = useState('')

  // Load settings on mount
  useEffect(() => {
    if (isOpen) {
      loadSettings()
      generateInitialPrompt() // This is now async but we don't need to await it
    }
  }, [isOpen, postContent])

  // Load models when provider changes
  useEffect(() => {
    if (isOpen && provider) {
      loadModels()
    }
  }, [isOpen, provider])

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
      }
    } catch (error) {
      console.error('Error loading settings:', error)
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

  const generateInitialPrompt = async () => {
    setIsLoadingPrompt(true)
    
    // Set initial placeholder while loading
    setPrompt('Generating optimized prompt...')
    
    // Try to generate LLM-optimized prompt
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
        }),
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.prompt && result.prompt.trim()) {
          setPrompt(result.prompt)
        } else {
          // Fallback to simple prompt if LLM didn't return a good result
          let simplePrompt = postContent.trim()
          if (simplePrompt.length > 200) {
            simplePrompt = simplePrompt.substring(0, 200) + '...'
          }
          setPrompt(simplePrompt)
        }
      } else {
        // Fallback to simple prompt on error
        let simplePrompt = postContent.trim()
        if (simplePrompt.length > 200) {
          simplePrompt = simplePrompt.substring(0, 200) + '...'
        }
        setPrompt(simplePrompt)
      }
    } catch (error) {
      // Fallback to simple prompt on error
      console.log('[Image Modal] Could not generate LLM prompt, using simple prompt')
      let simplePrompt = postContent.trim()
      if (simplePrompt.length > 200) {
        simplePrompt = simplePrompt.substring(0, 200) + '...'
      }
      setPrompt(simplePrompt)
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
          {/* Prompt */}
          <div>
            <label className="text-sm font-medium text-card-foreground mb-2 block">
              Image Prompt
            </label>
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the image you want to generate..."
                disabled={isLoadingPrompt}
                className={`w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[100px] ${
                  isLoadingPrompt ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              />
              {isLoadingPrompt && (
                <div className="absolute right-3 top-3">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isLoadingPrompt 
                ? 'Generating optimized prompt with AI...' 
                : 'Auto-generated from your post content. Edit as needed.'}
            </p>
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
                <img
                  src={generatedImageUrl}
                  alt="Generated"
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

