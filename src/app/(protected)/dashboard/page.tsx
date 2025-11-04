'use client'

import { useState } from 'react'
import { IdeaCapture } from '@/components/IdeaCapture'
import { PlatformPreview } from '@/components/PlatformPreview'
import { generateContent, publishToPlatform, GeneratedContent } from '@/lib/mockAI'
import { Loader2 } from 'lucide-react'

export default function DashboardPage() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null)
  const [rawIdea, setRawIdea] = useState('')

  const handleGenerate = async (
    content: string,
    platform: 'linkedin' | 'twitter' | 'both'
  ) => {
    setIsGenerating(true)
    setRawIdea(content)
    setGeneratedContent(null)

    try {
      const result = await generateContent(content, platform)
      setGeneratedContent(result)
    } catch (error) {
      console.error('Error generating content:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRegenerate = async (platform: 'linkedin' | 'twitter') => {
    if (!rawIdea) return

    setIsGenerating(true)

    try {
      const result = await generateContent(rawIdea, platform)
      setGeneratedContent((prev) => ({
        ...prev,
        ...result,
      }))
    } catch (error) {
      console.error('Error regenerating content:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePublish = async (platform: 'linkedin' | 'twitter', content: string) => {
    try {
      const result = await publishToPlatform(platform, content)
      if (result.success) {
        alert(result.message)
      }
    } catch (error) {
      console.error('Error publishing:', error)
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Welcome to Levercast</h1>
        <p className="text-muted-foreground">
          Convert your spontaneous ideas into polished, multi-platform social posts.
        </p>
      </div>

      {/* Idea Capture Widget */}
      <div className="mb-8">
        <IdeaCapture onGenerate={handleGenerate} />
      </div>

      {/* Loading State */}
      {isGenerating && (
        <div className="mb-8 rounded-lg border border-border bg-card p-12 text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <h3 className="text-xl font-semibold text-card-foreground mb-2">
            Generating Your Posts...
          </h3>
          <p className="text-muted-foreground">
            AI is crafting optimized content for your selected platforms
          </p>
        </div>
      )}

      {/* Generated Content Preview */}
      {!isGenerating && generatedContent && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">Your Generated Posts</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {generatedContent.linkedin && (
              <PlatformPreview
                platform="linkedin"
                content={generatedContent.linkedin}
                onRegenerate={() => handleRegenerate('linkedin')}
                onPublish={() => handlePublish('linkedin', generatedContent.linkedin!)}
              />
            )}
            {generatedContent.twitter && (
              <PlatformPreview
                platform="twitter"
                content={generatedContent.twitter}
                onRegenerate={() => handleRegenerate('twitter')}
                onPublish={() => handlePublish('twitter', generatedContent.twitter!)}
              />
            )}
          </div>
        </div>
      )}

      {/* Feature Overview - Only show if no content generated yet */}
      {!generatedContent && !isGenerating && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-6 hover:border-primary/50 transition-colors">
            <h3 className="text-xl font-semibold text-card-foreground mb-3">Idea Capture</h3>
            <p className="text-muted-foreground">
              Type or record your idea above. Our AI will transform it into engaging content.
            </p>
          </div>
          
          <div className="rounded-lg border border-border bg-card p-6 hover:border-primary/50 transition-colors">
            <h3 className="text-xl font-semibold text-card-foreground mb-3">AI Processing</h3>
            <p className="text-muted-foreground">
              Choose your target platform and let AI optimize your content automatically.
            </p>
          </div>
          
          <div className="rounded-lg border border-border bg-card p-6 hover:border-primary/50 transition-colors">
            <h3 className="text-xl font-semibold text-card-foreground mb-3">Preview & Edit</h3>
            <p className="text-muted-foreground">
              Review generated posts with platform-specific previews. Click to edit inline.
            </p>
          </div>
          
          <div className="rounded-lg border border-border bg-card p-6 hover:border-primary/50 transition-colors">
            <h3 className="text-xl font-semibold text-card-foreground mb-3">Publish</h3>
            <p className="text-muted-foreground">
              Copy to clipboard or publish directly to your connected social accounts.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

