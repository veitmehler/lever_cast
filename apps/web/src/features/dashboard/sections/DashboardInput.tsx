'use client'

import { IdeaCapture } from '@/components/IdeaCapture'
import { NewArticleForm } from '@/components/article/NewArticleForm'
import { toast } from 'sonner'
import type { DashboardView } from '../useDashboard'

export function DashboardInput({ dashboard }: { dashboard: DashboardView }) {
  const {
    router,
    dashMode,
    prefillIdea,
    postType,
    setPostType,
    mediaUrls,
    setMediaUrls,
    setVideoUrl,
    setAttachedImage,
    currentDraftId,
    handleGenerate,
  } = dashboard

  return (
    <>
      {/* ── Article creation form (article modes) ───────────────────────── */}
      {dashMode !== 'social_only' && (
        <div className="mb-8 bg-card rounded-2xl border border-border p-6">
          <NewArticleForm
            mode={dashMode === 'article_first' ? 'article_first' : 'article_only'}
            variant="inline"
            onCreated={(jobId) => router.push(`/workflow/${jobId}`)}
          />
        </div>
      )}

      {/* Idea Capture Widget */}
      {dashMode === 'social_only' && (
      <div className="mb-8">
        <IdeaCapture
          initialIdea={prefillIdea ?? undefined}
          postType={postType}
          onPostTypeChange={(type) => {
            setPostType(type)
            if (type === 'standard') {
              setMediaUrls([])
              setVideoUrl(undefined)
            }
          }}
          carouselImages={mediaUrls}
          onMediaAssetsReady={(assets) => {
            setPostType(assets.postType)
            if (assets.imageUrl) setAttachedImage(assets.imageUrl)
            if (assets.mediaUrls) setMediaUrls(assets.mediaUrls)
            if (assets.videoUrl) setVideoUrl(assets.videoUrl)
          }}
          onGenerate={handleGenerate}
          onImageAttached={async (imageUrl: string) => {
            // Update local state immediately for preview
            setAttachedImage(imageUrl)

            // If draft exists, update it with the image
            if (currentDraftId) {
              try {
                const response = await fetch(`/api/drafts/${currentDraftId}`, {
                  method: 'PATCH',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    attachedImage: imageUrl,
                  }),
                })

                if (response.ok) {
                  toast.success('Image attached to draft!', { duration: 2000 })
                } else {
                  console.error('Failed to update draft with image')
                }
              } catch (error) {
                console.error('Error updating draft with image:', error)
              }
            } else {
              // If no draft exists yet, the image will be saved when draft is created
              toast.info('Image will be attached when you save or publish', { duration: 2000 })
            }
          }}
        />
      </div>
      )}
    </>
  )
}
