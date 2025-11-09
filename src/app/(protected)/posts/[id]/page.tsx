'use client'

import { use, useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { ArrowLeft, Trash2, Loader2, Image as ImageIcon, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PlatformPreview } from '@/components/PlatformPreview'
import { generateContent } from '@/lib/mockAI'
import { toast } from 'sonner'

// Draft type matching database schema
type Draft = {
  id: string
  userId: string
  title: string
  contentRaw: string
  linkedinContent: string | null
  twitterContent: string | string[] | null // Support both single and thread
  platforms: string
  templateId: string | null
  attachedImage: string | null
  status: string
  publishedAt: Date | null
  createdAt: Date
  updatedAt: Date
  posts?: Array<{
    id: string
    platform: string
    publishedAt: Date | null
    scheduledAt: Date | null
    status: string
    postUrl: string | null
    parentPostId?: string | null // For filtering out reply posts
  }>
}

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const { user } = useUser()
  const { id } = use(params)
  const [post, setPost] = useState<Draft | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRegenerating, setIsRegenerating] = useState<Record<'linkedin' | 'twitter', boolean>>({
    linkedin: false,
    twitter: false,
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Get user display info
  const userName = user?.fullName || user?.firstName || 'User'
  const userInitials = user?.firstName && user?.lastName 
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : user?.firstName 
      ? user.firstName.slice(0, 2).toUpperCase()
      : 'U'

  // Fetch draft from API
  useEffect(() => {
    const fetchDraft = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/drafts/${id}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch draft')
        }
        
        const data = await response.json()
        
        // Parse twitterContent if it's a JSON string
        if (data.twitterContent && typeof data.twitterContent === 'string') {
          try {
            const parsed = JSON.parse(data.twitterContent)
            if (Array.isArray(parsed)) {
              data.twitterContent = parsed
            }
          } catch {
            // Keep as string if not valid JSON
          }
        }
        
        setPost(data)
      } catch (error) {
        console.error('Error fetching draft:', error)
        toast.error('Failed to load draft')
        setPost(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDraft()
  }, [id])

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this draft?')) {
      try {
        const response = await fetch(`/api/drafts/${id}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          throw new Error('Failed to delete draft')
        }

        toast.success('Draft deleted successfully')
        router.push('/posts')
      } catch (error) {
        console.error('Error deleting draft:', error)
        toast.error('Failed to delete draft')
      }
    }
  }

  const handleContentChange = async (platform: 'linkedin' | 'twitter', newContent: string | string[]) => {
    // Update local state
    setPost((prev) => {
      if (!prev) return null
      return {
        ...prev,
        [platform === 'linkedin' ? 'linkedinContent' : 'twitterContent']: newContent,
      }
    })

    // Save to database
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

      const response = await fetch(`/api/drafts/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        console.error('Failed to save edited content')
        toast.error('Failed to save changes')
      } else {
        toast.success('Changes saved')
      }
    } catch (error) {
      console.error('Error saving edited content:', error)
      toast.error('Failed to save changes')
    }
  }

  const handleSchedule = async (platform: 'linkedin' | 'twitter', content: string | string[], scheduledAt: Date) => {
    try {
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
            draftId: id,
            platform,
            content: content[0], // Summary post
            status: 'scheduled',
            scheduledAt: scheduledAt.toISOString(),
          }),
        })

        if (!summaryResponse.ok) {
          const errorData = await summaryResponse.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(errorData.error || 'Failed to schedule summary post')
        }

        const summaryPost = await summaryResponse.json()
        const summaryPostId = summaryPost.id

        // Step 2: Schedule the replies (index > 0) as replies to the summary post
        if (content.length > 1) {
          const replyPromises = content.slice(1).map((tweet) =>
            fetch('/api/posts', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                draftId: id,
                platform,
                content: tweet,
                status: 'scheduled',
                scheduledAt: scheduledAt.toISOString(),
                parentPostId: summaryPostId, // Link to summary post
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
            draftId: id,
            platform,
            content,
            status: 'scheduled',
            scheduledAt: scheduledAt.toISOString(),
          }),
        })

        if (!postResponse.ok) {
          const errorData = await postResponse.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(errorData.error || 'Failed to schedule post')
        }
      }

      // Refresh the draft data
      const draftResponse = await fetch(`/api/drafts/${id}`)
      if (draftResponse.ok) {
        const updatedDraft = await draftResponse.json()
        
        // Parse twitterContent if it's a JSON string
        if (updatedDraft.twitterContent && typeof updatedDraft.twitterContent === 'string') {
          try {
            const parsed = JSON.parse(updatedDraft.twitterContent)
            if (Array.isArray(parsed)) {
              updatedDraft.twitterContent = parsed
            }
          } catch {
            // Keep as string if not valid JSON
          }
        }
        
        setPost(updatedDraft)
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
      // Check if already published (only check summary posts, not replies)
      const isPublished = post?.posts?.some(p => p.platform === platform && p.status === 'published' && !p.parentPostId)
      if (isPublished) {
        toast.error(`Already published to ${platform}`)
        return
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
          draftId: id,
          imageUrl: post?.attachedImage || undefined,
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
              draftId: id,
              platform,
              content: content[0], // Summary post
              status: 'published',
            }),
          })

          if (!summaryResponse.ok) {
            const errorData = await summaryResponse.json().catch(() => ({ error: 'Unknown error' }))
            if (errorData.error?.includes('already published')) {
              toast.error(errorData.error)
            } else {
              throw new Error(errorData.error || 'Failed to save summary post')
            }
            return
          }

          const summaryPost = await summaryResponse.json()
          const summaryPostId = summaryPost.id

          // Step 2: Publish the replies (index > 0) as replies to the summary post
          if (content.length > 1) {
            const replyPromises = content.slice(1).map((tweet) =>
              fetch('/api/posts', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  draftId: id,
                  platform,
                  content: tweet,
                  status: 'published',
                  parentPostId: summaryPostId, // Link to summary post
                }),
              })
            )

            const replyResponses = await Promise.all(replyPromises)
            const failedReply = replyResponses.find(r => !r.ok)

            if (failedReply) {
              const errorData = await failedReply.json().catch(() => ({ error: 'Unknown error' }))
              throw new Error(errorData.error || 'Failed to save thread replies')
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
              draftId: id,
              platform,
              content,
              status: 'published',
            }),
          })

          if (!postResponse.ok) {
            const errorData = await postResponse.json().catch(() => ({ error: 'Unknown error' }))
            if (errorData.error?.includes('already published')) {
              toast.error(errorData.error)
            } else {
              throw new Error(errorData.error || 'Failed to save post')
            }
            return
          }
        }

        // Refresh the draft data
        const draftResponse = await fetch(`/api/drafts/${id}`)
        if (draftResponse.ok) {
          const updatedDraft = await draftResponse.json()
          
          // Parse twitterContent if it's a JSON string
          if (updatedDraft.twitterContent && typeof updatedDraft.twitterContent === 'string') {
            try {
              const parsed = JSON.parse(updatedDraft.twitterContent)
              if (Array.isArray(parsed)) {
                updatedDraft.twitterContent = parsed
              }
            } catch {
              // Keep as string if not valid JSON
            }
          }
          
          setPost(updatedDraft)
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

  const isPlatformPublished = (platform: 'linkedin' | 'twitter') => {
    // Only check summary posts (not replies)
    return post?.posts?.some(p => p.platform === platform && p.status === 'published' && !p.parentPostId) || false
  }

  const isPlatformScheduled = (platform: 'linkedin' | 'twitter') => {
    // Only check summary posts (not replies)
    return post?.posts?.some(p => p.platform === platform && p.status === 'scheduled' && !p.parentPostId) || false
  }

  const getPublishedDate = (platform: 'linkedin' | 'twitter') => {
    // Only get summary posts (not replies)
    const publishedPost = post?.posts?.find(p => p.platform === platform && p.status === 'published' && !p.parentPostId)
    return publishedPost?.publishedAt ? new Date(publishedPost.publishedAt) : null
  }

  const getScheduledDate = (platform: 'linkedin' | 'twitter') => {
    // Only get summary posts (not replies)
    const scheduledPost = post?.posts?.find(p => p.platform === platform && p.status === 'scheduled' && !p.parentPostId)
    return scheduledPost?.scheduledAt ? new Date(scheduledPost.scheduledAt) : null
  }

  const getScheduledPostId = (platform: 'linkedin' | 'twitter') => {
    // Only get summary posts (not replies)
    const scheduledPost = post?.posts?.find(p => p.platform === platform && p.status === 'scheduled' && !p.parentPostId)
    return scheduledPost?.id || null
  }

  const handleReschedule = async (postId: string, scheduledAt: Date) => {
    try {
      const postResponse = await fetch(`/api/posts/${postId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scheduledAt: scheduledAt.toISOString(),
        }),
      })

      if (!postResponse.ok) {
        const errorData = await postResponse.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Failed to reschedule post')
      }

      // Refresh the draft data
      const draftResponse = await fetch(`/api/drafts/${id}`)
      if (draftResponse.ok) {
        const updatedDraft = await draftResponse.json()
        setPost(updatedDraft)
      }

      toast.success('Post rescheduled successfully!', {
        description: `Your post is now scheduled for ${scheduledAt.toLocaleDateString()}`,
      })
    } catch (error) {
      console.error('Error rescheduling:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to reschedule post'
      toast.error(errorMessage)
      throw error
    }
  }

  const handleRegenerate = async (platform: 'linkedin' | 'twitter') => {
    if (!post || !post.contentRaw) {
      toast.error('Cannot regenerate: missing original idea')
      return
    }

    setIsRegenerating(prev => ({ ...prev, [platform]: true }))

    try {
      // Determine if current content is a thread (for Twitter)
      let twitterFormat: 'single' | 'thread' | undefined = undefined
      if (platform === 'twitter') {
        const currentContent = post.twitterContent
        const isThread = Array.isArray(currentContent) || 
          (typeof currentContent === 'string' && currentContent.trim().startsWith('['))
        twitterFormat = isThread ? 'thread' : 'single'
      }

      // Regenerate content using the original idea and template
      // Skip template for threads
      const templateId = (platform === 'twitter' && twitterFormat === 'thread') 
        ? undefined 
        : (post.templateId || undefined)
      
      const result = await generateContent(
        post.contentRaw,
        platform,
        templateId,
        twitterFormat
      )

      const newContent = platform === 'linkedin' ? result.linkedin : result.twitter

      if (!newContent) {
        throw new Error('Failed to generate new content')
      }

      // Update the draft with new content
      const updateData: Record<string, string> = {}
      if (platform === 'linkedin') {
        updateData.linkedinContent = newContent as string
      } else {
        // Stringify if array, otherwise use as string
        updateData.twitterContent = Array.isArray(newContent) 
          ? JSON.stringify(newContent) 
          : (newContent as string)
      }

      const response = await fetch(`/api/drafts/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        throw new Error('Failed to save regenerated content')
      }

      // Refresh the draft data
      const draftResponse = await fetch(`/api/drafts/${id}`)
      if (draftResponse.ok) {
        const updatedDraft = await draftResponse.json()
        setPost(updatedDraft)
      }

      toast.success(`${platform === 'linkedin' ? 'LinkedIn' : 'Twitter'} post regenerated!`, {
        description: 'Review the new version and decide which one you prefer',
      })
    } catch (error) {
      console.error('Error regenerating:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to regenerate post'
      toast.error(errorMessage)
    } finally {
      setIsRegenerating(prev => ({ ...prev, [platform]: false }))
    }
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = async () => {
        const imageDataUrl = reader.result as string
        
        // Store previous image value for error recovery
        const previousImage = post?.attachedImage || null
        
        // Update local state immediately
        setPost((prev) => {
          if (!prev) return null
          return {
            ...prev,
            attachedImage: imageDataUrl,
          }
        })

        // Save to database
        try {
          const response = await fetch(`/api/drafts/${id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              attachedImage: imageDataUrl,
            }),
          })

          if (!response.ok) {
            throw new Error('Failed to save image')
          }

          toast.success('Image attached successfully!')
        } catch (error) {
          console.error('Error saving image:', error)
          toast.error('Failed to save image')
          // Revert local state on error
          setPost((prev) => {
            if (!prev) return null
            return {
              ...prev,
              attachedImage: previousImage,
            }
          })
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = async () => {
    // Store previous image value for error recovery
    const previousImage = post?.attachedImage || null
    
    // Update local state immediately
    setPost((prev) => {
      if (!prev) return null
      return {
        ...prev,
        attachedImage: null,
      }
    })

    // Save to database
    try {
      const response = await fetch(`/api/drafts/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attachedImage: null,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to remove image')
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      toast.success('Image removed successfully!')
    } catch (error) {
      console.error('Error removing image:', error)
      toast.error('Failed to remove image')
      // Revert local state on error
      setPost((prev) => {
        if (!prev) return null
        return {
          ...prev,
          attachedImage: previousImage,
        }
      })
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Loading draft...</p>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h1 className="text-2xl font-bold text-foreground mb-2">Post not found</h1>
        <p className="text-muted-foreground mb-6">The post you're looking for doesn't exist.</p>
        <Link href="/posts">
          <Button variant="outline">Back to Posts</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Back Button */}
      <Link
        href="/posts"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Posts
      </Link>

      {/* Post Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">{post.title}</h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="uppercase font-medium">{post.platforms}</span>
              <span>•</span>
              <span>{new Date(post.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}</span>
              <span>•</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  post.status === 'published'
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {post.status}
              </span>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="text-destructive hover:text-destructive"
            onClick={handleDelete}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>

        {/* Original Idea */}
        <div className="rounded-lg border border-border bg-card p-6 mb-6">
          <h3 className="text-sm font-semibold text-card-foreground mb-2">Original Idea</h3>
          <p className="text-muted-foreground mb-4">{post.contentRaw}</p>
          
          {/* Image Upload Section */}
          <div className="mt-4 pt-4 border-t border-border">
            <h4 className="text-sm font-semibold text-card-foreground mb-3">Attached Image</h4>
            {post.attachedImage ? (
              <div className="relative inline-block">
                <img
                  src={post.attachedImage}
                  alt="Attached to post"
                  className="rounded-lg max-h-48 w-auto object-cover border border-border"
                />
                <button
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 p-1 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2"
                >
                  <ImageIcon className="w-4 h-4" />
                  Add Image
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <p className="text-xs text-muted-foreground">
                  Add an image to your post
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Generated Content Preview */}
      <div className="grid gap-6 md:grid-cols-2">
        {post.linkedinContent && (
          <PlatformPreview
            platform="linkedin"
            content={post.linkedinContent}
            userName={userName}
            userInitials={userInitials}
            image={post.attachedImage || undefined}
            onRegenerate={() => handleRegenerate('linkedin')}
            onPublish={(editedContent) => handlePublish('linkedin', editedContent)}
            onSchedule={(editedContent, scheduledAt) => handleSchedule('linkedin', editedContent, scheduledAt)}
            onReschedule={(postId, scheduledAt) => handleReschedule(postId, scheduledAt)}
            onContentChange={handleContentChange}
            isPublished={isPlatformPublished('linkedin')}
            publishedDate={getPublishedDate('linkedin')}
            isScheduled={isPlatformScheduled('linkedin')}
            scheduledDate={getScheduledDate('linkedin')}
            scheduledPostId={getScheduledPostId('linkedin')}
            isRegenerating={isRegenerating.linkedin}
          />
        )}
        {post.twitterContent && (
          <PlatformPreview
            platform="twitter"
            content={post.twitterContent}
            userName={userName}
            userInitials={userInitials}
            image={post.attachedImage || undefined}
            onRegenerate={() => handleRegenerate('twitter')}
            onPublish={(editedContent) => handlePublish('twitter', editedContent)}
            onSchedule={(editedContent, scheduledAt) => handleSchedule('twitter', editedContent, scheduledAt)}
            onReschedule={(postId, scheduledAt) => handleReschedule(postId, scheduledAt)}
            onContentChange={handleContentChange}
            isPublished={isPlatformPublished('twitter')}
            publishedDate={getPublishedDate('twitter')}
            isScheduled={isPlatformScheduled('twitter')}
            scheduledDate={getScheduledDate('twitter')}
            scheduledPostId={getScheduledPostId('twitter')}
            isRegenerating={isRegenerating.twitter}
          />
        )}
      </div>
    </div>
  )
}

