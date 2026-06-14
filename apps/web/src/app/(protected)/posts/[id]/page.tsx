'use client'

import { use } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePostEditor } from '@/features/post-editor/usePostEditor'
import { PostHeader } from '@/features/post-editor/sections/PostHeader'
import { PlatformPreviewGrid } from '@/features/post-editor/sections/PlatformPreviewGrid'

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const editor = usePostEditor(id)

  if (editor.isLoading) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Loading draft...</p>
      </div>
    )
  }

  if (!editor.post) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h1 className="text-2xl font-bold text-foreground mb-2">Post not found</h1>
        <p className="text-muted-foreground mb-6">The post you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/posts">
          <Button variant="outline">Back to Posts</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <PostHeader editor={editor} />

      {/* Generated Content Preview */}
      <PlatformPreviewGrid editor={editor} />
    </div>
  )
}
