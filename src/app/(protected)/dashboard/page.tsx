'use client'

import { useState } from 'react'
import { IdeaCapture } from '@/components/IdeaCapture'
import { PlatformPreview } from '@/components/PlatformPreview'
import { generateContent, publishToPlatform, GeneratedContent } from '@/lib/mockAI'
import { saveDraft, markAsPublished } from '@/lib/draftStorage'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export default function DashboardPage() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null)
  const [rawIdea, setRawIdea] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState<'linkedin' | 'twitter' | 'both'>('both')
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null)
  const [attachedImage, setAttachedImage] = useState<string | undefined>(undefined)

  const handleGenerate = async (
    content: string,
    platform: 'linkedin' | 'twitter' | 'both',
    templateId?: string,
    image?: string
  ) => {
    setIsGenerating(true)
    setRawIdea(content)
    setSelectedPlatform(platform)
    setGeneratedContent(null)
    setCurrentDraftId(null)
    setAttachedImage(image)

    try {
      const result = await generateContent(content, platform, templateId)
      setGeneratedContent(result)
      toast.success('Posts generated successfully!')
    } catch (error) {
      console.error('Error generating content:', error)
      toast.error('Failed to generate posts')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveDraft = () => {
    if (!generatedContent || !rawIdea) return

    try {
      const title = rawIdea.slice(0, 50) + (rawIdea.length > 50 ? '...' : '')
      
      const draft = saveDraft({
        title,
        rawIdea,
        linkedinContent: generatedContent.linkedin,
        twitterContent: generatedContent.twitter,
        platform: selectedPlatform,
        status: 'draft',
      })

      setCurrentDraftId(draft.id)
      toast.success('Draft saved successfully!', {
        description: 'You can find it in the Posts page',
      })
    } catch (error) {
      console.error('Error saving draft:', error)
      toast.error('Failed to save draft')
    }
  }

  const handleRegenerate = async (platform: 'linkedin' | 'twitter') => {
    if (!rawIdea) return

    setIsGenerating(true)

    try {
      // Use default template for regeneration
      const result = await generateContent(rawIdea, platform)
      setGeneratedContent((prev) => ({
        ...prev,
        ...result,
      }))
      toast.success(`${platform} post regenerated!`)
    } catch (error) {
      console.error('Error regenerating content:', error)
      toast.error('Failed to regenerate post')
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePublish = async (platform: 'linkedin' | 'twitter', content: string) => {
    try {
      const result = await publishToPlatform(platform, content)
      if (result.success) {
        // Mark as published if we have a draft ID
        if (currentDraftId) {
          markAsPublished(currentDraftId)
        }
        toast.success(result.message, {
          description: `Your ${platform} post is now live!`,
        })
      }
    } catch (error) {
      console.error('Error publishing:', error)
      toast.error('Failed to publish post')
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-foreground">Your Generated Posts</h2>
            <Button
              onClick={handleSaveDraft}
              variant="outline"
              disabled={!!currentDraftId}
            >
              <Save className="w-4 h-4 mr-2" />
              {currentDraftId ? 'Saved' : 'Save Draft'}
            </Button>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {generatedContent.linkedin && (
              <PlatformPreview
                platform="linkedin"
                content={generatedContent.linkedin}
                image={attachedImage}
                onRegenerate={() => handleRegenerate('linkedin')}
                onPublish={() => handlePublish('linkedin', generatedContent.linkedin!)}
              />
            )}
            {generatedContent.twitter && (
              <PlatformPreview
                platform="twitter"
                content={generatedContent.twitter}
                image={attachedImage}
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

