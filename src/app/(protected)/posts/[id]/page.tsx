'use client'

import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft, Edit, Trash2, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Mock data
const mockPostData: Record<string, any> = {
  '1': {
    id: '1',
    title: 'How to build a successful startup',
    platform: 'LinkedIn',
    status: 'published',
    createdAt: '2024-11-01',
    publishedAt: '2024-11-01T10:30:00',
    content: `Building a successful startup requires more than just a great idea. Here are the key lessons I've learned:

1. Focus on solving a real problem
2. Build in public and gather feedback early
3. Iterate quickly based on user input
4. Don't try to do everything at once
5. Surround yourself with the right people

The journey is challenging, but incredibly rewarding. What's the most important lesson you've learned in your entrepreneurial journey?

#Startup #Entrepreneurship #BusinessTips`,
    postUrl: 'https://linkedin.com/posts/example/1'
  },
  '2': {
    id: '2',
    title: 'AI is transforming content creation',
    platform: 'Twitter',
    status: 'draft',
    createdAt: '2024-11-02',
    content: `The future of content creation is here. AI tools are making it easier than ever to:

• Transform ideas into polished posts
• Adapt content for multiple platforms
• Maintain consistency in your voice
• Save hours of manual work

But remember: AI is a tool to enhance creativity, not replace it. The best content still comes from authentic human experiences.

What's your take on AI in content creation?`,
  },
}

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const post = mockPostData[id]

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
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <Link
        href="/posts"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Posts
      </Link>

      {/* Post Header */}
      <div className="mb-6">
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
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            {post.status === 'published' && (
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            )}
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Post Content */}
      <div className="rounded-lg border border-border bg-card p-8">
        <div className="prose prose-invert max-w-none">
          <pre className="whitespace-pre-wrap font-sans text-card-foreground leading-relaxed">
            {post.content}
          </pre>
        </div>
      </div>

      {/* Published Info */}
      {post.status === 'published' && post.postUrl && (
        <div className="mt-6 rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-card-foreground">Published to {post.platform}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(post.publishedAt).toLocaleString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <a
              href={post.postUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              View on {post.platform} →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

