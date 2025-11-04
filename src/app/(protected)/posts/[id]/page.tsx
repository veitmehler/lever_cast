'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Trash2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getDraft, deleteDraft, markAsPublished } from '@/lib/draftStorage'
import { PlatformPreview } from '@/components/PlatformPreview'
import { publishToPlatform } from '@/lib/mockAI'
import { toast } from 'sonner'

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const { id } = use(params)
  const [post, setPost] = useState(getDraft(id))

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this draft?')) {
      const success = deleteDraft(id)
      if (success) {
        toast.success('Draft deleted successfully')
        router.push('/posts')
      } else {
        toast.error('Failed to delete draft')
      }
    }
  }

  const handlePublish = async (platform: 'linkedin' | 'twitter', content: string) => {
    try {
      const result = await publishToPlatform(platform, content)
      if (result.success) {
        markAsPublished(id)
        setPost(getDraft(id))
        toast.success(result.message, {
          description: `Your ${platform} post is now live!`,
        })
      }
    } catch (error) {
      console.error('Error publishing:', error)
      toast.error('Failed to publish post')
    }
  }

  const handleRegenerate = () => {
    toast.info('Regeneration coming soon', {
      description: 'Return to dashboard to generate new versions',
    })
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
              <span className="uppercase font-medium">{post.platform}</span>
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
          <p className="text-muted-foreground">{post.rawIdea}</p>
        </div>
      </div>

      {/* Generated Content Preview */}
      <div className="grid gap-6 md:grid-cols-2">
        {post.linkedinContent && (
          <PlatformPreview
            platform="linkedin"
            content={post.linkedinContent}
            onRegenerate={handleRegenerate}
            onPublish={() => handlePublish('linkedin', post.linkedinContent!)}
          />
        )}
        {post.twitterContent && (
          <PlatformPreview
            platform="twitter"
            content={post.twitterContent}
            onRegenerate={handleRegenerate}
            onPublish={() => handlePublish('twitter', post.twitterContent!)}
          />
        )}
      </div>
    </div>
  )
}

