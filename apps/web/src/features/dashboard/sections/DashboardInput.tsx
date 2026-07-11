import { IdeaCapture } from '@/components/IdeaCapture'
import { NewArticleForm } from '@/components/article/NewArticleForm'
import { toast } from 'sonner'
import type { DashboardView } from '../useDashboard'

export function DashboardInput({ dashboard }: { dashboard: DashboardView }) {
  const {
    activeTab,
    prefillIdea,
    postType,
    setPostType,
    setMediaUrls,
    setVideoUrl,
    mediaUrls,
    setAttachedImage,
    setCarouselSlidePlans,
    setCarouselJobId,
    handleGenerate,
    currentDraftId,
    postQuota,
  } = dashboard

  return (
    <>
      {/* ── Capture an Article Idea (saves an idea; no instant generation) ─ */}
      {activeTab === 'workflow' && (
        <div className="mb-8 bg-card rounded-2xl border border-border p-6">
          <NewArticleForm
            mode="article_first"
            allowSocialToggle
            variant="inline"
            captureAsIdea
            onCreated={() => { /* capture mode: no navigation */ }}
          />
        </div>
      )}

      {/* Idea Capture Widget */}
      {activeTab === 'social' && (
      <div className="mb-8">
        {postQuota && !postQuota.exempt && (
          <p className="mb-2 text-xs text-muted-foreground text-right">
            {postQuota.remaining > 0
              ? `${postQuota.remaining} of ${postQuota.cap} extra posts left this week`
              : `Weekly limit of ${postQuota.cap} extra posts reached`}
          </p>
        )}
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
            setCarouselSlidePlans(assets.slidePlans ?? [])
            setCarouselJobId(assets.carouselJobId)
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
