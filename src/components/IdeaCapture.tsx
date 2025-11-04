'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, Image as ImageIcon, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getTemplates, type Template } from '@/lib/templateStorage'

interface IdeaCaptureProps {
  onGenerate: (content: string, platform: 'linkedin' | 'twitter' | 'both', templateId?: string, image?: string) => void
}

export function IdeaCapture({ onGenerate }: IdeaCaptureProps) {
  const [content, setContent] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [platform, setPlatform] = useState<'linkedin' | 'twitter' | 'both'>('both')
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const loadedTemplates = getTemplates()
    setTemplates(loadedTemplates)
    // Default to "none" - no template selected
    setSelectedTemplate('none')
  }, [])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setSelectedImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const toggleRecording = () => {
    setIsRecording(!isRecording)
    // In a real implementation, this would start/stop actual recording
    if (!isRecording) {
      // Simulate recording for 2 seconds
      setTimeout(() => {
        setIsRecording(false)
        setContent(prev => prev + ' [Voice recording transcription would appear here]')
      }, 2000)
    }
  }

  const handleGenerate = () => {
    if (content.trim()) {
      // Pass undefined if "none" is selected, otherwise pass the template ID
      const templateId = selectedTemplate === 'none' ? undefined : selectedTemplate
      onGenerate(content, platform, templateId, selectedImage || undefined)
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
          <span className="text-sm font-medium text-foreground">Recording...</span>
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
            className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="none">None (Raw AI)</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name} - {template.tone}
              </option>
            ))}
          </select>
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
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={toggleRecording}
          className={`p-3 rounded-full transition-all ${
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
          className="p-3 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all"
          title="Attach image"
        >
          <ImageIcon className="w-5 h-5" />
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
          className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Generate Posts
        </Button>
      </div>
    </div>
  )
}

