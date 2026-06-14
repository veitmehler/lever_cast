'use client'

import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScheduleModal } from '@/components/ScheduleModal'
import { usePostsList } from '@/features/posts-list/usePostsList'
import { BulkActionsBar } from '@/features/posts-list/sections/BulkActionsBar'
import { FilterTabs } from '@/features/posts-list/sections/FilterTabs'
import { DraftsGrid } from '@/features/posts-list/sections/DraftsGrid'

export default function PostsPage() {
  const posts = usePostsList()

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
        <Link href="/dashboard">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            New Post
          </Button>
        </Link>
      </div>

      {/* Bulk Actions Bar - Only show in Drafts tab when items are selected */}
      <BulkActionsBar posts={posts} />

      {/* Filter Tabs */}
      <FilterTabs posts={posts} />

      {/* Posts Grid (loading / select-all / grid / empty states) */}
      <DraftsGrid posts={posts} />

      {/* Bulk Schedule Modal */}
      {posts.showBulkScheduleModal && (
        <ScheduleModal
          isOpen={posts.showBulkScheduleModal}
          onClose={() => posts.setShowBulkScheduleModal(false)}
          onSchedule={posts.handleBulkSchedule}
          platform="linkedin" // Default platform, but handleBulkSchedule handles all platforms
          content={`Scheduling ${posts.selectedDrafts.size} draft(s)`}
        />
      )}
    </div>
  )
}
