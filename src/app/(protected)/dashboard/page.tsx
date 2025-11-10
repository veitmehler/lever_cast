'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { IdeaCapture } from '@/components/IdeaCapture'
import { PlatformPreview } from '@/components/PlatformPreview'
import { ScheduleModal } from '@/components/ScheduleModal'
import { generateContent, GeneratedContent } from '@/lib/mockAI'
import { ApiKeyRequiredModal } from '@/components/ApiKeyRequiredModal'
import { Loader2, Save, Send, Calendar } from 'lucide-react'
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
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>(undefined)
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [apiKeyErrorReason, setApiKeyErrorReason] = useState<'no_key' | 'api_error'>('no_key')
  const [isBulkPublishing, setIsBulkPublishing] = useState(false)
  const [isBulkScheduling, setIsBulkScheduling] = useState(false)
  const [showBulkScheduleModal, setShowBulkScheduleModal] = useState(false)
  
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
    image?: string,
    twitterFormat?: 'single' | 'thread'
  ) => {
    setIsGenerating(true)
    setRawIdea(content)
    setSelectedPlatform(platform)
    setSelectedTemplateId(templateId)
    setGeneratedContent(null)
    setCurrentDraftId(null)
    setAttachedImage(image)

    try {
      const result = await generateContent(content, platform, templateId, twitterFormat)
      setGeneratedContent(result)
      toast.success('Posts generated successfully!')
    } catch (error) {
      console.error('Error generating content:', error)
      
      // Check if it's an API key error
      if (error instanceof Error && error.message === 'NO_API_KEY') {
        setApiKeyErrorReason('no_key')
        setShowApiKeyModal(true)
      } else if (error instanceof Error && error.message === 'API_ERROR') {
        setApiKeyErrorReason('api_error')
        setShowApiKeyModal(true)
      } else {
        toast.error('Failed to generate posts')
      }
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
            twitterContent: Array.isArray(generatedContent.twitter) 
              ? JSON.stringify(generatedContent.twitter) 
              : (generatedContent.twitter || null),
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
            twitterContent: Array.isArray(generatedContent.twitter) 
              ? JSON.stringify(generatedContent.twitter) 
              : (generatedContent.twitter || null),
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
      // Use the same template that was used for initial generation
      const result = await generateContent(rawIdea, platform, selectedTemplateId)
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

  const handleContentChange = async (platform: 'linkedin' | 'twitter', newContent: string | string[]) => {
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
          updateData.linkedinContent = newContent as string
        } else {
          // Stringify if array, otherwise use as string
          updateData.twitterContent = Array.isArray(newContent) 
            ? JSON.stringify(newContent) 
            : newContent
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

  const handleSchedule = async (platform: 'linkedin' | 'twitter', content: string | string[], scheduledAt: Date) => {
    try {
      // First, save draft if not already saved
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
            twitterContent: Array.isArray(generatedContent?.twitter) 
              ? JSON.stringify(generatedContent.twitter) 
              : (generatedContent?.twitter || null),
            platforms: selectedPlatform,
            status: 'draft',
            attachedImage: attachedImage || null,
          }),
        })

        if (!draftResponse.ok) {
          const errorData = await draftResponse.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(errorData.error || 'Failed to save draft')
        }

        const draft = await draftResponse.json()
        draftId = draft.id
        setCurrentDraftId(draft.id)
      } else if (draftId) {
        // Ensure edited content is saved before scheduling
        const updateData: Record<string, string> = {}
        if (platform === 'linkedin' && generatedContent?.linkedin) {
          updateData.linkedinContent = generatedContent.linkedin
        } else if (platform === 'twitter' && generatedContent?.twitter) {
          updateData.twitterContent = Array.isArray(generatedContent.twitter) 
            ? JSON.stringify(generatedContent.twitter) 
            : generatedContent.twitter
        }

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

      // Create scheduled post(s)
      // For threads, schedule summary first, then replies
      if (Array.isArray(content)) {
        // Thread: Schedule summary first, then replies
        // Step 1: Schedule the summary post (index 0)
        const summaryResponse = await fetch('/api/posts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            draftId: draftId || null,
            platform,
            content: content[0], // Summary post
            status: 'scheduled',
            scheduledAt: scheduledAt.toISOString(),
            threadOrder: 0, // Summary post is always order 0
          }),
        })

        if (!summaryResponse.ok) {
          const errorData = await summaryResponse.json().catch(() => ({ error: 'Unknown error' }))
          console.error('[Dashboard] Failed to schedule summary post:', errorData)
          const errorMessage = errorData.details
            ? `${errorData.error || 'Failed to schedule summary post'}: ${errorData.details}`
            : errorData.error || 'Failed to schedule summary post'
          throw new Error(errorMessage)
        }

        const summaryPost = await summaryResponse.json()
        const summaryPostId = summaryPost.id

        // Step 2: Schedule the replies (index > 0) as replies to the summary post
        if (content.length > 1) {
          const replyPromises = content.slice(1).map((tweet, index) =>
            fetch('/api/posts', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                draftId: draftId || null,
                platform,
                content: tweet,
                status: 'scheduled',
                scheduledAt: scheduledAt.toISOString(),
                parentPostId: summaryPostId, // Link to summary post
                threadOrder: index + 1, // Replies start at 1
              }),
            })
          )

          const replyResponses = await Promise.all(replyPromises)
          const failedReply = replyResponses.find(r => !r.ok)

          if (failedReply) {
            const errorData = await failedReply.json().catch(() => ({ error: 'Unknown error' }))
            throw new Error(errorData.error || 'Failed to schedule thread replies')
          }
        }
      } else {
        // Single post: Create one scheduled post
        const postResponse = await fetch('/api/posts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            draftId: draftId || null,
            platform,
            content,
            status: 'scheduled',
            scheduledAt: scheduledAt.toISOString(),
          }),
        })

        if (!postResponse.ok) {
          const errorData = await postResponse.json().catch(() => ({ error: 'Unknown error' }))
          console.error('Failed to schedule post:', errorData)
          const errorMessage = errorData.details
            ? `${errorData.error || 'Failed to schedule post'}: ${errorData.details}`
            : errorData.error || 'Failed to schedule post'
          throw new Error(errorMessage)
        }
      }

      toast.success('Post scheduled successfully!', {
        description: `Your ${platform} post is scheduled for ${scheduledAt.toLocaleDateString()}`,
      })
    } catch (error) {
      console.error('Error scheduling:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to schedule post'
      toast.error(errorMessage)
      throw error
    }
  }

  const handlePublish = async (platform: 'linkedin' | 'twitter', content: string | string[]) => {
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
            twitterContent: Array.isArray(generatedContent?.twitter) 
              ? JSON.stringify(generatedContent.twitter) 
              : (generatedContent?.twitter || null),
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
          updateData.twitterContent = Array.isArray(generatedContent.twitter) 
            ? JSON.stringify(generatedContent.twitter) 
            : generatedContent.twitter
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

      // Publish to social media via API
      const publishResponse = await fetch('/api/posts/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform,
          content: Array.isArray(content) ? content : content,
          draftId: draftId || null,
          imageUrl: attachedImage || undefined,
        }),
      })

      if (!publishResponse.ok) {
        const errorData = await publishResponse.json().catch(() => ({ error: 'Unknown error' }))
        const errorMessage = errorData.details
          ? `${errorData.error || 'Failed to publish'}: ${errorData.details}`
          : errorData.error || 'Failed to publish'
        throw new Error(errorMessage)
      }

      const publishResult = await publishResponse.json()
      const postUrl = Array.isArray(publishResult.postUrl) ? publishResult.postUrl[0] : publishResult.postUrl
      const tweetIds = publishResult.tweetIds || (publishResult.tweetId ? [publishResult.tweetId] : [])
      
      if (publishResult.success) {
        // Create post record(s) in the database
        // For threads, publish summary first, then replies
        if (Array.isArray(content)) {
          // Thread: Publish summary first, then replies
          // Step 1: Publish the summary post (index 0)
          const summaryResponse = await fetch('/api/posts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              draftId: draftId || null,
              platform,
              content: content[0], // Summary post
              status: 'published',
              postUrl: Array.isArray(publishResult.postUrl) ? publishResult.postUrl[0] : publishResult.postUrl,
              tweetId: tweetIds[0] || null,
              threadOrder: 0, // Summary post is always order 0
            }),
          })

          if (!summaryResponse.ok) {
            const errorData = await summaryResponse.json().catch(() => ({ error: 'Unknown error' }))
            console.error('Failed to create summary post:', errorData)
            if (errorData.error?.includes('already published')) {
              toast.error(errorData.error)
            } else {
              const errorMessage = errorData.details
                ? `${errorData.error || 'Failed to save summary post'}: ${errorData.details}`
                : errorData.error || 'Failed to save summary post'
              throw new Error(errorMessage)
            }
            return
          }

          const summaryPost = await summaryResponse.json()
          const summaryPostId = summaryPost.id

          // Step 2: Publish the replies (index > 0) as replies to the summary post
          if (content.length > 1) {
            const replyPromises = content.slice(1).map((tweet, index) =>
              fetch('/api/posts', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  draftId: draftId || null,
                  platform,
                  content: tweet,
                  status: 'published',
                  parentPostId: summaryPostId, // Link to summary post
                  threadOrder: index + 1, // Replies start at 1
                  postUrl: Array.isArray(publishResult.postUrl) && publishResult.postUrl[index + 1] 
                    ? publishResult.postUrl[index + 1] 
                    : null,
                  tweetId: tweetIds[index + 1] || null,
                }),
              })
            )

            const replyResponses = await Promise.all(replyPromises)
            const failedReply = replyResponses.find(r => !r.ok)

            if (failedReply) {
              const errorData = await failedReply.json().catch(() => ({ error: 'Unknown error' }))
              console.error('Failed to create reply posts:', errorData)
              const errorMessage = errorData.details
                ? `${errorData.error || 'Failed to save thread replies'}: ${errorData.details}`
                : errorData.error || 'Failed to save thread replies'
              throw new Error(errorMessage)
            }
          }
        } else {
          // Single post: Create one Post record
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
              postUrl: postUrl || null,
              tweetId: tweetIds[0] || null,
            }),
          })

          if (!postResponse.ok) {
            const errorData = await postResponse.json().catch(() => ({ error: 'Unknown error' }))
            console.error('Failed to save post:', errorData)
            if (errorData.error?.includes('already published')) {
              toast.error(errorData.error)
            } else {
              const errorMessage = errorData.details
                ? `${errorData.error || 'Failed to save post'}: ${errorData.details}`
                : errorData.error || 'Failed to save post'
              throw new Error(errorMessage)
            }
            return
          }
        }

        // Refresh draft data if we have a draftId
        if (draftId) {
          const draftResponse = await fetch(`/api/drafts/${draftId}`)
          if (draftResponse.ok) {
            const updatedDraft = await draftResponse.json()
            setCurrentDraftId(updatedDraft.id)
          }
        }

        toast.success(publishResult.message || `Post successfully published to ${platform}!`, {
          description: `Your ${platform} post is now live!`,
        })
      } else {
        // Publishing failed
        throw new Error(publishResult.error || 'Failed to publish post')
      }
    } catch (error) {
      console.error('Error publishing:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to publish post'
      toast.error(errorMessage)
    }
  }

  // Handle bulk publish all platforms
  const handleBulkPublishAll = async () => {
    if (!generatedContent) {
      toast.error('No content to publish')
      return
    }

    setIsBulkPublishing(true)
    try {
      const publishPromises: Promise<void>[] = []

      if (generatedContent.linkedin && (selectedPlatform === 'linkedin' || selectedPlatform === 'both')) {
        publishPromises.push(handlePublish('linkedin', generatedContent.linkedin))
      }

      if (generatedContent.twitter && (selectedPlatform === 'twitter' || selectedPlatform === 'both')) {
        const twitterContent = Array.isArray(generatedContent.twitter) 
          ? generatedContent.twitter 
          : generatedContent.twitter
        publishPromises.push(handlePublish('twitter', twitterContent))
      }

      if (publishPromises.length === 0) {
        toast.error('No platforms selected to publish')
        return
      }

      await Promise.all(publishPromises)
      toast.success('All posts published successfully!')
    } catch (error) {
      console.error('Error bulk publishing:', error)
      toast.error('Failed to publish some posts')
    } finally {
      setIsBulkPublishing(false)
    }
  }

  // Handle bulk schedule all platforms
  const handleBulkScheduleAll = async (scheduledDate: Date) => {
    if (!generatedContent) {
      toast.error('No content to schedule')
      return
    }

    setIsBulkScheduling(true)
    try {
      const schedulePromises: Promise<void>[] = []

      if (generatedContent.linkedin && (selectedPlatform === 'linkedin' || selectedPlatform === 'both')) {
        schedulePromises.push(handleSchedule('linkedin', generatedContent.linkedin, scheduledDate))
      }

      if (generatedContent.twitter && (selectedPlatform === 'twitter' || selectedPlatform === 'both')) {
        const twitterContent = Array.isArray(generatedContent.twitter) 
          ? generatedContent.twitter 
          : generatedContent.twitter
        schedulePromises.push(handleSchedule('twitter', twitterContent, scheduledDate))
      }

      if (schedulePromises.length === 0) {
        toast.error('No platforms selected to schedule')
        return
      }

      await Promise.all(schedulePromises)
      toast.success('All posts scheduled successfully!', {
        description: `Scheduled for ${scheduledDate.toLocaleDateString()}`,
      })
      setShowBulkScheduleModal(false)
    } catch (error) {
      console.error('Error bulk scheduling:', error)
      toast.error('Failed to schedule some posts')
    } finally {
      setIsBulkScheduling(false)
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
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setShowBulkScheduleModal(true)}
                disabled={isBulkScheduling}
              >
                {isBulkScheduling ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule All
                  </>
                )}
              </Button>
              <Button
                variant="default"
                onClick={handleBulkPublishAll}
                disabled={isBulkPublishing}
              >
                {isBulkPublishing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Publish All Now
                  </>
                )}
              </Button>
              <Button
                onClick={handleSaveDraft}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Save className="w-4 h-4 mr-2" />
                {currentDraftId ? 'Update Draft' : 'Save to Drafts'}
              </Button>
            </div>
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
                onSchedule={(editedContent, scheduledAt) => handleSchedule('linkedin', editedContent, scheduledAt)}
                onContentChange={handleContentChange}
                isRegenerating={isGenerating}
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
                onSchedule={(editedContent, scheduledAt) => handleSchedule('twitter', editedContent, scheduledAt)}
                onContentChange={handleContentChange}
                isRegenerating={isGenerating}
              />
            )}
          </div>
          
          {/* Bulk Schedule Modal */}
          {showBulkScheduleModal && (
            <ScheduleModal
              isOpen={showBulkScheduleModal}
              onClose={() => setShowBulkScheduleModal(false)}
              onSchedule={handleBulkScheduleAll}
              platform={selectedPlatform === 'both' ? 'linkedin' : selectedPlatform}
              content={
                selectedPlatform === 'both' 
                  ? `${generatedContent.linkedin || ''}\n\n${Array.isArray(generatedContent.twitter) ? generatedContent.twitter.join('\n\n') : generatedContent.twitter || ''}`
                  : selectedPlatform === 'linkedin'
                    ? generatedContent.linkedin || ''
                    : Array.isArray(generatedContent.twitter) ? generatedContent.twitter.join('\n\n') : generatedContent.twitter || ''
              }
            />
          )}
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

      {/* API Key Required Modal */}
      <ApiKeyRequiredModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        reason={apiKeyErrorReason}
      />
    </div>
  )
}

