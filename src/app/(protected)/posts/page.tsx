'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FileText, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Mock data for prototype
const mockPosts = [
  {
    id: '1',
    title: 'How to build a successful startup',
    platform: 'LinkedIn',
    status: 'published',
    createdAt: '2024-11-01',
    preview: 'Building a successful startup requires more than just a great idea...'
  },
  {
    id: '2',
    title: 'AI is transforming content creation',
    platform: 'Twitter',
    status: 'draft',
    createdAt: '2024-11-02',
    preview: 'The future of content creation is here. AI tools are making it easier...'
  },
  {
    id: '3',
    title: 'The power of personal branding',
    platform: 'LinkedIn',
    status: 'published',
    createdAt: '2024-11-03',
    preview: 'Your personal brand is your most valuable asset in the digital age...'
  },
  {
    id: '4',
    title: 'Quick tips for entrepreneurs',
    platform: 'Twitter',
    status: 'draft',
    createdAt: '2024-11-04',
    preview: '5 things I wish I knew before starting my first company...'
  },
]

type FilterStatus = 'all' | 'published' | 'draft'

export default function PostsPage() {
  const [filter, setFilter] = useState<FilterStatus>('all')

  const filteredPosts = mockPosts.filter(post => {
    if (filter === 'all') return true
    return post.status === filter
  })

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Posts</h1>
          <p className="text-muted-foreground">
            Manage your drafts and published content
          </p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          New Post
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            filter === 'all'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          All ({mockPosts.length})
        </button>
        <button
          onClick={() => setFilter('draft')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            filter === 'draft'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Drafts ({mockPosts.filter(p => p.status === 'draft').length})
        </button>
        <button
          onClick={() => setFilter('published')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            filter === 'published'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Published ({mockPosts.filter(p => p.status === 'published').length})
        </button>
      </div>

      {/* Posts Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {filteredPosts.map((post) => (
          <Link
            key={post.id}
            href={`/posts/${post.id}`}
            className="block rounded-lg border border-border bg-card p-6 hover:border-primary/50 transition-colors group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <span className="text-xs font-medium text-muted-foreground uppercase">
                  {post.platform}
                </span>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  post.status === 'published'
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {post.status}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-card-foreground mb-2 group-hover:text-primary transition-colors">
              {post.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {post.preview}
            </p>
            <p className="text-xs text-muted-foreground">
              {new Date(post.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          </Link>
        ))}
      </div>

      {filteredPosts.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No posts found</h3>
          <p className="text-muted-foreground">
            {filter === 'all' 
              ? 'Start creating your first post!'
              : `No ${filter} posts yet.`
            }
          </p>
        </div>
      )}
    </div>
  )
}

