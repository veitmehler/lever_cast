'use client'

import { use, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { ArrowLeft, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PlatformPreview } from '@/components/PlatformPreview'
import { publishToPlatform } from '@/lib/mockAI'
import { toast } from 'sonner'

// Draft type matching database schema
type Draft = {
  id: string
  userId: string
  title: string
  contentRaw: string
  linkedinContent: string | null
  twitterContent: string | null
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
    publishedAt: Date
    postUrl: string | null
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

  const handleContentChange = async (platform: 'linkedin' | 'twitter', newContent: string) => {
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
        updateData.linkedinContent = newContent
      } else {
        updateData.twitterContent = newContent
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

  const handlePublish = async (platform: 'linkedin' | 'twitter', content: string) => {
    try {
      // Check if already published
      const isPublished = post?.posts?.some(p => p.platform === platform)
      if (isPublished) {
        toast.error(`Already published to ${platform}`)
        return
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

        // Refresh the draft data
        const draftResponse = await fetch(`/api/drafts/${id}`)
        if (draftResponse.ok) {
          const updatedDraft = await draftResponse.json()
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
    return post?.posts?.some(p => p.platform === platform) || false
  }

  const getPublishedDate = (platform: 'linkedin' | 'twitter') => {
    const publishedPost = post?.posts?.find(p => p.platform === platform)
    return publishedPost ? new Date(publishedPost.publishedAt) : null
  }

  const handleRegenerate = () => {
    toast.info('Regeneration coming soon', {
      description: 'Return to dashboard to generate new versions',
    })
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
          <p className="text-muted-foreground">{post.contentRaw}</p>
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
            onRegenerate={handleRegenerate}
            onPublish={(editedContent) => handlePublish('linkedin', editedContent)}
            onContentChange={handleContentChange}
            isPublished={isPlatformPublished('linkedin')}
            publishedDate={getPublishedDate('linkedin')}
          />
        )}
        {post.twitterContent && (
          <PlatformPreview
            platform="twitter"
            content={post.twitterContent}
            userName={userName}
            userInitials={userInitials}
            image={post.attachedImage || undefined}
            onRegenerate={handleRegenerate}
            onPublish={(editedContent) => handlePublish('twitter', editedContent)}
            onContentChange={handleContentChange}
            isPublished={isPlatformPublished('twitter')}
            publishedDate={getPublishedDate('twitter')}
          />
        )}
      </div>
    </div>
  )
}

