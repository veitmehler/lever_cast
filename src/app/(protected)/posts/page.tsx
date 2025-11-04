'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FileText, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getDrafts, type Draft } from '@/lib/draftStorage'

type FilterStatus = 'all' | 'published' | 'draft'

export default function PostsPage() {
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [drafts, setDrafts] = useState<Draft[]>([])

  // Load drafts from localStorage
  useEffect(() => {
    setDrafts(getDrafts())
  }, [])

  const filteredPosts = drafts.filter(draft => {
    if (filter === 'all') return true
    return draft.status === filter
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
          All ({drafts.length})
        </button>
        <button
          onClick={() => setFilter('draft')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            filter === 'draft'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Drafts ({drafts.filter(d => d.status === 'draft').length})
        </button>
        <button
          onClick={() => setFilter('published')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            filter === 'published'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Published ({drafts.filter(d => d.status === 'published').length})
        </button>
      </div>

      {/* Posts Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {filteredPosts.map((draft) => (
          <Link
            key={draft.id}
            href={`/posts/${draft.id}`}
            className="block rounded-lg border border-border bg-card p-6 hover:border-primary/50 transition-colors group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <span className="text-xs font-medium text-muted-foreground uppercase">
                  {draft.platform}
                </span>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  draft.status === 'published'
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {draft.status}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-card-foreground mb-2 group-hover:text-primary transition-colors">
              {draft.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {draft.rawIdea}
            </p>
            <p className="text-xs text-muted-foreground">
              {new Date(draft.createdAt).toLocaleDateString('en-US', {
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
          <p className="text-muted-foreground mb-4">
            {filter === 'all' 
              ? 'Start creating your first post on the Dashboard!'
              : `No ${filter} posts yet.`
            }
          </p>
          {filter === 'all' && (
            <Link href="/dashboard">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Create Post
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

