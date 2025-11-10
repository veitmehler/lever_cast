'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, Image as ImageIcon, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

// TypeScript definitions for Web Speech API
interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null
  onend: ((this: SpeechRecognition, ev: Event) => any) | null
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
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

interface IdeaCaptureProps {
  onGenerate: (
    content: string, 
    platform: 'linkedin' | 'twitter' | 'both', 
    templateId?: string, 
    image?: string,
    twitterFormat?: 'single' | 'thread'
  ) => void
}

export function IdeaCapture({ onGenerate }: IdeaCaptureProps) {
  const [content, setContent] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [platform, setPlatform] = useState<'linkedin' | 'twitter' | 'both'>('both')
  const [twitterFormat, setTwitterFormat] = useState<'single' | 'thread'>('single')
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const [recognitionError, setRecognitionError] = useState<string | null>(null)

  // Fetch templates from API
  const fetchTemplates = async () => {
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
      console.log('[IdeaCapture] Templates loading complete. Current templates:', templates.length)
    }
  }

  // Seed default templates
  const seedTemplates = async () => {
    try {
      console.log('[IdeaCapture] Seeding templates...')
      const response = await fetch('/api/templates/seed', {
        method: 'POST',
      })
      
      console.log('[IdeaCapture] Seed response status:', response.status)
      
      if (response.ok) {
        console.log('[IdeaCapture] Templates seeded successfully, refetching...')
        await fetchTemplates()
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('[IdeaCapture] Failed to seed templates:', response.status, errorData)
      }
    } catch (error) {
      console.error('[IdeaCapture] Error seeding templates:', error)
    }
  }

  useEffect(() => {
    fetchTemplates()
    // Default to "none" - no template selected
    setSelectedTemplate('none')

    // Initialize Speech Recognition API
    if (typeof window !== 'undefined') {
      const SpeechRecognitionConstructor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      
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
        } catch (e) {
          // Ignore errors during cleanup
        }
      }
    }
  }, [])

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
    if (content.trim()) {
      // Pass undefined if "none" is selected, otherwise pass the template ID
      const templateId = selectedTemplate === 'none' ? undefined : selectedTemplate
      // Pass twitterFormat when Twitter is selected
      const twitterFormatParam = (platform === 'twitter' || platform === 'both') 
        ? twitterFormat 
        : undefined
      onGenerate(content, platform, templateId, selectedImage || undefined, twitterFormatParam)
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
          Type or record your thought, and let AI transform it into polished posts
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
          <img
            src={selectedImage}
            alt="Attached"
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
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {/* Template Selection */}
        <div>
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

        {/* Platform Selection */}
        <div>
          <label className="text-sm font-medium text-card-foreground mb-2 block">
            Target Platform
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setPlatform('linkedin')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                platform === 'linkedin'
                  ? 'bg-[#0A66C2] text-white'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              LinkedIn
            </button>
            <button
              onClick={() => setPlatform('twitter')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                platform === 'twitter'
                  ? 'bg-[#1DA1F2] text-white'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              Twitter
            </button>
            <button
              onClick={() => setPlatform('both')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                platform === 'both'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              Both
            </button>
          </div>
        </div>
      </div>

      {/* Twitter Format Selection */}
      {(platform === 'twitter' || platform === 'both') && (
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
          
          <div className="grid gap-3 md:grid-cols-2">
            {/* LinkedIn Preview */}
            {(platform === 'linkedin' || platform === 'both') && (
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
            {(platform === 'twitter' || platform === 'both') && (
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
          title={isUploadingImage ? 'Uploading image...' : 'Attach image'}
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

        <div className="flex-1" />

        <Button
          onClick={handleGenerate}
          disabled={!content.trim() || isRecording}
          className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Generate Posts
        </Button>
      </div>
    </div>
  )
}

