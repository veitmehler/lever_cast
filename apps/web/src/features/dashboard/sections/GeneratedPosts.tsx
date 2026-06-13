'use client'

import { Loader2, Save, Send, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PlatformPreview } from '@/components/PlatformPreview'
import { ScheduleModal } from '@/components/ScheduleModal'
import type { DashboardView } from '../useDashboard'

export function GeneratedPosts({ dashboard }: { dashboard: DashboardView }) {
  const {
    isGenerating,
    generatedContent,
    selectedPlatform,
    currentDraftId,
    attachedImage,
    mediaUrls,
    videoUrl,
    postType,
    isBulkPublishing,
    isBulkScheduling,
    showBulkScheduleModal,
    setShowBulkScheduleModal,
    userName,
    userInitials,
    handleSaveDraft,
    handleRegenerate,
    handleContentChange,
    handleSchedule,
    handlePublish,
    handleBulkPublishAll,
    handleBulkScheduleAll,
  } = dashboard

  return (
    <>
      {/* Loading State */}
      {isGenerating && (
        <div className="mb-8 rounded-lg border border-border bg-card p-12 text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <h3 className="text-xl font-semibold text-card-foreground mb-2">
            Generating Your Posts...
          </h3>
          <p className="text-muted-foreground">
            AI is crafting optimized content for your selected platforms
          </p>
        </div>
      )}

      {/* Generated Content Preview */}
      {!isGenerating && generatedContent && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-foreground">Your Generated Posts</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setShowBulkScheduleModal(true)}
                disabled={isBulkScheduling}
              >
                {isBulkScheduling ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule All
                  </>
                )}
              </Button>
              <Button
                variant="default"
                onClick={handleBulkPublishAll}
                disabled={isBulkPublishing}
              >
                {isBulkPublishing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Publish All Now
                  </>
                )}
              </Button>
              <Button
                onClick={handleSaveDraft}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Save className="w-4 h-4 mr-2" />
                {currentDraftId ? 'Update Draft' : 'Save to Drafts'}
              </Button>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {generatedContent.linkedin && (
              <PlatformPreview
                platform="linkedin"
                content={generatedContent.linkedin}
                image={attachedImage}
                images={postType === 'carousel' ? mediaUrls : undefined}
                video={videoUrl}
                userName={userName}
                userInitials={userInitials}
                onRegenerate={() => handleRegenerate('linkedin')}
                onPublish={(editedContent) => handlePublish('linkedin', editedContent)}
                onSchedule={(editedContent, scheduledAt) => handleSchedule('linkedin', editedContent, scheduledAt)}
                onContentChange={handleContentChange}
                isRegenerating={isGenerating}
              />
            )}
            {generatedContent.facebook && (
              <PlatformPreview
                platform="facebook"
                content={generatedContent.facebook}
                image={attachedImage}
                images={postType === 'carousel' ? mediaUrls : undefined}
                video={videoUrl}
                userName={userName}
                userInitials={userInitials}
                onRegenerate={() => handleRegenerate('facebook')}
                onPublish={(editedContent) => handlePublish('facebook', editedContent)}
                onSchedule={(editedContent, scheduledAt) => handleSchedule('facebook', editedContent, scheduledAt)}
                onContentChange={handleContentChange}
                isRegenerating={isGenerating}
              />
            )}
            {generatedContent.instagram && (
              <PlatformPreview
                platform="instagram"
                content={generatedContent.instagram}
                image={attachedImage}
                images={postType === 'carousel' ? mediaUrls : undefined}
                video={videoUrl}
                userName={userName}
                userInitials={userInitials}
                onRegenerate={() => handleRegenerate('instagram')}
                onPublish={(editedContent) => handlePublish('instagram', editedContent)}
                onSchedule={(editedContent, scheduledAt) => handleSchedule('instagram', editedContent, scheduledAt)}
                onContentChange={handleContentChange}
                isRegenerating={isGenerating}
              />
            )}
            {generatedContent.telegram && (
              <PlatformPreview
                platform="telegram"
                content={generatedContent.telegram}
                image={attachedImage}
                images={postType === 'carousel' ? mediaUrls : undefined}
                video={videoUrl}
                userName={userName}
                userInitials={userInitials}
                onRegenerate={() => handleRegenerate('telegram')}
                onPublish={(editedContent) => handlePublish('telegram', editedContent)}
                onSchedule={(editedContent, scheduledAt) => handleSchedule('telegram', editedContent, scheduledAt)}
                onContentChange={handleContentChange}
                isRegenerating={isGenerating}
              />
            )}
            {generatedContent.threads && (
              <PlatformPreview
                platform="threads"
                content={generatedContent.threads}
                image={attachedImage}
                images={postType === 'carousel' ? mediaUrls : undefined}
                video={videoUrl}
                userName={userName}
                userInitials={userInitials}
                onRegenerate={() => handleRegenerate('threads')}
                onPublish={(editedContent) => handlePublish('threads', editedContent)}
                onSchedule={(editedContent, scheduledAt) => handleSchedule('threads', editedContent, scheduledAt)}
                onContentChange={handleContentChange}
                isRegenerating={isGenerating}
              />
            )}
            {generatedContent.twitter && (
              <PlatformPreview
                platform="twitter"
                content={generatedContent.twitter}
                image={attachedImage}
                images={postType === 'carousel' ? mediaUrls : undefined}
                video={videoUrl}
                userName={userName}
                userInitials={userInitials}
                onRegenerate={() => handleRegenerate('twitter')}
                onPublish={(editedContent) => handlePublish('twitter', editedContent)}
                onSchedule={(editedContent, scheduledAt) => handleSchedule('twitter', editedContent, scheduledAt)}
                onContentChange={handleContentChange}
                isRegenerating={isGenerating}
              />
            )}
          </div>

          {/* Bulk Schedule Modal */}
          {showBulkScheduleModal && (
            <ScheduleModal
              isOpen={showBulkScheduleModal}
              onClose={() => setShowBulkScheduleModal(false)}
              onSchedule={handleBulkScheduleAll}
              platform={selectedPlatform === 'all' ? 'linkedin' : selectedPlatform}
              content={
                selectedPlatform === 'all'
                  ? `${generatedContent.linkedin || ''}\n\n${Array.isArray(generatedContent.twitter) ? generatedContent.twitter.join('\n\n') : generatedContent.twitter || ''}`
                  : selectedPlatform === 'linkedin'
                    ? generatedContent.linkedin || ''
                    : Array.isArray(generatedContent.twitter) ? generatedContent.twitter.join('\n\n') : generatedContent.twitter || ''
              }
            />
          )}
        </div>
      )}
    </>
  )
}
