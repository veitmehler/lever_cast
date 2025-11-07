'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { IdeaCapture } from '@/components/IdeaCapture'
import { PlatformPreview } from '@/components/PlatformPreview'
import { generateContent, publishToPlatform, GeneratedContent } from '@/lib/mockAI'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export default function DashboardPage() {
  const { user } = useUser()
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null)
  const [rawIdea, setRawIdea] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState<'linkedin' | 'twitter' | 'both'>('both')
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null)
  const [attachedImage, setAttachedImage] = useState<string | undefined>(undefined)
  
  // Get user display info
  const userName = user?.fullName || user?.firstName || 'User'
  const userInitials = user?.firstName && user?.lastName 
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : user?.firstName 
      ? user.firstName.slice(0, 2).toUpperCase()
      : 'U'

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

  const handleSaveDraft = async () => {
    if (!generatedContent || !rawIdea) {
      toast.error('Please generate content first')
      return
    }

    try {
      const title = rawIdea.slice(0, 50) + (rawIdea.length > 50 ? '...' : '')
      
      // If draft already exists, update it instead of creating a new one
      if (currentDraftId) {
        const response = await fetch(`/api/drafts/${currentDraftId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title,
            contentRaw: rawIdea,
            linkedinContent: generatedContent.linkedin || null,
            twitterContent: generatedContent.twitter || null,
            platforms: selectedPlatform,
            attachedImage: attachedImage || null,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to update draft')
        }

        toast.success('Draft updated successfully!', {
          description: 'Your changes have been saved',
        })
      } else {
        // Create new draft
        const response = await fetch('/api/drafts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title,
            contentRaw: rawIdea,
            linkedinContent: generatedContent.linkedin || null,
            twitterContent: generatedContent.twitter || null,
            platforms: selectedPlatform,
            status: 'draft',
            attachedImage: attachedImage || null,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(errorData.error || 'Failed to save draft')
        }

        const draft = await response.json()
        setCurrentDraftId(draft.id)
        
        toast.success('Draft saved successfully!', {
          description: 'You can find it in the Posts page',
        })
      }
    } catch (error) {
      console.error('Error saving draft:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to save draft'
      toast.error(errorMessage)
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

  const handleContentChange = async (platform: 'linkedin' | 'twitter', newContent: string) => {
    // Update local state immediately
    setGeneratedContent((prev) => ({
      ...prev,
      [platform]: newContent,
    }))

    // If draft is already saved, update it in the database
    if (currentDraftId) {
      try {
        const updateData: Record<string, string> = {}
        if (platform === 'linkedin') {
          updateData.linkedinContent = newContent
        } else {
          updateData.twitterContent = newContent
        }

        const response = await fetch(`/api/drafts/${currentDraftId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        })

        if (response.ok) {
          toast.success('Changes saved', { duration: 2000 })
        } else {
          console.error('Failed to save edited content')
          toast.error('Failed to save changes')
        }
      } catch (error) {
        console.error('Error saving edited content:', error)
        toast.error('Failed to save changes')
      }
    } else {
      // If no draft exists yet, show a message that changes will be saved when draft is created
      toast.info('Changes will be saved when you publish or save draft', { duration: 2000 })
    }
  }

  const handlePublish = async (platform: 'linkedin' | 'twitter', content: string) => {
    try {
      // First, save draft if not already saved (use current edited content)
      let draftId = currentDraftId
      if (!draftId && rawIdea) {
        const title = rawIdea.slice(0, 50) + (rawIdea.length > 50 ? '...' : '')
        
        const draftResponse = await fetch('/api/drafts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title,
            contentRaw: rawIdea,
            linkedinContent: generatedContent?.linkedin || null,
            twitterContent: generatedContent?.twitter || null,
            platforms: selectedPlatform,
            status: 'draft',
            attachedImage: attachedImage || null,
          }),
        })

        if (!draftResponse.ok) {
          const errorData = await draftResponse.json().catch(() => ({ error: 'Unknown error' }))
          console.error('Failed to save draft:', errorData)
          const errorMessage = errorData.details
            ? `${errorData.error || 'Failed to save draft'}: ${errorData.details}`
            : errorData.error || 'Unknown error'
          throw new Error(`Failed to save draft: ${errorMessage}`)
        }

        const draft = await draftResponse.json()
        draftId = draft.id
        setCurrentDraftId(draft.id)
      } else if (draftId) {
        // If draft exists, ensure edited content is saved before publishing
        const updateData: Record<string, string> = {}
        if (platform === 'linkedin' && generatedContent?.linkedin) {
          updateData.linkedinContent = generatedContent.linkedin
        } else if (platform === 'twitter' && generatedContent?.twitter) {
          updateData.twitterContent = generatedContent.twitter
        }

        // Only update if there are changes
        if (Object.keys(updateData).length > 0) {
          await fetch(`/api/drafts/${draftId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData),
          })
        }
      }

      // Simulate publishing (in real app, this would call social media APIs)
      const result = await publishToPlatform(platform, content)
      
      if (result.success) {
        // Create a post record in the database
        const postResponse = await fetch('/api/posts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            draftId: draftId || null,
            platform,
            content,
            status: 'published',
          }),
        })

        if (!postResponse.ok) {
          const errorData = await postResponse.json().catch(() => ({ error: 'Unknown error' }))
          console.error('Failed to save post:', errorData)
          if (errorData.error?.includes('already published')) {
            toast.error(errorData.error)
          } else {
            throw new Error(errorData.error || 'Failed to save post')
          }
          return
        }

        // Refresh draft data if we have a draftId
        if (draftId) {
          const draftResponse = await fetch(`/api/drafts/${draftId}`)
          if (draftResponse.ok) {
            const updatedDraft = await draftResponse.json()
            setCurrentDraftId(updatedDraft.id)
          }
        }

        toast.success(result.message, {
          description: `Your ${platform} post is now live!`,
        })
      }
    } catch (error) {
      console.error('Error publishing:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to publish post'
      toast.error(errorMessage)
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
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Save className="w-4 h-4 mr-2" />
              {currentDraftId ? 'Update Draft' : 'Save to Drafts'}
            </Button>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {generatedContent.linkedin && (
              <PlatformPreview
                platform="linkedin"
                content={generatedContent.linkedin}
                image={attachedImage}
                userName={userName}
                userInitials={userInitials}
                onRegenerate={() => handleRegenerate('linkedin')}
                onPublish={(editedContent) => handlePublish('linkedin', editedContent)}
                onContentChange={handleContentChange}
              />
            )}
            {generatedContent.twitter && (
              <PlatformPreview
                platform="twitter"
                content={generatedContent.twitter}
                image={attachedImage}
                userName={userName}
                userInitials={userInitials}
                onRegenerate={() => handleRegenerate('twitter')}
                onPublish={(editedContent) => handlePublish('twitter', editedContent)}
                onContentChange={handleContentChange}
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

